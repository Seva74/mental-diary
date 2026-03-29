import { Analysis, Entry, RiskLevel } from '../types';

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
  trendScore: number
): RiskLevel => {
  if (averageMood <= 3.5 || averageStress >= 8 || (averageSleepHours <= 5 && averageStress >= 6)) {
    return 'critical';
  }

  if (averageMood <= 4.5 || averageStress >= 7 || trendScore <= -1.5) {
    return 'high';
  }

  if (averageMood <= 6 || averageStress >= 5 || trendScore < 0) {
    return 'moderate';
  }

  return 'low';
};

export const computeAnalysis = (entries: Entry[]): Analysis => {
  const ordered = [...entries].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const averageMood = average(entries.map((entry) => entry.moodScore));
  const averageEnergy = average(entries.map((entry) => entry.energy));
  const averageSleepHours = average(entries.map((entry) => entry.sleepHours));
  const averageStress = average(entries.map((entry) => entry.stress));
  const trendScore = calculateTrendScore(entries);
  const riskLevel = resolveRiskLevel(averageMood, averageStress, averageSleepHours, trendScore);

  if (entries.length === 0) {
    return {
      entryCount: 0,
      averageMood: 0,
      averageEnergy: 0,
      averageSleepHours: 0,
      averageStress: 0,
      trendScore: 0,
      riskLevel: 'low',
      summary: 'Пока нет записей. Добавьте первую запись, чтобы увидеть аналитику.'
    };
  }

  const latestMood = ordered[0]?.moodScore ?? averageMood;
  const moodDirection = trendScore >= 0 ? 'улучшение' : 'снижение';
  const summaryParts = [
    `Среднее настроение ${averageMood}/10`,
    `стресс ${averageStress}/10`,
    `сон ${averageSleepHours} ч`,
    `последняя оценка ${latestMood}/10`
  ];

  if (riskLevel === 'critical') {
    summaryParts.push('Система видит критический профиль и рекомендует связаться со специалистом.');
  } else if (riskLevel === 'high') {
    summaryParts.push(`Наблюдается ${moodDirection} тренда, стоит снизить нагрузку и проверить восстановление.`);
  } else if (riskLevel === 'moderate') {
    summaryParts.push('Состояние нестабильно, полезно удерживать ритм и продолжать записи.');
  } else {
    summaryParts.push('Состояние выглядит устойчивым, текущий ритм можно сохранять.');
  }

  return {
    entryCount: entries.length,
    averageMood,
    averageEnergy,
    averageSleepHours,
    averageStress,
    trendScore,
    riskLevel,
    summary: summaryParts.join(' ')
  };
};