/**
 * Helper functions for job matching based on CV data
 */

/**
 * Extract keywords from CV data (summary, skills, and recent job titles)
 * Returns an array of lowercase, cleaned keywords
 */
export function extractCVKeywords(cvData: {
  summary?: string
  skills?: string[]
  experience?: Array<{ jobTitle?: string }>
}): string[] {
  const keywords = new Set<string>()

  // Extract from summary
  if (cvData.summary) {
    const summaryKeywords = extractKeywordsFromText(cvData.summary)
    summaryKeywords.forEach(kw => keywords.add(kw))
  }

  // Add skills directly (they're already keywords)
  if (cvData.skills && Array.isArray(cvData.skills)) {
    cvData.skills.forEach(skill => {
      if (skill && typeof skill === 'string') {
        const cleaned = cleanKeyword(skill)
        if (cleaned) keywords.add(cleaned)
      }
    })
  }

  // Extract from recent job titles (top 3 most recent)
  if (cvData.experience && Array.isArray(cvData.experience)) {
    const recentJobs = cvData.experience.slice(0, 3)
    recentJobs.forEach(exp => {
      if (exp?.jobTitle) {
        const titleKeywords = extractKeywordsFromText(exp.jobTitle)
        titleKeywords.forEach(kw => keywords.add(kw))
      }
    })
  }

  return Array.from(keywords)
}

/**
 * Extract keywords from text by splitting on common separators and cleaning
 */
export function extractKeywordsFromText(text: string): string[] {
  if (!text) return []

  // Split on spaces, commas, dashes, parentheses, etc.
  const words = text
    .toLowerCase()
    .split(/[\s,\-()\/&]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2) // Filter out very short words

  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'way', 'use', 'her', 'she', 'him', 'his', 'this', 'that', 'with', 'have', 'from', 'they', 'been', 'than', 'their', 'these', 'more', 'very', 'what', 'know', 'just', 'into', 'over', 'also', 'back', 'after', 'years', 'years', 'year', 'role', 'position', 'experience', 'working', 'worked', 'work'
  ])

  return words
    .map(word => cleanKeyword(word))
    .filter(word => word && !stopWords.has(word))
}

/**
 * Clean a keyword by removing punctuation and normalizing
 */
function cleanKeyword(word: string): string {
  if (!word) return ''
  return word
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim()
    .toLowerCase()
}

/**
 * Calculate match percentage between CV and job
 * Formula:
 * - Base score calculated from keyword overlap (0-70 points)
 * - +15 bonus if job title contains target role keyword (e.g., "security", "cybersecurity")
 * - -20 penalty if job title contains unrelated categories when query is security/cyber related
 * - Clamp 0-100
 */
