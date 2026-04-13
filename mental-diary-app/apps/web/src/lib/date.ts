export const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value));

export const formatLongDate = (date: Date) => new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(date);

const DAY_MS = 24 * 60 * 60 * 1000;

const safeTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const getDaysSince = (value: string, reference = new Date()) => {
  const timestamp = safeTimestamp(value);

  if (timestamp === null) {
    return 0;
  }

  return Math.max(0, Math.floor((reference.getTime() - timestamp) / DAY_MS));
};

export const formatFreshness = (value: string, reference = new Date()) => {
  const daysSince = getDaysSince(value, reference);

  if (daysSince <= 0) {
    return 'сегодня';
  }

  if (daysSince === 1) {
    return 'вчера';
  }

  if (daysSince < 7) {
    return `${daysSince} дн. назад`;
  }

  const weeksSince = Math.floor(daysSince / 7);
  return weeksSince === 1 ? '1 нед. назад' : `${weeksSince} нед. назад`;
};
