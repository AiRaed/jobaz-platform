/**
 * Job Normalization Helpers
 * Convert provider-specific job formats to UnifiedJob
 */

import type { UnifiedJob } from './types'
import type { AdzunaApiResponse } from './adzuna'
import type { ReedApiResponse } from './reed'

/**
 * Normalize Adzuna job to UnifiedJob format
 */
export function normalizeAdzunaJob(
  job: AdzunaApiResponse['results'][0]
): UnifiedJob {
  return {
    id: `adzuna_${job.id}`,
    title: job.title || 'Untitled Job',
    company: job.company?.display_name || 'Unknown Company',
    location: job.location?.display_name || 'Location not specified',
    description: job.description || '',
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    url: job.redirect_url || '',
    source: 'adzuna',
    jobType: job.category?.label,
    postedAt: job.created,
  }
}

/**
 * Normalize Reed job to UnifiedJob format
 */
export function normalizeReedJob(
  job: ReedApiResponse['results'][0]
): UnifiedJob {
  return {
    id: `reed_${job.jobId}`,
    title: job.jobTitle || 'Untitled Job',
    company: job.employerName || 'Unknown Company',
    location: job.locationName || 'Location not specified',
    description: job.jobDescription || '',
    salaryMin: job.minimumSalary,
    salaryMax: job.maximumSalary,
    url: job.jobUrl || '',
    source: 'reed',
    jobType: job.jobType,
    postedAt: job.date,
  }
}

/**
 * Remove duplicate jobs based on title + company + location
 * Keeps the first occurrence
 */
export function removeDuplicates(jobs: UnifiedJob[]): UnifiedJob[] {
  const seen = new Set<string>()
  const unique: UnifiedJob[] = []

  for (const job of jobs) {
    // Create a unique key from title + company + location (case-insensitive)
    const key = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}_${job.location.toLowerCase().trim()}`
    
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(job)
    }
  }

  return unique
}

