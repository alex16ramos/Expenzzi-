'use client';

import React, { useState, useEffect, useCallback, useMemo, use, useRef } from 'react';
import { Layers } from 'lucide-react';
import { Header } from '@/components/interface/Header';
import { SideMenu } from '@/components/interface/SideMenu';
import { TransactionCard, Transaction } from '@/components/interface/TransactionCard';
import { SortField, SortOrder } from '@/components/interface/TransactionTable';
import { TransactionDetailPanel } from '@/components/interface/TransactionDetailPanel';
import { Pagination } from '@/components/interface/Pagination';
import { BottomNav } from '@/components/interface/BottomNav';
import { FabButton } from '@/components/interface/FabButton';
import { BalanceCards, GeneralBalances } from '@/components/interface/BalanceCards';
import { FilterBar, MultiFilterState } from '@/components/interface/FilterBar';
import { GastoFormModal, GastoFormData } from '@/components/interface/GastoFormModal';
import { IngresoFormModal, IngresoFormData } from '@/components/interface/IngresoFormModal';
import { AhorroFormModal, AhorroFormData } from '@/components/interface/AhorroFormModal';
import { ComparativeReportsDashboard } from '@/components/interface/ComparativeReportsDashboard';
import { UserExpenseChart } from '@/components/interface/UserExpenseChart';
import { GastosCompartidosSection } from '@/components/interface/GastosCompartidosSection';
import { CategoriaManagerModal, CategoriaItem } from '@/components/interface/CategoriaManagerModal';
import { SubmetodoManagerModal, SubmetodoItem } from '@/components/interface/SubmetodoManagerModal';
import { AuditHistoryModal } from '@/components/interface/AuditHistoryModal';
import { InviteModal } from '@/components/interface/InviteModal';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { enqueueOfflineMutation } from '@/lib/offline-sync';
import { itemsNav } from '@/lib/nav-items';

interface PageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_MULTI_FILTERS: MultiFilterState = {
  search: '',
  categoryIds: [],
  submethodIds: [],
  metodos: [],
  monedas: [],
  fechaDesde: '',
  fechaHasta: '',
  minImporte: '',
  maxImporte: '',
};



