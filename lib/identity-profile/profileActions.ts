import { supabase } from '@/lib/supabase'
import {
  recordProfileShareForUser,
  recordProfileViewForUser,
} from '@/lib/network/connectionsService'
import { absolutePublicProfileUrl } from '@/lib/network/publicProfileUrls'
import type { DbBusinessProfile, DbProfile } from './types'

export function getPublicProfileUrl(
  profile: DbProfile,
  business?: DbBusinessProfile | null
): string {
  return absolutePublicProfileUrl(profile, business)
}

/** @deprecated use getPublicProfileUrl with profile row */
export function getPublicProfileUrlByUserId(userId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/profile/${userId}`
  }
  return `/profile/${userId}`
}

export async function recordProfileView(profileUserId: string, viewerId: string | null) {
  await recordProfileViewForUser(profileUserId, viewerId)
}

export async function recordProfileShare(profileUserId: string, sharedBy: string | null) {
  await recordProfileShareForUser(profileUserId, sharedBy)
}

export async function copyProfileLink(
  profile: DbProfile,
  business?: DbBusinessProfile | null,
  sharedBy?: string | null
): Promise<void> {
  const url = getPublicProfileUrl(profile, business)
  if (typeof navigator === 'undefined') return
  await navigator.clipboard.writeText(url)
  if (sharedBy) void recordProfileShare(profile.user_id, sharedBy)
}

export async function fetchProfileForShare(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*, business_profiles(*)')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data) return null
  const biz = data.business_profiles as DbBusinessProfile | DbBusinessProfile[] | null
  const business = Array.isArray(biz) ? biz[0] : biz
  return { profile: data as DbProfile, business: business ?? null }
}
