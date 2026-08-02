/**
 * Admin course catalogue — Supabase repository with local mock fallback.
 */

import {
  adminCourseToInput,
  createMockAdminCourse,
  deleteMockAdminCourse,
  hideMockAdminCourse,
  loadMockAdminCourses,
  updateMockAdminCourse,
} from './mockStore'
import type { AdminCourse, AdminCourseInput } from './types'

export type CourseDataSource = 'supabase' | 'mock'

export type CoursesRepoResult<T> = { ok: true; data: T } | { ok: false; error: string }

export function isSupabaseCoursesConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error || res.statusText || 'Request failed'
  } catch {
    return res.statusText || 'Request failed'
  }
}

export async function fetchAdminCourses(): Promise<
  CoursesRepoResult<{ courses: AdminCourse[]; source: CourseDataSource }>
> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: { courses: loadMockAdminCourses(), source: 'mock' } }
  }

  try {
    const res = await fetch('/api/admin/courses', { cache: 'no-store' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { courses: AdminCourse[] }
    return { ok: true, data: { courses: body.courses ?? [], source: 'supabase' } }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to load courses',
    }
  }
}

export async function createAdminCourseRecord(
  input: AdminCourseInput
): Promise<CoursesRepoResult<AdminCourse>> {
  if (!isSupabaseCoursesConfigured()) {
    return { ok: true, data: createMockAdminCourse(input) }
  }

  try {
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { course: AdminCourse }
    return { ok: true, data: body.course }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to create course',
    }
  }
}

export async function updateAdminCourseRecord(
  id: string,
  input: AdminCourseInput
): Promise<CoursesRepoResult<AdminCourse>> {
  if (!isSupabaseCoursesConfigured()) {
    const updated = updateMockAdminCourse(id, input)
    if (!updated) return { ok: false, error: 'Course not found' }
    return { ok: true, data: updated }
  }

  try {
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { course: AdminCourse }
    return { ok: true, data: body.course }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to update course',
    }
  }
}

export async function hideAdminCourseRecord(
  course: AdminCourse
): Promise<CoursesRepoResult<AdminCourse>> {
  const input: AdminCourseInput = {
    ...adminCourseToInput(course),
    status: 'hidden',
    showInCareerHub: false,
  }
  return updateAdminCourseRecord(course.id, input)
}

export async function deleteAdminCourseRecord(id: string): Promise<CoursesRepoResult<null>> {
  if (!isSupabaseCoursesConfigured()) {
    const deleted = deleteMockAdminCourse(id)
    if (!deleted) return { ok: false, error: 'Course not found' }
    return { ok: true, data: null }
  }

  try {
    const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    return { ok: true, data: null }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to delete course',
    }
  }
}
