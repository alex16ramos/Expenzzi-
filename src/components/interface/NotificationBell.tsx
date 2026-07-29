'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Bell, Check, X, Shield, Sparkles, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';

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

const isGeneralNotif = (n: NotificacionItem) =>
  n.tipo === 'SOLICITUD_AMISTAD' || n.tipo === 'INVITACION_INTERFAZ' || !n.idinterfazoperacion;

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
  const [selectedInterfaceFilter, setSelectedInterfaceFilter] = useState<string>('ALL');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const availableInterfaces = React.useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; count: number }>();
    if (interfaceId && interfaceName) {
      map.set(String(interfaceId), { id: String(interfaceId), nombre: String(interfaceName), count: 0 });
    }
    for (const n of notificaciones) {
      if (n.interfaz) {
        const existing = map.get(n.interfaz.id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(n.interfaz.id, { id: n.interfaz.id, nombre: n.interfaz.nombre, count: 1 });
        }
      }
    }
    return Array.from(map.values());
  }, [notificaciones, interfaceId, interfaceName]);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones');
      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current && data.success) {
        setNotificaciones(data.notificaciones || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notificaciones');
      if (res.status === 401) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (!isMountedRef.current) return;
        const retryRes = await fetch('/api/notificaciones');
        if (retryRes.ok) {
          const data = await retryRes.json();
          if (isMountedRef.current && data.success) {
            setNotificaciones(data.notificaciones || []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
        return;
      }

      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current && data.success) {
        setNotificaciones(data.notificaciones || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, []);

  const loadNotifsRef = useRef(loadNotifs);
  useEffect(() => {
    loadNotifsRef.current = loadNotifs;
  });

  useEffect(() => {
    isMountedRef.current = true;
    Promise.resolve().then(() => {
      if (isMountedRef.current && loadNotifsRef.current) loadNotifsRef.current();
    });

    // Pause polling when document is hidden to save memory and network calls
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && loadNotifsRef.current) {
        loadNotifsRef.current();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

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
      if (!res.ok) return;
      const data = await res.json();

      if (data.success && isMountedRef.current) {
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
      if (isMountedRef.current) {
        setActionLoading(null);
      }
    }
  };

  const handleDeleteNotification = async (idnotificacion: string) => {
    setActionLoading(idnotificacion);
    try {
      const target = notificaciones.find((n) => n.idnotificacion === idnotificacion);
      const res = await fetch(`/api/notificaciones?id=${idnotificacion}`, {
        method: 'DELETE',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && isMountedRef.current) {
        if (target && !target.leido) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        setNotificaciones((prev) => prev.filter((n) => n.idnotificacion !== idnotificacion));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      if (isMountedRef.current) {
        setActionLoading(null);
      }
    }
  };

  const unreadGeneral = notificaciones.filter((n) => !n.leido && isGeneralNotif(n)).length;
  const activityNotifs = notificaciones.filter((n) => !isGeneralNotif(n));
  const unreadInterfaz = activityNotifs.filter((n) => !n.leido).length;

  const filteredNotificaciones = notificaciones.filter((n) => {
    if (activeTab === 'general') return isGeneralNotif(n);
    if (activeTab === 'interfaz') {
      if (isGeneralNotif(n)) return false;
      if (selectedInterfaceFilter === 'ALL') return true;
      return String(n.idinterfazoperacion) === selectedInterfaceFilter;
    }
    return true;
  });

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotificaciones();
        }}
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm focus:outline-none"
        title="Centro de Notificaciones"
        aria-label="Centro de Notificaciones"
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
              type="button"
              onClick={fetchNotificaciones}
              aria-label="Actualizar notificaciones"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 p-1 gap-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
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
              type="button"
              onClick={() => setActiveTab('interfaz')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 truncate ${
                activeTab === 'interfaz'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-800 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="truncate">Actividad</span>
              {unreadInterfaz > 0 && (
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'todas'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-800 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Todas ({notificaciones.length})</span>
            </button>
          </div>

          {/* Interface Sub-Filter Dropdown inside Actividad tab */}
          {activeTab === 'interfaz' && (
            <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                Filtrar por interfaz:
              </span>
              <select
                value={selectedInterfaceFilter}
                onChange={(e) => setSelectedInterfaceFilter(e.target.value)}
                aria-label="Filtrar actividad por interfaz"
                className="h-7 px-2 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 max-w-[200px] truncate cursor-pointer"
              >
                <option value="ALL">Todas las interfaces ({activityNotifs.length})</option>
                {availableInterfaces.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} ({item.count})
                  </option>
                ))}
              </select>
            </div>
          )}

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
                    ? selectedInterfaceFilter === 'ALL'
                      ? 'Sin actividad reciente en ninguna interfaz'
                      : 'Sin actividad reciente en la interfaz seleccionada'
                    : 'Sin notificaciones por ahora'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeTab === 'general'
                    ? 'Te avisaremos cuando recibas solicitudes de amistad o invitaciones.'
                    : 'Aquí verás los gastos, ingresos y ahorros registrados.'}
                </p>
              </div>
            ) : (
              filteredNotificaciones.map((n) => (
                <NotificationCardItem
                  key={n.idnotificacion}
                  n={n}
                  actionLoading={actionLoading}
                  onRespond={handleRespond}
                  onDelete={handleDeleteNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationCardItem({
  n,
  actionLoading,
  onRespond,
  onDelete,
}: {
  n: NotificacionItem;
  actionLoading: string | null;
  onRespond: (id: string, aceptar: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const emisorNombre = n.emisor?.nombreusuario || 'Un usuario';
  const initials = emisorNombre
    ? emisorNombre
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'US';

  let displayMensaje = n.mensaje || '';
  if (n.emisor?.nombreusuario) {
    if (!displayMensaje || displayMensaje.includes('Un usuario')) {
      if (n.tipo === 'SOLICITUD_AMISTAD') {
        displayMensaje = `${n.emisor.nombreusuario} te ha enviado una solicitud de amistad.`;
      } else if (displayMensaje.includes('Un usuario')) {
        displayMensaje = displayMensaje.replace(/Un usuario/g, n.emisor.nombreusuario);
      }
    }
  }

  return (
    <div className="relative overflow-hidden bg-rose-500/10 group">
      {/* Background Delete Button visible when sliding */}
      <div className="absolute inset-y-0 right-0 w-20 bg-rose-600 flex items-center justify-center text-white z-0">
        <button
          type="button"
          onClick={() => onDelete(n.idnotificacion)}
          className="w-full h-full flex items-center justify-center gap-1 text-[11px] font-bold text-white"
        >
          <Trash2 className="w-4 h-4" /> Borrar
        </button>
      </div>

      {/* Draggable Card Body */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -75, right: 0 }}
        dragElastic={0.1}
        className={`relative z-10 p-3.5 bg-white dark:bg-slate-900 transition-colors ${
          !n.leido && n.estado === 'Pendiente' ? 'bg-violet-50 dark:bg-violet-950' : ''
        }`}
      >
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          <div
            className={`w-9 h-9 rounded-full ${getAvatarBg(n.emisor?.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm mt-0.5`}
          >
            {n.emisor?.fotoperfil ? (
              <Image
                src={n.emisor.fotoperfil}
                alt={emisorNombre}
                width={36}
                height={36}
                unoptimized
                className={getAvatarClass(n.emisor.fotoperfil)}
              />
            ) : (
              <span className="text-violet-600 dark:text-violet-400 text-xs font-bold">{initials}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex justify-between items-start">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.titulo}</h4>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-[10px] text-slate-600 dark:text-slate-400">
                  {new Date(n.fechacreacion).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'UTC',
                  })}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(n.idnotificacion);
                  }}
                  disabled={actionLoading === n.idnotificacion}
                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors ml-1 opacity-70 hover:opacity-100"
                  title="Borrar notificación"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{displayMensaje}</p>

            {n.rolPropuesto && n.tipo === 'INVITACION_INTERFAZ' && (
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/50">
                <Shield className="w-2.5 h-2.5" />
                <span>Rol: {n.rolPropuesto}</span>
              </div>
            )}

            {/* Action / Badge Section */}
            {n.estado === 'Informativa' || n.tipo.startsWith('NUEVO_') || n.tipo.startsWith('GASTO_') ? (
              <div className="pt-1.5 flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    n.tipo === 'NUEVO_GASTO'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                      : n.tipo === 'GASTO_ASIGNADO'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : n.tipo === 'GASTO_COMPARTIDO'
                      ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                      : n.tipo === 'NUEVO_INGRESO'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30'
                  }`}
                >
                  {n.tipo === 'GASTO_ASIGNADO'
                    ? '📌 Gasto Asignado'
                    : n.tipo === 'GASTO_COMPARTIDO'
                    ? '👥 Gasto Compartido'
                    : n.tipo === 'NUEVO_GASTO'
                    ? '💸 Gasto'
                    : n.tipo === 'NUEVO_INGRESO'
                    ? '💰 Ingreso'
                    : '🏦 Ahorro'}
                </span>

                {n.interfaz?.nombre && (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                    {n.interfaz.nombre}
                  </span>
                )}
              </div>
            ) : n.estado === 'Pendiente' ? (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  disabled={actionLoading === n.idnotificacion}
                  onClick={() => onRespond(n.idnotificacion, true)}
                  className="h-8 text-xs px-3.5 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md"
                >
                  {actionLoading === n.idnotificacion ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  disabled={actionLoading === n.idnotificacion}
                  onClick={() => onRespond(n.idnotificacion, false)}
                  className="h-8 text-xs px-3.5 gap-1.5 bg-slate-700 hover:bg-rose-600 text-white font-extrabold rounded-xl shadow-md border border-slate-600"
                >
                  <X className="w-3.5 h-3.5 text-white" />
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
      </motion.div>
    </div>
  );
}
