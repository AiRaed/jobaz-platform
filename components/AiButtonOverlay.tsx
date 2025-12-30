'use client'

import { Sparkles, CreditCard } from 'lucide-react'
import { Button } from '@/components/button'
import { useState, useEffect } from 'react'
import { canUseAI } from '@/utils/access'

interface AiButtonOverlayProps {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  previewActive?: boolean
}

export function AiButtonOverlay({ children, disabled, onClick, previewActive }: AiButtonOverlayProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by deferring browser-specific checks
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use canUseAI() as single source of truth
  // Only show overlay if AI cannot be used (no access and no active preview) and mounted to prevent hydration issues
  // During active preview, we hide legacy pay overlay in favor of the top sticky CTA
  const canUse = mounted && canUseAI()
  const shouldBlock = mounted && disabled && !canUse && !previewActive
  const shouldAllowClick = canUse

  return (
    <div className="relative group">
      <div className={shouldBlock ? 'opacity-60 pointer-events-none' : ''}>
        {children}
      </div>
      {shouldBlock && (
        <div className="absolute inset-0 flex items-center justify-end pr-3 py-2 z-10 pointer-events-none">
          <div
            className="inline-flex items-center gap-1 rounded-full bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 shadow-sm pointer-events-auto"
            title="AI features locked"
          >
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span className="whitespace-nowrap">Locked — use top button</span>
          </div>
        </div>
      )}
    </div>
  )
}

