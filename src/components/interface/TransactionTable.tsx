'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Transaction, getCategoryIconAndStyle } from './transaction-utils';

export type SortField = 'date' | 'amount' | 'user';
export type SortOrder = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: Transaction[];
  onSelect: (tx: Transaction) => void;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSortChange?: (field: SortField) => void;
}

// eslint-disable-next-line react-doctor/unused-file
export function TransactionTable({
  transactions,
  onSelect,
  sortBy = 'date',
  sortOrder = 'desc',
  onSortChange,
}: TransactionTableProps) {
  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />;
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-violet-500 font-bold" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-violet-500 font-bold" />
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-xl transition-colors divide-y divide-slate-100 dark:divide-slate-800/60">
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider select-none">
        <button
          type="button"
          onClick={() => onSortChange?.('date')}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
        >
          Movimiento / Fecha {renderSortIcon('date')}
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onSortChange?.('user')}
            className="hidden sm:flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
          >
            Responsable {renderSortIcon('user')}
          </button>
          <button
            type="button"
            onClick={() => onSortChange?.('amount')}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
          >
            Importe {renderSortIcon('amount')}
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {transactions.map((tx) => {
          const { icon: Icon, bg, text, sign } = getCategoryIconAndStyle(
            tx.category || tx.comment,
            tx.type
          );

          const title = tx.comment || tx.category || `Movimiento #${tx.id}`;
          const subtitle = `${tx.date} • ${tx.category || tx.method || 'General'}`;

          return (
            <button
              key={tx.id}
              type="button"
              onClick={() => onSelect(tx)}
              className="w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
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

              <div className="flex items-center gap-6">
                <span className="hidden sm:inline text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx.user}
                </span>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-extrabold ${text}`}>
                    {sign}$ {tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                    {tx.currency}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
