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
  estado?: boolean;
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
      bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      sign: '+',
    };
  }

  if (t === 'ahorro' || cat.includes('ahorro') || cat.includes('inversion') || cat.includes('banco')) {
    return {
      icon: Landmark,
      bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      sign: '',
    };
  }

  if (cat.includes('super') || cat.includes('comida') || cat.includes('alimento')) {
    return { icon: ShoppingCart, bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30', text: 'text-rose-600 dark:text-rose-400', sign: '-' };
  }
  if (cat.includes('transp') || cat.includes('auto') || cat.includes('nafta') || cat.includes('combust')) {
    return { icon: Car, bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30', text: 'text-rose-600 dark:text-rose-400', sign: '-' };
  }
  if (cat.includes('servici') || cat.includes('luz') || cat.includes('internet') || cat.includes('gas')) {
    return { icon: Wifi, bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30', text: 'text-rose-600 dark:text-rose-400', sign: '-' };
  }
  if (cat.includes('salud') || cat.includes('farmac') || cat.includes('medic')) {
    return { icon: HeartPulse, bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30', text: 'text-rose-600 dark:text-rose-400', sign: '-' };
  }
  if (cat.includes('entreten') || cat.includes('salida') || cat.includes('cine') || cat.includes('juego')) {
    return { icon: Film, bg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30', text: 'text-rose-600 dark:text-rose-400', sign: '-' };
  }

  return {
    icon: ArrowUpRight,
    bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
    text: 'text-rose-600 dark:text-rose-400',
    sign: '-',
  };
}
