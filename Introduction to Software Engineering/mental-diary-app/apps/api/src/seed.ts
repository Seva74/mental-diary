import { Article, Entry, ForumPost, Specialist } from './types';

export const demoEntries: Entry[] = [
  {
    id: 'seed-entry-1',
    userId: 'demo-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    moodScore: 6,
    energy: 6,
    sleepHours: 7.5,
    stress: 4,
    notes: 'Спокойный день, удалось закрыть учебные задачи без авралов.',
    tags: ['study', 'focus']
  },
  {
    id: 'seed-entry-2',
    userId: 'demo-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    moodScore: 5,
    energy: 5,
    sleepHours: 6.5,
    stress: 5,
    notes: 'Много переписок и небольшая усталость к вечеру.',
    tags: ['communication', 'routine']
  },
  {
    id: 'seed-entry-3',
    userId: 'demo-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    moodScore: 4,
    energy: 4,
    sleepHours: 5.5,
    stress: 7,
    notes: 'Появилось напряжение перед дедлайном и труднее было сосредоточиться.',
    tags: ['deadline', 'stress']
  },
  {
    id: 'seed-entry-4',
    userId: 'demo-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    moodScore: 3,
    energy: 4,
    sleepHours: 4.5,
    stress: 8,
    notes: 'Сильная усталость, хочется снизить темп и восстановиться.',
    tags: ['fatigue', 'recovery']
  }
];

export const specialists: Specialist[] = [
  {
    id: 'spec-1',
    name: 'Елена Котова',
    specialization: 'Клинический психолог',
    availability: 'Сегодня 17:00-20:00',
    contact: 'mental-diary.local/spec/1',
    reason: 'Подходит при устойчивом стрессе и проблемах с восстановлением.'
  },
  {
    id: 'spec-2',
    name: 'Алексей Миронов',
    specialization: 'Психотерапевт',
    availability: 'Завтра 10:00-13:00',
    contact: 'mental-diary.local/spec/2',
    reason: 'Подходит, если тревога и утомление сохраняются несколько дней.'
  },
  {
    id: 'spec-3',
    name: 'Мария Белова',
    specialization: 'Консультант по стресс-менеджменту',
    availability: 'По записи',
    contact: 'mental-diary.local/spec/3',
    reason: 'Подходит для выстраивания режима сна и коротких антистресс-практик.'
  }
];

export const demoForumPosts: ForumPost[] = [
  {
    id: 'forum-1',
    authorName: 'Арина',
    text: 'Как вы снижаете тревожность перед дедлайнами? Хочу собрать рабочие практики.',
    moodTag: 'question',
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString()
  },
  {
    id: 'forum-2',
    authorName: 'Матвей',
    text: 'Мне помогло правило 25/5 и короткая прогулка после каждой пары.',
    moodTag: 'experience',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  },
  {
    id: 'forum-3',
    authorName: 'Камила',
    text: 'Если сегодня тяжело, попробуйте сделать только три главные задачи и остановиться.',
    moodTag: 'support',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];

export const demoArticles: Article[] = [
  {
    id: 'article-1',
    title: 'Как заметить ранние признаки перегрузки',
    summary: 'Короткий разбор сигналов, которые чаще всего предшествуют эмоциональному выгоранию.',
    tags: ['burnout', 'self-check'],
    readTimeMinutes: 4,
    content: 'Первые сигналы перегрузки: утомление с утра, скачки концентрации, раздражительность. Полезно фиксировать эти маркеры в дневнике и проверять динамику раз в неделю.'
  },
  {
    id: 'article-2',
    title: 'Сон и стресс: что реально работает в учебный период',
    summary: 'Простые шаги для стабилизации режима без радикальной перестройки расписания.',
    tags: ['sleep', 'stress'],
    readTimeMinutes: 5,
    content: 'Стабильный сон начинается с предсказуемого ритуала за 40 минут до отдыха: убрать яркий экран, снизить темп и закрыть план на завтра. Даже 4-5 дней подряд уже дают эффект.'
  },
  {
    id: 'article-3',
    title: 'Когда пора обращаться к специалисту',
    summary: 'Критерии, при которых самопомощи обычно недостаточно и лучше подключить профессиональную поддержку.',
    tags: ['specialist', 'critical'],
    readTimeMinutes: 3,
    content: 'Если низкое настроение и высокий стресс держатся больше недели, а привычные способы восстановления не помогают, стоит обратиться к специалисту. Это не слабость, а стратегия заботы о себе.'
  }
];