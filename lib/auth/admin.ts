import { isAdminUser } from '@/lib/auth/adminEmails'
import { buildAuthLoginUrl } from '@/lib/auth/redirect'
import { APP_HOME_HREF } from '@/lib/navigation/appHome'
import { createServerComponentClient } from '@/lib/supabase-server'
import type { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export { getAdminEmails, isAdminEmail, isAdminUser, BUILTIN_ADMIN_EMAILS } from '@/lib/auth/adminEmails'

export type AdminSessionResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' }

/**
 * Resolves the Supabase session and checks the user against the admin email allowlist.
 */
export async function getAdminSession(): Promise<AdminSessionResult> {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, reason: 'unauthenticated' }
  }

  if (!isAdminUser(user.email)) {
    return { ok: false, reason: 'forbidden' }
  }

  return { ok: true, user }
}

/**
 * Server-only guard for admin pages. Redirects before rendering children.
 */
export async function requireAdmin(returnPath = '/admin'): Promise<User> {
  const session = await getAdminSession()

  if (!session.ok) {
    if (session.reason === 'unauthenticated') {
      redirect(buildAuthLoginUrl(returnPath))
    }
    redirect(APP_HOME_HREF)
  }

  return session.user
}
