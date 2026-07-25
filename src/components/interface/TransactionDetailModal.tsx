'use client';

import React from 'react';
import { X, History, Pencil, Trash2, CreditCard, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from './TransactionCard';
import { getAvatarBg, getAvatarClass } from '@/app/dashboard/perfil/page';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string | number) => void;
  onViewHistory?: (tx: Transaction) => void;
}

export function TransactionDetailModal({
  transaction: tx,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewHistory,
}: TransactionDetailModalProps) {
  if (!isOpen || !tx) return null;

  const isIngreso = tx.type === 'Ingreso';
  const isAhorro = tx.type === 'Ahorro';

  const typeBadgeClass = isIngreso
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : isAhorro
    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

  const title = tx.comment || tx.category || `Movimiento #${tx.id}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-0 md:p-4 transition-all animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl md:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeBadgeClass}`}>
              {tx.type || 'GASTO'}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Categoría: {tx.category || 'Sin categoría'} • {tx.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Currency Equivalencies Grid */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
            EQUIVALENCIA MULTI-MONEDA
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">ARS</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                $ {tx.ars || tx.amount.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">USD</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                US$ {tx.usd || '-'}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">UYU</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                $U {tx.uyu || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Método de Pago:
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">{tx.method || 'Efectivo'}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60 items-center">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-500" /> Responsable:
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full ${getAvatarBg(tx.avatar)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0`}>
                {tx.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tx.avatar} alt={tx.user} className={getAvatarClass(tx.avatar)} />
                ) : (
                  <span className="text-[9px] font-bold text-violet-400">{tx.initials}</span>
                )}
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-200">{tx.user}</span>
            </div>
          </div>

          <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> Comentario:
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-200 max-w-[200px] text-right truncate">
              {tx.comment || 'Sin comentario'}
            </span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex gap-2 pt-2">
          {onViewHistory && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onViewHistory(tx);
              }}
              className="h-9 text-xs gap-1 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10"
              title="Ver auditoría de cambios"
            >
              <History className="w-3.5 h-3.5" />
              Historial
            </Button>
          )}

          {onEdit && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onEdit(tx);
              }}
              className="flex-1 h-9 text-xs gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                onClose();
                onDelete(tx.id);
              }}
              className="h-9 text-xs gap-1.5 rounded-xl px-3"
              title="Eliminar movimiento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
