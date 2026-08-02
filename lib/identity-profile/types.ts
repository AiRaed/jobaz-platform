export type ProfileType = 'personal' | 'business'

export type ProfileVisibility = 'private' | 'public' | 'recruiter'

export type DbProfile = {
  id: string
  user_id: string
  profile_type: ProfileType
  username: string | null
  headline: string | null
  bio: string | null
  location: string | null
  avatar_url: string | null
  banner_url: string | null
  skills: string[]
  visibility: ProfileVisibility
  trust_score: number
  created_at: string
  updated_at: string
}

export type DbPersonalProfile = {
  profile_id: string
  career_score: number
  ats_score: number
  interview_score: number
  recruiter_visible: boolean
  current_focus: string | null
  cv_status: string | null
  interview_readiness: string | null
}

export type DbBusinessProfile = {
  profile_id: string
  business_name: string | null
  business_slug: string | null
  category: string | null
  services: string[]
  business_description: string | null
  business_phone: string | null
  business_email: string | null
  website: string | null
  opening_hours: Record<string, string>
  business_verified: boolean
  contact_methods: string[]
  customer_trust_score: number
}

export type DbProfileExperience = {
  id: string
  profile_id: string
  company: string
  role: string
  start_date: string | null
  end_date: string | null
  description: string | null
  sort_order: number
}

export type DbProfileEducation = {
  id: string
  profile_id: string
  school: string
  degree: string | null
  start_date: string | null
  end_date: string | null
  sort_order: number
}

export type DbProfileSkill = {
  id: string
  profile_id: string
  skill_name: string
  strength_score: number
}

export type DbProfileMedia = {
  id: string
  profile_id: string
  media_type: 'image' | 'video'
  media_url: string
  caption: string | null
  sort_order: number
}

export type ProfileSocialStats = {
  followersCount: number
  followingCount: number
  friendsCount: number
  connectionsCount: number
  pulsePostsCount: number
  opportunitiesCount: number
  projectsCount: number
  weeklyProfileViews: number
}

export type ProfileCompletionItem = {
  id: string
  label: string
  done: boolean
  weight: number
  href?: string
}

export type ProfileCompletion = {
  percentage: number
  items: ProfileCompletionItem[]
  nextStep: string
}

export type IdentityProfileBundle = {
  profile: DbProfile
  personal: DbPersonalProfile | null
  business: DbBusinessProfile | null
  experience: DbProfileExperience[]
  education: DbProfileEducation[]
  profileSkills: DbProfileSkill[]
  media: DbProfileMedia[]
  stats: ProfileSocialStats
  completion: ProfileCompletion
}

export const BUSINESS_CATEGORIES = [
  'Tutor / Education',
  'Driving instructor',
  'Delivery & logistics',
  'Tailor / Alterations',
  'Home bakery / Food',
  'Hair salon / Barber',
  'Freelancer / Creative',
  'Tech / Startup',
  'Repair & trades',
  'Retail / Shop',
  'Other local business',
] as const

export const PROFILE_TYPE_OPTIONS: { id: ProfileType; label: string; description: string }[] = [
  {
    id: 'personal',
    label: 'Personal Career',
    description: 'Job seeker, employee, freelancer — skills, CV, interview readiness.',
  },
  {
    id: 'business',
    label: 'Business / Project',
    description: 'Small business, shop, tutor, startup — services, gallery, opportunities.',
  },
]
