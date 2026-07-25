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
  Phone,
  Loader2,
  Check,
  X,
  UserX,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  AtSign,
  Users,
  Upload,
  Link2,
  Image as ImageIcon,
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
  const [showSecuritySection, setShowSecuritySection] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'received' | 'sent'>('friends');

  // Avatar custom upload states
  const [avatarTab, setAvatarTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        await handleSelectAvatar(base64Url);
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Error al leer el archivo de imagen');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    await handleSelectAvatar(customUrlInput.trim());
    setCustomUrlInput('');
  };

  // Friends list states
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<RequestReceivedItem[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestSentItem[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);

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
        setTimeout(() => setFeedback(null), 3000);
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

  // Handle Avatar Select & Save
  const handleSelectAvatar = async (url: string) => {
    setFotoperfil(url);
    setShowAvatarSelector(false);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreusuario,
          biografia,
          telefono,
          fotoperfil: url,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.user);
        setFeedback({ type: 'success', message: '¡Avatar actualizado!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error saving avatar:', err);
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

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    } finally {
      window.location.href = '/';
    }
  };

  const getFriendshipStatus = (searchedUserId: string) => {
    const isFriend = friends.some((f) => f.idusuario === searchedUserId);
    if (isFriend) return 'friend';
    
    const hasIncoming = receivedRequests.some((r) => r.remitente.idusuario === searchedUserId);
    if (hasIncoming) return 'incoming';

    const hasOutgoing = sentRequests.some((s) => s.destinatario.idusuario === searchedUserId);
    if (hasOutgoing) return 'outgoing';

    return 'none';
  };

  if (!userSession || loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-center items-start p-0 md:py-8 font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Radial Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main Container Frame */}
      <div className="w-full max-w-md bg-white dark:bg-slate-950 md:dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 md:rounded-3xl shadow-2xl min-h-screen md:min-h-[840px] flex flex-col justify-between overflow-hidden relative backdrop-blur-md transition-colors">
        
        <div>
          {/* HEADER NAVBAR */}
          <header className="p-4 flex justify-between items-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 dark:border-slate-900 transition-colors">
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">Perfil de Usuario</h1>
            <div className="w-8" />
          </header>

          <main className="p-4 space-y-5 flex-1 overflow-y-auto">
            {/* Feedback Notification Toast */}
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

            {/* HERO PROFILE AVATAR CARD */}
            <div className="flex flex-col items-center text-center p-5 bg-gradient-to-b from-purple-500/10 via-white to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl relative shadow-sm transition-colors">
              <div
                onClick={() => setShowAvatarSelector(true)}
                className="relative mb-3 group cursor-pointer"
                title="Cambiar avatar de perfil"
              >
                <div className={`w-20 h-20 rounded-full ${getAvatarBg(fotoperfil)} border-2 border-indigo-500 p-1 shadow-xl overflow-hidden flex items-center justify-center`}>
                  {fotoperfil ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fotoperfil}
                      alt={nombreusuario || 'Avatar'}
                      className={getAvatarClass(fotoperfil)}
                    />
                  ) : (
                    <User className="w-10 h-10 text-indigo-400" />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white dark:border-slate-900 group-hover:scale-110 transition-transform">
                  <Camera className="w-3.5 h-3.5" />
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {nombreusuario || userSession.name || 'Usuario'}
              </h2>
              <span className="text-xs text-indigo-600 dark:text-purple-300 bg-indigo-50 dark:bg-purple-950/60 border border-indigo-200 dark:border-purple-500/30 px-3 py-0.5 rounded-full font-mono mt-1 font-semibold">
                {profile?.email || userSession.email}
              </span>
            </div>

            {/* PERSONAL INFORMATION FORM */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm transition-colors">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <UserCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Información Personal</h3>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">Nombre de Usuario</label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={nombreusuario}
                      onChange={(e) => setNombreusuario(e.target.value)}
                      placeholder="Tu nombre o apodo"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">Teléfono Móvil</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+598 99 123 456"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">Biografía / Descripción</label>
                  <textarea
                    rows={2}
                    value={biografia}
                    onChange={(e) => setBiografia(e.target.value)}
                    placeholder="Escribe una breve descripción..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-colors flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Guardar Cambios
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* FRIENDS MANAGEMENT MODULE */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Gestión de Amigos</h3>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                  {friends.length} Activo(s)
                </span>
              </div>

              {/* Dynamic User Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Dynamic Search Results Dropdown */}
              {searchQuery.trim().length >= 2 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Resultados de búsqueda ({searchResults.length})
                  </span>

                  {searching ? (
                    <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      Buscando usuarios...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No se encontraron usuarios.</p>
                  ) : (
                    searchResults.map((sr) => {
                      const status = getFriendshipStatus(sr.idusuario);
                      const isSelf = sr.idusuario === profile?.idusuario;

                      return (
                        <div
                          key={sr.idusuario}
                          className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${getAvatarBg(sr.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden`}>
                              {sr.fotoperfil ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={sr.fotoperfil} alt={sr.nombreusuario} className={getAvatarClass(sr.fotoperfil)} />
                              ) : (
                                <User className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{sr.nombreusuario}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{sr.email}</p>
                            </div>
                          </div>

                          {!isSelf && (
                            <div>
                              {status === 'friend' && (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  Amigo
                                </span>
                              )}
                              {status === 'outgoing' && (
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  Enviada
                                </span>
                              )}
                              {status === 'incoming' && (
                                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                  Pendiente
                                </span>
                              )}
                              {status === 'none' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSendRequest(sr.idusuario)}
                                  disabled={friendActionLoading === `send-${sr.idusuario}`}
                                  className="h-7 text-[11px] px-2.5 bg-blue-600 hover:bg-blue-500 text-white gap-1"
                                >
                                  {friendActionLoading === `send-${sr.idusuario}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="w-3 h-3" /> Agregar
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Friends Tabs Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === 'friends'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mis Amigos ({friends.length})
                </button>
                <button
                  onClick={() => setActiveTab('received')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === 'received'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Solicitudes ({receivedRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    activeTab === 'sent'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Enviadas ({sentRequests.length})
                </button>
              </div>

              {/* Tab Content: Mis Amigos */}
              {activeTab === 'friends' && (
                <div className="space-y-2 pt-1">
                  {friends.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-500">No tienes amigos agregados aún.</p>
                  ) : (
                    friends.map((f) => (
                      <div
                        key={f.idamistad}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${getAvatarBg(f.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 overflow-hidden`}>
                            {f.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.fotoperfil} alt={f.nombreusuario} className={getAvatarClass(f.fotoperfil)} />
                            ) : (
                              <User className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{f.nombreusuario}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{f.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFriendship(f.idamistad, 'eliminar este amigo')}
                          className="text-slate-400 hover:text-rose-500 text-xs p-1.5 transition-colors"
                          title="Eliminar amigo"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: Solicitudes Recibidas */}
              {activeTab === 'received' && (
                <div className="space-y-2 pt-1">
                  {receivedRequests.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-500">No tienes solicitudes pendientes.</p>
                  ) : (
                    receivedRequests.map((r) => (
                      <div
                        key={r.idamistad}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${getAvatarBg(r.remitente.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden`}>
                            {r.remitente.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.remitente.fotoperfil} alt={r.remitente.nombreusuario} className={getAvatarClass(r.remitente.fotoperfil)} />
                            ) : (
                              <User className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{r.remitente.nombreusuario}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.remitente.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleRespondRequest(r.idamistad, 'Aceptado')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-xs font-semibold transition-colors"
                            title="Aceptar solicitud"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRespondRequest(r.idamistad, 'Rechazado')}
                            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 p-1.5 rounded-lg text-xs transition-colors"
                            title="Rechazar solicitud"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Content: Solicitudes Enviadas */}
              {activeTab === 'sent' && (
                <div className="space-y-2 pt-1">
                  {sentRequests.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-500">No has enviado solicitudes recientes.</p>
                  ) : (
                    sentRequests.map((s) => (
                      <div
                        key={s.idamistad}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${getAvatarBg(s.destinatario.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden`}>
                            {s.destinatario.fotoperfil ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.destinatario.fotoperfil} alt={s.destinatario.nombreusuario} className={getAvatarClass(s.destinatario.fotoperfil)} />
                            ) : (
                              <User className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{s.destinatario.nombreusuario}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.destinatario.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFriendship(s.idamistad, 'cancelar esta solicitud')}
                          className="text-slate-600 dark:text-slate-400 hover:text-rose-500 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* SECURITY & PASSWORD (COLLAPSIBLE ACCORDION) */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
              <button
                onClick={() => setShowSecuritySection(!showSecuritySection)}
                className="w-full flex justify-between items-center text-left"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Seguridad y Contraseña</h3>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showSecuritySection ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {showSecuritySection && (
                <form onSubmit={handlePasswordChange} className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs animate-in fade-in duration-150">
                  {passwordMessage && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-semibold ${
                        passwordMessage.error
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {passwordMessage.text}
                    </div>
                  )}

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">Contraseña Actual</label>
                    <Input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">Nueva Contraseña</label>
                      <Input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 chars"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400 block mb-1 font-medium">Confirmar Nueva</label>
                      <Input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite contraseña"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 rounded-xl transition-colors"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Actualizando...
                      </>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* APPEARANCE AND THEME */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm transition-colors">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Apariencia y Tema</h3>
              </div>

              <div className="flex justify-center pt-1">
                <ThemeToggle variant="buttons" />
              </div>
            </div>

            {/* LOGOUT DANGER BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleSignOut}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-300 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 text-xs shadow-md"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
          </main>
        </div>

      </div>

      {/* AVATAR SELECTOR MODAL (FILE UPLOAD + PRESETS + CUSTOM URL) */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Cambiar Avatar de Perfil
              </h3>
              <button
                onClick={() => setShowAvatarSelector(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  avatarTab === 'upload'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" /> Mi Imagen
              </button>

              <button
                onClick={() => setAvatarTab('presets')}
                className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  avatarTab === 'presets'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-500" /> Predefinidos
              </button>

              <button
                onClick={() => setAvatarTab('url')}
                className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  avatarTab === 'url'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-blue-500" /> URL Web
              </button>
            </div>

            {/* Tab Content: Upload Local File */}
            {avatarTab === 'upload' && (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Seleccioná o arrastrá cualquier archivo de imagen desde tu dispositivo (PNG, JPG, WebP):
                </p>

                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-950/60 group">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {uploadingImage ? 'Procesando foto...' : 'Seleccionar foto desde tu equipo'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Formatos soportados: PNG, JPG, GIF (Máx 5MB)
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            )}

            {/* Tab Content: Simpsons Gallery Presets */}
            {avatarTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Elige uno de los personajes de Los Simpsons:
                </p>
                <div className="grid grid-cols-4 gap-3 max-h-[250px] overflow-y-auto p-1">
                  {SIMPSONS_PRESETS.map((preset) => (
                    <div
                      key={preset.name}
                      onClick={() => handleSelectAvatar(preset.url)}
                      className={`flex flex-col items-center gap-1 cursor-pointer p-1.5 rounded-xl border transition-all hover:scale-105 ${
                        fotoperfil === preset.url
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-950'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full ${preset.bg} overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-md`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.name} className={preset.imgClass} />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                        {preset.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content: Custom Image URL */}
            {avatarTab === 'url' && (
              <form onSubmit={handleApplyCustomUrl} className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Pegá el enlace directo de una imagen de internet:
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    URL de la Imagen *
                  </label>
                  <Input
                    type="url"
                    required
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="Ej: https://misitio.com/foto.jpg"
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                  <Check className="w-4 h-4" /> Aplicar Imagen desde URL
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
