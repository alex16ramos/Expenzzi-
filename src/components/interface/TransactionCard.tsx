'use client';

import React from 'react';
import {
  ShoppingCart,
  Car,
  Wifi,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  HeartPulse,
  Film,
  LucideIcon,
} from 'lucide-react';

export interface Transaction {
  id: string | number;
  date: string;
  user: string;
  avatar?: string | null;
  initials: string;
  amount: number;
  currency: 'ARS' | 'USD' | 'UYU' | string;
  ars: string;
  usd: string;
  uyu?: string;
  comment: string;
  method: string;
  category?: string;
  type?: 'Gasto' | 'Ingreso' | 'Ahorro' | string;
  rawItem?: Record<string, unknown>;
}

export function getCategoryIconAndStyle(categoryName?: string | null, type?: string): {
  icon: LucideIcon;
  bg: string;
  text: string;
  sign: string;
} {
  const cat = (categoryName || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (t === 'ingreso' || cat.includes('ingreso') || cat.includes('cobro') || cat.includes('sueldo')) {
    return {
      icon: ArrowDownLeft,
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400',
      sign: '+',
    };
  }

  if (t === 'ahorro' || cat.includes('ahorro') || cat.includes('invers')) {
    return {
      icon: Landmark,
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400',
      sign: '',
    };
  }

  if (cat.includes('super') || cat.includes('alimento') || cat.includes('comida') || cat.includes('coto')) {
    return {
      icon: ShoppingCart,
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      text: 'text-rose-600 dark:text-rose-400',
      sign: '-',
    };
  }

  if (cat.includes('transp') || cat.includes('auto') || cat.includes('nafta') || cat.includes('combust') || cat.includes('ypf')) {
    return {
      icon: Car,
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      text: 'text-rose-600 dark:text-rose-400',
      sign: '-',
    };
  }

  if (cat.includes('servic') || cat.includes('net') || cat.includes('wifi') || cat.includes('telecom') || cat.includes('luz')) {
    return {
      icon: Wifi,
      bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      text: 'text-rose-600 dark:text-rose-400',
      sign: '-',
    };
  }

  if (cat.includes('salud') || cat.includes('farmac') || cat.includes('med')) {
    return {
      icon: HeartPulse,
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      text: 'text-rose-600 dark:text-rose-400',
      sign: '-',
    };
  }

  if (cat.includes('entreten') || cat.includes('cine') || cat.includes('juego')) {
    return {
      icon: Film,
      bg: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
      text: 'text-rose-600 dark:text-rose-400',
      sign: '-',
    };
  }

  return {
    icon: ArrowUpRight,
    bg: 'bg-slate-800 border-slate-700/60 text-slate-300',
    text: 'text-rose-600 dark:text-rose-400',
    sign: '-',
  };
}

interface TransactionCardProps {
  transaction: Transaction;
  onSelect: (tx: Transaction) => void;
}

export function TransactionCard({ transaction: tx, onSelect }: TransactionCardProps) {
  const { icon: Icon, bg, text, sign } = getCategoryIconAndStyle(
    tx.category || tx.comment,
    tx.type
  );

  const title = tx.comment || tx.category || `Movimiento #${tx.id}`;
  const subtitle = `${tx.date} • ${tx.category || tx.method || 'General'}`;

  return (
    <div
      onClick={() => onSelect(tx)}
      className="p-3.5 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${bg} border flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className={`text-xs font-extrabold ${text}`}>
          {sign}$ {tx.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
          {tx.currency}
        </span>
      </div>
    </div>
  );
}
