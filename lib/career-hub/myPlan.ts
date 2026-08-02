/**
 * Career Hub — user career plan storage (Phase 1: localStorage, Supabase-ready shape).
 */

import type { CareerPlanItem, CareerPlanItemStatus } from './types'
import type { RouteRequirement } from '@/lib/dashboard/careerOs/types'
import { slugifyCourseName } from './slug'
import { iconForCourse } from './routeCategories'
import { careerHubCourseUrl, careerHubRouteUrl } from './explorerUrl'

export const CAREER_PLAN_STORAGE_KEY = 'jobaz_career_plan_v1'
export const CAREER_PLAN_UPDATED_EVENT = 'jobaz-career-plan-updated'

type PlanStore = {
  version: 1
  items: CareerPlanItem[]
  lastAssessmentAt?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function emptyStore(): PlanStore {
  return { version: 1, items: [] }
}

function readStore(): PlanStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const raw = localStorage.getItem(CAREER_PLAN_STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as PlanStore
    if (!parsed?.items || !Array.isArray(parsed.items)) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

function writeStore(store: PlanStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CAREER_PLAN_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(CAREER_PLAN_UPDATED_EVENT))
}

export function loadCareerPlanItems(): CareerPlanItem[] {
  return readStore().items.sort((a, b) => {
    const pa = a.priority ?? 99
    const pb = b.priority ?? 99
    if (pa !== pb) return pa - pb
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

export function upsertCareerPlanItem(
  input: Omit<CareerPlanItem, 'id' | 'addedAt' | 'updatedAt'> & { id?: string }
): CareerPlanItem {
  const store = readStore()
  const slug = input.courseSlug || slugifyCourseName(input.courseName)
  const id = input.id ?? `${slug}-${input.pathId ?? 'general'}`
  const existing = store.items.find((i) => i.id === id)
  const item: CareerPlanItem = {
    id,
    courseName: input.courseName,
    courseSlug: slug,
    pathId: input.pathId,
    routeLabel: input.routeLabel,
    icon: input.icon ?? iconForCourse(input.courseName),
    status: input.status,
    source: input.source,
    priority: input.priority,
    addedAt: existing?.addedAt ?? nowIso(),
    updatedAt: nowIso(),
    providerId: input.providerId,
    referralUrl: input.referralUrl,
    affiliateUrl: input.affiliateUrl,
    priceFrom: input.priceFrom,
    startDate: input.startDate,
    courseId: input.courseId ?? existing?.courseId,
    startedAt: input.startedAt ?? existing?.startedAt,
    completedAt: input.completedAt ?? existing?.completedAt,
  }
  store.items = [...store.items.filter((i) => i.id !== id), item]
  writeStore(store)
  return item
}

export function planItemIdForRequirement(req: Pick<RouteRequirement, 'slug' | 'pathId'>): string {
  return `${req.slug}-${req.pathId ?? 'general'}`
}

export function updateCareerPlanStatus(id: string, status: CareerPlanItemStatus): CareerPlanItem | null {
  const store = readStore()
  const idx = store.items.findIndex((i) => i.id === id)
  if (idx < 0) return null
  const now = nowIso()
  const existing = store.items[idx]!
  store.items[idx] = {
    ...existing,
    status,
    updatedAt: now,
    startedAt:
      status === 'in_progress' && !existing.startedAt ? now : existing.startedAt,
    completedAt: status === 'completed' ? now : existing.completedAt,
  }
  writeStore(store)
  return store.items[idx]!
}

export function startTrainingRequirement(req: RouteRequirement): CareerPlanItem {
  const id = planItemIdForRequirement(req)
  return upsertCareerPlanItem({
    id,
    courseName: req.name,
    courseSlug: req.slug,
    pathId: req.pathId,
    courseId: req.id,
    status: 'in_progress',
    source: 'ai_assessment',
    startedAt: nowIso(),
  })
}

export function completeTrainingRequirement(req: RouteRequirement): CareerPlanItem {
  const id = planItemIdForRequirement(req)
  const existing = readStore().items.find((i) => i.id === id)
  const now = nowIso()
  return upsertCareerPlanItem({
    id,
    courseName: req.name,
    courseSlug: req.slug,
    pathId: req.pathId,
    courseId: req.id,
    status: 'completed',
    source: 'ai_assessment',
    startedAt: existing?.startedAt ?? now,
    completedAt: now,
  })
}

export function saveRecommendationsToPlan(
  courses: Array<{
    courseName: string
    pathId?: string
    routeLabel?: string
    priority?: number
  }>,
  options?: { markSaved?: boolean }
): CareerPlanItem[] {
  const status: CareerPlanItemStatus = options?.markSaved ? 'saved' : 'recommended'
  return courses.map((c, i) =>
    upsertCareerPlanItem({
      courseName: c.courseName,
      courseSlug: slugifyCourseName(c.courseName),
      pathId: c.pathId,
      routeLabel: c.routeLabel,
      status,
      source: 'ai_assessment',
      priority: c.priority ?? i + 1,
      icon: iconForCourse(c.courseName),
    })
  )
}

export function getPrimaryPlanItem(): CareerPlanItem | null {
  const items = loadCareerPlanItems()
  const active = items.filter((i) => i.status !== 'completed')
  return active[0] ?? null
}

export function getUnfinishedPlanCount(): number {
  return loadCareerPlanItems().filter((i) => i.status === 'recommended' || i.status === 'saved').length
}

export function courseDetailHref(_pathId: string, courseSlug: string): string {
  return `/courses/${courseSlug}`
}

export function careerHubPathHref(pathId: string, params?: Record<string, string>): string {
  if (params && Object.keys(params).length > 0) {
    const q = new URLSearchParams({ route: pathId, ...params })
    return `/career-hub?${q.toString()}`
  }
  return careerHubRouteUrl(pathId)
}
