import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-teal-500',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 resize-y min-h-[100px]',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-teal-500',
          className,
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const inputId = id || props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-teal-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
