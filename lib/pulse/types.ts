/** Pulse Phase 1 — admin-controlled content types and circles */

export const PULSE_POST_TYPES = [
  'career_advice',
  'course_guide',
  'job_search_tip',
  'opportunity',
  'small_business_idea',
  'success_story',
  'project',
  'question',
  'video',
] as const

export type PulsePostType = (typeof PULSE_POST_TYPES)[number]

/** Map admin Pulse types onto existing feed_posts.post_type values (+ new Phase 1 types). */
export const PULSE_TO_FEED_POST_TYPE: Record<PulsePostType, string> = {
  career_advice: 'career_advice',
  course_guide: 'course_guide',
  job_search_tip: 'job_search_tip',
  opportunity: 'opportunity',
  small_business_idea: 'small_business_idea',
  success_story: 'success_story',
  project: 'project',
  question: 'question',
  video: 'video',
}

export const PULSE_POST_TYPE_LABELS: Record<PulsePostType, string> = {
  career_advice: 'Career Advice',
  course_guide: 'Course Guide',
  job_search_tip: 'Job Search Tip',
  opportunity: 'Opportunity',
  small_business_idea: 'Small Business Idea',
  success_story: 'Success Story',
  project: 'Project / Collaboration',
  question: 'Question / Ask for Help',
  video: 'Video Post',
}

export const PULSE_STATUSES = ['draft', 'pending_review', 'published', 'archived'] as const
export type PulsePostStatus = (typeof PULSE_STATUSES)[number]

export const PULSE_VISIBILITIES = ['public', 'logged_in', 'internal'] as const
export type PulseVisibility = (typeof PULSE_VISIBILITIES)[number]

export const PULSE_CIRCLES = [
  'security',
  'care',
  'warehouse_logistics',
  'customer_service',
  'driving_delivery',
  'construction',
  'digital_it',
  'hospitality',
  'business_startup',
  'general',
] as const

export type PulseCircle = (typeof PULSE_CIRCLES)[number]

export const PULSE_CIRCLE_LABELS: Record<PulseCircle, string> = {
  security: 'Security',
  care: 'Care',
  warehouse_logistics: 'Warehouse & Logistics',
  customer_service: 'Customer Service',
  driving_delivery: 'Driving & Delivery',
  construction: 'Construction',
  digital_it: 'Digital / IT',
  hospitality: 'Hospitality',
  business_startup: 'Business / Startup',
  general: 'General',
}

export const PULSE_AI_AUDIENCES = [
  'no_uk_experience',
  'extra_income',
  'career_change',
  'care',
  'security',
  'warehouse',
  'driving',
  'customer_service',
  'migrant_jobseeker',
  'general',
] as const

export type PulseAiAudience = (typeof PULSE_AI_AUDIENCES)[number]

export const PULSE_AI_GOALS = [
  'educate',
  'motivate',
  'drive_course_click',
  'drive_cv_builder',
  'drive_jobs_search',
  'encourage_pulse_activity',
] as const

export type PulseAiGoal = (typeof PULSE_AI_GOALS)[number]

export type AdminPulsePost = {
  id: string
  title: string | null
  body: string
  post_type: string
  status: PulsePostStatus
  visibility: string
  circle: string
  video_url: string | null
  image_url: string | null
  source_url: string | null
  tags: string[]
  pinned: boolean
  featured: boolean
  created_by_admin: boolean
  ai_suggested: boolean
  ai_notes: string | null
  author_display_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type PulseAiSuggestion = {
  id: string
  suggested_date: string
  title: string | null
  body: string
  post_type: string
  circle: string
  tags: string[]
  reason: string | null
  video_url: string | null
  source_url: string | null
  status: string
  converted_post_id: string | null
  created_at: string
}

export type AdminPulsePostInput = {
  title?: string | null
  body: string
  post_type: PulsePostType | string
  status?: PulsePostStatus
  visibility?: PulseVisibility | string
  circle?: PulseCircle | string
  video_url?: string | null
  image_url?: string | null
  source_url?: string | null
  tags?: string[]
  pinned?: boolean
  featured?: boolean
  ai_suggested?: boolean
  ai_notes?: string | null
}