export default function InterfaceDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const interfaceId = resolvedParams.id;

  // Interface state
  const [detailsState, setDetailsState] = useState({
    interfaceData: null as { nombre: string; descripcion?: string } | null,
    userRole: 'Visualizador',
    categories: [] as CategoriaItem[],
    submethods: [] as SubmetodoItem[],
    members: [] as { idusuario: string; nombreusuario: string }[],
    balances: {
      ARS: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
      USD: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
      UYU: { ingresos: 0, gastos: 0, ahorros: 0, net: 0 },
    } as GeneralBalances,
  });

  const { interfaceData, userRole, categories, submethods, members, balances } = detailsState;

  const setInterfaceData = (val: { nombre: string; descripcion?: string } | null) =>
    setDetailsState((prev) => ({ ...prev, interfaceData: val }));
  const setUserRole = (val: string) => setDetailsState((prev) => ({ ...prev, userRole: val }));
  const setCategories = (val: CategoriaItem[]) => setDetailsState((prev) => ({ ...prev, categories: val }));
  const setSubmethods = (val: SubmetodoItem[]) => setDetailsState((prev) => ({ ...prev, submethods: val }));
  const setMembers = (val: { idusuario: string; nombreusuario: string }[]) =>
    setDetailsState((prev) => ({ ...prev, members: val }));
  const setBalances = (val: GeneralBalances) => setDetailsState((prev) => ({ ...prev, balances: val }));

  // Selected Currency for Folder Tabs
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD' | 'UYU'>('ARS');

  // Navigation & View state
  const [activeSection, setActiveSection] = useState<'Gastos' | 'Ingresos' | 'Ahorros' | 'Resúmenes'>('Gastos');
  const [summarySubTab, setSummarySubTab] = useState<'comparative' | 'user' | 'shared'>('comparative');
  const [filters, setFilters] = useState<MultiFilterState>(DEFAULT_MULTI_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isBalancesLoading, setIsBalancesLoading] = useState(true);

  // SideMenu UI state
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);

  // Sorting
  const [sortBy] = useState<SortField>('date');
  const [sortOrder] = useState<SortOrder>('desc');

  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals state
  const [modalsState, setModalsState] = useState({
    isGastoModalOpen: false,
    editingGasto: null as GastoFormData | null,
    isIngresoModalOpen: false,
    editingIngreso: null as IngresoFormData | null,
    isAhorroModalOpen: false,
    editingAhorro: null as AhorroFormData | null,
    isCategoryModalOpen: false,
    isSubmethodModalOpen: false,
    isInviteModalOpen: false,
    selectedTransactionForModal: null as Transaction | null,
  });

  const {
    isGastoModalOpen,
    editingGasto,
    isIngresoModalOpen,
    editingIngreso,
    isAhorroModalOpen,
    editingAhorro,
    isCategoryModalOpen,
    isSubmethodModalOpen,
    isInviteModalOpen,
    selectedTransactionForModal,
  } = modalsState;

  const setIsGastoModalOpen = (val: boolean) => setModalsState((prev) => ({ ...prev, isGastoModalOpen: val }));
  const setEditingGasto = (val: GastoFormData | null) => setModalsState((prev) => ({ ...prev, editingGasto: val }));
  const setIsIngresoModalOpen = (val: boolean) => setModalsState((prev) => ({ ...prev, isIngresoModalOpen: val }));
  const setEditingIngreso = (val: IngresoFormData | null) => setModalsState((prev) => ({ ...prev, editingIngreso: val }));
  const setIsAhorroModalOpen = (val: boolean) => setModalsState((prev) => ({ ...prev, isAhorroModalOpen: val }));
  const setEditingAhorro = (val: AhorroFormData | null) => setModalsState((prev) => ({ ...prev, editingAhorro: val }));
  const setIsCategoryModalOpen = (val: boolean) => setModalsState((prev) => ({ ...prev, isCategoryModalOpen: val }));
  const setIsSubmethodModalOpen = (val: boolean) => setModalsState((prev) => ({ ...prev, isSubmethodModalOpen: val }));
  const setIsInviteModalOpen = (val: boolean) => setModalsState((prev) => ({ ...prev, isInviteModalOpen: val }));
  const setSelectedTransactionForModal = (val: Transaction | null) => setModalsState((prev) => ({ ...prev, selectedTransactionForModal: val }));

  // Delete Confirm Dialog state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingInterface, setIsDeletingInterface] = useState(false);

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

  // 1. Fetch Interface Details
  const loadInterfaceDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/details`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 403) {
          toast.error('No tienes acceso a esta interfaz o fue eliminada.');
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

  // 2. Fetch Balances
  const loadBalances = useCallback(async () => {
    setIsBalancesLoading(true);
    try {
      const res = await fetch(`/api/interfaces/${interfaceId}/balance`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.balances) {
        setBalances(data.balances);
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
    } finally {
      setIsBalancesLoading(false);
    }
  }, [interfaceId]);

  const recordsCacheRef = useRef<Record<string, Transaction[]>>({});

  // 3. Fetch Records with Instant Client-Side In-Memory Cache
  const loadSectionRecords = useCallback(async () => {
    if (activeSection === 'Resúmenes') {
      setIsLoading(false);
      return;
    }

    const hasCachedData = Boolean(recordsCacheRef.current[activeSection]);

    // Only show loading skeletons if we don't have cached data yet for this section
    if (!hasCachedData) {
      setIsLoading(true);
    }

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(currentPage));
      queryParams.set('pageSize', String(pageSize));

      if (filters.search) queryParams.set('search', filters.search);
      if (filters.categoryIds.length > 0) queryParams.set('categoryId', filters.categoryIds.join(','));
      if (filters.submethodIds.length > 0) queryParams.set('submethodId', filters.submethodIds.join(','));
      if (filters.metodos.length > 0) queryParams.set('metodo', filters.metodos.join(','));
      if (filters.monedas.length > 0) queryParams.set('moneda', filters.monedas.join(','));
      if (filters.fechaDesde) queryParams.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) queryParams.set('fechaHasta', filters.fechaHasta);
      if (filters.minImporte) queryParams.set('minImporte', filters.minImporte);
      if (filters.maxImporte) queryParams.set('maxImporte', filters.maxImporte);
      if (filters.estadoFilter) queryParams.set('estado', filters.estadoFilter);

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
            estado: item.estado !== false,
            rawItem: item,
          };
        });

        recordsCacheRef.current[activeSection] = mapped;
        const cacheKeys = Object.keys(recordsCacheRef.current);
        if (cacheKeys.length > 5) {
          delete recordsCacheRef.current[cacheKeys[0]];
        }
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

  // Initial load
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

  // Section load
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

  const loadBalancesRef = useRef(loadBalances);
  const loadSectionRecordsRef = useRef(loadSectionRecords);

  useEffect(() => {
    loadBalancesRef.current = loadBalances;
    loadSectionRecordsRef.current = loadSectionRecords;
  });

  // REALTIME SERVER-SENT EVENTS (SSE) CONNECTION (Static connection per interface)
  useEffect(() => {
    if (!interfaceId) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;

    try {
      eventSource = new EventSource(`/api/interfaces/${interfaceId}/realtime`);

      eventSource.onmessage = (event) => {
        retryCount = 0;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'MUTATION') {
            recordsCacheRef.current = {};
            if (loadBalancesRef.current) loadBalancesRef.current();
            if (loadSectionRecordsRef.current) loadSectionRecordsRef.current();
          }
        } catch {
          // Ignore
        }
      };

      eventSource.onerror = () => {
        retryCount++;
        if (retryCount >= 5) {
          console.warn('Realtime SSE desconectado tras superar el máximo de reintentos.');
          if (eventSource) {
            eventSource.close();
          }
        }
      };
    } catch (err) {
      console.error('Error connecting Realtime SSE:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [interfaceId]);

  // Delete Interface
  const executeDeleteOrLeaveInterface = async () => {
    setIsDeletingInterface(true);
    const isAdmin = userRole === 'Administrador';

    try {
      const res = await fetch(`/api/interfaces/${interfaceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Error al procesar la solicitud');
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (isAdmin ? 'Interfaz eliminada correctamente' : 'Has salido de la interfaz'));
        window.location.href = '/dashboard';
      } else {
        toast.error(data.error || 'Error al procesar la solicitud');
      }
    } catch {
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsDeletingInterface(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Delete Transaction Handler (Baja Lógica)
  const handleDeleteTransaction = useCallback(
    async (id: string | number) => {
      try {
        const endpoint =
          activeSection === 'Gastos'
            ? `/api/interfaces/${interfaceId}/gastos?idgasto=${id}`
            : activeSection === 'Ingresos'
              ? `/api/interfaces/${interfaceId}/ingresos?idingreso=${id}`
              : `/api/interfaces/${interfaceId}/ahorros?idahorro=${id}`;

        const res = await fetch(endpoint, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Movimiento dado de baja correctamente');
          loadSectionRecords();
          loadBalances();
          if (selectedTransactionForModal && String(selectedTransactionForModal.id) === String(id)) {
            setSelectedTransactionForModal(null);
          }
        } else {
          const err = await res.json();
          toast.error(err.error || 'Error al dar de baja movimiento');
        }
      } catch {
        toast.error('Error de conexión al dar de baja');
      }
    },
    [activeSection, interfaceId, loadBalances, loadSectionRecords, selectedTransactionForModal]
  );

  // Restore Transaction Handler (Reactivación)
  const handleRestoreTransaction = useCallback(
    async (id: string | number) => {
      try {
        const endpoint =
          activeSection === 'Gastos'
            ? `/api/interfaces/${interfaceId}/gastos`
            : activeSection === 'Ingresos'
              ? `/api/interfaces/${interfaceId}/ingresos`
              : `/api/interfaces/${interfaceId}/ahorros`;

        const idKey = activeSection === 'Gastos' ? 'idgasto' : activeSection === 'Ingresos' ? 'idingreso' : 'idahorro';

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [idKey]: id, estado: true }),
        });

        if (res.ok) {
          toast.success('Movimiento reactivado correctamente');
          loadSectionRecords();
          loadBalances();
          if (selectedTransactionForModal && String(selectedTransactionForModal.id) === String(id)) {
            setSelectedTransactionForModal(null);
          }
        } else {
          const err = await res.json();
          toast.error(err.error || 'Error al reactivar movimiento');
        }
      } catch {
        toast.error('Error de conexión al reactivar');
      }
    },
    [activeSection, interfaceId, loadBalances, loadSectionRecords, selectedTransactionForModal]
  );

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
        escompartido: Boolean(raw?.escompartido),
        participantes: Array.isArray(raw?.participantes) ? raw.participantes : [],
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

  // Save Handlers (Offline-First Ready)
  const handleSaveGasto = async (data: GastoFormData) => {
    const isEdit = !!data.idgasto;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = `/api/interfaces/${interfaceId}/gastos`;

    if (typeof window !== 'undefined' && !navigator.onLine) {
      enqueueOfflineMutation(
        endpoint,
        method,
        data as unknown as Record<string, unknown>,
        `Gasto: ${data.comentario || 'Sin concepto'} (${data.importe} ${data.moneda})`
      );
      toast.info('Gasto guardado localmente (se sincronizará al recuperar la conexión)');
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al guardar gasto');
      }
      await res.json();
      toast.success(isEdit ? 'Gasto modificado correctamente' : 'Gasto registrado correctamente');
      loadSectionRecords();
      loadBalances();
    } catch (err: unknown) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        enqueueOfflineMutation(
          endpoint,
          method,
          data as unknown as Record<string, unknown>,
          `Gasto: ${data.comentario || 'Sin concepto'} (${data.importe} ${data.moneda})`
        );
        toast.info('Gasto guardado en almacenamiento local');
        return;
      }
      const msg = (err as { message?: string })?.message || 'Error al guardar gasto';
      throw new Error(msg);
    }
  };

  const handleSaveIngreso = async (data: IngresoFormData) => {
    const isEdit = !!data.idingreso;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = `/api/interfaces/${interfaceId}/ingresos`;

    if (typeof window !== 'undefined' && !navigator.onLine) {
      enqueueOfflineMutation(
        endpoint,
        method,
        data as unknown as Record<string, unknown>,
        `Ingreso: ${data.comentario || 'Sin concepto'} (${data.importe} ${data.moneda})`
      );
      toast.info('Ingreso guardado localmente (se sincronizará al recuperar la conexión)');
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al guardar ingreso');
      }
      await res.json();
      toast.success(isEdit ? 'Ingreso modificado correctamente' : 'Ingreso registrado correctamente');
      loadSectionRecords();
      loadBalances();
    } catch (err: unknown) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        enqueueOfflineMutation(
          endpoint,
          method,
          data as unknown as Record<string, unknown>,
          `Ingreso: ${data.comentario || 'Sin concepto'} (${data.importe} ${data.moneda})`
        );
        toast.info('Ingreso guardado en almacenamiento local');
        return;
      }
      const msg = (err as { message?: string })?.message || 'Error al guardar ingreso';
      throw new Error(msg);
    }
  };

  const handleSaveAhorro = async (data: AhorroFormData) => {
    const isEdit = !!data.idahorro;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = `/api/interfaces/${interfaceId}/ahorros`;

    if (typeof window !== 'undefined' && !navigator.onLine) {
      enqueueOfflineMutation(
        endpoint,
        method,
        data as unknown as Record<string, unknown>,
        `Ahorro: ${data.comentario || 'Sin concepto'} (${data.importe} ${data.moneda})`
      );
      toast.info('Ahorro guardado localmente (se sincronizará al recuperar la conexión)');
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al guardar ahorro');
      }
      await res.json();
      toast.success(isEdit ? 'Ahorro modificado correctamente' : 'Ahorro registrado correctamente');
      loadSectionRecords();
      loadBalances();
    } catch (err: unknown) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        enqueueOfflineMutation(
          endpoint,
          method,
          data as unknown as Record<string, unknown>,
          `Ahorro: ${data.comentario || 'Sin concepto'} (${data.importe} ${data.moneda})`
        );
        toast.info('Ahorro guardado en almacenamiento local');
        return;
      }
      const msg = (err as { message?: string })?.message || 'Error al guardar ahorro';
      throw new Error(msg);
    }
  };

  // Category ABM Handlers
  const handleCreateCategory = useCallback(
    async (data: Omit<CategoriaItem, 'id'>) => {
      const res = await fetch(`/api/interfaces/${interfaceId}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al crear categoría');
      }
      await res.json();
      toast.success('Categoría creada correctamente');
      loadInterfaceDetails();
    },
    [interfaceId, loadInterfaceDetails]
  );

  const handleUpdateCategory = useCallback(
    async (data: CategoriaItem) => {
      const res = await fetch(`/api/interfaces/${interfaceId}/categorias`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idcategoria: data.id, ...data }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar categoría');
      }
      await res.json();
      toast.success('Categoría actualizada');
      loadInterfaceDetails();
    },
    [interfaceId, loadInterfaceDetails]
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/interfaces/${interfaceId}/categorias?idcategoria=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al eliminar categoría');
      }
      await res.json();
      toast.success('Categoría eliminada');
      loadInterfaceDetails();
    },
    [interfaceId, loadInterfaceDetails]
  );

  // Submethod ABM Handlers
  const handleCreateSubmethod = useCallback(
    async (data: Omit<SubmetodoItem, 'id'>) => {
      const res = await fetch(`/api/interfaces/${interfaceId}/submetodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al crear submétodo');
      }
      await res.json();
      toast.success('Submétodo de pago creado');
      loadInterfaceDetails();
    },
    [interfaceId, loadInterfaceDetails]
  );

  const handleUpdateSubmethod = useCallback(
    async (data: SubmetodoItem) => {
      const res = await fetch(`/api/interfaces/${interfaceId}/submetodos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idsubmetodopago: data.id, ...data }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar submétodo');
      }
      await res.json();
      toast.success('Submétodo de pago actualizado');
      loadInterfaceDetails();
    },
    [interfaceId, loadInterfaceDetails]
  );

  const handleDeleteSubmethod = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/interfaces/${interfaceId}/submetodos?idsubmetodopago=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al eliminar submétodo');
      }
      await res.json();
      toast.success('Submétodo de pago eliminado');
      loadInterfaceDetails();
    },
    [interfaceId, loadInterfaceDetails]
  );

  // Sorted Transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      if (sortBy === 'user') {
        return sortOrder === 'desc' ? b.user.localeCompare(a.user) : a.user.localeCompare(b.user);
      }
      return sortOrder === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  }, [transactions, sortBy, sortOrder]);

  // Export Transactions to CSV (Compatible with Excel & Google Sheets)
  const handleExportCSV = useCallback(() => {
    if (!sortedTransactions || sortedTransactions.length === 0) {
      toast.error('No hay movimientos disponibles para exportar');
      return;
    }

    const headers = ['Fecha', 'Tipo', 'Categoría', 'Método / Submétodo', 'Comentario', 'Importe', 'Moneda', 'Registrado por'];

    const formatCell = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = sortedTransactions.map((tx) => [
      formatCell(tx.date),
      formatCell(tx.type),
      formatCell(tx.category || 'Sin Categoría'),
      formatCell(tx.method || 'General'),
      formatCell(tx.comment || ''),
      tx.amount,
      formatCell(tx.currency),
      formatCell(tx.user),
    ]);

    // sep=; directive forces Excel (Windows & Mac) to split columns cleanly by semicolon
    const csvContent =
      '\uFEFFsep=;\n' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = (interfaceData?.nombre || 'Interfaz').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Expenzzi_${safeName}_${activeSection}_${dateStr}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exportados ${sortedTransactions.length} registros a ${filename}`);
  }, [sortedTransactions, interfaceData?.nombre, activeSection]);

  const hasSelectedDetail = !!selectedTransactionForModal;

  return (
    <div className="max-h-dvh h-dvh w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* COLLAPSIBLE SIDEBAR MENU */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        isCollapsed={isSideMenuCollapsed}
        onToggleCollapse={() => setIsSideMenuCollapsed(!isSideMenuCollapsed)}
        role={userRole}
        onOpenAudit={() => handleOpenAuditModal('todos')}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onOpenSubmethods={() => setIsSubmethodModalOpen(true)}
        onOpenDelete={() => setIsDeleteConfirmOpen(true)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        interfaceName={interfaceData?.nombre}
      />

      {/* DYNAMIC 2-COLUMN GRID ON DESKTOP WHEN DETAIL IS SELECTED */}
      <div className="flex-1 flex flex-col justify-between min-h-dvh max-w-7xl mx-auto w-full">
        <div>
          {/* Header Bar */}
          <Header
            interfaceId={interfaceId}
            interfaceName={interfaceData?.nombre}
            userRole={userRole}
            onMenuClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
            onNotificationHandled={loadInterfaceDetails}
            onOpenInvite={() => setIsInviteModalOpen(true)}
          />

          <main className="py-2 px-4 pb-40 sm:py-4 lg:py-6">
            {/* GRID LAYOUT: 1 COLUMN DEFAULT, 2 COLUMNS ON DESKTOP WHEN TRANSACTION DETAIL IS ACTIVE */}
            <div className={`grid grid-cols-1 ${hasSelectedDetail ? 'lg:grid-cols-12 gap-6' : 'gap-6'} transition-colors duration-300`}>
              {/* COLUMN 1: MAIN INTERFACE CONTENT */}
              <div className={`${hasSelectedDetail ? 'lg:col-span-7' : 'w-full'} space-y-6 transition-colors duration-300`}>
                {/* HERO FOLDER TABS BALANCE CARDS */}
                <BalanceCards
                  balances={balances}
                  isLoading={isBalancesLoading}
                  selectedCurrency={selectedCurrency}
                  onCurrencySelect={setSelectedCurrency}
                />

                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" /> Movimientos & Operaciones
                  </h3>
                  {/* Section Selector Tabs */}
                  <div className="flex hidden lg:block bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                    {itemsNav.map((item) => (
                      <button
                        type="button"
                        key={item.label}
                        onClick={() => setActiveSection(item.label as typeof activeSection)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${activeSection === item.label
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}>
                        <item.icon className="w-4 h-4 mr-1 inline-block" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* MULTI-SELECT COLLAPSIBLE FILTER BAR */}
                <FilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  categories={categories}
                  submethods={submethods}
                  onReset={() => setFilters(DEFAULT_MULTI_FILTERS)}
                  onExportCSV={handleExportCSV}
                />

                {/* RECENT ACTIVITY SECTION */}
                <div className="space-y-4">

                  {activeSection === 'Resúmenes' ? (
                    <div className="space-y-4">
                      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setSummarySubTab('comparative')}
                          className={`flex-1 py-2 rounded-xl font-bold transition-colors ${summarySubTab === 'comparative'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                          Reportes Comparativos
                        </button>
                        <button
                          type="button"
                          onClick={() => setSummarySubTab('user')}
                          className={`flex-1 py-2 rounded-xl font-bold transition-colors ${summarySubTab === 'user'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                          Distribución por Integrante
                        </button>
                        <button
                          type="button"
                          onClick={() => setSummarySubTab('shared')}
                          className={`flex-1 py-2 rounded-xl font-bold transition-colors ${summarySubTab === 'shared'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                          Gastos Compartidos & Deudas
                        </button>
                      </div>

                      {summarySubTab === 'comparative' ? (
                        <ComparativeReportsDashboard interfaceId={interfaceId} categories={categories} />
                      ) : summarySubTab === 'user' ? (
                        <UserExpenseChart transactions={transactions} title="Distribución de Movimientos" />
                      ) : (
                        <GastosCompartidosSection interfaceId={interfaceId} members={members} />
                      )}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden shadow-sm">
                      {isLoading ? (
                        <div className="p-6 space-y-3">
                          {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-1.5">
                                  <Skeleton className="h-4 w-36 rounded-md" />
                                  <Skeleton className="h-3 w-24 rounded-md" />
                                </div>
                              </div>
                              <Skeleton className="h-5 w-20 rounded-md" />
                            </div>
                          ))}
                        </div>
                      ) : sortedTransactions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm space-y-2">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            No hay registros de {activeSection.toLowerCase()} para mostrar.
                          </p>
                          <p className="text-slate-500">
                            Utiliza el botón flotante (+) para registrar una nueva operación.
                          </p>
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
              </div>

              {/* COLUMN 2: INLINE DESKTOP TRANSACTION DETAIL PANEL */}
              {hasSelectedDetail && (
                <div className="hidden lg:block lg:col-span-5 sticky top-24 self-start animate-in fade-in duration-200">
                  <TransactionDetailPanel
                    transaction={selectedTransactionForModal}
                    isOpen={true}
                    isInline={true}
                    onClose={() => setSelectedTransactionForModal(null)}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTransaction}
                    onRestore={handleRestoreTransaction}
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
                </div>
              )}
            </div>
          </main>
        </div>

        {/* FIXED MOBILE BOTTOM NAVIGATION */}
        <div className="lg:hidden">
          <BottomNav
            activeSection={activeSection}
            onSectionChange={(sec) => setActiveSection(sec as typeof activeSection)}
          />
        </div>
      </div >

      {/* FLOATING ACTION BUTTON (FAB) */}
      < FabButton
        onOpenGastoModal={() => { setEditingGasto(null); setIsGastoModalOpen(true); }
        }
        onOpenIngresoModal={() => { setEditingIngreso(null); setIsIngresoModalOpen(true); }}
        onOpenAhorroModal={() => { setEditingAhorro(null); setIsAhorroModalOpen(true); }}
      />

      {/* MOBILE BOTTOM SHEET FOR TRANSACTION DETAIL */}
      <div className="lg:hidden">
        <TransactionDetailPanel
          transaction={selectedTransactionForModal}
          isOpen={!!selectedTransactionForModal}
          onClose={() => setSelectedTransactionForModal(null)}
          onEdit={handleEditClick}
          onDelete={handleDeleteTransaction}
          onRestore={handleRestoreTransaction}
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
      </div>

      {/* ABM FORM MODALS & DIALOGS */}
      <InterfaceModalsContainer
        interfaceId={interfaceId}
        userRole={userRole}
        interfaceData={interfaceData}
        categories={categories}
        submethods={submethods}
        members={members}
        modalsState={modalsState}
        setIsGastoModalOpen={setIsGastoModalOpen}
        setIsIngresoModalOpen={setIsIngresoModalOpen}
        setIsAhorroModalOpen={setIsAhorroModalOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        setIsSubmethodModalOpen={setIsSubmethodModalOpen}
        setIsInviteModalOpen={setIsInviteModalOpen}
        onInviteSent={loadInterfaceDetails}
        isDeleteConfirmOpen={isDeleteConfirmOpen}
        setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
        isDeletingInterface={isDeletingInterface}
        onExecuteDeleteOrLeaveInterface={executeDeleteOrLeaveInterface}
        isAuditModalOpen={isAuditModalOpen}
        setIsAuditModalOpen={setIsAuditModalOpen}
        auditTypeFilter={auditTypeFilter}
        auditEntityId={auditEntityId}
        auditTitle={auditTitle}
        onSaveGasto={handleSaveGasto}
        onSaveIngreso={handleSaveIngreso}
        onSaveAhorro={handleSaveAhorro}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onCreateSubmethod={handleCreateSubmethod}
        onUpdateSubmethod={handleUpdateSubmethod}
        onDeleteSubmethod={handleDeleteSubmethod}
        onOpenAuditModal={handleOpenAuditModal}
      />
    </div>
  );
}

function InterfaceModalsContainer({
  interfaceId,
  userRole,
  interfaceData,
  categories,
  submethods,
  members,
  modalsState,
  setIsGastoModalOpen,
  setIsIngresoModalOpen,
  setIsAhorroModalOpen,
  setIsCategoryModalOpen,
  setIsSubmethodModalOpen,
  setIsInviteModalOpen,
  onInviteSent,
  isDeleteConfirmOpen,
  setIsDeleteConfirmOpen,
  isDeletingInterface,
  onExecuteDeleteOrLeaveInterface,
  isAuditModalOpen,
  setIsAuditModalOpen,
  auditTypeFilter,
  auditEntityId,
  auditTitle,
  onSaveGasto,
  onSaveIngreso,
  onSaveAhorro,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateSubmethod,
  onUpdateSubmethod,
  onDeleteSubmethod,
  onOpenAuditModal,
}: {
  interfaceId: string;
  userRole: string;
  interfaceData: { nombre: string; descripcion?: string } | null;
  categories: CategoriaItem[];
  submethods: SubmetodoItem[];
  members: { idusuario: string; nombreusuario: string }[];
  modalsState: {
    isGastoModalOpen: boolean;
    editingGasto: GastoFormData | null;
    isIngresoModalOpen: boolean;
    editingIngreso: IngresoFormData | null;
    isAhorroModalOpen: boolean;
    editingAhorro: AhorroFormData | null;
    isCategoryModalOpen: boolean;
    isSubmethodModalOpen: boolean;
    isInviteModalOpen: boolean;
  };
  setIsGastoModalOpen: (val: boolean) => void;
  setIsIngresoModalOpen: (val: boolean) => void;
  setIsAhorroModalOpen: (val: boolean) => void;
  setIsCategoryModalOpen: (val: boolean) => void;
  setIsSubmethodModalOpen: (val: boolean) => void;
  setIsInviteModalOpen: (val: boolean) => void;
  onInviteSent?: () => void;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (val: boolean) => void;
  isDeletingInterface: boolean;
  onExecuteDeleteOrLeaveInterface: () => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (val: boolean) => void;
  auditTypeFilter: 'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite';
  auditEntityId: string | null;
  auditTitle: string | undefined;
  onSaveGasto: (data: GastoFormData) => Promise<void>;
  onSaveIngreso: (data: IngresoFormData) => Promise<void>;
  onSaveAhorro: (data: AhorroFormData) => Promise<void>;
  onCreateCategory: (data: Omit<CategoriaItem, 'id'>) => Promise<void>;
  onUpdateCategory: (data: CategoriaItem) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateSubmethod: (data: Omit<SubmetodoItem, 'id'>) => Promise<void>;
  onUpdateSubmethod: (data: SubmetodoItem) => Promise<void>;
  onDeleteSubmethod: (id: string) => Promise<void>;
  onOpenAuditModal: (type: 'todos' | 'gasto' | 'ingreso' | 'ahorro' | 'limite', entityId?: string | number | null, title?: string) => void;
}) {
  const {
    isGastoModalOpen,
    editingGasto,
    isIngresoModalOpen,
    editingIngreso,
    isAhorroModalOpen,
    editingAhorro,
    isCategoryModalOpen,
    isSubmethodModalOpen,
    isInviteModalOpen,
  } = modalsState;

  return (
    <>
      {/* ABM FORM MODALS */}
      <GastoFormModal
        key={editingGasto?.idgasto || (isGastoModalOpen ? 'new-gasto-open' : 'new-gasto-closed')}
        isOpen={isGastoModalOpen}
        onClose={() => setIsGastoModalOpen(false)}
        onSave={onSaveGasto}
        initialData={editingGasto}
        categories={categories}
        submethods={submethods}
        members={members}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenSubmethodManager={() => setIsSubmethodModalOpen(true)}
      />

      <IngresoFormModal
        key={editingIngreso?.idingreso || (isIngresoModalOpen ? 'new-ingreso-open' : 'new-ingreso-closed')}
        isOpen={isIngresoModalOpen}
        onClose={() => setIsIngresoModalOpen(false)}
        onSave={onSaveIngreso}
        initialData={editingIngreso}
        members={members}
      />

      <AhorroFormModal
        key={editingAhorro?.idahorro || (isAhorroModalOpen ? 'new-ahorro-open' : 'new-ahorro-closed')}
        isOpen={isAhorroModalOpen}
        onClose={() => setIsAhorroModalOpen(false)}
        onSave={onSaveAhorro}
        initialData={editingAhorro}
        userRole={userRole}
      />

      <CategoriaManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCreate={onCreateCategory}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
        onViewHistory={(cat) => onOpenAuditModal('limite', cat.id, cat.nombre)}
        userRole={userRole}
      />

      <SubmetodoManagerModal
        isOpen={isSubmethodModalOpen}
        onClose={() => setIsSubmethodModalOpen(false)}
        submethods={submethods}
        onCreate={onCreateSubmethod}
        onUpdate={onUpdateSubmethod}
        onDelete={onDeleteSubmethod}
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
        onInviteSent={onInviteSent}
      />

      {/* CONFIRMATION DIALOG FOR DELETING OR LEAVING INTERFACE */}
      <CustomDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={onExecuteDeleteOrLeaveInterface}
        isLoading={isDeletingInterface}
        title={userRole === 'Administrador' ? 'Eliminar Interfaz' : 'Salir de la Interfaz'}
        description={
          userRole === 'Administrador'
            ? `¿Estás seguro de que deseas eliminar permanentemente la interfaz "${interfaceData?.nombre}"? Se eliminarán todas las operaciones.`
            : `¿Estás seguro de que deseas salir de la interfaz "${interfaceData?.nombre}"?`
        }
        variant={userRole === 'Administrador' ? 'danger' : 'warning'}
        confirmText={userRole === 'Administrador' ? 'Sí, Eliminar' : 'Sí, Salir'}
        cancelText="Cancelar"
      />
    </>
  );
}
