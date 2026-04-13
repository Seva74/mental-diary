import { useCallback, useEffect, useState } from 'react';
import type { EntryFormState } from '../types';

const OFFLINE_DRAFTS_KEY = 'mental-diary-offline-entries-v2';

const readOfflineDrafts = (): EntryFormState[] => {
  try {
    const raw = window.localStorage.getItem(OFFLINE_DRAFTS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as EntryFormState[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistOfflineDrafts = (drafts: EntryFormState[]) => {
  window.localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
};

export const useOfflineEntryQueue = () => {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(() => {
    setPendingCount(readOfflineDrafts().length);
  }, []);

  const queueDraft = useCallback((draft: EntryFormState) => {
    const drafts = readOfflineDrafts();
    drafts.push(draft);
    persistOfflineDrafts(drafts);
    setPendingCount(drafts.length);
    return drafts.length;
  }, []);

  const readDrafts = useCallback(() => readOfflineDrafts(), []);

  const clearDrafts = useCallback(() => {
    persistOfflineDrafts([]);
    setPendingCount(0);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  return {
    pendingCount,
    refreshPendingCount,
    queueDraft,
    readDrafts,
    clearDrafts
  };
};
