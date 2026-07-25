'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'buttons' | 'dropdown' | 'compact';
  onThemeSaved?: (theme: string) => void;
}

const emptySubscribe = () => () => {};

export function ThemeToggle({ variant = 'buttons', onThemeSaved }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="w-9 h-9 bg-slate-800/40 rounded-xl animate-pulse" />;
  }

  const activeTheme = resolvedTheme || theme;

  const handleSelectTheme = async (newTheme: string) => {
    setTheme(newTheme);
    if (onThemeSaved) {
      onThemeSaved(newTheme);
    }

    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temapreferido: newTheme }),
      });
    } catch {
      // Ignored if offline or unauthenticated
    }
  };

  if (variant === 'compact') {
    const isDark = activeTheme === 'dark';
    return (
      <button
        onClick={() => handleSelectTheme(isDark ? 'light' : 'dark')}
        className="p-2 rounded-xl bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors shadow-sm"
        title={`Cambiar tema (Actual: ${isDark ? 'Oscuro' : 'Claro'})`}
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800/80 shadow-inner">
      <button
        type="button"
        onClick={() => handleSelectTheme('light')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          theme === 'light'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : ''}`} />
        <span>Claro</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelectTheme('dark')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          theme === 'dark'
            ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : ''}`} />
        <span>Oscuro</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelectTheme('system')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          theme === 'system'
            ? 'bg-slate-300 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-400 dark:border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Sistema</span>
      </button>
    </div>
  );
}