export function calculateMatchPercentage(
  cvKeywords: string[],
  jobTitle?: string,
  jobDescription?: string,
  queryUsed?: string
): number {
  // Handle undefined/null safely
  const safeJobTitle = jobTitle || ''
  const safeJobDescription = jobDescription || ''
  const safeCvKeywords = cvKeywords || []
  const safeQueryUsed = (queryUsed || '').toLowerCase()

  // Extract keywords from job title and description
  const jobText = `${safeJobTitle} ${safeJobDescription}`.toLowerCase()
  const jobKeywords = extractKeywordsFromText(jobText)

  // Find overlapping keywords between CV and job
  const cvKeywordSet = new Set(safeCvKeywords.map(kw => kw.toLowerCase()))
  const overlapping = jobKeywords.filter(kw => cvKeywordSet.has(kw))

  // Calculate base score from keyword overlap (0-70 points)
  // More keywords = higher score, with diminishing returns
  let baseScore = 0
  if (overlapping.length > 0) {
    // Calculate overlap ratio
    const overlapRatio = Math.min(overlapping.length / Math.max(safeCvKeywords.length, 1), 1)
    // Base score scales from 0 to 70 based on overlap
    baseScore = Math.round(overlapRatio * 70)
    
    // Bonus for absolute number of matches (up to +10)
    const matchBonus = Math.min(overlapping.length * 2, 10)
    baseScore = Math.min(70, baseScore + matchBonus)
  }

  let score = baseScore

  // Check if query or CV keywords indicate security/cybersecurity role
  const isSecurityQuery = safeQueryUsed.includes('security') || 
                         safeQueryUsed.includes('cyber') ||
                         safeQueryUsed.includes('cybersecurity') ||
                         safeCvKeywords.some(kw => 
                           ['security', 'cyber', 'cybersecurity', 'soc', 'analyst'].includes(kw.toLowerCase())
                         )

  // Get target role keywords (top 3 CV keywords + query keywords)
  const targetRoleKeywords: string[] = []
  safeCvKeywords.slice(0, 3).forEach(kw => targetRoleKeywords.push(kw.toLowerCase()))
  if (safeQueryUsed) {
    const queryKeywords = extractKeywordsFromText(safeQueryUsed)
    queryKeywords.forEach(kw => {
      if (!targetRoleKeywords.includes(kw)) {
        targetRoleKeywords.push(kw)
      }
    })
  }

  const jobTitleLower = safeJobTitle.toLowerCase()

  // Bonus: +15 if job title contains target role keyword
  if (jobTitleLower && targetRoleKeywords.length > 0) {
    const containsTargetRole = targetRoleKeywords.some(keyword =>
      jobTitleLower.includes(keyword)
    )
    if (containsTargetRole) {
      score += 15
    }
  }

  // Penalty: -20 if security query but job title contains unrelated categories
  if (isSecurityQuery && jobTitleLower) {
    const unrelatedCategories = ['warehouse', 'cleaner', 'cleaning', 'delivery', 'driver', 'retail', 'hospitality', 'care', 'nurse']
    const containsUnrelated = unrelatedCategories.some(category =>
      jobTitleLower.includes(category)
    )
    if (containsUnrelated) {
      score = Math.max(0, score - 20)
    }
  }

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Generate a search query from CV data with fallback priority:
 * 1. Target role / latest job title
 * 2. Summary keywords (top 3-6)
 * 3. Top 5 skills
 * 4. Default fallback ("customer service" or "warehouse")
 */
export function generateSearchQueryFromCV(cvData: {
  summary?: string
  skills?: string[]
  experience?: Array<{ jobTitle?: string }>
}): string {
  // Priority 1: Latest job title (most recent experience, not first)
  if (cvData.experience && Array.isArray(cvData.experience) && cvData.experience.length > 0) {
    // Get the most recent job (last in array, not first)
    const latestJob = cvData.experience[cvData.experience.length - 1]
    if (latestJob?.jobTitle && latestJob.jobTitle.trim()) {
      return latestJob.jobTitle.trim()
    }
  }

  // Priority 2: Summary keywords (top 3-6)
  if (cvData.summary && cvData.summary.trim()) {
    const keywords = extractKeywordsFromText(cvData.summary)
    const topKeywords = keywords.slice(0, 6) // Get top 3-6 keywords
    if (topKeywords.length > 0) {
      return topKeywords.join(' ')
    }
  }

  // Priority 3: Top 5 skills
  if (cvData.skills && Array.isArray(cvData.skills) && cvData.skills.length > 0) {
    const topSkills = cvData.skills.slice(0, 5).filter(skill => skill && skill.trim())
    if (topSkills.length > 0) {
      return topSkills.join(' ')
    }
  }

  // Priority 4: Default fallback — only when there is truly no usable content
  // Prefer empty-ish warehouse over customer service when no CV signals exist.
  // Jobs For You uses inferCvPrimaryQuery instead and never lands here for Animation CVs.
  const hasAnyData = !!(
    cvData.summary?.trim() ||
    (cvData.skills && cvData.skills.length > 0) ||
    (cvData.experience && cvData.experience.length > 0)
  )
  
  return hasAnyData ? 'warehouse operative' : 'warehouse operative'
}

/**
 * Extract keywords from summary for fallback search (helper for debug info)
 */
export function extractSummaryKeywords(cvData: {
  summary?: string
}): string[] {
  if (!cvData.summary || !cvData.summary.trim()) {
    return []
  }
  const keywords = extractKeywordsFromText(cvData.summary)
  return keywords.slice(0, 6)
}

/**
 * Filter jobs by relevance based on keyword matching
 * @param jobs Array of jobs to filter
 * @param keywords Keywords to match against
 * @param queryUsed The search query used (for prioritizing security/cyber roles)
 * @param filterMode 'strict' (must match 2 keywords), 'balanced' (1 keyword), 'loose' (no filter)
 * @returns Filtered array of jobs
 */
export function filterJobsByRelevance(
  jobs: Array<{ title?: string; description?: string }>,
  keywords: string[],
  queryUsed?: string,
  filterMode: 'strict' | 'balanced' | 'loose' = 'balanced'
): Array<{ title?: string; description?: string }> {
  if (filterMode === 'loose' || keywords.length === 0) {
    return jobs
  }

  const safeKeywords = keywords.map(kw => kw.toLowerCase())
  const safeQueryUsed = (queryUsed || '').toLowerCase()
  
  // If query includes security/cyber, prioritize titles with security-related keywords
  const isSecurityQuery = safeQueryUsed.includes('security') || 
                         safeQueryUsed.includes('cyber') ||
                         safeQueryUsed.includes('cybersecurity')
  
  const securityKeywords = ['security', 'cyber', 'cybersecurity', 'soc', 'analyst', 'it', 'support']

  const filtered = jobs.filter(job => {
    const title = (job.title || '').toLowerCase()
    const description = (job.description || '').toLowerCase()
    const combinedText = `${title} ${description}`

    // Count keyword matches
    let matchCount = 0
    safeKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        matchCount++
      }
    })

    // Special handling for security queries: prioritize security-related titles
    if (isSecurityQuery && title) {
      const hasSecurityKeyword = securityKeywords.some(sk => title.includes(sk))
      if (hasSecurityKeyword) {
        // Boost: if title has security keyword, count it as +1 match
        matchCount += 1
      }
    }

    // Apply filter based on mode
    if (filterMode === 'strict') {
      return matchCount >= 2
    } else if (filterMode === 'balanced') {
      return matchCount >= 1
    } else {
      return true // loose mode (shouldn't reach here, but just in case)
    }
  })

  return filtered
}

