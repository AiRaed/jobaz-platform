import { supabase } from '@/lib/supabase'
import type { ConnectionStatus, IncomingConnectionRequest } from './types'

export type ConnectionRow = {
  id: string
  requester_id: string
  target_user_id: string
  status: 'pending' | 'connected'
}

export async function getAuthUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function getProfileIdByUserId(userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function findConnectionBetween(
  userA: string,
  userB: string
): Promise<ConnectionRow | null> {
  const { data } = await supabase
    .from('profile_connections')
    .select('id, requester_id, target_user_id, status')
    .or(
      `and(requester_id.eq.${userA},target_user_id.eq.${userB}),and(requester_id.eq.${userB},target_user_id.eq.${userA})`
    )
    .maybeSingle()
  return (data as ConnectionRow | null) ?? null
}

export function resolveConnectionStatus(
  viewerId: string | null,
  targetUserId: string,
  row: ConnectionRow | null
): ConnectionStatus {
  if (!viewerId || viewerId === targetUserId || !row) return 'none'
  if (row.status === 'connected') return 'connected'
  if (row.requester_id === viewerId) return 'pending_out'
  return 'pending_in'
}

export async function getConnectionStatus(
  viewerId: string | null,
  targetUserId: string
): Promise<ConnectionStatus> {
  if (!viewerId || viewerId === targetUserId) return 'none'
  const row = await findConnectionBetween(viewerId, targetUserId)
  return resolveConnectionStatus(viewerId, targetUserId, row)
}

export async function togglePersonalConnection(targetUserId: string): Promise<{
  status: ConnectionStatus
}> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in to connect.')
  if (viewerId === targetUserId) throw new Error('Cannot connect with yourself.')

  const existing = await findConnectionBetween(viewerId, targetUserId)

  if (!existing) {
    const { error } = await supabase.from('profile_connections').insert({
      requester_id: viewerId,
      target_user_id: targetUserId,
      status: 'pending',
    })
    if (error) throw new Error(error.message)
    return { status: 'pending_out' }
  }

  if (existing.status === 'connected') {
    const { error } = await supabase.from('profile_connections').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { status: 'none' }
  }

  if (existing.requester_id === viewerId) {
    const { error } = await supabase.from('profile_connections').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { status: 'none' }
  }

  const { error } = await supabase
    .from('profile_connections')
    .update({ status: 'connected', updated_at: new Date().toISOString() })
    .eq('id', existing.id)
  if (error) throw new Error(error.message)
  return { status: 'connected' }
}

export async function countIncomingPendingRequests(userId: string): Promise<number> {
  const { count } = await supabase
    .from('profile_connections')
    .select('id', { count: 'exact', head: true })
    .eq('target_user_id', userId)
    .eq('status', 'pending')
  return count ?? 0
}

export async function fetchIncomingConnectionRequests(userId: string): Promise<IncomingConnectionRequest[]> {
  const { data: rows, error } = await supabase
    .from('profile_connections')
    .select('id, requester_id, created_at')
    .eq('target_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error || !rows?.length) return []

  const requesterIds = rows.map((r) => r.requester_id as string)

  const [{ data: profiles }, { data: feedProfiles }] = await Promise.all([
    supabase.from('profiles').select('user_id, username, headline, avatar_url').in('user_id', requesterIds),
    supabase.from('feed_profiles').select('id, display_name, headline, avatar_url').in('id', requesterIds),
  ])

  const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id as string, p]))
  const feedByUser = new Map((feedProfiles ?? []).map((p) => [p.id as string, p]))

  return rows.map((row) => {
    const requesterId = row.requester_id as string
    const profile = profileByUser.get(requesterId)
    const feed = feedByUser.get(requesterId)
    const username = (profile?.username as string | null) ?? null
    const name = username ? `@${username}` : ((feed?.display_name as string | undefined) ?? 'Member')

    return {
      id: row.id as string,
      requesterId,
      createdAt: row.created_at as string,
      name,
      headline: ((profile?.headline ?? feed?.headline) as string | null) ?? null,
      avatarUrl: ((profile?.avatar_url ?? feed?.avatar_url) as string | null) ?? null,
      username,
    }
  })
}

export async function acceptConnectionRequest(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('profile_connections')
    .update({ status: 'connected', updated_at: new Date().toISOString() })
    .eq('id', connectionId)
  if (error) throw new Error(error.message)
}

export async function declineConnectionRequest(connectionId: string): Promise<void> {
  const { error } = await supabase.from('profile_connections').delete().eq('id', connectionId)
  if (error) throw new Error(error.message)
}

export async function countConnections(userId: string): Promise<number> {
  const { count } = await supabase
    .from('profile_connections')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'connected')
    .or(`requester_id.eq.${userId},target_user_id.eq.${userId}`)
  return count ?? 0
}

export async function isBusinessFollower(
  followerId: string,
  businessProfileId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('business_followers')
    .select('id')
    .eq('follower_id', followerId)
    .eq('business_profile_id', businessProfileId)
    .maybeSingle()
  return Boolean(data)
}

export async function toggleBusinessFollow(businessProfileId: string): Promise<{ following: boolean }> {
  const followerId = await getAuthUserId()
  if (!followerId) throw new Error('Sign in to follow businesses.')

  const { data: existing } = await supabase
    .from('business_followers')
    .select('id')
    .eq('follower_id', followerId)
    .eq('business_profile_id', businessProfileId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('business_followers').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { following: false }
  }

  const { error } = await supabase.from('business_followers').insert({
    follower_id: followerId,
    business_profile_id: businessProfileId,
  })
  if (error) throw new Error(error.message)
  return { following: true }
}

export async function countBusinessFollowers(businessProfileId: string): Promise<number> {
  const { count } = await supabase
    .from('business_followers')
    .select('id', { count: 'exact', head: true })
    .eq('business_profile_id', businessProfileId)
  return count ?? 0
}

export async function recordProfileViewForUser(profileUserId: string, viewerId: string | null) {
  if (viewerId && viewerId === profileUserId) return
  const profileId = await getProfileIdByUserId(profileUserId)
  if (!profileId) return
  try {
    await supabase.from('profile_views').insert({
      profile_user_id: profileUserId,
      profile_id: profileId,
      viewer_id: viewerId,
      viewed_at: new Date().toISOString(),
    })
  } catch {
    /* optional */
  }
}

export async function recordProfileShareForUser(profileUserId: string, userId: string | null) {
  const profileId = await getProfileIdByUserId(profileUserId)
  if (!profileId) return
  try {
    await supabase.from('profile_shares').insert({
      profile_user_id: profileUserId,
      profile_id: profileId,
      shared_profile_id: profileId,
      shared_by: userId,
      user_id: userId,
      channel: 'link',
    })
  } catch {
    /* optional */
  }
}

export async function getWeeklyProfileViewCount(profileUserId: string): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const { count } = await supabase
    .from('profile_views')
    .select('id', { count: 'exact', head: true })
    .eq('profile_user_id', profileUserId)
    .gte('created_at', since.toISOString())
  return count ?? 0
}
