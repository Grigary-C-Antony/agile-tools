import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'glass' | 'new'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary/15 text-primary border border-primary/25',
  secondary: 'bg-secondary/15 text-secondary border border-secondary/25',
  tertiary: 'bg-tertiary/15 text-tertiary border border-tertiary/25',
  error: 'bg-error/15 text-error border border-error/25',
  success: 'bg-green-500/15 text-green-400 border border-green-500/25',
  glass: 'glass-card text-on-surface-variant border-white/8',
  new: 'bg-gradient-to-r from-primary-container/80 to-secondary-container/80 text-white border border-white/10',
}

export function Badge({ variant = 'glass', children, dot, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-mono text-[10px] font-semibold tracking-wider uppercase',
        'px-2.5 py-1 rounded-full',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  )
}
