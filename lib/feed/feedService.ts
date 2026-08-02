/**
 * Career Feed service — Supabase-backed MVP
 */

import { supabase } from '@/lib/supabase'
import { CA_RESULT_STORAGE_KEY } from '@/lib/uk-career-assistant/guestSession'
import { CAREER_JOURNEY_STORAGE_KEY } from '@/lib/career-journey/storage'
import type { CreateFeedPostPayload, DbFeedComment, DbFeedGroup, DbFeedPost, DbFeedProfile } from './dbTypes'
import type { CreateOpportunityPayload } from './types'
import type { FeedFilter } from './types'
import { moderatePulseContentSync } from '@/lib/ai/moderation'
import { improvePulsePost } from './pulseAi'
import {
  buildCommunityStats,
  mapDbGroup,
  mapDbPostToFeedPost,
  mapProfileToCurrentUser,
  mapSuggestedFriend,
} from './mappers'
import type { FeedCommentRow, FeedPostRow } from './dbTypes'
import type { FeedPost } from './types'
import { isFeedTableMissingError } from './errors'
import { PULSE_PUBLIC_POST_TYPES } from '@/lib/pulse/phase1'
import {
  buildReactionMaps,
  fetchReactionsForPosts,
  getCountsForPost,
  getUserReactionsForPost,
  toggleReaction as togglePostReaction,
} from './reactions/reactionsService'
import type { ReactionType } from './reactions/types'

const POST_LIMIT = 20

export type FeedLoadResult = {
  posts: FeedPost[]
  groups: Awaited<ReturnType<typeof getGroups>>
  error: string | null
  tableMissing: boolean
}

export async function bootstrapFeedIfEmpty(): Promise<boolean> {
  try {
    const res = await fetch('/api/feed/bootstrap', { method: 'POST' })
    if (!res.ok) return false
    const data = (await res.json()) as { ok?: boolean }
    return Boolean(data.ok)
  } catch {
    return false
  }
}

function careerHintsFromLocalStorage(): { careerPath?: string; careerScore?: number } {
  if (typeof window === 'undefined') return {}
  try {
    const journeyRaw = localStorage.getItem(CAREER_JOURNEY_STORAGE_KEY)
    if (journeyRaw) {
      const j = JSON.parse(journeyRaw) as {
        profile?: { careerInterests?: string[]; pathTriad?: { workNow?: { title: string }[] } }
        readinessScore?: number
      }
      const path =
        j.profile?.pathTriad?.workNow?.[0]?.title ??
        j.profile?.careerInterests?.[0]
      return { careerPath: path, careerScore: j.readinessScore }
    }
    const caRaw = localStorage.getItem(CA_RESULT_STORAGE_KEY)
    if (caRaw) {
      const ca = JSON.parse(caRaw) as {
        result?: { result?: { work_now?: { directions?: { direction_title: string }[] } } }
      }
      const path = ca.result?.result?.work_now?.directions?.[0]?.direction_title
      return { careerPath: path, careerScore: 40 }
    }
  } catch {
    /* ignore */
  }
  return {}
}

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

async function fetchIdentityUsernames(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (userIds.length === 0) return map
  const { data } = await supabase.from('profiles').select('user_id, username').in('user_id', userIds)
  for (const row of data ?? []) {
    if (row.username) map.set(row.user_id as string, row.username as string)
  }
  return map
}

