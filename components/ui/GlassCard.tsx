import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  topGradient?: boolean
  neonAccent?: 'purple' | 'orange' | 'yellow' | 'none'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const neonStyles = {
  none: '',
  purple: 'shadow-[0_0_30px_rgba(114,60,235,0.08)] hover:shadow-[0_0_40px_rgba(114,60,235,0.15)]',
  orange: 'shadow-[0_0_30px_rgba(220,117,14,0.08)] hover:shadow-[0_0_40px_rgba(220,117,14,0.15)]',
  yellow: 'shadow-[0_0_30px_rgba(205,205,0,0.06)] hover:shadow-[0_0_40px_rgba(205,205,0,0.12)]',
}

export function GlassCard({
  children,
  hover = false,
  topGradient = false,
  neonAccent = 'none',
  padding = 'md',
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl relative overflow-hidden',
        hover && 'glass-card-hover cursor-pointer',
        topGradient && 'top-border-gradient',
        neonStyles[neonAccent],
        paddingStyles[padding],
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ——— Convenience sub-components ———

export function GlassCardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)} {...props}>
      {children}
    </div>
  )
}

export function GlassCardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-display text-lg font-bold text-on-surface', className)} {...props}>
      {children}
    </h3>
  )
}
