'use client'

import { type ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className={cn(
          'relative w-full glass-modal rounded-2xl overflow-hidden',
          'animate-fade-in',
          sizeStyles[size],
          className
        )}
      >
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-container via-secondary-container to-transparent opacity-60" />

        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-headline text-on-surface">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-on-surface-variant mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
