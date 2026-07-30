import React, { useState } from 'react';
import { X, Save, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface IngresoFormData {
  idingreso?: string;
  fecha: string;
  responsableingreso?: string;
  moneda: string;
  importe: number;
  comentario: string;
}

interface IngresoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IngresoFormData) => Promise<void>;
  initialData?: Partial<IngresoFormData> | null;
  members: { idusuario: string; nombreusuario: string }[];
}

export function IngresoFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  members = [],
}: IngresoFormModalProps) {
  const [fecha, setFecha] = useState(initialData?.fecha ? initialData.fecha.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState(() => {
    if (initialData?.fecha && initialData.fecha.includes('T')) {
      return initialData.fecha.split('T')[1].slice(0, 5);
    }
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [moneda, setMoneda] = useState(initialData?.moneda || 'ARS');
  const [importe, setImporte] = useState(
    initialData?.importe !== undefined ? String(initialData.importe) : ''
  );
  const [comentario, setComentario] = useState(initialData?.comentario || '');
  const [responsableingreso, setResponsableingreso] = useState(initialData?.responsableingreso || '');
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
        idingreso: initialData?.idingreso,
        fecha: `${fecha}T${hora}:00`,
        moneda,
        importe: val,
        comentario,
        responsableingreso: responsableingreso || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al guardar el ingreso';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            {initialData?.idingreso ? 'Editar Ingreso (RF9-RF11)' : 'Nuevo Ingreso (RF9-RF11)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de ingreso"
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="ingreso-fecha" className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha</label>
              <Input
                id="ingreso-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ingreso-hora" className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Hora
              </label>
              <Input
                id="ingreso-hora"
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>
          </div>

          {/* Importe y Moneda */}
          <div className="space-y-1">
            <label htmlFor="ingreso-importe" className="text-xs font-medium text-slate-700 dark:text-slate-300">Importe y Moneda *</label>
            <div className="flex gap-2">
              <Input
                id="ingreso-importe"
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
              />
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                aria-label="Moneda del ingreso"
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (US$)</option>
                <option value="UYU">UYU ($U)</option>
              </select>
            </div>
          </div>

          {/* Responsable */}
          {members.length > 0 && (
            <div className="space-y-1">
              <label htmlFor="ingreso-responsable" className="text-xs font-medium text-slate-700 dark:text-slate-300">Responsable del Ingreso</label>
              <select
                id="ingreso-responsable"
                value={responsableingreso}
                onChange={(e) => setResponsableingreso(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            <label htmlFor="ingreso-comentario" className="text-xs font-medium text-slate-700 dark:text-slate-300">Comentario</label>
            <Input
              id="ingreso-comentario"
              type="text"
              placeholder="Ej: Sueldo, Transferencia, Venta..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={isSubmitting}>
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
