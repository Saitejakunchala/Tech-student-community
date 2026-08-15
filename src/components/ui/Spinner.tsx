import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-teal-600', className)} />;
}

export function FullSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      {label && <p className="text-sm text-slate-500 font-medium">{label}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
    </div>
  );
}
