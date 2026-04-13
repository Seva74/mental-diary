import { FormEvent, useEffect, useState } from 'react';
import { createEntry, createForumPost } from './api';
import { Banner } from './components/Banner';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { useDashboardData } from './hooks/useDashboardData';
import { useOfflineEntryQueue } from './hooks/useOfflineEntryQueue';
import { useThemeMode } from './hooks/useThemeMode';
import type { ViewMode } from './appTypes';
import { formatLongDate } from './lib/date';
import { AnalysisView } from './views/AnalysisView';
import { BlogView } from './views/BlogView';
import { DiaryView } from './views/DiaryView';
import { ForumView } from './views/ForumView';
import { HomeView } from './views/HomeView';
import { SupportView } from './views/SupportView';
import type { EntryFormState, ForumFormState } from './types';

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

const isLikelyNetworkError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const text = error.message.toLowerCase();
  return text.includes('fetch') || text.includes('network') || text.includes('failed to load');
};

const App = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [entryForm, setEntryForm] = useState<EntryFormState>(initialEntryForm);
  const [forumForm, setForumForm] = useState<ForumFormState>(initialForumForm);
  const [savingEntry, setSavingEntry] = useState(false);
  const [savingForum, setSavingForum] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const { dashboard, setDashboard, loading, error, setError, notice, setNotice, reloadDashboard, refreshBlogArticles } = useDashboardData();
  const { theme, toggleTheme } = useThemeMode();
  const { pendingCount, refreshPendingCount, queueDraft, readDrafts, clearDrafts } = useOfflineEntryQueue();

  useEffect(() => {
    if (viewMode !== 'blog') {
      return;
    }

    void refreshBlogArticles();
  }, [refreshBlogArticles, viewMode]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = Boolean(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable));

      if (isTypingTarget || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const shortcutMap: Record<string, ViewMode> = {
        '1': 'home',
        '2': 'diary',
        '3': 'analysis',
        '4': 'support',
        '5': 'forum',
        '6': 'blog'
      };

      const nextView = shortcutMap[event.key];

      if (!nextView) {
        return;
      }

      event.preventDefault();
      setViewMode(nextView);
    };

    window.addEventListener('keydown', handleShortcut);

    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const updateEntryField = (field: keyof EntryFormState, value: string | number) => {
    setEntryForm((current) => ({ ...current, [field]: value }));
  };

  const updateForumField = (field: keyof ForumFormState, value: string) => {
    setForumForm((current) => ({ ...current, [field]: value }));
  };

  const syncOfflineEntries = async () => {
    const drafts = readDrafts();

    if (!Array.isArray(drafts) || drafts.length === 0) {
      setNotice('Локальных записей для синхронизации нет.');
      refreshPendingCount();
      return;
    }

    try {
      setError(null);
      setNotice(null);
      setSyncingOffline(true);

      let lastDashboard = dashboard;
      for (const draft of drafts) {
        const response = await createEntry(draft);
        lastDashboard = response.dashboard;
      }

      if (lastDashboard) {
        setDashboard(lastDashboard);
      }

      clearDrafts();
      refreshPendingCount();
      setNotice(`Синхронизировано локальных записей: ${drafts.length}.`);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Не удалось синхронизировать локальные записи.');
    } finally {
      setSyncingOffline(false);
    }
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
        queueDraft(entryForm);
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

  const subtitle = `ВИ1-ВИ4 реализованы как ядро, ВИ5-ВИ6 как прототипы · ${formatLongDate(new Date())}`;

  return (
    <main className="screen">
      <Sidebar activeView={viewMode} onSelectView={setViewMode} />

      <section className="main">
        <Topbar
          title="Mental Diary"
          subtitle={`${subtitle} · Alt+1-6 для навигации`}
          dashboard={dashboard}
          theme={theme}
          onToggleTheme={toggleTheme}
          onReload={() => void reloadDashboard()}
          pendingOfflineEntries={pendingCount}
          syncingOffline={syncingOffline}
          onSyncOffline={() => void syncOfflineEntries()}
        />

        <div className="content">
          {error && <Banner kind="error">{error}</Banner>}
          {notice && <Banner kind="notice">{notice}</Banner>}
          {loading && <Banner kind="loading">Загрузка данных...</Banner>}

          {!loading && dashboard && viewMode === 'home' && (
            <HomeView
              dashboard={dashboard}
              onOpenDiary={() => setViewMode('diary')}
              onOpenAnalysis={() => setViewMode('analysis')}
            />
          )}

          {!loading && dashboard && viewMode === 'diary' && (
            <DiaryView
              dashboard={dashboard}
              entryForm={entryForm}
              onEntryFieldChange={updateEntryField}
              onSubmit={onEntrySubmit}
              saving={savingEntry}
              pendingOfflineEntries={pendingCount}
              syncingOffline={syncingOffline}
              onSyncOffline={() => void syncOfflineEntries()}
            />
          )}

          {!loading && dashboard && viewMode === 'analysis' && <AnalysisView dashboard={dashboard} />}
          {!loading && dashboard && viewMode === 'support' && <SupportView dashboard={dashboard} />}
          {!loading && dashboard && viewMode === 'forum' && (
            <ForumView
              dashboard={dashboard}
              forumForm={forumForm}
              onForumFieldChange={updateForumField}
              onSubmit={onForumSubmit}
              saving={savingForum}
            />
          )}
          {!loading && dashboard && viewMode === 'blog' && <BlogView dashboard={dashboard} />}
        </div>
      </section>
    </main>
  );
};

export default App;
