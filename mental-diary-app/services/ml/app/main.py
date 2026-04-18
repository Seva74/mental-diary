from fastapi import FastAPI

from .model import MentalStatePipeline
from .schemas import ModelInfoResponse, PredictRequest, PredictResponse, TrainResponse


app = FastAPI(title="Mental Diary ML Service", version="0.1.0")
pipeline = MentalStatePipeline()


@app.get("/health")
def health() -> dict[str, str]:
    current = pipeline.get_current_model()
    return {"status": "ok", "provider": current["provider"], "backend": current["backend"]}


@app.get("/models/current", response_model=ModelInfoResponse)
def current_model() -> ModelInfoResponse:
    return ModelInfoResponse(**pipeline.get_current_model())


@app.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
    payload = pipeline.train()
    return TrainResponse(**payload)


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    payload = pipeline.predict([entry.model_dump() for entry in request.entries])
    return PredictResponse(**payload)
