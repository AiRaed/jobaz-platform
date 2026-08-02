/**
 * Identity Profile service — Supabase-backed professional + business profiles
 */

import { supabase } from '@/lib/supabase'
import {
  countBusinessFollowers,
  countConnections,
  getWeeklyProfileViewCount,
} from '@/lib/network/connectionsService'
import { computeProfileCompletion } from './completion'
import {
  generateSuggestedUsername,
  generateBusinessSlug,
  normalizeUsername,
  validateUsernameFormat,
  checkUsernameAvailable,
} from './username'
import type {
  DbBusinessProfile,
  DbPersonalProfile,
  DbProfile,
  DbProfileEducation,
  DbProfileExperience,
  DbProfileMedia,
  DbProfileSkill,
  IdentityProfileBundle,
  ProfileSocialStats,
  ProfileType,
  ProfileVisibility,
} from './types'

export function isProfileTableMissing(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('could not find the table') || (m.includes('relation') && m.includes('does not exist'))
}

function parseSkills(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string')
  return []
}

function parseServices(raw: unknown): string[] {
  return parseSkills(raw)
}

export async function getAuthUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function loadProfileSocialStats(
  userId: string,
  profileId?: string,
  profileType: ProfileType = 'personal'
): Promise<ProfileSocialStats> {
  const [connections, following, posts, weeklyProfileViews] = await Promise.all([
    countConnections(userId),
    supabase.from('feed_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('feed_posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    getWeeklyProfileViewCount(userId),
  ])

  let followersCount = connections
  if (profileType === 'business' && profileId) {
    followersCount = await countBusinessFollowers(profileId)
  }

  const followingCount = following.count ?? 0
  const pulsePostsCount = posts.count ?? 0

  return {
    followersCount,
    followingCount,
    friendsCount: connections,
    connectionsCount: connections,
    pulsePostsCount,
    opportunitiesCount: pulsePostsCount,
    projectsCount: 0,
    weeklyProfileViews,
  }
}

export async function ensureIdentityProfile(userId: string, hints?: {
  displayName?: string
  email?: string
}): Promise<DbProfile | null> {
  const { data: existing } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (existing) return existing as DbProfile

  const displayName =
    hints?.displayName ?? hints?.email?.split('@')[0] ?? 'JobAZ Member'
  const username = generateSuggestedUsername(displayName, userId)

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      profile_type: 'personal',
      username,
      headline: 'Building my UK career identity',
      location: 'United Kingdom',
      visibility: 'private',
    })
    .select('*')
    .single()

  if (error) {
    console.error('[identity-profile] ensure', error.message)
    return null
  }

  await supabase.from('personal_profiles').insert({ profile_id: profile.id })
  await supabase.from('business_profiles').insert({
    profile_id: profile.id,
    services: [],
    opening_hours: {},
    contact_methods: [],
    business_slug: generateBusinessSlug('My Business', profile.id),
  })

  await syncFeedProfile(userId, profile as DbProfile)

  return profile as DbProfile
}

async function syncFeedProfile(userId: string, profile: DbProfile) {
  const { data: authUser } = await supabase.auth.getUser()
  const metaName =
    authUser.user?.user_metadata?.full_name ??
    authUser.user?.user_metadata?.name ??
    authUser.user?.email?.split('@')[0]
  await supabase.from('feed_profiles').upsert({
    id: userId,
    display_name: metaName ?? profile.username ?? 'Member',
    avatar_url: profile.avatar_url,
    career_path:
      profile.profile_type === 'business'
        ? profile.headline ?? 'Business'
        : profile.headline ?? 'Career explorer',
    career_score: profile.trust_score,
    updated_at: new Date().toISOString(),
  })
}

export async function loadIdentityProfileBundle(
  userId: string,
  hasCv = false
): Promise<{ bundle: IdentityProfileBundle | null; tableMissing: boolean; error: string | null }> {
  let profile = await ensureIdentityProfile(userId)
  if (!profile) {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error && isProfileTableMissing(error.message)) {
      return { bundle: null, tableMissing: true, error: error.message }
    }
    return { bundle: null, tableMissing: false, error: 'Could not load profile' }
  }

  const profileId = profile.id

  const [personalRes, businessRes, expRes, eduRes, skillsRes, mediaRes, stats] = await Promise.all([
    supabase.from('personal_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
    supabase.from('profile_experience').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('profile_education').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('profile_skills').select('*').eq('profile_id', profileId).order('strength_score', { ascending: false }),
    supabase.from('profile_media').select('*').eq('profile_id', profileId).order('sort_order'),
    loadProfileSocialStats(userId, profileId, profile.profile_type as ProfileType),
  ])

  profile = {
    ...(profile as DbProfile),
    skills: parseSkills(profile.skills),
  }

  const business = businessRes.data as DbBusinessProfile | null
  const bundle: IdentityProfileBundle = {
    profile: profile as DbProfile,
    personal: personalRes.data as DbPersonalProfile | null,
    business: business
      ? {
          ...business,
          services: parseServices(business.services),
          opening_hours: (business.opening_hours as Record<string, string>) ?? {},
          contact_methods: parseServices(business.contact_methods),
        }
      : null,
    experience: (expRes.data ?? []) as DbProfileExperience[],
    education: (eduRes.data ?? []) as DbProfileEducation[],
    profileSkills: (skillsRes.data ?? []) as DbProfileSkill[],
    media: (mediaRes.data ?? []) as DbProfileMedia[],
    stats,
    completion: { percentage: 0, items: [], nextStep: '' },
  }

  bundle.completion = computeProfileCompletion(bundle, hasCv)

  return { bundle, tableMissing: false, error: null }
}

