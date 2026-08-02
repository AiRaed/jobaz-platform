import { fetchAdzunaJobs } from '@/lib/jobs/adzuna'
import { fetchReedJobs } from '@/lib/jobs/reed'
import { normalizeAdzunaJob, normalizeReedJob } from '@/lib/jobs/normalize'
import { formatPostedLabel, formatSalaryLabel } from '@/lib/jobs/job-display'
import type { JobSearchResult, UnifiedJob } from '@/lib/jobs/types'

export const LANDING_DEFAULT_KEYWORDS = [
  'warehouse',
  'care assistant',
  'security',
  'delivery driver',
  'customer service',
  'administrator',
] as const

const LANDING_LIMIT = 12

function formatSalary(min?: number, max?: number, display?: string): string | undefined {
  return formatSalaryLabel(display, min, max)
}

export function isValidLandingJob(job: UnifiedJob): boolean {
  if (!job.title?.trim()) return false
  if (!job.id?.trim()) return false
  if ((job.source === 'reed' || job.source === 'adzuna') && !job.url?.trim()) return false
  return true
}

export function dedupeLandingJobs(jobs: UnifiedJob[]): UnifiedJob[] {
  const seen = new Set<string>()
  const unique: UnifiedJob[] = []

  for (const job of jobs) {
    const urlKey = job.url?.toLowerCase().trim() || ''
    const metaKey = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}_${job.location.toLowerCase().trim()}`
    const key = urlKey || metaKey

    if (seen.has(key)) continue
    seen.add(key)
    if (urlKey) seen.add(metaKey)
    unique.push(job)
  }

  return unique
}

export function sortLandingJobs(jobs: UnifiedJob[]): UnifiedJob[] {
  return [...jobs].sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0
    if (dateB !== dateA) return dateB - dateA

    const salA = a.salary || a.salaryMin || a.salaryMax ? 1 : 0
    const salB = b.salary || b.salaryMin || b.salaryMax ? 1 : 0
    if (salB !== salA) return salB - salA

    const compA = a.company && !a.company.toLowerCase().includes('unknown') ? 1 : 0
    const compB = b.company && !b.company.toLowerCase().includes('unknown') ? 1 : 0
    if (compB !== compA) return compB - compA

    return a.title.localeCompare(b.title)
  })
}

/** Round-robin across keyword batches for a mixed default feed. */
export function pickDiverseJobs(batches: UnifiedJob[][], limit = LANDING_LIMIT): UnifiedJob[] {
  const picked: UnifiedJob[] = []
  const seen = new Set<string>()
  const maxLen = Math.max(0, ...batches.map((b) => b.length))

  for (let i = 0; i < maxLen && picked.length < limit; i++) {
    for (const batch of batches) {
      const job = batch[i]
      if (!job) continue
      const key = job.id
      if (seen.has(key)) continue
      seen.add(key)
      picked.push(job)
      if (picked.length >= limit) break
    }
  }

  return picked
}

function toLandingResult(job: UnifiedJob): JobSearchResult {
  return {
    id: job.id,
    title: job.title.trim(),
    company: job.company,
    location: job.location,
    description: job.description,
    type: job.jobType?.trim() || 'Not specified',
    link: job.url || undefined,
    salary: formatSalary(job.salaryMin, job.salaryMax, job.salary),
    source: job.source,
    featured: job.featured,
    partnerCompany: job.partnerCompany,
    routeTags: job.routeTags,
    postedAt: job.postedAt,
    postedLabel: formatPostedLabel(job.postedAt),
  }
}

async function fetchKeywordBatch(
  keyword: string,
  location: string,
  options?: { pageSize?: number }
): Promise<{
  jobs: UnifiedJob[]
  reedOk: boolean
  adzunaOk: boolean
}> {
  const pageSize = options?.pageSize ?? 20
  const [adzunaResult, reedResult] = await Promise.allSettled([
    fetchAdzunaJobs({ keyword, location, page: 1, pageSize }),
    fetchReedJobs({ keyword, location, page: 1, pageSize }),
  ])

  const jobs: UnifiedJob[] = []
  let reedOk = false
  let adzunaOk = false

  if (adzunaResult.status === 'fulfilled') {
    adzunaOk = true
    jobs.push(...adzunaResult.value.map(normalizeAdzunaJob))
  }

  if (reedResult.status === 'fulfilled') {
    reedOk = true
    jobs.push(...reedResult.value.map(normalizeReedJob))
  }

  const valid = dedupeLandingJobs(jobs.filter(isValidLandingJob))
  return { jobs: sortLandingJobs(valid), reedOk, adzunaOk }
}

export type LandingSearchResponse = {
  results: JobSearchResult[]
  providers: { reed: boolean; adzuna: boolean }
  error?: string
}

export async function searchLandingJobs(options: {
  keyword?: string
  location?: string
  defaultBrowse?: boolean
}): Promise<LandingSearchResponse> {
  const location = options.location?.trim() || 'UK'
  const keywords = options.defaultBrowse
    ? [...LANDING_DEFAULT_KEYWORDS]
    : options.keyword?.trim()
      ? [options.keyword.trim()]
      : []

  if (!keywords.length) {
    return {
      results: [],
      providers: { reed: false, adzuna: false },
      error: 'Keyword is required',
    }
  }

  const landingPageSize = options.defaultBrowse ? 5 : 20
  const batches: Awaited<ReturnType<typeof fetchKeywordBatch>>[] = []

  if (options.defaultBrowse) {
    // Two keywords at a time — mixed feed without hammering external APIs.
    for (let i = 0; i < keywords.length; i += 2) {
      const pair = keywords.slice(i, i + 2)
      const pairBatches = await Promise.all(
        pair.map((keyword) => fetchKeywordBatch(keyword, location, { pageSize: landingPageSize }))
      )
      batches.push(...pairBatches)
    }
  } else {
    batches.push(
      ...(await Promise.all(
        keywords.map((keyword) => fetchKeywordBatch(keyword, location, { pageSize: landingPageSize }))
      ))
    )
  }

  let reedOk = false
  let adzunaOk = false
  for (const batch of batches) {
    reedOk = reedOk || batch.reedOk
    adzunaOk = adzunaOk || batch.adzunaOk
  }

  if (!reedOk && !adzunaOk) {
    return {
      results: [],
      providers: { reed: false, adzuna: false },
      error: 'Unable to load jobs right now. Please try again.',
    }
  }

  const keywordBatches = batches.map((b) => b.jobs)
  const merged = options.defaultBrowse
    ? pickDiverseJobs(keywordBatches, LANDING_LIMIT)
    : sortLandingJobs(dedupeLandingJobs(keywordBatches.flat())).slice(0, LANDING_LIMIT)

  const results = merged.map(toLandingResult).filter((j) => j.title && j.id)

  return {
    results,
    providers: { reed: reedOk, adzuna: adzunaOk },
    error: results.length === 0 ? 'No jobs found. Try a different keyword or location.' : undefined,
  }
}
