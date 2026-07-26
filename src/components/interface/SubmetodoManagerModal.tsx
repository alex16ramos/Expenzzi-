import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, CreditCard, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface SubmetodoItem {
  id: string;
  nombre: string;
  metodo: string; // 'Efectivo' | 'Credito' | 'Debito'
  estado?: boolean;
}

interface SubmetodoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submethods: SubmetodoItem[];
  onCreate: (data: Omit<SubmetodoItem, 'id'>) => Promise<void>;
  onUpdate: (data: SubmetodoItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SubmetodoManagerModal({
  isOpen,
  onClose,
  submethods = [],
  onCreate,
  onUpdate,
  onDelete,
}: SubmetodoManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [metodo, setMetodo] = useState<'Efectivo' | 'Credito' | 'Debito'>('Debito');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setNombre('');
    setMetodo('Debito');
    setErrorMsg('');
  };

  const handleStartEdit = (item: SubmetodoItem) => {
    setEditingId(item.id);
    setNombre(item.nombre);
    setMetodo(item.metodo as 'Efectivo' | 'Credito' | 'Debito');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('El nombre del submétodo de pago es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate({
          id: editingId,
          nombre: nombre.trim(),
          metodo,
        });
      } else {
        await onCreate({
          nombre: nombre.trim(),
          metodo,
        });
      }
      resetForm();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al guardar submétodo';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Está seguro de desactivar este submétodo de pago?')) {
      try {
        await onDelete(id);
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || 'Error al eliminar submétodo';
        setErrorMsg(msg);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-800 text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Submétodos de Pago (RF25 - RF28)
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de submétodos"
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ABM Form */}
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-indigo-300">
              {editingId ? 'Editar Submétodo' : 'Agregar Submétodo de Pago'}
            </span>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label htmlFor="nombreSubmetodo" className="text-[10px] text-slate-400">Nombre del Submétodo</label>
              <Input
                id="nombreSubmetodo"
                type="text"
                required
                placeholder="Ej: Visa Santander, Prex UY, Cuenta ARS..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-9 bg-slate-900 text-xs"
              />
            </div>

            <div>
              <label htmlFor="metodoBase" className="text-[10px] text-slate-400">Método Base (RF25)</label>
              <select
                id="metodoBase"
                aria-label="Método Base (RF25)"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as 'Efectivo' | 'Credito' | 'Debito')}
                className="w-full h-9 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200"
              >
                <option value="Debito">Débito</option>
                <option value="Credito">Crédito</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-8 text-xs gap-1">
            {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isSubmitting ? 'Procesando...' : editingId ? 'Actualizar Submétodo' : 'Crear Submétodo'}
          </Button>
        </form>

        {/* Existing Submethods List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Submétodos Asignados ({submethods.length})
          </span>

          {submethods.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">
              No hay submétodos de pago configurados aún.
            </p>
          ) : (
            submethods.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">{item.nombre}</p>
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 mt-1 inline-block">
                    Método Base: {item.metodo}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Editar Submétodo"
                    aria-label="Editar submétodo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    title="Desactivar Submétodo (Baja Lógica)"
                    aria-label="Desactivar submétodo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
