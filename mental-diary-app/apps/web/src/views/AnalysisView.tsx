import type { DashboardData } from '../types';

interface AnalysisViewProps {
  dashboard: DashboardData;
}

export const AnalysisView = ({ dashboard }: AnalysisViewProps) => {
  return (
    <section className="split-grid">
      <article className="card">
        <h2>AI analysis</h2>
        <p>{dashboard.analysis.summary}</p>
        <div className="metric-grid">
          <div className="metric"><span>state</span><strong>{dashboard.analysis.stateLabel}</strong></div>
          <div className="metric"><span>model</span><strong>{dashboard.analysis.modelVersion}</strong></div>
          <div className="metric"><span>confidence</span><strong>{Math.round(dashboard.analysis.confidence * 100)}%</strong></div>
          <div className="metric"><span>trend</span><strong>{dashboard.analysis.trendScore.toFixed(1)}</strong></div>
          <div className="metric"><span>energy</span><strong>{dashboard.analysis.averageEnergy.toFixed(1)}</strong></div>
          <div className="metric"><span>sleep</span><strong>{dashboard.analysis.averageSleepHours.toFixed(1)} h</strong></div>
          <div className="metric"><span>stress</span><strong>{dashboard.analysis.averageStress.toFixed(1)}</strong></div>
          <div className="metric"><span>burnout</span><strong>{Math.round(dashboard.analysis.burnoutProbability * 100)}%</strong></div>
          <div className="metric"><span>recovery</span><strong>{Math.round(dashboard.analysis.recoveryProbability * 100)}%</strong></div>
        </div>
        <div className="stack-list">
          {dashboard.analysis.factors.map((factor) => (
            <div className="list-item column" key={factor.id}>
              <div className="item-head">
                <strong>{factor.label}</strong>
                <span className={factor.direction === 'negative' ? 'pill pill-high' : 'pill pill-low'}>
                  {factor.direction}
                </span>
              </div>
              <p>{factor.detail}</p>
            </div>
          ))}
        </div>
      </article>
      <article className="card">
        <h2>Recommendations</h2>
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
      <article className="card">
        <h2>Prediction history</h2>
        <div className="stack-list">
          {dashboard.predictionHistory.length === 0 && (
            <div className="list-item column">
              <strong>No saved predictions yet</strong>
              <p>History will appear after the model evaluates real diary entries.</p>
            </div>
          )}
          {dashboard.predictionHistory.map((item) => (
            <div className="list-item column" key={item.id}>
              <div className="item-head">
                <strong>{item.stateLabel}</strong>
                <span className={item.riskLevel === 'critical' ? 'pill pill-critical' : item.riskLevel === 'high' ? 'pill pill-high' : 'pill pill-low'}>
                  {Math.round(item.confidence * 100)}%
                </span>
              </div>
              <span className="action">{item.modelVersion}</span>
              <p>{item.summary}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
