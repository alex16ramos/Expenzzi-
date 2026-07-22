'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { Signal, Wifi, BatteryFull, Plus, RefreshCw, Tag, CreditCard, Shield } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Header } from '@/components/interface/Header';
import { TransactionCard, Transaction } from '@/components/interface/TransactionCard';
import { TransactionTable, SortField, SortOrder } from '@/components/interface/TransactionTable';
import { Pagination } from '@/components/interface/Pagination';
import { BottomNav } from '@/components/interface/BottomNav';
import { UserExpenseChart } from '@/components/interface/UserExpenseChart';
import { BalanceCards, GeneralBalances } from '@/components/interface/BalanceCards';
import { FilterBar, FilterState } from '@/components/interface/FilterBar';
import { GastoFormModal, GastoFormData } from '@/components/interface/GastoFormModal';
import { IngresoFormModal, IngresoFormData } from '@/components/interface/IngresoFormModal';
import { AhorroFormModal, AhorroFormData } from '@/components/interface/AhorroFormModal';
import { CategoriaManagerModal, CategoriaItem } from '@/components/interface/CategoriaManagerModal';
import { SubmetodoManagerModal, SubmetodoItem } from '@/components/interface/SubmetodoManagerModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  categoryId: '',
  submethodId: '',
  metodo: '',
  moneda: '',
  fechaDesde: '',
  fechaHasta: '',
  minImporte: '',
  maxImporte: '',
};

