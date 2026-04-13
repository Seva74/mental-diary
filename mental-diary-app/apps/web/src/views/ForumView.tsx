import type { FormEvent } from 'react';
import type { DashboardData, ForumFormState } from '../types';
import { formatDate } from '../lib/date';

interface ForumViewProps {
  dashboard: DashboardData;
  forumForm: ForumFormState;
  onForumFieldChange: (field: keyof ForumFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}

export const ForumView = ({ dashboard, forumForm, onForumFieldChange, onSubmit, saving }: ForumViewProps) => {
  return (
    <section className="split-grid">
      <article className="card">
        <h2>ВИ5: Форум</h2>
        <form className="form" onSubmit={onSubmit}>
          <label><span>Имя</span><input type="text" maxLength={40} value={forumForm.authorName} onChange={(event) => onForumFieldChange('authorName', event.target.value)} required /></label>
          <label>
            <span>Тип сообщения</span>
            <select value={forumForm.moodTag} onChange={(event) => onForumFieldChange('moodTag', event.target.value as ForumFormState['moodTag'])}>
              <option value="support">support</option>
              <option value="question">question</option>
              <option value="experience">experience</option>
            </select>
          </label>
          <label><span>Текст</span><textarea rows={5} maxLength={500} value={forumForm.text} onChange={(event) => onForumFieldChange('text', event.target.value)} required /></label>
          <button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Публикуем...' : 'Опубликовать'}</button>
        </form>
      </article>
      <article className="card">
        <h2>Лента обсуждений</h2>
        <div className="stack-list">
          {dashboard.forumPosts.map((post) => (
            <div className="list-item column" key={post.id}>
              <div className="item-head"><strong>{post.authorName}</strong><span className="pill pill-neutral">{post.moodTag}</span></div>
              <p>{post.text}</p>
              <div className="meta">{formatDate(post.createdAt)}</div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
};
