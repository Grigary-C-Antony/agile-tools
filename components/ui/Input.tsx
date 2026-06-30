'use client'

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: string
  iconPosition?: 'left' | 'right'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label-caps text-on-surface-variant/60">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'glass-input w-full rounded-xl px-4 py-3 text-sm text-on-surface',
            'placeholder:text-on-surface-variant/35 font-body',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-error/50 focus:border-error/70',
            className
          )}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px] pointer-events-none">
            {icon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-error font-body">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant/50 font-body">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'

// ——— Textarea variant ———

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, hint, className, id, ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label-caps text-on-surface-variant/60">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'glass-input w-full rounded-xl px-4 py-3 text-sm text-on-surface',
          'placeholder:text-on-surface-variant/35 font-body resize-none',
          error && 'border-error/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error font-body">{error}</p>}
      {hint && !error && <p className="text-xs text-on-surface-variant/50 font-body">{hint}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'
