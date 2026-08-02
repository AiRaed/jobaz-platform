import type { CourseOpportunity, CourseOpportunityInput } from './types'
import { OPPORTUNITY_ROUTE_OPTIONS } from './constants'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

const PLANNING_METADATA_DEFAULTS = {
  educationFields: [] as string[],
  specialisations: [] as string[],
  commercialStatus: '',
  suggestedSearchKeywords: '',
  adminNotes: '',
  canBeCourseCard: true,
  recommendationType: '',
}

export const OPPORTUNITY_SEED: CourseOpportunity[] = [
  {
    id: 'opp-sia-door',
    courseName: 'SIA Door Supervisor',
    shortLabel: 'SIA DS',
    coursePurpose: 'Job-entry / Licence',
    priority: 100,
    opportunityStatus: 'Published',
    publishStatus: 'Published',
    importance: 'High',
    notes: 'Primary security licence — live on JobAZ via Get Licensed.',
    nextAction: '',
    publishedCourseId: null,
    ...PLANNING_METADATA_DEFAULTS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    routes: [
      {
        id: 'route-sia-1',
        opportunityId: 'opp-sia-door',
        routeKey: 'security',
        routeLabel: 'Security & Facilities',
      },
    ],
    goals: [],
    providers: [
      {
        id: 'prov-sia-1',
        opportunityId: 'opp-sia-door',
        providerName: 'Get Licensed',
        providerStatus: 'Active',
        affiliateStatus: 'Active',
        officialUrl: 'https://get-licensed.co.uk',
        referralUrl: 'http://gl-link.co/NV8WD',
        dashboardUrl: '',
        commissionType: 'Fixed',
        commissionValue: '£30',
        publicOfferLabel: '20% OFF',
        trackingMethod: 'Main referral link',
        notes: '',
        isPreferred: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'opp-food-safety',
    courseName: 'Food Safety Level 2',
    shortLabel: 'Food Safety L2',
    coursePurpose: 'Job-entry / Licence',
    priority: 80,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'High',
    notes: 'Needed across hospitality, retail and care routes.',
    nextAction: 'Create custom affiliate link / verify course',
    publishedCourseId: null,
    ...PLANNING_METADATA_DEFAULTS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    routes: [
      { id: 'r-fs-1', opportunityId: 'opp-food-safety', routeKey: 'hospitality', routeLabel: 'Hospitality' },
      { id: 'r-fs-2', opportunityId: 'opp-food-safety', routeKey: 'retail-sales', routeLabel: 'Retail & Sales' },
      { id: 'r-fs-3', opportunityId: 'opp-food-safety', routeKey: 'care', routeLabel: 'Care & Support' },
    ],
    goals: [],
    providers: [
      {
        id: 'prov-fs-1',
        opportunityId: 'opp-food-safety',
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
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'opp-manual-handling',
    courseName: 'Manual Handling',
    shortLabel: '',
    coursePurpose: 'CPD add-on',
    priority: 50,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'Medium',
    notes: '',
    nextAction: 'Find low-cost CPD provider',
    publishedCourseId: null,
    ...PLANNING_METADATA_DEFAULTS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    routes: [
      { id: 'r-mh-1', opportunityId: 'opp-manual-handling', routeKey: 'care', routeLabel: 'Care & Support' },
      { id: 'r-mh-2', opportunityId: 'opp-manual-handling', routeKey: 'warehouse', routeLabel: 'Warehouse & Logistics' },
      { id: 'r-mh-3', opportunityId: 'opp-manual-handling', routeKey: 'construction', routeLabel: 'Construction & Skilled Trades' },
      { id: 'r-mh-4', opportunityId: 'opp-manual-handling', routeKey: 'cleaning-facilities', routeLabel: 'Cleaning & Facilities' },
    ],
    goals: [],
    providers: [],
  },
  {
    id: 'opp-cscs',
    courseName: 'CSCS Green Card Pathway',
    shortLabel: 'CSCS Green',
    coursePurpose: 'Job-entry / Licence',
    priority: 80,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'High',
    notes: '',
    nextAction: 'Research CSCS test + card bundle partners',
    publishedCourseId: null,
    ...PLANNING_METADATA_DEFAULTS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    routes: [
      { id: 'r-cscs-1', opportunityId: 'opp-cscs', routeKey: 'construction', routeLabel: 'Construction & Skilled Trades' },
    ],
    goals: [],
    providers: [],
  },
  {
    id: 'opp-qualifi-care',
    courseName: 'Qualifi Level 2 Diploma in Care',
    shortLabel: 'L2 Care Diploma',
    coursePurpose: 'Career starter',
    priority: 70,
    opportunityStatus: 'Approved affiliate',
    publishStatus: 'Published',
    importance: 'High',
    notes: 'UKPDA pathway — published on JobAZ.',
    nextAction: '',
    publishedCourseId: null,
    ...PLANNING_METADATA_DEFAULTS,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    routes: [
      { id: 'r-qc-1', opportunityId: 'opp-qualifi-care', routeKey: 'care', routeLabel: 'Care & Support' },
    ],
    goals: [],
    providers: [
      {
        id: 'prov-qc-1',
        opportunityId: 'opp-qualifi-care',
        providerName: 'UK Professional Development Academy',
        providerStatus: 'Active',
        affiliateStatus: 'Active',
        officialUrl: 'https://ukpda.org.uk',
        referralUrl: 'https://ukpdacademy.co.uk/ref/223/',
        dashboardUrl: '',
        commissionType: 'Percentage',
        commissionValue: '20%',
        publicOfferLabel: '30% OFF',
        trackingMethod: 'Course custom link',
        notes: 'Main referral link until course-specific custom link is saved.',
        isPreferred: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
]

export function buildInputFromSeed(opp: CourseOpportunity): CourseOpportunityInput {
  return {
    courseName: opp.courseName,
    shortLabel: opp.shortLabel,
    coursePurpose: opp.coursePurpose,
    priority: opp.priority,
    opportunityStatus: opp.opportunityStatus,
    publishStatus: opp.publishStatus,
    importance: opp.importance,
    notes: opp.notes,
    nextAction: opp.nextAction,
    publishedCourseId: opp.publishedCourseId ?? null,
    routes: opp.routes.map((r) => ({ routeKey: r.routeKey, routeLabel: r.routeLabel })),
    goals: (opp.goals ?? []).map((g) => ({ goalKey: g.goalKey, goalLabel: g.goalLabel })),
    providers: opp.providers.map((p) => ({
      id: p.id,
      providerName: p.providerName,
      providerStatus: p.providerStatus,
      affiliateStatus: p.affiliateStatus,
      officialUrl: p.officialUrl,
      referralUrl: p.referralUrl,
      dashboardUrl: p.dashboardUrl,
      commissionType: p.commissionType,
      commissionValue: p.commissionValue,
      publicOfferLabel: p.publicOfferLabel,
      trackingMethod: p.trackingMethod,
      notes: p.notes,
      isPreferred: p.isPreferred,
    })),
  }
}

export function routeKeysToPathIds(routeKeys: string[]): string[] {
  const ids = new Set<string>()
  for (const key of routeKeys) {
    const opt = OPPORTUNITY_ROUTE_OPTIONS.find((o) => o.routeKey === key)
    if (opt?.pathIds?.length) opt.pathIds.forEach((p) => ids.add(p))
    else ids.add(key)
  }
  return [...ids]
}

export { uuid, nowIso }
