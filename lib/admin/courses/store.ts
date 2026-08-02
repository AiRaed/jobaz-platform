/**
 * Admin course display helpers + legacy mock exports.
 */

import { CAREER_PATHS } from '@/lib/career-paths'
import { getCategoryById } from '@/lib/career-hub/routeCategories'

export {
  ADMIN_COURSES_LEGACY_KEY,
  ADMIN_COURSES_STORAGE_KEY,
  ADMIN_COURSES_UPDATED_EVENT,
  adminCourseToInput,
  createMockAdminCourse as createAdminCourse,
  deleteMockAdminCourse as deleteAdminCourse,
  hideMockAdminCourse as hideAdminCourse,
  loadMockAdminCourses as loadAdminCourses,
  updateMockAdminCourse as updateAdminCourse,
} from './mockStore'

export function getCategoryLabel(categoryId: string): string {
  return getCategoryById(categoryId)?.label ?? (categoryId || '—')
}

export function getRouteLabel(pathId: string): string {
  return CAREER_PATHS.find((p) => p.id === pathId)?.title ?? (pathId || '—')
}

export function getRouteLabels(pathIds: string[]): string {
  if (!pathIds.length) return '—'
  return pathIds.map(getRouteLabel).join(', ')
}
