'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DeleteAccountModalProps {
  isOpen: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
  isDeleting?: boolean
}

export function DeleteAccountModal({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const confirmTextMatch = confirmText === 'DELETE'

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('')
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isDeleting, onCancel])

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
      onClick={!isDeleting ? onCancel : undefined}
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
        aria-labelledby="delete-account-modal-title"
        aria-describedby="delete-account-modal-message"
      >
        {/* Subtle violet glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />

        {/* Content */}
        <div className="relative">
          {/* Title */}
          <h2
            id="delete-account-modal-title"
            className="text-xl font-heading font-bold mb-3 text-slate-50"
          >
            Delete your account?
          </h2>

          {/* Message */}
          <p
            id="delete-account-modal-message"
            className="text-sm text-slate-300 mb-4 leading-relaxed whitespace-pre-line"
          >
            This action is permanent. All your CVs, cover letters, saved jobs, and account data will be permanently deleted.
            {'\n\n'}
            This cannot be undone.
          </p>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm font-mono',
                'bg-slate-900/80 text-slate-100',
                'border border-slate-600/70',
                'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-slate-950',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
              placeholder="DELETE"
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            {/* Cancel Button */}
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-slate-800/80 text-slate-200',
                'border border-slate-600/70',
                'hover:bg-slate-700/80 hover:border-slate-500/70',
                'hover:text-slate-100',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-950',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>

            {/* Delete Button */}
            <button
              onClick={onConfirm}
              disabled={!confirmTextMatch || isDeleting}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                confirmTextMatch && !isDeleting
                  ? cn(
                      'bg-red-600/20 text-red-400 border border-red-500/50',
                      'hover:bg-red-600/30 hover:border-red-500/70 hover:text-red-300',
                      'focus:ring-red-500/50'
                    )
                  : cn(
                      'bg-red-600/10 text-red-500/50 border border-red-500/20',
                      'cursor-not-allowed'
                    )
              )}
            >
              {isDeleting ? 'Deleting...' : 'Delete my account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

