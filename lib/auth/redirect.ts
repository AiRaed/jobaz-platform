import { isAdminEmail } from '@/lib/auth/adminEmails'

/** Blocks open redirects; only same-origin relative paths are allowed. */
export function sanitizeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const path = raw.trim()
  if (!path.startsWith('/') || path.startsWith('//')) return null
  if (path.includes('://') || path.includes('\\') || path.includes('\0')) return null
  return path
}

export function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/')
}

/** Whether the signed-in user may be sent to this path after login. */
export function canUseRedirectPath(path: string, email: string | null | undefined): boolean {
  if (isAdminPath(path)) return isAdminEmail(email)
  return true
}

export function resolvePostLoginPath(
  redirectTo: string | null | undefined,
  email: string | null | undefined
): string {
  const safe = sanitizeRedirectPath(redirectTo)
  if (safe && canUseRedirectPath(safe, email)) return safe
  return '/dashboard'
}

export function buildAuthLoginUrl(redirectTo?: string | null): string {
  const params = new URLSearchParams({ mode: 'login' })
  const safe = sanitizeRedirectPath(redirectTo ?? null)
  if (safe) params.set('redirectTo', safe)
  return `/auth?${params.toString()}`
}

export function buildAuthSignupUrl(redirectTo?: string | null): string {
  const params = new URLSearchParams({ mode: 'signup' })
  const safe = sanitizeRedirectPath(redirectTo ?? null)
  if (safe) params.set('redirectTo', safe)
  return `/auth?${params.toString()}`
}

/** After UK Career Assistant assessment — restore results on return. */
export const UK_CAREER_ASSISTANT_RESUME_PATH = '/uk-career-assistant?resume=1'

/** After guest registers — land on dashboard with plan already hydrated. */
export const GUEST_CAREER_DASHBOARD_PATH = '/dashboard?tab=plan&assessment=ready'

export function buildUkCareerAssistantAuthUrls(): {
  signupUrl: string
  loginUrl: string
  resumePath: string
} {
  return {
    resumePath: GUEST_CAREER_DASHBOARD_PATH,
    signupUrl: buildAuthSignupUrl(GUEST_CAREER_DASHBOARD_PATH),
    loginUrl: buildAuthLoginUrl(GUEST_CAREER_DASHBOARD_PATH),
  }
}
