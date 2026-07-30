'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Search, RotateCcw, Calendar, DollarSign, Tag, CreditCard, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface MultiFilterState {
  search: string;
  categoryIds: string[];
  submethodIds: string[];
  metodos: string[];
  monedas: string[];
  fechaDesde: string;
  fechaHasta: string;
  minImporte: string;
  maxImporte: string;
  estadoFilter?: 'activo' | 'inactivo' | 'todos';
}

interface FilterBarProps {
  filters: MultiFilterState;
  onFilterChange: (filters: MultiFilterState) => void;
  categories: { id: string; nombre: string }[];
  submethods: { id: string; nombre: string; metodo: string }[];
  onReset: () => void;
  onExportCSV?: () => void;
}

export function FilterBar({
  filters,
  onFilterChange,
  categories = [],
  submethods = [],
  onReset,
  onExportCSV,
}: FilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [prevSearch, setPrevSearch] = useState(filters.search);

  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setLocalSearch(filters.search);
  }

  const onFilterChangeRef = useRef(onFilterChange);
  const filtersRef = useRef(filters);

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
    filtersRef.current = filters;
  });

  // Debounce search API calls by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filtersRef.current.search) {
        onFilterChangeRef.current({ ...filtersRef.current, search: localSearch });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const activeFiltersCount = [
    ...filters.categoryIds,
    ...filters.submethodIds,
    ...filters.metodos,
    ...filters.monedas,
    filters.fechaDesde,
    filters.fechaHasta,
    filters.minImporte,
    filters.maxImporte,
    filters.estadoFilter && filters.estadoFilter !== 'activo' ? filters.estadoFilter : '',
  ].filter(Boolean).length;

  const categorySet = React.useMemo(() => new Set(filters.categoryIds), [filters.categoryIds]);
  const submethodSet = React.useMemo(() => new Set(filters.submethodIds), [filters.submethodIds]);
  const metodoSet = React.useMemo(() => new Set(filters.metodos), [filters.metodos]);
  const monedaSet = React.useMemo(() => new Set(filters.monedas), [filters.monedas]);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
  };

  const toggleArrayItem = (key: 'categoryIds' | 'submethodIds' | 'metodos' | 'monedas', value: string) => {
    const current = filters[key] || [];
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== value) : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  const handleFieldChange = (key: 'fechaDesde' | 'fechaHasta' | 'minImporte' | 'maxImporte', value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3 transition-colors">
      {/* Top Search Bar & Main Controls */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por comentario o usuario..."
            className="pl-9 h-10 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl"
            aria-label="Buscar movimientos"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Estado Quick Multi-Select Pills + Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-between w-full lg:w-auto">
          {/* Scrollable Pills container with hidden scrollbar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full shrink min-w-0 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Estado Pills */}
            {(['activo', 'inactivo', 'todos'] as const).map((st) => {
              const currentEst = filters.estadoFilter || 'activo';
              const isSelected = currentEst === st;
              const label = st === 'activo' ? 'Activos' : st === 'inactivo' ? 'Inactivos' : 'Todos';
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onFilterChange({ ...filters, estadoFilter: st })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border shrink-0 ${
                    isSelected
                      ? st === 'inactivo'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                        : 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Collapsible & Reset Controls */}
          <div className="flex items-center justify-end gap-2 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-extrabold border transition-all duration-200 shadow-sm ${
                activeFiltersCount > 0
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Filter className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-indigo-700 text-[10px] font-black flex items-center justify-center shadow-sm">
                  {activeFiltersCount}
                </span>
              )}
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                title="Exportar movimientos a Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="p-2.5 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                title="Limpiar todos los filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Filter Panel - Highly Dynamic & Visible */}
      {!isCollapsed && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border">
          {/* Multi-Select Moneda Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Monedas (Multi-Selección)
            </label>
            <div className="flex flex-wrap gap-2">
              {(['ARS', 'USD', 'UYU'] as const).map((curr) => {
                const isSelected = monedaSet.has(curr);
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => toggleArrayItem('monedas', curr)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-150 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Multi-Select Category Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" /> Categorías (Multi-Selección)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = categorySet.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleArrayItem('categoryIds', cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                );
              })}
            </div>
          </div>
          {submethods.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-500" /> Submétodos de Pago
              </label>
              <div className="flex flex-wrap gap-1.5">
                {submethods.map((sub) => {
                  const isSelected = submethodSet.has(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleArrayItem('submethodIds', sub.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sub.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method Pills */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Métodos de Pago (Multi-Selección)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Efectivo', 'Debito', 'Credito'] as const).map((m) => {
                const label = m === 'Debito' ? 'Débito' : m === 'Credito' ? 'Crédito' : 'Efectivo';
                const isSelected = metodoSet.has(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleArrayItem('metodos', m)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Pills inside Filter Panel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Moneda (Multi-Selección)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['ARS', 'USD', 'UYU'] as const).map((curr) => {
                const isSelected = monedaSet.has(curr);
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => toggleArrayItem('monedas', curr)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Range Inputs: Fechas & Montos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="space-y-1">
              <label htmlFor="filter-fecha-desde" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" /> Fecha Desde
              </label>
              <Input
                id="filter-fecha-desde"
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => handleFieldChange('fechaDesde', e.target.value)}
                className="h-9 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="filter-fecha-hasta" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" /> Fecha Hasta
              </label>
              <Input
                id="filter-fecha-hasta"
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => handleFieldChange('fechaHasta', e.target.value)}
                className="h-9 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="filter-min-importe" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Monto Mínimo
              </label>
              <Input
                id="filter-min-importe"
                type="number"
                placeholder="0.00"
                value={filters.minImporte}
                onChange={(e) => handleFieldChange('minImporte', e.target.value)}
                className="h-9 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="filter-max-importe" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Monto Máximo
              </label>
              <Input
                id="filter-max-importe"
                type="number"
                placeholder="100000..."
                value={filters.maxImporte}
                onChange={(e) => handleFieldChange('maxImporte', e.target.value)}
                className="h-9 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
