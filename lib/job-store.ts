// Job information storage utility
// NOTE: localStorage persistence has been removed - all functions now use in-memory state only

export interface JobInfo {
  jobTitle: string
  location?: string // Country / City
  experienceLevel?: 'entry' | 'mid' | 'senior'
  skills?: string
}

// In-memory storage (session only, no persistence)
let jobInfoMemory: JobInfo | null = null

export function saveJobInfo(jobInfo: JobInfo): void {
  jobInfoMemory = jobInfo
}

export function getJobInfo(): JobInfo | null {
  return jobInfoMemory
}

export function clearJobInfo(): void {
  jobInfoMemory = null
}

// Helper to format job info for API calls
export function getJobContextForAPI(jobInfo: JobInfo | null): string {
  if (!jobInfo) return ''
  
  // Build a comprehensive job context string
  let context = jobInfo.jobTitle
  
  if (jobInfo.location) {
    context += ` in ${jobInfo.location}`
  }
  
  if (jobInfo.experienceLevel) {
    const levelMap = {
      entry: 'Entry Level',
      mid: 'Mid Level',
      senior: 'Senior Level'
    }
    context += ` (${levelMap[jobInfo.experienceLevel]})`
  }
  
  if (jobInfo.skills) {
    context += ` - Skills: ${jobInfo.skills}`
  }
  
  return context
}

