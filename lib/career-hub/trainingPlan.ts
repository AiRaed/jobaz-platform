/**
 * Recommended training routes from UK Career Assistant assessment.
 */

import type { UkTransitionGrowthOutput } from '@/lib/career-brain/ukTransition/ukTransitionTypes'
import { getCareerPathById } from '@/lib/career-paths'
import { CAREER_HUB_CATEGORIES, UK_ROUTE_TO_PATH } from './routeCategories'
import { extractUkTransitionRecommendations } from './recommendations'
import { careerHubRouteUrl } from './explorerUrl'

export type RecommendedTrainingRoute = {
  categoryLabel: string
  pathId: string
  icon: string
  readinessPercent: number
  nextStepLabel: string
  rank: number
}

export const TRAINING_ROUTES_STORAGE_KEY = 'jobaz_training_routes_v1'
export const TRAINING_ROUTES_UPDATED_EVENT = 'jobaz-training-routes-updated'

const READINESS_BY_RANK = [70, 65, 60]

const INTEREST_TO_CATEGORIES: Record<string, string[]> = {
  people: ['care', 'hospitality', 'teaching'],
  hands_on: ['construction', 'warehouse', 'security'],
  driving: ['driving', 'warehouse'],
  office: ['office', 'digital'],
  healthcare_education: ['care', 'teaching'],
  business: ['self-employment', 'office'],
}

function inferRouteKey(label: string): string {
  const l = label.toLowerCase()
  if (/security|sia/.test(l)) return 'entry_security'
  if (/warehouse|logistics|forklift/.test(l)) return 'entry_warehouse'
  if (/construction|cscs/.test(l)) return 'entry_construction'
  if (/care|healthcare/.test(l)) return 'entry_care'
  if (/hospitality|chef|food/.test(l)) return 'entry_hospitality'
  if (/driving|transport|hgv|taxi|cpc/.test(l)) return 'exp_driver'
  if (/electrician/.test(l)) return 'exp_electrician'
  if (/teaching|education/.test(l)) return 'degree_education'
  if (/office|admin/.test(l)) return 'entry_office'
  if (/digital|it|technology/.test(l)) return 'degree_it'
  return 'entry_warehouse'
}

function shortenNextStep(courseName: string): string {
  if (/sia/i.test(courseName)) return 'SIA Training'
  if (/care certificate/i.test(courseName)) return 'Care Certificate'
  if (/cscs/i.test(courseName)) return 'CSCS Green Card'
  if (/forklift/i.test(courseName)) return 'Forklift Training'
  if (/cpc|hgv|driver/i.test(courseName)) return 'Driver CPC'
  if (/food hygiene/i.test(courseName)) return 'Food Hygiene'
  if (/first aid/i.test(courseName)) return 'First Aid'
  return courseName.length > 28 ? `${courseName.slice(0, 25)}…` : courseName
}

function categoryForPathId(pathId: string) {
  return CAREER_HUB_CATEGORIES.find((c) => c.pathIds.includes(pathId))
}

function buildRoute(
  pathId: string,
  rank: number,
  nextStep: string,
  readinessOverride?: number
): RecommendedTrainingRoute | null {
  const cat = categoryForPathId(pathId)
  const path = getCareerPathById(pathId)
  if (!path) return null
  return {
    categoryLabel: cat?.label ?? path.title,
    pathId,
    icon: cat?.icon ?? path.icon,
    readinessPercent: readinessOverride ?? READINESS_BY_RANK[rank - 1] ?? 55,
    nextStepLabel: nextStep,
    rank,
  }
}

export function extractTrainingPlanRoutes(
  ukGrowth: UkTransitionGrowthOutput | null | undefined,
  interestArea?: string | null
): RecommendedTrainingRoute[] {
  if (!ukGrowth?.finalReport) return []

  const report = ukGrowth.finalReport
  const primaryPathId = UK_ROUTE_TO_PATH[inferRouteKey(report.recommendedRouteLabel)] ?? 'warehouse-logistics'
  const courses = extractUkTransitionRecommendations(ukGrowth)
  const primaryNext = courses[0]?.courseName
    ? shortenNextStep(courses[0].courseName)
    : report.recommendedCourses[0]
      ? shortenNextStep(report.recommendedCourses[0])
      : 'View courses on this route'

  const routes: RecommendedTrainingRoute[] = []
  const primary = buildRoute(primaryPathId, 1, primaryNext, Math.min(95, report.confidenceScore || 70))
  if (primary) routes.push(primary)

  const usedPathIds = new Set([primaryPathId])
  const relatedCategoryIds = INTEREST_TO_CATEGORIES[interestArea ?? ''] ?? []

  for (const catId of relatedCategoryIds) {
    if (routes.length >= 3) break
    const cat = CAREER_HUB_CATEGORIES.find((c) => c.id === catId)
    if (!cat) continue
    const pathId = cat.pathIds.find((id) => !usedPathIds.has(id))
    if (!pathId) continue
    const path = getCareerPathById(pathId)
    const nextCourse = path?.courses[0]?.name
    const route = buildRoute(pathId, routes.length + 1, nextCourse ? shortenNextStep(nextCourse) : cat.label)
    if (route) {
      routes.push(route)
      usedPathIds.add(pathId)
    }
  }

  for (const cat of CAREER_HUB_CATEGORIES) {
    if (routes.length >= 3) break
    const pathId = cat.pathIds.find((id) => !usedPathIds.has(id))
    if (!pathId) continue
    const path = getCareerPathById(pathId)
    const nextCourse = path?.courses[0]?.name
    const route = buildRoute(pathId, routes.length + 1, nextCourse ? shortenNextStep(nextCourse) : cat.label)
    if (route) {
      routes.push(route)
      usedPathIds.add(pathId)
    }
  }

  return routes.slice(0, 3)
}

export function saveTrainingRoutes(routes: RecommendedTrainingRoute[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TRAINING_ROUTES_STORAGE_KEY, JSON.stringify({ version: 1, routes, savedAt: new Date().toISOString() }))
  window.dispatchEvent(new CustomEvent(TRAINING_ROUTES_UPDATED_EVENT))
}

export function loadTrainingRoutes(): RecommendedTrainingRoute[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TRAINING_ROUTES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { routes?: RecommendedTrainingRoute[] }
    return parsed.routes ?? []
  } catch {
    return []
  }
}

export function trainingRouteHref(pathId: string, caSessionId?: string | null): string {
  return careerHubRouteUrl(pathId, { caSessionId })
}
