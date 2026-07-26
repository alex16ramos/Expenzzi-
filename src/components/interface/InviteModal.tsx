'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, UserPlus, Search, Check, Shield, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAvatarBg, getAvatarClass } from '@/app/dashboard/perfil/page';

interface FriendItem {
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaceId: string | number;
  interfaceName?: string;
  onInviteSent?: (recipientName: string) => void;
}

export function InviteModal({
  isOpen,
  onClose,
  interfaceId,
  interfaceName = 'Interfaz de Operación',
  onInviteSent,
}: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [searchResults, setSearchResults] = useState<FriendItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<FriendItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Invitado' | 'Visualizador' | 'Administrador'>('Invitado');

  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load quick friends list
  const fetchFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch('/api/amigos');
      const data = await res.json();
      if (res.ok && data.success) {
        setFriends(data.amigos || []);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchFriends();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setFeedback(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchFriends]);

  // Search users by name/email
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      const timer = setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/amigos/buscar?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSearchResults(data.resultados || []);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleSendInvite = async () => {
    if (!selectedUser) return;
    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/notificaciones/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idreceptor: selectedUser.idusuario,
          idinterfazoperacion: interfaceId,
          rolPropuesto: selectedRole,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        if (onInviteSent) {
          onInviteSent(selectedUser.nombreusuario);
        }
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: data.error || 'No se pudo enviar la invitación' });
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      setFeedback({ type: 'error', message: 'Error de conexión al enviar invitación' });
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Invitar a Interfaz</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {interfaceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
            }`}
          >
            {feedback.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Buscar usuario por Nombre o Email
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Ej. maria@ejemplo.com o Maria Perez..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searching && (
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin absolute right-3 top-3" />
            )}
          </div>
        </div>

        {/* Search Results List */}
        {searchQuery.trim().length >= 2 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Resultados de la búsqueda
            </span>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
              {searchResults.length === 0 && !searching ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No se encontraron usuarios coincidentes
                </div>
              ) : (
                searchResults.map((user) => {
                  const isSelected = selectedUser?.idusuario === user.idusuario;
                  const initials = user.nombreusuario.slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={user.idusuario}
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-violet-500/15 text-violet-900 dark:text-violet-200 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${getAvatarBg(user.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0`}>
                          {user.fotoperfil ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.fotoperfil}
                              alt={user.nombreusuario}
                              className={getAvatarClass(user.fotoperfil)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-violet-600 dark:text-violet-400 text-[11px] font-bold">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate text-slate-900 dark:text-white">
                            {user.nombreusuario}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-violet-500 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Quick Friends List */}
        {!searchQuery.trim() && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Contactos y Amigos Rápidos</span>
            </div>

            {loadingFriends ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span>Cargando amigos...</span>
              </div>
            ) : friends.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                Aún no tienes amigos agregados en tu perfil. Utiliza el buscador para ingresar su email o nombre.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                {friends.map((friend) => {
                  const isSelected = selectedUser?.idusuario === friend.idusuario;
                  const initials = friend.nombreusuario.slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={friend.idusuario}
                      type="button"
                      onClick={() => setSelectedUser(friend)}
                      className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-violet-500/15 text-violet-900 dark:text-violet-200 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${getAvatarBg(friend.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0`}>
                          {friend.fotoperfil ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={friend.fotoperfil}
                              alt={friend.nombreusuario}
                              className={getAvatarClass(friend.fotoperfil)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-violet-600 dark:text-violet-400 text-[11px] font-bold">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate text-slate-900 dark:text-white">
                            {friend.nombreusuario}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {friend.email}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-violet-500 shrink-0" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected User & Role Selection */}
        {selectedUser && (
          <div className="p-3.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-900 dark:text-violet-300">
                Destinatario seleccionado:
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedUser.nombreusuario}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-violet-500" /> Rol a Asignar en la Interfaz:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Invitado', 'Visualizador', 'Administrador'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      selectedRole === role
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 h-10 rounded-xl text-xs font-semibold"
          >
            Cancelar
          </Button>
          <Button
            disabled={!selectedUser || sending}
            onClick={handleSendInvite}
            className="px-6 h-10 gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25"
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                Enviar Invitación
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
