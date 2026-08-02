/** Career Identity Phase 1 — private matching profile enums & defaults */

export const CURRENT_SITUATIONS = [
  'unemployed',
  'employed',
  'student',
  'self_employed',
  'changing_career',
  'looking_extra_income',
] as const

export const MAIN_GOALS = [
  'find_job_now',
  'start_new_career',
  'grow_career',
  'improve_cv',
  'find_course',
  'local_opportunity',
  'side_income',
] as const

export const CAREER_STATUSES = [
  'exploring',
  'job_ready',
  'building_cv',
  'training',
  'applying',
] as const

export const REMOTE_PREFERENCES = ['onsite', 'remote', 'hybrid', 'any'] as const

export const JOB_TYPES = [
  'full_time',
  'part_time',
  'weekend',
  'evening',
  'flexible',
  'temporary',
] as const

export const AVAILABILITY_OPTIONS = [
  'immediate',
  'within_2_weeks',
  'within_1_month',
  'later',
] as const

export const EXPERIENCE_LEVELS = ['none', 'entry', 'intermediate', 'experienced'] as const

export const INTEREST_CATEGORIES = [
  'Security',
  'Care',
  'Warehouse',
  'Driving',
  'Construction',
  'Customer Service',
  'Hospitality',
  'Digital/IT',
  'Education',
  'Business',
] as const

export const COMMON_LICENCES = [
  'SIA',
  'CSCS',
  'Forklift',
  'First Aid',
  'Food Safety',
  'Care Certificate',
  'TEFL',
  'Driving Licence',
] as const

export const BARRIERS = [
  'no_experience',
  'english_confidence',
  'no_transport',
  'no_qualification',
  'childcare',
  'unsure_direction',
  'cv_not_ready',
] as const

export const SITUATION_LABELS: Record<(typeof CURRENT_SITUATIONS)[number], string> = {
  unemployed: 'Unemployed',
  employed: 'Employed',
  student: 'Student',
  self_employed: 'Self-employed',
  changing_career: 'Changing career',
  looking_extra_income: 'Looking for extra income',
}

export const GOAL_LABELS: Record<(typeof MAIN_GOALS)[number], string> = {
  find_job_now: 'Find a job now',
  start_new_career: 'Start a new career',
  grow_career: 'Grow in my career',
  improve_cv: 'Improve my CV',
  find_course: 'Find a course',
  local_opportunity: 'Local opportunity',
  side_income: 'Side income',
}

export const STATUS_LABELS: Record<(typeof CAREER_STATUSES)[number], string> = {
  exploring: 'Exploring',
  job_ready: 'Job ready',
  building_cv: 'Building CV',
  training: 'Training',
  applying: 'Applying',
}

export const REMOTE_LABELS: Record<(typeof REMOTE_PREFERENCES)[number], string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
  any: 'Any',
}

export const JOB_TYPE_LABELS: Record<(typeof JOB_TYPES)[number], string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  weekend: 'Weekend',
  evening: 'Evening',
  flexible: 'Flexible',
  temporary: 'Temporary',
}

export const AVAILABILITY_LABELS: Record<(typeof AVAILABILITY_OPTIONS)[number], string> = {
  immediate: 'Immediate',
  within_2_weeks: 'Within 2 weeks',
  within_1_month: 'Within 1 month',
  later: 'Later',
}

export const EXPERIENCE_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  none: 'No experience yet',
  entry: 'Entry level',
  intermediate: 'Intermediate',
  experienced: 'Experienced',
}

export const BARRIER_LABELS: Record<(typeof BARRIERS)[number], string> = {
  no_experience: 'No experience',
  english_confidence: 'English confidence',
  no_transport: 'No transport',
  no_qualification: 'No qualification',
  childcare: 'Childcare',
  unsure_direction: 'Unsure of direction',
  cv_not_ready: 'CV not ready',
}
