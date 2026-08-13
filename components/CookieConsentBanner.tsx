'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  COOKIE_CONSENT_ACCEPTED,
  COOKIE_CONSENT_CHANGED_EVENT,
  COOKIE_CONSENT_REJECTED,
  getCookieConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  setCookieConsent,
  type CookieConsentValue,
} from '@/lib/cookieConsent'

/**
 * Fixed bottom cookie banner — essential always allowed; analytics opt-in only.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const refresh = useCallback(() => {
    const choice = getCookieConsent()
    setVisible(choice === null)
  }, [])

  useEffect(() => {
    setHydrated(true)
    refresh()
    const onOpen = () => setVisible(true)
    const onChanged = () => refresh()
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen)
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged)
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpen)
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChanged)
    }
  }, [refresh])

  const choose = (value: CookieConsentValue) => {
    setCookieConsent(value)
    setVisible(false)
  }

  if (!hydrated || !visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-0 inset-x-0 z-[90] p-3 sm:p-4 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div
        className={[
          'pointer-events-auto mx-auto max-w-3xl rounded-2xl border shadow-lg backdrop-blur-md',
          'border-slate-200 bg-white/95 text-slate-800',
          'dark:border-slate-700/70 dark:bg-slate-950/95 dark:text-slate-100',
          'px-4 py-3.5 sm:px-5 sm:py-4 max-h-[min(42vh,22rem)] overflow-y-auto',
        ].join(' ')}
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 break-words">
          We use essential cookies to make JobAZ work. With your permission, we also use analytics
          cookies to understand how JobAZ is used and improve the platform.{' '}
          <Link
            href="/privacy"
            className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-violet-300 dark:hover:text-violet-200"
          >
            Privacy Policy
          </Link>
        </p>

        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => choose(COOKIE_CONSENT_REJECTED)}
            className={[
              'inline-flex min-h-10 items-center justify-center rounded-xl border px-3.5 py-2 text-sm font-medium transition',
              'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
              'dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => choose(COOKIE_CONSENT_ACCEPTED)}
            className={[
              'inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition',
              'bg-blue-600 hover:bg-blue-500',
              'dark:bg-violet-600 dark:hover:bg-violet-500',
            ].join(' ')}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  )
}
