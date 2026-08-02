import type { ExperienceIndustryId } from '@/lib/career-engine/experience-path/types'
import type { CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import { getExperienceSpecialisationOptions } from '@/lib/career-engine/experience-path/experienceSpecialisations'

export const SECTOR_TO_EXPERIENCE_INDUSTRY: Record<CareerSectorId, ExperienceIndustryId> = {
  hospitality: 'hospitality',
  retail_sales: 'sales',
  customer_service: 'customer_service',
  office_admin: 'office_admin',
  hr_recruitment: 'hr_recruitment',
  accountant: 'accountant',
  marketing_digital: 'marketing_digital',
  it_technology: 'software_developer',
  manufacturing_engineering: 'manufacturing_engineering',
  construction_trades: 'construction',
  healthcare: 'healthcare',
  education_teaching: 'education_teaching',
  transport_logistics: 'driving_transport',
  warehouse_supply_chain: 'warehouse_logistics',
  security: 'security',
  cleaning_facilities: 'cleaning_facilities',
  creative_design: 'office_admin',
  legal_compliance: 'office_admin',
  public_sector: 'office_admin',
  science_laboratory: 'healthcare',
  other: 'other',
}

const SECTOR_DEFAULT_SPEC: Partial<Record<CareerSectorId, string>> = {
  hospitality: 'waiter',
  retail_sales: 'sales_assistant',
  customer_service: 'customer_service_advisor',
  office_admin: 'administrator',
  hr_recruitment: 'hr_assistant',
  accountant: 'accounts_assistant',
  marketing_digital: 'marketing_assistant',
  it_technology: 'it_support',
  manufacturing_engineering: 'production_operative',
  construction_trades: 'labourer',
  healthcare: 'care_assistant',
  education_teaching: 'teaching_assistant',
  transport_logistics: 'delivery_driver',
  warehouse_supply_chain: 'warehouse_operative',
  security: 'security_guard',
  cleaning_facilities: 'cleaner',
  creative_design: 'administrator',
  legal_compliance: 'administrator',
  public_sector: 'administrator',
  science_laboratory: 'healthcare_assistant',
}

export function resolveTargetIndustryAndSpec(
  sectorId: CareerSectorId | null
): { industryId: ExperienceIndustryId; specId: string } | null {
  if (!sectorId || sectorId === 'other') return null
  const industryId = SECTOR_TO_EXPERIENCE_INDUSTRY[sectorId]
  const preferred = SECTOR_DEFAULT_SPEC[sectorId]
  const options = getExperienceSpecialisationOptions(industryId)
  const specId =
    preferred && options.some((o) => o.value === preferred)
      ? preferred
      : options.find((o) => !o.allowFreeText)?.value ?? options[0]?.value
  if (!specId) return null
  return { industryId, specId }
}
