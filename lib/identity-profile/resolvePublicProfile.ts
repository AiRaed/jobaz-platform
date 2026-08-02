import { supabase } from '@/lib/supabase'
import { normalizeUsername } from './username'
import { loadIdentityProfileBundleForUser } from './profileService'
import { IDENTITY_PHASE1_PRIVATE_ONLY } from './phase1'
import type { IdentityProfileBundle } from './types'

const PHASE1_BLOCKED = {
  bundle: null as IdentityProfileBundle | null,
  error: 'Public career profiles open later. Identity is private in Phase 1.',
}

export async function loadProfileByUsername(
  username: string
): Promise<{ bundle: IdentityProfileBundle | null; error: string | null }> {
  if (IDENTITY_PHASE1_PRIVATE_ONLY) return { ...PHASE1_BLOCKED }

  const normalized = normalizeUsername(username)
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', normalized)
    .maybeSingle()

  if (error || !data?.user_id) {
    return { bundle: null, error: error?.message ?? 'Identity not found' }
  }

  const result = await loadIdentityProfileBundleForUser(data.user_id, false)
  return { bundle: result.bundle, error: result.error }
}

export async function loadProfileByBusinessSlug(
  slug: string
): Promise<{ bundle: IdentityProfileBundle | null; error: string | null }> {
  if (IDENTITY_PHASE1_PRIVATE_ONLY) return { ...PHASE1_BLOCKED }

  const normalized = slug.trim().toLowerCase()

  const { data: biz } = await supabase
    .from('business_profiles')
    .select('profile_id')
    .eq('business_slug', normalized)
    .maybeSingle()

  let userId: string | null = null

  if (biz?.profile_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', biz.profile_id)
      .maybeSingle()
    userId = prof?.user_id ?? null
  }

  if (!userId) {
    const { data: byUsername } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', normalized)
      .eq('profile_type', 'business')
      .maybeSingle()
    userId = byUsername?.user_id ?? null
  }

  if (!userId) return { bundle: null, error: 'Business identity not found' }

  const result = await loadIdentityProfileBundleForUser(userId, false)
  return { bundle: result.bundle, error: result.error }
}
