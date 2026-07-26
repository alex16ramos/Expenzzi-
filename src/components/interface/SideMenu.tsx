'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Tag,
  CreditCard,
  History,
  Trash2,
  X,
  PanelLeftClose,
  PanelRightClose,
  Users,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  role?: string;
  onOpenAudit?: () => void;
  onOpenCategories?: () => void;
  onOpenSubmethods?: () => void;
  onOpenDelete?: () => void;
  interfaceName?: string;
}

const handleSignOut = async () => {
  try {
    await authClient.signOut();
    toast.success('Sesión cerrada');
  } catch {
    // Ignore
  } finally {
    window.location.href = '/';
  }
};

export function SideMenu({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  role = 'Visualizador',
  onOpenAudit,
  onOpenCategories,
  onOpenSubmethods,
  onOpenDelete,
  interfaceName,
}: SideMenuProps) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const user = session?.data?.user;

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileFoto, setProfileFoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string>('');

  // eslint-disable-next-line react-doctor/no-fetch-in-effect
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

  const isInterfacePage = pathname?.startsWith('/interface/');
  const isAdmin = role === 'Administrador';

  const menuItems = isInterfacePage
    ? [
        {
          label: 'Volver al Dashboard',
          icon: LayoutDashboard,
          onClick: () => (window.location.href = '/dashboard'),
          variant: 'default' as const,
        },
        {
          label: 'Gestión de Categorías',
          icon: Tag,
          onClick: () => {
            if (onOpenCategories) onOpenCategories();
            onClose();
          },
          variant: 'default' as const,
        },
        {
          label: 'Métodos de Pago',
          icon: CreditCard,
          onClick: () => {
            if (onOpenSubmethods) onOpenSubmethods();
            onClose();
          },
          variant: 'default' as const,
        },
        {
          label: 'Historial & Auditoría',
          icon: History,
          onClick: () => {
            if (onOpenAudit) onOpenAudit();
            onClose();
          },
          variant: 'default' as const,
        },
        ...(isAdmin && onOpenDelete
          ? [
              {
                label: 'Eliminar Interfaz',
                icon: Trash2,
                onClick: () => {
                  onOpenDelete();
                  onClose();
                },
                variant: 'danger' as const,
              },
            ]
          : []),
      ]
    : [
        {
          label: 'Dashboard General',
          icon: LayoutDashboard,
          onClick: () => (window.location.href = '/dashboard'),
          variant: 'default' as const,
        },
        {
          label: 'Mis Amigos',
          icon: Users,
          onClick: () => (window.location.href = '/dashboard/amigos'),
          variant: 'default' as const,
        },
        {
          label: 'Mi Perfil',
          icon: User,
          onClick: () => (window.location.href = '/dashboard/perfil'),
          variant: 'default' as const,
        },
      ];

  const profileDropdown = (
    <AnimatePresence>
      {showProfileMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowProfileMenu(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowProfileMenu(false)}
            role="presentation"
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute bottom-14 left-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden"
          >
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Usuario Expenzzi'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'usuario@expenzzi.local'}</p>
            </div>

            <button
              type="button"
              onClick={() => { setShowProfileMenu(false); window.location.href = '/dashboard/perfil'; }}
              className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer"
            >
              <User className="w-4 h-4 text-purple-500" /> Mi Perfil
            </button>

            <button
              type="button"
              onClick={() => { setShowProfileMenu(false); window.location.href = '/dashboard/amigos'; }}
              className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-medium cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-500" /> Mis Amigos
            </button>

            <button
              type="button"
              onClick={() => { setShowProfileMenu(false); handleSignOut(); }}
              className="w-full px-4 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* MOBILE BACKDROP & DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <MobileSideNavDrawer
            isOpen={isOpen}
            onClose={onClose}
            isInterfacePage={isInterfacePage}
            interfaceName={interfaceName}
            menuItems={menuItems}
            profileDropdown={profileDropdown}
            showProfileMenu={showProfileMenu}
            setShowProfileMenu={setShowProfileMenu}
            profileFoto={profileFoto}
            profileName={profileName}
            user={user}
          />
        )}
      </AnimatePresence>

      {/* DESKTOP COLLAPSIBLE SIDEBAR WITH FIXED BOTTOM PROFILE CARD & DROPDOWN */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 z-20 shrink-0 p-4 transition-[width] duration-200 ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        <div>
          {/* Header with Collapse Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            {!isCollapsed && (
              <div className="min-w-0 pr-2">
                <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block">
                  {isInterfacePage ? 'Panel Operativo' : 'Navegación'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {interfaceName || 'Expenzzi'}
                </h3>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {isCollapsed ? <PanelRightClose className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDanger
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isDanger ? 'text-rose-500' : 'text-indigo-500'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* DESKTOP FIXED BOTTOM USER PROFILE CARD */}
        <div className="relative pt-4 border-t border-slate-100 dark:border-slate-800">
          {profileDropdown}
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={isCollapsed ? profileName || user?.name || 'Mi Perfil' : undefined}
            className={`w-full flex items-center gap-3 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className={`w-9 h-9 rounded-full ${getAvatarBg(profileFoto || user?.image)} font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700`}>
              {profileFoto || user?.image ? (
                <Image src={profileFoto || user?.image || ''} alt={profileName || user?.name || 'Usuario'} width={36} height={36} unoptimized className={getAvatarClass(profileFoto || user?.image)} />
              ) : (
                ((profileName || user?.name || user?.email || 'U')).slice(0, 2).toUpperCase()
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profileName || user?.name || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'usuario@expenzzi.local'}</p>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileSideNavDrawer({
  isOpen,
  onClose,
  isInterfacePage,
  interfaceName,
  menuItems,
  profileDropdown,
  showProfileMenu,
  setShowProfileMenu,
  profileFoto,
  profileName,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  isInterfacePage: boolean;
  interfaceName?: string;
  menuItems: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }[];
  profileDropdown: React.ReactNode;
  showProfileMenu: boolean;
  setShowProfileMenu: (val: boolean) => void;
  profileFoto: string | null;
  profileName: string;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
}) {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="presentation"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Mobile Drawer */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between z-10 p-5"
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
                {isInterfacePage ? 'Interfaz de Operaciones' : 'Navegación Expenzzi'}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                {interfaceName || 'Expenzzi'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDanger
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isDanger ? 'text-rose-500' : 'text-indigo-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* MOBILE BOTTOM FIXED USER PROFILE CARD WITH DROPDOWN */}
        <div className="relative pt-4 border-t border-slate-100 dark:border-slate-800">
          {profileDropdown}
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Abrir menú de perfil"
            aria-expanded={showProfileMenu}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <div
              className={`w-9 h-9 rounded-full ${getAvatarBg(profileFoto || user?.image)} font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700`}
            >
              {profileFoto || user?.image ? (
                <Image
                  src={profileFoto || user?.image || ''}
                  alt={profileName || user?.name || 'Usuario'}
                  width={36}
                  height={36}
                  unoptimized
                  className={getAvatarClass(profileFoto || user?.image)}
                />
              ) : (
                (profileName || user?.name || user?.email || 'U').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {profileName || user?.name || 'Usuario'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'usuario@expenzzi.local'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </motion.aside>
    </div>
  );
}
