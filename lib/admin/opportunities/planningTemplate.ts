import { OPPORTUNITY_GOAL_OPTIONS, OPPORTUNITY_ROUTE_OPTIONS } from './constants'
import type { OpportunityGoalInput, OpportunityProviderInput } from './types'

/** Map alternate route labels from the planning doc to canonical tracker labels. */
const ROUTE_LABEL_ALIASES: Record<string, string> = {
  'office & administration': 'Office & Admin',
  'healthcare & care': 'Care & Support',
  'sales & business development': 'Retail & Sales',
  'cleaning & facilities': 'Cleaning & Facilities',
  'maintenance & facilities': 'Maintenance & Facilities',
}

export function resolveRouteByLabel(label: string): { routeKey: string; routeLabel: string } | null {
  const trimmed = label.trim()
  if (!trimmed) return null

  const canonical =
    ROUTE_LABEL_ALIASES[trimmed.toLowerCase()] ?? trimmed

  const exact = OPPORTUNITY_ROUTE_OPTIONS.find(
    (o) => o.routeLabel.toLowerCase() === canonical.toLowerCase()
  )
  if (exact) return { routeKey: exact.routeKey, routeLabel: exact.routeLabel }

  const fuzzy = OPPORTUNITY_ROUTE_OPTIONS.find((o) => {
    const a = o.routeLabel.toLowerCase()
    const b = canonical.toLowerCase()
    return a.includes(b) || b.includes(a)
  })
  if (fuzzy) return { routeKey: fuzzy.routeKey, routeLabel: fuzzy.routeLabel }

  return null
}

export function resolveRoutesFromLabels(labels: string[]): { routeKey: string; routeLabel: string }[] {
  const seen = new Set<string>()
  const routes: { routeKey: string; routeLabel: string }[] = []

  for (const label of labels) {
    const resolved = resolveRouteByLabel(label)
    if (!resolved || seen.has(resolved.routeKey)) continue
    seen.add(resolved.routeKey)
    routes.push(resolved)
  }

  return routes
}

export function resolveGoalsFromKeys(goalKeys: string[]): OpportunityGoalInput[] {
  const seen = new Set<string>()
  const goals: OpportunityGoalInput[] = []

  for (const key of goalKeys) {
    const trimmed = key.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    const opt = OPPORTUNITY_GOAL_OPTIONS.find((g) => g.goalKey === trimmed)
    goals.push({
      goalKey: trimmed,
      goalLabel: opt?.goalLabel ?? trimmed,
    })
  }

  return goals
}

/** Infer career goals from route map context when not explicitly set. */
export function inferTemplateGoalKeys(entry: PlanningTemplateEntry): string[] {
  if (entry.goalKeys?.length) return entry.goalKeys

  const goals = new Set<string>(['start_new_career'])

  if (entry.routeLabels.some((l) => /self employment/i.test(l))) {
    goals.add('start_business')
  }
  if (entry.routeLabels.some((l) => /education|teaching/i.test(l))) {
    goals.add('work_in_education')
  }
  if (entry.coursePurpose === 'Career growth' || entry.coursePurpose === 'Advanced qualification') {
    goals.add('grow_current_career')
  }
  if (entry.routeLabels.every((l) => /self employment|accounting/i.test(l)) && entry.coursePurpose === 'CV booster') {
    goals.add('extra_income')
  }

  return [...goals]
}

export function resolveGoalsForTemplateEntry(entry: PlanningTemplateEntry): OpportunityGoalInput[] {
  return resolveGoalsFromKeys(inferTemplateGoalKeys(entry))
}

export type PlanningProviderKey = 'get-licensed' | 'ukpda' | 'british-council'

const AFFILIATE_VERIFIED_COURSE_NAMES = new Set([
  'sia door supervisor',
  'sia security guard',
  'sia cctv operator',
  'sia close protection training',
  'qualifi level 2 diploma in care',
])

export const UNVERIFIED_PROVIDER_NEXT_ACTION = 'Create custom affiliate link / verify course'

