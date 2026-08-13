/**
 * Server helpers to resolve WIE knowledge-engine flag for pages/APIs.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { isAdminUser } from '@/lib/auth/adminEmails'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
  WIE_ADMIN_OVERRIDE_QUERY,
} from './feature-flag'

export async function getOptionalAuthUserEmail(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          /* no-op in read contexts */
        },
      },
    })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.email ?? null
  } catch {
    return null
  }
}

export async function resolveWieKnowledgeEngineForRequest(opts?: {
  searchParams?: Record<string, string | string[] | undefined>
}): Promise<{ enabled: boolean; isAdmin: boolean }> {
  const email = await getOptionalAuthUserEmail()
  const isAdmin = isAdminUser(email)
  const cookieStore = await cookies()
  const cookieOverride = cookieStore.get(WIE_ADMIN_OVERRIDE_COOKIE)?.value ?? null

  const rawQ = opts?.searchParams?.[WIE_ADMIN_OVERRIDE_QUERY]
  const queryOverride = Array.isArray(rawQ) ? rawQ[0] : rawQ ?? null

  const enabled = resolveWieKnowledgeEngineEnabled({
    isAdmin,
    queryOverride,
    cookieOverride,
  })

  return { enabled, isAdmin }
}
