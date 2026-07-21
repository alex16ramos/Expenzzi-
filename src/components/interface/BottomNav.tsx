import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, PieChart } from 'lucide-react';

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS = [
  { label: 'Gastos', icon: ArrowUpCircle },
  { label: 'Ingresos', icon: ArrowDownCircle },
  { label: 'Resúmenes', icon: PieChart },
];

interface BottomNavProps {
  activeSection: string;
  onSectionChange: (label: string) => void;
}

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  return (
    <div className="grid grid-cols-3 border-t border-slate-200 bg-white pb-1.5 pt-2 shrink-0">
      {NAV_ITEMS.map((item) => {
        const isActive = activeSection.toLowerCase() === item.label.toLowerCase();
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => onSectionChange(item.label)}
            className="flex flex-col items-center gap-0.5 py-1 hover:bg-slate-50 transition-colors"
          >
            <Icon
              className={`w-5 h-5 ${
                isActive ? 'text-violet-600' : 'text-slate-400'
              }`}
            />
            <span
              className={`text-[11px] ${
                isActive
                  ? 'text-violet-600 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
