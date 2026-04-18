from fastapi import FastAPI

from .model import MentalStatePipeline
from .schemas import PredictRequest, PredictResponse, TrainResponse


app = FastAPI(title="Mental Diary ML Service", version="0.1.0")
pipeline = MentalStatePipeline()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "provider": "python-sklearn"}


@app.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
    payload = pipeline.train()
    return TrainResponse(**payload)


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    payload = pipeline.predict([entry.model_dump() for entry in request.entries])
    return PredictResponse(**payload)
