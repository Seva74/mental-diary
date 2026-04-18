import { Analysis, Entry, ModelAssessment, RiskLevel } from '../types';

const round = (value: number) => Math.round(value * 10) / 10;

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const calculateTrendScore = (entries: Entry[]) => {
  if (entries.length < 2) {
    return 0;
  }

  const ordered = [...entries].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const firstWindow = ordered.slice(0, Math.min(3, ordered.length)).map((entry) => entry.moodScore);
  const lastWindow = ordered.slice(Math.max(ordered.length - 3, 0)).map((entry) => entry.moodScore);

  return round(average(lastWindow) - average(firstWindow));
};

const resolveRiskLevel = (
  averageMood: number,
  averageStress: number,
  averageSleepHours: number,
  trendScore: number,
  burnoutProbability: number,
  stressProbability: number
): RiskLevel => {
  if (
    burnoutProbability >= 0.55 ||
    averageMood <= 3.5 ||
    averageStress >= 8 ||
    (averageSleepHours <= 5 && averageStress >= 6)
  ) {
    return 'critical';
  }

  if (stressProbability >= 0.6 || averageMood <= 4.5 || averageStress >= 7 || trendScore <= -1.5) {
    return 'high';
  }

  if (averageMood <= 6 || averageStress >= 5 || trendScore < 0) {
    return 'moderate';
  }

  return 'low';
};

const buildSummary = (analysis: Omit<Analysis, 'summary'>) => {
  const factorText = analysis.factors[0]?.label
    ? `Главный фактор: ${analysis.factors[0].label.toLowerCase()}.`
    : '';

  return [
    `Состояние классифицировано как ${analysis.stateLabel}.`,
    `Уверенность модели ${Math.round(analysis.confidence * 100)}%.`,
    `Среднее настроение ${analysis.averageMood}/10, стресс ${analysis.averageStress}/10, сон ${analysis.averageSleepHours} ч.`,
    `Риск ${analysis.riskLevel}, вероятность выгорания ${Math.round(analysis.burnoutProbability * 100)}%.`,
    factorText
  ].join(' ').trim();
};

export const computeAnalysis = (entries: Entry[], modelAssessment: ModelAssessment): Analysis => {
  const ordered = [...entries].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const averageMood = average(entries.map((entry) => entry.moodScore));
  const averageEnergy = average(entries.map((entry) => entry.energy));
  const averageSleepHours = average(entries.map((entry) => entry.sleepHours));
  const averageStress = average(entries.map((entry) => entry.stress));
  const trendScore = calculateTrendScore(entries);
  const riskLevel = resolveRiskLevel(
    averageMood,
    averageStress,
    averageSleepHours,
    trendScore,
    modelAssessment.burnoutProbability,
    modelAssessment.stressProbability
  );
  const stressLoad = round((averageStress / 10) * 0.6 + Math.max(0, -trendScore) * 0.15 + modelAssessment.stressProbability * 0.25);
  const protectiveScore = round(
    (averageSleepHours / 10) * 0.35 +
    (averageEnergy / 10) * 0.25 +
    modelAssessment.recoveryProbability * 0.25 +
    Math.max(0, trendScore) * 0.15
  );

  if (entries.length === 0) {
    return {
      entryCount: 0,
      averageMood: 0,
      averageEnergy: 0,
      averageSleepHours: 0,
      averageStress: 0,
      trendScore: 0,
      riskLevel: 'low',
      stateLabel: modelAssessment.primaryState,
      confidence: modelAssessment.confidence,
      burnoutProbability: modelAssessment.burnoutProbability,
      recoveryProbability: modelAssessment.recoveryProbability,
      stressLoad: 0,
      protectiveScore: 0,
      modelProvider: modelAssessment.modelProvider,
      modelVersion: modelAssessment.modelVersion,
      factors: modelAssessment.factors,
      featureSnapshot: modelAssessment.featureSnapshot,
      summary: 'Пока нет записей. Добавьте несколько дней наблюдений, чтобы модель оценила динамику состояния.'
    };
  }

  const analysisBase: Omit<Analysis, 'summary'> = {
    entryCount: entries.length,
    averageMood,
    averageEnergy,
    averageSleepHours,
    averageStress,
    trendScore,
    riskLevel,
    stateLabel: modelAssessment.primaryState,
    confidence: modelAssessment.confidence,
    burnoutProbability: modelAssessment.burnoutProbability,
    recoveryProbability: modelAssessment.recoveryProbability,
    stressLoad,
    protectiveScore,
    modelProvider: modelAssessment.modelProvider,
    modelVersion: modelAssessment.modelVersion,
    factors: modelAssessment.factors,
    featureSnapshot: modelAssessment.featureSnapshot
  };
  const latestMood = ordered[0]?.moodScore ?? averageMood;

  return {
    ...analysisBase,
    summary: `${modelAssessment.explanation} Последняя оценка настроения ${latestMood}/10. ${buildSummary(analysisBase)}`
  };
};
