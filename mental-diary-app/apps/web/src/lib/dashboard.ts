import type { DashboardData, Entry, RiskLevel } from '../types';
import { formatFreshness, getDaysSince } from './date';

export type TrendMetricKey = 'moodScore' | 'energy' | 'sleepHours' | 'stress';

const metricReaders: Record<TrendMetricKey, (entry: Entry) => number> = {
  moodScore: (entry) => entry.moodScore,
  energy: (entry) => entry.energy,
  sleepHours: (entry) => entry.sleepHours,
  stress: (entry) => entry.stress
};

export const riskLabelMap: Record<RiskLevel, string> = {
  low: 'Стабильный профиль',
  moderate: 'Нужна динамика',
  high: 'Повышенное внимание',
  critical: 'Критический профиль'
};

export const riskPillClassMap: Record<RiskLevel, string> = {
  low: 'pill pill-low',
  moderate: 'pill pill-moderate',
  high: 'pill pill-high',
  critical: 'pill pill-critical'
};

export interface HomeInsight {
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
  tone: RiskLevel;
}

export const getSortedEntries = (entries: Entry[]) => {
  return [...entries].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
};

export const getRecentMetricSeries = (entries: Entry[], key: TrendMetricKey, limit = 7) => {
  const ordered = getSortedEntries(entries);
  return ordered.slice(-limit).map(metricReaders[key]);
};

export const getDailyEntryCounts = (entries: Entry[], days = 7) => {
  const countsByDay = new Map<string, number>();

  for (const entry of entries) {
    const dayKey = entry.createdAt.slice(0, 10);
    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  const reference = new Date();
  reference.setHours(12, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const offset = new Date(reference);
    offset.setDate(reference.getDate() - (days - 1 - index));
    return countsByDay.get(offset.toISOString().slice(0, 10)) ?? 0;
  });
};

export const buildSparklinePath = (values: number[], width = 100, height = 36, padding = 4) => {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x = values.length === 1
        ? width / 2
        : padding + (innerWidth * index) / (values.length - 1);
      const normalized = (value - min) / range;
      const y = height - padding - normalized * innerHeight;

      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

export const formatTrendDelta = (delta: number, suffix = '') => {
  const rounded = Math.abs(delta).toFixed(1);

  if (delta > 0) {
    return `+${rounded}${suffix}`;
  }

  if (delta < 0) {
    return `-${rounded}${suffix}`;
  }

  return `0${suffix}`;
};

export const buildHomeInsight = (dashboard: DashboardData, reference = new Date()): HomeInsight => {
  if (dashboard.entries.length === 0) {
    return {
      eyebrow: 'Старт',
      title: 'Сделай первую запись',
      detail: 'Пока нет данных для анализа. Короткий чек-ин даст системе опору и сразу включит рекомендации.',
      action: 'Открыть дневник и заполнить первую запись.',
      tone: 'low'
    };
  }

  const latestEntry = dashboard.entries[0];

  if (!latestEntry) {
    return {
      eyebrow: 'Данные',
      title: 'Нет записей для анализа',
      detail: 'Добавьте хотя бы одну запись, чтобы дашборд мог показать динамику и рекомендации.',
      action: 'Откройте дневник и сохраните первую запись.',
      tone: 'low'
    };
  }

  const freshness = formatFreshness(latestEntry.createdAt, reference);
  const daysSinceLastEntry = getDaysSince(latestEntry.createdAt, reference);

  if (dashboard.analysis.riskLevel === 'critical') {
    return {
      eyebrow: 'Критический сигнал',
      title: 'Сначала восстановление',
      detail: `Профиль выглядит критически. Последняя запись была ${freshness}, поэтому сейчас важнее всего снизить нагрузку и не затягивать с проверкой состояния.`,
      action: 'Открыть аналитику и раздел поддержки.',
      tone: 'critical'
    };
  }

  if (dashboard.analysis.riskLevel === 'high') {
    return {
      eyebrow: 'Повышенное внимание',
      title: 'Сбавь темп и добери восстановление',
      detail: `Тренд пока нестабилен. Последняя запись была ${freshness}, а это хороший момент пересобрать вечернюю нагрузку, сон и паузы.`,
      action: 'Посмотреть рекомендации и скорректировать план дня.',
      tone: 'high'
    };
  }

  if (daysSinceLastEntry >= 4) {
    return {
      eyebrow: 'Возвращение к ритму',
      title: 'Пора сделать короткий чек-ин',
      detail: `Последняя запись была ${freshness}. Даже 30 секунд с тремя цифрами уже вернут системе свежий сигнал и сделают аналитику точнее.`,
      action: 'Добавить короткую запись сегодня.',
      tone: 'moderate'
    };
  }

  if (dashboard.analysis.trendScore > 0.8 && dashboard.analysis.averageStress <= 4) {
    return {
      eyebrow: 'Хорошая динамика',
      title: 'Поддерживай рабочий ритм',
      detail: 'Тренд движется вверх, а стресс остаётся под контролем. Это удачный момент зафиксировать, что именно помогает держать состояние ровным.',
      action: 'Добавить запись и отметить полезные действия.',
      tone: 'low'
    };
  }

  if (dashboard.analysis.trendScore < 0) {
    return {
      eyebrow: 'Нужна мягкая коррекция',
      title: 'Поймай, что тянет состояние вниз',
      detail: `Последняя запись была ${freshness}. Тренд слегка проседает, поэтому полезно заметить, что именно забирает силы и сон.`,
      action: 'Открыть дневник и зафиксировать один фактор нагрузки.',
      tone: 'moderate'
    };
  }

  return {
    eyebrow: 'Поддержка ритма',
    title: 'Состояние выглядит устойчивым',
    detail: `Последняя запись была ${freshness}. Сохраняй текущий темп и продолжай отмечать, что помогает удерживать баланс.`,
    action: 'Добавить короткую запись и продолжить наблюдение.',
    tone: 'low'
  };
};
