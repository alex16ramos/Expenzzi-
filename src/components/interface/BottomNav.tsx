'use client';

import { itemsNav } from '@/lib/nav-items';

interface BottomNavProps {
  activeSection: string;
  onSectionChange: (label: string) => void;
}

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-dvw z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 flex justify-around items-center transition-colors">
      {itemsNav.map((item) => {
        const isActive = activeSection.toLowerCase() === item.label.toLowerCase();
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => {onSectionChange(item.label)}}
            className="flex flex-col items-center gap-0.5 py-1 px-10 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
          >
            <Icon
              className={`w-5 h-5 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span
              className={`text-[10px] ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
