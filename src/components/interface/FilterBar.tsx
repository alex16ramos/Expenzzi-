'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Filter, X, Search, RotateCcw, Calendar, DollarSign, Tag, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
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
}

interface FilterBarProps {
  filters: MultiFilterState;
  onFilterChange: (filters: MultiFilterState) => void;
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
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
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

        {/* Currency Quick Multi-Select Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['ARS', 'USD', 'UYU'] as const).map((curr) => {
            const isSelected = monedaSet.has(curr);
            return (
              <button
                key={curr}
                type="button"
                onClick={() => toggleArrayItem('monedas', curr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {curr}
              </button>
            );
          })}
          </div>
        {/* Collapsible & Reset Controls */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold border transition-colors ${
              activeFiltersCount > 0
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-indigo-700 text-[10px] font-extrabold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

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

      {/* Collapsible Filter Panel */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
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
