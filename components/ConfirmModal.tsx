'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'danger'
  confirmText?: string
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmText,
}: ConfirmModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/80 backdrop-blur-sm',
          'transition-opacity duration-300 ease-out',
          'opacity-100'
        )}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md',
          'rounded-xl border border-slate-700/60 bg-slate-950/95 backdrop-blur-xl',
          'shadow-[0_18px_50px_rgba(76,29,149,0.65)]',
          'p-6',
          'transform transition-all duration-300 ease-out',
          'opacity-100 scale-100'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        {/* Subtle violet glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />

        {/* Content */}
        <div className="relative">
          {/* Title */}
          <h2
            id="confirm-modal-title"
            className="text-xl font-heading font-bold mb-3 text-slate-50"
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="confirm-modal-message"
            className="text-sm text-slate-300 mb-6 leading-relaxed whitespace-pre-line"
          >
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-slate-800/80 text-slate-200',
                'border border-slate-600/70',
                'hover:bg-slate-700/80 hover:border-slate-500/70',
                'hover:text-slate-100',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-950'
              )}
            >
              Cancel
            </button>

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950',
                variant === 'danger'
                  ? cn(
                      'bg-red-600 text-white border border-red-500',
                      'hover:bg-red-700 hover:border-red-600',
                      'shadow-[0_0_12px_rgba(220,38,38,0.4)]',
                      'hover:shadow-[0_0_16px_rgba(220,38,38,0.6)]',
                      'focus:ring-red-500/50'
                    )
                  : cn(
                      'bg-gradient-to-r from-violet-600 to-fuchsia-600',
                      'text-white',
                      'hover:from-violet-500 hover:to-fuchsia-500',
                      'shadow-[0_0_18px_rgba(139,92,246,0.6)]',
                      'hover:shadow-[0_0_24px_rgba(139,92,246,0.8)]',
                      'focus:ring-violet-500/50'
                    )
              )}
            >
              {confirmText || (variant === 'danger' ? 'Delete my account' : 'Remove')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

