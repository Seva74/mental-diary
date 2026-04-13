import { Analysis, Entry, Recommendation } from '../types';

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const fallbackAdvice = (analysis: Analysis) => {
  if (analysis.riskLevel === 'critical') {
    return 'Сейчас лучше сократить нагрузку, восстановить сон и не оставаться с тяжелым состоянием в одиночку.';
  }

  if (analysis.riskLevel === 'high') {
    return 'Нагрузка заметно влияет на состояние. Нужен более бережный режим, короткие паузы и отслеживание сна.';
  }

  if (analysis.riskLevel === 'moderate') {
    return 'Сохраняйте регулярность записей, короткие прогулки и стабильный режим дня помогут удержать баланс.';
  }

  return 'Состояние выглядит устойчивым. Продолжайте текущий ритм и отмечайте изменения, если они появятся.';
};

export const buildRecommendations = (analysis: Analysis, entries: Entry[], aiMessage: string | null): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (analysis.riskLevel === 'critical') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Снизить нагрузку сегодня',
      detail: 'Зафиксировано критическое сочетание стресса, сна и настроения. Уберите лишние задачи и дайте себе паузу.',
      action: 'Ограничить нагрузку на 24 часа, попросить поддержки у близкого человека и использовать экстренную помощь, если чувствуешь риск для безопасности.',
      severity: 'critical'
    });
  } else if (analysis.riskLevel === 'high') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Пересобрать режим дня',
      detail: 'Показатели указывают на перегрузку. Улучшение сна и короткий отдых помогут стабилизировать тренд.',
      action: 'Добавить окно отдыха и сократить вечернюю активность.',
      severity: 'warning'
    });
  } else if (analysis.riskLevel === 'moderate') {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Поддержать стабильность',
      detail: 'Состояние меняется, но пока без явного риска. Полезно сохранить регулярность и не терять ритм.',
      action: 'Продолжать записи и отмечать, что влияет на настроение.',
      severity: 'info'
    });
  } else {
    recommendations.push({
      id: createId('rec'),
      source: 'rule',
      title: 'Сохранить текущий ритм',
      detail: 'Стабильный профиль позволяет не менять многое в привычках, а только наблюдать за динамикой.',
      action: 'Продолжать дневник и отслеживать закономерности.',
      severity: 'info'
    });
  }

  if (aiMessage) {
    recommendations.push({
      id: createId('rec'),
      source: 'ai',
      title: 'Совет от AI-адаптера',
      detail: aiMessage,
      action: 'Использовать подсказку как мягкий ориентир, а не как диагноз.',
      severity: analysis.riskLevel === 'critical' ? 'critical' : 'warning'
    });
  }

  const recentMood = entries[0]?.moodScore ?? analysis.averageMood;
  recommendations.push({
    id: createId('rec'),
    source: 'fallback',
    title: 'Контрольная точка на завтра',
    detail: `Зафиксируйте короткую запись утром и вечером, чтобы увидеть, как меняется состояние при среднем настроении ${recentMood}/10.`,
    action: 'Сделать две короткие записи и сравнить их через сутки.',
    severity: 'info'
  });

  return recommendations;
};

export const buildAdvicePrompt = (analysis: Analysis, entries: Entry[]) => {
  const latestEntry = entries[0];

  return [
    `Risk level: ${analysis.riskLevel}`,
    `Average mood: ${analysis.averageMood}`,
    `Average stress: ${analysis.averageStress}`,
    `Trend score: ${analysis.trendScore}`,
    latestEntry ? `Latest note: ${latestEntry.notes}` : 'Latest note: none'
  ].join('\n');
};

export const fallbackRecommendation = fallbackAdvice;