export async function loadIdentityProfileBundleForUser(
  targetUserId: string,
  hasCv = false
): Promise<{ bundle: IdentityProfileBundle | null; tableMissing: boolean; error: string | null }> {
  const { data: row, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (error) {
    if (isProfileTableMissing(error.message)) {
      return { bundle: null, tableMissing: true, error: error.message }
    }
    return { bundle: null, tableMissing: false, error: error.message }
  }
  if (!row) return { bundle: null, tableMissing: false, error: 'Identity not found' }

  const profile = { ...(row as DbProfile), skills: parseSkills(row.skills) }
  const profileId = profile.id

  const [personalRes, businessRes, expRes, eduRes, skillsRes, mediaRes, stats] = await Promise.all([
    supabase.from('personal_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
    supabase.from('profile_experience').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('profile_education').select('*').eq('profile_id', profileId).order('sort_order'),
    supabase.from('profile_skills').select('*').eq('profile_id', profileId).order('strength_score', { ascending: false }),
    supabase.from('profile_media').select('*').eq('profile_id', profileId).order('sort_order'),
    loadProfileSocialStats(targetUserId, profileId, profile.profile_type as ProfileType),
  ])

  const business = businessRes.data as DbBusinessProfile | null
  const bundle: IdentityProfileBundle = {
    profile: profile as DbProfile,
    personal: personalRes.data as DbPersonalProfile | null,
    business: business
      ? {
          ...business,
          services: parseServices(business.services),
          opening_hours: (business.opening_hours as Record<string, string>) ?? {},
          contact_methods: parseServices(business.contact_methods),
        }
      : null,
    experience: (expRes.data ?? []) as DbProfileExperience[],
    education: (eduRes.data ?? []) as DbProfileEducation[],
    profileSkills: (skillsRes.data ?? []) as DbProfileSkill[],
    media: (mediaRes.data ?? []) as DbProfileMedia[],
    stats,
    completion: { percentage: 0, items: [], nextStep: '' },
  }
  bundle.completion = computeProfileCompletion(bundle, hasCv)
  return { bundle, tableMissing: false, error: null }
}

export async function updateIdentityProfile(
  profileId: string,
  userId: string,
  patch: Partial<DbProfile>
) {
  if (patch.username != null && patch.username !== undefined) {
    const format = validateUsernameFormat(patch.username)
    if (!format.ok) throw new Error(format.reason)
    const avail = await checkUsernameAvailable(patch.username, userId)
    if (!avail.available) throw new Error(avail.reason ?? 'Username not available')
    patch.username = normalizeUsername(patch.username)
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  const row = { ...(data as DbProfile), skills: parseSkills(data.skills) }
  await syncFeedProfile(userId, row)
  return row
}

export async function setProfileType(profileId: string, userId: string, profileType: ProfileType) {
  return updateIdentityProfile(profileId, userId, { profile_type: profileType })
}

export async function updatePersonalProfile(profileId: string, patch: Partial<DbPersonalProfile>) {
  const { error } = await supabase
    .from('personal_profiles')
    .update(patch)
    .eq('profile_id', profileId)
  if (error) throw new Error(error.message)
}

export async function updateBusinessProfile(profileId: string, patch: Partial<DbBusinessProfile>) {
  if (patch.business_name && !patch.business_slug) {
    patch.business_slug = generateBusinessSlug(patch.business_name, profileId)
  }
  const { error } = await supabase
    .from('business_profiles')
    .update(patch)
    .eq('profile_id', profileId)
  if (error) throw new Error(error.message)
}

export async function uploadProfileImage(
  bucket: 'avatars' | 'banners' | 'business-media',
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function addProfileMedia(
  profileId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' = 'image'
) {
  const { data, error } = await supabase
    .from('profile_media')
    .insert({ profile_id: profileId, media_url: mediaUrl, media_type: mediaType })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as DbProfileMedia
}

export async function replaceProfileSkills(profileId: string, skills: { name: string; score?: number }[]) {
  await supabase.from('profile_skills').delete().eq('profile_id', profileId)
  if (skills.length === 0) return
  const rows = skills.map((s, i) => ({
    profile_id: profileId,
    skill_name: s.name,
    strength_score: s.score ?? 50,
  }))
  const { error } = await supabase.from('profile_skills').insert(rows)
  if (error) throw new Error(error.message)
}

export async function replaceProfileExperience(
  profileId: string,
  rows: Omit<DbProfileExperience, 'id' | 'profile_id'>[]
) {
  await supabase.from('profile_experience').delete().eq('profile_id', profileId)
  if (rows.length === 0) return
  const { error } = await supabase.from('profile_experience').insert(
    rows.map((r, i) => ({ ...r, profile_id: profileId, sort_order: i }))
  )
  if (error) throw new Error(error.message)
}

export async function replaceProfileEducation(
  profileId: string,
  rows: Omit<DbProfileEducation, 'id' | 'profile_id'>[]
) {
  await supabase.from('profile_education').delete().eq('profile_id', profileId)
  if (rows.length === 0) return
  const { error } = await supabase.from('profile_education').insert(
    rows.map((r, i) => ({ ...r, profile_id: profileId, sort_order: i }))
  )
  if (error) throw new Error(error.message)
}
