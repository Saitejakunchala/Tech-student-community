import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-slate-200/80 shadow-sm',
        hover && 'transition-all duration-300 hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5 border-b border-slate-100', className)}>{children}</div>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn('font-bold text-slate-900 text-lg', className)}>{children}</h3>;
}
