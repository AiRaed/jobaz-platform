/**
 * Shared CV readiness — used by Documents, CV Builder, and My Plan.
 * Scores real CV content only. Career plan may supply target keywords,
 * but never inflates the score unless those keywords appear in the CV.
 */

export type CvReadinessStatus =
  | 'missing'
  | 'started'
  | 'needs_work'
  | 'ready_to_improve'
  | 'application_ready'

export type CvReadinessSeverity = 'critical' | 'important' | 'nice_to_have'

export type CvReadinessCheck = {
  key: string
  label: string
  passed: boolean
  severity: CvReadinessSeverity
}

export type CareerPlanForCvReadiness = {
  targetRole?: string | null
  routeTitle?: string | null
  focusKeywords?: string[] | null
} | null

export type CvReadinessResult = {
  score: number
  status: CvReadinessStatus
  checks: CvReadinessCheck[]
  missing: string[]
  suggestedNextStep: string
  targetKeywords: string[]
  /** Display labels for UI */
  statusLabel: string
  summaryLine: string
}

/** Accept nested CvData or flattened dashboard CV. */
export type CvReadinessInput =
  | {
      personalInfo?: {
        fullName?: string
        email?: string
        phone?: string
        location?: string
      }
      fullName?: string
      email?: string
      phone?: string
      city?: string
      location?: string
      summary?: string
      skills?: string[] | string
      experience?: Array<{
        jobTitle?: string
        company?: string
        description?: string
        bullets?: string[]
        startDate?: string
        endDate?: string
      }>
      education?: Array<{
        degree?: string
        school?: string
        field?: string
        year?: string
        details?: string
      }>
      certifications?: Array<string | { title?: string; name?: string }>
    }
  | null
  | undefined

const STATUS_LABELS: Record<CvReadinessStatus, string> = {
  missing: 'Missing',
  started: 'Started',
  needs_work: 'Needs work',
  ready_to_improve: 'Ready to improve',
  application_ready: 'Application ready',
}

