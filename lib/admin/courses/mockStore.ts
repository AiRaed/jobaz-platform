/**
 * Local mock course catalogue — used when Supabase env vars are missing.
 */

import type { AdminCourse, AdminCourseInput, AdminCourseStore } from './types'
import { LAUNCH_COURSE_CATALOG } from './seedCatalog'
import {
  normalizeDeliveryModesInput,
  primaryDeliveryMode,
  resolveDeliveryModes,
} from './deliveryModes'
import { normalizePublicBadges } from './publicBadges'
import { emptyPublicOfferInput } from './publicOffer'
import { normalizeCourseLevel } from './courseLevels'
import { normalizeCoursePurpose } from './coursePurpose'
import { normalizeAvailableLocations, resolveLocationSummary } from './courseLocations'

export const ADMIN_COURSES_STORAGE_KEY = 'jobaz_admin_courses_v2'
export const ADMIN_COURSES_LEGACY_KEY = 'jobaz_admin_courses_v1'
export const ADMIN_COURSES_UPDATED_EVENT = 'jobaz-admin-courses-updated'

function nowIso(): string {
  return new Date().toISOString()
}

function emptyStore(): AdminCourseStore {
  return { version: 2, courses: [] }
}

type LegacyCourse = {
  id: string
  title: string
  description?: string
  shortDescription?: string
  route?: string
  routeIds?: string[]
  category: string
  providerName?: string
  provider?: string
  location: string
  locationSummary?: string
  availableLocations?: string[]
  deliveryMode: AdminCourse['deliveryMode']
  deliveryModes?: AdminCourse['deliveryModes']
  duration: string
  price: string
  fundingType: string
  level: string
  officialUrl: string
  referralUrl: string
  isPartner?: boolean
  partnerCourse?: boolean
  isFeatured?: boolean
  featuredCourse?: boolean
  priority?: number
  priorityOrder?: number
  commissionType: AdminCourse['commissionType']
  commissionValue: string
  internalNotes: string
  status: AdminCourse['status']
  showInCareerHub: boolean
  imageUrl?: string
  publicBadges?: string[]
  coursePurpose?: string
  publicOfferEnabled?: boolean
  publicOfferLabel?: string
  publicOfferDescription?: string
  publicOfferCode?: string
  publicOfferTerms?: string
  publicOfferExpiresAt?: string
  fullDescription?: string
  clicks: number
  saves: number
  createdAt: string
  updatedAt: string
}

function migrateCourse(raw: LegacyCourse): AdminCourse {
  const routeIds = raw.routeIds?.length ? raw.routeIds : raw.route ? [raw.route] : []
  const deliveryModes = resolveDeliveryModes(raw.deliveryModes, raw.deliveryMode)
  const offerDefaults = emptyPublicOfferInput()
  return {
    id: raw.id,
    title: raw.title,
    shortDescription: raw.shortDescription ?? raw.description ?? '',
    fullDescription: raw.fullDescription ?? raw.description ?? '',
    category: raw.category,
    routeIds,
    provider: raw.provider ?? raw.providerName ?? '',
    location: raw.location,
    locationSummary: raw.locationSummary ?? raw.location ?? '',
    availableLocations: normalizeAvailableLocations(raw.availableLocations),
    deliveryModes,
    deliveryMode: primaryDeliveryMode(deliveryModes),
    duration: raw.duration,
    level: normalizeCourseLevel(raw.level),
    price: raw.price,
    fundingType: raw.fundingType,
    imageUrl: raw.imageUrl ?? '',
    publicBadges: normalizePublicBadges(raw.publicBadges),
    coursePurpose: normalizeCoursePurpose(raw.coursePurpose),
    publicOfferEnabled: raw.publicOfferEnabled ?? offerDefaults.publicOfferEnabled ?? false,
    publicOfferLabel: raw.publicOfferLabel ?? offerDefaults.publicOfferLabel ?? '',
    publicOfferDescription: raw.publicOfferDescription ?? offerDefaults.publicOfferDescription ?? '',
    publicOfferCode: raw.publicOfferCode ?? offerDefaults.publicOfferCode ?? '',
    publicOfferTerms: raw.publicOfferTerms ?? offerDefaults.publicOfferTerms ?? '',
    publicOfferExpiresAt: raw.publicOfferExpiresAt ?? offerDefaults.publicOfferExpiresAt ?? '',
    officialUrl: raw.officialUrl,
    referralUrl: raw.referralUrl,
    commissionType: raw.commissionType,
    commissionValue: raw.commissionValue,
    partnerCourse: raw.partnerCourse ?? raw.isPartner ?? false,
    featuredCourse: raw.featuredCourse ?? raw.isFeatured ?? false,
    priorityOrder: raw.priorityOrder ?? raw.priority ?? 50,
    status: raw.status,
    showInCareerHub: raw.showInCareerHub,
    clicks: raw.clicks,
    saves: raw.saves,
    internalNotes: raw.internalNotes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

function readStore(): AdminCourseStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const rawV2 = localStorage.getItem(ADMIN_COURSES_STORAGE_KEY)
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as AdminCourseStore
      if (parsed?.courses && Array.isArray(parsed.courses)) {
        return { version: 2, courses: parsed.courses.map((c) => migrateCourse(c as LegacyCourse)) }
      }
    }
    const rawV1 = localStorage.getItem(ADMIN_COURSES_LEGACY_KEY)
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as { courses?: LegacyCourse[] }
      if (parsed?.courses?.length) {
        const migrated = parsed.courses.map(migrateCourse)
        writeStore({ version: 2, courses: migrated })
        return { version: 2, courses: migrated }
      }
    }
  } catch {
    return emptyStore()
  }
  return emptyStore()
}

