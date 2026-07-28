import React, { useState } from 'react';
import { X, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CategoryOption {
  id: string;
  nombre: string;
  estadolimite?: boolean;
  importe?: number | null;
  moneda?: string | null;
  periodoaplicacion?: string | null;
  importeutilizado?: number;
}

export interface GastoFormData {
  idgasto?: string;
  fecha: string;
  responsablegasto?: string;
  moneda: string;
  importe: number;
  comentario: string;
  idcategoria?: string;
  idsubmetodopago?: string;
  escompartido?: boolean;
  participantes?: string[];
}

interface GastoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GastoFormData) => Promise<void>;
  initialData?: Partial<GastoFormData> | null;
  categories: CategoryOption[];
  submethods: { id: string; nombre: string; metodo: string }[];
  members: { idusuario: string; nombreusuario: string }[];
}

function convertCurrency(val: number, from: string, to: string): number {
  if (from === to) return val;
  if (from === 'USD' && to === 'ARS') return val * 1000;
  if (from === 'ARS' && to === 'USD') return val / 1000;
  if (from === 'UYU' && to === 'ARS') return val * 25;
  if (from === 'ARS' && to === 'UYU') return val / 25;
  if (from === 'USD' && to === 'UYU') return val * 40;
  if (from === 'UYU' && to === 'USD') return val / 40;
  return val;
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
  const [escompartido, setEscompartido] = useState<boolean>(initialData?.escompartido ?? false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initialData?.participantes && initialData.participantes.length > 0
      ? initialData.participantes
      : members.map((m) => m.idusuario)
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Selected Category Limit Check (RF35)
  const selectedCategory = categories.find((c) => String(c.id) === String(idcategoria));
  const numericVal = parseFloat(importe) || 0;
  
  let isLimitExceeded = false;
  let exceededAmount = 0;
  let currentUsed = 0;
  let limitAmount = 0;
  let limitCurrency = 'ARS';
  let limitPeriod = 'Mensual';

  if (selectedCategory && selectedCategory.estadolimite && selectedCategory.importe) {
    limitAmount = selectedCategory.importe;
    limitCurrency = selectedCategory.moneda || 'ARS';
    limitPeriod = selectedCategory.periodoaplicacion || 'Mensual';
    currentUsed = selectedCategory.importeutilizado || 0;

    const convertedInput = convertCurrency(numericVal, moneda, limitCurrency);
    const projectedTotal = currentUsed + convertedInput;

    if (projectedTotal > limitAmount) {
      isLimitExceeded = true;
      exceededAmount = projectedTotal - limitAmount;
    }
  }

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const val = parseFloat(importe);
    if (isNaN(val) || val <= 0) {
      setErrorMsg('Por favor ingrese un importe válido mayor a 0');
      return;
    }

    if (escompartido && selectedParticipants.length === 0) {
      setErrorMsg('Debe seleccionar al menos un participante para dividir el gasto');
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
        escompartido,
        participantes: escompartido ? selectedParticipants : [],
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
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-800 text-white relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {initialData?.idgasto ? 'Editar Gasto (CU12)' : 'Nuevo Gasto (CU12)'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de gasto"
            className="p-1 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Floating Warning Alert for Exceeded Limit (RF35 / Flujo de Excepción 3) */}
          {isLimitExceeded && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-200 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl shadow-rose-950/40">
              <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <span>¡Alerta de Límite Presupuestario! (RF35)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-200/90">
                El gasto a ingresar (<strong>${numericVal.toLocaleString('es-AR')} {moneda}</strong>) hará que la categoría <strong>&quot;{selectedCategory?.nombre}&quot;</strong> supere su límite {limitPeriod.toLowerCase()} de <strong>${limitAmount.toLocaleString('es-AR')} {limitCurrency}</strong> por <strong className="text-rose-300 font-bold">${exceededAmount.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {limitCurrency}</strong>.
              </p>
              <div className="text-[10px] text-rose-400 font-medium bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-800/40">
                Flujo de Excepción 3: Notificación de superación del límite registrado.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Fecha */}
            <div className="space-y-1">
              <label htmlFor="gasto-fecha" className="text-xs font-medium text-slate-300">Fecha</label>
              <Input
                id="gasto-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-slate-950 text-xs"
              />
            </div>

            {/* Importe y Moneda */}
            <div className="space-y-1">
              <label htmlFor="gasto-importe" className="text-xs font-medium text-slate-300">Importe y Moneda *</label>
              <div className="flex gap-2">
                <Input
                  id="gasto-importe"
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
                  aria-label="Moneda del gasto"
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
              <div className="flex justify-between items-center">
                <label htmlFor="gasto-categoria" className="text-xs font-medium text-slate-300">Categoría</label>
                {selectedCategory?.estadolimite && (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Límite {limitPeriod}: ${limitAmount.toLocaleString('es-AR')} {limitCurrency}
                  </span>
                )}
              </div>
              <select
                id="gasto-categoria"
                value={idcategoria}
                onChange={(e) => setIdcategoria(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Sin categoría asignada</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.estadolimite && c.importe ? `(Límite: ${c.moneda || 'ARS'} $${c.importe})` : ''}
                  </option>
                ))}
              </select>

              {/* Status Indicator for Selected Category Limit */}
              {selectedCategory?.estadolimite && limitAmount > 0 && (
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 mt-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Consumido este período:</span>
                    <span className="font-semibold text-slate-200">
                      ${currentUsed.toLocaleString('es-AR')} / ${limitAmount.toLocaleString('es-AR')} {limitCurrency}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-colors duration-300 ${
                        isLimitExceeded
                          ? 'bg-rose-500'
                          : (currentUsed / limitAmount) > 0.8
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((currentUsed / limitAmount) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submétodo de Pago */}
            <div className="space-y-1">
              <label htmlFor="gasto-submetodo" className="text-xs font-medium text-slate-300">Submétodo de Pago</label>
              <select
                id="gasto-submetodo"
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
                <label htmlFor="gasto-responsable" className="text-xs font-medium text-slate-300">Responsable del Gasto</label>
                <select
                  id="gasto-responsable"
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

            {/* Gasto Compartido (Habilitado para 2 o más miembros) */}
            {members.length >= 2 && (
              <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="gasto-escompartido" className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                    <input
                      id="gasto-escompartido"
                      type="checkbox"
                      checked={escompartido}
                      onChange={(e) => {
                        setEscompartido(e.target.checked);
                        if (e.target.checked && selectedParticipants.length === 0) {
                          setSelectedParticipants(members.map((m) => m.idusuario));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 accent-violet-600"
                    />
                    <span>División de gastos (Gasto Compartido)</span>
                  </label>
                  {escompartido && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Equitativo
                    </span>
                  )}
                </div>

                {escompartido && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[11px] font-medium text-slate-400">Participantes del Gasto:</span>
                      <span className="text-[10px] font-semibold text-violet-400">
                        {numericVal > 0 && selectedParticipants.length > 0
                          ? `$${(numericVal / selectedParticipants.length).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${moneda} / persona`
                          : `${selectedParticipants.length} miembro(s)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {members.map((m) => {
                        const isSelected = selectedParticipants.includes(m.idusuario);
                        return (
                          <button
                            key={m.idusuario}
                            type="button"
                            onClick={() => handleToggleParticipant(m.idusuario)}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors border text-left ${
                              isSelected
                                ? 'bg-violet-950/40 border-violet-700/50 text-white font-semibold'
                                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                            }`}
                          >
                            <span className="truncate">{m.nombreusuario}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-800 text-slate-500'}`}>
                              {isSelected ? '✓' : '+'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comentario */}
            <div className="space-y-1">
              <label htmlFor="gasto-comentario" className="text-xs font-medium text-slate-300">Comentario</label>
              <Input
                id="gasto-comentario"
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
              <Button
                type="submit"
                className={`flex-1 gap-1.5 ${
                  isLimitExceeded
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : isLimitExceeded ? 'Guardar (Supera Límite)' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

