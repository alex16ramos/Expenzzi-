import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Check, AlertCircle, ShieldAlert, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface CategoriaItem {
  id: string;
  nombre: string;
  estadolimite: boolean;
  importe: number | null;
  moneda: string | null;
  periodoaplicacion: string | null;
  estado?: boolean;
  importeutilizado?: number;
}

interface CategoriaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoriaItem[];
  onCreate: (data: Omit<CategoriaItem, 'id'>) => Promise<void>;
  onUpdate: (data: CategoriaItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewHistory?: (cat: CategoriaItem) => void;
  userRole?: string;
}

export function CategoriaManagerModal({
  isOpen,
  onClose,
  categories = [],
  onCreate,
  onUpdate,
  onDelete,
  onViewHistory,
  userRole = 'Visualizador',
}: CategoriaManagerModalProps) {
  const isAdmin = userRole === 'Administrador';
  const [form, setForm] = useState<{
    editingId: string | null;
    nombre: string;
    estadolimite: boolean;
    importe: string;
    moneda: string;
    periodoaplicacion: string;
  }>({
    editingId: null,
    nombre: '',
    estadolimite: false,
    importe: '',
    moneda: 'ARS',
    periodoaplicacion: 'Mensual',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { editingId, nombre, estadolimite, importe, moneda, periodoaplicacion } = form;

  if (!isOpen) return null;

  const resetForm = () => {
    setForm({
      editingId: null,
      nombre: '',
      estadolimite: false,
      importe: '',
      moneda: 'ARS',
      periodoaplicacion: 'Mensual',
    });
    setErrorMsg('');
  };

  const handleStartEdit = (cat: CategoriaItem) => {
    setForm({
      editingId: cat.id,
      nombre: cat.nombre,
      estadolimite: cat.estadolimite || false,
      importe: cat.importe !== null ? String(cat.importe) : '',
      moneda: cat.moneda || 'ARS',
      periodoaplicacion: cat.periodoaplicacion || 'Mensual',
    });
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio');
      return;
    }

    if (estadolimite && !isAdmin) {
      setErrorMsg('Solo un usuario Administrador puede configurar o modificar límites presupuestarios (RF20)');
      return;
    }

    const numericImporte = importe ? parseFloat(importe) : null;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate({
          id: editingId,
          nombre: nombre.trim(),
          estadolimite,
          importe: numericImporte,
          moneda: estadolimite ? moneda : null,
          periodoaplicacion: estadolimite ? periodoaplicacion : null,
        });
      } else {
        await onCreate({
          nombre: nombre.trim(),
          estadolimite,
          importe: numericImporte,
          moneda: estadolimite ? moneda : null,
          periodoaplicacion: estadolimite ? periodoaplicacion : null,
        });
      }
      resetForm();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al guardar categoría';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('¿Está seguro de desactivar esta categoría?')) {
      try {
        await onDelete(id);
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || 'Error al eliminar categoría';
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
            <Tag className="w-4 h-4 text-violet-400" />
            Gestión de Categorías y Límites (CU10 / RF20)
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de categorías"
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
            <span className="text-xs font-semibold text-violet-300">
              {editingId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
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

          <div className="flex gap-2">
            <Input
              id="categoria-nombre"
              type="text"
              required
              placeholder="Nombre de la categoría (ej: Supermercado, Salud...)"
              value={nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              className="flex-1 bg-slate-900 text-xs"
              aria-label="Nombre de la nueva categoría"
            />
          </div>

          {/* Toggle Limite */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="estadolimite"
                disabled={!isAdmin}
                checked={estadolimite}
                onChange={(e) => setForm((prev) => ({ ...prev, estadolimite: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:opacity-50"
              />
              <label htmlFor="estadolimite" className="text-xs text-slate-300 cursor-pointer">
                Definir Límite Presupuestario Opcional (RF20)
              </label>
            </div>
            {!isAdmin && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <ShieldAlert className="w-3 h-3" /> Solo Admin
              </span>
            )}
          </div>

          {estadolimite && isAdmin && (
            <div className="grid grid-cols-3 gap-2 pt-2 animate-in fade-in duration-150">
              <div>
                <label htmlFor="cat-importe" className="text-[10px] text-slate-400">Importe Límite</label>
                <Input
                  id="cat-importe"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={importe}
                  onChange={(e) => setForm((prev) => ({ ...prev, importe: e.target.value }))}
                  className="h-8 text-xs bg-slate-900"
                />
              </div>

              <div>
                <label htmlFor="cat-moneda" className="text-[10px] text-slate-400">Moneda</label>
                <select
                  id="cat-moneda"
                  value={moneda}
                  onChange={(e) => setForm((prev) => ({ ...prev, moneda: e.target.value }))}
                  className="w-full h-8 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200"
                >
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="UYU">UYU</option>
                </select>
              </div>

              <div>
                <label htmlFor="cat-periodo" className="text-[10px] text-slate-400">Periodo</label>
                <select
                  id="cat-periodo"
                  value={periodoaplicacion}
                  onChange={(e) => setForm((prev) => ({ ...prev, periodoaplicacion: e.target.value }))}
                  className="w-full h-8 px-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200"
                >
                  <option value="Semanal">Semanal</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full h-8 text-xs gap-1">
            {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isSubmitting ? 'Procesando...' : editingId ? 'Actualizar Categoría' : 'Crear Categoría'}
          </Button>
        </form>

        {/* Existing Categories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Categorías Activas ({categories.length})
          </span>

          {categories.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">
              No hay categorías creadas aún para esta interfaz.
            </p>
          ) : (
            categories.map((c) => (
              <CategoryCardItem
                key={c.id}
                c={c}
                onStartEdit={handleStartEdit}
                onDeleteItem={handleDeleteItem}
                onViewHistory={onViewHistory}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryCardItem({
  c,
  onStartEdit,
  onDeleteItem,
  onViewHistory,
}: {
  c: CategoriaItem;
  onStartEdit: (cat: CategoriaItem) => void;
  onDeleteItem: (id: string) => void;
  onViewHistory?: (cat: CategoriaItem) => void;
}) {
  const used = c.importeutilizado || 0;
  const limit = c.importe || 0;
  const percentage = c.estadolimite && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isExceeded = c.estadolimite && limit > 0 && used > limit;

  return (
    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-200">{c.nombre}</p>
          {c.estadolimite && c.importe ? (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                  isExceeded
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}
              >
                Límite: {c.moneda || 'ARS'} ${c.importe} / {c.periodoaplicacion || 'Mensual'}
              </span>
              <span className="text-[10px] text-slate-400">
                Utilizado: {c.moneda || 'ARS'} ${used.toLocaleString('es-AR')}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-500">Sin límite de gasto</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onViewHistory && (
            <button
              type="button"
              onClick={() => onViewHistory(c)}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
              title="Ver Historial de Cambios del Límite"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onStartEdit(c)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Editar Categoría"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteItem(c.id)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            title="Desactivar Categoría (Baja Lógica)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {c.estadolimite && limit > 0 && (
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-transform duration-300 ${
              isExceeded ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

