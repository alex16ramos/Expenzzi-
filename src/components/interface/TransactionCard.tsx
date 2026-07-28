'use client';

import React from 'react';
import { Transaction, getCategoryIconAndStyle } from './transaction-utils';

export type { Transaction };

interface TransactionCardProps {
  transaction: Transaction;
  onSelect: (tx: Transaction) => void;
}

export function TransactionCard({ transaction: tx, onSelect }: TransactionCardProps) {
  const { icon: Icon, bg, text, sign } = getCategoryIconAndStyle(
    tx.category || tx.comment,
    tx.type
  );

  const title = tx.comment || tx.category || `Movimiento #${tx.id}`;
  const subtitle = `${tx.date} • ${tx.category || tx.method || 'General'}`;

  const isInactive = tx.estado === false;

  return (
    <button
      type="button"
      onClick={() => onSelect(tx)}
      className={`w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
        isInactive ? 'opacity-60 bg-amber-500/5' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${bg} border flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            {title}
            {isInactive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                Inactivo
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`text-xs font-extrabold ${text}`}>
          {sign}$ {tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
          {tx.currency}
        </span>
      </div>
    </button>
  );
}
