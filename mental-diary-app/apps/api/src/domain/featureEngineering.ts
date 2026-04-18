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

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

const countMatches = (text: string, dictionary: string[]) => {
  const normalized = normalize(text);
  return dictionary.reduce((count, token) => count + (normalized.includes(token) ? 1 : 0), 0);
};

const riskWords = [
  'тревог', 'давит', 'стресс', 'паник', 'перегруз', 'дедлайн', 'anxiety', 'stress', 'panic', 'overwhelmed', 'deadline', 'pressure'
];

const recoveryWords = [
  'спокой', 'легче', 'поддерж', 'восстанов', 'получилось', 'стабиль', 'calm', 'better', 'support', 'recover', 'stable', 'managed'
];

const depressivePatterns = [
  'пусто', 'безнад', 'ничего не радует', 'нет смысла', 'не могу дальше', 'депресс', 'empty', 'hopeless', 'nothing matters', 'no point', 'numb', 'depressed'
];

const hopelessnessPatterns = [
  'безнад', 'не вижу выхода', 'нет будущего', 'не станет лучше', 'всё бессмысленно', 'no way out', 'never gets better', 'no future', 'meaningless'
];

const socialWithdrawalPatterns = [
  'не хочу ни с кем', 'изолир', 'закрылся', 'один', 'избегаю людей', 'do not want to talk', 'isolated', 'withdrawn', 'avoid people', 'shut everyone out'
];

const selfWorthPatterns = [
  'обуза', 'ненавижу себя', 'я никчем', 'я лишний', 'всё испортил', 'burden', 'hate myself', 'worthless', 'failure', 'ruin everything'
];

const somaticPatterns = [
  'нет сил', 'тело тяжёлое', 'не спал', 'не могу встать', 'туман в голове', 'истощ', 'exhausted', 'drained', 'heavy body', 'brain fog', 'can\'t get up', 'no energy'
];

const intensityPatterns = [
  'очень', 'слишком', 'полностью', 'совсем', 'крайне', 'ужасно', 'very', 'extremely', 'totally', 'completely', 'terribly'
];

const positiveAffectPatterns = [
  'спокой', 'рад', 'лучше', 'спасибо', 'поддерж', 'тепло', 'calm', 'grateful', 'better', 'supported', 'warm', 'relief'
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
  const denominator = Math.max(ordered.length || 1, 1);

  return {
    averageMood: round(average(moodValues)),
    averageEnergy: round(average(energyValues)),
    averageSleepHours: round(average(sleepValues)),
    averageStress: round(average(stressValues)),
    moodTrend: round(slope(moodValues)),
    stressTrend: round(slope(stressValues)),
    sleepTrend: round(slope(sleepValues)),
    noteRiskScore: round(countMatches(notes, riskWords) / denominator),
    noteRecoveryScore: round(countMatches(notes, recoveryWords) / denominator),
    tagRiskScore: round(countMatches(tagText, riskWords) / Math.max(tags.length || 1, 1)),
    tagRecoveryScore: round(countMatches(tagText, recoveryWords) / Math.max(tags.length || 1, 1)),
    depressiveToneScore: round(countMatches(notes, depressivePatterns) / denominator),
    hopelessnessScore: round(countMatches(notes, hopelessnessPatterns) / denominator),
    socialWithdrawalScore: round(countMatches(notes, socialWithdrawalPatterns) / denominator),
    selfWorthRiskScore: round(countMatches(notes, selfWorthPatterns) / denominator),
    somaticBurdenScore: round(countMatches(notes, somaticPatterns) / denominator),
    emotionalIntensityScore: round(countMatches(notes, intensityPatterns) / denominator),
    positiveAffectScore: round(countMatches(notes, positiveAffectPatterns) / denominator),
    volatilityScore: round((volatility(moodValues) + volatility(stressValues) + volatility(energyValues)) / 3)
  };
};

export const snapshotToVector = (snapshot: ModelFeatureSnapshot): number[] => {
  const normalizeMood = (value: number) => value / 10;
  const normalizeSleep = (value: number) => value / 10;
  const normalizeTrend = (value: number) => (value + 3) / 6;
  const normalizeTextScore = (value: number) => value / 4;

  return [
    normalizeMood(snapshot.averageMood),
    normalizeMood(snapshot.averageEnergy),
    normalizeSleep(snapshot.averageSleepHours),
    normalizeMood(snapshot.averageStress),
    normalizeTrend(snapshot.moodTrend),
    normalizeTrend(snapshot.stressTrend),
    normalizeTrend(snapshot.sleepTrend),
    normalizeTextScore(snapshot.noteRiskScore),
    normalizeTextScore(snapshot.noteRecoveryScore),
    snapshot.tagRiskScore,
    snapshot.tagRecoveryScore,
    normalizeTextScore(snapshot.depressiveToneScore),
    normalizeTextScore(snapshot.hopelessnessScore),
    normalizeTextScore(snapshot.socialWithdrawalScore),
    normalizeTextScore(snapshot.selfWorthRiskScore),
    normalizeTextScore(snapshot.somaticBurdenScore),
    normalizeTextScore(snapshot.emotionalIntensityScore),
    normalizeTextScore(snapshot.positiveAffectScore),
    snapshot.volatilityScore / 4
  ];
};
