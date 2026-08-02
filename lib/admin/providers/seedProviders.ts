import { providerSlugFromName } from './constants'
import type { CourseProviderInput } from './types'

export const PROVIDER_SEED_DATA: CourseProviderInput[] = [
  {
    name: 'Get Licensed',
    slug: providerSlugFromName('Get Licensed'),
    websiteUrl: 'https://www.get-licensed.co.uk',
    affiliateDashboardUrl: '',
    affiliateStatus: 'Active',
    accountStatus: 'Active',
    defaultCommissionType: 'Fixed',
    defaultCommissionValue: '£30',
    defaultPublicOfferLabel: '20% OFF',
    trackingMethod: 'Main referral link',
    notes:
      'Approved provider for SIA/security courses. Main referral link currently used: http://gl-link.co/NV8WD',
    contactEmail: '',
    loginNotes: '',
    payoutNotes: '',
    estimatedConversionRatePercent: 5,
    averageOrderValue: null,
    isActive: true,
  },
  {
    name: 'UK Professional Development Academy',
    slug: providerSlugFromName('UK Professional Development Academy'),
    websiteUrl: 'https://ukpdacademy.co.uk',
    affiliateDashboardUrl: 'https://ukpdacademy.co.uk/affiliate-area/',
    affiliateStatus: 'Active',
    accountStatus: 'Active',
    defaultCommissionType: 'Percentage',
    defaultCommissionValue: '20%',
    defaultPublicOfferLabel: '30% OFF',
    trackingMethod: 'Course custom link',
    notes:
      'Approved affiliate. Main referral link: https://ukpdacademy.co.uk/ref/223/. Custom links should be generated per course where possible.',
    contactEmail: '',
    loginNotes: '',
    payoutNotes: '',
    estimatedConversionRatePercent: 5,
    averageOrderValue: 299,
    isActive: true,
  },
  {
    name: 'British Council',
    slug: providerSlugFromName('British Council'),
    websiteUrl: '',
    affiliateDashboardUrl: '',
    affiliateStatus: 'Rejected',
    accountStatus: 'Rejected',
    defaultCommissionType: 'Unknown',
    defaultCommissionValue: '',
    defaultPublicOfferLabel: '',
    trackingMethod: 'Manual check',
    notes:
      'Application rejected due to brand alignment mismatch. Reapply later after JobAZ launch and clearer positioning.',
    contactEmail: '',
    loginNotes: '',
    payoutNotes: '',
    estimatedConversionRatePercent: 5,
    averageOrderValue: null,
    isActive: false,
  },
]

export type ProviderSeedResult = {
  created: number
  skipped: number
}

export function planProviderSeed(existingSlugs: Set<string>): {
  toCreate: CourseProviderInput[]
  skipped: number
} {
  const toCreate = PROVIDER_SEED_DATA.filter((p) => !existingSlugs.has(p.slug))
  return { toCreate, skipped: PROVIDER_SEED_DATA.length - toCreate.length }
}