function isPlaceholder(text: string): boolean {
  const lower = text.toLowerCase().trim()
  if (!lower) return true
  const placeholders = [
    'i work hard',
    'lorem ipsum',
    'enter your',
    'add your',
    'your name',
    'your email',
    'example',
    'sample',
    'placeholder',
  ]
  for (const p of placeholders) {
    if (lower.includes(p) && lower.length < 40) return true
  }
  return false
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function normalizeCv(cv: NonNullable<CvReadinessInput>) {
  const fullName = (cv.personalInfo?.fullName || cv.fullName || '').trim()
  const email = (cv.personalInfo?.email || cv.email || '').trim()
  const phone = (cv.personalInfo?.phone || cv.phone || '').trim()
  const location = (
    cv.personalInfo?.location ||
    cv.location ||
    cv.city ||
    ''
  ).trim()
  const summary = (cv.summary || '').trim()

  let skills: string[] = []
  if (Array.isArray(cv.skills)) {
    skills = cv.skills.map((s) => String(s).trim()).filter(Boolean)
  } else if (typeof cv.skills === 'string') {
    skills = cv.skills
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const experience = (cv.experience || []).map((e) => ({
    jobTitle: (e.jobTitle || '').trim(),
    company: (e.company || '').trim(),
    description: (e.description || '').trim(),
    bullets: (e.bullets || []).map((b) => String(b).trim()).filter(Boolean),
  }))

  const education = (cv.education || []).map((e) => ({
    degree: (e.degree || '').trim(),
    school: (e.school || '').trim(),
    field: (e.field || '').trim(),
  }))

  const certifications = (cv.certifications || [])
    .map((c) => {
      if (typeof c === 'string') return c.trim()
      return `${c.title || ''} ${c.name || ''}`.trim()
    })
    .filter(Boolean)

  return { fullName, email, phone, location, summary, skills, experience, education, certifications }
}

function experienceBlob(n: ReturnType<typeof normalizeCv>): string {
  return n.experience
    .map((e) => [e.jobTitle, e.company, e.description, ...e.bullets].join(' '))
    .join(' ')
    .toLowerCase()
}

function contentBlob(n: ReturnType<typeof normalizeCv>): string {
  return [
    n.summary,
    n.skills.join(' '),
    experienceBlob(n),
    n.fullName,
    n.location,
    n.certifications.join(' '),
  ]
    .join(' ')
    .toLowerCase()
}

function hasMeaningfulContent(n: ReturnType<typeof normalizeCv>): boolean {
  if (n.summary && !isPlaceholder(n.summary) && wordCount(n.summary) >= 8) return true
  if (n.skills.length > 0) return true
  if (
    n.experience.some(
      (e) => e.jobTitle || e.company || e.description || e.bullets.length > 0
    )
  ) {
    return true
  }
  if (n.education.some((e) => e.degree || e.school)) return true
  if (n.certifications.length > 0) return true
  if (n.fullName || n.email || n.phone) return true
  return false
}

function statusFromScore(score: number, hasCv: boolean): CvReadinessStatus {
  if (!hasCv) return 'missing'
  if (score <= 15) return 'started'
  if (score < 45) return 'needs_work'
  if (score < 80) return 'ready_to_improve'
  return 'application_ready'
}

function summaryLineFor(status: CvReadinessStatus, score: number): string {
  switch (status) {
    case 'missing':
      return 'You do not have a saved CV yet. Start your CV first so JobAZ can help you apply faster.'
    case 'started':
      return 'Your CV is started, but it needs key sections before it is ready.'
    case 'needs_work':
      return 'Your CV is started, but not ready yet. Add stronger sections before you apply.'
    case 'ready_to_improve':
      return 'Your CV is saved. Improve it for your current plan before high-volume applications.'
    case 'application_ready':
      return score >= 90
        ? 'Your CV is application ready. Keep it updated as you apply.'
        : 'Your CV covers the essentials for applications. Keep tuning it for each role.'
  }
}

/**
 * Calculate CV readiness from real CV fields.
 * Career plan keywords only award points when they appear in the CV text.
 */
export function calculateCvReadiness(
  cv: CvReadinessInput,
  careerPlan?: CareerPlanForCvReadiness
): CvReadinessResult {
  const targetKeywords = (careerPlan?.focusKeywords || [])
    .map((k) => k.trim())
    .filter((k) => k.length >= 3)
    .slice(0, 10)

  if (!cv) {
    return {
      score: 0,
      status: 'missing',
      statusLabel: STATUS_LABELS.missing,
      summaryLine: summaryLineFor('missing', 0),
      checks: [
        { key: 'saved', label: 'Saved CV', passed: false, severity: 'critical' },
        { key: 'contact', label: 'Contact details', passed: false, severity: 'critical' },
        { key: 'summary', label: 'Profile summary', passed: false, severity: 'critical' },
        { key: 'experience', label: 'Work experience', passed: false, severity: 'critical' },
        { key: 'education', label: 'Education', passed: false, severity: 'important' },
        { key: 'skills', label: 'Skills section', passed: false, severity: 'critical' },
        { key: 'keywords', label: 'Target role keywords', passed: false, severity: 'important' },
        { key: 'export', label: 'Formatting / export readiness', passed: false, severity: 'nice_to_have' },
      ],
      missing: ['Saved CV', 'Contact details', 'Profile summary', 'Work experience', 'Skills'],
      suggestedNextStep: 'Create your Main CV in CV Builder.',
      targetKeywords,
    }
  }

  const n = normalizeCv(cv)
  const checks: CvReadinessCheck[] = []
  let score = 0

  // +5 saved CV exists
  const exists = true
  score += 5
  checks.push({
    key: 'saved',
    label: 'Saved CV',
    passed: true,
    severity: 'critical',
  })

  // Nearly empty saved CV: keep score in the 5–15 band unless real sections exist
  const meaningful = hasMeaningfulContent(n)

  // +15 contact
  const contactOk = Boolean(n.fullName && n.email)
  if (contactOk) {
    score += 15
  } else if (n.fullName || n.email || n.phone) {
    score += 5
  }
  checks.push({
    key: 'contact',
    label: 'Contact details complete',
    passed: contactOk,
    severity: 'critical',
  })

  // +15 profile summary meaningful
  const summaryWords = !isPlaceholder(n.summary) ? wordCount(n.summary) : 0
  const summaryOk = summaryWords >= 40
  if (summaryOk) {
    score += 15
  } else if (summaryWords >= 15) {
    score += 7
  } else if (summaryWords > 0) {
    score += 3
  }
  checks.push({
    key: 'summary',
    label: 'Profile summary meaningful',
    passed: summaryOk,
    severity: 'critical',
  })

  // +20 work experience
  const expOk = n.experience.some(
    (e) =>
      (e.jobTitle && !isPlaceholder(e.jobTitle)) ||
      (e.company && !isPlaceholder(e.company)) ||
      e.bullets.some((b) => wordCount(b) >= 5) ||
      (e.description && wordCount(e.description) >= 8)
  )
  if (expOk) {
    score += 20
  }
  checks.push({
    key: 'experience',
    label: 'Work experience added',
    passed: expOk,
    severity: 'critical',
  })

  // +10 education
  const eduOk = n.education.some((e) => Boolean(e.degree || e.school || e.field))
  if (eduOk) {
    score += 10
  }
  checks.push({
    key: 'education',
    label: 'Education added',
    passed: eduOk,
    severity: 'important',
  })

  // +15 skills
  const skillsOk = n.skills.length >= 3
  if (skillsOk) {
    score += 15
  } else if (n.skills.length > 0) {
    score += 6
  }
  checks.push({
    key: 'skills',
    label: 'Skills section added',
    passed: skillsOk,
    severity: 'critical',
  })

  // +10 target role keywords — ONLY when keywords appear in CV text
  const blob = contentBlob(n)
  let matchedKeywords = 0
  const keywordPool =
    targetKeywords.length > 0
      ? targetKeywords
      : careerPlan?.targetRole
        ? [careerPlan.targetRole]
        : []

  for (const kw of keywordPool) {
    const k = kw.toLowerCase()
    if (k.length >= 3 && blob.includes(k)) matchedKeywords += 1
  }

  const keywordTotal = keywordPool.filter((k) => k.trim().length >= 3).length
  let keywordPoints = 0
  if (keywordTotal > 0) {
    keywordPoints = Math.round((matchedKeywords / keywordTotal) * 10)
    score += keywordPoints
  }
  const keywordsOk = keywordTotal === 0 ? false : matchedKeywords / keywordTotal >= 0.4
  checks.push({
    key: 'keywords',
    label:
      keywordTotal === 0
        ? 'Target role keywords (add a career plan for tailored checks)'
        : matchedKeywords > 0
          ? 'Target role keywords present in CV'
          : 'Target role keywords missing from CV',
    passed: keywordsOk,
    severity: 'important',
  })

  // +10 formatting / export readiness (usable for applications)
  const exportOk =
    contactOk &&
    (summaryOk || expOk) &&
    (skillsOk || n.skills.length >= 1) &&
    meaningful
  if (exportOk) {
    score += 10
  } else if (contactOk && (expOk || summaryWords >= 15)) {
    score += 4
  }
  checks.push({
    key: 'export',
    label: 'Formatting / export readiness',
    passed: exportOk,
    severity: 'nice_to_have',
  })

  // Cap nearly-empty CVs so a blank saved row cannot look "half ready"
  if (!meaningful) {
    score = Math.min(score, 10)
  } else if (!expOk && !summaryOk && n.skills.length === 0 && !eduOk) {
    score = Math.min(score, 15)
  }

  score = Math.min(100, Math.max(0, Math.round(score)))

  const status = statusFromScore(score, exists)
  const missing = checks.filter((c) => !c.passed).map((c) => c.label)
  const firstGap = checks.find((c) => !c.passed)

  let suggestedNextStep = 'Keep your Main CV updated as you apply.'
  if (status === 'missing') {
    suggestedNextStep = 'Create your Main CV in CV Builder.'
  } else if (firstGap?.key === 'contact') {
    suggestedNextStep = 'Add your full name and email.'
  } else if (firstGap?.key === 'summary') {
    suggestedNextStep = 'Write a clear profile summary (around 40+ words).'
  } else if (firstGap?.key === 'experience') {
    suggestedNextStep = 'Add work experience with concrete responsibilities.'
  } else if (firstGap?.key === 'skills') {
    suggestedNextStep = 'Add at least 3 relevant skills.'
  } else if (firstGap?.key === 'education') {
    suggestedNextStep = 'Add your education details.'
  } else if (firstGap?.key === 'keywords' && careerPlan?.routeTitle) {
    suggestedNextStep = `Improve this CV for your current plan: ${careerPlan.routeTitle}.`
  } else if (firstGap) {
    suggestedNextStep = firstGap.label
  }

  return {
    score,
    status,
    statusLabel: STATUS_LABELS[status],
    summaryLine: summaryLineFor(status, score),
    checks,
    missing,
    suggestedNextStep,
    targetKeywords: keywordPool,
  }
}

export function cvReadinessStatusTone(
  status: CvReadinessStatus
): 'ready' | 'improve' | 'missing' | 'started' {
  if (status === 'application_ready') return 'ready'
  if (status === 'missing') return 'missing'
  if (status === 'started') return 'started'
  return 'improve'
}