export async function getUserFeedProfile(userId?: string): Promise<DbFeedProfile | null> {
  const uid = userId ?? (await getSessionUserId())
  if (!uid) return null

  const { data, error } = await supabase
    .from('feed_profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()

  if (error) {
    console.error('[feed] getUserFeedProfile', error.message)
    return null
  }
  return data as DbFeedProfile | null
}

export async function ensureFeedProfile(): Promise<DbFeedProfile | null> {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const existing = await getUserFeedProfile(user.id)
  const meta = user.user_metadata ?? {}
  const hints = careerHintsFromLocalStorage()
  const displayName =
    meta.full_name ?? meta.name ?? meta.display_name ?? user.email?.split('@')[0] ?? 'JobAZ Member'

  let avatarUrl = (meta.avatar_url as string) ?? null
  let headline: string | null = (meta.headline as string) ?? null
  let location: string | null = null
  let profileType = 'personal'
  let businessName: string | null = null
  let careerPath = hints.careerPath ?? null

  const { data: identity } = await supabase
    .from('profiles')
    .select('id, avatar_url, headline, location, profile_type, username')
    .eq('user_id', user.id)
    .maybeSingle()

  if (identity) {
    avatarUrl = identity.avatar_url ?? avatarUrl
    headline = identity.headline ?? headline
    location = identity.location ?? null
    profileType = identity.profile_type ?? 'personal'
    careerPath = identity.headline ?? careerPath
    if (identity.profile_type === 'business') {
      const { data: biz } = await supabase
        .from('business_profiles')
        .select('business_name')
        .eq('profile_id', identity.id)
        .maybeSingle()
      businessName = biz?.business_name ?? null
      if (businessName) careerPath = businessName
    }
  }

  const row = {
    id: user.id,
    display_name: existing?.display_name ?? displayName,
    avatar_url: avatarUrl,
    headline,
    career_path: careerPath,
    location,
    profile_type: profileType,
    business_name: businessName,
    career_score: hints.careerScore ?? existing?.career_score ?? 0,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('feed_profiles').upsert(row).select('*').single()

  if (error) {
    console.error('[pulse] ensureFeedProfile', error.message)
    return existing
  }
  return data as DbFeedProfile
}

async function fetchPostContext(userId: string | null) {
  const [followingRes, joinedRes, savedRes] = await Promise.all([
    userId
      ? supabase.from('feed_follows').select('following_id').eq('follower_id', userId)
      : Promise.resolve({ data: [] as { following_id: string }[] }),
    userId
      ? supabase.from('feed_group_members').select('group_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { group_id: string }[] }),
    userId
      ? supabase.from('feed_saved_posts').select('post_id').eq('user_id', userId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ])

  return {
    followingIds: new Set((followingRes.data ?? []).map((r) => r.following_id)),
    joinedGroupIds: new Set((joinedRes.data ?? []).map((r) => r.group_id)),
    savedPostIds: new Set((savedRes.data ?? []).map((r) => r.post_id)),
  }
}

export async function getFeedPosts(_filter: FeedFilter = 'all'): Promise<FeedLoadResult> {
  const userId = await getSessionUserId()
  const ctx = await fetchPostContext(userId)

  let posts: FeedPostRow[] | null = null
  let error: { message: string } | null = null

  const primary = await supabase
    .from('feed_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.max(POST_LIMIT * 3, 60))

  if (primary.error) {
    error = primary.error
  } else {
    posts = (primary.data ?? []) as FeedPostRow[]
  }

  // Phase 1: only published public posts (fallback if status column missing)
  let postRows: FeedPostRow[] = []
  if (error) {
    console.error('[feed] getFeedPosts', error.message)
    const tableMissing = isFeedTableMissingError(error.message)
    return { posts: [], groups: [], error: error.message, tableMissing }
  }

  postRows = (posts ?? []).filter((p) => {
    const status = (p as DbFeedPost).status
    // If status column not present / null on legacy rows, treat as published
    if (status && status !== 'published') return false
    const vis = p.visibility
    if (vis === 'internal') return false
    if (vis === 'logged_in' && !userId) return false
    if (!(vis === 'public' || vis === 'friends' || vis === 'group' || vis === 'logged_in' || !vis)) {
      return false
    }
    // Phase 1 public type allow-list (admin-seeded + safe aliases)
    if (p.post_type && !PULSE_PUBLIC_POST_TYPES.has(p.post_type)) return false
    return true
  })

  // Prefer pinned + published_at ordering client-side when available
  postRows.sort((a, b) => {
    const ap = (a as DbFeedPost).pinned ? 1 : 0
    const bp = (b as DbFeedPost).pinned ? 1 : 0
    if (bp !== ap) return bp - ap
    const at = (a as DbFeedPost).published_at || a.created_at
    const bt = (b as DbFeedPost).published_at || b.created_at
    return new Date(bt).getTime() - new Date(at).getTime()
  })
  postRows = postRows.slice(0, POST_LIMIT)

  const postIds = postRows.map((p) => p.id)
  const authorIds = [...new Set(postRows.map((p) => p.author_id).filter(Boolean))] as string[]

  let profilesById = new Map<string, DbFeedProfile>()
  let usernamesByUserId = new Map<string, string>()
  if (authorIds.length > 0) {
    const [{ data: profiles }, usernameMap] = await Promise.all([
      supabase.from('feed_profiles').select('*').in('id', authorIds),
      fetchIdentityUsernames(authorIds),
    ])
    usernamesByUserId = usernameMap
    for (const p of (profiles ?? []) as DbFeedProfile[]) {
      profilesById.set(p.id, p)
    }
  }

  if (postIds.length === 0) {
    return { posts: [], groups: await getGroups(userId), error: null, tableMissing: false }
  }

  const [commentsRes, reactionRows, postGroupsRes, groupsRes] = await Promise.all([
    supabase
      .from('feed_comments')
      .select('*')
      .in('post_id', postIds)
      .order('created_at', { ascending: true }),
    fetchReactionsForPosts(postIds),
    supabase.from('feed_post_groups').select('post_id, group_id').in('post_id', postIds),
    supabase.from('feed_groups').select('*'),
  ])

  const { countsByPost, userByPost } = buildReactionMaps(reactionRows, userId)

  const commentAuthorIds = [
    ...new Set(((commentsRes.data ?? []) as DbFeedComment[]).map((c) => c.author_id)),
  ]
  if (commentAuthorIds.length > 0) {
    const { data: commentProfiles } = await supabase
      .from('feed_profiles')
      .select('*')
      .in('id', commentAuthorIds)
    for (const p of (commentProfiles ?? []) as DbFeedProfile[]) {
      profilesById.set(p.id, p)
    }
  }

  const commentsByPost = new Map<string, FeedCommentRow[]>()
  for (const c of (commentsRes.data ?? []) as DbFeedComment[]) {
    const row: FeedCommentRow = {
      ...c,
      author: profilesById.get(c.author_id) ?? null,
    }
    const list = commentsByPost.get(c.post_id) ?? []
    list.push(row)
    commentsByPost.set(c.post_id, list)
  }

  const groupsById = new Map(((groupsRes.data ?? []) as DbFeedGroup[]).map((g) => [g.id, g]))
  const postGroupMap = new Map<string, { ids: string[]; name?: string; slug?: string }>()
  for (const pg of postGroupsRes.data ?? []) {
    const entry = postGroupMap.get(pg.post_id) ?? { ids: [] as string[] }
    entry.ids.push(pg.group_id)
    const group = groupsById.get(pg.group_id)
    if (group?.name) entry.name = group.name
    if (group?.slug) entry.slug = group.slug
    postGroupMap.set(pg.post_id, entry)
  }

  const allGroups = (groupsRes.data ?? []) as DbFeedGroup[]
  const groupIds = allGroups.map((g) => g.id)
  const [memberCounts, postsToday] = await Promise.all([
    getGroupMemberCounts(groupIds),
    getGroupPostsTodayCounts(groupIds),
  ])

  const opportunityPostIds = postRows
    .filter((p) => p.post_type === 'opportunity')
    .map((p) => p.id)

  const interestCounts = new Map<string, number>()
  const userInterestedPosts = new Set<string>()

  if (opportunityPostIds.length > 0) {
    const { data: allInterests, error: intErr } = await supabase
      .from('feed_opportunity_interests')
      .select('post_id, user_id')
      .in('post_id', opportunityPostIds)

    if (!intErr) {
      for (const row of allInterests ?? []) {
        interestCounts.set(row.post_id, (interestCounts.get(row.post_id) ?? 0) + 1)
        if (userId && row.user_id === userId) userInterestedPosts.add(row.post_id)
      }
    }
  }

  const mappedPosts = postRows.map((post) => {
    const pg = postGroupMap.get(post.id)
    const row: FeedPostRow = {
      ...post,
      author: post.author_id ? profilesById.get(post.author_id) ?? null : null,
    }
    return mapDbPostToFeedPost({
      post: row,
      comments: commentsByPost.get(post.id) ?? [],
      reactionCounts: getCountsForPost(countsByPost, post.id),
      userReactions: getUserReactionsForPost(userByPost, post.id),
      saved: ctx.savedPostIds.has(post.id),
      groupName: pg?.name,
      groupId: pg?.ids[0],
      groupSlug: pg?.slug,
      followingIds: ctx.followingIds,
      joinedGroupIds: ctx.joinedGroupIds,
      postGroupIds: pg?.ids ?? [],
      opportunityInterestCount: interestCounts.get(post.id) ?? 0,
      userOpportunityInterested: userInterestedPosts.has(post.id),
      authorUsername: post.author_id ? usernamesByUserId.get(post.author_id) ?? null : null,
    })
  })

  const groups = await mapGroupsWithMembership(allGroups, userId, memberCounts, postsToday)

  return { posts: mappedPosts, groups, error: null, tableMissing: false }
}

export async function getGroupPostsTodayCounts(groupIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (groupIds.length === 0) return counts

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: links } = await supabase
    .from('feed_post_groups')
    .select('group_id, post_id')
    .in('group_id', groupIds)

  if (!links?.length) {
    for (const id of groupIds) counts.set(id, 0)
    return counts
  }

  const postIds = [...new Set(links.map((l) => l.post_id))]
  const { data: posts } = await supabase
    .from('feed_posts')
    .select('id, created_at')
    .in('id', postIds)
    .gte('created_at', today.toISOString())

  const todayPostIds = new Set((posts ?? []).map((p) => p.id))
  for (const link of links) {
    if (!todayPostIds.has(link.post_id)) continue
    counts.set(link.group_id, (counts.get(link.group_id) ?? 0) + 1)
  }
  for (const id of groupIds) {
    if (!counts.has(id)) counts.set(id, 0)
  }
  return counts
}

export async function getGroupMemberCounts(groupIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (groupIds.length === 0) return counts

  const { data } = await supabase.from('feed_group_members').select('group_id').in('group_id', groupIds)
  for (const row of data ?? []) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1)
  }
  for (const id of groupIds) {
    if (!counts.has(id)) counts.set(id, 0)
  }
  return counts
}

export async function mapGroupsWithMembership(
  groups: DbFeedGroup[],
  userId: string | null,
  memberCounts: Map<string, number>,
  postsToday: Map<string, number> = new Map()
) {
  let joined = new Set<string>()
  if (userId) {
    const { data } = await supabase.from('feed_group_members').select('group_id').eq('user_id', userId)
    joined = new Set((data ?? []).map((r) => r.group_id))
  }

  return groups.map((g) =>
    mapDbGroup(
      g,
      memberCounts.get(g.id) ?? 0,
      joined.has(g.id),
      postsToday.get(g.id) ?? 0
    )
  )
}

export async function getGroups(userId?: string | null) {
  const uid = userId ?? (await getSessionUserId())
  const { data, error } = await supabase.from('feed_groups').select('*').order('name')
  if (error) {
    console.error('[feed] getGroups', error.message)
    return []
  }
  const groups = (data ?? []) as DbFeedGroup[]
  const ids = groups.map((g) => g.id)
  const [memberCounts, postsToday] = await Promise.all([
    getGroupMemberCounts(ids),
    getGroupPostsTodayCounts(ids),
  ])
  return mapGroupsWithMembership(groups, uid, memberCounts, postsToday)
}

export async function uploadPulseMedia(file: File): Promise<string> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to upload media.')

  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5MB.')
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('Use JPG, PNG, or WebP.')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('pulse-media').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('pulse-media').getPublicUrl(path)
  return data.publicUrl
}

export async function createFeedPost(payload: CreateFeedPostPayload) {
  // Phase 1 launch: public live publishing disabled (admin-seeded feed only)
  void payload
  throw new Error(
    'Community posting is coming soon. For launch, JobAZ publishes verified career tips and opportunities.'
  )
}

export async function createOpportunityPost(payload: CreateOpportunityPayload) {
  void payload
  throw new Error(
    'Community posting is coming soon. For launch, JobAZ publishes verified career tips and opportunities.'
  )
}

export async function toggleOpportunityInterest(postId: string): Promise<{ interested: boolean }> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to show interest.')

  await ensureFeedProfile()

  const { data: existing } = await supabase
    .from('feed_opportunity_interests')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('feed_opportunity_interests').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { interested: false }
  }

  const { error } = await supabase.from('feed_opportunity_interests').insert({
    post_id: postId,
    user_id: userId,
    status: 'interested',
  })
  if (error) throw new Error(error.message)
  return { interested: true }
}