function writeStore(store: AdminCourseStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_COURSES_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(ADMIN_COURSES_UPDATED_EVENT))
}

function seedCourses(): AdminCourse[] {
  const ts = nowIso()
  return LAUNCH_COURSE_CATALOG.map((c) => ({
    ...c,
    clicks: 0,
    saves: 0,
    createdAt: ts,
    updatedAt: ts,
  }))
}

export function loadMockAdminCourses(): AdminCourse[] {
  const store = readStore()
  if (store.courses.length === 0) {
    const seeded = seedCourses()
    writeStore({ version: 2, courses: seeded })
    return seeded
  }
  return store.courses.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function withNormalizedDelivery(input: AdminCourseInput): AdminCourseInput {
  const deliveryModes = normalizeDeliveryModesInput(input.deliveryModes, input.deliveryMode)
  const locationSummary = resolveLocationSummary(input.locationSummary, input.location)
  return {
    ...input,
    deliveryModes,
    deliveryMode: primaryDeliveryMode(deliveryModes),
    publicBadges: normalizePublicBadges(input.publicBadges),
    locationSummary: (input.locationSummary || '').trim() || locationSummary,
    location: locationSummary,
    availableLocations: normalizeAvailableLocations(input.availableLocations),
    level: normalizeCourseLevel(input.level),
    coursePurpose: normalizeCoursePurpose(input.coursePurpose),
  }
}

export function createMockAdminCourse(input: AdminCourseInput): AdminCourse {
  const store = readStore()
  const ts = nowIso()
  const normalized = withNormalizedDelivery(input)
  const course: AdminCourse = {
    ...normalized,
    id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    clicks: 0,
    saves: 0,
    createdAt: ts,
    updatedAt: ts,
  }
  store.courses = [course, ...store.courses]
  writeStore(store)
  return course
}

export function updateMockAdminCourse(id: string, input: AdminCourseInput): AdminCourse | null {
  const store = readStore()
  const idx = store.courses.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const existing = store.courses[idx]!
  const normalized = withNormalizedDelivery(input)
  const updated: AdminCourse = {
    ...existing,
    ...normalized,
    id: existing.id,
    clicks: existing.clicks,
    saves: existing.saves,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
  }
  store.courses[idx] = updated
  writeStore(store)
  return updated
}

export function hideMockAdminCourse(id: string): AdminCourse | null {
  const store = readStore()
  const idx = store.courses.findIndex((c) => c.id === id)
  if (idx < 0) return null
  store.courses[idx] = {
    ...store.courses[idx]!,
    status: 'hidden',
    showInCareerHub: false,
    updatedAt: nowIso(),
  }
  writeStore(store)
  return store.courses[idx]!
}

export function deleteMockAdminCourse(id: string): boolean {
  const store = readStore()
  const next = store.courses.filter((c) => c.id !== id)
  if (next.length === store.courses.length) return false
  writeStore({ version: 2, courses: next })
  return true
}

export function adminCourseToInput(course: AdminCourse): AdminCourseInput {
  const {
    id: _id,
    clicks: _clicks,
    saves: _saves,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...input
  } = course
  return input
}
