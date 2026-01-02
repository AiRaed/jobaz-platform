'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X, ExternalLink } from 'lucide-react'

interface LocationSearchModalProps {
  isOpen: boolean
  onClose: () => void
  courseName: string
  externalLink?: string
  sourceType?: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other'
}

export function LocationSearchModal({
  isOpen,
  onClose,
  courseName,
  externalLink,
  sourceType = 'National Careers Service',
}: LocationSearchModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

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

  const handleOpenOfficialSearch = () => {
    // Open National Careers Service course search (official UK government website)
    window.open('https://nationalcareers.service.gov.uk/find-a-course', '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleVisitProvider = () => {
    // Open professional body or external provider
    if (externalLink) {
      window.open(externalLink, '_blank', 'noopener,noreferrer')
    }
    onClose()
  }

  const isOfficialCourse = sourceType === 'GOV.UK' || sourceType === 'National Careers Service'

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
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
        aria-labelledby="location-modal-title"
      >
        {/* Subtle violet glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 pointer-events-none" />

        {/* Content */}
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <h2
            id="location-modal-title"
            className="text-xl font-heading font-bold mb-2 text-slate-50 pr-8"
          >
            Find courses on the official website
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            To ensure accurate and up-to-date information, course searches are completed on the official UK government website.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {isOfficialCourse && (
              <button
                type="button"
                onClick={handleOpenOfficialSearch}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg text-sm font-medium',
                  'bg-gradient-to-r from-violet-600 to-fuchsia-600',
                  'text-white',
                  'hover:from-violet-500 hover:to-fuchsia-500',
                  'shadow-[0_0_18px_rgba(139,92,246,0.6)]',
                  'hover:shadow-[0_0_24px_rgba(139,92,246,0.8)]',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-950',
                  'flex items-center justify-center gap-2'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Open official course search
              </button>
            )}

            {sourceType === 'Professional Body' && externalLink && (
              <button
                type="button"
                onClick={handleVisitProvider}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg text-sm font-medium',
                  'bg-slate-800/80 text-slate-200',
                  'border border-slate-600/70',
                  'hover:bg-slate-700/80 hover:border-slate-500/70',
                  'hover:text-slate-100',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-950',
                  'flex items-center justify-center gap-2'
                )}
              >
                <ExternalLink className="w-4 h-4" />
                Visit provider
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={cn(
                'w-full px-4 py-2 rounded-lg text-sm font-medium',
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
          </div>
        </div>
      </div>
    </div>
  )
}

