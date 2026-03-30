import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createEntry, createForumPost, getBlogArticles, getDashboard } from './api';
import { DashboardData, EntryFormState, ForumFormState } from './types';

const OFFLINE_DRAFTS_KEY = 'mental-diary-offline-entries-v1';

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

const todayLabel = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(new Date());

const riskLabelMap: Record<DashboardData['analysis']['riskLevel'], string> = {
  low: 'Стабильный профиль',
  moderate: 'Нужна динамика',
  high: 'Повышенное внимание',
  critical: 'Критический профиль'
};

const riskClassMap: Record<DashboardData['analysis']['riskLevel'], string> = {
  low: 'pill pill-low',
  moderate: 'pill pill-moderate',
  high: 'pill pill-high',
  critical: 'pill pill-critical'
};

const severityClassMap: Record<'info' | 'warning' | 'critical', string> = {
  info: 'pill pill-low',
  warning: 'pill pill-high',
  critical: 'pill pill-critical'
};

type ViewMode = 'home' | 'diary' | 'analysis' | 'specialists' | 'forum' | 'blog';
type ThemeMode = 'light' | 'dark';

const readOfflineDrafts = (): EntryFormState[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as EntryFormState[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeOfflineDrafts = (drafts: EntryFormState[]) => {
  localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
};

const isLikelyNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const text = error.message.toLowerCase();
  return text.includes('fetch') || text.includes('network') || text.includes('failed to load');
};

const App = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [entryForm, setEntryForm] = useState<EntryFormState>(initialEntryForm);
  const [forumForm, setForumForm] = useState<ForumFormState>(initialForumForm);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [loading, setLoading] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);
  const [savingForum, setSavingForum] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [pendingOfflineEntries, setPendingOfflineEntries] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('light');

  const loadDashboard = async () => {
    setError(null);
    setLoading(true);

    try {
      setDashboard(await getDashboard());
      setPendingOfflineEntries(readOfflineDrafts().length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные.');
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineEntries = async () => {
    const drafts = readOfflineDrafts();

    if (drafts.length === 0) {
      setPendingOfflineEntries(0);
      setNotice('Локальных записей для синхронизации нет.');
      return;
    }

    setSyncingOffline(true);

    try {
      let lastDashboard: DashboardData | null = null;

      for (const draft of drafts) {
        const response = await createEntry(draft);
        lastDashboard = response.dashboard;
      }

      if (lastDashboard) {
        setDashboard(lastDashboard);
      }

      writeOfflineDrafts([]);
      setPendingOfflineEntries(0);
      setNotice(`Синхронизировано локальных записей: ${drafts.length}.`);
      setError(null);
    } catch {
      setError('Не удалось синхронизировать локальные записи. Проверьте соединение и повторите.');
    } finally {
      setSyncingOffline(false);
    }
  };

  useEffect(() => {
    setPendingOfflineEntries(readOfflineDrafts().length);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (viewMode !== 'blog') {
      return;
    }

    const refreshBlog = async () => {
      try {
        const articles = await getBlogArticles();
        setDashboard((current) => (current ? { ...current, articles } : current));
      } catch {
        // Keep existing blog data when refresh fails.
      }
    };

    void refreshBlog();
  }, [viewMode]);

  const stats = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      { label: 'Настроение', value: `${dashboard.analysis.averageMood.toFixed(1)}/10` },
      { label: 'Стресс', value: `${dashboard.analysis.averageStress.toFixed(1)}/10` },
      { label: 'Сон', value: `${dashboard.analysis.averageSleepHours.toFixed(1)} ч` },
      { label: 'Записи', value: dashboard.analysis.entryCount.toString() }
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
      setNotice(null);
      setSavingEntry(true);
      const response = await createEntry(entryForm);
      setDashboard(response.dashboard);
      setEntryForm((current) => ({ ...current, notes: '', tags: 'focus, reflection' }));
      setViewMode('analysis');
      setNotice('Запись успешно сохранена.');
    } catch (submitError) {
      if (isLikelyNetworkError(submitError)) {
        const drafts = readOfflineDrafts();
        drafts.push(entryForm);
        writeOfflineDrafts(drafts);
        setPendingOfflineEntries(drafts.length);
        setEntryForm((current) => ({ ...current, notes: '', tags: 'focus, reflection' }));
        setNotice('Сеть недоступна: запись сохранена локально и будет отправлена позже.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить запись.');
      }
    } finally {
      setSavingEntry(false);
    }
  };

  const onForumSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError(null);
      setNotice(null);
      setSavingForum(true);
      const response = await createForumPost(forumForm);
      setDashboard((current) => (current ? { ...current, forumPosts: response.posts } : current));
      setForumForm((current) => ({ ...current, text: '' }));
      setNotice('Сообщение опубликовано.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось опубликовать сообщение.');
    } finally {
      setSavingForum(false);
    }
  };

  return (
    <main className="screen">
      <aside className="sidebar">
        <h1 className="logo">Mental<span>.</span></h1>
        <nav className="menu">
          <button type="button" className={viewMode === 'home' ? 'menu-item active' : 'menu-item'} onClick={() => setViewMode('home')}>Главная</button>
          <button type="button" className={viewMode === 'diary' ? 'menu-item active' : 'menu-item'} onClick={() => setViewMode('diary')}>Дневник</button>
          <button type="button" className={viewMode === 'analysis' ? 'menu-item active' : 'menu-item'} onClick={() => setViewMode('analysis')}>Аналитика</button>
          <button type="button" className={viewMode === 'specialists' ? 'menu-item active' : 'menu-item'} onClick={() => setViewMode('specialists')}>Специалисты</button>
          <button type="button" className={viewMode === 'forum' ? 'menu-item active' : 'menu-item'} onClick={() => setViewMode('forum')}>Форум</button>
          <button type="button" className={viewMode === 'blog' ? 'menu-item active' : 'menu-item'} onClick={() => setViewMode('blog')}>Блог</button>
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <strong className="top-title">{todayLabel}</strong>
            <div className="top-subtitle">ВИ1-ВИ4 реализованы как ядро, ВИ5-ВИ6 как прототипы</div>
          </div>
          <div className="top-actions">
            <span className="pill pill-neutral">API {dashboard?.storageMode || '...'}</span>
            <span className="pill pill-neutral">AI {dashboard?.aiProvider || '...'}</span>
            <span className="pill pill-neutral">Spec {dashboard?.specialistProvider || '...'}</span>
            {dashboard && <span className={riskClassMap[dashboard.analysis.riskLevel]}>{riskLabelMap[dashboard.analysis.riskLevel]}</span>}
            <button type="button" className="ghost-btn" onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}>
              {/* Тема: {theme === 'light' ? 'Светлая' : 'Темная'} */} Настройки
            </button>
            <button type="button" className="ghost-btn" onClick={() => void loadDashboard()}>Профиль</button>
          </div>
        </header>

        <div className="content">
          {error && <div className="error-banner">{error}</div>}
          {notice && <div className="notice-banner">{notice}</div>}
          {loading && <div className="loader">Загрузка данных...</div>}

          {!loading && dashboard && viewMode === 'home' && (
            <>
              <section className="stats-grid">
                {stats.map((stat) => (
                  <article className="card" key={stat.label}>
                    <div className="label">{stat.label}</div>
                    <div className="value">{stat.value}</div>
                  </article>
                ))}
              </section>
              <section className="split-grid">
                <article className="card">
                  <h2>Общий срез состояния</h2>
                  <p>{dashboard.analysis.summary}</p>
                  <div className="buttons-row">
                    <button type="button" className="primary-btn" onClick={() => setViewMode('diary')}>Заполнить запись дня</button>
                    <button type="button" className="ghost-btn" onClick={() => setViewMode('analysis')}>Открыть аналитику</button>
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
                        </div>
                        <span className="pill pill-neutral">Mood {entry.moodScore}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          )}

          {!loading && dashboard && viewMode === 'diary' && (
            <section className="single-column">
              <article className="card">
                <h2>ВИ1: Ввод ежедневной записи</h2>
                {pendingOfflineEntries > 0 && (
                  <div className="offline-row">
                    <span>Локальных записей: {pendingOfflineEntries}</span>
                    <button type="button" className="ghost-btn" onClick={() => void syncOfflineEntries()} disabled={syncingOffline || savingEntry}>
                      {syncingOffline ? 'Синхронизация...' : 'Синхронизировать'}
                    </button>
                  </div>
                )}
                <form className="form" onSubmit={onEntrySubmit}>
                  <label>
                    <span>События и эмоции</span>
                    <textarea
                      value={entryForm.notes}
                      onChange={(event) => updateEntryField('notes', event.target.value)}
                      placeholder="Что произошло и как это повлияло на состояние?"
                      rows={5}
                      required
                    />
                  </label>
                  <div className="sliders">
                    <label><span>Настроение {entryForm.moodScore}/10</span><input type="range" min="1" max="10" value={entryForm.moodScore} onChange={(event) => updateEntryField('moodScore', Number(event.target.value))} /></label>
                    <label><span>Энергия {entryForm.energy}/10</span><input type="range" min="1" max="10" value={entryForm.energy} onChange={(event) => updateEntryField('energy', Number(event.target.value))} /></label>
                    <label><span>Стресс {entryForm.stress}/10</span><input type="range" min="1" max="10" value={entryForm.stress} onChange={(event) => updateEntryField('stress', Number(event.target.value))} /></label>
                    <label><span>Сон {entryForm.sleepHours} ч</span><input type="range" min="0" max="12" step="0.5" value={entryForm.sleepHours} onChange={(event) => updateEntryField('sleepHours', Number(event.target.value))} /></label>
                  </div>
                  <label>
                    <span>Теги</span>
                    <input type="text" value={entryForm.tags} onChange={(event) => updateEntryField('tags', event.target.value)} placeholder="focus, stress, walk" />
                  </label>
                  <button type="submit" className="primary-btn" disabled={savingEntry}>{savingEntry ? 'Сохраняем...' : 'Сохранить запись'}</button>
                </form>
              </article>
            </section>
          )}

          {!loading && dashboard && viewMode === 'analysis' && (
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
                        <span className={severityClassMap[item.severity]}>{item.source}</span>
                      </div>
                      <p>{item.detail}</p>
                      <span className="action">{item.action}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {!loading && dashboard && viewMode === 'specialists' && (
            <section className="single-column">
              <article className="card">
                <h2>ВИ4: Подбор специалистов</h2>
                <div className="stack-list">
                  {dashboard.specialists.map((specialist) => (
                    <div className="list-item column" key={specialist.id}>
                      <div className="item-head">
                        <strong>{specialist.name}</strong>
                        <span className="pill pill-high">{specialist.specialization}</span>
                      </div>
                      <p>{specialist.reason}</p>
                      <div className="meta">{specialist.availability} · {specialist.contact}</div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {!loading && dashboard && viewMode === 'forum' && (
            <section className="split-grid">
              <article className="card">
                <h2>ВИ5: Форум</h2>
                <form className="form" onSubmit={onForumSubmit}>
                  <label><span>Имя</span><input type="text" maxLength={40} value={forumForm.authorName} onChange={(event) => updateForumField('authorName', event.target.value)} required /></label>
                  <label>
                    <span>Тип сообщения</span>
                    <select value={forumForm.moodTag} onChange={(event) => updateForumField('moodTag', event.target.value as ForumFormState['moodTag'])}>
                      <option value="support">support</option>
                      <option value="question">question</option>
                      <option value="experience">experience</option>
                    </select>
                  </label>
                  <label><span>Текст</span><textarea rows={5} maxLength={500} value={forumForm.text} onChange={(event) => updateForumField('text', event.target.value)} required /></label>
                  <button type="submit" className="primary-btn" disabled={savingForum}>{savingForum ? 'Публикуем...' : 'Опубликовать'}</button>
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
          )}

          {!loading && dashboard && viewMode === 'blog' && (
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
          )}
        </div>
      </section>
    </main>
  );
};

export default App;
