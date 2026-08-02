/** Whether a managed job is past its expiry date (hidden from Job Finder search). */
export function isJobListingExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) <= new Date()
}

export function isJobListingSearchable(job: {
  active: boolean
  archived: boolean
  expiryDate?: string | null
}): boolean {
  return job.active && !job.archived && !isJobListingExpired(job.expiryDate)
}
