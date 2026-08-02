import type { CareerDomain } from './types'

export type DiscoveryProfile = {
  education_exists: boolean | null
  education_field: string | null
  education_country: string | null
  work_experience_exists: boolean | null
  work_experience_field: string | null
  years_experience: number | null
  uk_experience: boolean | null
  wants_same_field: boolean | null
  wants_career_change: boolean | null
  target_field: string | null
  english_level: string | null
  computer_level: string | null
  driving_licence: boolean | null
  physical_work_ability: string | null
  customer_facing_comfort: string | null
  urgency: string | null
  willingness_to_train: boolean | null
  location_preference: string | null
  shift_flexibility: string | null
  constraints: string[]
  domain: CareerDomain
  has_portfolio: boolean | null
  tools: string[]
}

export type MissingField = {
  field: keyof DiscoveryProfile | string
  priority: number
  reason: string
}

export type DiscoveryPickResult = {
  question: import('./types').CareerBrainQuestion | null
  reason: string
  missingFields: MissingField[]
  legacyFlowSkipped: boolean
}
