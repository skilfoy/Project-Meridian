'use client';
import { clsx } from 'clsx';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:   'bg-cyan-500 text-black hover:bg-cyan-400 font-semibold',
  secondary: 'border border-white/20 text-white hover:bg-white/10',
  ghost:     'text-white/70 hover:text-white hover:bg-white/5',
  danger:    'bg-red-600 text-white hover:bg-red-500',
};

const sizes = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';
