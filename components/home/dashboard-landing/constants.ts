import { UK_CITIES } from '@/lib/uk-cities'

export type SearchMode = 'jobs' | 'courses' | 'opportunities' | 'pulse'

export const SEARCH_MODES: { id: SearchMode; label: string }[] = [
  { id: 'courses', label: 'Courses & Licences' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'pulse', label: 'Pulse' },
]

export const COURSE_LOCATIONS = ['UK (Anywhere)', 'Online', ...UK_CITIES.filter((c) => c !== 'UK (Anywhere)')]

export function buildJobSearchUrl(query: string, location: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('query', query.trim())
  if (location && location !== 'UK (Anywhere)') params.set('location', location)
  const qs = params.toString()
  return `/job-finder${qs ? `?${qs}` : ''}`
}

export function buildCourseSearchUrl(query: string, location: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (location === 'Online') params.set('delivery', 'online')
  else if (location && location !== 'UK (Anywhere)') params.set('location', location)
  const qs = params.toString()
  return `/career-hub${qs ? `?${qs}` : ''}`
}

export function buildOpportunitySearchUrl(query: string, location: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (location && location !== 'UK (Anywhere)') params.set('location', location)
  const qs = params.toString()
  return `/opportunities${qs ? `?${qs}` : ''}`
}
