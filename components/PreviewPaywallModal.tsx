'use client'

import { LAUNCH_PRICE_GBP, detectFunnelLanguage } from '@/lib/funnelConfig'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PreviewPaywallModalProps {
  isOpen: boolean
  variant: 'preview-ended' | 'access-expired'
}

export function PreviewPaywallModal({ isOpen, variant }: PreviewPaywallModalProps) {
  const [lang, setLang] = useState<'en' | 'ar'>('en')

  useEffect(() => {
    setLang(detectFunnelLanguage())
  }, [])

  useEffect(() => {
    // Event is emitted from the builder page when the paywall is shown
  }, [isOpen, variant])

  if (!isOpen) return null

  const isRtl = lang === 'ar'

  const handleDonateClick = () => {
    window.open('https://buymeacoffee.com/jobaz.support', '_blank', 'noopener,noreferrer')
  }

  // New content as per requirements
  const title = 'Your AI-enhanced writing is ready'
  const bullets = [
    'ATS-friendly PDF/DOCX',
    'Save your edits anytime',
    'Instant unlock for 24 hours — one-time payment, no subscription',
  ]
  const buttonText = `Support JobAZ — Keep it free for everyone`
  const trustLine = 'Donations help keep JobAZ free for everyone'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 md:px-0">
      {/* Transparent overlay to block interaction but keep scroll */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto" />

      {/* Modal */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(
          'relative z-10 w-full md:w-[80%] h-[66vh]',
          'bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-violet-200 dark:border-violet-800',
          'p-8 md:p-10 flex flex-col justify-center'
        )}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-[1.44rem] md:text-[1.73rem] font-heading font-bold mb-8 text-gray-900 dark:text-gray-50 text-center">
          {title}
        </h2>

        <ul className="space-y-2 mb-6 text-base text-gray-700 dark:text-gray-200">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <a
          href="https://buymeacoffee.com/jobaz.support"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDonateClick}
          className="w-full inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-[1.15rem] md:text-[1.15rem] shadow-lg hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-accent"
        >
          {buttonText}
        </a>

        <p className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
          {trustLine}
        </p>
      </div>
    </div>
  )
}


