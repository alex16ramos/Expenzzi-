'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Camera,
  Save,
  Phone,
  Loader2,
  ShieldCheck,
  Users,
  Upload,
  Link2,
  Image as ImageIcon,
  AtSign,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Header } from '@/components/interface/Header';
import { SideMenu } from '@/components/interface/SideMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface UserProfile {
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
  biografia: string | null;
  telefono: string | null;
  temapreferido?: string | null;
}

import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';
import { AvatarAdjustModal } from '@/components/profile/AvatarAdjustModal';

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

export default function ProfilePage() {
  const session = authClient.useSession();
  const userSession = session?.data?.user;

  // Profile Form States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    nombreusuario: '',
    biografia: '',
    telefono: '',
    fotoperfil: '',
  });

  const { nombreusuario, biografia, telefono, fotoperfil } = form;
  const setNombreusuario = (val: string) => setForm((prev) => ({ ...prev, nombreusuario: val }));
  const setBiografia = (val: string) => setForm((prev) => ({ ...prev, biografia: val }));
  const setTelefono = (val: string) => setForm((prev) => ({ ...prev, telefono: val }));
  const setFotoperfil = (val: string) => setForm((prev) => ({ ...prev, fotoperfil: val }));

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // UI Control States
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showSecuritySection, setShowSecuritySection] = useState(false);

  // SideMenu State
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(false);

  // Avatar custom upload states
  const [avatarTab, setAvatarTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingAdjustImage, setPendingAdjustImage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      try {
        const res = await fetch('/api/perfil');
        if (!res.ok) throw new Error('Error al cargar perfil');
        const data = await res.json();
        if (!ignore && data.success && data.user) {
          setProfile(data.user);
          setForm({
            nombreusuario: data.user.nombreusuario || '',
            biografia: data.user.biografia || '',
            telefono: data.user.telefono || '',
            fotoperfil: data.user.fotoperfil || '',
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        if (!ignore) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setPendingAdjustImage(base64Url);
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo de imagen');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setPendingAdjustImage(customUrlInput.trim());
    setCustomUrlInput('');
  };

  const handleConfirmAdjustImage = async (croppedUrl: string) => {
    setPendingAdjustImage(null);
    await handleSelectAvatar(croppedUrl);
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    setFotoperfil(avatarUrl);
    setShowAvatarSelector(false);

    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoperfil: avatarUrl }),
      });
      if (!res.ok) {
        toast.error('No se pudo guardar la foto de perfil');
        return;
      }
      const data = await res.json();
      if (data.success) {
        toast.success('Foto de perfil actualizada');
        if (data.user) setProfile(data.user);
      } else {
        toast.error(data.error || 'No se pudo guardar la foto de perfil');
      }
    } catch (err) {
      console.error('Error updating avatar:', err);
      toast.error('Error al guardar foto de perfil');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

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
      if (!res.ok) {
        toast.error('Error al actualizar perfil');
        return;
      }
      const data = await res.json();

      if (data.success) {
        toast.success('Perfil actualizado correctamente');
        if (data.user) setProfile(data.user);
      } else {
        toast.error(data.error || 'Error al actualizar perfil');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Error de red al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña nueva debe tener al menos 6 caracteres');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        toast.error('Error al actualizar contraseña');
        return;
      }
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Contraseña actualizada con éxito');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowSecuritySection(false);
      } else {
        toast.error(data.error || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Error al conectar con el servidor');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans relative overflow-x-hidden transition-colors duration-200">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* SideMenu Navigation */}
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        isCollapsed={isSideMenuCollapsed}
        onToggleCollapse={() => setIsSideMenuCollapsed(!isSideMenuCollapsed)}
        role="Usuario"
        onOpenAudit={() => { }}
        onOpenCategories={() => { }}
        onOpenSubmethods={() => { }}
        onOpenDelete={() => { }}
        interfaceName="Mi Perfil"
      />

      <div className="flex-1 flex flex-col justify-between min-h-dvh max-w-5xl mx-auto w-full">
        <div>
          {/* Header */}
          <Header
            interfaceName="Configuración de Perfil"
            userRole="Mi Cuenta"
            onMenuClick={() => setIsSideMenuOpen(!isSideMenuOpen)}
            userAvatar={fotoperfil || userSession?.image}
            userName={nombreusuario || userSession?.name}
          />

          <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* HERO PROFILE CARD */}
            {loadingProfile ? (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-48 rounded-md" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-slate-900 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative group shrink-0">
                  <div className={`w-24 h-24 rounded-full ${getAvatarBg(fotoperfil)} border-4 border-indigo-400 p-0.5 overflow-hidden flex items-center justify-center shadow-xl`}>
                    {fotoperfil ? (
                      <Image
                        src={fotoperfil}
                        alt={nombreusuario || 'Avatar'}
                        width={96}
                        height={96}
                        unoptimized
                        className={getAvatarClass(fotoperfil)}
                      />
                    ) : (
                      <User className="w-10 h-10 text-indigo-300" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 border-2 border-slate-900 shadow-md transition-transform hover:scale-110"
                    title="Cambiar Foto de Perfil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-purple-200 font-extrabold flex items-center justify-center sm:justify-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Usuario Verificado
                  </span>
                  <h2 className="text-2xl font-extrabold text-white truncate">
                    {profile?.nombreusuario || userSession?.name || 'Usuario Expenzzi'}
                  </h2>
                  <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1">
                    <AtSign className="w-3.5 h-3.5 text-indigo-300" /> {profile?.email || userSession?.email}
                  </p>
                  {profile?.biografia && (
                    <p className="text-xs text-slate-300/90 italic pt-1 max-w-lg">
                      &quot;{profile.biografia}&quot;
                    </p>
                  )}
                </div>

                {/* Quick Link to Friends Page */}
                <button
                  type="button"
                  onClick={() => (window.location.href = '/dashboard/amigos')}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0 self-stretch sm:self-auto justify-center"
                >
                  <Users className="w-4 h-4 text-emerald-400" /> Mis Amigos <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* AVATAR SELECTOR MODAL / POPUP */}
            {showAvatarSelector && (
              <ProfileAvatarSelectorModal
                avatarTab={avatarTab}
                setAvatarTab={setAvatarTab}
                fotoperfil={fotoperfil}
                uploadingImage={uploadingImage}
                customUrlInput={customUrlInput}
                setCustomUrlInput={setCustomUrlInput}
                onSelectPreset={(presetUrl) => setPendingAdjustImage(presetUrl)}
                onFileUpload={handleFileUpload}
                onApplyCustomUrl={handleApplyCustomUrl}
              />
            )}

            {/* AVATAR ADJUSTMENT / CROPPER MODAL */}
            {pendingAdjustImage && (
              <AvatarAdjustModal
                key={pendingAdjustImage}
                imageSrc={pendingAdjustImage}
                onClose={() => setPendingAdjustImage(null)}
                onConfirm={handleConfirmAdjustImage}
              />
            )}

            {/* EDIT PROFILE FORM */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" /> Información Personal
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="perfil-nombre" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nombre de Usuario *
                    </label>
                    <Input
                      id="perfil-nombre"
                      type="text"
                      required
                      value={nombreusuario}
                      onChange={(e) => setNombreusuario(e.target.value)}
                      placeholder="Tu nombre completo o apodo..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="perfil-telefono" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Teléfono de Contacto
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        id="perfil-telefono"
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+54 9 11 1234-5678"
                        className="pl-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="perfil-biografia" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Biografía / Descripción
                  </label>
                  <textarea
                    id="perfil-biografia"
                    value={biografia}
                    onChange={(e) => setBiografia(e.target.value)}
                    placeholder="Escribe algo sobre ti..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 rounded-xl"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </div>

            {/* SECURITY & PASSWORD SECTION */}
            <SecuritySectionForm
              showSecuritySection={showSecuritySection}
              setShowSecuritySection={setShowSecuritySection}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              savingPassword={savingPassword}
              onChangePassword={handleChangePassword}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function ProfileAvatarSelectorModal({
  avatarTab,
  setAvatarTab,
  fotoperfil,
  uploadingImage,
  customUrlInput,
  setCustomUrlInput,
  onSelectPreset,
  onFileUpload,
  onApplyCustomUrl,
}: {
  avatarTab: 'upload' | 'presets' | 'url';
  setAvatarTab: (tab: 'upload' | 'presets' | 'url') => void;
  fotoperfil: string;
  uploadingImage: boolean;
  customUrlInput: string;
  setCustomUrlInput: (val: string) => void;
  onSelectPreset: (url: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyCustomUrl: (e: React.FormEvent) => void;
}) {
  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-2xl animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          <Camera className="w-4 h-4 text-cyan-500" /> Seleccionar avatar
        </h3>
        <div className="flex bg-slate-100 dark:bg-slate-950/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs font-bold self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={() => setAvatarTab('presets')}
            className={`px-3 py-1.5 rounded-xl transition-all ${avatarTab === 'presets'
                ? 'bg-[#2DD4BF] text-slate-950 font-extrabold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            Personajes
          </button>
          <button
            type="button"
            onClick={() => setAvatarTab('upload')}
            className={`px-3 py-1.5 rounded-xl transition-all ${avatarTab === 'upload'
                ? 'bg-[#2DD4BF] text-slate-950 font-extrabold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            Subir imagen
          </button>
          <button
            type="button"
            onClick={() => setAvatarTab('url')}
            className={`px-3 py-1.5 rounded-xl transition-all ${avatarTab === 'url'
                ? 'bg-[#2DD4BF] text-slate-950 font-extrabold shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            URL externa
          </button>
        </div>
      </div>

      {avatarTab === 'presets' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 max-h-[360px] overflow-y-auto pr-1">
          {SIMPSONS_PRESETS.map((preset) => {
            const isSelected = fotoperfil === preset.url;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onSelectPreset(preset.url)}
                className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2.5 group cursor-pointer ${isSelected
                    ? 'border-[#2DD4BF] bg-[#2DD4BF]/10 shadow-lg shadow-[#2DD4BF]/10 scale-105'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-[#2DD4BF]/60 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
              >
                <div className={`w-14 h-14 rounded-full ${preset.bg} p-0.5 overflow-hidden flex items-center justify-center border-2 border-white/20 group-hover:scale-105 transition-transform shadow-md`}>
                  <Image
                    src={preset.url}
                    alt={preset.name}
                    width={56}
                    height={56}
                    unoptimized
                    className={preset.imgClass}
                  />
                </div>
                <span className={`text-xs font-semibold truncate w-full text-center ${isSelected ? 'text-[#2DD4BF] font-bold' : 'text-slate-700 dark:text-slate-300 group-hover:text-white'
                  }`}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {avatarTab === 'upload' && (
        <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50 dark:bg-slate-950/40">
          <Upload className="w-9 h-9 text-cyan-500 mx-auto" />
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Sube una foto desde tu dispositivo</p>
            <p className="text-[11px] text-slate-500">Formatos JPG, PNG o WebP de hasta 5MB</p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2DD4BF] hover:bg-teal-400 text-slate-950 rounded-2xl text-xs font-extrabold cursor-pointer transition-colors shadow-md">
            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            Seleccionar Archivo
            <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {avatarTab === 'url' && (
        <form onSubmit={onApplyCustomUrl} className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Input
            id="avatar-url"
            type="url"
            placeholder="https://ejemplo.com/mi-avatar.jpg"
            value={customUrlInput}
            onChange={(e) => setCustomUrlInput(e.target.value)}
            className="text-xs border-0 bg-transparent focus-visible:ring-0"
            aria-label="URL de avatar personalizado"
          />
          <Button type="submit" className="bg-[#2DD4BF] hover:bg-teal-400 text-slate-950 font-extrabold text-xs px-4 rounded-xl gap-1 shrink-0">
            <Link2 className="w-4 h-4" /> Aplicar
          </Button>
        </form>
      )}
    </div>
  );
}

function SecuritySectionForm({
  showSecuritySection,
  setShowSecuritySection,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  savingPassword,
  onChangePassword,
}: {
  showSecuritySection: boolean;
  setShowSecuritySection: (val: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  savingPassword: boolean;
  onChangePassword: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" /> Seguridad & Contraseña
          </h3>
          <p className="text-xs text-slate-500">Actualiza tu clave de acceso a Expenzzi.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSecuritySection(!showSecuritySection)}
          className="text-xs rounded-xl"
        >
          {showSecuritySection ? 'Ocultar' : 'Cambiar Contraseña'}
        </Button>
      </div>

      {showSecuritySection && (
        <form
          onSubmit={onChangePassword}
          className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200"
        >
          <div className="space-y-1.5">
            <label htmlFor="sec-current-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">Contraseña Actual *</label>
            <Input
              id="sec-current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="sec-new-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">Nueva Contraseña *</label>
              <Input
                id="sec-new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sec-confirm-password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirmar Nueva Contraseña *
              </label>
              <Input
                id="sec-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={savingPassword}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-6 rounded-xl"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
