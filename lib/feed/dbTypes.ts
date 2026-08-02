/** Database row shapes for Pulse (feed tables) */

import type { FeedPostType, FeedVisibility, OpportunityType } from './types'

export type { FeedPostType, FeedVisibility, OpportunityType }

export type DbFeedProfile = {
  id: string
  display_name: string
  avatar_url: string | null
  headline: string | null
  career_path: string | null
  location: string | null
  career_score: number
  profile_type?: string | null
  business_name?: string | null
  is_official?: boolean
  created_at: string
  updated_at: string
}

export type DbFeedGroup = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  icon: string | null
  created_by: string | null
  is_official: boolean
  visibility?: 'public' | 'private' | null
  cover_color?: string | null
  created_at: string
  updated_at?: string
}

export type DbFeedPost = {
  id: string
  author_id: string | null
  author_display_name: string | null
  content: string
  title?: string | null
  post_type: FeedPostType
  visibility: FeedVisibility
  image_url: string | null
  video_url: string | null
  source_url?: string | null
  career_path: string | null
  location: string | null
  circle?: string | null
  status?: string | null
  tags?: string[] | null
  pinned?: boolean
  featured?: boolean
  created_by_admin?: boolean
  is_jobaz_post: boolean
  is_official_post?: boolean
  opportunity_title?: string | null
  opportunity_location?: string | null
  opportunity_type?: string | null
  opportunity_details?: string | null
  opportunity_status?: string | null
  opportunity_pay?: string | null
  opportunity_contact_pref?: string | null
  published_at?: string | null
  created_at: string
  updated_at: string
}

export type DbFeedComment = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
}

export type DbFeedReaction = {
  id: string
  post_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

export type DbFeedFollow = {
  id: string
  follower_id: string
  following_id: string
  status: string
  created_at: string
}

export type FeedPostRow = DbFeedPost & {
  author?: DbFeedProfile | null
}

export type FeedCommentRow = DbFeedComment & {
  author?: DbFeedProfile | null
}

export type CreateFeedPostPayload = {
  content: string
  postType: FeedPostType
  visibility?: FeedVisibility
  groupId?: string | null
  careerPath?: string | null
  location?: string | null
  imageUrl?: string | null
}

export const FEED_POST_TYPE_OPTIONS: { value: FeedPostType; label: string }[] = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'question', label: 'Ask for Help' },
  { value: 'success_story', label: 'Success Story' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'project', label: 'Project' },
  { value: 'business_idea', label: 'Business Idea' },
  { value: 'small_business_idea', label: 'Small Business Idea' },
  { value: 'training', label: 'Training' },
  { value: 'course_guide', label: 'Course Guide' },
  { value: 'career_advice', label: 'Career Advice' },
  { value: 'job_tip', label: 'Job Tip' },
  { value: 'job_search_tip', label: 'Job Search Tip' },
  { value: 'video', label: 'Video' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'general', label: 'General update' },
]

export const OPPORTUNITY_TYPE_OPTIONS: { value: OpportunityType; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'temporary_help', label: 'Temporary Help' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'training', label: 'Training' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'business_support', label: 'Business Support' },
  { value: 'local_service', label: 'Local Service' },
]
