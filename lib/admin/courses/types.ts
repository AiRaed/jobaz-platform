/**
 * Admin Courses Manager — production-ready course model (Supabase-ready).
 * Replace localStorage repository with Supabase client without changing UI components.
 */

export type CourseStatus = 'draft' | 'published' | 'hidden'

export type CourseDeliveryMode =
  | 'online'
  | 'in_person'
  | 'hybrid'
  | 'virtual'
  | 'classroom'
  | 'exam_in_person'

export type CourseCommissionType = 'none' | 'lead' | 'fixed' | 'percentage'

/** Primary admin course record — alias as `Course` for shared use */
export type AdminCourse = {
  id: string

  /** Basic information */
  title: string
  shortDescription: string
  fullDescription: string
  category: string
  /** Career path ids this course appears in (multi-route targeting) */
  routeIds: string[]
  provider: string
  /** Legacy location — kept for backward compatibility */
  location: string
  /** Short public location label for cards */
  locationSummary: string
  /** Full list of cities/sites for detail pages */
  availableLocations: string[]
  /** Primary mode — first selected value (legacy compatibility) */
  deliveryMode: CourseDeliveryMode
  /** All delivery options for this course */
  deliveryModes: CourseDeliveryMode[]
  duration: string
  level: string
  price: string
  fundingType: string
  imageUrl: string
  /** Public pill badges on course cards (optional) */
  publicBadges: string[]
  /** Career Assistant routing — why this course exists */
  coursePurpose: string

  /** Public user-facing partner offer (marketing) */
  publicOfferEnabled: boolean
  publicOfferLabel: string
  publicOfferDescription: string
  publicOfferCode: string
  publicOfferTerms: string
  publicOfferExpiresAt: string

  /** Business information */
  officialUrl: string
  referralUrl: string
  commissionType: CourseCommissionType
  commissionValue: string
  partnerCourse: boolean
  featuredCourse: boolean
  priorityOrder: number

  /** Publishing */
  status: CourseStatus
  showInCareerHub: boolean

  /** Analytics (read-only in admin UI for now) */
  clicks: number
  saves: number

  /** Internal */
  internalNotes: string
  createdAt: string
  updatedAt: string
}

/** Shared alias for future Career Hub + Supabase layers */
export type Course = AdminCourse

/** Supabase `courses` table row — see `CourseRow` in ./mappers */
export type { CourseRow } from './mappers'

export type AdminCourseInput = Omit<
  AdminCourse,
  'id' | 'clicks' | 'saves' | 'createdAt' | 'updatedAt'
>

export type AdminCourseStore = {
  version: 2
  courses: AdminCourse[]
}

/** Future Supabase: `providers` table — course stores provider name until linked */
export type CourseProviderRef = {
  id?: string
  name: string
}

export const COURSE_STATUSES: CourseStatus[] = ['draft', 'published', 'hidden']

export const COURSE_DELIVERY_MODES: { value: CourseDeliveryMode; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'exam_in_person', label: 'In-person exam' },
]

export const COURSE_COMMISSION_TYPES: { value: CourseCommissionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'lead', label: 'Lead' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'percentage', label: 'Percentage' },
]

export { COURSE_LEVEL_OPTIONS } from './courseLevels'
export { COURSE_PURPOSE_OPTIONS } from './coursePurpose'

export function emptyAdminCourseInput(): AdminCourseInput {
  return {
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    routeIds: [],
    provider: '',
    location: '',
    locationSummary: '',
    availableLocations: [],
    deliveryMode: 'in_person',
    deliveryModes: ['in_person'],
    duration: '',
    level: 'Entry',
    price: '',
    fundingType: '',
    imageUrl: '',
    publicBadges: [],
    coursePurpose: '',
    publicOfferEnabled: false,
    publicOfferLabel: '',
    publicOfferDescription: '',
    publicOfferCode: '',
    publicOfferTerms: '',
    publicOfferExpiresAt: '',
    officialUrl: '',
    referralUrl: '',
    commissionType: 'none',
    commissionValue: '',
    partnerCourse: false,
    featuredCourse: false,
    priorityOrder: 50,
    status: 'draft',
    showInCareerHub: false,
    internalNotes: '',
  }
}

export function statusLabel(status: CourseStatus): string {
  if (status === 'published') return 'Published'
  if (status === 'hidden') return 'Hidden'
  return 'Draft'
}

export function deliveryModeLabel(mode: CourseDeliveryMode | string): string {
  const normalized = String(mode).trim().toLowerCase().replace(/-/g, '_')
  return COURSE_DELIVERY_MODES.find((m) => m.value === normalized)?.label ?? String(mode).replace(/_/g, ' ')
}

/** @deprecated use COURSE_STATUSES */
export const ADMIN_COURSE_STATUSES = COURSE_STATUSES
/** @deprecated use CourseStatus */
export type AdminCourseStatus = CourseStatus
/** @deprecated */
export type AdminDeliveryMode = CourseDeliveryMode
/** @deprecated */
export type AdminCommissionType = CourseCommissionType
