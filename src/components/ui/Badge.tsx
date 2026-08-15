import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'teal' | 'amber' | 'red' | 'green' | 'blue' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  slate: 'bg-slate-800 text-white',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
