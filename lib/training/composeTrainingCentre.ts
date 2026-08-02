/**
 * Aggregates training data from Career Assistant, route, plan, and saved courses.
 */

import { getCareerPathById } from '@/lib/career-paths'
import { courseDetailHref } from '@/lib/career-hub/myPlan'
import { loadSavedCourses } from '@/lib/career-hub/marketplace/savedPlan'
import { loadCareerPlanItems } from '@/lib/career-hub/myPlan'
import { slugifyCourseName } from '@/lib/career-hub/slug'
import { iconForCourse } from '@/lib/career-hub/routeCategories'
import { formatPrice, formatDuration } from '@/lib/career-hub/marketplace/formatters'
import {
  detectPlanType,
  type AssessmentBundle,
} from '@/lib/dashboard/careerOs/planFromAssessment'
import { extractRouteRequirements, collectAssessmentTrainingRequirements } from '@/lib/dashboard/careerOs/routeRequirements'
import { isExperiencedProfessionalPlan, shouldIncludeTrainingSteps } from '@/lib/dashboard/careerOs/routeProfiles'
import type { CareerPlanItem, CareerPlanItemSource } from '@/lib/career-hub/types'
import type { PlanActivitySignals } from '@/lib/dashboard/careerOs/types'
import { buildUnlockOpportunities, impactForCourse, unlockForCourseName } from './outcomes'
import type {
  TrainingCentreState,
  TrainingCourseItem,
  TrainingCourseSource,
  TrainingItemStatus,
  TrainingProgressStats,
} from './types'

function mapPlanSource(source: CareerPlanItemSource): TrainingCourseSource {
  if (source === 'ai_assessment') return 'career_assistant'
  if (source === 'career_hub') return 'career_route'
  return 'career_plan'
}

function mapReqStatus(status: string): TrainingItemStatus {
  if (status === 'completed') return 'completed'
  if (status === 'in_progress') return 'in_progress'
  return 'not_started'
}

function enrichFromPath(item: TrainingCourseItem, pathId: string | null): TrainingCourseItem {
  if (!pathId) return item
  const path = getCareerPathById(pathId)
  if (!path) return item

  const course = path.courses.find(
    (c) =>
      c.name.toLowerCase() === item.name.toLowerCase() ||
      c.name.toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes(c.name.toLowerCase())
  )

  if (!course) return item

  return {
    ...item,
    duration: item.duration === 'Check provider' || !item.duration ? formatDuration(course.duration) : item.duration,
    cost: item.cost === 'Check provider' || !item.cost ? formatPrice(course.funding) : item.cost,
    provider: item.provider === 'Check provider' ? 'National Careers Service' : item.provider,
    careerImpact: item.careerImpact || impactForCourse(course.name),
    referralUrl: course.externalLink,
  }
}

function baseItem(
  partial: Omit<TrainingCourseItem, 'provider' | 'duration' | 'cost' | 'careerImpact' | 'recommended'> &
    Partial<Pick<TrainingCourseItem, 'provider' | 'duration' | 'cost' | 'careerImpact' | 'recommended'>>
): TrainingCourseItem {
  const unlock = unlockForCourseName(partial.name)
  return enrichFromPath(
    {
      provider: 'Check provider',
      duration: 'On request',
      cost: 'Check provider',
      careerImpact: impactForCourse(partial.name),
      recommended: true,
      icon: iconForCourse(partial.name),
      ...partial,
      unlockedOpportunity: unlock?.unlocksRole,
    },
    partial.pathId ?? null
  )
}

function upsertMap(map: Map<string, TrainingCourseItem>, item: TrainingCourseItem): void {
  const key = item.slug || slugifyCourseName(item.name)
  const existing = map.get(key)
  if (!existing) {
    map.set(key, item)
    return
  }
  const statusRank: Record<TrainingItemStatus, number> = {
    completed: 5,
    in_progress: 4,
    interested: 3,
    saved: 3,
    recommended: 2,
    not_started: 1,
  }
  const mergedStatus =
    statusRank[item.status] >= statusRank[existing.status] ? item.status : existing.status
  map.set(key, enrichFromPath({ ...existing, ...item, status: mergedStatus }, item.pathId ?? existing.pathId ?? null))
}

function planItemToTraining(item: CareerPlanItem): TrainingCourseItem {
  return baseItem({
    id: item.id,
    slug: item.courseSlug,
    name: item.courseName,
    pathId: item.pathId,
    routeLabel: item.routeLabel,
    icon: item.icon,
    status: item.status,
    source: mapPlanSource(item.source),
    required: item.priority === 1,
    recommended: item.status === 'recommended',
    priority: item.priority,
    courseHref: item.pathId ? courseDetailHref(item.pathId, item.courseSlug) : `/courses/${item.courseSlug}`,
    provider: 'Course provider',
    cost: item.priceFrom ?? 'Check provider',
    completedAt: item.status === 'completed' ? item.updatedAt : undefined,
    certificateStatus: item.status === 'completed' ? 'pending' : 'none',
    referralUrl: item.referralUrl,
    affiliateUrl: item.affiliateUrl,
    providerId: item.providerId,
  })
}

