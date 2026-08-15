import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  photo?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export function Avatar({ name, photo, size = 'md', className }: AvatarProps) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-slate-100', sizeClasses[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold flex items-center justify-center ring-2 ring-slate-100',
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
