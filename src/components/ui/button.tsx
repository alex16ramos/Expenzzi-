import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95';

    const variants = {
      default:
        'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/20',
      outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900',
      ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-700',
      destructive:
        'border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700',
    };

    const sizes = {
      default: 'h-9 px-4 py-2 text-sm rounded-xl',
      sm: 'h-8 px-3 text-xs rounded-lg min-h-[36px]',
      lg: 'h-11 px-8 text-base rounded-xl',
      icon: 'h-9 w-9 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
