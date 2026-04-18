from typing import List, Literal, Optional

from pydantic import BaseModel, Field


MentalStateLabel = Literal["stable", "fatigued", "stressed", "burnout-risk", "recovery"]
RiskLevel = Literal["low", "moderate", "high", "critical"]


class EntryPayload(BaseModel):
    moodScore: float
    energy: float
    sleepHours: float
    stress: float
    notes: str
    tags: List[str] = Field(default_factory=list)
    createdAt: Optional[str] = None


class PredictRequest(BaseModel):
    entries: List[EntryPayload] = Field(default_factory=list)


class PredictionFactorPayload(BaseModel):
    id: str
    label: str
    direction: Literal["positive", "negative"]
    impact: float
    detail: str


class FeatureSnapshotPayload(BaseModel):
    averageMood: float
    averageEnergy: float
    averageSleepHours: float
    averageStress: float
    moodTrend: float
    stressTrend: float
    sleepTrend: float
    noteRiskScore: float
    noteRecoveryScore: float
    tagRiskScore: float
    tagRecoveryScore: float
    depressiveToneScore: float
    hopelessnessScore: float
    socialWithdrawalScore: float
    selfWorthRiskScore: float
    somaticBurdenScore: float
    emotionalIntensityScore: float
    positiveAffectScore: float
    volatilityScore: float


class PredictResponse(BaseModel):
    primaryState: MentalStateLabel
    confidence: float
    stressProbability: float
    recoveryProbability: float
    burnoutProbability: float
    featureSnapshot: FeatureSnapshotPayload
    factors: List[PredictionFactorPayload]
    explanation: str


class TrainResponse(BaseModel):
    trained: bool
    samples: int
    labels: List[str]
