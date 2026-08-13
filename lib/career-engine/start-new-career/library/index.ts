/**
 * Start New Career library MVP (public barrel).
 * Reuses Work in My Profession — does not modify WIP/WIE/Extra Income.
 */

export {
  SNC_WORK_TYPES,
  SNC_CAREER_ROUTES,
  SNC_NOT_SURE_ROUTE_IDS,
  listSncWorkTypes,
  getSncWorkType,
  getSncCareerRoute,
  listSncRoutesForWorkType,
} from './work-type-routes'
export type {
  SncWorkTypeId,
  SncWorkType,
  SncCareerRoute,
  SncRouteKind,
} from './work-type-routes'

export { buildStartNewCareerLibraryResult } from './snc-result-builder'
export type { PublicSncResult, PublicSncRoleCard } from './snc-result-builder'

export { buildSncCourseSections } from './snc-course-alignment'
export type { SncCourseCard } from './snc-course-alignment'
