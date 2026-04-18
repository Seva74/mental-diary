from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from .text_features import build_feature_snapshot, build_text_blob


ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "data" / "training_samples.jsonl"
MODEL_DIR = ROOT / "data" / "artifacts"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
REGISTRY_PATH = MODEL_DIR / "current_model.json"


@dataclass
class ModelRegistry:
    provider: str
    version: str
    backend: str
    trainedAt: str
    sampleCount: int
    labels: list[str]
    artifactPath: str


class MentalStatePipeline:
    labels = ["stable", "fatigued", "stressed", "burnout-risk", "recovery"]

    def __init__(self) -> None:
        self.pipeline: Pipeline | None = None
        self.backend = os.getenv("ML_MODEL_BACKEND", "linear-tfidf").strip().lower()
        self.model_version = os.getenv("ML_MODEL_VERSION", "2026.04.18")
        self.transformer_name = os.getenv("ML_TRANSFORMER_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        self._ensure_loaded()

    def _artifact_path(self, backend: str) -> Path:
        return MODEL_DIR / f"{backend}-{self.model_version}.joblib"

    def _load_samples(self) -> list[dict[str, str]]:
        with DATASET_PATH.open("r", encoding="utf-8") as handle:
            return [json.loads(line) for line in handle if line.strip()]

    def _build_linear_pipeline(self) -> Pipeline:
        return Pipeline(
            steps=[
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
                ("clf", LogisticRegression(max_iter=2000, class_weight="balanced")),
            ]
        )

    def _build_transformer_pipeline(self) -> Pipeline:
        from sentence_transformers import SentenceTransformer

        class SentenceEmbeddingVectorizer:
            def __init__(self, model_name: str) -> None:
                self.model_name = model_name
                self.model: SentenceTransformer | None = None

            def fit(self, texts: list[str], y: list[str] | None = None) -> "SentenceEmbeddingVectorizer":
                self.model = SentenceTransformer(self.model_name)
                return self

            def transform(self, texts: list[str]) -> np.ndarray:
                if self.model is None:
                    self.model = SentenceTransformer(self.model_name)
                return np.asarray(self.model.encode(list(texts), normalize_embeddings=True))

        return Pipeline(
            steps=[
                ("embed", SentenceEmbeddingVectorizer(self.transformer_name)),
                ("clf", LogisticRegression(max_iter=2500, class_weight="balanced")),
            ]
        )

    def _load_registry(self) -> ModelRegistry | None:
        if not REGISTRY_PATH.exists():
            return None
        payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
        return ModelRegistry(**payload)

    def _save_registry(self, registry: ModelRegistry) -> None:
        REGISTRY_PATH.write_text(json.dumps(asdict(registry), ensure_ascii=False, indent=2), encoding="utf-8")

    def _ensure_loaded(self) -> None:
        registry = self._load_registry()

        if registry and Path(registry.artifactPath).exists():
            self.backend = registry.backend
            self.model_version = registry.version
            self.pipeline = joblib.load(registry.artifactPath)
            return

        self.train(self.backend)

    def train(self, backend: str | None = None) -> dict[str, Any]:
        target_backend = (backend or self.backend or "linear-tfidf").strip().lower()
        samples = self._load_samples()
        train_x = [sample["text"] for sample in samples]
        train_y = [sample["label"] for sample in samples]

        if target_backend == "transformer-embeddings":
            pipeline = self._build_transformer_pipeline()
            provider = f"python-transformer:{self.transformer_name}"
        else:
            pipeline = self._build_linear_pipeline()
            target_backend = "linear-tfidf"
            provider = "python-sklearn-tfidf"

        pipeline.fit(train_x, train_y)
        artifact_path = self._artifact_path(target_backend)
        joblib.dump(pipeline, artifact_path)
        self.pipeline = pipeline
        self.backend = target_backend

        registry = ModelRegistry(
            provider=provider,
            version=self.model_version,
            backend=target_backend,
            trainedAt=datetime.now(timezone.utc).isoformat(),
            sampleCount=len(samples),
            labels=self.labels,
            artifactPath=str(artifact_path),
        )
        self._save_registry(registry)

        return {
            "trained": True,
            "samples": len(samples),
            "labels": self.labels,
            "provider": registry.provider,
            "version": registry.version,
            "backend": registry.backend,
        }

    def get_current_model(self) -> dict[str, Any]:
        registry = self._load_registry()
        if registry is None:
            train_result = self.train(self.backend)
            registry = self._load_registry()
            if registry is None:
                raise RuntimeError(f"Failed to initialize model registry: {train_result}")

        return {
            "provider": registry.provider,
            "version": registry.version,
            "backend": registry.backend,
            "trainedAt": registry.trainedAt,
            "sampleCount": registry.sampleCount,
            "labels": registry.labels,
        }

    def predict(self, entries: list[dict[str, Any]]) -> dict[str, Any]:
        if self.pipeline is None:
            self._ensure_loaded()
        assert self.pipeline is not None

        registry = self.get_current_model()
        snapshot = build_feature_snapshot(entries)
        text_blob = build_text_blob(entries)
        probabilities = self.pipeline.predict_proba([text_blob])[0]
        classes = list(self.pipeline.classes_)
        distribution = {label: float(probabilities[classes.index(label)]) if label in classes else 0.0 for label in self.labels}
        primary_state = max(distribution, key=distribution.get)

        factors = []
        if snapshot["depressiveToneScore"] >= 0.5:
            factors.append({
                "id": "depressive-tone",
                "label": "Depressive language markers",
                "direction": "negative",
                "impact": round(min(1.0, snapshot["depressiveToneScore"] / 2), 2),
                "detail": "The notes contain phrases associated with hopelessness, emptiness, or loss of interest.",
            })
        if snapshot["hopelessnessScore"] >= 0.4:
            factors.append({
                "id": "hopelessness",
                "label": "Hopelessness markers",
                "direction": "negative",
                "impact": round(min(1.0, snapshot["hopelessnessScore"] / 2), 2),
                "detail": "The text suggests reduced belief that the situation can improve.",
            })
        if snapshot["socialWithdrawalScore"] >= 0.4:
            factors.append({
                "id": "withdrawal",
                "label": "Social withdrawal",
                "direction": "negative",
                "impact": round(min(1.0, snapshot["socialWithdrawalScore"] / 2), 2),
                "detail": "The user text contains signs of isolation or avoidance of communication.",
            })
        if snapshot["positiveAffectScore"] >= 0.4:
            factors.append({
                "id": "positive-affect",
                "label": "Recovery language",
                "direction": "positive",
                "impact": round(min(1.0, snapshot["positiveAffectScore"] / 2), 2),
                "detail": "The notes include words about relief, support, or recovery.",
            })
        if not factors:
            factors.append({
                "id": "baseline",
                "label": "Behavioral baseline",
                "direction": "positive",
                "impact": 0.2,
                "detail": "No strong text markers were detected, so the result relies more on diary metrics and general wording.",
            })

        explanations = {
            "burnout-risk": "The text and diary signals suggest a high-load, depressive, or burnout-like state.",
            "stressed": "The text looks stress-heavy, with worry, overload, or sustained tension.",
            "fatigued": "The text suggests exhaustion, reduced energy, and somatic fatigue.",
            "recovery": "The text shows signs of improvement, support, or stabilization.",
            "stable": "The text does not show strong depressive or overload markers and the overall tone is more balanced.",
        }

        return {
            "primaryState": primary_state,
            "confidence": round(float(distribution[primary_state]), 2),
            "stressProbability": round(float(distribution["stressed"] + distribution["burnout-risk"] * 0.65), 2),
            "recoveryProbability": round(float(distribution["recovery"] + distribution["stable"] * 0.35), 2),
            "burnoutProbability": round(float(distribution["burnout-risk"]), 2),
            "modelProvider": registry["provider"],
            "modelVersion": registry["version"],
            "featureSnapshot": snapshot,
            "factors": factors[:4],
            "explanation": explanations[primary_state],
        }
