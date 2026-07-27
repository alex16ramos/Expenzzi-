import { cn } from '@/lib/utils';

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className = '',
}: {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
} = {}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95';

  const variants = {
    default: 'bg-violet-600 text-white hover:bg-violet-500 shadow-md shadow-violet-600/25',
    outline: 'border border-slate-800 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white',
    ghost: 'hover:bg-slate-800/80 text-slate-300 hover:text-white',
    destructive: 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300',
  };

  const sizes = {
    default: 'h-9 px-4 py-2 text-sm rounded-xl',
    sm: 'h-8 px-3 text-xs rounded-lg min-h-[36px]',
    lg: 'h-11 px-8 text-base rounded-xl',
    icon: 'h-9 w-9 rounded-xl',
  };

  return cn(baseStyles, variants[variant], sizes[size], className);
}
