/**
 * Parse provider-prefixed job IDs
 * Examples: reed_56185817, adzuna_123456789, jobaz_uuid
 */

import type { JobSource } from './types'

export type JobProvider = JobSource

export interface ParsedJobId {
  provider: JobProvider
  rawId: string
  fullId: string
}

export function parseJobId(jobId: string): ParsedJobId {
  if (!jobId) {
    throw new Error('Job ID is required')
  }

  const jobazMatch = jobId.match(/^jobaz_(.+)$/i)
  if (jobazMatch) {
    return { provider: 'jobaz', rawId: jobazMatch[1], fullId: jobId }
  }

  const reedMatch = jobId.match(/^reed_(.+)$/i)
  if (reedMatch) {
    return { provider: 'reed', rawId: reedMatch[1], fullId: jobId }
  }

  const adzunaMatch = jobId.match(/^adzuna_(.+)$/i)
  if (adzunaMatch) {
    return { provider: 'adzuna', rawId: adzunaMatch[1], fullId: jobId }
  }

  // Legacy: default to reed
  return {
    provider: 'reed',
    rawId: jobId,
    fullId: `reed_${jobId}`,
  }
}
