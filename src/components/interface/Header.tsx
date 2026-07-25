'use client';

import React from 'react';
import { Menu, Tag, CreditCard, History, Trash2, LogOut } from 'lucide-react';
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
  onDeleteInterface?: () => void;
  onNotificationHandled?: () => void;
  interfaceId?: string | number | null;
  interfaceName?: string | null;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSortSelect?: (sortBy: SortField, sortOrder: SortOrder) => void;
}

export function Header({
  userInitials = 'SA',
  userRole = 'Visualizador',
  onMenuClick,
  onOpenCategories,
  onOpenSubmethods,
  onOpenAudit,
  onDeleteInterface,
  onNotificationHandled,
  interfaceId,
  interfaceName,
}: HeaderProps) {
  return (
    <header className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Menú / Volver al Dashboard"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
            {interfaceName || 'Finanzas Hogar'}
          </h1>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Interfaz de Operación
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-500 border border-slate-200 dark:border-slate-700/50 transition-colors"
            title="Historial de Auditoría y Cambios"
          >
            <History className="w-4 h-4" />
          </button>
        )}

        {onOpenCategories && (
          <button
            onClick={onOpenCategories}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-violet-500 border border-slate-200 dark:border-slate-700/50 transition-colors"
            title="Gestión de Categorías"
          >
            <Tag className="w-4 h-4" />
          </button>
        )}

        {onOpenSubmethods && (
          <button
            onClick={onOpenSubmethods}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-500 border border-slate-200 dark:border-slate-700/50 transition-colors"
            title="Submétodos de Pago"
          >
            <CreditCard className="w-4 h-4" />
          </button>
        )}

        {onDeleteInterface && (
          <button
            onClick={onDeleteInterface}
            className={
              userRole === 'Administrador'
                ? 'p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors'
                : 'p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors'
            }
            title={userRole === 'Administrador' ? 'Eliminar esta Interfaz' : 'Salir de esta Interfaz'}
          >
            {userRole === 'Administrador' ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
          </button>
        )}

        <NotificationBell
          interfaceId={interfaceId}
          interfaceName={interfaceName}
          onNotificationHandled={onNotificationHandled}
        />

        <div
          className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center border border-indigo-400/30 shadow-md shadow-indigo-600/20"
          title={`Rol: ${userRole}`}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
