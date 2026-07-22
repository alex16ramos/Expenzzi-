import React from 'react';
import { ChevronDown, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction, CURRENCY_STYLE } from './TransactionCard';

export type SortField = 'date' | 'amount' | 'user';
export type SortOrder = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: Transaction[];
  expandedId: string | number | null;
  onToggle: (id: string | number) => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string | number) => void;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  onSortChange?: (field: SortField) => void;
}

export function TransactionTable({
  transactions,
  expandedId,
  onToggle,
  onEdit,
  onDelete,
  sortBy = 'date',
  sortOrder = 'desc',
  onSortChange,
}: TransactionTableProps) {
  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />;
    return sortOrder === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 text-violet-400 font-bold" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 text-violet-400 font-bold" />
    );
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider select-none">
          <tr>
            <th className="py-3.5 px-4">
              <button
                onClick={() => onSortChange?.('user')}
                className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
              >
                Usuario {renderSortIcon('user')}
              </button>
            </th>
            <th className="py-3.5 px-4">
              <button
                onClick={() => onSortChange?.('date')}
                className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none"
              >
                Fecha {renderSortIcon('date')}
              </button>
            </th>
            <th className="py-3.5 px-4 text-right">
              <button
                onClick={() => onSortChange?.('amount')}
                className="flex items-center gap-1.5 hover:text-white transition-colors focus:outline-none ml-auto"
              >
                Importe {renderSortIcon('amount')}
              </button>
            </th>
            <th className="py-3.5 px-4 text-center">Moneda</th>
            <th className="py-3.5 px-4">Método</th>
            <th className="py-3.5 px-4 text-center">Detalles</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {transactions.map((tx) => {
            const isOpen = expandedId === tx.id;
            const currencyBadgeClass =
              CURRENCY_STYLE[tx.currency] || 'bg-slate-800 text-slate-300 border border-slate-700';

            return (
              <React.Fragment key={tx.id}>
                <tr
                  onClick={() => onToggle(tx.id)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {tx.initials}
                      </div>
                      <span>{tx.user}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{tx.date}</td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-white">
                    {tx.amount.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${currencyBadgeClass}`}
                    >
                      {tx.currency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 truncate max-w-[150px]">
                    {tx.method || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-violet-400' : ''
                        }`}
                      />
                    </button>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-slate-950/60 border-b border-slate-800">
                    <td colSpan={6} className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs flex-1">
                          <div>
                            <dt className="text-slate-400">Equiv. ARS</dt>
                            <dd className="text-slate-100 font-bold mt-0.5">
                              $ {tx.ars}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-400">Equiv. USD</dt>
                            <dd className="text-slate-100 font-bold mt-0.5">
                              US$ {tx.usd}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-slate-400">Comentario</dt>
                            <dd className="text-slate-300 mt-0.5">
                              {tx.comment || 'Sin comentario'}
                            </dd>
                          </div>
                        </dl>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(tx);
                            }}
                            className="gap-1.5"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modificar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(tx.id);
                            }}
                            className="gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
