'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'gradient-brand text-white font-semibold',
    'hover:opacity-90 hover:shadow-[0_0_24px_rgba(114,60,235,0.4)]',
    'active:scale-[0.97]',
  ].join(' '),
  secondary: [
    'glass-card text-on-surface font-medium',
    'border border-white/10',
    'hover:bg-white/10 hover:border-white/20',
    'active:scale-[0.97]',
  ].join(' '),
  ghost: [
    'text-on-surface-variant font-medium',
    'hover:text-on-surface hover:bg-white/5',
    'active:scale-[0.97]',
  ].join(' '),
  danger: [
    'text-error border border-error/20 bg-error/5 font-medium',
    'hover:bg-error/15 hover:border-error/40',
    'active:scale-[0.97]',
  ].join(' '),
  glass: [
    'glass-card text-on-surface font-medium border border-white/8',
    'hover:border-white/15 hover:bg-white/8',
    'active:scale-[0.97]',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200',
        'font-body disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">{icon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
