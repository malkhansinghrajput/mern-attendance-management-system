import { useState, useEffect } from 'react';

const THEME_KEY = 'ams_theme';

/**
 * useTheme — manages dark/light mode.
 * Persists to localStorage under key 'ams_theme'.
 * Applies data-theme="light" | "dark" to <html> element.
 * Default is 'dark' (matching the existing design system).
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return { theme, isDark, toggleTheme };
};
