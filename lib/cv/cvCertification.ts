/**
 * Certification / licence entries on a CV (string legacy or structured).
 */

export type CvCertification = {
  title: string
  provider?: string
  status?: 'completed' | 'in_progress' | 'planned' | string
  source?: string
  completed_at?: string
}

export type CvCertificationEntry = string | CvCertification

export function certificationLabel(entry: CvCertificationEntry): string {
  if (typeof entry === 'string') return entry.trim()
  const title = (entry.title || '').trim()
  const provider = (entry.provider || '').trim()
  if (title && provider) return `${title} — ${provider}`
  return title || provider || ''
}

export function certificationTitle(entry: CvCertificationEntry): string {
  if (typeof entry === 'string') return entry.trim()
  return (entry.title || '').trim()
}

export function buildCareerPlanCertification(input: {
  title: string
  provider?: string
  status?: string
  source?: string
}): CvCertification {
  return {
    title: input.title.trim(),
    provider: input.provider || undefined,
    status: input.status || 'completed',
    source: input.source || 'career_plan',
    completed_at: new Date().toISOString(),
  }
}
