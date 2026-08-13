'use client'

import { OPEN_COOKIE_SETTINGS_EVENT } from '@/lib/cookieConsent'

/** Footer / settings control to reopen the cookie consent banner. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
        }
      }}
      className={
        className || 'hover:text-violet-600 dark:hover:text-violet-300 transition-colors'
      }
    >
      Cookie settings
    </button>
  )
}