export default function InterfaceDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const interfaceId = resolvedParams.id;

  const session = authClient.useSession();
  const user = session?.data?.user;

  // Interface details state
  const [interfaceData, setInterfaceData] = useState<{ nombre: string; descripcion?: string } | null>(null);
  const [userRole, setUserRole] = useState<string>('Visualizador');
  const [categories, setCategories] = useState<CategoriaItem[]>([]);
  const [submethods, setSubmethods] = useState<SubmetodoItem[]>([]);
  const [members, setMembers] = useState<{ idusuario: string; nombreusuario: string }[]>([]);
  const [balances, setBalances] = useState<GeneralBalances>({
    ARS: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
    USD: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
    UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
  });

  // UI state
  const [activeSection, setActiveSection] = useState<'Gastos' | 'Ingresos' | 'Ahorros' | 'Resúmenes'>('Gastos');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting state
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Transaction items loaded from backend
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals state
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoFormData | null>(null);

  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState<IngresoFormData | null>(null);

  const [isAhorroModalOpen, setIsAhorroModalOpen] = useState(false);
  const [editingAhorro, setEditingAhorro] = useState<AhorroFormData | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubmethodModalOpen, setIsSubmethodModalOpen] = useState(false);

  // User initials
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'EX';

  // 1. Fetch Interface Details & Config
  const loadInterfaceDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/details`);
      const data = await res.json();
      if (res.ok) {
        setInterfaceData(data.interface);
        setUserRole(data.role || 'Visualizador');
        setCategories(data.categories || []);
        setSubmethods(data.submethods || []);
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Error fetching interface details:', err);
    }
  }, [interfaceId]);

  // 2. Fetch General Balances (RF19)
  const loadBalances = useCallback(async () => {
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/balance`);
      const data = await res.json();
      if (res.ok && data.balances) {
        setBalances(data.balances);
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  }, [interfaceId]);

  // 3. Fetch Records based on Active Section & Filters
  const loadSectionRecords = useCallback(async () => {
    if (activeSection === 'Resúmenes') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(currentPage));
      queryParams.set('pageSize', String(pageSize));

      if (filters.search) queryParams.set('search', filters.search);
      if (filters.categoryId) queryParams.set('categoryId', filters.categoryId);
      if (filters.submethodId) queryParams.set('submethodId', filters.submethodId);
      if (filters.metodo) queryParams.set('metodo', filters.metodo);
      if (filters.moneda) queryParams.set('moneda', filters.moneda);
      if (filters.fechaDesde) queryParams.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) queryParams.set('fechaHasta', filters.fechaHasta);
      if (filters.minImporte) queryParams.set('minImporte', filters.minImporte);
      if (filters.maxImporte) queryParams.set('maxImporte', filters.maxImporte);

      const endpoint =
        activeSection === 'Gastos'
          ? `/api/interfaces/${interfaceId}/gastos`
          : activeSection === 'Ingresos'
          ? `/api/interfaces/${interfaceId}/ingresos`
          : `/api/interfaces/${interfaceId}/ahorros`;

      const res = await fetch(`${endpoint}?${queryParams.toString()}`);
      const json = await res.json();

      if (res.ok && Array.isArray(json.data)) {
        // Map backend records to unified Transaction format for components
        const mapped: Transaction[] = json.data.map((item: Record<string, unknown>) => {
          const amt = Number(item.importe || 0);
          const curr = String(item.moneda || 'ARS');
          return {
            id: String(item.id),
            date: item.fecha ? String(item.fecha).split('T')[0] : '',
            user: String(item.responsableNombre || 'Usuario'),
            initials: String(item.responsableNombre || 'U').slice(0, 2).toUpperCase(),
            amount: amt,
            currency: curr,
            ars: curr === 'ARS' ? amt.toLocaleString('es-AR') : (amt * 1100).toLocaleString('es-AR'),
            usd: curr === 'USD' ? String(amt) : (amt / 1100).toFixed(1),
            comment: String(item.comentario || item.periodoaporte || activeSection),
            method: item.submetodoNombre ? `${item.metodoBase || ''} - ${item.submetodoNombre}` : String(item.categoriaNombre || item.periodoaporte || 'General'),
            rawItem: item,
          };
        });

        setTransactions(mapped);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Error loading records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeSection, interfaceId, currentPage, pageSize, filters]);

  // Initial load effect
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      if (!isMounted) return;
      await loadInterfaceDetails();
      await loadBalances();
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [loadInterfaceDetails, loadBalances]);

  // Section records load effect
  useEffect(() => {
    let isMounted = true;
    async function fetchRecords() {
      if (!isMounted) return;
      await loadSectionRecords();
    }
    fetchRecords();
    return () => {
      isMounted = false;
    };
  }, [loadSectionRecords]);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    } finally {
      window.location.href = '/';
    }
  };

  const handleSortChange = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleSortSelect = (field: SortField, order: SortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  // Delete/Deactivate Handler (Baja Lógica)
  const handleDeleteTransaction = async (id: string | number) => {
    if (!confirm(`¿Está seguro de desactivar este registro de ${activeSection}?`)) return;

    try {
      const endpoint =
        activeSection === 'Gastos'
          ? `/api/interfaces/${interfaceId}/gastos?idgasto=${id}`
          : activeSection === 'Ingresos'
          ? `/api/interfaces/${interfaceId}/ingresos?idingreso=${id}`
          : `/api/interfaces/${interfaceId}/ahorros?idahorro=${id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        setTransactions(transactions.filter((tx) => String(tx.id) !== String(id)));
        loadBalances();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al desactivar el registro');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  // Edit Click Handler
  const handleEditClick = (tx: Transaction) => {
    const raw = tx.rawItem;
    if (activeSection === 'Gastos') {
      setEditingGasto({
        idgasto: String(tx.id),
        fecha: tx.date,
        moneda: tx.currency,
        importe: tx.amount,
        comentario: tx.comment,
        idcategoria: raw?.idcategoria ? String(raw.idcategoria) : undefined,
        idsubmetodopago: raw?.idsubmetodopago ? String(raw.idsubmetodopago) : undefined,
        responsablegasto: raw?.responsablegasto ? String(raw.responsablegasto) : undefined,
      });
      setIsGastoModalOpen(true);
    } else if (activeSection === 'Ingresos') {
      setEditingIngreso({
        idingreso: String(tx.id),
        fecha: tx.date,
        moneda: tx.currency,
        importe: tx.amount,
        comentario: tx.comment,
        responsableingreso: raw?.responsableingreso ? String(raw.responsableingreso) : undefined,
      });
      setIsIngresoModalOpen(true);
    } else if (activeSection === 'Ahorros') {
      setEditingAhorro({
        idahorro: String(tx.id),
        fechadesde: raw?.fechadesde ? String(raw.fechadesde) : tx.date,
        fechahasta: raw?.fechahasta ? String(raw.fechahasta) : tx.date,
        moneda: tx.currency,
        importe: tx.amount,
        comentario: tx.comment,
        periodoaporte: (raw?.periodoaporte as 'Semanal' | 'Mensual' | 'Trimestral' | 'Anual') || 'Mensual',
      });
      setIsAhorroModalOpen(true);
    }
  };

  // Save Handlers for Modals
  const handleSaveGasto = async (data: GastoFormData) => {
    const method = data.idgasto ? 'PUT' : 'POST';
    const res = await fetch(`/api/interfaces/${interfaceId}/gastos`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar gasto');
    loadSectionRecords();
    loadBalances();
  };

  const handleSaveIngreso = async (data: IngresoFormData) => {
    const method = data.idingreso ? 'PUT' : 'POST';
    const res = await fetch(`/api/interfaces/${interfaceId}/ingresos`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar ingreso');
    loadSectionRecords();
    loadBalances();
  };

  const handleSaveAhorro = async (data: AhorroFormData) => {
    const method = data.idahorro ? 'PUT' : 'POST';
    const res = await fetch(`/api/interfaces/${interfaceId}/ahorros`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al guardar ahorro');
    loadSectionRecords();
    loadBalances();
  };

  // Category ABM Handlers
  const handleCreateCategory = async (data: Omit<CategoriaItem, 'id'>) => {
    const res = await fetch(`/api/interfaces/${interfaceId}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear categoría');
    loadInterfaceDetails();
  };

  const handleUpdateCategory = async (data: CategoriaItem) => {
    const res = await fetch(`/api/interfaces/${interfaceId}/categorias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idcategoria: data.id, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar categoría');
    loadInterfaceDetails();
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/interfaces/${interfaceId}/categorias?idcategoria=${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar categoría');
    loadInterfaceDetails();
  };

  // Submethod ABM Handlers
  const handleCreateSubmethod = async (data: Omit<SubmetodoItem, 'id'>) => {
    const res = await fetch(`/api/interfaces/${interfaceId}/submetodos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear submétodo');
    loadInterfaceDetails();
  };

  const handleUpdateSubmethod = async (data: SubmetodoItem) => {
    const res = await fetch(`/api/interfaces/${interfaceId}/submetodos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idsubmetodopago: data.id, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar submétodo');
    loadInterfaceDetails();
  };

  const handleDeleteSubmethod = async (id: string) => {
    const res = await fetch(`/api/interfaces/${interfaceId}/submetodos?idsubmetodopago=${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar submétodo');
    loadInterfaceDetails();
  };

  // Filtered & Sorted Client view
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (sortBy === 'amount') {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
    if (sortBy === 'user') {
      return sortOrder === 'desc' ? b.user.localeCompare(a.user) : a.user.localeCompare(b.user);
    }
    return sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
  });

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center gap-6 p-3 sm:p-8 font-sans relative overflow-x-hidden">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="w-full max-w-4xl flex justify-between items-center bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            &larr; Dashboard
          </button>
          <span className="text-slate-800">|</span>
          <span className="text-xs text-slate-300 font-medium bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg truncate max-w-[150px]">
            {interfaceData?.nombre || `Interfaz #${interfaceId}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1">
            <Shield className="w-3 h-3 text-violet-400" />
            {userRole}
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* General Balances Cards (RF19) */}
      <div className="w-full max-w-4xl">
        <BalanceCards balances={balances} isLoading={isLoading} />
      </div>

      {/* ABM Modals Trigger Bar */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Acciones ABM:</span>
          <button
            onClick={() => {
              setEditingGasto(null);
              setIsGastoModalOpen(true);
            }}
            className="text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Gasto
          </button>
          <button
            onClick={() => {
              setEditingIngreso(null);
              setIsIngresoModalOpen(true);
            }}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Ingreso
          </button>
          <button
            onClick={() => {
              setEditingAhorro(null);
              setIsAhorroModalOpen(true);
            }}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Ahorro (Admin)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-violet-400" /> Categorías ({categories.length})
          </button>
          <button
            onClick={() => setIsSubmethodModalOpen(true)}
            className="text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Submétodos ({submethods.length})
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar (RF29) */}
      <div className="w-full max-w-4xl">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          submethods={submethods}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>

      {/* MOBILE-FIRST SMARTPHONE FRAME */}
      <div className="w-full max-w-[380px] h-[740px] bg-slate-950 rounded-[2.25rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex flex-col md:hidden relative">
        {/* Status bar */}
        <div className="h-7 bg-slate-950 flex items-center justify-between px-5 shrink-0 border-b border-slate-900">
          <span className="text-slate-200 text-[11px] font-medium">12:30</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryFull className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Header */}
        <Header
          activeSection={activeSection}
          onSectionChange={(sec) => setActiveSection(sec as typeof activeSection)}
          userInitials={userInitials}
          userRole={userRole}
          onMenuClick={() => (window.location.href = '/dashboard')}
          onOpenCategories={() => setIsCategoryModalOpen(true)}
          onOpenSubmethods={() => setIsSubmethodModalOpen(true)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortSelect={handleSortSelect}
        />

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-950/60 pb-16">
          {activeSection === 'Resúmenes' ? (
            <UserExpenseChart transactions={transactions} title="Distribución de Movimientos" />
          ) : (
            <>
              {isLoading ? (
                <div className="text-center py-12 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                  Cargando {activeSection}...
                </div>
              ) : (
                <>
                  {sortedTransactions.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      isOpen={expandedId === tx.id}
                      onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteTransaction}
                    />
                  ))}

                  {sortedTransactions.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-500">
                      No encontramos registros de {activeSection} que coincidan con la búsqueda.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />

        <BottomNav
          activeSection={activeSection}
          onSectionChange={(sec) => setActiveSection(sec as typeof activeSection)}
        />
      </div>

      {/* DESKTOP / TABLET RESPONSIVE VIEW (md:) */}
      <div className="hidden md:flex flex-col w-full max-w-4xl bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
        <Header
          activeSection={activeSection}
          onSectionChange={(sec) => setActiveSection(sec as typeof activeSection)}
          userInitials={userInitials}
          userRole={userRole}
          onMenuClick={() => (window.location.href = '/dashboard')}
          onOpenCategories={() => setIsCategoryModalOpen(true)}
          onOpenSubmethods={() => setIsSubmethodModalOpen(true)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortSelect={handleSortSelect}
        />

        <div className="p-6 space-y-6">
          {activeSection === 'Resúmenes' ? (
            <UserExpenseChart
              transactions={transactions}
              title={`Estadísticas por Usuario — ${activeSection}`}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Registros de {activeSection}
                  </h2>
                  <span className="text-xs text-slate-400 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {sortedTransactions.length} items
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (activeSection === 'Gastos') {
                      setEditingGasto(null);
                      setIsGastoModalOpen(true);
                    } else if (activeSection === 'Ingresos') {
                      setEditingIngreso(null);
                      setIsIngresoModalOpen(true);
                    } else {
                      setEditingAhorro(null);
                      setIsAhorroModalOpen(true);
                    }
                  }}
                  className="text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white px-3.5 py-2 rounded-xl shadow-lg shadow-violet-600/30 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Agregar {activeSection.slice(0, -1)}
                </button>
              </div>

              {isLoading ? (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
                  Cargando {activeSection}...
                </div>
              ) : sortedTransactions.length > 0 ? (
                <TransactionTable
                  transactions={sortedTransactions}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                  onDelete={handleDeleteTransaction}
                  onEdit={handleEditClick}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
              ) : (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-10 text-center text-xs text-slate-500">
                  No encontramos registros de {activeSection} que coincidan con la búsqueda.
                </div>
              )}
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ABM Form Modals with dynamic keys for clean mount initialization */}
      <GastoFormModal
        key={editingGasto?.idgasto || (isGastoModalOpen ? 'new-gasto-open' : 'new-gasto-closed')}
        isOpen={isGastoModalOpen}
        onClose={() => setIsGastoModalOpen(false)}
        onSave={handleSaveGasto}
        initialData={editingGasto}
        categories={categories}
        submethods={submethods}
        members={members}
      />

      <IngresoFormModal
        key={editingIngreso?.idingreso || (isIngresoModalOpen ? 'new-ingreso-open' : 'new-ingreso-closed')}
        isOpen={isIngresoModalOpen}
        onClose={() => setIsIngresoModalOpen(false)}
        onSave={handleSaveIngreso}
        initialData={editingIngreso}
        members={members}
      />

      <AhorroFormModal
        key={editingAhorro?.idahorro || (isAhorroModalOpen ? 'new-ahorro-open' : 'new-ahorro-closed')}
        isOpen={isAhorroModalOpen}
        onClose={() => setIsAhorroModalOpen(false)}
        onSave={handleSaveAhorro}
        initialData={editingAhorro}
        userRole={userRole}
      />

      <CategoriaManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCreate={handleCreateCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />

      <SubmetodoManagerModal
        isOpen={isSubmethodModalOpen}
        onClose={() => setIsSubmethodModalOpen(false)}
        submethods={submethods}
        onCreate={handleCreateSubmethod}
        onUpdate={handleUpdateSubmethod}
        onDelete={handleDeleteSubmethod}
      />
    </div>
  );
}
