import React from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction, CURRENCY_STYLE } from './TransactionCard';

interface TransactionTableProps {
  transactions: Transaction[];
  expandedId: string | number | null;
  onToggle: (id: string | number) => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string | number) => void;
}

export function TransactionTable({
  transactions,
  expandedId,
  onToggle,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
          <tr>
            <th className="py-3 px-4">Usuario</th>
            <th className="py-3 px-4">Fecha</th>
            <th className="py-3 px-4 text-right">Importe</th>
            <th className="py-3 px-4 text-center">Moneda</th>
            <th className="py-3 px-4">Método</th>
            <th className="py-3 px-4 text-center">Detalles</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((tx) => {
            const isOpen = expandedId === tx.id;
            const currencyBadgeClass =
              CURRENCY_STYLE[tx.currency] || 'bg-slate-100 text-slate-700';

            return (
              <React.Fragment key={tx.id}>
                <tr
                  onClick={() => onToggle(tx.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-50 text-violet-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {tx.initials}
                      </div>
                      <span>{tx.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{tx.date}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {tx.amount.toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${currencyBadgeClass}`}
                    >
                      {tx.currency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                    {tx.method || '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="p-1 rounded-lg hover:bg-slate-200/60 transition-colors">
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-violet-600' : ''
                        }`}
                      />
                    </button>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <td colSpan={6} className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs flex-1">
                          <div>
                            <dt className="text-slate-400">Equiv. ARS</dt>
                            <dd className="text-slate-900 font-semibold mt-0.5">
                              $ {tx.ars}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-400">Equiv. USD</dt>
                            <dd className="text-slate-900 font-semibold mt-0.5">
                              US$ {tx.usd}
                            </dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="text-slate-400">Comentario</dt>
                            <dd className="text-slate-700 mt-0.5">
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
