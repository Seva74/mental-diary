import { useCallback, useEffect, useState } from 'react';
import { getBlogArticles, getDashboard } from '../api';
import type { DashboardData } from '../types';

export const useDashboardData = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reloadDashboard = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      setDashboard(await getDashboard());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBlogArticles = useCallback(async () => {
    try {
      const articles = await getBlogArticles();
      setDashboard((current) => (current ? { ...current, articles } : current));
    } catch {
      // Keep existing blog content if refresh fails.
    }
  }, []);

  useEffect(() => {
    void reloadDashboard();
  }, [reloadDashboard]);

  return {
    dashboard,
    setDashboard,
    loading,
    error,
    setError,
    notice,
    setNotice,
    reloadDashboard,
    refreshBlogArticles
  };
};
