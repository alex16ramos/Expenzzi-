'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, UserPlus, Search, Check, Shield, Loader2, Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendItem, UserListItemButton } from './UserListItemButton';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  interfaceId: string | number;
  interfaceName?: string;
  linkinvitado?: string;
  linkvisualizador?: string;
  onInviteSent?: (recipientName: string) => void;
}

export function InviteModal({
  isOpen,
  onClose,
  interfaceId,
  interfaceName = 'Interfaz de Operación',
  linkinvitado,
  linkvisualizador,
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
  const [isCopied, setIsCopied] = useState(false);
  const [fetchedCodes, setFetchedCodes] = useState<{ linkinvitado?: string; linkvisualizador?: string }>({});

  // Load quick friends list
  const fetchFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch('/api/amigos');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setFriends(data.amigos || []);
      }
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleClose = () => {
    clearCloseTimer();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      clearCloseTimer();
      const timer = setTimeout(() => {
        setIsCopied(false);
        fetchFriends();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setFeedback(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchFriends]);

  // Fetch interface codes if not provided as props
  useEffect(() => {
    if (isOpen && interfaceId && !linkinvitado && !linkvisualizador) {
      fetch(`/api/interfaces/${interfaceId}/details`)
        .then((res) => res.json())
        .then((data) => {
          if (data.interface) {
            setFetchedCodes({
              linkinvitado: data.interface.linkinvitado,
              linkvisualizador: data.interface.linkvisualizador,
            });
          }
        })
        .catch((err) => console.error('Error fetching interface code:', err));
    }
  }, [isOpen, interfaceId, linkinvitado, linkvisualizador]);

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
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
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

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  const handleCopyCode = async () => {
    const activeInvitado = linkinvitado || fetchedCodes.linkinvitado;
    const activeVisualizador = linkvisualizador || fetchedCodes.linkvisualizador;
    const targetCode = selectedRole === 'Visualizador' ? (activeVisualizador || activeInvitado) : (activeInvitado || activeVisualizador);

    if (!targetCode) return;

    try {
      await navigator.clipboard.writeText(targetCode);
      setIsCopied(true);
      setFeedback({ type: 'success', message: '¡Código de invitación copiado al portapapeles!' });
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch {
      setFeedback({ type: 'error', message: 'No se pudo copiar el código al portapapeles' });
    }
  };

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
      if (!res.ok) {
        setFeedback({ type: 'error', message: 'No se pudo enviar la invitación' });
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message });
        if (onInviteSent) {
          onInviteSent(selectedUser.nombreusuario);
        }
        clearCloseTimer();
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

  const activeInvitadoCode = linkinvitado || fetchedCodes.linkinvitado;
  const activeVisualizadorCode = linkvisualizador || fetchedCodes.linkvisualizador;
  const currentCode = selectedRole === 'Visualizador' ? (activeVisualizadorCode || activeInvitadoCode) : (activeInvitadoCode || activeVisualizadorCode);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 relative overflow-hidden">
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
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal de invitación"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Invitation Code Copy Box */}
        <div className="p-3.5 bg-indigo-50/70 dark:bg-slate-950/80 border border-indigo-200 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Código de Invitación Directo
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              (Ingresar en &quot;Unirse a Interfaz&quot;)
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Comparte este código directamente para que cualquier miembro se una con rol de <strong>{selectedRole}</strong>.
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate select-all shadow-inner">
              {currentCode || 'Cargando código de invitación...'}
            </div>
            <Button
              type="button"
              onClick={handleCopyCode}
              disabled={!currentCode}
              className={`h-8 px-3 text-xs font-bold gap-1.5 transition-colors shrink-0 rounded-xl ${
                isCopied
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Código
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
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
        <div className="space-y-1.5">
          <label htmlFor="invite-search" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Buscar usuario por Nombre o Email para enviar notificación
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              id="invite-search"
              type="text"
              placeholder="Ej. maria@ejemplo.com o Maria Perez..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-800"
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
                searchResults.map((user) => (
                  <UserListItemButton
                    key={user.idusuario}
                    user={user}
                    isSelected={selectedUser?.idusuario === user.idusuario}
                    onSelect={() => setSelectedUser(user)}
                  />
                ))
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
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                {friends.map((friend) => (
                  <UserListItemButton
                    key={friend.idusuario}
                    user={friend}
                    isSelected={selectedUser?.idusuario === friend.idusuario}
                    onSelect={() => setSelectedUser(friend)}
                    showQuickIcon
                  />
                ))}
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
              <label htmlFor="invite-rol" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-violet-500" /> Rol a Asignar en la Interfaz:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Invitado', 'Visualizador', 'Administrador'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
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
            onClick={handleClose}
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
