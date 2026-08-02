/**
 * Rule-based employability reasoning from structured career profile.
 */

import type { CareerProfile } from './types'

const SECTOR_MAP: Record<string, { sectors: string[]; roles: string[]; salary: string }> = {
  hospitality_restaurants: {
    sectors: ['Hospitality', 'Retail customer service'],
    roles: ['Waiting staff', 'Hotel front desk', 'Café team member'],
    salary: '£21k–£26k',
  },
  warehouse_logistics: {
    sectors: ['Warehouse & logistics', 'Distribution'],
    roles: ['Warehouse operative', 'Picker/packer', 'Goods-in operative'],
    salary: '£22k–£28k',
  },
  cleaning: {
    sectors: ['Facilities & cleaning'],
    roles: ['Cleaner', 'Housekeeping', 'Facilities assistant'],
    salary: '£20k–£24k',
  },
  construction_labour: {
    sectors: ['Construction labour', 'Site support'],
    roles: ['Labourer', 'Site assistant', 'Groundworker (entry)'],
    salary: '£22k–£30k',
  },
  trades: {
    sectors: ['Skilled trades', 'Maintenance'],
    roles: ['Trainee tradesperson', 'Maintenance assistant'],
    salary: '£24k–£32k',
  },
  office_admin: {
    sectors: ['Office & admin', 'Business support'],
    roles: ['Admin assistant', 'Reception', 'Data entry'],
    salary: '£22k–£28k',
  },
  care_support: {
    sectors: ['Care & support'],
    roles: ['Care assistant', 'Support worker'],
    salary: '£22k–£27k',
  },
  digital: {
    sectors: ['IT support', 'Digital admin'],
    roles: ['IT support trainee', 'Helpdesk', 'Digital admin'],
    salary: '£24k–£30k',
  },
}

function matchSectorKey(industry: string | null): keyof typeof SECTOR_MAP | null {
  if (!industry) return null
  const s = industry.toLowerCase()
  for (const key of Object.keys(SECTOR_MAP)) {
    if (s.includes(key.replace(/_/g, ' ')) || s.includes(key)) return key as keyof typeof SECTOR_MAP
  }
  if (s.includes('hospitality') || s.includes('restaurant')) return 'hospitality_restaurants'
  if (s.includes('warehouse') || s.includes('logistic')) return 'warehouse_logistics'
  if (s.includes('clean')) return 'cleaning'
  if (s.includes('construction') || s.includes('labour')) return 'construction_labour'
  if (s.includes('trade') || s.includes('mechanic')) return 'trades'
  if (s.includes('office') || s.includes('admin')) return 'office_admin'
  if (s.includes('care') || s.includes('health')) return 'care_support'
  if (s.includes('it') || s.includes('digital') || s.includes('software')) return 'digital'
  return null
}

