import { DashboardData, EntryFormState, ForumFormState } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const buildUrl = (path: string) => {
  if (baseUrl.endsWith('/')) {
    return `${baseUrl.slice(0, -1)}${path}`;
  }

  return `${baseUrl}${path}`;
};

const requestJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const getDashboard = () => requestJson<DashboardData>('/dashboard');

export const createEntry = (form: EntryFormState) =>
  requestJson<{ entry: DashboardData['entries'][number]; dashboard: DashboardData }>('/entries', {
    method: 'POST',
    body: JSON.stringify({
      moodScore: Number(form.moodScore),
      energy: Number(form.energy),
      sleepHours: Number(form.sleepHours),
      stress: Number(form.stress),
      notes: form.notes,
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    })
  });

export const createForumPost = (form: ForumFormState) =>
  requestJson<{ post: DashboardData['forumPosts'][number]; posts: DashboardData['forumPosts'] }>('/forum/posts', {
    method: 'POST',
    body: JSON.stringify(form)
  });

export const getBlogArticles = () => requestJson<DashboardData['articles']>('/blog/articles');