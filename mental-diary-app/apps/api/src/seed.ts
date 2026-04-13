import { Article, Entry, ForumPost, SupportAction } from './types';

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

export const supportActions: SupportAction[] = [
  {
    id: 'support-1',
    title: 'Сбросить нагрузку на 20 минут',
    summary: 'Закрой лишние вкладки, отключи уведомления и дай мозгу короткую паузу без входящих сигналов.',
    action: 'Поставь таймер и не возвращайся к задачам до сигнала.',
    reason: 'Короткая пауза снижает перегрузку и помогает не разгонять стресс по инерции.',
    priority: 'high'
  },
  {
    id: 'support-2',
    title: 'Дыхание 4-6',
    summary: 'Четыре секунды вдох, шесть секунд выдох, без усилия и без контроля результата.',
    action: 'Сделай 5 циклов и вернись к дневнику.',
    reason: 'Ровный выдох помогает телу выйти из режима напряжения.',
    priority: 'medium'
  },
  {
    id: 'support-3',
    title: 'Короткий контакт с человеком',
    summary: 'Напиши одному доверенному человеку короткое сообщение без попытки всё объяснить сразу.',
    action: 'Отправь фразу: «Мне сейчас непросто, но я держусь».',
    reason: 'Социальная опора часто помогает быстрее вернуть ощущение устойчивости.',
    priority: 'medium'
  },
  {
    id: 'support-4',
    title: 'Закрыть день раньше',
    summary: 'Убери экран, воду и яркий свет, чтобы не разгонять нервную систему вечером.',
    action: 'Сделай мягкий переход ко сну и отметь это в дневнике завтра.',
    reason: 'Сон и предсказуемый вечер дают заметный эффект на следующий день.',
    priority: 'high'
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
    title: 'Когда самопомощи уже недостаточно',
    summary: 'Критерии, при которых полезно подключить внешнюю поддержку и не оставаться с нагрузкой в одиночку.',
    tags: ['support', 'critical'],
    readTimeMinutes: 3,
    content: 'Если низкое настроение и высокий стресс держатся больше недели, а привычные способы восстановления не помогают, стоит подключить внешнюю поддержку: доверенного человека, короткую паузу от нагрузки и план безопасных действий. Это не слабость, а стратегия заботы о себе.'
  }
];