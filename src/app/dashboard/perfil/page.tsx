'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ArrowLeft,
  Camera,
  Save,
  UserPlus,
  UserCheck,
  Search,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Loader2,
  Check,
  X,
  UserX,
  Sun,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';

interface UserProfile {
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
  biografia: string | null;
  telefono: string | null;
  temapreferido?: string | null;
}

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

export const SIMPSONS_PRESETS = [
  { name: 'Homer', url: '/avatars/homer.png', bg: 'bg-gradient-to-b from-blue-500 to-indigo-700', imgClass: 'object-contain p-0.5 object-center scale-110' },
  { name: 'Marge', url: '/avatars/marge.png', bg: 'bg-gradient-to-b from-emerald-500 to-teal-800', imgClass: 'object-contain p-0.5 object-center' },
  { name: 'Bart', url: '/avatars/bart.png', bg: 'bg-gradient-to-b from-orange-500 to-red-700', imgClass: 'object-contain p-1 object-center scale-105' },
  { name: 'Lisa', url: '/avatars/lisa.png', bg: 'bg-gradient-to-b from-yellow-400 to-amber-600', imgClass: 'object-contain p-1 object-center scale-105' },
  { name: 'Maggie', url: '/avatars/maggie.png', bg: 'bg-gradient-to-b from-pink-500 to-rose-700', imgClass: 'object-contain p-1 object-center scale-105' },
  { name: 'Ned Flanders', url: '/avatars/ned.png', bg: 'bg-gradient-to-b from-teal-400 to-cyan-800', imgClass: 'object-contain p-0.5 object-center scale-105' },
  { name: 'Krusty', url: '/avatars/krusty.png', bg: 'bg-gradient-to-b from-purple-500 to-violet-800', imgClass: 'object-contain p-0.5 object-center scale-105' },
  { name: 'Mr. Burns', url: '/avatars/burns.png', bg: 'bg-gradient-to-b from-slate-600 to-slate-900', imgClass: 'object-contain p-0.5 object-center scale-105' },
  { name: 'Ralph', url: '/avatars/ralph.png', bg: 'bg-gradient-to-b from-rose-400 to-pink-700', imgClass: 'object-contain p-1 object-center scale-105' },
  { name: 'Milhouse', url: '/avatars/milhouse.png', bg: 'bg-gradient-to-b from-indigo-500 to-blue-800', imgClass: 'object-contain p-0.5 object-center scale-105' },
  { name: 'Moe', url: '/avatars/moe.png', bg: 'bg-gradient-to-b from-cyan-600 to-blue-900', imgClass: 'object-contain p-0.5 object-center scale-105' },
];

export const getAvatarBg = (url?: string | null) => {
  if (!url) return 'bg-gradient-to-tr from-indigo-500/20 to-purple-500/20';
  const preset = SIMPSONS_PRESETS.find(p => p.url === url || (url.includes('/avatars/') && url.includes(p.name.toLowerCase().split(' ')[0])));
  return preset ? preset.bg : 'bg-gradient-to-tr from-indigo-500/20 to-purple-500/20';
};

export const getAvatarClass = (url?: string | null) => {
  if (!url) return 'w-full h-full object-cover';
  const preset = SIMPSONS_PRESETS.find(p => p.url === url || (url.includes('/avatars/') && url.includes(p.name.toLowerCase().split(' ')[0])));
  if (preset) {
    return `w-full h-full ${preset.imgClass} transition-transform`;
  }
  return url.includes('/avatars/') ? 'w-full h-full object-contain p-1' : 'w-full h-full object-cover';
};


