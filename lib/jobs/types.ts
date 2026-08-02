/**
 * Unified Job Type — standard format for all job providers
 */

export type JobSource = 'adzuna' | 'reed' | 'jobaz'

export type UnifiedJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
  salaryMin?: number
  salaryMax?: number
  /** Display salary string (JobAZ listings) */
  salary?: string
  url: string
  source: JobSource
  jobType?: string
  /** ISO date string when available from provider */
  postedAt?: string
  requirements?: string
  benefits?: string
  companyWebsite?: string
  featured?: boolean
  partnerCompany?: boolean
  routeTags?: string[]
  /** Future AI ranking */
  priorityScore?: number
  skillsTags?: string[]
}

/** API response shape for job cards */
export type JobSearchResult = {
  id: string
  title: string
  company: string
  location: string
  description: string
  type: string
  link?: string
  salary?: string
  source: JobSource
  featured?: boolean
  partnerCompany?: boolean
  routeTags?: string[]
  postedAt?: string
  postedLabel?: string
  /** Soft rank flag for roles matching the current plan/search target */
  bestMatch?: boolean
}

export interface JobSearchParams {
  keyword: string
  location?: string
  page?: number
  /** Future: filter by career route */
  routeTags?: string[]
}
