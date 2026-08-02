/**
 * Shared UK career sector categories for Career Engine paths
 * (Work in My Experience, Start a New Career, and related flows).
 */

export const CAREER_SECTORS = [
  { id: 'hospitality', label: 'Hospitality & Front of House' },
  { id: 'retail_sales', label: 'Retail & Sales' },
  { id: 'customer_service', label: 'Customer Service & Call Centre' },
  { id: 'office_admin', label: 'Office & Administration' },
  { id: 'hr_recruitment', label: 'HR & Recruitment' },
  { id: 'accountant', label: 'Accounting & Finance' },
  { id: 'marketing_digital', label: 'Marketing & Digital Marketing' },
  { id: 'it_technology', label: 'IT & Technology' },
  { id: 'manufacturing_engineering', label: 'Manufacturing & Engineering' },
  { id: 'construction_trades', label: 'Construction & Skilled Trades' },
  { id: 'healthcare', label: 'Healthcare & Care' },
  { id: 'education_teaching', label: 'Education & Teaching' },
  { id: 'transport_logistics', label: 'Transport & Logistics' },
  { id: 'warehouse_supply_chain', label: 'Warehouse & Supply Chain' },
  { id: 'security', label: 'Security' },
  { id: 'cleaning_facilities', label: 'Cleaning & Facilities' },
  { id: 'creative_design', label: 'Creative & Design' },
  { id: 'legal_compliance', label: 'Legal & Compliance' },
  { id: 'public_sector', label: 'Public Sector & Government' },
  { id: 'science_laboratory', label: 'Science & Laboratory' },
  { id: 'other', label: 'Other' },
] as const

export type CareerSectorId = (typeof CAREER_SECTORS)[number]['id']

export const CAREER_SECTOR_OPTIONS: Array<{ value: CareerSectorId; label: string }> = CAREER_SECTORS.map(
  ({ id, label }) => ({ value: id, label })
)

export const CAREER_SECTOR_TARGET_OPTIONS: Array<{ value: CareerSectorId | 'not_sure'; label: string }> = [
  ...CAREER_SECTOR_OPTIONS,
  { value: 'not_sure', label: 'Not sure yet' },
]

export const CAREER_SECTOR_LABELS: Record<CareerSectorId, string> = Object.fromEntries(
  CAREER_SECTORS.map(({ id, label }) => [id, label])
) as Record<CareerSectorId, string>

/** Map legacy slugs from older flows to the canonical sector id. */
export const LEGACY_CAREER_SECTOR_ALIASES: Record<string, CareerSectorId> = {
  hospitality_foh: 'hospitality',
  hospitality_kitchen: 'hospitality',
  chef: 'hospitality',
  retail: 'retail_sales',
  sales: 'retail_sales',
  marketing: 'marketing_digital',
  it: 'it_technology',
  technology: 'it_technology',
  software_developer: 'it_technology',
  engineering: 'manufacturing_engineering',
  manufacturing: 'manufacturing_engineering',
  education: 'education_teaching',
  administration: 'office_admin',
  business_administration: 'office_admin',
  finance: 'accountant',
  law: 'legal_compliance',
  logistics: 'transport_logistics',
  driving_transport: 'transport_logistics',
  driving: 'transport_logistics',
  warehouse_logistics: 'warehouse_supply_chain',
  construction: 'construction_trades',
  electrician: 'construction_trades',
  skilled_trades: 'construction_trades',
  creative_media: 'creative_design',
  creative_arts: 'creative_design',
  public_sector_government: 'public_sector',
  science: 'science_laboratory',
}

export function resolveCareerSectorId(raw: string): CareerSectorId | null {
  const key = raw.trim().toLowerCase()
  if (!key) return null
  if (CAREER_SECTOR_LABELS[key as CareerSectorId]) return key as CareerSectorId
  if (LEGACY_CAREER_SECTOR_ALIASES[key]) return LEGACY_CAREER_SECTOR_ALIASES[key]
  return null
}

export function labelCareerSector(value: string): string {
  const sectorId = resolveCareerSectorId(value)
  if (sectorId) return CAREER_SECTOR_LABELS[sectorId]
  return value.trim().replace(/\b\w/g, (c) => c.toUpperCase())
}