export default function ProfilePage() {
  const session = authClient.useSession();
  const userSession = session?.data?.user;

  // Profile Form States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nombreusuario, setNombreusuario] = useState('');
  const [biografia, setBiografia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoperfil, setFotoperfil] = useState('');
  
  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // UI Control States
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent'>('friends');
  
  // Friends list states
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<RequestReceivedItem[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestSentItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'La nueva contraseña debe tener al menos 6 caracteres', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Las contraseñas no coinciden', error: true });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change',
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage({ text: data.error || 'Error al cambiar contraseña', error: true });
      } else {
        setPasswordMessage({ text: data.message || 'Contraseña actualizada exitosamente', error: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordMessage({ text: 'Error de red al actualizar contraseña', error: true });
    } finally {
      setSavingPassword(false);
    }
  };

  // Actions loading states
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load profile data
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/perfil');
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setProfile(data.user);
        setNombreusuario(data.user.nombreusuario || '');
        setBiografia(data.user.biografia || '');
        setTelefono(data.user.telefono || '');
        setFotoperfil(data.user.fotoperfil || '');
      } else {
        console.error('Failed to load profile:', data.error);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load friends and requests
  const fetchFriendsData = async () => {
    try {
      const res = await fetch('/api/amigos');
      const data = await res.json();
      if (res.ok && data.success) {
        setFriends(data.amigos || []);
        setReceivedRequests(data.solicitudesRecibidas || []);
        setSentRequests(data.solicitudesEnviadas || []);
      } else {
        console.error('Failed to load friends details:', data.error);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      if (isMounted) {
        await fetchProfile();
        await fetchFriendsData();
      }
    };
    void initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreusuario,
          biografia,
          telefono,
          fotoperfil,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfile(data.user);
        setFeedback({ type: 'success', message: '¡Perfil actualizado con éxito!' });
        // Update user session cache locally if possible
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            setFeedback(null);
          }, 3000);
        }
      } else {
        setFeedback({ type: 'error', message: data.error || 'No se pudo actualizar el perfil' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setFeedback({ type: 'error', message: 'Error de red al actualizar el perfil' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Search users dynamic trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const res = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          if (res.ok && data.success) {
            setSearchResults(data.users || []);
          }
        } catch (err) {
          console.error('Error searching users:', err);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Friend Requests / Relations Actions
  const handleSendRequest = async (destId: string) => {
    setFriendActionLoading(`send-${destId}`);
    setFeedback(null);
    try {
      const res = await fetch('/api/amigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatarioId: destId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || 'Solicitud enviada' });
        await fetchFriendsData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error al enviar solicitud' });
      }
    } catch (err) {
      console.error('Error sending request:', err);
      setFeedback({ type: 'error', message: 'Error de conexión' });
    } finally {
      setFriendActionLoading(null);
    }
  };

  const handleRespondRequest = async (idamistad: string, estado: 'Aceptado' | 'Rechazado') => {
    setFriendActionLoading(`respond-${idamistad}`);
    setFeedback(null);
    try {
      const res = await fetch('/api/amigos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idamistad, estado }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: estado === 'Aceptado' ? 'Solicitud aceptada correctamente' : 'Solicitud rechazada',
        });
        await fetchFriendsData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error al responder solicitud' });
      }
    } catch (err) {
      console.error('Error responding request:', err);
      setFeedback({ type: 'error', message: 'Error de conexión' });
    } finally {
      setFriendActionLoading(null);
    }
  };

  const handleDeleteFriendship = async (idamistad: string, label: string) => {
    if (!confirm(`¿Estás seguro de que deseas ${label}?`)) return;
    setFriendActionLoading(`delete-${idamistad}`);
    setFeedback(null);
    try {
      const res = await fetch(`/api/amigos?idamistad=${idamistad}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Amigo/solicitud eliminado con éxito' });
        await fetchFriendsData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Error al eliminar' });
      }
    } catch (err) {
      console.error('Error deleting relationship:', err);
      setFeedback({ type: 'error', message: 'Error de conexión' });
    } finally {
      setFriendActionLoading(null);
    }
  };

  // Helper to determine status in search result list
  const getFriendshipStatus = (searchedUserId: string) => {
    const isFriend = friends.some((f) => f.idusuario === searchedUserId);
    if (isFriend) return 'friend';
    
    const hasIncoming = receivedRequests.some((r) => r.remitente.idusuario === searchedUserId);
    if (hasIncoming) return 'incoming';

    const hasOutgoing = sentRequests.some((s) => s.destinatario.idusuario === searchedUserId);
    if (hasOutgoing) return 'outgoing';

    return 'none';
  };

  if (!userSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Cargando sesión...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden flex flex-col transition-colors duration-200">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Navbar Header */}
      <nav className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = '/dashboard')}
              className="gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Perfil de Usuario</span>
          </div>
          <ThemeToggle variant="compact" />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Toast Feedback */}
        {feedback && (
          <div
            className={`col-span-1 lg:col-span-3 p-4 rounded-2xl border text-sm font-semibold flex justify-between items-center animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Column 1 & 2 (Left): Profile Edit Form */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-8 relative">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold tracking-tight text-white">Editar Información Personal</h2>
            </div>

            {loadingProfile ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-medium">Cargando perfil...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Avatar Uploader Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800/60">
                  <div className="relative group">
                    <div className={`w-24 h-24 rounded-full ${getAvatarBg(fotoperfil)} border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-inner`}>
                      {fotoperfil ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fotoperfil}
                          alt="Avatar de perfil"
                          className={getAvatarClass(fotoperfil)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombreusuario || 'U')}`;
                          }}
                        />
                      ) : (
                        <User className="w-10 h-10 text-slate-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
                      title="Cambiar Foto"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="font-bold text-white text-base">Foto de Perfil</h3>
                    <p className="text-xs text-slate-400">
                      Selecciona uno de nuestros avatares premium prediseñados o ingresa una URL personalizada.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                      >
                        {showAvatarSelector ? 'Ocultar Selector' : 'Elegir Avatar'}
                      </Button>
                      {fotoperfil && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:text-rose-300"
                          onClick={() => setFotoperfil('')}
                        >
                          Quitar Foto
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid of Preset Avatars (Collapsible) */}
                {showAvatarSelector && (
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-200">
                    <h4 className="text-xs font-bold text-slate-300">Galería de Avatares Recomendados</h4>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                      {SIMPSONS_PRESETS.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFotoperfil(item.url);
                            setShowAvatarSelector(false);
                          }}
                          className={`w-12 h-12 rounded-full overflow-hidden border-2 ${item.bg} transition-all ${
                            fotoperfil === item.url ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-slate-850 hover:border-slate-600'
                          }`}
                          title={item.name}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.url} alt={item.name} className={getAvatarClass(item.url)} />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-400">O ingresa una URL personalizada de imagen:</label>
                      <Input
                        type="url"
                        placeholder="https://ejemplo.com/mi-foto.jpg"
                        value={fotoperfil}
                        onChange={(e) => setFotoperfil(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Nickname */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      Nombre de Usuario
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: santiramos"
                      value={nombreusuario}
                      onChange={(e) => setNombreusuario(e.target.value)}
                      className="bg-slate-950/80 border-slate-800 focus:border-indigo-500 text-sm h-11"
                      required
                    />
                  </div>

                  {/* Email (Read Only / from Auth) */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-500" />
                      Email (No editable)
                    </label>
                    <Input
                      type="email"
                      value={profile?.email || ''}
                      className="bg-slate-950/40 border-slate-800/40 text-slate-500 text-sm h-11 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-slate-400" />
                      Teléfono Móvil
                    </label>
                    <Input
                      type="tel"
                      placeholder="+598 99 123 456"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="bg-slate-950/80 border-slate-800 focus:border-indigo-500 text-sm h-11"
                    />
                  </div>

                  {/* Biography */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Biografía / Descripción
                    </label>
                    <textarea
                      placeholder="Escribe una pequeña descripción sobre ti..."
                      value={biografia}
                      onChange={(e) => setBiografia(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-sm p-3 focus:outline-none transition-colors text-slate-100 placeholder:text-slate-600"
                    />
                  </div>

                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto px-6 h-11 gap-2 bg-gradient-to-tr from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>

              </form>
            )}
          </div>

          {/* Security & Password Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Seguridad y Contraseña</h3>
                <p className="text-xs text-slate-400">Actualiza la contraseña de tu cuenta</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Contraseña Actual (Opcional)</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nueva Contraseña</label>
                  <Input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-sm h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Confirmar Nueva Contraseña</label>
                  <Input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-sm h-11"
                  />
                </div>
              </div>

              {passwordMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold border ${
                  passwordMessage.error
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full sm:w-auto px-5 h-10 gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Theme & Visual Preference Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Apariencia y Tema Visual</h3>
                <p className="text-xs text-slate-400">Personaliza la interfaz entre Modo Claro, Oscuro o del Sistema</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-left space-y-1">
                <span className="text-xs font-bold text-slate-200 block">Modo de Color Preferido</span>
                <span className="text-[11px] text-slate-400 block">Se sincronizará en todos tus dispositivos y en tu perfil</span>
              </div>
              <ThemeToggle variant="buttons" />
            </div>
          </div>
        </section>

        {/* Column 3 (Right): Friends Management Panel */}
        <section className="space-y-6">
          
          {/* A. Search / Add Friends Widget */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-white">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base">Buscar Nuevos Amigos</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border-slate-800 pl-10 text-sm h-10 placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>

            {/* Realtime Search Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 max-h-60 overflow-y-auto space-y-3">
                {searching ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Buscando usuarios...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No se encontraron usuarios
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const status = getFriendshipStatus(user.idusuario);
                    return (
                      <div key={user.idusuario} className="flex items-center justify-between gap-2 p-2 hover:bg-slate-900/60 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className={`w-8 h-8 rounded-full ${user.fotoperfil ? getAvatarBg(user.fotoperfil) : 'bg-slate-800'} border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden`}>
                            {user.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.fotoperfil} alt={user.nombreusuario} className={getAvatarClass(user.fotoperfil)} />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">{user.nombreusuario}</div>
                            <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                          </div>
                        </div>

                        {status === 'friend' && (
                          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Amigos</span>
                          </div>
                        )}
                        {status === 'outgoing' && (
                          <div className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg shrink-0">
                            Pendiente
                          </div>
                        )}
                        {status === 'incoming' && (
                          <div className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg shrink-0">
                            Te solicitó
                          </div>
                        )}
                        {status === 'none' && (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(user.idusuario)}
                            disabled={friendActionLoading === `send-${user.idusuario}`}
                            className="h-8 text-xs px-2.5 rounded-lg shrink-0"
                          >
                            {friendActionLoading === `send-${user.idusuario}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Añadir</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* B. Friends Lists Tabs Container */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Tabs Header */}
            <div className="flex p-1 bg-slate-950/80 border-b border-slate-800/60">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'friends'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mis Amigos ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all relative ${
                  activeTab === 'received'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solicitudes ({receivedRequests.length})
                {receivedRequests.length > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === 'sent'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Enviadas ({sentRequests.length})
              </button>
            </div>

            {/* List Body */}
            <div className="p-5 flex-1 min-h-[300px] max-h-[480px] overflow-y-auto">
              {loadingFriends ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-[11px] font-medium">Cargando relaciones...</span>
                </div>
              ) : activeTab === 'friends' ? (
                /* Tab 1: Mis Amigos */
                friends.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <User className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Aún no tienes amigos en la plataforma.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {friends.map((friend) => (
                      <div
                        key={friend.idamistad}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-800 flex items-center justify-between gap-3 group/item"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className={`w-10 h-10 rounded-full ${friend.fotoperfil ? getAvatarBg(friend.fotoperfil) : 'bg-slate-900'} border border-slate-800 flex items-center justify-center overflow-hidden shrink-0`}>
                            {friend.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={friend.fotoperfil} alt={friend.nombreusuario} className={getAvatarClass(friend.fotoperfil)} />
                            ) : (
                              <User className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden">
                            <span className="text-xs font-bold text-white block truncate">{friend.nombreusuario}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{friend.email}</span>
                            {friend.biografia && (
                              <span className="text-[10px] text-slate-400 block truncate italic mt-0.5">&ldquo;{friend.biografia}&rdquo;</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteFriendship(friend.idamistad, `eliminar a ${friend.nombreusuario} de tus amigos`)}
                          disabled={friendActionLoading === `delete-${friend.idamistad}`}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-colors shrink-0"
                          title="Eliminar amigo"
                        >
                          {friendActionLoading === `delete-${friend.idamistad}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'received' ? (
                /* Tab 2: Solicitudes Recibidas */
                receivedRequests.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Mail className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Sin solicitudes de amistad entrantes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map((req) => (
                      <div
                        key={req.idamistad}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className={`w-9 h-9 rounded-full ${req.remitente.fotoperfil ? getAvatarBg(req.remitente.fotoperfil) : 'bg-slate-900'} border border-slate-800 flex items-center justify-center overflow-hidden shrink-0`}>
                            {req.remitente.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.remitente.fotoperfil} alt={req.remitente.nombreusuario} className={getAvatarClass(req.remitente.fotoperfil)} />
                            ) : (
                              <User className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden">
                            <span className="text-xs font-bold text-white block truncate">{req.remitente.nombreusuario}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{req.remitente.email}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                            onClick={() => handleRespondRequest(req.idamistad, 'Aceptado')}
                            disabled={friendActionLoading === `respond-${req.idamistad}`}
                          >
                            {friendActionLoading === `respond-${req.idamistad}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Aceptar</span>
                              </>
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs h-8 gap-1.5"
                            onClick={() => handleRespondRequest(req.idamistad, 'Rechazado')}
                            disabled={friendActionLoading === `respond-${req.idamistad}`}
                          >
                            {friendActionLoading === `respond-${req.idamistad}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5" />
                                <span>Rechazar</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Tab 3: Solicitudes Enviadas */
                sentRequests.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <UserPlus className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">No tienes solicitudes enviadas pendientes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map((req) => (
                      <div
                        key={req.idamistad}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className={`w-8 h-8 rounded-full ${req.destinatario.fotoperfil ? getAvatarBg(req.destinatario.fotoperfil) : 'bg-slate-900'} border border-slate-800 flex items-center justify-center overflow-hidden shrink-0`}>
                            {req.destinatario.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.destinatario.fotoperfil} alt={req.destinatario.nombreusuario} className={getAvatarClass(req.destinatario.fotoperfil)} />
                            ) : (
                              <User className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="text-left overflow-hidden">
                            <span className="text-xs font-bold text-white block truncate">{req.destinatario.nombreusuario}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{req.destinatario.email}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteFriendship(req.idamistad, 'cancelar la solicitud de amistad enviada')}
                          disabled={friendActionLoading === `delete-${req.idamistad}`}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors shrink-0"
                          title="Cancelar solicitud"
                        >
                          {friendActionLoading === `delete-${req.idamistad}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
