/**
 * Saved career plan — localStorage with Supabase-ready structure.
 */

import { getCategoryForPathId } from '@/lib/career-hub/routeCategories'
import type { MarketplaceCourse } from './types'
import type { SavedCareerPlanStore, SavedCourseRecord, SavedJobRecord, SavedRouteRecord } from './types'

export const SAVED_PLAN_STORAGE_KEY = 'jobaz_saved_career_plan_v1'
export const SAVED_PLAN_UPDATED_EVENT = 'jobaz-saved-career-plan-updated'

function nowIso(): string {
  return new Date().toISOString()
}

function emptyStore(): SavedCareerPlanStore {
  return { version: 1, courses: [], routes: [], jobs: [] }
}

function readStore(): SavedCareerPlanStore {
  if (typeof window === 'undefined') return emptyStore()
  try {
    const raw = localStorage.getItem(SAVED_PLAN_STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as SavedCareerPlanStore
    return {
      version: 1,
      courses: parsed.courses ?? [],
      routes: parsed.routes ?? [],
      jobs: parsed.jobs ?? [],
    }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: SavedCareerPlanStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SAVED_PLAN_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(SAVED_PLAN_UPDATED_EVENT))
}

export function loadSavedCourses(): SavedCourseRecord[] {
  return readStore().courses.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function isCourseSaved(courseId: string): boolean {
  return readStore().courses.some((c) => c.courseId === courseId)
}

export function saveCourseToPlan(
  course: MarketplaceCourse,
  source: SavedCourseRecord['source'] = 'career_hub'
): SavedCourseRecord {
  const store = readStore()
  const routeLabel = getCategoryForPathId(course.primaryPathId)?.label
  const record: SavedCourseRecord = {
    id: `saved-course-${course.id}`,
    userId: null,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    pathId: course.primaryPathId,
    routeLabel,
    providerName: course.providerLabel,
    priceLabel: course.priceLabel,
    imageUrl: course.imageUrl,
    status: 'saved',
    source,
    savedAt: store.courses.find((c) => c.courseId === course.id)?.savedAt ?? nowIso(),
    updatedAt: nowIso(),
  }

  store.courses = [...store.courses.filter((c) => c.courseId !== course.id), record]
  writeStore(store)
  return record
}

export function saveRouteToPlan(pathId: string, routeLabel: string): SavedRouteRecord {
  const store = readStore()
  const record: SavedRouteRecord = {
    id: `saved-route-${pathId}`,
    userId: null,
    pathId,
    routeLabel,
    savedAt: nowIso(),
  }
  store.routes = [...store.routes.filter((r) => r.pathId !== pathId), record]
  writeStore(store)
  return record
}

export function saveJobToPlan(jobId: string, jobTitle: string): SavedJobRecord {
  const store = readStore()
  const record: SavedJobRecord = {
    id: `saved-job-${jobId}`,
    userId: null,
    jobId,
    jobTitle,
    savedAt: nowIso(),
  }
  store.jobs = [...store.jobs.filter((j) => j.jobId !== jobId), record]
  writeStore(store)
  return record
}

export function loadSavedPlanStore(): SavedCareerPlanStore {
  return readStore()
}
