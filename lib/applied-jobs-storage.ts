// Applied jobs storage utility
// NOTE: localStorage persistence has been removed - all functions now use in-memory state only

export interface AppliedJob {
  id: string              // internal JobAZ id or the external job ID from the API
  title: string
  company: string
  location?: string
  sourceSite?: string     // e.g. Adzuna, Reed, etc.
  jobUrl?: string         // external job link
  createdAt: string       // ISO date string
  status?: 'submitted' | 'in-progress' | 'not-started'
  hasCv?: boolean
  hasCover?: boolean
}

// In-memory storage (session only, no persistence)
let appliedJobsMemory: AppliedJob[] = []

/**
 * Get all applied jobs (in-memory only)
 */
export function getAppliedJobs(): AppliedJob[] {
  return appliedJobsMemory
}

/**
 * Add a job to the applied jobs list (prevents duplicates by id)
 */
export function addAppliedJob(job: AppliedJob): void {
  const existingIndex = appliedJobsMemory.findIndex(j => j.id === job.id)
  
  if (existingIndex >= 0) {
    // Update existing job instead of duplicating
    appliedJobsMemory[existingIndex] = job
  } else {
    // Add new job
    appliedJobsMemory.push(job)
  }
  
  // Dispatch custom event for JAZ to detect state changes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('jobaz-job-state-changed'))
  }
}

/**
 * Remove a job from the applied jobs list by id
 */
export function removeAppliedJob(jobId: string): void {
  appliedJobsMemory = appliedJobsMemory.filter(j => j.id !== jobId)
  
  // Dispatch custom event for JAZ to detect state changes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('jobaz-job-state-changed'))
  }
}

/**
 * Clear all applied jobs
 */
export function clearAppliedJobs(): void {
  appliedJobsMemory = []
}

/**
 * Check if a job has been applied for
 */
export function isJobApplied(jobId: string): boolean {
  return appliedJobsMemory.some(job => job.id === jobId)
}

