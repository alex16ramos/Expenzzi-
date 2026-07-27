'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Users,
  Search,
  UserPlus,
  UserX,
  Loader2,
  Check,
  X,
  Send,
  AtSign,
  User,
} from 'lucide-react';
import { Header } from '@/components/interface/Header';
import { SideMenu } from '@/components/interface/SideMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';
import { toast } from 'sonner';

interface FriendItem {
  idamistad: string;
  fechaamistad: string;
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
  biografia: string | null;
}

interface RequestReceivedItem {
  idamistad: string;
  fechacreacion: string;
  remitente: {
    idusuario: string;
    nombreusuario: string;
    email: string;
    fotoperfil: string | null;
    biografia: string | null;
  };
}

interface RequestSentItem {
  idamistad: string;
  fechacreacion: string;
  destinatario: {
    idusuario: string;
    nombreusuario: string;
    email: string;
    fotoperfil: string | null;
    biografia: string | null;
  };
}

interface SearchedUser {
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
  biografia: string | null;
}

export default function AmigosPage() {
  const [loading, setLoading] = useState(true);
  const [amigos, setAmigos] = useState<FriendItem[]>([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<RequestReceivedItem[]>([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<RequestSentItem[]>([]);

  // Search & add user state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'mis-amigos' | 'solicitudes' | 'buscar'>('mis-amigos');

  // SideMenu State
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refreshAmigos = useCallback(async () => {
    try {
      const res = await fetch('/api/amigos');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setAmigos(data.amigos || []);
        setSolicitudesRecibidas(data.solicitudesRecibidas || []);
        setSolicitudesEnviadas(data.solicitudesEnviadas || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadAmigos() {
      try {
        const res = await fetch('/api/amigos');
        if (!res.ok) throw new Error('Error al cargar lista de amigos');
        const data = await res.json();
        if (!ignore && data.success) {
          setAmigos(data.amigos || []);
          setSolicitudesRecibidas(data.solicitudesRecibidas || []);
          setSolicitudesEnviadas(data.solicitudesEnviadas || []);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAmigos();
    return () => {
      ignore = true;
    };
  }, []);

  // Debounced search for public user profiles
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/usuarios?q=${encodeURIComponent(searchQuery.trim())}`);
        if (!res.ok) {
          setSearchResults([]);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.usuarios || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/usuarios?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.usuarios || []);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (destinatarioId: string) => {
    setActionLoading(destinatarioId);
    try {
      const res = await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatarioId }),
      });
      if (!res.ok) {
        toast.error('No se pudo enviar la solicitud');
        return;
      }
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Solicitud de amistad enviada');
        refreshAmigos();
        setSearchResults((prev) => prev.filter((u) => u.idusuario !== destinatarioId));
      } else {
        toast.error(data.error || 'No se pudo enviar la solicitud');
      }
    } catch (err) {
      console.error('Error sending request:', err);
      toast.error('Error al conectar con el servidor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespondRequest = async (idamistad: string, aceptar: boolean) => {
    setActionLoading(idamistad);
    try {
      const res = await fetch('/api/amigos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idamistad, estado: aceptar ? 'Aceptado' : 'Rechazado' }),
      });
      if (!res.ok) {
        toast.error('Error al responder a la solicitud');
        return;
      }
      const data = await res.json();

      if (data.success) {
        toast.success(aceptar ? '¡Solicitud aceptada!' : 'Solicitud rechazada');
        refreshAmigos();
      } else {
        toast.error(data.error || 'Error al responder a la solicitud');
      }
    } catch (err) {
      console.error('Error responding request:', err);
      toast.error('Error de red');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAmigoOrRequest = async (idamistad: string, isFriend = true) => {
    if (isFriend && !confirm('¿Estás seguro de eliminar a este amigo de tus contactos?')) {
      return;
    }

    setActionLoading(idamistad);
    try {
      const res = await fetch(`/api/amigos?idamistad=${idamistad}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Error al eliminar');
        return;
      }
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(isFriend ? 'Amigo eliminado' : 'Solicitud cancelada');
        refreshAmigos();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch (err) {
      console.error('Error deleting friend:', err);
      toast.error('Error al conectar');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* SideMenu Navigation */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        isCollapsed={isSideMenuCollapsed}
        onToggleCollapse={() => setIsSideMenuCollapsed(!isSideMenuCollapsed)}
        role="Usuario"
        onOpenAudit={() => {}}
        onOpenCategories={() => {}}
        onOpenSubmethods={() => {}}
        onOpenDelete={() => {}}
        interfaceName="Mis Amigos"
      />

      <div className="flex-1 flex flex-col justify-between min-h-dvh max-w-5xl mx-auto w-full">
        <div>
          {/* Header */}
          <Header
            interfaceName="Gestión de Amigos"
            userRole="Contactos Expenzzi"
            onMenuClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
          />

          <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Top Title Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-purple-200 font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-300" /> Red Social de Gastos
                </span>
                <h2 className="text-2xl font-extrabold text-white">Mis Amigos & Contactos</h2>
                <p className="text-xs text-slate-300">
                  Agrega amigos para incluirlos como responsables en tus interfaces de operaciones.
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner self-stretch sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('mis-amigos')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    activeTab === 'mis-amigos'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Amigos ({amigos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('solicitudes')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors relative ${
                    activeTab === 'solicitudes'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Solicitudes
                  {solicitudesRecibidas.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                      {solicitudesRecibidas.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('buscar')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    activeTab === 'buscar'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* TAB CONTENT: MIS AMIGOS */}
            {activeTab === 'mis-amigos' && (
              <AmigosListTab
                loading={loading}
                amigos={amigos}
                actionLoading={actionLoading}
                onDeleteAmigo={(id) => handleDeleteAmigoOrRequest(id, true)}
                onGoToSearch={() => setActiveTab('buscar')}
              />
            )}

            {/* TAB CONTENT: SOLICITUDES */}
            {activeTab === 'solicitudes' && (
              <SolicitudesTab
                solicitudesRecibidas={solicitudesRecibidas}
                solicitudesEnviadas={solicitudesEnviadas}
                actionLoading={actionLoading}
                onRespond={handleRespondRequest}
                onCancel={(id) => handleDeleteAmigoOrRequest(id, false)}
              />
            )}

            {/* TAB CONTENT: BUSCAR USUARIOS */}
            {activeTab === 'buscar' && (
              <BuscarUsuariosTab
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                searching={searching}
                actionLoading={actionLoading}
                onSearch={handleSearchUsers}
                onSendRequest={handleSendRequest}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function AmigosListTab({
  loading,
  amigos,
  actionLoading,
  onDeleteAmigo,
  onGoToSearch,
}: {
  loading: boolean;
  amigos: FriendItem[];
  actionLoading: string | null;
  onDeleteAmigo: (id: string) => void;
  onGoToSearch: () => void;
}) {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3"
            >
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-44 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : amigos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <Users className="w-10 h-10 text-indigo-400 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Aún no tienes amigos agregados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Busca a tus amigos por su correo o nombre para conectarte y compartir gastos.
          </p>
          <Button onClick={onGoToSearch} className="gap-2 bg-indigo-600 text-white text-xs">
            <UserPlus className="w-4 h-4" /> Buscar Amigos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {amigos.map((amigo) => (
            <div
              key={amigo.idamistad}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-full ${getAvatarBg(amigo.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm`}
                >
                  {amigo.fotoperfil ? (
                    <Image src={amigo.fotoperfil} alt={amigo.nombreusuario} width={48} height={48} unoptimized className={getAvatarClass(amigo.fotoperfil)} />
                  ) : (
                    <User className="w-6 h-6 text-indigo-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{amigo.nombreusuario}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> {amigo.email}
                  </p>
                  {amigo.biografia && <p className="text-[11px] text-slate-400 truncate mt-0.5">{amigo.biografia}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDeleteAmigo(amigo.idamistad)}
                disabled={actionLoading === amigo.idamistad}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0 ml-2"
                title="Eliminar amigo"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SolicitudesTab({
  solicitudesRecibidas,
  solicitudesEnviadas,
  actionLoading,
  onRespond,
  onCancel,
}: {
  solicitudesRecibidas: RequestReceivedItem[];
  solicitudesEnviadas: RequestSentItem[];
  actionLoading: string | null;
  onRespond: (id: string, aceptar: boolean) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Solicitudes Recibidas */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-500" /> Solicitudes Recibidas ({solicitudesRecibidas.length})
        </h3>

        {solicitudesRecibidas.length === 0 ? (
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500">
            Sin solicitudes entrantes pendientes.
          </div>
        ) : (
          <div className="space-y-2">
            {solicitudesRecibidas.map((sol) => {
              const remitente = sol.remitente || {
                nombreusuario: 'Usuario desconocido',
                email: '',
                fotoperfil: null,
              };
              return (
                <div
                  key={sol.idamistad}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full ${getAvatarBg(remitente.fotoperfil)} border flex items-center justify-center overflow-hidden shrink-0`}
                    >
                      {remitente.fotoperfil ? (
                        <Image src={remitente.fotoperfil} alt={remitente.nombreusuario || 'Avatar'} width={40} height={40} unoptimized className={getAvatarClass(remitente.fotoperfil)} />
                      ) : (
                        <User className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {remitente.nombreusuario || 'Usuario desconocido'}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{remitente.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      disabled={actionLoading === sol.idamistad}
                      onClick={() => onRespond(sol.idamistad, true)}
                      className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 rounded-xl"
                    >
                      <Check className="w-3.5 h-3.5" /> Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === sol.idamistad}
                      onClick={() => onRespond(sol.idamistad, false)}
                      className="h-8 px-2.5 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-50 rounded-xl"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solicitudes Enviadas */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-500" /> Solicitudes Enviadas ({solicitudesEnviadas.length})
        </h3>

        {solicitudesEnviadas.length === 0 ? (
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500">
            No has enviado solicitudes pendientes.
          </div>
        ) : (
          <div className="space-y-2">
            {solicitudesEnviadas.map((sol) => {
              const destinatario = sol.destinatario || {
                nombreusuario: 'Usuario desconocido',
                email: '',
                fotoperfil: null,
              };
              return (
                <div
                  key={sol.idamistad}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full ${getAvatarBg(destinatario.fotoperfil)} border flex items-center justify-center overflow-hidden shrink-0`}
                    >
                      {destinatario.fotoperfil ? (
                        <Image src={destinatario.fotoperfil} alt={destinatario.nombreusuario || 'Avatar'} width={40} height={40} unoptimized className={getAvatarClass(destinatario.fotoperfil)} />
                      ) : (
                        <User className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {destinatario.nombreusuario || 'Usuario desconocido'}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">{destinatario.email}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading === sol.idamistad}
                    onClick={() => onCancel(sol.idamistad)}
                    className="h-8 text-xs text-slate-500 hover:text-rose-600 rounded-xl"
                  >
                    Cancelar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BuscarUsuariosTab({
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  actionLoading,
  onSearch,
  onSendRequest,
}: {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchResults: SearchedUser[];
  searching: boolean;
  actionLoading: string | null;
  onSearch: (e: React.FormEvent) => void;
  onSendRequest: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por correo electrónico o nombre de usuario..."
            className="pl-9 h-10 text-xs bg-white dark:bg-slate-900 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          disabled={searching}
          className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 rounded-xl gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </Button>
      </form>

      {searchResults.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resultados encontrados ({searchResults.length})
          </h3>
          {searchResults.map((user) => (
            <div
              key={user.idusuario}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full ${getAvatarBg(user.fotoperfil)} border flex items-center justify-center overflow-hidden shrink-0`}
                >
                  {user.fotoperfil ? (
                    <Image src={user.fotoperfil} alt={user.nombreusuario} width={40} height={40} unoptimized className={getAvatarClass(user.fotoperfil)} />
                  ) : (
                    <User className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.nombreusuario}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <Button
                size="sm"
                disabled={actionLoading === user.idusuario}
                onClick={() => onSendRequest(user.idusuario)}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1 rounded-xl font-semibold"
              >
                {actionLoading === user.idusuario ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Agregar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
