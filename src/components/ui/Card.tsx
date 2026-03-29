import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Card({ glass, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border',
        glass
          ? 'bg-white/5 border-white/10 backdrop-blur-sm'
          : 'bg-[#111827] border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
