import React from 'react';
import { Menu, ChevronDown, Tag, CreditCard, History } from 'lucide-react';
import { SortField, SortOrder } from './TransactionTable';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  query?: string;
  onQueryChange?: (val: string) => void;
  activeSection: string;
  onSectionChange: (sec: string) => void;
  userInitials?: string;
  userRole?: string;
  onMenuClick?: () => void;
  onOpenCategories?: () => void;
  onOpenSubmethods?: () => void;
  onOpenAudit?: () => void;
  onNotificationHandled?: () => void;
  interfaceId?: string | number | null;
  interfaceName?: string | null;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSortSelect?: (sortBy: SortField, sortOrder: SortOrder) => void;
}

export function Header({
  activeSection,
  onSectionChange,
  userInitials = 'SA',
  userRole = 'Visualizador',
  onMenuClick,
  onOpenCategories,
  onOpenSubmethods,
  onOpenAudit,
  onNotificationHandled,
  interfaceId,
  interfaceName,
}: HeaderProps) {
  const sections = ['Gastos', 'Ingresos', 'Ahorros', 'Resúmenes'];

  return (
    <div className="bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800/80 px-4 pt-3 pb-3 shrink-0 transition-colors">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-900 active:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Menú / Volver al Dashboard"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Section Selector */}
        <div className="relative inline-block">
          <button
            onClick={() => {
              const currIdx = sections.indexOf(activeSection);
              const nextIdx = (currIdx + 1) % sections.length;
              onSectionChange(sections[nextIdx]);
            }}
            className="flex items-center gap-1.5 text-white font-semibold text-sm hover:text-violet-400 transition-colors bg-slate-900 px-3 py-1 rounded-xl border border-slate-800"
          >
            {activeSection}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Config ABM Buttons, Notification Bell & User Avatar */}
        <div className="flex items-center gap-1.5">
          {onOpenAudit && (
            <button
              onClick={onOpenAudit}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors"
              title="Historial de Auditoría y Cambios"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {onOpenCategories && (
            <button
              onClick={onOpenCategories}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-violet-400 border border-slate-800 transition-colors"
              title="Gestión de Categorías (RF21-RF24)"
            >
              <Tag className="w-4 h-4" />
            </button>
          )}

          {onOpenSubmethods && (
            <button
              onClick={onOpenSubmethods}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 transition-colors"
              title="Submétodos de Pago (RF25-RF28)"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}

          <NotificationBell
            interfaceId={interfaceId}
            interfaceName={interfaceName}
            onNotificationHandled={onNotificationHandled}
          />

          <div
            className="w-8 h-8 rounded-full bg-violet-600 text-white text-[11px] font-semibold flex items-center justify-center shadow-md shadow-violet-600/30 ml-0.5"
            title={`Rol: ${userRole}`}
          >
            {userInitials}
          </div>
        </div>
      </div>
    </div>
  );
}
