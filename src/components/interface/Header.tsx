'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, ArrowLeft, Users, Shield } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '../ThemeToggle';
import { authClient } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';

export interface HeaderMember {
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
  rol?: string;
}

interface HeaderProps {
  interfaceName?: string | null;
  userRole?: string;
  onMenuClick?: () => void;
  onBackClick?: () => void;
  onNotificationHandled?: () => void;
  interfaceId?: string | number | null;
  members?: HeaderMember[];
  userAvatar?: string | null;
  userName?: string | null;
}

export function Header({
  interfaceName,
  userRole,
  onMenuClick,
  onBackClick,
  onNotificationHandled,
  interfaceId,
  members = [],
  userAvatar,
  userName,
}: HeaderProps) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const currentUser = session?.data?.user;

  const [showMembersDropdown, setShowMembersDropdown] = useState(false);
  const [profileFoto, setProfileFoto] = useState<string | null>(userAvatar || null);
  const [profileName, setProfileName] = useState<string>(userName || '');
  const canPopHistoryRef = useRef(false);

  const isInterfacePage = pathname?.startsWith('/interface/');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      canPopHistoryRef.current = true;
    }
  }, []);

  // Fetch real profile photo from public.usuario (Simpson avatar / custom upload)
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/perfil');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && data.user) {
          if (data.user.fotoperfil) setProfileFoto(data.user.fotoperfil);
          if (data.user.nombreusuario) setProfileName(data.user.nombreusuario);
        }
      } catch {
        // Ignore
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else if (typeof window !== 'undefined' && canPopHistoryRef.current && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = '/dashboard';
    }
  };

  const displayName = profileName || userName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Usuario';
  const displayFoto = profileFoto || userAvatar || currentUser?.image || null;

  // Fallback member list
  const displayMembers: HeaderMember[] = useMemo(() => {
    return members.length > 0
      ? members
      : [
          {
            idusuario: currentUser?.id || '1',
            nombreusuario: displayName,
            email: currentUser?.email || 'usuario@expenzzi.local',
            fotoperfil: displayFoto,
            rol: userRole || 'Visualizador',
          },
        ];
  }, [members, currentUser, displayName, displayFoto, userRole]);

  return (
    <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden block p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Abrir menú de navegación"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="p-2 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          title="Volver a la ubicación anterior"
          aria-label="Volver a la ubicación anterior"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 pl-1 border-l border-slate-200 dark:border-slate-800 sm:border-l-0 sm:pl-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[180px] sm:max-w-xs">
            {interfaceName || 'Expenzzi'}
          </h1>
          {isInterfacePage && userRole && (
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold block uppercase tracking-wider">
              {userRole}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell
          interfaceId={interfaceId}
          interfaceName={interfaceName || undefined}
          onNotificationHandled={onNotificationHandled}
        />

        <ThemeToggle variant="compact" />

        {/* COLLABORATORS AVATAR STACK (ONLY ON OPERATIONAL INTERFACE) OR SINGLE USER AVATAR */}
        <div className="relative">
          {isInterfacePage ? (
            <button
              type="button"
              onClick={() => setShowMembersDropdown(!showMembersDropdown)}
              className="flex items-center -space-x-2 overflow-hidden p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer focus:outline-none"
              aria-label="Ver integrantes de la interfaz"
              title="Integrantes de la interfaz"
            >
              {displayMembers.slice(0, 3).map((m) => (
                <div
                  key={m.idusuario || m.email || m.nombreusuario}
                  className={`w-8 h-8 rounded-full ${getAvatarBg(m.fotoperfil)} border-2 border-white dark:border-slate-950 p-0.5 overflow-hidden flex items-center justify-center font-bold text-[10px] shrink-0`}
                >
                  {m.fotoperfil ? (
                    <Image src={m.fotoperfil} alt={m.nombreusuario} width={32} height={32} unoptimized className={getAvatarClass(m.fotoperfil)} />
                  ) : (
                    (m.nombreusuario || 'U').slice(0, 2).toUpperCase()
                  )}
                </div>
              ))}
              {displayMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-950 shrink-0">
                  +{displayMembers.length - 3}
                </div>
              )}
            </button>
          ) : (
            <div className={`w-8 h-8 rounded-full ${getAvatarBg(displayFoto)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm`}>
              {displayFoto ? (
                <Image src={displayFoto} alt={displayName} width={32} height={32} unoptimized className={getAvatarClass(displayFoto)} />
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          )}

          <AnimatePresence>
            {isInterfacePage && showMembersDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMembersDropdown(false)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowMembersDropdown(false)}
                    role="presentation"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-3 z-50 overflow-hidden space-y-2"
                  >
                    <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-500" /> Integrantes ({displayMembers.length})
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto px-2 space-y-1">
                      {displayMembers.map((member) => (
                        <div
                          key={member.idusuario}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-full ${getAvatarBg(member.fotoperfil)} font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0`}>
                              {member.fotoperfil ? (
                                <Image src={member.fotoperfil} alt={member.nombreusuario} width={32} height={32} unoptimized className={getAvatarClass(member.fotoperfil)} />
                              ) : (
                                (member.nombreusuario || 'U').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {member.nombreusuario}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">{member.email}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/40 shrink-0 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {member.rol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
      </div>
    </header>
  );
}
