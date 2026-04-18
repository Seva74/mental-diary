import { Entry, ModelFeatureSnapshot } from '../types';

const round = (value: number) => Math.round(value * 100) / 100;

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const slope = (values: number[]) => {
  if (values.length < 2) {
    return 0;
  }

  const meanX = average(values.map((_value, index) => index));
  const meanY = average(values);
  const numerator = values.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0);
  const denominator = values.reduce((sum, _value, index) => sum + (index - meanX) ** 2, 0);

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
};

const volatility = (values: number[]) => {
  if (values.length < 2) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const countMatches = (text: string, dictionary: string[]) => {
  const normalized = text.toLowerCase();
  return dictionary.reduce((count, token) => count + (normalized.includes(token) ? 1 : 0), 0);
};

const riskWords = [
  'устал', 'усталость', 'тревог', 'паник', 'давлен', 'стресс', 'выгор', 'не спал', 'без сил', 'ошибк',
  'fatigue', 'anxiety', 'panic', 'stress', 'burnout', 'exhausted', 'overwhelmed', 'deadline'
];

const recoveryWords = [
  'спокой', 'полегч', 'отдох', 'поддерж', 'прогул', 'сон', 'лучше', 'восстанов', 'stable', 'rest',
  'recover', 'walk', 'support', 'calm', 'routine'
];

const safeWindow = (entries: Entry[]) => [...entries].sort((left, right) => left.createdAt.localeCompare(right.createdAt)).slice(-14);

export const buildFeatureSnapshot = (entries: Entry[]): ModelFeatureSnapshot => {
  const ordered = safeWindow(entries);
  const notes = ordered.map((entry) => entry.notes).join(' ');
  const tags = ordered.flatMap((entry) => entry.tags.map((tag) => tag.toLowerCase()));
  const tagText = tags.join(' ');
  const moodValues = ordered.map((entry) => entry.moodScore);
  const stressValues = ordered.map((entry) => entry.stress);
  const sleepValues = ordered.map((entry) => entry.sleepHours);
  const energyValues = ordered.map((entry) => entry.energy);

  return {
    averageMood: round(average(moodValues)),
    averageEnergy: round(average(energyValues)),
    averageSleepHours: round(average(sleepValues)),
    averageStress: round(average(stressValues)),
    moodTrend: round(slope(moodValues)),
    stressTrend: round(slope(stressValues)),
    sleepTrend: round(slope(sleepValues)),
    noteRiskScore: round(countMatches(notes, riskWords) / Math.max(ordered.length || 1, 1)),
    noteRecoveryScore: round(countMatches(notes, recoveryWords) / Math.max(ordered.length || 1, 1)),
    tagRiskScore: round(countMatches(tagText, riskWords) / Math.max(tags.length || 1, 1)),
    tagRecoveryScore: round(countMatches(tagText, recoveryWords) / Math.max(tags.length || 1, 1)),
    volatilityScore: round((volatility(moodValues) + volatility(stressValues) + volatility(energyValues)) / 3)
  };
};

export const snapshotToVector = (snapshot: ModelFeatureSnapshot): number[] => {
  const normalizeMood = (value: number) => value / 10;
  const normalizeSleep = (value: number) => value / 10;
  const normalizeTrend = (value: number) => (value + 3) / 6;

  return [
    normalizeMood(snapshot.averageMood),
    normalizeMood(snapshot.averageEnergy),
    normalizeSleep(snapshot.averageSleepHours),
    normalizeMood(snapshot.averageStress),
    normalizeTrend(snapshot.moodTrend),
    normalizeTrend(snapshot.stressTrend),
    normalizeTrend(snapshot.sleepTrend),
    snapshot.noteRiskScore / 4,
    snapshot.noteRecoveryScore / 4,
    snapshot.tagRiskScore,
    snapshot.tagRecoveryScore,
    snapshot.volatilityScore / 4
  ];
};
