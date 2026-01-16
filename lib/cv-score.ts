import type { CvData } from '@/app/cv-builder-v2/page'

export interface CvScoreResult {
  score: number
  completionScore: number
  qualityScore: number
  level: 'Strong' | 'Good' | 'Needs Improvement'
  fixes: string[]
  isGated: boolean
  gateMessage?: string
}

/**
 * Check if text is a placeholder or template text (not real content)
 */
function isPlaceholder(text: string): boolean {
  if (!text || text.trim().length === 0) return true
  
  const lower = text.toLowerCase().trim()
  const placeholders = [
    'i work hard',
    'i am good',
    'lorem ipsum',
    'enter your',
    'add your',
    'your name',
    'your email',
    'your phone',
    'example',
    'sample',
    'test',
    'placeholder',
  ]
  
  // Check if text matches common placeholders
  for (const placeholder of placeholders) {
    if (lower.includes(placeholder) && lower.length < 30) {
      return true
    }
  }
  
  // Very short text (< 10 chars) is likely placeholder
  if (lower.length < 10) return true
  
  return false
}

/**
 * Count real words (excluding placeholders)
 */
function countRealWords(text: string): number {
  if (!text || isPlaceholder(text)) return 0
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length
}

/**
 * Count real bullet points (>= 5 words each)
 */
function countRealBullets(bullets: string[]): number {
  if (!Array.isArray(bullets)) return 0
  return bullets.filter((bullet) => {
    const words = bullet.trim().split(/\s+/).filter((w) => w.length > 0)
    return words.length >= 5 && !isPlaceholder(bullet)
  }).length
}

/**
 * Compute CV score using stricter completion gate system.
 * 
 * Scoring breakdown:
 * - completionScore (0-60): Based on filled sections and realistic thresholds
 * - qualityScore (0-40): Based on writing quality + ATS strength + grammar/spelling
 * 
 * Completion Gate:
 * - If summaryWordCount < 20 OR experienceCount == 0 OR skillsCount < 3,
 *   then finalScore MUST be capped at 15 maximum.
 * 
 * Level mapping:
 * - 80-100: Strong
 * - 55-79: Good
 * - 0-54: Needs Improvement
 */
