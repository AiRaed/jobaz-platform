/**
 * Launch catalogue — Get Licensed (live) + UKPDA (draft/hidden until links confirmed).
 * Used by mock store seed and server-side marketplace fallback.
 */

import type { AdminCourseInput } from './types'

type SeedCourse = AdminCourseInput & { id: string }

function siaBase(overrides: Partial<SeedCourse> & Pick<SeedCourse, 'id' | 'title' | 'shortDescription'>): SeedCourse {
  return {
    fullDescription: overrides.shortDescription,
    category: 'security',
    routeIds: ['security-facilities'],
    provider: 'Get Licensed',
    location: 'UK-wide',
    locationSummary: 'UK-wide',
    availableLocations: [],
    deliveryMode: 'in_person',
    deliveryModes: ['in_person'],
    duration: '4–6 days',
    level: 'Entry',
    price: 'From £199',
    fundingType: 'Self-funded',
    imageUrl: '',
    publicBadges: [],
    coursePurpose: '',
    publicOfferEnabled: false,
    publicOfferLabel: '',
    publicOfferDescription: '',
    publicOfferCode: '',
    publicOfferTerms: '',
    publicOfferExpiresAt: '',
    officialUrl: 'https://www.get-licensed.co.uk',
    referralUrl: 'https://www.get-licensed.co.uk',
    commissionType: 'lead',
    commissionValue: '',
    partnerCourse: true,
    featuredCourse: false,
    priorityOrder: 70,
    status: 'published',
    showInCareerHub: true,
    internalNotes: 'Get Licensed — SIA partner. Update referral_url with tracked link when available.',
    ...overrides,
  }
}

export const GET_LICENSED_SIA_COURSES: SeedCourse[] = [
  siaBase({
    id: 'seed-sia-door-supervisor',
    title: 'SIA Door Supervisor',
    shortDescription: 'SIA Door Supervisor licence — required for door security and licensed venues across the UK.',
    deliveryModes: ['in_person'],
    deliveryMode: 'in_person',
    locationSummary: 'UK-wide',
    location: 'UK-wide',
    coursePurpose: 'Job-entry / Licence',
    publicBadges: ['Licence', 'Beginner friendly', 'Required first step'],
    publicOfferEnabled: true,
    publicOfferLabel: '20% off',
    publicOfferDescription: 'Partner offer via JobAZ when booking through our link',
    publicOfferCode: '',
    publicOfferTerms: 'Provider terms apply. Prices and availability may change.',
    publicOfferExpiresAt: '',
    featuredCourse: true,
    priorityOrder: 95,
  }),
  siaBase({
    id: 'seed-sia-security-guard',
    title: 'SIA Security Guard',
    shortDescription: 'SIA Security Guard licence for static guarding, retail security and site patrol roles.',
    deliveryModes: ['in_person'],
    deliveryMode: 'in_person',
    coursePurpose: 'Job-entry / Licence',
    publicBadges: ['Licence', 'Beginner friendly', 'Entry route'],
    priorityOrder: 90,
  }),
  siaBase({
    id: 'seed-sia-cctv',
    title: 'SIA CCTV Operator',
    shortDescription: 'SIA Public Space Surveillance (CCTV) licence for control room and monitoring roles.',
    deliveryModes: ['online', 'in_person'],
    deliveryMode: 'online',
    locationSummary: 'Selected UK locations',
    location: 'Selected UK locations',
    availableLocations: [
      'London',
      'Nottingham',
      'Derby',
      'Southampton',
      'Salisbury',
      'Winchester',
      'Andover',
    ],
    level: 'Licence',
    coursePurpose: 'Job-entry / Licence',
    publicBadges: ['Licence', 'Online', 'Classroom', 'Control room jobs'],
    priorityOrder: 85,
  }),
  siaBase({
    id: 'seed-sia-close-protection',
    title: 'SIA Close Protection',
    shortDescription: 'SIA Close Protection licence for advanced personal security and VIP close protection roles.',
    level: 'Advanced',
    coursePurpose: 'Advanced qualification',
    publicBadges: ['Licence', 'Specialist', 'Advanced'],
    priorityOrder: 88,
  }),
  siaBase({
    id: 'seed-efaw',
    title: 'Emergency First Aid at Work',
    shortDescription: 'One-day Emergency First Aid — often required alongside SIA training and site work.',
    coursePurpose: 'CV booster',
    publicBadges: ['Required first step', 'Practical training', 'Beginner friendly'],
    duration: '1 day',
    price: 'From £89',
    priorityOrder: 80,
  }),
]

