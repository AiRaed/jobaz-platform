import type {
  AdminCourse,
  AdminCourseInput,
  CourseCommissionType,
  CourseDeliveryMode,
  CourseStatus,
} from './types'
import { normalizeAdminRouteIds } from './routeSlugs'
import {
  normalizeDeliveryModesInput,
  primaryDeliveryMode,
  resolveDeliveryModes,
} from './deliveryModes'
import { normalizePublicBadges } from './publicBadges'
import { mapPublicOfferRow, mapPublicOfferToRow } from './publicOffer'
import { normalizeCourseLevel } from './courseLevels'
import { normalizeCoursePurpose } from './coursePurpose'
import {
  normalizeAvailableLocations,
  resolveLocationSummary,
} from './courseLocations'

/** Supabase `courses` table row (snake_case). */
export type CourseRow = {
  id: string
  title: string
  short_description: string | null
  full_description: string | null
  category: string | null
  appears_in_routes: string[] | null
  provider_name: string | null
  location: string | null
  location_summary: string | null
  available_locations: string[] | null
  delivery_mode: string | null
  delivery_modes: string[] | null
  duration: string | null
  level: string | null
  price: string | null
  funding_type: string | null
  official_url: string | null
  referral_url: string | null
  image_url: string | null
  commission_type: string | null
  commission_value: string | null
  is_partner: boolean | null
  is_featured: boolean | null
  priority_order: number | null
  status: string | null
  show_in_career_hub: boolean | null
  clicks: number | null
  saves: number | null
  internal_notes: string | null
  public_badges: string[] | null
  public_offer_enabled: boolean | null
  public_offer_label: string | null
  public_offer_description: string | null
  public_offer_code: string | null
  public_offer_terms: string | null
  public_offer_expires_at: string | null
  course_purpose: string | null
  created_at: string
  updated_at: string
}

function asDeliveryMode(value: string | null | undefined): CourseDeliveryMode {
  if (value === 'online' || value === 'in_person' || value === 'hybrid') return value
  return 'in_person'
}

function asCommissionType(value: string | null | undefined): CourseCommissionType {
  if (value === 'lead' || value === 'fixed' || value === 'percentage' || value === 'none') return value
  return 'none'
}

function asStatus(value: string | null | undefined): CourseStatus {
  const normalized = (value ?? '').trim().toLowerCase()
  if (normalized === 'published' || normalized === 'hidden' || normalized === 'draft') return normalized
  return 'draft'
}

function asBoolean(value: unknown): boolean {
  if (value === true || value === 'true' || value === 't' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 'f' || value === 0 || value === '0') return false
  return Boolean(value)
}

/** Published courses default to visible in Career Hub unless explicitly unchecked. */
export function resolveShowInCareerHub(input: AdminCourseInput): boolean {
  if (input.status === 'published') {
    return input.showInCareerHub !== false
  }
  return Boolean(input.showInCareerHub)
}

export function courseRowToAdminCourse(row: CourseRow): AdminCourse {
  const deliveryModes = resolveDeliveryModes(row.delivery_modes, row.delivery_mode)
  const offer = mapPublicOfferRow(row)
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description ?? '',
    fullDescription: row.full_description ?? '',
    category: row.category ?? '',
    routeIds: normalizeAdminRouteIds(row.appears_in_routes ?? []),
    provider: row.provider_name ?? '',
    location: row.location ?? '',
    locationSummary: ((row.location_summary ?? '').trim() || (row.location ?? '')),
    availableLocations: normalizeAvailableLocations(row.available_locations),
    deliveryModes,
    deliveryMode: primaryDeliveryMode(deliveryModes),
    duration: row.duration ?? '',
    level: normalizeCourseLevel(row.level),
    price: row.price ?? '',
    fundingType: row.funding_type ?? '',
    imageUrl: row.image_url ?? '',
    publicBadges: normalizePublicBadges(row.public_badges),
    coursePurpose: normalizeCoursePurpose(row.course_purpose),
    publicOfferEnabled: offer.publicOfferEnabled ?? false,
    publicOfferLabel: offer.publicOfferLabel ?? '',
    publicOfferDescription: offer.publicOfferDescription ?? '',
    publicOfferCode: offer.publicOfferCode ?? '',
    publicOfferTerms: offer.publicOfferTerms ?? '',
    publicOfferExpiresAt: offer.publicOfferExpiresAt ?? '',
    officialUrl: row.official_url ?? '',
    referralUrl: row.referral_url ?? '',
    commissionType: asCommissionType(row.commission_type),
    commissionValue: row.commission_value ?? '',
    partnerCourse: row.is_partner ?? false,
    featuredCourse: row.is_featured ?? false,
    priorityOrder: row.priority_order ?? 50,
    status: asStatus(row.status),
    showInCareerHub: asBoolean(row.show_in_career_hub),
    clicks: row.clicks ?? 0,
    saves: row.saves ?? 0,
    internalNotes: row.internal_notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function adminCourseInputToInsertRow(input: AdminCourseInput): Omit<CourseRow, 'id' | 'created_at' | 'updated_at' | 'clicks' | 'saves'> {
  const deliveryModes = normalizeDeliveryModesInput(input.deliveryModes, input.deliveryMode)
  const offerRow = mapPublicOfferToRow(input)
  const locationSummary = resolveLocationSummary(input.locationSummary, input.location)
  const availableLocations = normalizeAvailableLocations(input.availableLocations)
  return {
    title: input.title,
    short_description: input.shortDescription || null,
    full_description: input.fullDescription || null,
    category: input.category || null,
    appears_in_routes: normalizeAdminRouteIds(input.routeIds),
    provider_name: input.provider || null,
    location: locationSummary || input.location || null,
    location_summary: (input.locationSummary || '').trim() || null,
    available_locations: availableLocations,
    delivery_mode: primaryDeliveryMode(deliveryModes),
    delivery_modes: deliveryModes,
    duration: input.duration || null,
    level: normalizeCourseLevel(input.level) || null,
    price: input.price || null,
    funding_type: input.fundingType || null,
    official_url: input.officialUrl || null,
    referral_url: input.referralUrl || null,
    image_url: input.imageUrl || null,
    public_badges: normalizePublicBadges(input.publicBadges),
    course_purpose: normalizeCoursePurpose(input.coursePurpose) || null,
    ...offerRow,
    commission_type: input.commissionType,
    commission_value: input.commissionValue || null,
    is_partner: input.partnerCourse,
    is_featured: input.featuredCourse,
    priority_order: input.priorityOrder,
    status: input.status,
    show_in_career_hub: resolveShowInCareerHub(input),
    internal_notes: input.internalNotes || null,
  }
}

export function adminCourseInputToUpdateRow(input: AdminCourseInput): ReturnType<typeof adminCourseInputToInsertRow> {
  return adminCourseInputToInsertRow(input)
}
