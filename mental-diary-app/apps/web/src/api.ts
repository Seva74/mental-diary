import { AuthSessionPayload, DashboardData, EntryFormState, ForumFormState, SystemMeta } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const sessionStorageKey = 'mental-diary-session-token';
let activeSessionToken: string | null = null;

const buildUrl = (path: string) => {
  if (baseUrl.endsWith('/')) {
    return `${baseUrl.slice(0, -1)}${path}`;
  }

  return `${baseUrl}${path}`;
};

const readStoredSessionToken = () => {
  if (activeSessionToken) {
    return activeSessionToken;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  activeSessionToken = window.localStorage.getItem(sessionStorageKey);
  return activeSessionToken;
};

const storeSessionToken = (token: string) => {
  activeSessionToken = token;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(sessionStorageKey, token);
  }
};

const clearSessionToken = () => {
  activeSessionToken = null;

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(sessionStorageKey);
  }
};

const requestPublicJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
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

const createGuestSession = async () => {
  const payload = await requestPublicJson<AuthSessionPayload>('/auth/guest-session', {
    method: 'POST',
    body: JSON.stringify({})
  });
  storeSessionToken(payload.session.token);
  return payload;
};

const ensureSessionToken = async () => {
  const existingToken = readStoredSessionToken();

  if (existingToken) {
    return existingToken;
  }

  const session = await createGuestSession();
  return session.session.token;
};

const requestJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = await ensureSessionToken();
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {})
    },
    ...options
  });

  if (response.status === 401) {
    clearSessionToken();

    if (token) {
      const renewedToken = await ensureSessionToken();
      const retryResponse = await fetch(buildUrl(path), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${renewedToken}`,
          ...(options?.headers || {})
        },
        ...options
      });

      if (!retryResponse.ok) {
        const payload = await retryResponse.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || `Request failed with status ${retryResponse.status}`);
      }

      return retryResponse.json() as Promise<T>;
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const getDashboard = () => requestJson<DashboardData>('/dashboard');

export const getSystemMeta = () => requestPublicJson<SystemMeta>('/system/meta');

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
  requestPublicJson<{ post: DashboardData['forumPosts'][number]; posts: DashboardData['forumPosts'] }>('/forum/posts', {
    method: 'POST',
    body: JSON.stringify(form)
  });

export const getBlogArticles = () => requestPublicJson<DashboardData['articles']>('/blog/articles');