/** Course has confirmed affiliate link or is explicitly published / ready. */
export function isCourseAffiliateVerifiedInTemplate(entry: PlanningTemplateEntry): boolean {
  if (entry.affiliateVerified === true) return true
  if (entry.publishStatus === 'Published' || entry.opportunityStatus === 'Published') return true
  if (entry.opportunityStatus === 'Ready to add' && resolveProviderKey(entry.provider) === 'get-licensed') {
    return true
  }
  return AFFILIATE_VERIFIED_COURSE_NAMES.has(entry.courseName.trim().toLowerCase())
}

export function buildVerifiedProviderPreset(key: PlanningProviderKey): OpportunityProviderInput {
  if (key === 'get-licensed') {
    return {
      providerName: 'Get Licensed',
      providerStatus: 'Active',
      affiliateStatus: 'Active',
      officialUrl: '',
      referralUrl: 'http://gl-link.co/NV8WD',
      dashboardUrl: '',
      commissionType: 'Fixed',
      commissionValue: '£30',
      publicOfferLabel: '20% OFF',
      trackingMethod: 'Main referral link',
      notes: '',
      isPreferred: true,
    }
  }

  if (key === 'ukpda') {
    return {
      providerName: 'UK Professional Development Academy',
      providerStatus: 'Active',
      affiliateStatus: 'Active',
      officialUrl: '',
      referralUrl: 'https://ukpdacademy.co.uk/ref/223/',
      dashboardUrl: '',
      commissionType: 'Percentage',
      commissionValue: '20%',
      publicOfferLabel: '30% OFF',
      trackingMethod: 'Course custom link',
      notes: 'Main referral link until course-specific custom link is saved.',
      isPreferred: true,
    }
  }

  return buildBritishCouncilPreset()
}

export function buildUnverifiedProviderPreset(key: PlanningProviderKey): OpportunityProviderInput {
  if (key === 'get-licensed') {
    return {
      providerName: 'Get Licensed',
      providerStatus: 'Provider found',
      affiliateStatus: 'Need follow-up',
      officialUrl: '',
      referralUrl: '',
      dashboardUrl: '',
      commissionType: 'Fixed',
      commissionValue: '£30',
      publicOfferLabel: '20% OFF',
      trackingMethod: 'Course custom link',
      notes: 'Provider account active — verify course-specific referral link.',
      isPreferred: true,
    }
  }

  if (key === 'ukpda') {
    return {
      providerName: 'UK Professional Development Academy',
      providerStatus: 'Provider found',
      affiliateStatus: 'Need follow-up',
      officialUrl: '',
      referralUrl: '',
      dashboardUrl: '',
      commissionType: 'Percentage',
      commissionValue: '20%',
      publicOfferLabel: '30% OFF',
      trackingMethod: 'Course custom link',
      notes: 'Provider account active — create course-specific custom link.',
      isPreferred: true,
    }
  }

  return buildBritishCouncilPreset()
}

function buildBritishCouncilPreset(): OpportunityProviderInput {
  return {
    providerName: 'British Council',
    providerStatus: 'Need check',
    affiliateStatus: 'Unknown',
    officialUrl: '',
    referralUrl: '',
    dashboardUrl: '',
    commissionType: 'Unknown',
    commissionValue: '',
    publicOfferLabel: '',
    trackingMethod: 'Unknown',
    notes: 'Reapply to affiliate programme when ready.',
    isPreferred: true,
  }
}

/** @deprecated Use buildProviderPresetForEntry */
export function buildProviderPreset(key: PlanningProviderKey): OpportunityProviderInput {
  if (key === 'british-council') return buildBritishCouncilPreset()
  return buildVerifiedProviderPreset(key)
}

export function buildProviderPresetForEntry(entry: PlanningTemplateEntry): OpportunityProviderInput | null {
  const key = resolveProviderKey(entry.provider)
  if (!key) return null
  if (key === 'british-council') return buildBritishCouncilPreset()
  return isCourseAffiliateVerifiedInTemplate(entry)
    ? buildVerifiedProviderPreset(key)
    : buildUnverifiedProviderPreset(key)
}

