import type { DashboardData } from '../types';

interface AnalysisViewProps {
  dashboard: DashboardData;
}

export const AnalysisView = ({ dashboard }: AnalysisViewProps) => {
  return (
    <section className="split-grid">
      <article className="card">
        <h2>ВИ2: Аналитика тенденций</h2>
        <p>{dashboard.analysis.summary}</p>
        <div className="metric-grid">
          <div className="metric"><span>Тренд</span><strong>{dashboard.analysis.trendScore.toFixed(1)}</strong></div>
          <div className="metric"><span>Энергия</span><strong>{dashboard.analysis.averageEnergy.toFixed(1)}</strong></div>
          <div className="metric"><span>Сон</span><strong>{dashboard.analysis.averageSleepHours.toFixed(1)} ч</strong></div>
          <div className="metric"><span>Стресс</span><strong>{dashboard.analysis.averageStress.toFixed(1)}</strong></div>
        </div>
      </article>
      <article className="card">
        <h2>ВИ3: Рекомендации</h2>
        <div className="stack-list">
          {dashboard.recommendations.map((item) => (
            <div className="list-item column" key={item.id}>
              <div className="item-head">
                <strong>{item.title}</strong>
                <span className={item.severity === 'critical' ? 'pill pill-critical' : item.severity === 'warning' ? 'pill pill-high' : 'pill pill-low'}>{item.source}</span>
              </div>
              <p>{item.detail}</p>
              <span className="action">{item.action}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
