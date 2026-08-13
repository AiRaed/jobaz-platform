import {
  AVAILABILITY_OPTIONS,
  BARRIERS,
  CAREER_STATUSES,
  CURRENT_SITUATIONS,
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  MAIN_GOALS,
  REMOTE_PREFERENCES,
} from './constants'

export type CurrentSituation = (typeof CURRENT_SITUATIONS)[number]
export type MainGoal = (typeof MAIN_GOALS)[number]
export type CareerStatus = (typeof CAREER_STATUSES)[number]
export type RemotePreference = (typeof REMOTE_PREFERENCES)[number]
export type JobType = (typeof JOB_TYPES)[number]
export type Availability = (typeof AVAILABILITY_OPTIONS)[number]
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
export type Barrier = (typeof BARRIERS)[number]

export type UserCareerIdentity = {
  id?: string
  user_id: string
  current_situation: CurrentSituation | null
  main_goal: MainGoal | null
  preferred_route: string | null
  target_role: string | null
  career_status: CareerStatus | null
  preferred_location: string | null
  remote_preference: RemotePreference | null
  job_type: JobType[]
  availability: Availability | null
  has_driving_licence: boolean
  has_own_car: boolean
  willing_to_train: boolean
  preferred_salary: string | null
  skills: string[]
  industries_experience: string[]
  experience_level: ExperienceLevel | null
  languages: string[]
  education_summary: string | null
  qualifications: string[]
  licences: string[]
  interested_in_courses: boolean
  interested_in_jobs: boolean
  interested_in_local_opportunities: boolean
  interested_in_side_income: boolean
  interested_in_business_ideas: boolean
  interested_categories: string[]
  short_bio: string | null
  looking_for: string | null
  barriers: Barrier[]
  /** Optional private mobile — never shown on public profiles */
  mobile_phone: string | null
  mobile_country_code: string | null
  /** Explicit message reminders opt-in — defaults false */
  message_reminders_opt_in: boolean
  message_reminders_opted_in_at: string | null
  message_reminders_opted_out_at: string | null
  message_consent_source: string | null
  created_at?: string
  updated_at?: string
}

export function emptyCareerIdentity(userId: string): UserCareerIdentity {
  return {
    user_id: userId,
    current_situation: null,
    main_goal: null,
    preferred_route: null,
    target_role: null,
    career_status: 'exploring',
    preferred_location: null,
    remote_preference: 'any',
    job_type: [],
    availability: null,
    has_driving_licence: false,
    has_own_car: false,
    willing_to_train: true,
    preferred_salary: null,
    skills: [],
    industries_experience: [],
    experience_level: null,
    languages: [],
    education_summary: null,
    qualifications: [],
    licences: [],
    interested_in_courses: true,
    interested_in_jobs: true,
    interested_in_local_opportunities: true,
    interested_in_side_income: false,
    interested_in_business_ideas: false,
    interested_categories: [],
    short_bio: null,
    looking_for: null,
    barriers: [],
    mobile_phone: null,
    mobile_country_code: null,
    message_reminders_opt_in: false,
    message_reminders_opted_in_at: null,
    message_reminders_opted_out_at: null,
    message_consent_source: 'profile',
  }
}
