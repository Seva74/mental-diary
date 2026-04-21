import type { DashboardData } from '../types';

interface SupportViewProps {
  dashboard: DashboardData;
}

const priorityClassMap: Record<'low' | 'medium' | 'high', string> = {
  low: 'pill pill-low',
  medium: 'pill pill-moderate',
  high: 'pill pill-high'
};

export const SupportView = ({ dashboard }: SupportViewProps) => {
  return (
    <section className="single-column">
      <article className="card">
        <h2>План поддержки и безопасные действия</h2>
        <p>Это не медицинский маршрут и не список врачей. Здесь собраны короткие действия, которые помогают стабилизироваться, не перегружая систему.</p>
        <div className="stack-list" style={{ marginTop: '16px' }}>
          {dashboard.supportActions.map((item) => (
            <div className="list-item column" key={item.id}>
              <div className="item-head">
                <strong>{item.title}</strong>
                <span className={priorityClassMap[item.priority]}>{item.priority}</span>
              </div>
              <p>{item.summary}</p>
              <p>{item.reason}</p>
              <span className="action">{item.action}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};