function calcStats(items: TrainingCourseItem[]): TrainingProgressStats {
  return {
    required: items.filter((i) => i.required && i.status !== 'completed').length,
    inProgress: items.filter((i) => i.status === 'in_progress').length,
    completed: items.filter((i) => i.status === 'completed').length,
    saved: items.filter((i) => i.status === 'saved' || i.status === 'interested').length,
  }
}

export function composeTrainingCentre(bundle: AssessmentBundle | null): TrainingCentreState {
  const planItems = loadCareerPlanItems()
  const savedCourses = loadSavedCourses()
  const pathId =
    bundle?.trainingRoutes[0]?.pathId ??
    planItems.find((i) => i.pathId)?.pathId ??
    savedCourses.find((c) => c.pathId)?.pathId ??
    null

  const routeLabel =
    bundle?.trainingRoutes[0]?.categoryLabel ??
    planItems.find((i) => i.routeLabel)?.routeLabel ??
    (pathId ? getCareerPathById(pathId)?.title ?? null : null)

  const signals: PlanActivitySignals = {
    planItems,
    savedJobsCount: 0,
    appliedJobsCount: 0,
    interviewConfidence: 0,
    cvQualityScore: 0,
    hasBaseCv: false,
    cvReady: false,
  }

  const map = new Map<string, TrainingCourseItem>()

  if (bundle && pathId) {
    const planType = detectPlanType(bundle.brain)
    const experienced = isExperiencedProfessionalPlan({
      pathId,
      yearsOfExperience: bundle.brain?.careerProfile?.yearsOfExperience,
      planType,
      domain: bundle.brain?.careerProfile?.domain,
    })
    const preliminary = extractRouteRequirements(bundle, pathId, signals, true)
    const includeTraining = shouldIncludeTrainingSteps({
      planType,
      requirementsCount: preliminary.length,
      isExperienced: experienced,
    })

    if (includeTraining) {
      for (const req of collectAssessmentTrainingRequirements(bundle, pathId, signals)) {
        upsertMap(
          map,
          baseItem({
            id: req.id,
            slug: req.slug,
            name: req.name,
            pathId: req.pathId,
            routeLabel: routeLabel ?? undefined,
            status: mapReqStatus(req.status),
            source: 'career_assistant',
            required: req.required,
            recommended: true,
            duration: req.estimatedTime,
            cost: req.estimatedCost,
            careerImpact: req.expectedImpact,
            courseHref: req.courseHref ?? courseDetailHref(req.pathId!, req.slug),
            referralUrl: req.courseHref,
          })
        )
      }
    }
    // Do not inject static career-paths catalogue courses — My Plan uses Coach-resolved data only.
  }

  for (const item of planItems) {
    upsertMap(map, planItemToTraining(item))
  }

  for (const saved of savedCourses) {
    upsertMap(
      map,
      baseItem({
        id: saved.id,
        slug: saved.courseSlug,
        name: saved.courseTitle,
        pathId: saved.pathId,
        routeLabel: saved.routeLabel,
        status: saved.status === 'saved' ? 'saved' : saved.status,
        source: saved.source === 'ai_assessment' ? 'career_assistant' : 'saved',
        required: false,
        recommended: false,
        provider: saved.providerName ?? 'Course provider',
        cost: saved.priceLabel ?? 'Check provider',
        imageUrl: saved.imageUrl,
        courseHref: saved.pathId
          ? courseDetailHref(saved.pathId, saved.courseSlug)
          : `/courses/${saved.courseSlug}`,
        completedAt: saved.status === 'completed' ? saved.updatedAt : undefined,
      })
    )
  }

  const all = [...map.values()]

  const recommended = all
    .filter(
      (i) =>
        i.status !== 'completed' &&
        (i.source === 'career_assistant' ||
          i.source === 'career_route' ||
          (i.source === 'career_plan' && i.status === 'recommended') ||
          (i.recommended && i.status === 'not_started'))
    )
    .sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1
      return (a.priority ?? 99) - (b.priority ?? 99)
    })

  const plan = all
    .filter((i) =>
      ['saved', 'interested', 'in_progress', 'recommended'].includes(i.status)
    )
    .sort((a, b) => {
      const order: TrainingItemStatus[] = ['in_progress', 'saved', 'interested', 'recommended']
      return order.indexOf(a.status) - order.indexOf(b.status)
    })

  const completed = all
    .filter((i) => i.status === 'completed')
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
    )

  const courseNames = all.map((i) => i.name)
  const completedNames = completed.map((i) => i.name)
  const unlocks = buildUnlockOpportunities(courseNames, completedNames, pathId)

  return {
    hasAssessment: Boolean(bundle),
    pathId,
    routeLabel,
    stats: calcStats(all),
    recommended,
    plan,
    completed,
    unlocks,
  }
}
