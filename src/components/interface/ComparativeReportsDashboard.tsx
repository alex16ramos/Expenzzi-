import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { CategoriaItem } from './CategoriaManagerModal';

interface ComparativeReportsDashboardProps {
  interfaceId: string;
  categories: CategoriaItem[];
}

interface MonthlyData {
  monthIndex: number;
  monthName: string;
  targetAmount: number;
  compareAmount: number;
  diffAmount: number;
  diffPercent: number;
}

interface CategoryData {
  id: string;
  name: string;
  total: number;
  count: number;
  percentage: number;
}

interface ReportSummary {
  totalTarget: number;
  totalCompare: number;
  monthlyAverage: number;
  peakMonthName: string;
  peakMonthAmount: number;
  yearVariationPercent: number;
  recordCountTarget: number;
}

export function ComparativeReportsDashboard({
  interfaceId,
  categories,
}: ComparativeReportsDashboardProps) {
  const currentYear = new Date().getFullYear();

  // Filter States
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [compareYear, setCompareYear] = useState<number>(currentYear - 1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');

  // Active View Tab inside Dashboard
  const [activeTab, setActiveTab] = useState<'evolution' | 'categories'>('evolution');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Data States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  // Available Years dropdown choices
  const yearOptions = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('year', String(selectedYear));
      queryParams.set('compareYear', String(compareYear));
      if (selectedCategory !== 'all') queryParams.set('categoryId', selectedCategory);
      if (selectedCurrency !== 'ALL') queryParams.set('moneda', selectedCurrency);

      const res = await fetch(`/api/interfaces/${interfaceId}/reportes?${queryParams.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary);
        setMonthlyData(data.monthlyEvolution || []);
        setCategoryData(data.categoryBreakdown || []);
      }
    } catch (err) {
      console.error('Error fetching comparative report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [interfaceId, selectedYear, compareYear, selectedCategory, selectedCurrency]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!isMounted) return;
      await fetchReports();
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [fetchReports]);

  // SVG Chart Height & Max Calculations
  const chartHeight = 180;
  const maxAmount = Math.max(
    ...monthlyData.map((d) => Math.max(d.targetAmount, d.compareAmount)),
    100
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl backdrop-blur-xl text-slate-100">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Reportes Comparativos de Períodos
              <span className="text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-md">
                RF13 • RF14
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Evolución y comparativa gráfica de gastos por mes, año y categoría
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchReports}
          disabled={isLoading}
          className="self-start sm:self-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Actualizar gráficos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-violet-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Interactive Filter Controls Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        {/* Target Year */}
        <div className="space-y-1">
          <label htmlFor="report-year" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-violet-400" /> Año Principal
          </label>
          <select
            id="report-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 font-semibold"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Compare Year */}
        <div className="space-y-1">
          <label htmlFor="report-compare-year" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" /> Comparar vs
          </label>
          <select
            id="report-compare-year"
            value={compareYear}
            onChange={(e) => setCompareYear(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1">
          <label htmlFor="report-categoria" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-400" /> Categoría
          </label>
          <select
            id="report-categoria"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 font-medium truncate"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Currency Filter */}
        <div className="space-y-1">
          <label htmlFor="report-currency" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-400" /> Moneda
          </label>
          <select
            id="report-currency"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-semibold"
          >
            <option value="ALL">Eq. ARS (Todas)</option>
            <option value="ARS">ARS Solamente</option>
            <option value="USD">USD Solamente</option>
            <option value="UYU">UYU Solamente</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Year Spend */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Gastos ({selectedYear})
          </span>
          <p className="text-lg font-extrabold text-white tracking-tight">
            ${summary?.totalTarget.toLocaleString('es-AR') ?? '0'}
          </p>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-violet-400" /> {summary?.recordCountTarget ?? 0} registros
          </span>
        </div>

        {/* Monthly Average */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Promedio Mensual
          </span>
          <p className="text-lg font-extrabold text-white tracking-tight">
            ${summary?.monthlyAverage.toLocaleString('es-AR') ?? '0'}
          </p>
          <span className="text-[10px] text-slate-400">Promedio de los 12 meses</span>
        </div>

        {/* Peak Spending Month */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Mes con Mayor Gasto
          </span>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-base font-extrabold text-amber-300 truncate">
              {summary?.peakMonthName ?? '-'}
            </p>
          </div>
          <span className="text-[10px] text-slate-400">
            ${summary?.peakMonthAmount.toLocaleString('es-AR') ?? '0'}
          </span>
        </div>

        {/* YoY Interannual Variation */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Variación vs {compareYear}
          </span>
          <div className="flex items-center gap-1.5">
            {(summary?.yearVariationPercent ?? 0) >= 0 ? (
              <div className="flex items-center gap-1 text-rose-400 font-bold text-base">
                <ArrowUpRight className="w-4 h-4" />
                <span>+{summary?.yearVariationPercent}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-base">
                <ArrowDownRight className="w-4 h-4" />
                <span>{summary?.yearVariationPercent}%</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            vs ${summary?.totalCompare.toLocaleString('es-AR') ?? '0'} en {compareYear}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs inside Chart */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('evolution')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'evolution'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Evolución Mensual Comparativa
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5" />
          Desglose por Categoría ({categoryData.length})
        </button>
      </div>

      {/* Main Interactive Chart View */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
          <span>Generando informe estadístico...</span>
        </div>
      ) : activeTab === 'evolution' ? (
        <ComparativeEvolutionChart
          monthlyData={monthlyData}
          selectedYear={selectedYear}
          compareYear={compareYear}
          hoveredMonthIndex={hoveredMonthIndex}
          setHoveredMonthIndex={setHoveredMonthIndex}
          maxAmount={maxAmount}
          chartHeight={chartHeight}
        />
      ) : (
        <CategoryBreakdownList categoryData={categoryData} />
      )}
    </div>
  );
}

function ComparativeEvolutionChart({
  monthlyData,
  selectedYear,
  compareYear,
  hoveredMonthIndex,
  setHoveredMonthIndex,
  maxAmount,
  chartHeight,
}: {
  monthlyData: MonthlyData[];
  selectedYear: number;
  compareYear: number;
  hoveredMonthIndex: number | null;
  setHoveredMonthIndex: (idx: number | null) => void;
  maxAmount: number;
  chartHeight: number;
}) {
  return (
    <div className="space-y-4">
      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-violet-500 shadow-sm" />
            <span className="font-semibold text-slate-200">Año {selectedYear}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-600 shadow-sm" />
            <span className="text-slate-400">Año {compareYear}</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 italic">
          *Pasa el cursor o presiona sobre un mes para ver detalles
        </span>
      </div>

      {/* SVG Grouped Bar Chart */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 overflow-x-auto relative min-w-[300px]">
        <div className="flex items-end justify-between gap-2 h-[200px] pt-6 pb-2 px-1 border-b border-slate-800">
          {monthlyData.map((d, index) => {
            const targetBarH = Math.max((d.targetAmount / maxAmount) * chartHeight, d.targetAmount > 0 ? 6 : 2);
            const compareBarH = Math.max((d.compareAmount / maxAmount) * chartHeight, d.compareAmount > 0 ? 6 : 2);
            const isHovered = hoveredMonthIndex === index;

            return (
              <div
                key={d.monthName}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                onMouseEnter={() => setHoveredMonthIndex(index)}
                onMouseLeave={() => setHoveredMonthIndex(null)}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute -top-2 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-2xl text-[11px] z-20 pointer-events-none min-w-[140px] text-left space-y-1">
                    <p className="font-bold text-violet-300 border-b border-slate-800 pb-1">
                      {d.monthName} ({selectedYear} vs {compareYear})
                    </p>
                    <div className="flex justify-between text-slate-200">
                      <span>{selectedYear}:</span>
                      <span className="font-bold text-violet-400">${d.targetAmount.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>{compareYear}:</span>
                      <span className="font-bold text-slate-300">${d.compareAmount.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 text-[10px]">
                      <span>Diferencia:</span>
                      <span className={d.diffAmount >= 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {d.diffAmount >= 0 ? `+${d.diffAmount}` : d.diffAmount} ({d.diffPercent}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* Grouped Bars Container */}
                <div className="flex items-end gap-1 w-full justify-center">
                  {/* Target Year Bar */}
                  <div
                    style={{ height: `${targetBarH}px` }}
                    className={`w-3.5 sm:w-5 rounded-t-sm transition-colors duration-300 ${
                      isHovered
                        ? 'bg-violet-400 shadow-lg shadow-violet-500/50 scale-105'
                        : 'bg-violet-600/90 hover:bg-violet-500'
                    }`}
                  />
                  {/* Compare Year Bar */}
                  <div
                    style={{ height: `${compareBarH}px` }}
                    className={`w-3.5 sm:w-5 rounded-t-sm transition-colors duration-300 ${
                      isHovered ? 'bg-slate-400 scale-105' : 'bg-slate-700/80 hover:bg-slate-600'
                    }`}
                  />
                </div>

                {/* Month Label */}
                <span
                  className={`text-[10px] mt-2 font-medium transition-colors ${
                    isHovered ? 'text-violet-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  {d.monthName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS = [
  'bg-violet-500 text-violet-300 border-violet-500/30',
  'bg-indigo-500 text-indigo-300 border-indigo-500/30',
  'bg-emerald-500 text-emerald-300 border-emerald-500/30',
  'bg-amber-500 text-amber-300 border-amber-500/30',
  'bg-rose-500 text-rose-300 border-rose-500/30',
  'bg-cyan-500 text-cyan-300 border-cyan-500/30',
];

function CategoryBreakdownList({ categoryData }: { categoryData: CategoryData[] }) {
  if (categoryData.length === 0) {
    return (
      <div className="text-center py-10 text-xs text-slate-500">
        No hay gastos registrados por categoría en el período seleccionado.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categoryData.map((cat, idx) => {
        const themeColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

        return (
          <div
            key={cat.id}
            className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2 hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${themeColor.split(' ')[0]}`} />
                <span className="font-semibold text-white">{cat.name}</span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {cat.count} operaciones
                </span>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-white mr-2">${cat.total.toLocaleString('es-AR')}</span>
                <span className={`text-[10px] font-bold ${themeColor.split(' ')[1]}`}>{cat.percentage}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                className={`h-full rounded-full transition-colors duration-500 ${themeColor.split(' ')[0]}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
