import { JOB_ROUTE_TAGS } from './routeTags'

export type AdminJob = {
  id: string
  title: string
  companyName: string
  location: string
  salary: string
  jobType: string
  description: string
  requirements: string
  benefits: string
  applyUrl: string
  companyWebsite: string
  featured: boolean
  partnerCompany: boolean
  active: boolean
  archived: boolean
  expiryDate: string | null
  routeTags: string[]
  priorityScore: number
  skillsTags: string[]
  createdAt: string
  updatedAt: string
}

export type AdminJobInput = Omit<AdminJob, 'id' | 'createdAt' | 'updatedAt' | 'archived'> & {
  archived?: boolean
}

export const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Apprenticeship',
  'Volunteer',
] as const

export function emptyAdminJobInput(): AdminJobInput {
  return {
    title: '',
    companyName: '',
    location: 'UK',
    salary: '',
    jobType: 'Full-time',
    description: '',
    requirements: '',
    benefits: '',
    applyUrl: '',
    companyWebsite: '',
    featured: false,
    partnerCompany: false,
    active: true,
    expiryDate: null,
    routeTags: [],
    priorityScore: 50,
    skillsTags: [],
  }
}

export function routeTagOptions() {
  return JOB_ROUTE_TAGS
}
