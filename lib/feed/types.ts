import type { PostReactionCounts, PostUserReactions } from '@/lib/feed/reactions/types'

export type FeedFilter =
  | 'all'
  | 'friends'
  | 'groups'
  | 'opportunities'
  | 'projects'
  | 'ideas'
  | 'help'
  | 'career_tips'
  | 'courses'
  | 'success_stories'
  | 'training'
  | 'wins'
  | 'official'

export type PostVisibility = 'public' | 'friends' | 'group' | 'anonymous' | 'logged_in' | 'internal'

export type FeedVisibility = 'public' | 'friends' | 'group' | 'logged_in' | 'internal'

export type PostCategory = 'success' | 'question' | 'help' | 'job-tip' | 'interview' | 'cv' | 'moderator' | 'opportunity'

export type FeedPostType =
  | 'general'
  | 'discussion'
  | 'question'
  | 'win'
  | 'success_story'
  | 'job_tip'
  | 'training'
  | 'project'
  | 'business_idea'
  | 'opportunity'
  | 'announcement'
  | 'career_advice'
  | 'course_guide'
  | 'job_search_tip'
  | 'small_business_idea'
  | 'video'

export type OpportunityType =
  | 'job'
  | 'temporary_help'
  | 'freelance'
  | 'tutoring'
  | 'training'
  | 'collaboration'
  | 'business_support'
  | 'local_service'

export type { PostReactionCounts, PostUserReactions, ReactionType } from '@/lib/feed/reactions/types'

export type FeedComment = {
  id: string
  authorName: string
  text: string
  timeAgo: string
}

export type FeedMedia =
  | { type: 'image'; label: string; url?: string }
  | { type: 'video'; label: string; url?: string }
  | { type: 'cv-comparison'; label: string }

export type FeedOpportunity = {
  title: string
  type: string
  location: string
  details: string
  pay?: string | null
  contactPref?: string | null
  status: string
  interestCount: number
  userInterested: boolean
}

export type FeedPost = {
  id: string
  authorId?: string
  authorAvatarUrl?: string | null
  authorHeadline?: string | null
  authorName: string
  authorInitials: string
  authorBadge: string
  authorColor: string
  authorProfileType?: string | null
  authorUsername?: string | null
  groupName?: string
  groupId?: string
  groupSlug?: string
  text: string
  timeAgo: string
  category: PostCategory
  postType?: FeedPostType
  isFriend: boolean
  isFromMyGroup: boolean
  isModerator?: boolean
  isOfficial?: boolean
  isDemo?: boolean
  visibility?: PostVisibility
  media?: FeedMedia
  opportunity?: FeedOpportunity
  reactionCounts: PostReactionCounts
  userReactions: PostUserReactions
  engagementScore?: number
  saved: boolean
  comments: FeedComment[]
}

export type FeedGroup = {
  id: string
  name: string
  slug: string
  description: string
  memberCount: number
  category: string
  joined: boolean
  icon: string
  visibility?: 'public' | 'private'
  activityLevel: 'Very high' | 'High' | 'Medium' | 'Active now'
  postsToday: number
}

export type ComposerHubOption = {
  id: string | null
  name: string
}

export type SuggestedFriend = {
  id: string
  profileId?: string
  name: string
  careerPath: string
  headline?: string | null
  avatarUrl?: string | null
  mutualGroup: string
  initials: string
  color: string
  profileType?: 'personal' | 'business'
  connectionStatus?: 'none' | 'pending_out' | 'pending_in' | 'connected'
  username?: string | null
  businessSlug?: string | null
  requestSent?: boolean
  isFollowing?: boolean
}

export type AiGroupSuggestion = {
  groupId: string
  reason: string
}

export type TrendingTopic = {
  id: string
  label: string
  posts: number
}

export type FeedPrompt = {
  id: string
  text: string
  action: string
  postType?: FeedPostType
}

export type CurrentUserFeedProfile = {
  name: string
  initials: string
  careerPath: string
  careerScore: number
  avatarUrl?: string | null
  headline?: string | null
}

export type CommunityStats = {
  activeToday: number
  postsToday: number
  newMembers: number
  successStoriesWeek: number
}

export type CreateOpportunityPayload = {
  title: string
  opportunityType: OpportunityType
  location: string
  details: string
  pay?: string
  contactPref: 'comment' | 'interest' | 'message'
  visibility: PostVisibility
  groupId?: string | null
}
