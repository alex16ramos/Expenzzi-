'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Pencil, Trash2, CreditCard, User, MessageSquare, Tag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from './TransactionCard';

interface TransactionDetailPanelProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string | number) => void;
  onViewHistory?: (tx: Transaction) => void;
  isInline?: boolean;
}

export function TransactionDetailPanel({
  transaction: tx,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewHistory,
  isInline = false,
}: TransactionDetailPanelProps) {
  if (!tx) return null;

  const isIngreso = tx.type === 'Ingreso';
  const isAhorro = tx.type === 'Ahorro';

  const typeBadgeClass = isIngreso
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : isAhorro
    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

  const title = tx.comment || tx.category || `Movimiento #${tx.id}`;

  const detailBody = (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${typeBadgeClass}`}>
              {tx.type || 'GASTO'}
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" /> {tx.date}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Cerrar detalles"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Currency Equivalencies Grid */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block uppercase tracking-wider">
            Desglose Multi-Moneda
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ARS</span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                $ {tx.ars || tx.amount.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">USD</span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 truncate block">
                US$ {tx.usd || '-'}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">UYU</span>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 truncate block">
                $U {tx.uyu || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Information Rows */}
        <div className="space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/50">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <Tag className="w-4 h-4 text-indigo-500" /> Categoría:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{tx.category || 'General'}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Método de Pago:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{tx.method || 'Efectivo'}</span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <User className="w-4 h-4 text-purple-500" /> Responsable:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{tx.user}</span>
          </div>

          <div className="flex justify-between items-start py-1.5">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <MessageSquare className="w-4 h-4 text-amber-500" /> Comentario:
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 max-w-[180px] text-right">
              {tx.comment || 'Sin comentario'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
        {onViewHistory && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onViewHistory(tx);
            }}
            className="h-10 text-xs gap-1.5 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 font-semibold"
          >
            <History className="w-4 h-4" /> Historial
          </Button>
        )}

        {onEdit && (
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onEdit(tx);
            }}
            className="flex-1 h-10 text-xs gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20"
          >
            <Pencil className="w-4 h-4" /> Editar
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
            className="h-10 text-xs gap-1.5 rounded-xl px-3"
            title="Eliminar movimiento"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </>
  );

  if (isInline) {
    return isOpen ? (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-lg flex flex-col justify-between min-h-[420px]">
        {detailBody}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            role="presentation"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 z-10 flex flex-col justify-between overflow-y-auto"
          >
            {detailBody}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
