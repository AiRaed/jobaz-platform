import type { EducationFieldId } from '../types'
import type { SectorType } from './types'

/** Maps each industry to a UK career-advisor sector strategy. */
export const FIELD_SECTOR_MAP: Record<EducationFieldId, SectorType> = {
  healthcare: 'regulated_health',
  education: 'teaching',
  engineering: 'regulated_professional',
  law: 'law',
  business_finance: 'finance',
  it: 'technology',
  science: 'science',
  creative_arts: 'creative',
  construction: 'trades',
  hospitality: 'hospitality',
  social_care: 'social_care',
  logistics_transport: 'logistics',
  media_communications: 'creative',
  public_sector: 'public_sector',
  manufacturing: 'manufacturing',
  property_real_estate: 'property',
  other: 'general',
}

export function getSectorForField(fieldId: EducationFieldId): SectorType {
  return FIELD_SECTOR_MAP[fieldId] ?? 'general'
}
