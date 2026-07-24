import React, { useState, useEffect } from 'react';
import { X, History, RefreshCw, AlertCircle, ArrowRight, User, Calendar, MinusCircle, PlusCircle, Tag, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import { AuditRecord } from '@/app/api/interfaces/[id]/historial/route';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaceId: string;
  initialTypeFilter?: 'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite';
  entityIdFilter?: string | number | null;
  titleFilter?: string;
}

const TYPE_CONFIG = {
  gasto: {
    label: 'Gasto',
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    icon: Wallet,
  },
  ingreso: {
    label: 'Ingreso',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CreditCard,
  },
  ahorro: {
    label: 'Ahorro',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: PiggyBank,
  },
  limite: {
    label: 'Límite Presupuestario',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Tag,
  },
};

export function AuditHistoryModal({
  isOpen,
  onClose,
  interfaceId,
  initialTypeFilter = 'todos',
  entityIdFilter = null,
  titleFilter,
}: AuditHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite'>(initialTypeFilter);
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch history records from API without synchronous setState in effect body
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const params = new URLSearchParams();
    if (activeTab !== 'todos') params.set('tipo', activeTab);
    if (entityIdFilter) params.set('entityId', String(entityIdFilter));

    fetch(`/api/interfaces/${interfaceId}/historial?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (Array.isArray(json.data)) {
            setLogs(json.data);
            setErrorMsg('');
          } else {
            setErrorMsg(json.error || 'Error al obtener el historial de auditoría');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setErrorMsg('Error de conexión al cargar auditoría');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, entityIdFilter, interfaceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-800 text-white max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Historial y Auditoría de Cambios
              </h3>
              <p className="text-xs text-slate-400">
                {titleFilter
                  ? `Registros de auditoría para "${titleFilter}"`
                  : 'Modificaciones registradas en las tablas de auditoría (RF6)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters (only when not filtered to a single entity) */}
        {!entityIdFilter && (
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs shrink-0">
            {(['todos', 'gasto', 'ingreso', 'ahorro', 'limite'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setIsLoading(true);
                  setActiveTab(tab);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'todos' ? 'Todos' : tab === 'limite' ? 'Límites' : `${tab}s`}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Audit Logs Visualizer */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {isLoading ? (
            <div className="text-center py-16 text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              Cargando historial de auditoría...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 text-slate-400 space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No hay modificaciones registradas</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Las modificaciones previas de importes, monedas o comentarios se auditarán automáticamente cuando se actualicen los registros.
              </p>
            </div>
          ) : (
            logs.map((record) => {
              const typeInfo = TYPE_CONFIG[record.tipo] || TYPE_CONFIG.gasto;
              const IconComp = typeInfo.icon;

              const isAmountChanged = record.antImporte !== record.nuevoImporte;
              const isCurrencyChanged = record.antMoneda !== record.nuevoMoneda;
              const isCommentChanged = record.antComentario !== record.nuevoComentario;

              return (
                <div
                  key={`${record.tipo}-${record.id}`}
                  className="bg-slate-950/80 rounded-2xl border border-slate-800/90 p-4 space-y-3 shadow-md hover:border-slate-700 transition-colors"
                >
                  {/* Log Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeInfo.badge}`}
                      >
                        <IconComp className="w-3 h-3" />
                        {typeInfo.label} #{record.entityId}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {record.nombreItem || record.tipo}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {record.fechacambio}
                      </span>
                      {record.responsableNombre && (
                        <span className="flex items-center gap-1 font-medium text-slate-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                          <User className="w-3 h-3 text-violet-400" />
                          {record.responsableNombre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* VISUAL DIFF SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* VALOR ANTERIOR (OLD - RED HIGHLIGHT) */}
                    <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 space-y-1.5 relative overflow-hidden">
                      <div className="flex justify-between items-center text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <MinusCircle className="w-3.5 h-3.5" /> Valor Anterior (ant)
                        </span>
                        <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                          {record.antMoneda || 'ARS'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-rose-200 tracking-tight line-through opacity-90">
                          {record.antImporte !== null
                            ? record.antImporte.toLocaleString('es-AR', { minimumFractionDigits: 2 })
                            : '-'}
                        </span>
                        <span className="text-xs font-semibold text-rose-300">
                          {record.antMoneda || ''}
                        </span>
                      </div>

                      {record.antComentario && (
                        <p className="text-xs text-rose-300/80 italic border-t border-rose-500/20 pt-1.5 mt-1 truncate">
                          &quot;{record.antComentario}&quot;
                        </p>
                      )}
                    </div>

                    {/* VALOR NUEVO (NEW - GREEN HIGHLIGHT) */}
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 space-y-1.5 relative overflow-hidden">
                      <div className="flex justify-between items-center text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <PlusCircle className="w-3.5 h-3.5" /> Valor Nuevo
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                          {record.nuevoMoneda || 'ARS'}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-emerald-200 tracking-tight">
                          {record.nuevoImporte !== null
                            ? record.nuevoImporte.toLocaleString('es-AR', { minimumFractionDigits: 2 })
                            : '-'}
                        </span>
                        <span className="text-xs font-semibold text-emerald-300">
                          {record.nuevoMoneda || ''}
                        </span>
                      </div>

                      {record.nuevoComentario && (
                        <p className="text-xs text-emerald-300/80 italic border-t border-emerald-500/20 pt-1.5 mt-1 truncate">
                          &quot;{record.nuevoComentario}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary of specific changes made */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400">
                    <span className="font-semibold text-slate-300">Cambios detectados:</span>
                    {isAmountChanged && (
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        Importe: {record.antImporte?.toLocaleString()} <ArrowRight className="w-3 h-3" /> {record.nuevoImporte?.toLocaleString()}
                      </span>
                    )}
                    {isCurrencyChanged && (
                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        Moneda: {record.antMoneda} <ArrowRight className="w-3 h-3" /> {record.nuevoMoneda}
                      </span>
                    )}
                    {isCommentChanged && (
                      <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">
                        Comentario actualizado
                      </span>
                    )}
                    {!isAmountChanged && !isCurrencyChanged && !isCommentChanged && (
                      <span className="text-slate-500 italic">Actualización de estado o registro</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center shrink-0 text-xs text-slate-400">
          <span>Total de registros auditados: {logs.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
