'use client'

import { Sparkles, CreditCard, Lock } from 'lucide-react'
import { Button } from '@/components/button'
import { LAUNCH_PRICE_GBP } from '@/lib/funnelConfig'
import { useState } from 'react'

interface PreviewBlurOverlayProps {
  onUnlock: () => void
  showButton?: boolean
}

export function PreviewBlurOverlay({ onUnlock, showButton = false }: PreviewBlurOverlayProps) {
  const priceLabel = `£${LAUNCH_PRICE_GBP.toFixed(2)}`

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open('https://buymeacoffee.com/jobaz.support', '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center bg-transparent rounded-lg z-20 pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-label="Free preview ended. Unlock AI access."
      tabIndex={-1}
    >
      {showButton && (
        <div className="text-center p-6 space-y-4 max-w-sm mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Free preview ended</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-xs mb-4">
            Unlock AI for 24h — {priceLabel}
          </p>
          <div className="space-y-2">
            <a
              href="https://buymeacoffee.com/jobaz.support"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDonateClick}
              className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm shadow-lg hover:scale-105 transition-all pointer-events-auto"
              aria-label="Support JobAZ — Keep it free for everyone"
            >
              <Lock className="w-4 h-4 mr-2" />
              Support JobAZ — Keep it free
            </a>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Donations help keep JobAZ free for everyone
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