export function resolveProviderKey(
  provider?: string
): PlanningProviderKey | null {
  if (!provider) return null
  const p = provider.toLowerCase()
  if (p.includes('get licensed')) return 'get-licensed'
  if (p.includes('ukpda') || p.includes('uk professional development')) return 'ukpda'
  if (p.includes('british council')) return 'british-council'
  return null
}

export const PLANNING_SEED_DEFAULT_NOTES = 'internal planning seed from JobAZ route map'
export const PLANNING_SEED_DEFAULT_NEXT_ACTION = 'Search affiliate providers'

export type PlanningTemplateEntry = {
  courseName: string
  coursePurpose: string
  routeLabels: string[]
  /** Optional explicit career goal keys — inferred from routes/purpose when omitted */
  goalKeys?: string[]
  provider?: string
  /** Explicit opportunity status override (e.g. Published, Ready to add) */
  opportunityStatus?: string
  /** Explicit publish status override */
  publishStatus?: string
  /** Force course-level affiliate verification (overrides name-based rules) */
  affiliateVerified?: boolean
  priority?: number
  notes?: string
}

function entry(
  courseName: string,
  coursePurpose: string,
  routeLabels: string[],
  opts?: Omit<PlanningTemplateEntry, 'courseName' | 'coursePurpose' | 'routeLabels'>
): PlanningTemplateEntry {
  return { courseName, coursePurpose, routeLabels, ...opts }
}

