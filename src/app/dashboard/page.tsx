'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Link2,
  Users,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  LogOut,
  Sparkles,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  // Helper to obtain default JSON request headers
  const getAuthHeaders = (): Record<string, string> => {
    return { 'Content-Type': 'application/json' };
  };

  // Fetch active interfaces accessible by user under RLS (RF30)
  const fetchInterfaces = React.useCallback(async () => {
    try {
      const headersMap = getAuthHeaders();
      const res = await fetch('/api/interfaces', { headers: headersMap });
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
        const headersMap = getAuthHeaders();
        const res = await fetch('/api/interfaces', { headers: headersMap });
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

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    } finally {
      window.location.href = '/';
    }
  };

  // Create new interface (CU03 / RF31)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFeedback(null);

    try {
      const headersMap = await getAuthHeaders();
      const res = await fetch('/api/interfaces', {
        method: 'POST',
        headers: headersMap,
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

  // Join interface via invitation UUID (CU03 / RF30)
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinLoading(true);
    setFeedback(null);

    try {
      const headersMap = await getAuthHeaders();
      const res = await fetch('/api/interfaces/join', {
        method: 'POST',
        headers: headersMap,
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-600/25">
              <span className="font-extrabold text-white text-base">E</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">Expenzzi</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hidden sm:inline">
              {user ? user.name || user.email : 'Cargando sesión...'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
        {/* Notification Feedback Toast */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex justify-between items-center animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-slate-800/50"
            >
              &times;
            </button>
          </div>
        )}

        {/* Welcome Section Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Mis Interfaces de Operación
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Gestiona tus grupos de gastos compartidos, crea nuevos o únete con un código de invitación.
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowJoinModal(true)}
              className="flex-1 sm:flex-initial gap-2"
            >
              <Link2 className="w-4 h-4 text-violet-400" />
              Unirse con Código
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-initial gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Interfaz
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <span className="text-xs font-medium">Cargando interfaces desde Neon Auth...</span>
          </div>
        ) : interfaces.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Sin interfaces asociadas</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Actualmente no perteneces a ninguna interfaz de operación. Crea tu primer grupo de gastos o ingresa un código UUID de invitación.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => setShowCreateModal(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Crear Primera Interfaz
              </Button>
            </div>
          </div>
        ) : (
          /* Interfaces Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interfaces.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between group shadow-xl hover:shadow-violet-600/5 relative"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        item.rol === 'Administrador'
                          ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                          : item.rol === 'Invitado'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.rol === 'Administrador' && <ShieldCheck className="w-3 h-3" />}
                      {item.rol === 'Visualizador' && <Eye className="w-3 h-3" />}
                      {item.rol}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">
                      {item.nombre}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.descripcion || 'Sin descripción.'}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-6 border-t border-slate-800/80 mt-6 space-y-2.5">
                  {/* Invitation Copy links */}
                  {item.linkinvitado && (
                    <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Código Invitado</span>
                        <span className="text-[11px] text-slate-300 font-mono truncate max-w-[150px]">
                          {item.linkinvitado.slice(0, 13)}...
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.linkinvitado, `inv-${item.id}`);
                        }}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0 transition-colors"
                      >
                        {copiedId === `inv-${item.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {item.linkvisualizador && (
                    <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Código Visualizador</span>
                        <span className="text-[11px] text-slate-300 font-mono truncate max-w-[150px]">
                          {item.linkvisualizador.slice(0, 13)}...
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item.linkvisualizador, `vis-${item.id}`);
                        }}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 shrink-0 transition-colors"
                      >
                        {copiedId === `vis-${item.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-indigo-400" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <Button
                    onClick={() => (window.location.href = `/interface/${item.id}`)}
                    className="w-full justify-between"
                  >
                    <span>Entrar a la Interfaz</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Interface Modal (CU03 / RF31) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl text-white">
            <div>
              <h3 className="text-lg font-bold">Crear Nueva Interfaz</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa el nombre y descripción. Serás asignado automáticamente como **Administrador**.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
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
                <label className="text-xs font-semibold text-slate-300">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre las operaciones..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
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
                <Button type="submit" disabled={createLoading} className="flex-1 gap-2">
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

      {/* Join Interface Modal (CU03 / RF30) */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl text-white">
            <div>
              <h3 className="text-lg font-bold">Unirse a Interfaz</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingresa el código UUID de invitación otorgado por el administrador.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Código UUID de Invitación *
                </label>
                <Input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: a1b2c3d4-e5f6-7890-abcd-1234567890ab"
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
                <Button type="submit" disabled={joinLoading} className="flex-1 gap-2">
                  {joinLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uniéndose...
                    </>
                  ) : (
                    'Unirse'
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
