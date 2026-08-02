import type { FeedPostType } from './dbTypes'
import type {
  CommunityStats,
  CurrentUserFeedProfile,
  FeedComment,
  FeedFilter,
  FeedGroup,
  FeedOpportunity,
  FeedPost,
  PostCategory,
  SuggestedFriend,
} from './types'
import type { DbFeedGroup, DbFeedPost, DbFeedProfile, FeedCommentRow, FeedPostRow } from './dbTypes'
import {
  EMPTY_REACTION_COUNTS,
  EMPTY_USER_REACTIONS,
  type PostReactionCounts,
  type PostUserReactions,
} from './reactions/types'
import { calculatePostScore } from './reactions/scoring'

const AVATAR_COLORS = [
  'from-violet-600/50 to-cyan-500/30',
  'from-amber-600/50 to-orange-500/30',
  'from-pink-600/40 to-rose-500/30',
  'from-blue-600/40 to-cyan-500/30',
  'from-emerald-600/40 to-teal-500/30',
  'from-fuchsia-600/40 to-purple-500/30',
]

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function avatarColorForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}

export function timeAgoFromIso(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function postTypeToCategory(postType: FeedPostType): PostCategory {
  switch (postType) {
    case 'win':
    case 'success_story':
      return 'success'
    case 'question':
      return 'question'
    case 'opportunity':
      return 'opportunity'
    case 'job_tip':
    case 'job_search_tip':
    case 'business_idea':
    case 'small_business_idea':
    case 'career_advice':
      return 'job-tip'
    case 'training':
    case 'course_guide':
    case 'project':
    case 'announcement':
    case 'video':
    case 'discussion':
    default:
      return 'help'
  }
}

export function mapProfileToCurrentUser(profile: DbFeedProfile): CurrentUserFeedProfile {
  return {
    name: profile.display_name,
    initials: initialsFromName(profile.display_name),
    careerPath: profile.career_path ?? profile.headline ?? 'Career explorer',
    careerScore: profile.career_score ?? 0,
    avatarUrl: profile.avatar_url,
    headline: profile.headline,
  }
}

export function mapDbGroup(
  group: DbFeedGroup,
  memberCount: number,
  joined: boolean,
  postsToday = 0
): FeedGroup {
  const activityLevel =
    postsToday >= 20 ? 'Very high' : postsToday >= 10 ? 'High' : postsToday >= 4 ? 'Medium' : 'Active now'

  return {
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description ?? '',
    memberCount,
    category: group.category ?? 'Community',
    joined,
    icon: group.icon ?? '👥',
    visibility: group.visibility === 'private' ? 'private' : 'public',
    activityLevel,
    postsToday,
  }
}

function mapOpportunity(
  post: DbFeedPost,
  interestCount: number,
  userInterested: boolean
): FeedOpportunity | undefined {
  if (post.post_type !== 'opportunity' && !post.opportunity_title) return undefined
  return {
    title: post.opportunity_title ?? post.content.slice(0, 80),
    type: post.opportunity_type ?? 'job',
    location: post.opportunity_location ?? post.location ?? 'UK',
    details: post.opportunity_details ?? post.content,
    pay: post.opportunity_pay,
    contactPref: post.opportunity_contact_pref,
    status: post.opportunity_status ?? 'open',
    interestCount,
    userInterested,
  }
}

export function mapDbPostToFeedPost(params: {
  post: FeedPostRow
  comments: FeedCommentRow[]
  reactionCounts?: PostReactionCounts
  userReactions?: PostUserReactions
  saved: boolean
  groupName?: string
  groupId?: string
  groupSlug?: string
  followingIds: Set<string>
  joinedGroupIds: Set<string>
  postGroupIds: string[]
  opportunityInterestCount?: number
  userOpportunityInterested?: boolean
  authorUsername?: string | null
}): FeedPost {
  const {
    post,
    comments,
    reactionCounts = EMPTY_REACTION_COUNTS,
    userReactions = EMPTY_USER_REACTIONS,
    saved,
    groupName,
    groupId,
    groupSlug,
    followingIds,
    joinedGroupIds,
    postGroupIds,
    opportunityInterestCount = 0,
    userOpportunityInterested = false,
    authorUsername = null,
  } = params

  const isOfficial = Boolean(
    post.is_official_post || post.is_jobaz_post || post.created_by_admin
  )
  const authorName = isOfficial
    ? post.author_display_name?.trim() || 'JobAZ Career Team'
    : post.author?.display_name ?? post.author_display_name ?? 'Community member'
  const authorId = post.author_id ?? post.id
  const authorBadge = isOfficial
    ? 'Official'
    : post.author?.profile_type === 'business'
      ? post.author.business_name ?? post.author.headline ?? 'Business'
      : post.author?.headline ?? post.author?.career_path ?? post.career_path ?? 'Member'

  return {
    id: post.id,
    authorId: isOfficial ? undefined : post.author_id ?? undefined,
    authorAvatarUrl: isOfficial ? null : post.author?.avatar_url ?? null,
    authorHeadline: isOfficial ? null : post.author?.headline ?? null,
    authorName,
    authorInitials: isOfficial ? 'JZ' : initialsFromName(authorName),
    authorBadge,
    authorColor: isOfficial ? 'from-emerald-600 to-cyan-600' : avatarColorForId(authorId),
    authorProfileType: isOfficial ? null : post.author?.profile_type ?? null,
    authorUsername: isOfficial ? null : authorUsername,
    groupName,
    groupId: groupId ?? postGroupIds[0],
    groupSlug,
    text: post.title ? `${post.title}\n\n${post.content}` : post.content,
    timeAgo: timeAgoFromIso(post.published_at || post.created_at),
    category: postTypeToCategory(post.post_type),
    postType: post.post_type,
    isFriend: post.author_id ? followingIds.has(post.author_id) : false,
    isFromMyGroup: postGroupIds.some((gid) => joinedGroupIds.has(gid)),
    isModerator: isOfficial,
    isOfficial,
    visibility: post.visibility,
    media: post.image_url
      ? { type: 'image', label: 'Pulse photo', url: post.image_url }
      : post.video_url
        ? { type: 'video', label: 'Pulse video', url: post.video_url }
        : undefined,
    opportunity: mapOpportunity(post, opportunityInterestCount, userOpportunityInterested),
    reactionCounts,
    userReactions,
    engagementScore: calculatePostScore(reactionCounts),
    saved,
    comments: comments.map((c) => mapDbComment(c)),
    isDemo: false,
  }
}

export function mapDbComment(comment: FeedCommentRow): FeedComment {
  return {
    id: comment.id,
    authorName: comment.author?.display_name ?? 'Member',
    text: comment.content,
    timeAgo: timeAgoFromIso(comment.created_at),
  }
}

export function mapSuggestedFriend(profile: DbFeedProfile, following: boolean): SuggestedFriend {
  return {
    id: profile.id,
    name: profile.display_name,
    careerPath: profile.career_path ?? profile.headline ?? 'Career explorer',
    headline: profile.headline,
    avatarUrl: profile.avatar_url,
    mutualGroup: profile.location ?? 'JobAZ Pulse',
    initials: initialsFromName(profile.display_name),
    color: avatarColorForId(profile.id),
    requestSent: following,
    isFollowing: following,
  }
}

export function matchesFeedFilter(
  post: FeedPost,
  filter: FeedFilter,
  _joinedGroupIds: Set<string>
): boolean {
  const type = post.postType || ''
  switch (filter) {
    case 'all':
      return true
    case 'opportunities':
      return type === 'opportunity' || post.category === 'opportunity'
    case 'projects':
      return type === 'project'
    case 'ideas':
      return type === 'business_idea' || type === 'small_business_idea'
    case 'help':
      return type === 'question' || post.category === 'question'
    case 'career_tips':
      return (
        type === 'career_advice' ||
        type === 'job_search_tip' ||
        type === 'job_tip' ||
        type === 'discussion' ||
        type === 'announcement' ||
        type === 'general' ||
        type === 'video'
      )
    case 'courses':
    case 'training':
      return type === 'course_guide' || type === 'training'
    case 'success_stories':
    case 'wins':
      return (
        type === 'success_story' ||
        type === 'win' ||
        post.category === 'success'
      )
    case 'official':
      return Boolean(post.isOfficial)
    // Phase 1: following / my circles tabs removed from public UI
    case 'friends':
    case 'groups':
      return true
    default:
      return true
  }
}

export function defaultGuestProfile(): CurrentUserFeedProfile {
  return {
    name: 'Guest',
    initials: 'G',
    careerPath: 'Sign in to join Pulse',
    careerScore: 0,
  }
}

export function buildCommunityStats(params: {
  postCountToday: number
  profileCount: number
  successCountWeek: number
}): CommunityStats {
  // Phase 1: real counts only — no inflated “active today” placeholders
  return {
    activeToday: 0,
    postsToday: params.postCountToday,
    newMembers: 0,
    successStoriesWeek: params.successCountWeek,
  }
}

export function guestProfilePreview(): CurrentUserFeedProfile {
  return {
    name: 'Career explorer',
    initials: 'CE',
    careerPath: 'Preview — sign in to post on Pulse',
    careerScore: 42,
  }
}
