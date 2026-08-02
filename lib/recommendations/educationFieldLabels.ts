import type { EducationFieldId } from '@/lib/career-engine/education-path/types'
import { getSeedKnowledge } from '@/lib/career-engine/education-path/knowledge/seed'
import { resolveSpecialisationLabel } from '@/lib/career-engine/education-path/educationSpecialisations'

const FIELD_ALIASES: Partial<Record<EducationFieldId, string[]>> = {
  business_finance: ['Business', 'Finance', 'Business & Finance'],
  it: ['IT', 'IT & Technology'],
  logistics_transport: ['Logistics', 'Logistics & Transport'],
  social_care: ['Social Care', 'Care & Support'],
  creative_arts: ['Creative & Design', 'Creative', 'Design'],
  construction: ['Construction', 'Construction & Skilled Trades'],
  manufacturing: ['Manufacturing', 'Manufacturing & Engineering'],
  media_communications: ['Media & Communications', 'Media', 'Communications'],
  property_real_estate: ['Property & Real Estate', 'Property'],
  public_sector: ['Public Sector'],
  hospitality: ['Hospitality'],
  education: ['Education', 'Education & Teaching'],
  science: ['Science', 'Science & Laboratory'],
  law: ['Law', 'Legal'],
  healthcare: ['Healthcare', 'Health'],
}

export function normMatchLabel(value: string): string {
  return value.trim().toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ')
}

export function educationFieldLabelsForMatching(fieldId: EducationFieldId): string[] {
  const kb = getSeedKnowledge(fieldId)
  const labels = new Set<string>([kb.label, ...(FIELD_ALIASES[fieldId] ?? [])])
  return [...labels].map(normMatchLabel).filter(Boolean)
}

export function specialisationLabelsForMatching(
  fieldId: EducationFieldId,
  specialisationId: string,
  freeText?: string
): string[] {
  const labels = new Set<string>()
  const resolved = resolveSpecialisationLabel(fieldId, specialisationId, freeText)
  labels.add(resolved)
  labels.add(specialisationId.replace(/_/g, ' '))
  for (const token of resolved.split(/[,&/]/)) {
    const t = token.trim()
    if (t) labels.add(t)
  }
  return [...labels].map(normMatchLabel).filter(Boolean)
}

export function labelsOverlap(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false
  const setB = new Set(b.map(normMatchLabel))
  return a.some((item) => setB.has(normMatchLabel(item)))
}

export function partialLabelMatch(a: string, b: string): boolean {
  const na = normMatchLabel(a)
  const nb = normMatchLabel(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

export function anyPartialMatch(needles: string[], haystack: string[]): boolean {
  for (const needle of needles) {
    for (const item of haystack) {
      if (partialLabelMatch(needle, item)) return true
    }
  }
  return false
}
