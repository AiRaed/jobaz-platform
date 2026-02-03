'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaywallOverlayProps {
  onUnlock?: () => void
}

export function PaywallOverlay({ onUnlock }: PaywallOverlayProps) {
  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onUnlock) {
      onUnlock()
    } else {
      window.open('https://buymeacoffee.com/jobaz.support', '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/80 backdrop-blur-sm',
        'pointer-events-auto'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Practice trial limit reached. Unlock to continue."
    >
      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4',
          'bg-white dark:bg-gray-900 rounded-2xl shadow-xl',
          'border border-violet-200 dark:border-violet-800',
          'p-8 md:p-10 flex flex-col items-center'
        )}
      >
        <Lock className="w-12 h-12 text-violet-500 mb-4" />
        
        <h2 className="text-2xl font-heading font-bold mb-4 text-gray-900 dark:text-gray-50 text-center">
          Practice Trial Complete
        </h2>
        
        <p className="text-base text-gray-700 dark:text-gray-200 mb-6 text-center">
          You've used your 15 free practice questions. Unlock unlimited practice to continue improving your interview skills.
        </p>

        <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300 w-full">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 flex-shrink-0" />
            <span>Unlimited practice questions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 flex-shrink-0" />
            <span>Full access to all interview training modes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500 flex-shrink-0" />
            <span>24-hour access after payment</span>
          </li>
        </ul>

        <a
          href="https://buymeacoffee.com/jobaz.support"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDonateClick}
          className={cn(
            'w-full inline-flex items-center justify-center',
            'px-4 py-3 rounded-2xl',
            'bg-gradient-to-r from-violet-500 to-fuchsia-500',
            'text-white font-semibold text-lg',
            'shadow-lg hover:scale-105 transition-all',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-offset-2 focus-visible:ring-violet-accent'
          )}
        >
          Unlock Now — £1.99
        </a>

        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Donations help keep JobAZ free for everyone
        </p>
      </div>
    </div>
  )
}

