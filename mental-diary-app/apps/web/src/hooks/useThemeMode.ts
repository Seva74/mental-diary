import { useEffect, useState } from 'react';
import type { ThemeMode } from '../appTypes';

const THEME_STORAGE_KEY = 'mental-diary-theme-v1';

const readTheme = (): ThemeMode => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const useThemeMode = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore persistence failures.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return {
    theme,
    toggleTheme,
    setTheme
  };
};
