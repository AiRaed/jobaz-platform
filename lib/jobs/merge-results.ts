import type { JobSearchResult, UnifiedJob } from './types'

function toSearchResult(job: UnifiedJob): JobSearchResult {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    type: job.jobType || 'Full-time',
    link: job.url || undefined,
    salary: job.salary,
    source: job.source,
    featured: job.featured,
    partnerCompany: job.partnerCompany,
    routeTags: job.routeTags,
    postedAt: job.postedAt,
  }
}

/**
 * Merge JobAZ managed jobs with external API jobs.
 * Order: Featured JobAZ → Partner JobAZ → External → other JobAZ
 */
export function mergeJobSearchResults(
  jobazJobs: UnifiedJob[],
  externalJobs: UnifiedJob[]
): JobSearchResult[] {
  const featured = jobazJobs.filter((j) => j.featured)
  const partner = jobazJobs.filter((j) => j.partnerCompany && !j.featured)
  const otherJobaz = jobazJobs.filter((j) => !j.featured && !j.partnerCompany)

  const ordered = [...featured, ...partner, ...externalJobs, ...otherJobaz]
  return ordered.map(toSearchResult)
}
