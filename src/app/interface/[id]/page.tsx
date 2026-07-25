'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { Plus, Minus, RefreshCw, Eye, EyeOff, PieChart, Sliders } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Header } from '@/components/interface/Header';
import { InviteModal } from '@/components/interface/InviteModal';
import { TransactionCard, Transaction } from '@/components/interface/TransactionCard';
import { SortField, SortOrder } from '@/components/interface/TransactionTable';
import { TransactionDetailModal } from '@/components/interface/TransactionDetailModal';
import { Pagination } from '@/components/interface/Pagination';
import { BottomNav } from '@/components/interface/BottomNav';
import { UserExpenseChart } from '@/components/interface/UserExpenseChart';
import { GeneralBalances } from '@/components/interface/BalanceCards';
import { FilterBar, FilterState } from '@/components/interface/FilterBar';
import { GastoFormModal, GastoFormData } from '@/components/interface/GastoFormModal';
import { IngresoFormModal, IngresoFormData } from '@/components/interface/IngresoFormModal';
import { AhorroFormModal, AhorroFormData } from '@/components/interface/AhorroFormModal';
import { ComparativeReportsDashboard } from '@/components/interface/ComparativeReportsDashboard';
import { CategoriaManagerModal, CategoriaItem } from '@/components/interface/CategoriaManagerModal';
import { SubmetodoManagerModal, SubmetodoItem } from '@/components/interface/SubmetodoManagerModal';
import { AuditHistoryModal } from '@/components/interface/AuditHistoryModal';

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
  const [summarySubTab, setSummarySubTab] = useState<'comparative' | 'user'>('comparative');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Fintech Mercado Pago UI states
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD' | 'UYU'>('ARS');
  const [selectedTransactionForModal, setSelectedTransactionForModal] = useState<Transaction | null>(null);
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);

  // Audit History Modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTypeFilter, setAuditTypeFilter] = useState<'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite'>('todos');
  const [auditEntityId, setAuditEntityId] = useState<string | null>(null);
  const [auditTitle, setAuditTitle] = useState<string | undefined>(undefined);

  const handleOpenAuditModal = (
    type: 'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite' = 'todos',
    entityId?: string | number | null,
    title?: string
  ) => {
    setAuditTypeFilter(type);
    setAuditEntityId(entityId ? String(entityId) : null);
    setAuditTitle(title);
    setIsAuditModalOpen(true);
  };


  // User initials
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'EX';

  // 1. Fetch Interface Details & Config
  const loadInterfaceDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/details`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 403) {
          alert('No tienes acceso a esta interfaz o ha sido eliminada.');
          window.location.href = '/dashboard';
        }
        return;
      }
      const data = await res.json();
      setInterfaceData(data.interface);
      setUserRole(data.role || 'Visualizador');
      setCategories(data.categories || []);
      setSubmethods(data.submethods || []);
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching interface details:', err);
    }
  }, [interfaceId]);

  // 2. Fetch General Balances (RF19)
  const loadBalances = useCallback(async () => {
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/balance`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.balances) {
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
      if (!res.ok) {
        setTransactions([]);
        return;
      }
      const json = await res.json();

      if (Array.isArray(json.data)) {
        // Map backend records to unified Transaction format for components
        const mapped: Transaction[] = json.data.map((item: Record<string, unknown>) => {
          const amt = Number(item.importe || 0);
          const curr = String(item.moneda || 'ARS');
          const catName = item.categoriaNombre ? String(item.categoriaNombre) : undefined;
          const isGasto = activeSection === 'Gastos';
          const isIngreso = activeSection === 'Ingresos';

          return {
            id: String(item.id),
            date: item.fecha ? String(item.fecha).split('T')[0] : (item.fechadesde ? String(item.fechadesde).split('T')[0] : 'Hoy'),
            user: String(item.responsableNombre || 'Usuario'),
            avatar: item.responsableFotoPerfil ? String(item.responsableFotoPerfil) : null,
            initials: String(item.responsableNombre || 'U').slice(0, 2).toUpperCase(),
            amount: amt,
            currency: curr,
            ars: curr === 'ARS' ? amt.toLocaleString('es-AR') : (amt * 1100).toLocaleString('es-AR'),
            usd: curr === 'USD' ? String(amt) : (amt / 1100).toFixed(1),
            uyu: (amt * 0.04).toFixed(0),
            comment: String(item.comentario || ''),
            method: item.submetodoNombre ? `${item.metodoBase || ''} - ${item.submetodoNombre}` : String(item.categoriaNombre || item.periodoaporte || 'General'),
            category: catName,
            type: isGasto ? 'Gasto' : isIngreso ? 'Ingreso' : 'Ahorro',
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

  const handleLeaveOrDeleteInterface = async () => {
    const isAdmin = userRole === 'Administrador';
    const confirmMessage = isAdmin
      ? '¿Estás seguro de que deseas eliminar permanentemente esta interfaz? Se eliminarán todas las operaciones.'
      : '¿Estás seguro de que deseas salir de esta interfaz? Dejarás de pertenecer a este grupo.';

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/interfaces/${interfaceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || (isAdmin ? 'Interfaz eliminada' : 'Has salido de la interfaz'));
        window.location.href = '/dashboard';
      } else {
        alert(data.error || 'Error al procesar la solicitud');
      }
    } catch {
      alert('Error al conectar con el servidor');
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

  const currBalanceObj = balances?.[selectedCurrency];
  const totalBalanceAmount =
    (activeSection === 'Ingresos'
      ? currBalanceObj?.ingresos
      : activeSection === 'Ahorros'
      ? currBalanceObj?.ahorros
      : currBalanceObj?.gastos) ??
    transactions
      .filter((t) => t.currency === selectedCurrency)
      .reduce((acc, t) => acc + t.amount, 0);

  const currencySymbol = selectedCurrency === 'USD' ? 'US$' : selectedCurrency === 'UYU' ? '$U' : '$';

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center items-start p-0 md:py-8 font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Container Frame */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 min-h-screen md:min-h-[840px] md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between relative transition-colors">
        <div>
          {/* Header Component */}
          <Header
            interfaceId={interfaceId}
            interfaceName={interfaceData?.nombre}
            activeSection={activeSection}
            onSectionChange={(sec) => setActiveSection(sec as typeof activeSection)}
            userInitials={userInitials}
            userRole={userRole}
            onMenuClick={() => (window.location.href = '/dashboard')}
            onOpenCategories={() => setIsCategoryModalOpen(true)}
            onOpenSubmethods={() => setIsSubmethodModalOpen(true)}
            onOpenAudit={() => handleOpenAuditModal('todos')}
            onDeleteInterface={handleLeaveOrDeleteInterface}
            onNotificationHandled={loadInterfaceDetails}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortSelect={handleSortSelect}
          />

          <main className="p-5 space-y-6">
            {/* HERO BALANCE CARD */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-500/30 p-5 shadow-xl shadow-indigo-950/40">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1">
                <span className="uppercase tracking-wider font-semibold text-slate-300">
                  {activeSection === 'Gastos'
                    ? 'GASTOS DEL MES'
                    : activeSection === 'Ingresos'
                    ? 'INGRESOS DEL MES'
                    : activeSection === 'Ahorros'
                    ? 'AHORROS ACUMULADOS'
                    : 'BALANCE GENERAL'}
                </span>
                <button
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 transition-colors bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-700/40"
                >
                  {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isBalanceVisible ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>

              <div className="my-2 flex items-center justify-between gap-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
                  {isBalanceVisible ? (
                    <>
                      <span className="text-xl font-bold text-indigo-400">{currencySymbol}</span>
                      {totalBalanceAmount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </>
                  ) : (
                    '••••••••'
                  )}
                </h2>

                {/* Currency Selector Pills */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/90 shadow-inner">
                  {(['ARS', 'USD', 'UYU'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                        selectedCurrency === curr
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                      title={`Ver balance en ${curr}`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                ↓ 12% respecto al mes pasado
              </span>

              {/* Quick Action Grid Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800/80 mt-4">
                <button
                  onClick={() => { setEditingIngreso(null); setIsIngresoModalOpen(true); }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">Ingreso</span>
                </button>

                <button
                  onClick={() => { setEditingGasto(null); setIsGastoModalOpen(true); }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                    <Minus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">Gasto</span>
                </button>

                <button
                  onClick={() => setActiveSection('Resúmenes')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 group-hover:text-white transition-all shadow-sm">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">Resumen</span>
                </button>

                <button
                  onClick={() => setIsFilterBarOpen(!isFilterBarOpen)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 group-hover:text-white transition-all shadow-sm">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">Filtros</span>
                </button>
              </div>
            </div>

            {/* Filter Bar (Collapsible) */}
            {isFilterBarOpen && (
              <div className="animate-in fade-in duration-150">
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  categories={categories}
                  submethods={submethods}
                  onReset={() => setFilters(DEFAULT_FILTERS)}
                />
              </div>
            )}

            {/* RECENT ACTIVITY SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200">Actividad Reciente</h3>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                  {['Gastos', 'Ingresos', 'Ahorros', 'Resúmenes'].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setActiveSection(sec as typeof activeSection)}
                      className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                        activeSection === sec
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {activeSection === 'Resúmenes' ? (
                <div className="space-y-3">
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setSummarySubTab('comparative')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        summarySubTab === 'comparative'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Reportes
                    </button>
                    <button
                      onClick={() => setSummarySubTab('user')}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                        summarySubTab === 'user'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Por Integrante
                    </button>
                  </div>

                  {summarySubTab === 'comparative' ? (
                    <ComparativeReportsDashboard interfaceId={interfaceId} categories={categories} />
                  ) : (
                    <UserExpenseChart transactions={transactions} title="Distribución de Movimientos" />
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden shadow-lg">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      Cargando movimientos...
                    </div>
                  ) : sortedTransactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No hay movimientos registrados en esta sección.
                    </div>
                  ) : (
                    sortedTransactions.map((tx) => (
                      <TransactionCard
                        key={tx.id}
                        transaction={tx}
                        onSelect={(transaction) => setSelectedTransactionForModal(transaction)}
                      />
                    ))
                  )}
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeSection={activeSection}
          onSectionChange={(sec) => setActiveSection(sec as typeof activeSection)}
        />
      </div>

      {/* Transaction Detail Bottom Sheet Modal */}
      <TransactionDetailModal
        transaction={selectedTransactionForModal}
        isOpen={!!selectedTransactionForModal}
        onClose={() => setSelectedTransactionForModal(null)}
        onEdit={handleEditClick}
        onDelete={handleDeleteTransaction}
        onViewHistory={(tx) =>
          handleOpenAuditModal(
            activeSection === 'Gastos'
              ? 'gasto'
              : activeSection === 'Ingresos'
              ? 'ingreso'
              : 'ahorro',
            tx.id,
            tx.comment || tx.user
          )
        }
      />

      {/* ABM Form Modals */}
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
        onViewHistory={(cat) => handleOpenAuditModal('limite', cat.id, cat.nombre)}
        userRole={userRole}
      />

      <SubmetodoManagerModal
        isOpen={isSubmethodModalOpen}
        onClose={() => setIsSubmethodModalOpen(false)}
        submethods={submethods}
        onCreate={handleCreateSubmethod}
        onUpdate={handleUpdateSubmethod}
        onDelete={handleDeleteSubmethod}
      />

      <AuditHistoryModal
        key={`${auditTypeFilter}-${auditEntityId || 'all'}-${isAuditModalOpen}`}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        interfaceId={interfaceId}
        initialTypeFilter={auditTypeFilter}
        entityIdFilter={auditEntityId}
        titleFilter={auditTitle}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        interfaceId={interfaceId}
        interfaceName={interfaceData?.nombre}
      />
    </div>
  );
}
