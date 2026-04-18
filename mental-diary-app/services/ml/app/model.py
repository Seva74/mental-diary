from __future__ import annotations

import json
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
MODEL_PATH = MODEL_DIR / "mental_state_pipeline.joblib"


class MentalStatePipeline:
    labels = ["stable", "fatigued", "stressed", "burnout-risk", "recovery"]

    def __init__(self) -> None:
        self.pipeline: Pipeline | None = None
        self._ensure_loaded()

    def _ensure_loaded(self) -> None:
        if MODEL_PATH.exists():
            self.pipeline = joblib.load(MODEL_PATH)
        else:
            self.train()

    def _load_samples(self) -> list[dict[str, str]]:
        with DATASET_PATH.open("r", encoding="utf-8") as handle:
            return [json.loads(line) for line in handle if line.strip()]

    def train(self) -> dict[str, Any]:
        samples = self._load_samples()
        train_x = [sample["text"] for sample in samples]
        train_y = [sample["label"] for sample in samples]

        self.pipeline = Pipeline(
            steps=[
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
                ("clf", LogisticRegression(max_iter=2000, class_weight="balanced")),
            ]
        )
        self.pipeline.fit(train_x, train_y)
        joblib.dump(self.pipeline, MODEL_PATH)

        return {"trained": True, "samples": len(samples), "labels": self.labels}

    def predict(self, entries: list[dict[str, Any]]) -> dict[str, Any]:
        assert self.pipeline is not None
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
            "featureSnapshot": snapshot,
            "factors": factors[:4],
            "explanation": explanations[primary_state],
        }
