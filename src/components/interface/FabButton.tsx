import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FabButtonProps {
  onAddTransaction?: (data: {
    amount: number;
    currency: string;
    comment: string;
    method: string;
  }) => void;
}

export function FabButton({ onAddTransaction }: FabButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [comment, setComment] = useState('');
  const [method, setMethod] = useState('Débito');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val)) return;

    onAddTransaction?.({
      amount: val,
      currency,
      comment,
      method,
    });

    setAmount('');
    setComment('');
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative shrink-0">
        <button
          onClick={() => setIsOpen(true)}
          className="absolute -top-6 right-4 w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center transition-all z-20"
          title="Agregar Movimiento"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-800 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white tracking-tight">
                Nuevo Movimiento
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Importe y Moneda
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="ARS">ARS ($)</option>
                    <option value="USD">USD (US$)</option>
                    <option value="UYU">UYU ($U)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Comentario
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Supermercado, Nafta, Hospedaje..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Método de Pago
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Débito, Efectivo, Visa..."
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