export function computeCvScore(cv: CvData): CvScoreResult {
  let completionScore = 0
  let qualityScore = 0
  const fixes: string[] = []

  // ===== COMPLETION SCORE (0-60) =====
  
  // 1. Summary (0-15 points)
  const summary = cv.summary?.trim() || ''
  const summaryWordCount = countRealWords(summary)
  if (summaryWordCount >= 60 && summaryWordCount <= 100) {
    completionScore += 15
  } else if (summaryWordCount >= 40 && summaryWordCount < 60) {
    completionScore += 10
    fixes.push(`Expand summary to 60-100 words (currently ${summaryWordCount})`)
  } else if (summaryWordCount >= 20 && summaryWordCount < 40) {
    completionScore += 5
    fixes.push(`Summary too short - expand to 60-100 words (currently ${summaryWordCount})`)
  } else if (summaryWordCount > 0) {
    completionScore += 2
    fixes.push(`Add a professional summary (60-100 words recommended, currently ${summaryWordCount})`)
  } else {
    fixes.push('Add a professional summary (60-100 words)')
  }

  // 2. Experience count (0-15 points)
  const experience = cv.experience || []
  const realExperience = experience.filter((exp) => {
    // Count real bullets (>= 5 words each)
    const realBullets = countRealBullets(exp.bullets || [])
    return realBullets > 0 || (!isPlaceholder(exp.jobTitle || '') && !isPlaceholder(exp.company || ''))
  })
  const experienceCount = realExperience.length
  
  if (experienceCount >= 2) {
    completionScore += 15
  } else if (experienceCount === 1) {
    completionScore += 8
    fixes.push('Add at least one more work experience')
  } else {
    fixes.push('Add at least 2 work experiences')
  }

  // 3. Bullets per experience (0-10 points)
  if (experienceCount > 0) {
    let totalRealBullets = 0
    realExperience.forEach((exp) => {
      totalRealBullets += countRealBullets(exp.bullets || [])
    })
    const avgBullets = totalRealBullets / experienceCount
    if (avgBullets >= 3) {
      completionScore += 10
    } else if (avgBullets >= 2) {
      completionScore += 7
      fixes.push(`Add more bullet points per experience (avg: ${avgBullets.toFixed(1)}, target: 3+)`)
    } else if (avgBullets >= 1) {
      completionScore += 4
      fixes.push(`Add more bullet points per experience (avg: ${avgBullets.toFixed(1)}, target: 3+)`)
    } else {
      fixes.push(`Add bullet points to each experience (avg: ${avgBullets.toFixed(1)})`)
    }
  }

  // 4. Skills count (0-10 points)
  const skills = (cv.skills || []).filter((skill) => skill.trim().length > 0 && !isPlaceholder(skill))
  const skillsCount = skills.length
  if (skillsCount >= 10) {
    completionScore += 10
  } else if (skillsCount >= 6) {
    completionScore += 7
    fixes.push(`Add more skills (currently ${skillsCount}, target: 10+)`)
  } else if (skillsCount >= 3) {
    completionScore += 4
    fixes.push(`Add more skills (currently ${skillsCount}, target: 10+)`)
  } else {
    fixes.push(`Add more skills (currently ${skillsCount}, target: 10+)`)
  }

  // 5. Personal info (0-5 points)
  const personalInfo = cv.personalInfo || {}
  const hasEmail = !!(personalInfo.email?.trim() && !isPlaceholder(personalInfo.email))
  const hasPhone = !!(personalInfo.phone?.trim() && !isPlaceholder(personalInfo.phone))
  if (hasEmail && hasPhone) {
    completionScore += 5
  } else if (hasEmail || hasPhone) {
    completionScore += 2
    if (!hasEmail) fixes.push('Add your email address')
    if (!hasPhone) fixes.push('Add your phone number')
  } else {
    fixes.push('Add your email address and phone number')
  }

  // 6. Education (0-5 points)
  const education = (cv.education || []).filter((edu) => {
    return !isPlaceholder(edu.degree || '') || !isPlaceholder(edu.school || '')
  })
  if (education.length > 0) {
    completionScore += 5
  } else {
    fixes.push('Add your education details')
  }

  // ===== QUALITY SCORE (0-40) =====
  
  // 1. Summary quality (0-15 points)
  if (summaryWordCount >= 60 && summaryWordCount <= 100) {
    qualityScore += 15
  } else if (summaryWordCount >= 40) {
    qualityScore += 10
  } else if (summaryWordCount >= 20) {
    qualityScore += 5
  }

  // 2. Action-oriented language check (0-10 points)
  // Simple heuristic: check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'created', 'improved', 'achieved', 'designed', 'implemented', 'optimized', 'delivered', 'executed', 'built', 'launched', 'established', 'increased', 'reduced', 'transformed', 'collaborated', 'analyzed', 'resolved']
  let hasActionVerbs = false
  if (summary) {
    const lowerSummary = summary.toLowerCase()
    hasActionVerbs = actionVerbs.some((verb) => lowerSummary.includes(verb))
  }
  if (!hasActionVerbs && experienceCount > 0) {
    // Check experience bullets
    realExperience.forEach((exp) => {
      (exp.bullets || []).forEach((bullet) => {
        const lowerBullet = bullet.toLowerCase()
        if (actionVerbs.some((verb) => lowerBullet.includes(verb))) {
          hasActionVerbs = true
        }
      })
    })
  }
  if (hasActionVerbs) {
    qualityScore += 10
  } else if (experienceCount > 0 || summaryWordCount >= 20) {
    qualityScore += 5
    fixes.push('Add more action-oriented language (e.g., "led", "developed", "achieved")')
  }

  // 3. ATS Readability (0-10 points)
  const hasName = !!(personalInfo.fullName?.trim() && !isPlaceholder(personalInfo.fullName))
  const hasClearDates = realExperience.some((exp) => exp.startDate || exp.endDate)
  if (hasName && hasClearDates && experienceCount >= 2) {
    qualityScore += 10
  } else if (hasName && hasClearDates) {
    qualityScore += 7
  } else if (hasName) {
    qualityScore += 4
    if (!hasClearDates) fixes.push('Add dates to work experience for better ATS parsing')
  } else {
    fixes.push('Ensure your full name is present')
  }

  // 4. Additional sections bonus (0-5 points)
  let additionalSections = 0
  const projects = (cv.projects || []).filter((p) => !isPlaceholder(p.name || '') || !isPlaceholder(p.description || ''))
  const certifications = (cv.certifications || []).filter((c) => !isPlaceholder(c))
  const publications = (cv.publications || []).filter((p) => !isPlaceholder(p.title || ''))
  const languages = (cv.languages || []).filter((l) => !isPlaceholder(l))
  if (projects.length > 0) additionalSections++
  if (certifications.length > 0) additionalSections++
  if (publications.length > 0) additionalSections++
  if (languages.length > 0) additionalSections++
  qualityScore += Math.min(5, additionalSections * 1.25)
  if (additionalSections === 0 && experienceCount >= 2) {
    fixes.push('Consider adding projects, certifications, or languages')
  }

  // ===== COMPLETION GATE =====
  let finalScore = completionScore + qualityScore
  let isGated = false
  let gateMessage: string | undefined

  // Gate rule: If summaryWordCount < 20 OR experienceCount == 0 OR skillsCount < 3, cap at 15
  if (summaryWordCount < 20 || experienceCount === 0 || skillsCount < 3) {
    if (finalScore > 15) {
      isGated = true
      gateMessage = 'Incomplete CV — fill basics to unlock full score'
      finalScore = 15
    }
  }

  // Clamp to 0-100
  finalScore = Math.max(0, Math.min(100, finalScore))
  completionScore = Math.max(0, Math.min(60, completionScore))
  qualityScore = Math.max(0, Math.min(40, qualityScore))

  // Determine level
  let level: 'Strong' | 'Good' | 'Needs Improvement'
  if (finalScore >= 80) {
    level = 'Strong'
  } else if (finalScore >= 55) {
    level = 'Good'
  } else {
    level = 'Needs Improvement'
  }

  // Prioritize fixes: missing essentials first
  const essentialFixes = fixes.filter((f) => 
    f.includes('summary') || f.includes('experience') || f.includes('skills')
  )
  const otherFixes = fixes.filter((f) => !essentialFixes.includes(f))
  const prioritizedFixes = [...essentialFixes, ...otherFixes].slice(0, 5)

  return {
    score: finalScore,
    completionScore: Math.round(completionScore),
    qualityScore: Math.round(qualityScore),
    level,
    fixes: prioritizedFixes,
    isGated,
    gateMessage,
  }
}
