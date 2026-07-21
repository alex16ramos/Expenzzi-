import React from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Transaction {
  id: string | number;
  date: string;
  user: string;
  initials: string;
  amount: number;
  currency: 'ARS' | 'USD' | 'UYU' | string;
  ars: string;
  usd: string;
  comment: string;
  method: string;
}

export const CURRENCY_STYLE: Record<string, string> = {
  ARS: 'bg-violet-100 text-violet-700',
  USD: 'bg-emerald-100 text-emerald-700',
  UYU: 'bg-amber-100 text-amber-700',
};

interface TransactionCardProps {
  transaction: Transaction;
  isOpen: boolean;
  onToggle: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string | number) => void;
}

export function TransactionCard({
  transaction: tx,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const currencyBadgeClass =
    CURRENCY_STYLE[tx.currency] || 'bg-slate-100 text-slate-700';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:border-slate-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left active:bg-slate-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold flex items-center justify-center shrink-0">
          {tx.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {tx.user}
          </p>
          <p className="text-xs text-slate-500">{tx.date}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-slate-900">
            {tx.amount.toLocaleString('es-AR')}
          </p>
          <span
            className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${currencyBadgeClass}`}
          >
            {tx.currency}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-3 mt-2">
            <div>
              <dt className="text-slate-400">Equiv. ARS</dt>
              <dd className="text-slate-700 font-medium">$ {tx.ars}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Equiv. USD</dt>
              <dd className="text-slate-700 font-medium">US$ {tx.usd}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400">Comentario</dt>
              <dd className="text-slate-700">{tx.comment || '-'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400">Método de pago</dt>
              <dd className="text-slate-700">{tx.method || '-'}</dd>
            </div>
          </dl>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(tx)}
              className="flex-1 h-8 text-xs gap-1.5 rounded-lg"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modificar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete?.(tx.id)}
              className="flex-1 h-8 text-xs gap-1.5 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
