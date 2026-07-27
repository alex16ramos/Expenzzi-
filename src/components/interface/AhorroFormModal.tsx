import React, { useState } from 'react';
import { X, Save, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface AhorroFormData {
  idahorro?: string;
  fechadesde: string;
  fechahasta: string;
  moneda: string;
  importe: number;
  comentario: string;
  periodoaporte: 'Semanal' | 'Mensual' | 'Trimestral' | 'Anual';
}

interface AhorroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AhorroFormData) => Promise<void>;
  initialData?: Partial<AhorroFormData> | null;
  userRole: string; // 'Administrador' | 'Invitado' | 'Visualizador'
}

export function AhorroFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  userRole,
}: AhorroFormModalProps) {
  const isAdmin = userRole === 'Administrador';

  const [fechadesde, setFechadesde] = useState(
    () => initialData?.fechadesde || new Date().toISOString().split('T')[0]
  );
  const [fechahasta, setFechahasta] = useState(
    () =>
      initialData?.fechahasta ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [moneda, setMoneda] = useState(initialData?.moneda || 'USD');
  const [importe, setImporte] = useState(
    initialData?.importe !== undefined ? String(initialData.importe) : ''
  );
  const [comentario, setComentario] = useState(initialData?.comentario || '');
  const [periodoaporte, setPeriodoaporte] = useState<'Semanal' | 'Mensual' | 'Trimestral' | 'Anual'>(
    initialData?.periodoaporte || 'Mensual'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isAdmin) {
      setErrorMsg('Formulario exclusivo para Administradores de la interfaz (RF15)');
      return;
    }

    const val = parseFloat(importe);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Por favor ingrese un importe de ahorro válido mayor a 0');
      return;
    }

    if (!periodoaporte) {
      setErrorMsg('La selección del periodo de aporte es obligatoria');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        idahorro: initialData?.idahorro,
        fechadesde,
        fechahasta,
        moneda,
        importe: val,
        comentario,
        periodoaporte,
      });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al guardar el ahorro';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-800 text-white relative">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-violet-400 tracking-tight">
              {initialData?.idahorro ? 'Editar Ahorro (RF15-RF17)' : 'Nuevo Ahorro (RF15-RF17)'}
            </h3>
            <span className="text-[10px] uppercase font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
              Solo Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de ahorro"
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdmin && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Acceso Restringido (RF15)</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Su rol actual es <strong className="underline">{userRole}</strong>. Solo los Administradores de esta interfaz pueden crear o editar fondos de ahorro.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Periodo de Aporte (MANDATORIO RF15) */}
          <div className="space-y-1">
            <label htmlFor="ahorro-periodo" className="text-xs font-semibold text-violet-300 flex items-center gap-1">
              Periodo de Aporte (Obligatorio) *
            </label>
            <select
              id="ahorro-periodo"
              value={periodoaporte}
              disabled={!isAdmin}
              onChange={(e) =>
                setPeriodoaporte(e.target.value as 'Semanal' | 'Mensual' | 'Trimestral' | 'Anual')
              }
              className="w-full h-9 px-3 rounded-xl border border-violet-500/30 bg-slate-950 text-xs font-bold text-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
            >
              <option value="Semanal">Semanal</option>
              <option value="Mensual">Mensual</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          {/* Importe y Moneda */}
          <div className="space-y-1">
            <label htmlFor="ahorro-importe" className="text-xs font-medium text-slate-300">Importe y Moneda *</label>
            <div className="flex gap-2">
              <Input
                id="ahorro-importe"
                type="number"
                step="any"
                required
                disabled={!isAdmin}
                placeholder="0.00"
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
                className="flex-1 bg-slate-950 font-semibold disabled:opacity-50"
              />
              <select
                value={moneda}
                disabled={!isAdmin}
                onChange={(e) => setMoneda(e.target.value)}
                aria-label="Moneda del ahorro"
                className="h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              >
                <option value="USD">USD (US$)</option>
                <option value="ARS">ARS ($)</option>
                <option value="UYU">UYU ($U)</option>
              </select>
            </div>
          </div>

          {/* Fechas Desde y Hasta */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="ahorro-desde" className="text-xs font-medium text-slate-300">Fecha Desde</label>
              <Input
                id="ahorro-desde"
                type="date"
                required
                disabled={!isAdmin}
                value={fechadesde}
                onChange={(e) => setFechadesde(e.target.value)}
                className="bg-slate-950 text-xs disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="ahorro-hasta" className="text-xs font-medium text-slate-300">Fecha Hasta</label>
              <Input
                id="ahorro-hasta"
                type="date"
                required
                disabled={!isAdmin}
                value={fechahasta}
                onChange={(e) => setFechahasta(e.target.value)}
                className="bg-slate-950 text-xs disabled:opacity-50"
              />
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-1">
            <label htmlFor="ahorro-comentario" className="text-xs font-medium text-slate-300">Comentario / Destino</label>
            <Input
              id="ahorro-comentario"
              type="text"
              disabled={!isAdmin}
              placeholder="Ej: Fondo de emergencia, Vacaciones..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="bg-slate-950 text-xs disabled:opacity-50"
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
            <Button
              type="submit"
              disabled={!isAdmin || isSubmitting}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Ahorro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
