import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
};