function ukpdaDraft(overrides: Partial<SeedCourse> & Pick<SeedCourse, 'id' | 'title' | 'shortDescription' | 'category' | 'routeIds'>): SeedCourse {
  return {
    fullDescription: overrides.shortDescription,
    provider: 'UK Professional Development Academy',
    location: 'Online / UK-wide',
    locationSummary: 'Online / UK-wide',
    availableLocations: [],
    deliveryMode: 'online',
    deliveryModes: ['online'],
    publicBadges: [],
    coursePurpose: '',
    duration: 'Flexible',
    level: 'Entry',
    price: 'Check provider',
    fundingType: 'Self-funded',
    imageUrl: '',
    officialUrl: 'https://ukpda.org.uk',
    referralUrl: '',
    commissionType: 'none',
    commissionValue: '',
    partnerCourse: false,
    featuredCourse: false,
    priorityOrder: 40,
    status: 'draft',
    showInCareerHub: false,
    internalNotes: 'UKPDA — keep draft until referral link confirmed.',
    ...overrides,
  } as SeedCourse
}

export const UKPDA_DRAFT_COURSES: SeedCourse[] = [
  ukpdaDraft({
    id: 'seed-ukpda-care',
    title: 'Health & Social Care',
    shortDescription: 'Foundation health and social care qualification for support worker roles.',
    category: 'care',
    routeIds: ['care-support'],
    coursePurpose: 'Career growth',
  }),
  ukpdaDraft({
    id: 'seed-ukpda-adult-care',
    title: 'Adult Social Care Certificate',
    shortDescription: 'Adult social care certificate pathway for regulated care settings.',
    category: 'care',
    routeIds: ['care-support'],
  }),
  ukpdaDraft({
    id: 'seed-ukpda-cscs',
    title: 'Level 1 Health & Safety in Construction (CSCS Green Card)',
    shortDescription: 'CSCS Green Card pathway — health and safety for construction site entry.',
    category: 'construction',
    routeIds: ['construction-trades'],
    deliveryMode: 'hybrid',
    deliveryModes: ['hybrid'],
  }),
  ukpdaDraft({
    id: 'seed-ukpda-business',
    title: 'Business Management',
    shortDescription: 'Business management CPD for office, admin and supervisory roles.',
    category: 'office',
    routeIds: ['office-admin'],
  }),
  ukpdaDraft({
    id: 'seed-ukpda-cyber',
    title: 'Cyber Security',
    shortDescription: 'Introductory cyber security qualification for digital and IT-adjacent careers.',
    category: 'digital',
    routeIds: ['digital-ai-beginner'],
  }),
  ukpdaDraft({
    id: 'seed-ukpda-education',
    title: 'Early Years / Education and Training',
    shortDescription: 'Education and training pathway for teaching assistant and early years roles.',
    category: 'teaching',
    routeIds: ['teaching-support'],
  }),
]

export const LAUNCH_COURSE_CATALOG: SeedCourse[] = [...GET_LICENSED_SIA_COURSES, ...UKPDA_DRAFT_COURSES]

export function publishedLaunchCourses(): SeedCourse[] {
  return LAUNCH_COURSE_CATALOG.filter((c) => c.status === 'published' && c.showInCareerHub)
}
