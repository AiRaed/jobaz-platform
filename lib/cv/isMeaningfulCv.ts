/**
 * Meaningful CV detection — shared by getActiveCv, Documents, and readiness.
 * Empty templates / placeholders do not count as a completed saved CV.
 */

const PLACEHOLDER_RE =
  /^(your name|your email|your phone|enter your|add your|example|sample|placeholder|n\/a|na|test)$/i

export function isPlaceholderText(value: unknown): boolean {
  if (typeof value !== 'string') return true
  const t = value.trim()
  if (!t) return true
  if (PLACEHOLDER_RE.test(t)) return true
  if (t.length < 2) return true
  return false
}

export type MeaningfulCvLike = {
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
  summary?: string
  skills?: string[] | string
  experience?: Array<{
    jobTitle?: string
    company?: string
    description?: string
    bullets?: string[]
  }>
  education?: Array<{
    degree?: string
    school?: string
    field?: string
  }>
  certifications?: Array<string | { title?: string; name?: string }>
} | null | undefined

function skillCount(cv: NonNullable<MeaningfulCvLike>): number {
  if (Array.isArray(cv.skills)) return cv.skills.map((s) => String(s).trim()).filter(Boolean).length
  if (typeof cv.skills === 'string') {
    return cv.skills
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean).length
  }
  return 0
}

/**
 * True when the CV has at least one real content signal
 * (contact, summary, experience, education, skills, or certifications).
 */
export function isMeaningfulCv(cv: MeaningfulCvLike): boolean {
  if (!cv) return false

  const fullName = (cv.personalInfo?.fullName || cv.fullName || '').trim()
  const email = (cv.personalInfo?.email || cv.email || '').trim()

  if (!isPlaceholderText(fullName)) return true
  if (email.includes('@') && !isPlaceholderText(email) && !/example\.com/i.test(email)) return true

  const summary = (cv.summary || '').trim()
  if (summary.length >= 20 && !isPlaceholderText(summary.slice(0, 40))) return true

  if (
    (cv.experience || []).some((e) => {
      const title = (e.jobTitle || '').trim()
      const company = (e.company || '').trim()
      const desc = (e.description || '').trim()
      const bullets = (e.bullets || []).some((b) => String(b).trim().length >= 5)
      return (
        (!isPlaceholderText(title) && title.length > 0) ||
        (!isPlaceholderText(company) && company.length > 0) ||
        desc.length >= 8 ||
        bullets
      )
    })
  ) {
    return true
  }

  if (
    (cv.education || []).some((e) => {
      const degree = (e.degree || '').trim()
      const school = (e.school || '').trim()
      return (!isPlaceholderText(degree) && degree.length > 0) || (!isPlaceholderText(school) && school.length > 0)
    })
  ) {
    return true
  }

  if (skillCount(cv) > 0) return true

  if (
    (cv.certifications || []).some((c) => {
      if (typeof c === 'string') return !isPlaceholderText(c)
      const title = (c.title || c.name || '').trim()
      return !isPlaceholderText(title)
    })
  ) {
    return true
  }

  return false
}
