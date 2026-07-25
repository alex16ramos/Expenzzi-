'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, X, Shield, Sparkles, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAvatarBg, getAvatarClass } from '@/app/dashboard/perfil/page';

export interface NotificacionItem {
  idnotificacion: string;
  idreceptor: string;
  idemisor: string;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  idinterfazoperacion: string | null;
  rolPropuesto: string | null;
  estado: string;
  leido: boolean;
  fechacreacion: string;
  emisor: {
    idusuario: string;
    nombreusuario: string;
    email: string;
    fotoperfil: string | null;
  };
  interfaz: {
    id: string;
    nombre: string;
  } | null;
}

interface NotificationBellProps {
  interfaceId?: string | number | null;
  interfaceName?: string | null;
  onNotificationHandled?: () => void;
}

export function NotificationBell({
  interfaceId,
  interfaceName,
  onNotificationHandled,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'interfaz' | 'todas'>('general');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones');
      const data = await res.json();
      if (res.ok && data.success) {
        setNotificaciones(data.notificaciones || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotificaciones();
    }, 0);

    const interval = setInterval(fetchNotificaciones, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotificaciones]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRespond = async (idnotificacion: string, aceptar: boolean) => {
    setActionLoading(idnotificacion);
    try {
      const res = await fetch('/api/notificaciones/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idnotificacion, aceptar }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Optimistic UI update
        setNotificaciones((prev) =>
          prev.map((n) =>
            n.idnotificacion === idnotificacion
              ? { ...n, estado: aceptar ? 'Aceptada' : 'Rechazada', leido: true }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        if (onNotificationHandled) {
          onNotificationHandled();
        }
      }
    } catch (err) {
      console.error('Error responding to notification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNotification = async (idnotificacion: string) => {
    setActionLoading(idnotificacion);
    try {
      const res = await fetch(`/api/notificaciones?id=${idnotificacion}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotificaciones((prev) => {
          const target = prev.find((n) => n.idnotificacion === idnotificacion);
          if (target && !target.leido) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.idnotificacion !== idnotificacion);
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const isGeneralNotif = (n: NotificacionItem) =>
    n.tipo === 'SOLICITUD_AMISTAD' || n.tipo === 'INVITACION_INTERFAZ' || !n.idinterfazoperacion;

  const isCurrentInterfaceNotif = (n: NotificacionItem) =>
    interfaceId
      ? String(n.idinterfazoperacion) === String(interfaceId)
      : n.tipo.startsWith('NUEVO_') || !!n.idinterfazoperacion;

  const unreadGeneral = notificaciones.filter((n) => !n.leido && isGeneralNotif(n)).length;
  const unreadInterfaz = notificaciones.filter((n) => !n.leido && isCurrentInterfaceNotif(n)).length;

  const filteredNotificaciones = notificaciones.filter((n) => {
    if (activeTab === 'general') return isGeneralNotif(n);
    if (activeTab === 'interfaz') return isCurrentInterfaceNotif(n);
    return true;
  });

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotificaciones();
        }}
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm focus:outline-none"
        title="Centro de Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <button
              onClick={fetchNotificaciones}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 p-1 gap-1 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-800 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>General</span>
              {unreadGeneral > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('interfaz')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 truncate ${
                activeTab === 'interfaz'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-800 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="truncate">{interfaceName ? `Esta Interfaz` : `Actividad`}</span>
              {unreadInterfaz > 0 && (
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('todas')}
              className={`py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                activeTab === 'todas'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-800 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Todas ({notificaciones.length})</span>
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                <span>Cargando notificaciones...</span>
              </div>
            ) : filteredNotificaciones.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeTab === 'general'
                    ? 'Sin solicitudes ni invitaciones pendientes'
                    : activeTab === 'interfaz'
                    ? 'Sin actividad reciente en esta interfaz'
                    : 'Sin notificaciones por ahora'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeTab === 'general'
                    ? 'Te avisaremos cuando recibas solicitudes de amistad o invitaciones.'
                    : 'Aquí verás los gastos, ingresos y ahorros registrados.'}
                </p>
              </div>
            ) : (
              filteredNotificaciones.map((n) => {
                const emisorNombre = n.emisor?.nombreusuario || 'Un usuario';
                const initials = emisorNombre.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={n.idnotificacion}
                    className={`p-3.5 transition-colors ${
                      !n.leido && n.estado === 'Pendiente'
                        ? 'bg-violet-50/50 dark:bg-violet-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full ${getAvatarBg(n.emisor?.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm mt-0.5`}>
                        {n.emisor?.fotoperfil ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.emisor.fotoperfil}
                            alt={emisorNombre}
                            className={getAvatarClass(n.emisor.fotoperfil)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-violet-600 dark:text-violet-400 text-xs font-bold">{initials}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {n.titulo}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-[10px] text-slate-600 dark:text-slate-400">
                              {new Date(n.fechacreacion).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(n.idnotificacion);
                              }}
                              disabled={actionLoading === n.idnotificacion}
                              className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors ml-1 opacity-70 hover:opacity-100"
                              title="Borrar notificación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                          {n.mensaje}
                        </p>

                        {n.rolPropuesto && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                            <Shield className="w-2.5 h-2.5" />
                            <span>Rol: {n.rolPropuesto}</span>
                          </div>
                        )}

                        {/* Action / Badge Section */}
                        {n.estado === 'Informativa' || n.tipo.startsWith('NUEVO_') ? (
                          <div className="pt-1.5 flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                n.tipo === 'NUEVO_GASTO'
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                  : n.tipo === 'NUEVO_INGRESO'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {n.tipo === 'NUEVO_GASTO' ? '💸 Gasto' : n.tipo === 'NUEVO_INGRESO' ? '💰 Ingreso' : '🏦 Ahorro'}
                            </span>
                          </div>
                        ) : n.estado === 'Pendiente' ? (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              disabled={actionLoading === n.idnotificacion}
                              onClick={() => handleRespond(n.idnotificacion, true)}
                              className="h-7 text-[11px] px-3 gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
                            >
                              {actionLoading === n.idnotificacion ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === n.idnotificacion}
                              onClick={() => handleRespond(n.idnotificacion, false)}
                              className="h-7 text-[11px] px-2.5 gap-1 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg"
                            >
                              <X className="w-3 h-3" />
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                n.estado === 'Aceptada'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {n.estado === 'Aceptada' ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-500" /> Aceptada
                                </>
                              ) : (
                                <>
                                  <X className="w-2.5 h-2.5 text-rose-500" /> Rechazada
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