/** Agreed JobAZ route-map planning list — one row per course (multi-route via routeLabels). */
export const JOB_AZ_PLANNING_TEMPLATE: PlanningTemplateEntry[] = [
  // Security & Facilities
  entry('SIA Door Supervisor', 'Job-entry / Licence', ['Security & Facilities'], {
    provider: 'Get Licensed',
    opportunityStatus: 'Published',
    publishStatus: 'Published',
    priority: 100,
    notes: 'Main security entry route.',
  }),
  entry('SIA Security Guard', 'Job-entry / Licence', ['Security & Facilities'], {
    provider: 'Get Licensed',
    opportunityStatus: 'Ready to add',
    priority: 90,
  }),
  entry('SIA CCTV Operator', 'Job-entry / Licence', ['Security & Facilities'], {
    provider: 'Get Licensed',
    opportunityStatus: 'Published',
    publishStatus: 'Published',
    priority: 80,
  }),
  entry('SIA Close Protection Training', 'Career growth', ['Security & Facilities'], {
    provider: 'Get Licensed',
    opportunityStatus: 'Published',
    publishStatus: 'Published',
    priority: 60,
  }),
  entry('SIA Top-Up / Refresher', 'Renewal / Top-up', ['Security & Facilities'], { priority: 60 }),
  entry('First Aid at Work', 'CPD add-on', [
    'Security & Facilities',
    'Hospitality',
    'Care & Support',
    'Construction & Skilled Trades',
    'Education & Teaching',
  ], { priority: 70 }),
  entry('Fire Marshal', 'CPD add-on', [
    'Security & Facilities',
    'Hospitality',
    'Office & Admin',
    'Cleaning & Facilities',
    'Manufacturing & Engineering',
  ], { priority: 60 }),

  // Care & Support
  entry('Care Certificate', 'Career starter', ['Care & Support'], { priority: 90 }),
  entry('Qualifi Level 2 Diploma in Care', 'Career starter', ['Care & Support'], {
    provider: 'UK Professional Development Academy',
    opportunityStatus: 'Published',
    publishStatus: 'Published',
    priority: 80,
  }),
  entry('Health and Social Care Level 2', 'Career starter', ['Care & Support'], {
    provider: 'UK Professional Development Academy',
    priority: 75,
  }),
  entry('Health and Social Care Level 3', 'Career growth', ['Care & Support'], {
    provider: 'UK Professional Development Academy',
    priority: 70,
  }),
  entry('Safeguarding Adults', 'CPD add-on', ['Care & Support'], { priority: 85 }),
  entry('Safeguarding Children', 'CPD add-on', ['Care & Support', 'Education & Teaching'], { priority: 80 }),
  entry('Medication Administration', 'CPD add-on', ['Care & Support'], { priority: 70 }),
  entry('Moving & Handling People', 'CPD add-on', ['Care & Support'], { priority: 75 }),
  entry('Infection Control', 'CPD add-on', ['Care & Support', 'Cleaning & Facilities', 'Healthcare & Care'], {
    priority: 70,
  }),
  entry('Dementia Awareness', 'CV booster', ['Care & Support'], { priority: 60 }),
  entry('Mental Health Awareness', 'CV booster', [
    'Care & Support',
    'Customer Service & Call Centre',
    'Education & Teaching',
  ], { priority: 60 }),

  // Hospitality
  entry('Food Safety Level 2', 'Job-entry / Licence', ['Hospitality', 'Retail & Sales', 'Care & Support'], {
    priority: 95,
  }),
  entry('Food Hygiene', 'CPD add-on', ['Hospitality', 'Retail & Sales', 'Care & Support'], { priority: 75 }),
  entry('Allergen Awareness', 'CPD add-on', ['Hospitality', 'Retail & Sales'], { priority: 75 }),
  entry('Customer Service', 'CV booster', [
    'Hospitality',
    'Retail & Sales',
    'Customer Service & Call Centre',
    'Office & Admin',
    'Public Sector',
  ], { priority: 80 }),
  entry('Manual Handling', 'CPD add-on', [
    'Hospitality',
    'Retail & Sales',
    'Warehouse & Logistics',
    'Construction & Skilled Trades',
    'Manufacturing & Engineering',
    'Cleaning & Facilities',
    'Care & Support',
  ], { priority: 80 }),

  // Retail & Sales
  entry('Sales Skills', 'CV booster', ['Retail & Sales', 'Sales & Business Development'], { priority: 60 }),
  entry('Retail Skills', 'Career starter', ['Retail & Sales'], { priority: 60 }),
  entry('Conflict Management', 'CPD add-on', [
    'Retail & Sales',
    'Customer Service & Call Centre',
    'Security & Facilities',
    'Hospitality',
  ], { priority: 70 }),

  // Customer Service
  entry('Communication Skills', 'CV booster', [
    'Customer Service & Call Centre',
    'Retail & Sales',
    'Office & Admin',
    'Public Sector',
  ], { priority: 70 }),
  entry('Business English / Workplace English', 'CV booster', [
    'Customer Service & Call Centre',
    'Office & Admin',
    'Hospitality',
    'Care & Support',
    'Public Sector',
  ], { priority: 70 }),
  entry('Data Protection / GDPR', 'CPD add-on', [
    'Customer Service & Call Centre',
    'Office & Admin',
    'HR & Recruitment',
    'Accounting & Finance',
    'Public Sector',
    'IT & Technology',
  ], { priority: 75 }),

  // Office & Admin
  entry('Microsoft Office', 'CV booster', ['Office & Admin', 'Public Sector'], { priority: 75 }),
  entry('Excel', 'CV booster', ['Office & Admin', 'Accounting & Finance', 'IT & Technology', 'Public Sector'], {
    priority: 80,
  }),
  entry('Business Administration', 'Career starter', ['Office & Admin', 'Public Sector', 'HR & Recruitment'], {
    priority: 70,
  }),
  entry('English for Work', 'CV booster', [
    'Office & Admin',
    'Customer Service & Call Centre',
    'Hospitality',
    'Care & Support',
  ], { priority: 65 }),

  // HR
  entry('HR Management', 'Career growth', ['HR & Recruitment'], { priority: 50 }),
  entry('Recruitment Consultant Training', 'Career starter', ['HR & Recruitment', 'Sales & Business Development'], {
    priority: 60,
  }),
  entry('Equality & Diversity', 'CPD add-on', [
    'HR & Recruitment',
    'Care & Support',
    'Education & Teaching',
    'Public Sector',
  ], { priority: 60 }),

  // Accounting
  entry('Bookkeeping', 'Career starter', ['Accounting & Finance', 'Self Employment'], { priority: 75 }),
  entry('Sage', 'CV booster', ['Accounting & Finance'], { priority: 60 }),
  entry('Xero', 'CV booster', ['Accounting & Finance', 'Self Employment'], { priority: 60 }),
  entry('QuickBooks', 'CV booster', ['Accounting & Finance', 'Self Employment'], { priority: 60 }),
  entry('AAT', 'Career starter', ['Accounting & Finance'], { priority: 75 }),
  entry('Excel for Finance', 'CV booster', ['Accounting & Finance', 'Office & Admin'], { priority: 70 }),

  // Marketing
  entry('Digital Marketing', 'Career starter', [
    'Marketing & Digital Marketing',
    'Creative & Design',
    'Self Employment',
  ], { priority: 70 }),
  entry('Social Media Marketing', 'CV booster', [
    'Marketing & Digital Marketing',
    'Creative & Design',
    'Self Employment',
  ], { priority: 70 }),
  entry('Google Ads', 'CV booster', ['Marketing & Digital Marketing', 'Self Employment'], { priority: 55 }),
  entry('SEO', 'CV booster', ['Marketing & Digital Marketing', 'IT & Technology', 'Self Employment'], {
    priority: 60,
  }),
  entry('Content Marketing', 'CV booster', [
    'Marketing & Digital Marketing',
    'Media & Communications',
    'Creative & Design',
  ], { priority: 55 }),

  // IT
  entry('CompTIA A+', 'Job-entry / Licence', ['IT & Technology'], { priority: 85 }),
  entry('IT Support', 'Career starter', ['IT & Technology'], { priority: 80 }),
  entry('Cyber Security', 'Career starter', ['IT & Technology', 'Digital & AI-Adjacent'], {
    provider: 'UK Professional Development Academy if available',
    priority: 75,
  }),
  entry('Web Development', 'Career starter', ['IT & Technology', 'Digital & AI-Adjacent'], { priority: 65 }),
  entry('Data Analysis', 'Career starter', ['IT & Technology', 'Digital & AI-Adjacent', 'Office & Admin'], {
    priority: 70,
  }),
  entry('Power BI', 'CV booster', ['IT & Technology', 'Office & Admin', 'Accounting & Finance'], { priority: 65 }),

  // Manufacturing
  entry('Health & Safety at Work', 'CPD add-on', [
    'Manufacturing & Engineering',
    'Construction & Skilled Trades',
    'Warehouse & Logistics',
    'Cleaning & Facilities',
    'Hospitality',
    'Office & Admin',
  ], { priority: 80 }),
  entry('COSHH', 'CPD add-on', [
    'Manufacturing & Engineering',
    'Cleaning & Facilities',
    'Warehouse & Logistics',
    'Construction & Skilled Trades',
    'Hospitality',
  ], { priority: 75 }),
  entry('Fire Safety', 'CPD add-on', [
    'Manufacturing & Engineering',
    'Hospitality',
    'Office & Admin',
    'Cleaning & Facilities',
  ], { priority: 60 }),
  entry('Quality Control', 'CV booster', ['Manufacturing & Engineering', 'Science & Laboratory'], { priority: 50 }),

  // Construction
  entry('CSCS Green Card Pathway', 'Job-entry / Licence', ['Construction & Skilled Trades'], { priority: 100 }),
  entry('Level 1 Health & Safety in Construction', 'Job-entry / Licence', ['Construction & Skilled Trades'], {
    provider: 'UK Professional Development Academy if available',
    priority: 95,
  }),
  entry('CITB Health, Safety & Environment Test Prep', 'Job-entry / Licence', ['Construction & Skilled Trades'], {
    priority: 95,
  }),
  entry('Asbestos Awareness', 'CPD add-on', [
    'Construction & Skilled Trades',
    'Maintenance & Facilities',
    'Plumbing / Handyman',
  ], { priority: 75 }),
  entry('Working at Height', 'CPD add-on', [
    'Construction & Skilled Trades',
    'Maintenance & Facilities',
    'Plumbing / Handyman',
    'Manufacturing & Engineering',
  ], { priority: 75 }),

  // Warehouse
  entry('Forklift Counterbalance', 'Job-entry / Licence', ['Warehouse & Logistics', 'Manufacturing & Engineering'], {
    priority: 95,
  }),
  entry('Forklift Reach Truck', 'Job-entry / Licence', ['Warehouse & Logistics'], { priority: 80 }),
  entry('Warehouse Health & Safety', 'CPD add-on', ['Warehouse & Logistics'], { priority: 65 }),
  entry('Warehouse Supervisor', 'Career growth', ['Warehouse & Logistics'], { priority: 50 }),

  // Transport
  entry('HGV Training', 'Job-entry / Licence', ['Driving & Transport'], { priority: 90 }),
  entry('LGV Training', 'Job-entry / Licence', ['Driving & Transport'], { priority: 85 }),
  entry('Driver CPC', 'Job-entry / Licence', ['Driving & Transport'], { priority: 85 }),
  entry('PCV / Bus Driver Training', 'Job-entry / Licence', ['Driving & Transport'], { priority: 70 }),
  entry('Taxi / PHV Safeguarding', 'Job-entry / Licence', ['Driving & Transport'], { priority: 70 }),
  entry('Tachograph Training', 'CPD add-on', ['Driving & Transport'], { priority: 60 }),
  entry('ADR Dangerous Goods', 'Career growth', ['Driving & Transport', 'Warehouse & Logistics'], { priority: 60 }),

  // Education
  entry('Teaching Assistant Level 2', 'Career starter', ['Education & Teaching', 'Teaching Assistant'], {
    priority: 80,
  }),
  entry('Teaching Assistant Level 3', 'Career growth', ['Education & Teaching', 'Teaching Assistant'], {
    priority: 70,
  }),
  entry('SEN / Autism Awareness', 'CPD add-on', ['Education & Teaching', 'Teaching Assistant', 'Care & Support'], {
    priority: 70,
  }),
  entry('Child Protection', 'CPD add-on', ['Education & Teaching', 'Teaching Assistant', 'Care & Support'], {
    priority: 75,
  }),
  entry('Behaviour Management', 'CV booster', ['Education & Teaching', 'Teaching Assistant'], { priority: 60 }),
  entry('TEFL Certificate', 'Career starter', ['Education & Teaching', 'Translator / Interpreter'], {
    provider: 'British Council if reapply later',
    priority: 60,
  }),
  entry('English for Teaching', 'CV booster', ['Education & Teaching'], { priority: 50 }),
  entry('First Aid for Schools', 'CPD add-on', ['Education & Teaching', 'Teaching Assistant'], { priority: 60 }),

  // Cleaning & Facilities
  entry('Cleaning Supervisor', 'Career growth', ['Cleaning & Facilities', 'Maintenance & Facilities'], {
    priority: 50,
  }),
  entry('Facilities Management basics', 'Career growth', ['Cleaning & Facilities', 'Maintenance & Facilities'], {
    priority: 50,
  }),

  // Property
  entry('Estate Agent Training', 'Career starter', ['Property & Real Estate', 'Sales & Business Development'], {
    priority: 50,
  }),
  entry('Property Management', 'Career starter', ['Property & Real Estate', 'Office & Admin'], { priority: 50 }),
  entry('Lettings Management', 'Career starter', ['Property & Real Estate', 'Sales & Business Development'], {
    priority: 50,
  }),

  // Self Employment
  entry('Self-employment basics', 'Career starter', ['Self Employment'], { priority: 40 }),
  entry('Tax return basics', 'CV booster', ['Self Employment', 'Accounting & Finance'], { priority: 40 }),
  entry('Business plan', 'CV booster', ['Self Employment'], { priority: 40 }),
  entry('Marketing basics', 'CV booster', ['Self Employment', 'Marketing & Digital Marketing'], { priority: 40 }),
  entry('Website / Online presence', 'CV booster', ['Self Employment', 'Digital & AI-Adjacent'], { priority: 40 }),
]
