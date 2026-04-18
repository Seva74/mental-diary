from __future__ import annotations

import argparse
import json
import os

from app.model import MentalStatePipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the mental diary ML model")
    parser.add_argument("--backend", default=os.getenv("ML_MODEL_BACKEND", "linear-tfidf"))
    parser.add_argument("--version", default=os.getenv("ML_MODEL_VERSION", "2026.04.18"))
    args = parser.parse_args()

    os.environ["ML_MODEL_BACKEND"] = args.backend
    os.environ["ML_MODEL_VERSION"] = args.version

    pipeline = MentalStatePipeline()
    result = pipeline.train(args.backend, args.version)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
