import React, { useState } from 'react';
import { Filter, X, Search, RotateCcw, Calendar, DollarSign, Tag, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface FilterState {
  search: string;
  categoryId: string;
  submethodId: string;
  metodo: string;
  moneda: string;
  fechaDesde: string;
  fechaHasta: string;
  minImporte: string;
  maxImporte: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: { id: string; nombre: string }[];
  submethods: { id: string; nombre: string; metodo: string }[];
  onReset: () => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  categories = [],
  submethods = [],
  onReset,
}: FilterBarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const activeFiltersCount = [
    filters.categoryId,
    filters.submethodId,
    filters.metodo,
    filters.moneda,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.minImporte,
    filters.maxImporte,
  ].filter(Boolean).length;

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-lg backdrop-blur-md space-y-3">
      {/* Top Main Bar: Text Search + Mobile Filter Toggle Button */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Buscar por comentario o usuario..."
            className="pl-9 h-9 text-xs"
          />
          {filters.search && (
            <button
              onClick={() => handleChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile toggle button */}
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold border transition-all ${
            activeFiltersCount > 0
              ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-violet-700 text-[10px] font-extrabold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={onReset}
            className="p-2 h-9 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            title="Limpiar Filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Options (Always visible on desktop, toggleable on mobile) */}
      <div className={`${isOpenMobile ? 'block' : 'hidden md:block'} pt-2 border-t border-slate-800 space-y-3 animate-in fade-in duration-200`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {/* Categoría */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-violet-400" /> Categoría
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Moneda */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" /> Moneda
            </label>
            <select
              value={filters.moneda}
              onChange={(e) => handleChange('moneda', e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todas las monedas</option>
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (US$)</option>
              <option value="UYU">UYU ($U)</option>
            </select>
          </div>

          {/* Método de Pago Base */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-blue-400" /> Método de Pago
            </label>
            <select
              value={filters.metodo}
              onChange={(e) => handleChange('metodo', e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Credito">Crédito</option>
              <option value="Debito">Débito</option>
            </select>
          </div>

          {/* Submétodo Especifico */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-indigo-400" /> Submétodo
            </label>
            <select
              value={filters.submethodId}
              onChange={(e) => handleChange('submethodId', e.target.value)}
              className="w-full h-8 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Todos los submétodos</option>
              {submethods.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.metodo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Range Filters: Fecha and Montos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-slate-800/40">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" /> Fecha Desde
            </label>
            <Input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => handleChange('fechaDesde', e.target.value)}
              className="h-8 text-xs bg-slate-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" /> Fecha Hasta
            </label>
            <Input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => handleChange('fechaHasta', e.target.value)}
              className="h-8 text-xs bg-slate-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              Monto Mínimo
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.minImporte}
              onChange={(e) => handleChange('minImporte', e.target.value)}
              className="h-8 text-xs bg-slate-950"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              Monto Máximo
            </label>
            <Input
              type="number"
              placeholder="100000..."
              value={filters.maxImporte}
              onChange={(e) => handleChange('maxImporte', e.target.value)}
              className="h-8 text-xs bg-slate-950"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
