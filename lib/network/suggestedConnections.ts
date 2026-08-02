import { supabase } from '@/lib/supabase'
import { getAuthUserId, getConnectionStatus } from './connectionsService'
import type { SuggestedConnection } from './types'

function scoreCandidate(
  viewer: { location: string | null; skills: string[]; profile_type: string },
  candidate: {
    location: string | null
    skills: string[]
    profile_type: string
    category: string | null
    career_path: string | null
    post_count: number
    shared_groups: number
  }
): number {
  let score = 0
  if (
    viewer.location &&
    candidate.location &&
    viewer.location.toLowerCase() === candidate.location.toLowerCase()
  ) {
    score += 30
  }
  const sharedSkills = viewer.skills.filter((s) =>
    candidate.skills.some((c) => c.toLowerCase() === s.toLowerCase())
  )
  score += Math.min(25, sharedSkills.length * 8)
  if (candidate.career_path && viewer.profile_type === 'personal') score += 10
  if (candidate.category && viewer.profile_type === 'business') score += 12
  score += Math.min(15, candidate.shared_groups * 5)
  score += Math.min(10, candidate.post_count)
  return score
}

export async function fetchSuggestedConnections(limit = 6): Promise<SuggestedConnection[]> {
  const viewerId = await getAuthUserId()
  if (!viewerId) return []

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, location, skills, profile_type, username')
    .eq('user_id', viewerId)
    .maybeSingle()

  if (!myProfile) return []

  const mySkills = Array.isArray(myProfile.skills)
    ? (myProfile.skills as string[])
    : []

  const { data: myGroups } = await supabase
    .from('feed_group_members')
    .select('group_id')
    .eq('user_id', viewerId)

  const myGroupIds = new Set((myGroups ?? []).map((g) => g.group_id))

  const { data: connected } = await supabase
    .from('profile_connections')
    .select('requester_id, target_user_id')
    .eq('status', 'connected')
    .or(`requester_id.eq.${viewerId},target_user_id.eq.${viewerId}`)

  const exclude = new Set<string>([viewerId])
  for (const c of connected ?? []) {
    exclude.add(c.requester_id === viewerId ? c.target_user_id : c.requester_id)
  }

  const { data: candidates } = await supabase
    .from('profiles')
    .select(
      'id, user_id, username, headline, avatar_url, location, skills, profile_type, business_profiles(business_name, category, business_slug)'
    )
    .neq('user_id', viewerId)
    .eq('visibility', 'public')
    .limit(40)

  if (!candidates?.length) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select(
        'id, user_id, username, headline, avatar_url, location, skills, profile_type, business_profiles(business_name, category, business_slug)'
      )
      .neq('user_id', viewerId)
      .limit(30)
    if (!fallback?.length) return []
    return rankAndMap(fallback, myProfile, mySkills, myGroupIds, exclude, viewerId, limit)
  }

  return rankAndMap(candidates, myProfile, mySkills, myGroupIds, exclude, viewerId, limit)
}

async function rankAndMap(
  rows: Record<string, unknown>[],
  myProfile: { location: string | null; skills: unknown; profile_type: string },
  mySkills: string[],
  myGroupIds: Set<string>,
  exclude: Set<string>,
  viewerId: string,
  limit: number
): Promise<SuggestedConnection[]> {
  const scored: { row: Record<string, unknown>; score: number; sharedGroups: number }[] = []

  for (const row of rows) {
    const uid = row.user_id as string
    if (exclude.has(uid)) continue

    const skills = Array.isArray(row.skills) ? (row.skills as string[]) : []
    const biz = row.business_profiles as
      | { business_name: string | null; category: string | null; business_slug: string | null }
      | { business_name: string | null; category: string | null; business_slug: string | null }[]
      | null
    const business = Array.isArray(biz) ? biz[0] : biz

    const { count: postCount } = await supabase
      .from('feed_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', uid)

    let sharedGroups = 0
    if (myGroupIds.size > 0) {
      const { data: theirGroups } = await supabase
        .from('feed_group_members')
        .select('group_id')
        .eq('user_id', uid)
      for (const g of theirGroups ?? []) {
        if (myGroupIds.has(g.group_id)) sharedGroups++
      }
    }

    const score = scoreCandidate(
      { location: myProfile.location as string | null, skills: mySkills, profile_type: myProfile.profile_type as string },
      {
        location: row.location as string | null,
        skills,
        profile_type: row.profile_type as string,
        category: business?.category ?? null,
        career_path: (row.headline as string) ?? null,
        post_count: postCount ?? 0,
        shared_groups: sharedGroups,
      }
    )

    scored.push({ row, score, sharedGroups })
  }

  scored.sort((a, b) => b.score - a.score)

  const results: SuggestedConnection[] = []
  for (const { row, score, sharedGroups } of scored.slice(0, limit)) {
    const uid = row.user_id as string
    const biz = row.business_profiles as
      | { business_name: string | null; category: string | null; business_slug: string | null }
      | { business_name: string | null; category: string | null; business_slug: string | null }[]
      | null
    const business = Array.isArray(biz) ? biz[0] : biz
    const profileType = row.profile_type as 'personal' | 'business'
    const name =
      profileType === 'business'
        ? business?.business_name ?? (row.username as string) ?? 'Business'
        : (row.username as string) ?? 'Member'

    const connectionStatus = await getConnectionStatus(viewerId, uid)

    results.push({
      userId: uid,
      profileId: row.id as string,
      profileType,
      name,
      headline: (row.headline as string) ?? null,
      avatarUrl: (row.avatar_url as string) ?? null,
      role: profileType === 'business' ? business?.category ?? 'Business' : (row.headline as string) ?? 'Professional',
      mutualGroups: sharedGroupsLabel(sharedGroups),
      username: (row.username as string) ?? null,
      businessSlug: business?.business_slug ?? null,
      connectionStatus,
      score,
    })
  }

  return results
}

function sharedGroupsLabel(n: number): string {
  if (n <= 0) return 'Pulse community'
  if (n === 1) return '1 mutual circle'
  return `${n} mutual circles`
}
