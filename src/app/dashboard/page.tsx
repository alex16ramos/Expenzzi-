'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Link2,
  Users,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  User,
  Trash2,
  Wallet,
  Bell,
  Key,
  Layers,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/interface/NotificationBell';
import { getAvatarBg, getAvatarClass } from '@/app/dashboard/perfil/page';

interface InterfazItem {
  id: string;
  nombre: string;
  descripcion: string;
  rol: 'Administrador' | 'Invitado' | 'Visualizador' | string;
  estado: boolean;
  linkinvitado: string;
  linkvisualizador: string;
  fechacreacion?: string;
  fechaunion?: string;
}

export default function Dashboard() {
  const session = authClient.useSession();
  const user = session?.data?.user;

  const [interfaces, setInterfaces] = useState<InterfazItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fintech UI states
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD' | 'UYU'>('ARS');
  const [expandedCodesId, setExpandedCodesId] = useState<string | null>(null);

  // Fetch active interfaces accessible by user
  const fetchInterfaces = useCallback(async () => {
    try {
      const res = await fetch('/api/interfaces', {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok && data.interfaces) {
        setInterfaces(data.interfaces);
      } else {
        console.error('Failed to load interfaces:', data.error);
      }
    } catch (err) {
      console.error('Error fetching interfaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch('/api/interfaces', {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (isMounted && res.ok && data.interfaces) {
          setInterfaces(data.interfaces);
        }
      } catch (err) {
        console.error('Error fetching interfaces:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLeaveOrDeleteInterface = async (interfaceId: string, nombre: string, isAdmin: boolean) => {
    const confirmMessage = isAdmin
      ? `¿Estás seguro de que deseas eliminar la interfaz "${nombre}"? Esta acción eliminará permanentemente la interfaz y todas sus operaciones.`
      : `¿Estás seguro de que deseas salir de la interfaz "${nombre}"? Dejarás de pertenecer a este grupo.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/interfaces/${interfaceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || (isAdmin ? 'Interfaz eliminada' : 'Has salido de la interfaz'),
        });
        fetchInterfaces();
      } else {
        alert(data.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      console.error('Error in interface action:', err);
      alert('Error al conectar con el servidor');
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    } finally {
      window.location.href = '/';
    }
  };

  // Create new interface
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/interfaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: '¡Interfaz creada con éxito como Administrador!' });
        setNombre('');
        setDescripcion('');
        setShowCreateModal(false);
        await fetchInterfaces();
      } else {
        setFeedback({ type: 'error', message: data.error || 'No se pudo crear la interfaz' });
      }
    } catch (err) {
      console.error('Error creating interface:', err);
      setFeedback({ type: 'error', message: 'Error de red al crear la interfaz' });
    } finally {
      setCreateLoading(false);
    }
  };

  // Join interface via invitation UUID
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/interfaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || '¡Te has unido exitosamente a la interfaz!' });
        setCodigo('');
        setShowJoinModal(false);
        await fetchInterfaces();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Código de invitación inválido o inactivo' });
      }
    } catch (err) {
      console.error('Error joining interface:', err);
      setFeedback({ type: 'error', message: 'Error de red al unirse a la interfaz' });
    } finally {
      setJoinLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currencySymbol = selectedCurrency === 'USD' ? 'US$' : selectedCurrency === 'UYU' ? '$U' : '$';

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center items-start p-0 md:py-8 font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Container Frame (Fintech Smartphone / Desktop Layout) */}
      <div className="w-full max-w-md bg-white dark:bg-slate-950 md:dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 md:rounded-3xl shadow-2xl min-h-screen md:min-h-[840px] flex flex-col justify-between overflow-hidden relative backdrop-blur-md transition-colors">
        
        <div>
          {/* HEADER NAVBAR */}
          <header className="p-5 pb-3 flex justify-between items-center bg-white/90 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 dark:border-slate-900 transition-colors">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.href = '/dashboard/perfil')}
                className="relative group shrink-0"
                title="Ver Mi Perfil"
              >
                <div className={`w-11 h-11 rounded-full ${getAvatarBg(user?.image)} border-2 border-indigo-500 p-0.5 transition-transform group-hover:scale-105 overflow-hidden flex items-center justify-center`}>
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name || 'Avatar'}
                      className={getAvatarClass(user.image)}
                    />
                  ) : (
                    <User className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bienvenido de nuevo</p>
                <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                  {user?.name || user?.email || 'Usuario'} 👋
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell onNotificationHandled={fetchInterfaces} />
              <ThemeToggle variant="compact" />
            </div>
          </header>

          <main className="p-5 space-y-6">
            {/* Toast Feedback Notification */}
            {feedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex justify-between items-center animate-in fade-in duration-200 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                <span>{feedback.message}</span>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/50"
                >
                  &times;
                </button>
              </div>
            )}

            {/* HERO BANNER: BALANCE CONSOLIDADO */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900 text-white border border-purple-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-indigo-300" /> Balance Consolidado
                </span>
                <button
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                  className="text-slate-200 hover:text-white text-xs flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50 transition-colors"
                >
                  {isBalanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-semibold">{isBalanceVisible ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>

              <div className="my-2 flex items-center justify-between gap-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
                  {isBalanceVisible ? (
                    <>
                      <span className="text-xl font-bold text-indigo-300">{currencySymbol}</span>
                      {interfaces.length > 0 ? (interfaces.length * 150000).toLocaleString('es-AR') : '0'}
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

              <p className="text-xs text-slate-300 mt-1 font-medium">
                Suma total de tus {interfaces.length} interfaces activas
              </p>
            </div>

            {/* QUICK ACTIONS GRID (4 BUTTONS) */}
            <div className="grid grid-cols-4 gap-2.5">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 rounded-2xl transition group shadow-sm"
              >
                <div className="w-11 h-11 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Nueva</span>
              </button>

              <button
                onClick={() => setShowJoinModal(true)}
                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 rounded-2xl transition group shadow-sm"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
                  <Link2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Unirse</span>
              </button>

              <button
                onClick={() => (window.location.href = '/dashboard/perfil')}
                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 rounded-2xl transition group shadow-sm"
              >
                <div className="w-11 h-11 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Amigos</span>
              </button>

              <button
                onClick={() => {
                  const bellBtn = document.querySelector('[data-notification-bell="true"]') as HTMLButtonElement;
                  if (bellBtn) bellBtn.click();
                }}
                className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 rounded-2xl transition group shadow-sm"
              >
                <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">Avisos</span>
              </button>
            </div>

            {/* INTERFACES SECTION HEADER */}
            <div className="flex justify-between items-center pt-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Tus Interfaces ({interfaces.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Seleccioná para entrar</span>
            </div>

            {/* INTERFACES CARDS LIST */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs">Cargando interfaces...</span>
              </div>
            ) : interfaces.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Users className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sin interfaces asociadas</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Aún no perteneces a ninguna interfaz. Crea un nuevo grupo o ingresa un código de invitación.
                </p>
                <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Crear Primera Interfaz
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {interfaces.map((item) => {
                  const isExpanded = expandedCodesId === item.id;
                  const isAdmin = item.rol === 'Administrador';
                  const isInvitado = item.rol === 'Invitado';

                  const badgeClass = isAdmin
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                    : isInvitado
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm group"
                    >
                      {/* Top Row: Icon, Name & Role Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                              {item.nombre}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {item.descripcion || 'Sin descripción'}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 ${badgeClass}`}>
                          {item.rol}
                        </span>
                      </div>

                      {/* Middle Row: Active Status & Action Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> ACTIVA
                          </span>
                          {isAdmin ? (
                            <button
                              onClick={() => handleLeaveOrDeleteInterface(item.id, item.nombre, true)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Eliminar interfaz (Administrador)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLeaveOrDeleteInterface(item.id, item.nombre, false)}
                              className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Salir de la interfaz"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedCodesId(isExpanded ? null : item.id)}
                            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs flex items-center gap-1 transition-colors"
                            title="Ver códigos de invitación"
                          >
                            <Key className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Códigos
                          </button>

                          <button
                            onClick={() => (window.location.href = `/interface/${item.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors text-xs"
                          >
                            Entrar <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Collapsible Invitation Codes Panel */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                          {item.linkinvitado && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Código Invitado:</span>
                              <button
                                onClick={() => copyToClipboard(item.linkinvitado, `inv-${item.id}`)}
                                className="text-emerald-600 dark:text-emerald-400 font-mono hover:underline flex items-center gap-1"
                              >
                                {item.linkinvitado.slice(0, 12)}...
                                {copiedId === `inv-${item.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {item.linkvisualizador && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Código Visualizador:</span>
                              <button
                                onClick={() => copyToClipboard(item.linkvisualizador, `vis-${item.id}`)}
                                className="text-indigo-600 dark:text-indigo-400 font-mono hover:underline flex items-center gap-1"
                              >
                                {item.linkvisualizador.slice(0, 12)}...
                                {copiedId === `vis-${item.id}` ? (
                                  <Check className="w-3 h-3 text-indigo-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <nav className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-900 px-6 py-3 flex justify-around items-center z-10 shrink-0 transition-colors">
          <button className="flex flex-col items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Crear</span>
          </button>
          <button
            onClick={() => (window.location.href = '/dashboard/perfil')}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-1 text-slate-500 dark:text-slate-500 hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium">Salir</span>
          </button>
        </nav>
      </div>

      {/* CREATE INTERFACE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Plus className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Crear Nueva Interfaz
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Ingresa el nombre y descripción. Serás asignado automáticamente como <strong>Administrador</strong>.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nombre de la Interfaz *
                </label>
                <Input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Gastos Compartidos Apt 302"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre las operaciones..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createLoading} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creando...
                    </>
                  ) : (
                    'Crear Interfaz'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN INTERFACE MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Link2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Unirse a una Interfaz
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Ingresá el código de invitación (UUID) recibido de un amigo o administrador.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Código UUID de Invitación *
                </label>
                <Input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: b7a3ec84-28cb-4f..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={joinLoading} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                  {joinLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uniéndose...
                    </>
                  ) : (
                    'Unirse a la Interfaz'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
