import { supabase } from '@/lib/supabase'

const USERNAME_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/

export function generateSuggestedUsername(displayName: string, userId: string): string {
  const base =
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'pro'
  if (base.length >= 3) return base.slice(0, 30)
  const short = userId.replace(/-/g, '').slice(0, 6)
  return `pro-${short}`.slice(0, 30)
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export function generateBusinessSlug(businessName: string, profileId: string): string {
  const base =
    businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'business'
  const suffix = profileId.replace(/-/g, '').slice(0, 4)
  const slug = `${base}-${suffix}`.slice(0, 50).replace(/^-+|-+$/g, '')
  return SLUG_RE.test(slug) ? slug : `biz-${suffix}`
}

export function validateUsernameFormat(username: string): { ok: boolean; reason?: string } {
  const u = username.trim().toLowerCase()
  if (u.length < 3) return { ok: false, reason: 'Username must be at least 3 characters.' }
  if (u.length > 30) return { ok: false, reason: 'Username must be 30 characters or less.' }
  if (!USERNAME_RE.test(u)) {
    return { ok: false, reason: 'Use lowercase letters, numbers, and hyphens only.' }
  }
  return { ok: true }
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export async function checkUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; reason?: string }> {
  const format = validateUsernameFormat(username)
  if (!format.ok) return { available: false, reason: format.reason }

  const normalized = normalizeUsername(username)
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('username', normalized)
    .maybeSingle()

  if (error && !error.message.includes('does not exist')) {
    return { available: false, reason: error.message }
  }
  if (!data) return { available: true }
  if (excludeUserId && data.user_id === excludeUserId) return { available: true }
  return { available: false, reason: 'Username is already taken.' }
}
