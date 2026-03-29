import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createEntry, createForumPost, getBlogArticles, getDashboard } from './api';
import { DashboardData, EntryFormState, ForumFormState } from './types';

const initialEntryForm: EntryFormState = {
  moodScore: 6,
  energy: 6,
  sleepHours: 7,
  stress: 4,
  notes: '',
  tags: 'focus, reflection'
};

const initialForumForm: ForumFormState = {
  authorName: 'Гость',
  text: '',
  moodTag: 'support'
};

const formatDate = (value: string) => new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value));

const riskLabelMap: Record<DashboardData['analysis']['riskLevel'], string> = {
  low: 'Low pressure',
  moderate: 'Watch trend',
  high: 'High attention',
  critical: 'Critical profile'
};

const severityClassMap: Record<'info' | 'warning' | 'critical', string> = {
  info: 'tag tag-info',
  warning: 'tag tag-warning',
  critical: 'tag tag-critical'
};

type ViewMode = 'overview' | 'forum' | 'blog';

const App = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [entryForm, setEntryForm] = useState<EntryFormState>(initialEntryForm);
  const [forumForm, setForumForm] = useState<ForumFormState>(initialForumForm);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);
  const [savingForum, setSavingForum] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        setDashboard(await getDashboard());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (viewMode !== 'blog') {
      return;
    }

    const refreshBlog = async () => {
      if (!dashboard) {
        return;
      }

      try {
        const articles = await getBlogArticles();
        setDashboard({ ...dashboard, articles });
      } catch {
        // Keep currently loaded content when blog refresh fails.
      }
    };

    void refreshBlog();
  }, [viewMode]);

  const stats = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      { label: 'Записей', value: dashboard.analysis.entryCount.toString() },
      { label: 'Среднее настроение', value: `${dashboard.analysis.averageMood.toFixed(1)}/10` },
      { label: 'Средний стресс', value: `${dashboard.analysis.averageStress.toFixed(1)}/10` },
      {
        label: 'Тренд',
        value: dashboard.analysis.trendScore >= 0
          ? `+${dashboard.analysis.trendScore.toFixed(1)}`
          : dashboard.analysis.trendScore.toFixed(1)
      }
    ];
  }, [dashboard]);

  const updateEntryField = (field: keyof EntryFormState, value: string | number) => {
    setEntryForm((current) => ({ ...current, [field]: value }));
  };

  const updateForumField = (field: keyof ForumFormState, value: string) => {
    setForumForm((current) => ({ ...current, [field]: value }));
  };

  const onEntrySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      setSavingEntry(true);
      const response = await createEntry(entryForm);
      setDashboard(response.dashboard);
      setEntryForm((current) => ({ ...current, notes: '', tags: 'focus, reflection' }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save entry');
    } finally {
      setSavingEntry(false);
    }
  };

  const onForumSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      setSavingForum(true);
      const response = await createForumPost(forumForm);
      if (dashboard) {
        setDashboard({ ...dashboard, forumPosts: response.posts });
      }
      setForumForm((current) => ({ ...current, text: '' }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to publish forum post');
    } finally {
      setSavingForum(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Mental Diary prototype</span>
          <h1>From daily check-ins to practical support.</h1>
          <p>
            Исполняемый прототип фазы 2: дневник, аналитика, рекомендации, подбор специалистов,
            плюс прототипные модули форума и блога.
          </p>
          <div className="status-row">
            <span className="tag tag-info">API {dashboard?.storageMode || '...'}</span>
            <span className="tag tag-info">AI {dashboard?.aiProvider || '...'}</span>
            <span className={`tag ${dashboard?.analysis.riskLevel === 'critical' ? 'tag-critical' : 'tag-warning'}`}>
              {dashboard ? riskLabelMap[dashboard.analysis.riskLevel] : 'Loading'}
            </span>
          </div>
        </div>

        <div className="hero-panel">
          {loading ? (
            <div className="loader-card">Loading dashboard...</div>
          ) : dashboard ? (
            <>
              <div className="panel-title">Current pulse</div>
              <div className="pulse-score">{dashboard.analysis.averageMood.toFixed(1)}</div>
              <p className="pulse-description">{dashboard.analysis.summary}</p>
            </>
          ) : (
            <div className="loader-card">No dashboard data</div>
          )}
        </div>
      </section>

      <section className="tab-row" aria-label="Main sections">
        <button type="button" className={`tab-button ${viewMode === 'overview' ? 'tab-button-active' : ''}`} onClick={() => setViewMode('overview')}>Обзор</button>
        <button type="button" className={`tab-button ${viewMode === 'forum' ? 'tab-button-active' : ''}`} onClick={() => setViewMode('forum')}>Форум</button>
        <button type="button" className={`tab-button ${viewMode === 'blog' ? 'tab-button-active' : ''}`} onClick={() => setViewMode('blog')}>Блог</button>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {viewMode === 'overview' && (
        <>
          <section className="stats-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className="stat-label">{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section className="content-grid">
            <article className="panel panel-form">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">ВИ1</span>
                  <h2>Ввод ежедневной записи</h2>
                </div>
                <span className="panel-note">Минимум кликов</span>
              </div>

              <form className="entry-form" onSubmit={onEntrySubmit}>
                <label>
                  <span>Notes</span>
                  <textarea
                    value={entryForm.notes}
                    onChange={(event) => updateEntryField('notes', event.target.value)}
                    placeholder="Что произошло сегодня? Какие эмоции заметили?"
                    rows={5}
                    required
                  />
                </label>

                <div className="slider-grid">
                  <label>
                    <span>Mood {entryForm.moodScore}/10</span>
                    <input type="range" min="1" max="10" value={entryForm.moodScore} onChange={(event) => updateEntryField('moodScore', Number(event.target.value))} />
                  </label>
                  <label>
                    <span>Energy {entryForm.energy}/10</span>
                    <input type="range" min="1" max="10" value={entryForm.energy} onChange={(event) => updateEntryField('energy', Number(event.target.value))} />
                  </label>
                  <label>
                    <span>Stress {entryForm.stress}/10</span>
                    <input type="range" min="1" max="10" value={entryForm.stress} onChange={(event) => updateEntryField('stress', Number(event.target.value))} />
                  </label>
                  <label>
                    <span>Sleep {entryForm.sleepHours}h</span>
                    <input type="range" min="0" max="12" step="0.5" value={entryForm.sleepHours} onChange={(event) => updateEntryField('sleepHours', Number(event.target.value))} />
                  </label>
                </div>

                <label>
                  <span>Tags</span>
                  <input type="text" value={entryForm.tags} onChange={(event) => updateEntryField('tags', event.target.value)} placeholder="comma separated" />
                </label>

                <button className="primary-button" type="submit" disabled={savingEntry}>
                  {savingEntry ? 'Saving...' : 'Save entry'}
                </button>
              </form>
            </article>

            <article className="panel panel-analysis">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">ВИ2/ВИ3/ВИ4</span>
                  <h2>Аналитика, советы и специалисты</h2>
                </div>
              </div>

              {dashboard ? (
                <>
                  <p className="analysis-summary">{dashboard.analysis.summary}</p>
                  <div className="mini-metrics">
                    <div><span>Energy</span><strong>{dashboard.analysis.averageEnergy.toFixed(1)}</strong></div>
                    <div><span>Sleep</span><strong>{dashboard.analysis.averageSleepHours.toFixed(1)}h</strong></div>
                    <div><span>Risk</span><strong>{dashboard.analysis.riskLevel}</strong></div>
                  </div>

                  <div className="recommendation-list">
                    {dashboard.recommendations.map((item) => (
                      <article className="recommendation-card" key={item.id}>
                        <div className="recommendation-head">
                          <span className={severityClassMap[item.severity]}>{item.source}</span>
                          <h3>{item.title}</h3>
                        </div>
                        <p>{item.detail}</p>
                        <strong>{item.action}</strong>
                      </article>
                    ))}
                  </div>
                </>
              ) : <p className="muted-block">Waiting for data...</p>}
            </article>
          </section>

          <section className="content-grid bottom-grid">
            <article className="panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Timeline</span><h2>Recent entries</h2></div>
              </div>
              <div className="entry-list">
                {dashboard?.entries.map((entry) => (
                  <article className="entry-card" key={entry.id}>
                    <div className="entry-card-head">
                      <strong>{formatDate(entry.createdAt)}</strong>
                      <span className="tag tag-info">Mood {entry.moodScore}</span>
                    </div>
                    <p>{entry.notes}</p>
                    <div className="chips-row">
                      {entry.tags.map((tag) => <span className="chip" key={`${entry.id}-${tag}`}>{tag}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Escalation</span><h2>Подбор специалистов</h2></div>
              </div>
              <div className="specialist-list">
                {dashboard?.specialists.map((specialist) => (
                  <article className="specialist-card" key={specialist.id}>
                    <div className="specialist-top">
                      <strong>{specialist.name}</strong>
                      <span className="tag tag-warning">{specialist.specialization}</span>
                    </div>
                    <p>{specialist.reason}</p>
                    <div className="specialist-meta">
                      <span>{specialist.availability}</span>
                      <span>{specialist.contact}</span>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </section>
        </>
      )}

      {viewMode === 'forum' && (
        <section className="content-grid forum-grid">
          <article className="panel panel-form">
            <div className="panel-heading">
              <div><span className="eyebrow">ВИ5</span><h2>Форум сообщества</h2></div>
            </div>
            <form className="entry-form" onSubmit={onForumSubmit}>
              <label>
                <span>Имя</span>
                <input type="text" maxLength={40} value={forumForm.authorName} onChange={(event) => updateForumField('authorName', event.target.value)} required />
              </label>
              <label>
                <span>Тип сообщения</span>
                <select value={forumForm.moodTag} onChange={(event) => updateForumField('moodTag', event.target.value as ForumFormState['moodTag'])}>
                  <option value="support">support</option>
                  <option value="question">question</option>
                  <option value="experience">experience</option>
                </select>
              </label>
              <label>
                <span>Текст</span>
                <textarea rows={5} maxLength={500} value={forumForm.text} onChange={(event) => updateForumField('text', event.target.value)} required />
              </label>
              <button className="primary-button" type="submit" disabled={savingForum}>{savingForum ? 'Publishing...' : 'Опубликовать'}</button>
            </form>
          </article>

          <article className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Live feed</span><h2>Последние темы</h2></div></div>
            <div className="entry-list">
              {dashboard?.forumPosts.map((post) => (
                <article className="entry-card" key={post.id}>
                  <div className="entry-card-head">
                    <strong>{post.authorName}</strong>
                    <span className="tag tag-info">{post.moodTag}</span>
                  </div>
                  <p>{post.text}</p>
                  <div className="specialist-meta"><span>{formatDate(post.createdAt)}</span></div>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}

      {viewMode === 'blog' && (
        <section className="content-grid forum-grid">
          <article className="panel">
            <div className="panel-heading"><div><span className="eyebrow">ВИ6</span><h2>Блог о ментальном здоровье</h2></div></div>
            <div className="recommendation-list">
              {dashboard?.articles.map((article) => (
                <article className="recommendation-card" key={article.id}>
                  <div className="recommendation-head">
                    <span className="tag tag-warning">{article.readTimeMinutes} min</span>
                    <h3>{article.title}</h3>
                  </div>
                  <p>{article.summary}</p>
                  <p>{article.content}</p>
                  <div className="chips-row">
                    {article.tags.map((tag) => <span className="chip" key={`${article.id}-${tag}`}>{tag}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}
    </main>
  );
};

export default App;