export async function toggleReaction(postId: string, reactionType: ReactionType) {
  await ensureFeedProfile()
  return togglePostReaction(postId, reactionType)
}

export async function addComment(postId: string, content: string) {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to comment.')

  await ensureFeedProfile()

  const mod = moderatePulseContentSync(content)
  if (!mod.approved) throw new Error(mod.reason ?? 'Content blocked.')

  const { data, error } = await supabase
    .from('feed_comments')
    .insert({
      post_id: postId,
      author_id: userId,
      content: content.trim(),
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  const profile = await getUserFeedProfile(userId)
  return {
    ...(data as DbFeedComment),
    author: profile,
  } as FeedCommentRow
}

export async function toggleSavePost(postId: string): Promise<{ saved: boolean }> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to save posts.')

  await ensureFeedProfile()

  const { data: existing } = await supabase
    .from('feed_saved_posts')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('feed_saved_posts').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { saved: false }
  }

  const { error } = await supabase.from('feed_saved_posts').insert({ post_id: postId, user_id: userId })
  if (error) throw new Error(error.message)
  return { saved: true }
}

export async function getSavedPostsForSidebar(): Promise<FeedPost[]> {
  const userId = await getSessionUserId()
  if (!userId) return []

  const { data: saved } = await supabase
    .from('feed_saved_posts')
    .select('post_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  const postIds = (saved ?? []).map((s) => s.post_id)
  if (postIds.length === 0) return []

  const { data: posts } = await supabase.from('feed_posts').select('*').in('id', postIds)
  const postRows = (posts ?? []) as FeedPostRow[]
  const authorIds = [...new Set(postRows.map((p) => p.author_id).filter(Boolean))] as string[]

  let profilesById = new Map<string, DbFeedProfile>()
  let usernamesByUserId = new Map<string, string>()
  if (authorIds.length > 0) {
    const [{ data: profiles }, usernameMap] = await Promise.all([
      supabase.from('feed_profiles').select('*').in('id', authorIds),
      fetchIdentityUsernames(authorIds),
    ])
    usernamesByUserId = usernameMap
    for (const p of (profiles ?? []) as DbFeedProfile[]) {
      profilesById.set(p.id, p)
    }
  }

  const ctx = await fetchPostContext(userId)
  const savedPostIds = postRows.map((p) => p.id)
  const reactionRows = await fetchReactionsForPosts(savedPostIds)
  const { countsByPost, userByPost } = buildReactionMaps(reactionRows, userId)

  return postIds
    .map((id) => postRows.find((p) => p.id === id))
    .filter((p): p is FeedPostRow => Boolean(p))
    .map((post) =>
      mapDbPostToFeedPost({
        post: { ...post, author: post.author_id ? profilesById.get(post.author_id) ?? null : null },
        comments: [],
        reactionCounts: getCountsForPost(countsByPost, post.id),
        userReactions: getUserReactionsForPost(userByPost, post.id),
        saved: true,
        followingIds: ctx.followingIds,
        joinedGroupIds: ctx.joinedGroupIds,
        postGroupIds: [],
        authorUsername: post.author_id ? usernamesByUserId.get(post.author_id) ?? null : null,
      })
    )
}

export async function mapCreatedPostForUi(post: DbFeedPost, groupName?: string): Promise<FeedPost> {
  const userId = await getSessionUserId()
  const profile = userId ? await getUserFeedProfile(userId) : null
  const ctx = await fetchPostContext(userId)
  const usernames = userId ? await fetchIdentityUsernames([userId]) : new Map<string, string>()

  return mapDbPostToFeedPost({
    post: { ...post, author: profile },
    comments: [],
    saved: false,
    groupName,
    followingIds: ctx.followingIds,
    joinedGroupIds: ctx.joinedGroupIds,
    postGroupIds: [],
    authorUsername: userId ? usernames.get(userId) ?? null : null,
  })
}

export async function getSavedPosts() {
  const userId = await getSessionUserId()
  if (!userId) return []

  const { data: saved } = await supabase
    .from('feed_saved_posts')
    .select('post_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const postIds = (saved ?? []).map((s) => s.post_id)
  if (postIds.length === 0) return []

  const { data: posts } = await supabase
    .from('feed_posts')
    .select('*')
    .in('id', postIds)

  return (posts ?? []) as DbFeedPost[]
}

export async function getSuggestedConnections(limit = 6) {
  const userId = await getSessionUserId()
  if (!userId) {
    const { data } = await supabase
      .from('feed_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    return ((data ?? []) as DbFeedProfile[]).map((p) => mapSuggestedFriend(p, false))
  }

  const { data: following } = await supabase
    .from('feed_follows')
    .select('following_id')
    .eq('follower_id', userId)

  const exclude = new Set([userId, ...(following ?? []).map((f) => f.following_id)])

  const { data, error } = await supabase
    .from('feed_profiles')
    .select('*')
    .neq('id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + exclude.size + 4)

  if (error) {
    console.error('[pulse] getSuggestedConnections', error.message)
    return []
  }

  const followingSet = new Set((following ?? []).map((f) => f.following_id))

  return ((data ?? []) as DbFeedProfile[])
    .filter((p) => !exclude.has(p.id) && !p.is_official)
    .slice(0, limit)
    .map((p) => mapSuggestedFriend(p, followingSet.has(p.id)))
}

export async function followUser(targetUserId: string): Promise<{ following: boolean }> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to follow users.')
  if (userId === targetUserId) throw new Error('Cannot follow yourself.')

  await ensureFeedProfile()

  const { data: existing } = await supabase
    .from('feed_follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('feed_follows').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { following: false }
  }

  const { error } = await supabase.from('feed_follows').insert({
    follower_id: userId,
    following_id: targetUserId,
    status: 'accepted',
  })
  if (error) throw new Error(error.message)
  return { following: true }
}

export async function joinGroup(groupId: string): Promise<{ joined: boolean }> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to join circles.')

  await ensureFeedProfile()

  const { data: existing } = await supabase
    .from('feed_group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('feed_group_members').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    return { joined: false }
  }

  const { error } = await supabase.from('feed_group_members').insert({
    group_id: groupId,
    user_id: userId,
    role: 'member',
  })
  if (error) throw new Error(error.message)
  return { joined: true }
}

export async function createGroup(payload: {
  name: string
  description: string
  category: string
  icon: string
  visibility?: 'public' | 'private'
  coverColor?: string | null
}) {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to create a circle.')

  await ensureFeedProfile()

  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

  const { data, error } = await supabase
    .from('feed_groups')
    .insert({
      name: payload.name.trim(),
      slug: `${slug}-${Date.now().toString(36)}`,
      description: payload.description.trim(),
      category: payload.category.trim(),
      icon: payload.icon || '👥',
      created_by: userId,
      is_official: false,
      visibility: payload.visibility ?? 'public',
      cover_color: payload.coverColor ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('feed_group_members').insert({
    group_id: data.id,
    user_id: userId,
    role: 'admin',
  })

  return data as DbFeedGroup
}

export async function getCommunityStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [postsTodayRes, profilesRes, successRes] = await Promise.all([
    supabase.from('feed_posts').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('feed_profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('feed_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())
      .in('post_type', ['success_story', 'win']),
  ])

  if (postsTodayRes.error && isFeedTableMissingError(postsTodayRes.error.message)) {
    return buildCommunityStats({ postCountToday: 0, profileCount: 0, successCountWeek: 0 })
  }

  return buildCommunityStats({
    postCountToday: postsTodayRes.count ?? 0,
    profileCount: profilesRes.count ?? 0,
    successCountWeek: successRes.count ?? 0,
  })
}

export async function improvePostWithAi(text: string, postType?: import('./dbTypes').FeedPostType): Promise<string | null> {
  return improvePulsePost(text, postType)
}

export { mapProfileToCurrentUser }
