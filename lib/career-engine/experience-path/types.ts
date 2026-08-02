import type { EnglishLevel } from '@/lib/career-engine/shared/planTypes'

export type ExperienceIndustryId =
  | 'electrician'
  | 'accountant'
  | 'chef'
  | 'sales'
  | 'software_developer'
  | 'healthcare'
  | 'warehouse_logistics'
  | 'security'
  | 'driving_transport'
  | 'construction'
  | 'hospitality'
  | 'office_admin'
  | 'manufacturing_engineering'
  | 'customer_service'
  | 'marketing_digital'
  | 'education_teaching'
  | 'hr_recruitment'
  | 'cleaning_facilities'
  | 'other'

export type YearsExperience = '1_2' | '3_5' | '6_10' | '10_plus'

export type HighestPosition =
  | 'skilled_worker'
  | 'senior_specialist'
  | 'supervisor'
  | 'manager'
  | 'director'

export type ExperienceCountry = 'uk' | 'outside_uk'

export type YesNo = 'yes' | 'no'

export type DrivingLicence = 'yes' | 'no' | 'not_applicable'

export type ExperiencePathAnswers = {
  industry: ExperienceIndustryId
  experience_specialisation: string
  experience_specialisation_other?: string
  years_experience: YearsExperience
  experience_country: ExperienceCountry
  english_level: EnglishLevel
  uk_work_experience: YesNo
  open_to_certifications: YesNo
  preferred_location: string
  /** Legacy / optional — inferred from profession interview when absent */
  highest_position?: HighestPosition
  management_experience?: YesNo
  driving_licence?: DrivingLicence
} & Record<string, string | undefined>

export type ExperienceTier = 'skilled' | 'senior' | 'supervisor' | 'manager'

export type { CareerEnginePlanResult as ExperiencePathResult } from '@/lib/career-engine/shared/planTypes'
