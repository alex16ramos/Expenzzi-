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

  return (
    <button
      type="button"
      onClick={() => onSelect(tx)}
      className="w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${bg} border flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
            {title}
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
