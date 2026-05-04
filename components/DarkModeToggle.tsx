'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'bb_theme';

export function DarkModeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as
      | 'light' | 'dark' | null;
    if (stored === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  };

  return (
    <button
      onClick={toggle}
      className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-md transition flex items-center gap-2"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
