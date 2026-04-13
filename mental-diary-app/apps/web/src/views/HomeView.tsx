import type { DashboardData } from '../types';
import {
  buildHomeInsight,
  buildSparklinePath,
  formatTrendDelta,
  getRecentMetricSeries,
  riskLabelMap,
  riskPillClassMap,
  type TrendMetricKey
} from '../lib/dashboard';
import { formatDate, formatFreshness } from '../lib/date';

interface HomeViewProps {
  dashboard: DashboardData;
  onOpenDiary: () => void;
  onOpenAnalysis: () => void;
}

const metricCards: Array<{
  key: TrendMetricKey;
  label: string;
  suffix: string;
  note: string;
}> = [
  { key: 'moodScore', label: 'Настроение', suffix: '/10', note: 'Последние 7 записей' },
  { key: 'energy', label: 'Энергия', suffix: '/10', note: 'Восстановление и ресурс' },
  { key: 'sleepHours', label: 'Сон', suffix: ' ч', note: 'Время восстановления' },
  { key: 'stress', label: 'Стресс', suffix: '/10', note: 'Нагрузка и давление' }
];

const getMetricValue = (dashboard: DashboardData, key: TrendMetricKey) => {
  switch (key) {
    case 'moodScore':
      return dashboard.analysis.averageMood;
    case 'energy':
      return dashboard.analysis.averageEnergy;
    case 'sleepHours':
      return dashboard.analysis.averageSleepHours;
    case 'stress':
      return dashboard.analysis.averageStress;
  }
};

const getMetricTrendClass = (key: TrendMetricKey, delta: number) => {
  if (Math.abs(delta) < 0.15) {
    return 'pill pill-neutral';
  }

  const improvement = key === 'stress' ? delta < 0 : delta > 0;
  return improvement ? 'pill pill-low' : 'pill pill-high';
};

export const HomeView = ({ dashboard, onOpenDiary, onOpenAnalysis }: HomeViewProps) => {
  const insight = buildHomeInsight(dashboard);
  const latestEntry = dashboard.entries[0];

  return (
    <>
      <section className="hero-grid">
        <article className={`card hero-card risk-${dashboard.analysis.riskLevel}`}>
          <div className="hero-kicker">Панель состояния</div>
          <div className="hero-head">
            <div>
              <h2>Текущий срез состояния</h2>
              <p>{dashboard.analysis.summary}</p>
            </div>
            <span className={riskPillClassMap[dashboard.analysis.riskLevel]}>{riskLabelMap[dashboard.analysis.riskLevel]}</span>
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={onOpenDiary}>Записать день</button>
            <button type="button" className="ghost-btn" onClick={onOpenAnalysis}>Открыть аналитику</button>
          </div>

          <div className="hero-meta-grid">
            <div className="meta-chip">
              <strong>Записей</strong>
              <span>{dashboard.analysis.entryCount}</span>
            </div>
            <div className="meta-chip">
              <strong>Последняя запись</strong>
              <span>{latestEntry ? formatDate(latestEntry.createdAt) : 'Пока нет данных'}</span>
            </div>
            <div className="meta-chip">
              <strong>Свежесть</strong>
              <span>{latestEntry ? formatFreshness(latestEntry.createdAt) : 'С нуля'}</span>
            </div>
          </div>
        </article>

        <article className={`card insight-card risk-${insight.tone}`}>
          <div className="hero-kicker">Следующий шаг</div>
          <h2>{insight.title}</h2>
          <p>{insight.detail}</p>
          <div className="insight-footer">
            <span className={riskPillClassMap[insight.tone]}>{insight.eyebrow}</span>
            <span className="action">{insight.action}</span>
          </div>
          <div className="system-notes">
            <p>AI: {dashboard.system.ai.mode} · {dashboard.system.ai.provider}</p>
            <p>Поддержка: {dashboard.system.support.mode} · {dashboard.system.support.provider}</p>
            <p>Хранилище: {dashboard.system.storageMode}</p>
          </div>
        </article>
      </section>

      <section className="stats-grid">
        {metricCards.map((metric) => {
          const series = getRecentMetricSeries(dashboard.entries, metric.key, 7);
          const value = getMetricValue(dashboard, metric.key);
          const firstValue = series[0] ?? value;
          const lastValue = series[series.length - 1] ?? value;
          const delta = series.length > 1 ? lastValue - firstValue : 0;

          return (
            <article className={`card metric-card metric-card--${metric.key}`} key={metric.label}>
              <div className="metric-card-head">
                <div className="label">{metric.label}</div>
                <span className={getMetricTrendClass(metric.key, delta)}>{series.length > 1 ? formatTrendDelta(delta, metric.suffix) : 'нет истории'}</span>
              </div>

              <div className="metric-card-value">{value.toFixed(1)}{metric.suffix}</div>

              <svg className="sparkline" viewBox="0 0 100 36" role="img" aria-label={`${metric.label} за последние записи`}>
                <path d={buildSparklinePath(series)} className="sparkline-path" />
              </svg>

              <div className="metric-card-note">{metric.note}</div>
            </article>
          );
        })}
      </section>

      <section className="split-grid">
        <article className="card">
          <h2>Интеграции и контракт</h2>
          <div className="integration-grid">
            <div className="integration-chip"><strong>AI</strong><span>{dashboard.system.ai.mode}</span><div className="meta">{dashboard.system.ai.provider}</div></div>
            <div className="integration-chip"><strong>Поддержка</strong><span>{dashboard.system.support.mode}</span><div className="meta">{dashboard.system.support.provider}</div></div>
            <div className="integration-chip"><strong>Хранилище</strong><span>{dashboard.system.storageMode}</span><div className="meta">{dashboard.analysis.entryCount} записей</div></div>
          </div>
          <div className="system-notes">
            <p>{dashboard.system.ai.description}</p>
            <p>{dashboard.system.support.description}</p>
          </div>
        </article>

        <article className="card">
          <h2>Последние записи</h2>
          <div className="stack-list">
            {dashboard.entries.slice(0, 3).map((entry) => (
              <div className="list-item" key={entry.id}>
                <div>
                  <strong>{formatDate(entry.createdAt)}</strong>
                  <p>{entry.notes}</p>
                  <div className="entry-tags">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span className="pill pill-neutral" key={`${entry.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span className={entry.moodScore >= 7 ? 'pill pill-low' : entry.moodScore <= 4 ? 'pill pill-high' : 'pill pill-neutral'}>{entry.moodScore}/10</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
};
