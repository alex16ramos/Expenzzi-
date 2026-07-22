import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface GastoFormData {
  idgasto?: string;
  fecha: string;
  responsablegasto?: string;
  moneda: string;
  importe: number;
  comentario: string;
  idcategoria?: string;
  idsubmetodopago?: string;
}

interface GastoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GastoFormData) => Promise<void>;
  initialData?: Partial<GastoFormData> | null;
  categories: { id: string; nombre: string }[];
  submethods: { id: string; nombre: string; metodo: string }[];
  members: { idusuario: string; nombreusuario: string }[];
}

export function GastoFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = [],
  submethods = [],
  members = [],
}: GastoFormModalProps) {
  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().split('T')[0]);
  const [moneda, setMoneda] = useState(initialData?.moneda || 'ARS');
  const [importe, setImporte] = useState(
    initialData?.importe !== undefined ? String(initialData.importe) : ''
  );
  const [comentario, setComentario] = useState(initialData?.comentario || '');
  const [idcategoria, setIdcategoria] = useState(initialData?.idcategoria || '');
  const [idsubmetodopago, setIdsubmetodopago] = useState(initialData?.idsubmetodopago || '');
  const [responsablegasto, setResponsablegasto] = useState(initialData?.responsablegasto || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const val = parseFloat(importe);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Por favor ingrese un importe válido mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        idgasto: initialData?.idgasto,
        fecha,
        moneda,
        importe: val,
        comentario,
        idcategoria: idcategoria || undefined,
        idsubmetodopago: idsubmetodopago || undefined,
        responsablegasto: responsablegasto || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al guardar el gasto';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-800 text-white relative">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {initialData?.idgasto ? 'Editar Gasto (CU12)' : 'Nuevo Gasto (CU12)'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Fecha */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Fecha</label>
            <Input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-slate-950 text-xs"
            />
          </div>

          {/* Importe y Moneda */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Importe y Moneda *</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="flex-1 bg-slate-950 font-semibold"
              />
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (US$)</option>
                <option value="UYU">UYU ($U)</option>
              </select>
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Categoría</label>
            <select
              value={idcategoria}
              onChange={(e) => setIdcategoria(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Sin categoría asignada</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Submétodo de Pago */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Submétodo de Pago</label>
            <select
              value={idsubmetodopago}
              onChange={(e) => setIdsubmetodopago(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Sin método específico</option>
              {submethods.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.metodo})
                </option>
              ))}
            </select>
          </div>

          {/* Responsable (Optional) */}
          {members.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Responsable del Gasto</label>
              <select
                value={responsablegasto}
                onChange={(e) => setResponsablegasto(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Usuario actual (predeterminado)</option>
                {members.map((m) => (
                  <option key={m.idusuario} value={m.idusuario}>
                    {m.nombreusuario}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Comentario */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Comentario</label>
            <Input
              type="text"
              placeholder="Ej: Supermercado, Combustible, Cena..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="bg-slate-950 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-1.5" disabled={isSubmitting}>
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
