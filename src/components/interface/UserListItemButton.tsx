'use client';

import React from 'react';
import Image from 'next/image';
import { Check, UserCheck } from 'lucide-react';
import { getAvatarBg, getAvatarClass } from '@/lib/avatar-utils';

export interface FriendItem {
  idusuario: string;
  nombreusuario: string;
  email: string;
  fotoperfil: string | null;
}

export function UserListItemButton({
  user,
  isSelected,
  onSelect,
  showQuickIcon,
}: {
  user: FriendItem;
  isSelected: boolean;
  onSelect: () => void;
  showQuickIcon?: boolean;
}) {
  const initials = user.nombreusuario.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
        isSelected
          ? 'bg-violet-500/15 text-violet-900 dark:text-violet-200 font-medium'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-full ${getAvatarBg(user.fotoperfil)} border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0`}
        >
          {user.fotoperfil ? (
            <Image
              src={user.fotoperfil}
              alt={user.nombreusuario}
              width={32}
              height={32}
              unoptimized
              className={getAvatarClass(user.fotoperfil)}
            />
          ) : (
            <span className="text-violet-600 dark:text-violet-400 text-[11px] font-bold">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-semibold block truncate text-slate-900 dark:text-white">
            {user.nombreusuario}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">{user.email}</span>
        </div>
      </div>
      {isSelected ? (
        <Check className="w-4 h-4 text-violet-500 shrink-0" />
      ) : showQuickIcon ? (
        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      ) : null}
    </button>
  );
}
