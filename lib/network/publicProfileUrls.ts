import type { DbBusinessProfile, DbProfile } from '@/lib/identity-profile/types'

export function personalProfilePath(username: string | null, userId: string): string {
  if (username) return `/u/${encodeURIComponent(username)}`
  return `/profile/${userId}`
}

export function businessProfilePath(
  business: Pick<DbBusinessProfile, 'business_slug'> | null,
  username: string | null,
  userId: string
): string {
  const slug = business?.business_slug
  if (slug) return `/business/${encodeURIComponent(slug)}`
  if (username) return `/business/${encodeURIComponent(username)}`
  return `/profile/${userId}`
}

export function publicProfilePath(profile: DbProfile, business?: DbBusinessProfile | null): string {
  if (profile.profile_type === 'business') {
    return businessProfilePath(business ?? null, profile.username, profile.user_id)
  }
  return personalProfilePath(profile.username, profile.user_id)
}

export function absolutePublicProfileUrl(profile: DbProfile, business?: DbBusinessProfile | null): string {
  const path = publicProfilePath(profile, business)
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`
  return path
}
