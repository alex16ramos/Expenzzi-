'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  Plus,
  ArrowRight,
  Wallet,
  Eye,
  EyeOff,
  MoreVertical,
  LogOut,
  User,
  Search,
  CheckCircle2,
  Copy,
  Users,
  Star,
  Clock,
  Layers,
  Filter,
  UserPlus,
  Compass,
  Info,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { NotificationBell } from '@/components/interface/NotificationBell';
import { ExchangeRateDropdown } from '@/components/interface/ExchangeRateDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';

interface InterfazItem {
  id: string;
  nombre: string;
  descripcion?: string;
  rol: string;
  estado: boolean;
  linkinvitado: string;
  linkvisualizador: string;
  fechacreacion?: string;
  fechaunion?: string;
  balanceARS?: number;
  balanceUSD?: number;
  balanceUYU?: number;
}

async function handleSignOut() {
  try {
    await authClient.signOut();
    // toast can't be called here easily without dynamic import, so we let page redirect
  } catch {
    // Ignore
  } finally {
    window.location.href = '/';
  }
}

export default function DashboardPage() {
  const session = authClient.useSession();
  const user = session?.data?.user;

  // Data states
  const [interfaces, setInterfaces] = useState<InterfazItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Interfaces & Currency for Consolidated Balance & Per-Card Balance
  const [selectedInterfaceIds, setSelectedInterfaceIds] = useState<string[]>([]);
  const [balanceCurrency, setBalanceCurrency] = useState<'ARS' | 'USD' | 'UYU'>('ARS');

  // Favorites state stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const storedFavs = localStorage.getItem('expenzzi_favorites:v1') || localStorage.getItem('expenzzi_favorites');
      return storedFavs ? JSON.parse(storedFavs) : [];
    } catch {
      return [];
    }
  });

  // Filter Pills & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPill, setFilterPill] = useState<'todas' | 'favoritas' | 'ultimo-acceso'>('todas');

  // Balance Visibility
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // UI Dropdowns & Modals
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [profileFoto, setProfileFoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/perfil');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && data.user) {
          if (data.user.fotoperfil) setProfileFoto(data.user.fotoperfil);
          if (data.user.nombreusuario) setProfileName(data.user.nombreusuario);
        }
      } catch {
        // Ignore
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [codesModalItem, setCodesModalItem] = useState<InterfazItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InterfazItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Dialog States (Nueva Interfaz & Unirse)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<{ id: string; nombre: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle favorite status
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favorites.includes(id);
    const updated = isFav ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem('expenzzi_favorites:v1', JSON.stringify(updated));
    } catch {
      // Ignore
    }
    toast.success(isFav ? 'Quitado de favoritos' : 'Añadido a favoritos');
  };

  const fetchInterfaces = useCallback(async () => {
    try {
      const res = await fetch('/api/interfaces', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.status === 401) {
        // Retry once after 500ms for OAuth cookie settlement
        setTimeout(async () => {
          try {
            const retryRes = await fetch('/api/interfaces');
            if (retryRes.ok) {
              const data = await retryRes.json();
              if (data.interfaces) {
                setInterfaces(data.interfaces);
                setSelectedInterfaceIds((prev) => (prev.length === 0 ? data.interfaces.map((i: InterfazItem) => i.id) : prev));
              }
            }
          } catch {
            // Ignore
          } finally {
            setLoading(false);
          }
        }, 500);
        return;
      }

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.interfaces) {
        setInterfaces(data.interfaces);
        setSelectedInterfaceIds((prev) =>
          prev.length === 0 ? data.interfaces.map((i: InterfazItem) => i.id) : prev
        );
      }
    } catch (err) {
      console.error('Error fetching interfaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const isSessionPending = session?.isPending;

  const loadInterfaces = useCallback(async (isMounted: () => boolean) => {
    try {
      const res = await fetch('/api/interfaces', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.status === 401) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (!isMounted()) return;
        const retryRes = await fetch('/api/interfaces');
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          if (isMounted() && retryData.interfaces) {
            setInterfaces(retryData.interfaces);
            setSelectedInterfaceIds((prev) =>
              prev.length === 0 ? retryData.interfaces.map((i: InterfazItem) => i.id) : prev
            );
          }
        }
        return;
      }

      if (!res.ok) return;
      const data = await res.json();
      if (isMounted() && data.interfaces) {
        setInterfaces(data.interfaces);
        setSelectedInterfaceIds((prev) =>
          prev.length === 0 ? data.interfaces.map((i: InterfazItem) => i.id) : prev
        );
      }
    } catch (err) {
      console.error('Error fetching interfaces:', err);
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!isSessionPending) {
      Promise.resolve().then(() => {
        if (mounted) loadInterfaces(() => mounted);
      });
    }
    return () => {
      mounted = false;
    };
  }, [isSessionPending, loadInterfaces]);


  const executeDeleteOrLeave = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    const isAdmin = deleteConfirmItem.rol === 'Administrador';

    try {
      const res = await fetch(`/api/interfaces/${deleteConfirmItem.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Error al procesar la solicitud');
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || (isAdmin ? 'Interfaz eliminada con éxito' : 'Has salido de la interfaz'));
        setDeleteConfirmItem(null);
        fetchInterfaces();
      } else {
        toast.error(data.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error in interface action:', err);
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create new interface
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateResult(null);

    try {
      const res = await fetch('/api/interfaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
      if (!res.ok) {
        toast.error('No se pudo crear la interfaz');
        return;
      }
      const data = await res.json();

      if (data.success) {
        toast.success('¡Interfaz creada con éxito!');
        setCreateResult({
          id: String(data.data.idinterfazoperacion),
          nombre: data.data.nombre,
        });
        setNombre('');
        setDescripcion('');
        fetchInterfaces();
      } else {
        toast.error(data.error || 'No se pudo crear la interfaz');
      }
    } catch (err) {
      console.error('Error creating interface:', err);
      toast.error('Error de red al crear interfaz');
    } finally {
      setCreateLoading(false);
    }
  };

  // Join interface by code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoinLoading(true);

    try {
      const res = await fetch('/api/interfaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      if (!res.ok) {
        toast.error('No se pudo unirse a la interfaz');
        return;
      }
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'Te has unido a la interfaz');
        setIsJoinDialogOpen(false);
        setJoinCode('');
        fetchInterfaces();
        if (data.interfaceId) {
          window.location.href = `/interface/${data.interfaceId}`;
        }
      } else {
        toast.error(data.error || 'Código de invitación inválido o expirado');
      }
    } catch (err) {
      console.error('Error joining interface:', err);
      toast.error('Error al conectar con el servidor');
    } finally {
      setJoinLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle selection for consolidated balance calculation
  const toggleInterfaceSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterfaceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedInterfaceSet = React.useMemo(() => new Set(selectedInterfaceIds), [selectedInterfaceIds]);
  const favoriteSet = React.useMemo(() => new Set(favorites), [favorites]);

  // Compute Consolidated Balance Totals across selected interfaces
  const selectedInterfaces = React.useMemo(
    () => interfaces.filter((item) => selectedInterfaceSet.has(item.id)),
    [interfaces, selectedInterfaceSet]
  );

  const { consolidatedARS, consolidatedUSD, consolidatedUYU } = React.useMemo(() => {
    return selectedInterfaces.reduce(
      (acc, item) => ({
        consolidatedARS: acc.consolidatedARS + (item.balanceARS || 0),
        consolidatedUSD: acc.consolidatedUSD + (item.balanceUSD || 0),
        consolidatedUYU: acc.consolidatedUYU + (item.balanceUYU || 0),
      }),
      { consolidatedARS: 0, consolidatedUSD: 0, consolidatedUYU: 0 }
    );
  }, [selectedInterfaces]);

  const activeConsolidated = React.useMemo(() => {
    return balanceCurrency === 'ARS' ? consolidatedARS : balanceCurrency === 'USD' ? consolidatedUSD : consolidatedUYU;
  }, [balanceCurrency, consolidatedARS, consolidatedUSD, consolidatedUYU]);

  const currencySymbol = React.useMemo(() => {
    return balanceCurrency === 'ARS' ? '$' : balanceCurrency === 'USD' ? 'US$' : '$U';
  }, [balanceCurrency]);

  // Filter & Search Interface items
  const filteredInterfaces = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return interfaces.filter((item) => {
      const matchesSearch =
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterPill === 'favoritas') {
        return favoriteSet.has(item.id);
      }

      return true;
    });
  }, [interfaces, searchQuery, filterPill, favoriteSet]);

  const sortedInterfaces = React.useMemo(() => {
    return [...filteredInterfaces].sort((a, b) => {
      if (filterPill === 'ultimo-acceso') {
        return (b.fechaunion || '').localeCompare(a.fechaunion || '');
      }
      return 0;
    });
  }, [filteredInterfaces, filterPill]);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* HEADER BAR */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* User Avatar with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="relative group rounded-full cursor-pointer"
              aria-label="Perfil de usuario"
            >
              <div className={`w-9 h-9 rounded-full ${getAvatarBg(profileFoto || user?.image)} transition-transform group-hover:scale-105 overflow-hidden flex items-center justify-center font-bold text-xs`}>
                {profileFoto || user?.image ? (
                  <Image
                    src={profileFoto || user?.image || ''}
                    alt={profileName || user?.name || 'Usuario'}
                    width={36}
                    height={36}
                    unoptimized
                    className={getAvatarClass(profileFoto || user?.image)}
                  />
                ) : (
                  (profileName || user?.name || user?.email || 'U').slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowUserDropdown(false)}
                    role="presentation"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {profileName || user?.name || 'Usuario Expenzzi'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user?.email || 'usuario@expenzzi.local'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setShowUserDropdown(false); window.location.href = '/dashboard/perfil'; }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      <User className="w-4 h-4 text-indigo-500" /> Mi Perfil
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowUserDropdown(false); window.location.href = '/dashboard/amigos'; }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                    >
                      <Users className="w-4 h-4 text-emerald-500" /> Mis Amigos
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowUserDropdown(false); handleSignOut(); }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800/80 mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              {profileName || user?.name || user?.email?.split('@')[0] || 'Usuario'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Hola, Buen día!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ExchangeRateDropdown />
          <NotificationBell onNotificationHandled={fetchInterfaces} />
          <ThemeToggle variant="compact" />
        </div>
      </header>

      {/* MAIN RESPONSIVE BODY CONTAINER */}
      <main className="w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 flex-1 mx-auto">
        {/* ORIGINAL TOP 4 ACTION BUTTONS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => { setCreateResult(null); setIsCreateDialogOpen(true); }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="p-2 bg-white/10 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Nueva Interfaz</span>
              <span className="text-[10px] text-indigo-200 font-normal">Crear grupo de gastos</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsJoinDialogOpen(true)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-800 transition-colors shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Unirse</span>
              <span className="text-[10px] text-slate-500 font-normal">Usar código de invitación</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = '/dashboard/perfil')}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-800 transition-colors shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Mi Perfil</span>
              <span className="text-[10px] text-slate-500 font-normal">Editar datos y avatar</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = '/dashboard/amigos')}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-800 transition-colors shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block font-bold">Mis Amigos</span>
              <span className="text-[10px] text-slate-500 font-normal">Gestionar contactos</span>
            </div>
          </button>
        </div>

        {/* HERO BANNER: BALANCE CONSOLIDADO */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden space-y-4">
          <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-purple-200 font-bold flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-indigo-300" /> Balance Consolidado 
              <Badge className="text-[10px]">{selectedInterfaces.length} {selectedInterfaces.length === 1 ? 'seleccionada' : 'seleccionadas'}</Badge>
            </span>
            <div className="flex items-center gap-2">
              {/* Currency Tabs */}
              <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                {(['ARS', 'USD', 'UYU'] as const).map((curr) => (
                  <button
                    type="button"
                    key={curr}
                    onClick={() => setBalanceCurrency(curr)}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      balanceCurrency === curr ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                aria-label={isBalanceVisible ? 'Ocultar balance' : 'Mostrar balance'}
                className="text-slate-200 hover:text-white text-xs flex items-center gap-1.5 bg-slate-800/70 px-3 py-1 rounded-xl border border-slate-700/50 transition-colors cursor-pointer"
              >
                {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                {isBalanceVisible ? (
                  <>
                    <span className="text-2xl font-bold text-indigo-300">{currencySymbol}</span>
                    {activeConsolidated.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-indigo-300">{currencySymbol}</span>
                    ••••••••
                  </>
                )}
              </h2>
              <span className="text-xs text-slate-300/80 mt-1 flex items-center gap-1.5 mt-5">
                <Info className="size-4"/> Suma calculada en base a las interfaces marcadas con el checkbox abajo.
              </span>
            </div>
          </div>
        </div>

        {/* INTERFACES SECTION WITH SEARCH & FILTER PILLS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" /> Mis Interfaces de Operación
              <Badge>{interfaces.length}</Badge>
            </h3>

            {/* Filter Pills & Search Container */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar interfaz..."
                  className="pl-8 h-9 text-xs bg-white dark:bg-slate-900 rounded-xl"
                />
              </div>

              <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterPill('todas')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filterPill === 'todas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 cursor-pointer'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPill('favoritas')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    filterPill === 'favoritas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 cursor-pointer'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Favoritas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPill('ultimo-acceso')}
                  className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    filterPill === 'ultimo-acceso' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 cursor-pointer'
                  }`}
                >
                  <Clock className="w-3 h-3" /> Recientes
                </button>
              </div>
            </div>
          </div>

          {/* INTERFACES RESPONSIVE GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          ) : sortedInterfaces.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 shadow-sm">
              <Filter className="w-10 h-10 text-indigo-400 mx-auto opacity-40" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron interfaces</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || filterPill !== 'todas'
                  ? 'Intenta ajustar los filtros de búsqueda o favoritos.'
                  : 'Crea tu primera interfaz de operaciones para comenzar a administrar gastos.'}
              </p>
              <Button
                onClick={() => { setCreateResult(null); setIsCreateDialogOpen(true); }}
                className="gap-2 bg-indigo-600 text-white text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" /> Crear Interfaz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedInterfaces.map((item) => (
                <DashboardInterfaceCardItem
                  key={item.id}
                  item={item}
                  favorites={favorites}
                  selectedInterfaceIds={selectedInterfaceIds}
                  balanceCurrency={balanceCurrency}
                  openCardMenuId={openCardMenuId}
                  setOpenCardMenuId={setOpenCardMenuId}
                  toggleFavorite={toggleFavorite}
                  toggleInterfaceSelection={toggleInterfaceSelection}
                  setCodesModalItem={setCodesModalItem}
                  setDeleteConfirmItem={setDeleteConfirmItem}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <DashboardModalsContainer
        codesModalItem={codesModalItem}
        setCodesModalItem={setCodesModalItem}
        isJoinDialogOpen={isJoinDialogOpen}
        setIsJoinDialogOpen={setIsJoinDialogOpen}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        joinLoading={joinLoading}
        onJoinByCode={handleJoinByCode}
        isCreateDialogOpen={isCreateDialogOpen}
        setIsCreateDialogOpen={setIsCreateDialogOpen}
        createResult={createResult}
        nombre={nombre}
        setNombre={setNombre}
        descripcion={descripcion}
        setDescripcion={setDescripcion}
        createLoading={createLoading}
        onCreate={handleCreate}
        deleteConfirmItem={deleteConfirmItem}
        setDeleteConfirmItem={setDeleteConfirmItem}
        isDeleting={isDeleting}
        onExecuteDeleteOrLeave={executeDeleteOrLeave}
        copiedId={copiedId}
        onCopy={copyToClipboard}
      />
    </div>
  );
}

function DashboardInterfaceCardItem({
  item,
  favorites,
  selectedInterfaceIds,
  balanceCurrency,
  openCardMenuId,
  setOpenCardMenuId,
  toggleFavorite,
  toggleInterfaceSelection,
  setCodesModalItem,
  setDeleteConfirmItem,
}: {
  item: InterfazItem;
  favorites: string[];
  selectedInterfaceIds: string[];
  balanceCurrency: 'ARS' | 'USD' | 'UYU';
  openCardMenuId: string | null;
  setOpenCardMenuId: (id: string | null) => void;
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  toggleInterfaceSelection: (id: string, e: React.MouseEvent) => void;
  setCodesModalItem: (item: InterfazItem | null) => void;
  setDeleteConfirmItem: (item: InterfazItem | null) => void;
}) {
  const isFavorite = favorites.includes(item.id);
  const isSelectedForConsolidated = selectedInterfaceIds.includes(item.id);
  const isAdmin = item.rol === 'Administrador';

  const currentBalanceVal =
    balanceCurrency === 'ARS' ? item.balanceARS : balanceCurrency === 'USD' ? item.balanceUSD : item.balanceUYU;
  const currencySymbol = balanceCurrency === 'ARS' ? '$' : balanceCurrency === 'USD' ? 'US$' : '$U';

  return (
    <div
      onClick={() => (window.location.href = `/interface/${item.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') window.location.href = `/interface/${item.id}`; }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir interfaz ${item.nombre}`}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-3xl p-5 shadow-sm hover:shadow-xl transition-colors duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
    >
      <div>
        {/* Top Header Card */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              checked={isSelectedForConsolidated}
              onChange={(e) => toggleInterfaceSelection(item.id, e as unknown as React.MouseEvent)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              title="Incluir en el balance consolidado"
            />

            <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {item.nombre}
            </h4>
          </div>

          {/* Card Action Controls: Star & 3-Dots Menu */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => toggleFavorite(item.id, e)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-amber-400"
              title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorita'}
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-400'
                }`}
              />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenCardMenuId(openCardMenuId === item.id ? null : item.id);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Opciones de la interfaz"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {openCardMenuId === item.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardMenuId(null);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Escape') setOpenCardMenuId(null); }}
                      role="presentation"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden text-xs"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenuId(null);
                          setCodesModalItem(item);
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                      >
                        <Copy className="w-3.5 h-3.5 text-indigo-500" /> Ver Códigos
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenuId(null);
                          setDeleteConfirmItem(item);
                        }}
                        className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800 mt-1"
                      >
                        {isAdmin ? 'Eliminar Interfaz' : 'Salir de la Interfaz'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {item.descripcion && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{item.descripcion}</p>
        )}

        {/* COMPACT SINGLE CURRENCY BALANCE DISPLAY */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex items-center justify-between mb-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Balance Neto ({balanceCurrency})
          </span>
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
            {currencySymbol} {(currentBalanceVal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/50">
          {item.rol}
        </span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          Ingresar <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

function DashboardModalsContainer({
  codesModalItem,
  setCodesModalItem,
  isJoinDialogOpen,
  setIsJoinDialogOpen,
  joinCode,
  setJoinCode,
  joinLoading,
  onJoinByCode,
  isCreateDialogOpen,
  setIsCreateDialogOpen,
  createResult,
  nombre,
  setNombre,
  descripcion,
  setDescripcion,
  createLoading,
  onCreate,
  deleteConfirmItem,
  setDeleteConfirmItem,
  isDeleting,
  onExecuteDeleteOrLeave,
  copiedId,
  onCopy,
}: {
  codesModalItem: InterfazItem | null;
  setCodesModalItem: (item: InterfazItem | null) => void;
  isJoinDialogOpen: boolean;
  setIsJoinDialogOpen: (val: boolean) => void;
  joinCode: string;
  setJoinCode: (val: string) => void;
  joinLoading: boolean;
  onJoinByCode: (e: React.FormEvent) => void;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (val: boolean) => void;
  createResult: { id: string; nombre: string } | null;
  nombre: string;
  setNombre: (val: string) => void;
  descripcion: string;
  setDescripcion: (val: string) => void;
  createLoading: boolean;
  onCreate: (e: React.FormEvent) => void;
  deleteConfirmItem: InterfazItem | null;
  setDeleteConfirmItem: (item: InterfazItem | null) => void;
  isDeleting: boolean;
  onExecuteDeleteOrLeave: () => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ''
  );

  return (
    <>
      {/* MODAL: CODES & INVITE LINKS */}
      {codesModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Copy className="w-5 h-5 text-indigo-500" /> Códigos de Invitación
            </h3>
            <p className="text-xs text-slate-500">
              Comparte estos enlaces para invitar miembros a &quot;{codesModalItem.nombre}&quot;.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enlace para Rol Invitado (Cargar movimientos)
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${origin}/interface/join?code=${codesModalItem.linkinvitado}`}
                    className="text-xs bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      onCopy(
                        `${origin}/interface/join?code=${codesModalItem.linkinvitado}`,
                        'invitado'
                      )
                    }
                    className="bg-indigo-600 text-white text-xs gap-1"
                  >
                    {copiedId === 'invitado' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enlace para Rol Visualizador (Solo lectura)
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${origin}/interface/join?code=${codesModalItem.linkvisualizador}`}
                    className="text-xs bg-slate-50 dark:bg-slate-950 font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      onCopy(
                        `${origin}/interface/join?code=${codesModalItem.linkvisualizador}`,
                        'visualizador'
                      )
                    }
                    className="bg-indigo-600 text-white text-xs gap-1"
                  >
                    {copiedId === 'visualizador' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setCodesModalItem(null)} variant="outline" className="text-xs rounded-xl">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: UNIRSE POR CÓDIGO */}
      {isJoinDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-500" /> Unirse a una Interfaz
            </h3>
            <p className="text-xs text-slate-500">
              Pega el código o enlace de invitación recibido para acceder al grupo.
            </p>

            <form onSubmit={onJoinByCode} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Código o URL de Invitación *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ej. ABC12345 o pega el enlace completo..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsJoinDialogOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={joinLoading || !joinCode.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                >
                  {joinLoading ? 'Uniéndose...' : 'Ingresar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG: CREAR INTERFAZ */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Nueva Interfaz de Operación
            </h3>

            {createResult ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">¡Interfaz Creada con Éxito!</h4>
                  <p className="text-xs text-slate-500 mt-1">&quot;{createResult.nombre}&quot; ya está lista para usar.</p>
                </div>
                <Button
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    window.location.href = `/interface/${createResult.id}`;
                  }}
                  className="w-full bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Ir a la Interfaz <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <form onSubmit={onCreate} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre de la Interfaz *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="Ej. Gastos del Hogar, Viaje a Cancún..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Descripción Opcional
                  </label>
                  <Input
                    type="text"
                    placeholder="Breve descripción del propósito..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading || !nombre.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                  >
                    {createLoading ? 'Creando...' : 'Crear Interfaz'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG: DELETE / LEAVE */}
      <CustomDialog
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title={deleteConfirmItem?.rol === 'Administrador' ? 'Eliminar Interfaz' : 'Salir de la Interfaz'}
        description={
          deleteConfirmItem?.rol === 'Administrador'
            ? `¿Está seguro de eliminar "${deleteConfirmItem?.nombre}"? Se borrarán todos sus gastos, ingresos y categorías registradas.`
            : `¿Está seguro de salir de "${deleteConfirmItem?.nombre}"? Perderás acceso a sus balances.`
        }
        confirmText={deleteConfirmItem?.rol === 'Administrador' ? 'Eliminar Definitivamente' : 'Confirmar Salida'}
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={onExecuteDeleteOrLeave}
      />
    </>
  );
}
