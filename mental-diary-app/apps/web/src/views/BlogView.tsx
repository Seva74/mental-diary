import type { DashboardData } from '../types';

interface BlogViewProps {
  dashboard: DashboardData;
}

export const BlogView = ({ dashboard }: BlogViewProps) => {
  return (
    <section className="single-column">
      <article className="card">
        <h2>ВИ6: Блог</h2>
        <div className="stack-list">
          {dashboard.articles.map((article) => (
            <div className="list-item column" key={article.id}>
              <div className="item-head"><strong>{article.title}</strong><span className="pill pill-neutral">{article.readTimeMinutes} мин</span></div>
              <p>{article.summary}</p>
              <p>{article.content}</p>
              <div className="meta">{article.tags.join(' · ')}</div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
