/**
 * JobAZ cookie consent — essential cookies always allowed;
 * Google Analytics only after explicit accept.
 */

export const COOKIE_CONSENT_KEY = 'jobaz_cookie_consent'

export const COOKIE_CONSENT_ACCEPTED = 'accepted_analytics'
export const COOKIE_CONSENT_REJECTED = 'rejected_non_essential'

export type CookieConsentValue =
  | typeof COOKIE_CONSENT_ACCEPTED
  | typeof COOKIE_CONSENT_REJECTED

export const GA_MEASUREMENT_ID = 'G-PDGHSSX1XK'

export const COOKIE_CONSENT_CHANGED_EVENT = 'jobaz-cookie-consent-changed'
export const OPEN_COOKIE_SETTINGS_EVENT = 'jobaz-open-cookie-settings'

export function isCookieConsentValue(v: unknown): v is CookieConsentValue {
  return v === COOKIE_CONSENT_ACCEPTED || v === COOKIE_CONSENT_REJECTED
}

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    return isCookieConsentValue(raw) ? raw : null
  } catch {
    return null
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === COOKIE_CONSENT_ACCEPTED
}

function emitConsentChanged(value: CookieConsentValue) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: { value } })
  )
}

export function openCookieSettings() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
}

/** Disable GA client-side and clear common analytics cookies where possible. */
export function disableGoogleAnalytics() {
  if (typeof window === 'undefined') return
  const disableKey = `ga-disable-${GA_MEASUREMENT_ID}` as const
  const w = window as Window & Record<string, unknown> & {
    gtag?: (...args: unknown[]) => void
  }
  w[disableKey] = true

  try {
    if (typeof w.gtag === 'function') {
      w.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      })
    }
  } catch {
    // ignore
  }

  clearAnalyticsCookies()
}

export function clearAnalyticsCookies() {
  if (typeof document === 'undefined') return
  const names = document.cookie.split(';').map((c) => c.split('=')[0]?.trim()).filter(Boolean)
  const host = window.location.hostname
  const rootDomain = host.split('.').slice(-2).join('.')
  const domains = ['', host, `.${host}`, `.${rootDomain}`]

  for (const name of names) {
    if (!name.startsWith('_ga') && !name.startsWith('_gid') && !name.startsWith('_gat')) continue
    for (const domain of domains) {
      const domainPart = domain ? `; domain=${domain}` : ''
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}`
    }
  }
}

export function setCookieConsent(value: CookieConsentValue) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
  } catch {
    // private mode / blocked storage — still apply runtime behaviour
  }

  if (value === COOKIE_CONSENT_ACCEPTED) {
    const disableKey = `ga-disable-${GA_MEASUREMENT_ID}`
    ;(window as Window & Record<string, unknown>)[disableKey] = false
  } else {
    disableGoogleAnalytics()
  }

  emitConsentChanged(value)
}