/**
 * Detect if a job is a training/bootcamp/programme
 * Checks title, company, and description for training indicators
 * @param job Job object with title, company, and description
 * @returns true if job is detected as training, false otherwise
 */
export function isTrainingJob(job: {
  title?: string
  company?: string
  description?: string
}): boolean {
  const title = (job.title || '').toLowerCase()
  const company = (job.company || '').toLowerCase()
  const description = (job.description || '').toLowerCase()
  
  // Training indicators to check
  const trainingKeywords = [
    'trainee',
    'bootcamp',
    'course',
    'academy',
    'placement programme',
    'placement program',
    'training programme',
    'training program',
    'programme',
    'program',
    'no experience required',
    'job guaranteed',
    'certification',
    'learn',
    'course2career',
    'course to career'
  ]
  
  // Check if company name includes training-related terms
  const companyTrainingKeywords = ['training', 'academy']
  
  // Check title, company, or description for any training keywords
  const combinedText = `${title} ${company} ${description}`
  
  // Check for training keywords in any field
  const hasTrainingKeyword = trainingKeywords.some(keyword => {
    return title.includes(keyword) || 
           description.includes(keyword) || 
           combinedText.includes(keyword)
  })
  
  // Check if company name suggests training
  const companySuggestsTraining = companyTrainingKeywords.some(keyword => 
    company.includes(keyword)
  )
  
  return hasTrainingKeyword || companySuggestsTraining
}

