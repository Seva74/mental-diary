import { Analysis, Entry, Recommendation } from '../types';

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const fallbackAdvice = (analysis: Analysis) => {
  if (analysis.riskLevel === 'critical') {
    return 'Нагрузка выглядит небезопасной. Снизьте обязательства на ближайшие сутки и подключите живую поддержку.';
  }

  if (analysis.stateLabel === 'fatigued') {
    return 'Основной сигнал сейчас не кризис, а истощение. Приоритетом должен быть сон, паузы и сокращение лишних задач.';
  }

  if (analysis.stateLabel === 'stressed') {
    return 'Стресс держится устойчиво. Разбейте день на короткие блоки, уберите лишние триггеры и заранее спланируйте восстановление.';
  }

  if (analysis.stateLabel === 'recovery') {
    return 'Есть позитивная динамика. Сохраняйте рабочий ритм восстановления и не возвращайтесь резко к перегрузке.';
  }

  return 'Состояние относительно стабильное. Поддерживайте сон, режим и регулярные записи, чтобы модель видела динамику.';
};

const recommendationByFactor = (analysis: Analysis): Recommendation[] => {
  return analysis.factors.map((factor) => ({
    id: createId('factor'),
    source: 'rule',
    title: factor.label,
    detail: factor.detail,
    action: factor.direction === 'negative'
      ? 'Сделайте это приоритетом на ближайшие 24 часа и проверьте, уменьшился ли фактор в следующей записи.'
      : 'Закрепите этот паттерн и повторите его в ближайшие дни, чтобы усилить защитный эффект.',
    severity: factor.direction === 'negative' && factor.impact >= 0.75
      ? 'critical'
      : factor.direction === 'negative'
        ? 'warning'
        : 'info'
  }));
};

export const buildRecommendations = (analysis: Analysis, entries: Entry[], aiMessage: string | null): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (analysis.riskLevel === 'critical') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Срочная разгрузка',
      detail: 'Комбинация низкого ресурса, высокого стресса и модели burnout-risk требует немедленного снижения нагрузки.',
      action: 'Уберите необязательные задачи, сообщите близкому человеку о состоянии и при ухудшении обратитесь за профессиональной помощью.',
      severity: 'critical'
    });
  } else if (analysis.stateLabel === 'fatigued') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Режим восстановления',
      detail: 'Ключевой дефицит сейчас связан со сном и энергией, а не только с эмоциями.',
      action: 'На 2-3 дня зафиксируйте время сна, сократите вечернюю нагрузку и добавьте один период отдыха без экрана.',
      severity: 'warning'
    });
  } else if (analysis.stateLabel === 'stressed') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Снижение стресса',
      detail: 'Стрессовый профиль держится по нескольким признакам одновременно: показатели, тренд и словарь записей.',
      action: 'Разбейте крупные задачи на короткие блоки по 25-40 минут и после каждого блока фиксируйте уровень напряжения.',
      severity: 'warning'
    });
  } else if (analysis.stateLabel === 'recovery') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Закрепить улучшение',
      detail: 'Динамика стала лучше, но восстановление еще нужно стабилизировать.',
      action: 'Сохраните рабочие привычки, которые улучшили сон или настроение, и не повышайте нагрузку скачком.',
      severity: 'info'
    });
  } else {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Поддерживать стабильность',
      detail: 'Текущие показатели не выглядят тревожными, но ценность системы в отслеживании тренда.',
      action: 'Продолжайте ежедневные записи и отмечайте, какие факторы сильнее всего влияют на настроение.',
      severity: 'info'
    });
  }

  recommendations.push(...recommendationByFactor(analysis));

  if (aiMessage) {
    recommendations.push({
      id: createId('rec'),
      source: 'ai',
      title: 'Сводка помощника',
      detail: aiMessage,
      action: 'Используйте это как ориентир для самонаблюдения, а не как медицинский диагноз.',
      severity: analysis.riskLevel === 'critical' ? 'critical' : 'warning'
    });
  }

  const recentMood = entries[0]?.moodScore ?? analysis.averageMood;
  recommendations.push({
    id: createId('rec'),
    source: 'fallback',
    title: 'Следующая запись',
    detail: `Последний зафиксированный настрой ${recentMood}/10. Следующая запись нужна, чтобы проверить, меняется ли состояние после рекомендаций.`,
    action: 'Добавьте новую запись через 12-24 часа и опишите, что изменилось в сне, нагрузке и напряжении.',
    severity: 'info'
  });

  return recommendations.slice(0, 6);
};

export const buildAdvicePrompt = (analysis: Analysis, entries: Entry[]) => {
  const recentEntries = entries.slice(0, 7).map((e, index) => 
    `Entry ${index + 1} (${e.createdAt.split('T')[0]}): Mood ${e.moodScore}/10, Stress ${e.stress}/10, Sleep ${e.sleepHours}h.\nText: "${e.notes || '[No text]'}"`
  ).join('\n\n');

  return [
    `Risk level: ${analysis.riskLevel}`,
    `State label: ${analysis.stateLabel}`,
    `Confidence: ${analysis.confidence}`,
    `Average mood: ${analysis.averageMood.toFixed(2)}`,
    `Average stress: ${analysis.averageStress.toFixed(2)}`,
    `Average sleep hours: ${analysis.averageSleepHours.toFixed(1)}`,
    `Burnout probability: ${(analysis.burnoutProbability * 100).toFixed(0)}%`,
    `Main factors: ${analysis.factors.map((factor) => factor.label).join(', ') || 'none'}`,
    `\nRecent User Entries:\n${recentEntries}`
  ].join('\n');
};

export const fallbackRecommendation = fallbackAdvice;