export function computeEmployabilityInsights(profile: CareerProfile): CareerProfile['aiInsights'] {
  const identifiedProfession =
    profile.careerDirection.wantsSameField === true &&
    !profile.careerDirection.wantsCareerChange &&
    profile.workExperience.roles.length > 0

  if (identifiedProfession) {
    const role = profile.workExperience.roles[0]!
    const sector =
      profile.preferences.preferredIndustry ??
      profile.workExperience.industries[0] ??
      'Your current profession'
    let score = 45 + profile.profileCompleteness * 0.35
    if (profile.workExperience.hasExperience) score += 12
    if (profile.workExperience.transferableSkills.length) score += 8
    score = Math.max(35, Math.min(92, Math.round(score)))

    return {
      employabilityScore: score,
      strongestAreas: profile.workExperience.transferableSkills.slice(0, 3).length
        ? profile.workExperience.transferableSkills.slice(0, 3)
        : [`Experience as ${role}`, 'Clear progression goal in current profession'],
      biggestRisks: profile.barriers.missingQualifications
        ? ['Qualifications may need closing before the next level']
        : [],
      recommendedPaths: [sector],
      recommendedSectors: [sector],
      urgencyLevel: 'low',
      jobReady: score >= 60,
      realisticSalaryBand: '£22k–£45k (profession-dependent progression)',
      missingSkills: profile.barriers.missingQualifications ? ['UK-recognised qualification for next level'] : [],
      fastestCertifications: [],
      easiestEntryRoles: [role],
    }
  }

  let score = 28 + profile.profileCompleteness * 0.45

  const strongest: string[] = []
  const risks: string[] = []
  const paths: string[] = []
  const sectors: string[] = []
  const missing: string[] = []
  const certs: string[] = []
  const entryRoles: string[] = []

  if (profile.workExperience.transferableSkills.length) {
    strongest.push(...profile.workExperience.transferableSkills.slice(0, 3))
    score += 8
  }

  if (profile.ukReadiness.englishLevel === 'fluent' || profile.ukReadiness.englishLevel === 'comfortable') {
    strongest.push('English communication for UK workplaces')
    score += 12
  } else if (profile.ukReadiness.englishLevel === 'basic') {
    risks.push('English may limit customer-facing roles initially')
    missing.push('Workplace English confidence')
    score -= 10
  }

  if (profile.workExperience.hasExperience) {
    score += 15
    strongest.push('Prior work experience (transferable)')
  } else {
    risks.push('Limited paid work experience in the UK')
    missing.push('UK-relevant work examples for CV')
  }

  if (profile.education.level && profile.education.ukRecognition !== 'no') {
    score += 8
    strongest.push('Educational foundation')
  } else if (profile.education.ukRecognition === 'no') {
    risks.push('Qualifications may need UK recognition or alternative routes')
    missing.push('UK-recognised qualification or vocational route')
  }

  if (profile.ukReadiness.drivingLicence) {
    score += 6
    strongest.push('Mobility for wider job options')
  } else if (profile.barriers.transport) {
    risks.push('Transport limits roles outside public transport corridors')
    entryRoles.push('Warehouse (near you)', 'Retail', 'Cleaning')
  }

  if (profile.barriers.burnout) {
    risks.push('Stress/burnout — avoid high-pressure sectors for now')
  }

  if (profile.barriers.confidence) {
    risks.push('Confidence — start with achievable wins and interview practice')
    missing.push('Interview practice & success stories')
  }

  let salaryBand: string | null = null
  const industry =
    profile.preferences.preferredIndustry ??
    profile.workExperience.industries[0] ??
    null
  const sectorKey = matchSectorKey(industry)

  if (sectorKey && SECTOR_MAP[sectorKey]) {
    const pack = SECTOR_MAP[sectorKey]
    sectors.push(...pack.sectors)
    paths.push(...pack.sectors)
    entryRoles.push(...pack.roles)
    salaryBand = pack.salary
  } else if (!profile.workExperience.hasExperience) {
    sectors.push('Warehouse & logistics', 'Retail', 'Hospitality (entry)')
    paths.push('warehouse-logistics', 'hospitality-front', 'cleaning')
    entryRoles.push('Warehouse operative', 'Retail assistant', 'Kitchen porter')
  } else {
    sectors.push('Customer service', 'Admin support', 'Warehouse')
    paths.push('hospitality-front', 'office-admin', 'warehouse-logistics')
  }

  if (profile.barriers.language) {
    certs.push('ESOL / workplace English course')
    entryRoles.push('Warehouse', 'Cleaning', 'Kitchen support')
  }

  if (profile.ukReadiness.drivingLicence === false && profile.barriers.transport) {
    certs.push('Forklift licence (if warehouse path)', 'SIA security (if interested)')
  }

  if (includesEngineering(profile)) {
    sectors.push('Engineering technician', 'Manufacturing', 'Quality inspection')
    paths.push('construction-trades', 'digital-ai-adjacent')
    missing.push('UK safety certifications (if applicable)', 'Software/tools clarity')
  }

  const urgency: CareerProfile['aiInsights']['urgencyLevel'] =
    profile.careerDirection.longTermGoal?.includes('quick') ||
    profile.careerDirection.userSegment === 'unemployed'
      ? 'high'
      : profile.profileCompleteness < 40
        ? 'medium'
        : 'low'

  score = Math.max(12, Math.min(92, Math.round(score)))

  const jobReady =
    score >= 62 &&
    !profile.barriers.language &&
    profile.workExperience.hasExperience &&
    profile.profileCompleteness >= 55

  return {
    employabilityScore: score,
    strongestAreas: [...new Set(strongest)].slice(0, 5),
    biggestRisks: [...new Set(risks)].slice(0, 5),
    recommendedPaths: [...new Set(paths)].slice(0, 5),
    recommendedSectors: [...new Set(sectors)].slice(0, 5),
    urgencyLevel: urgency,
    jobReady,
    realisticSalaryBand: salaryBand ?? '£21k–£28k (entry-level UK)',
    missingSkills: [...new Set(missing)].slice(0, 5),
    fastestCertifications: [...new Set(certs)].slice(0, 4),
    easiestEntryRoles: [...new Set(entryRoles)].slice(0, 5),
  }
}

function includesEngineering(profile: CareerProfile): boolean {
  const blob = [
    profile.education.field,
    ...profile.workExperience.industries,
    ...profile.workExperience.roles,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return /engineer|mechanical|electrical|civil|software/.test(blob)
}

export function applyInsightsToProfile(profile: CareerProfile): CareerProfile {
  return {
    ...profile,
    aiInsights: computeEmployabilityInsights(profile),
  }
}
