import { supabase } from '@/lib/supabase'
import {
  ensureFeedProfile,
  getGroupMemberCounts,
  getGroupPostsTodayCounts,
  getSessionUserId,
  mapGroupsWithMembership,
} from '@/lib/feed/feedService'
import type { DbFeedGroup, DbFeedProfile, FeedCommentRow, FeedPostRow } from '@/lib/feed/dbTypes'
import { mapDbGroup, mapDbPostToFeedPost } from '@/lib/feed/mappers'
import {
  buildReactionMaps,
  fetchReactionsForPosts,
  getCountsForPost,
  getUserReactionsForPost,
} from '@/lib/feed/reactions/reactionsService'
import type { FeedGroup, FeedPost } from '@/lib/feed/types'

export type HubMemberPreview = {
  userId: string
  displayName: string
  initials: string
  avatarUrl: string | null
  role: string
}

export type HubDetail = FeedGroup & {
  visibility: 'public' | 'private'
  coverColor: string | null
  isOfficial: boolean
  createdBy: string | null
}

async function fetchIdentityUsernames(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()
  const { data } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('user_id', userIds)
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (row.username) map.set(row.user_id, row.username)
  }
  return map
}

async function fetchPostContextForHub(userId: string | null) {
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

export async function getHubBySlug(slug: string): Promise<HubDetail | null> {
  const userId = await getSessionUserId()
  const { data, error } = await supabase.from('feed_groups').select('*').eq('slug', slug).maybeSingle()
  if (error || !data) return null

  const group = data as DbFeedGroup
  const [memberCounts, postsToday] = await Promise.all([
    getGroupMemberCounts([group.id]),
    getGroupPostsTodayCounts([group.id]),
  ])

  let joined = false
  if (userId) {
    const { data: mem } = await supabase
      .from('feed_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .maybeSingle()
    joined = Boolean(mem)
  }

  const mapped = mapDbGroup(
    group,
    memberCounts.get(group.id) ?? 0,
    joined,
    postsToday.get(group.id) ?? 0
  )

  return {
    ...mapped,
    visibility: group.visibility === 'private' ? 'private' : 'public',
    coverColor: group.cover_color ?? null,
    isOfficial: group.is_official,
    createdBy: group.created_by,
  }
}

export async function getHubMembersPreview(groupId: string, limit = 8): Promise<HubMemberPreview[]> {
  const { data: members, error } = await supabase
    .from('feed_group_members')
    .select('user_id, role')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !members?.length) return []

  const userIds = members.map((m) => m.user_id)
  const { data: profiles } = await supabase.from('feed_profiles').select('*').in('id', userIds)
  const byId = new Map(((profiles ?? []) as DbFeedProfile[]).map((p) => [p.id, p]))

  return members.map((m) => {
    const p = byId.get(m.user_id)
    const name = p?.display_name ?? 'Member'
    return {
      userId: m.user_id,
      displayName: name,
      initials: name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      avatarUrl: p?.avatar_url ?? null,
      role: m.role,
    }
  })
}

export async function getHubPosts(groupId: string, hubName: string, hubSlug: string): Promise<FeedPost[]> {
  const userId = await getSessionUserId()
  const ctx = await fetchPostContextForHub(userId)

  const { data: links, error: linkErr } = await supabase
    .from('feed_post_groups')
    .select('post_id')
    .eq('group_id', groupId)

  if (linkErr || !links?.length) return []

  const postIds = links.map((l) => l.post_id)

  const { data: posts, error } = await supabase
    .from('feed_posts')
    .select('*')
    .in('id', postIds)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !posts?.length) return []

  const postRows = posts as FeedPostRow[]
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

  const [commentsRes, reactionRows] = await Promise.all([
    supabase.from('feed_comments').select('*').in('post_id', postIds).order('created_at', { ascending: true }),
    fetchReactionsForPosts(postIds),
  ])

  const { countsByPost, userByPost } = buildReactionMaps(reactionRows, userId)

  const commentAuthorIds = [
    ...new Set(((commentsRes.data ?? []) as { author_id: string }[]).map((c) => c.author_id)),
  ]
  if (commentAuthorIds.length > 0) {
    const { data: commentProfiles } = await supabase.from('feed_profiles').select('*').in('id', commentAuthorIds)
    for (const p of (commentProfiles ?? []) as DbFeedProfile[]) {
      profilesById.set(p.id, p)
    }
  }

  const commentsByPost = new Map<string, FeedCommentRow[]>()
  for (const c of commentsRes.data ?? []) {
    const row = {
      ...c,
      author: profilesById.get(c.author_id) ?? null,
    } as FeedCommentRow
    const list = commentsByPost.get(c.post_id) ?? []
    list.push(row)
    commentsByPost.set(c.post_id, list)
  }

  return postRows.map((post) => {
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
      groupName: hubName,
      groupId,
      groupSlug: hubSlug,
      followingIds: ctx.followingIds,
      joinedGroupIds: ctx.joinedGroupIds,
      postGroupIds: [groupId],
      authorUsername: post.author_id ? usernamesByUserId.get(post.author_id) ?? null : null,
    })
  })
}

export async function listHubsForUser(): Promise<FeedGroup[]> {
  const userId = await getSessionUserId()
  const { data, error } = await supabase
    .from('feed_groups')
    .select('*')
    .order('is_official', { ascending: false })
    .order('name')
  if (error) return []
  const groups = (data ?? []) as DbFeedGroup[]
  const ids = groups.map((g) => g.id)
  const [memberCounts, postsToday] = await Promise.all([
    getGroupMemberCounts(ids),
    getGroupPostsTodayCounts(ids),
  ])
  return mapGroupsWithMembership(groups, userId, memberCounts, postsToday)
}

export { ensureFeedProfile }
