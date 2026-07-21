import React from 'react';
import { Menu, Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  query: string;
  onQueryChange: (val: string) => void;
  activeSection: string;
  onSectionChange: (sec: string) => void;
  userInitials?: string;
  onMenuClick?: () => void;
}

export function Header({
  query,
  onQueryChange,
  activeSection,
  onSectionChange,
  userInitials = 'SA',
  onMenuClick,
}: HeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-3 shrink-0">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="Menú"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <div className="relative inline-block">
          <button
            onClick={() => {
              const next =
                activeSection === 'Ingresos'
                  ? 'Gastos'
                  : activeSection === 'Gastos'
                  ? 'Resúmenes'
                  : 'Ingresos';
              onSectionChange(next);
            }}
            className="flex items-center gap-1 text-slate-900 font-semibold text-sm hover:text-violet-600 transition-colors"
          >
            {activeSection}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="w-8 h-8 rounded-full bg-violet-600 text-white text-[11px] font-semibold flex items-center justify-center shadow-sm shadow-violet-600/20">
          {userInitials}
        </div>
      </div>

      <div className="relative mt-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Búsqueda avanzada"
          className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm rounded-xl"
        />
      </div>
    </div>
  );
}
