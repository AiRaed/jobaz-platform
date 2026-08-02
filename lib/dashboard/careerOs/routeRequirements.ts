import { getCareerPathById } from '@/lib/career-paths'
import { slugifyCourseName } from '@/lib/career-hub/slug'
import { courseDetailHref } from '@/lib/career-hub/myPlan'
import { extractUkTransitionRecommendations } from '@/lib/career-hub/recommendations'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import type { ExtraIncomePlanResult } from '@/lib/career-engine/extra-income/types'
import type { AssessmentBundle } from './planFromAssessment'
import {
  categorizeTrainingTier,
  getTrainingActionLabel,
} from './trainingActions'
import { extractPathTrainingTitles } from './pathPlanLadder'
import {
  allowExtraIncomeQualTitle,
  collectSkillHints,
} from './myPlanDisplayFilter'
import type { PlanActivitySignals, RouteRequirement, RouteRequirementStatus } from './types'

function isCareerEngineResult(raw: unknown): raw is CareerEnginePlanResult {
  return Boolean(raw && typeof raw === 'object' && 'essentialActions' in raw && 'recommendedCourses' in raw)
}

function isExtraIncomeResult(raw: unknown): raw is ExtraIncomePlanResult {
  return Boolean(
    raw &&
      typeof raw === 'object' &&
      (raw as ExtraIncomePlanResult).pathId === 'side_job' &&
      Array.isArray((raw as ExtraIncomePlanResult).qualifications)
  )
}

function requirementStatus(name: string, planItems: PlanActivitySignals['planItems']): RouteRequirementStatus {
  const slug = slugifyCourseName(name)
  const item = planItems.find((p) => p.courseSlug === slug || p.courseName === name)
  if (!item) return 'not_started'
  if (item.status === 'completed') return 'completed'
  if (item.status === 'in_progress' || item.status === 'saved' || item.status === 'interested') {
    return 'in_progress'
  }
  return 'not_started'
}

function enrichRequirement(req: RouteRequirement): RouteRequirement {
  const sectionTier = req.sectionTier ?? categorizeTrainingTier(req)
  const withTier = { ...req, sectionTier }
  return {
    ...withTier,
    actionLabel: req.actionLabel ?? getTrainingActionLabel(withTier),
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchesCourse(pathCourseName: string, targetName: string): boolean {
  const a = normalizeName(pathCourseName)
  const b = normalizeName(targetName)
  return a.includes(b) || b.includes(a) || slugifyCourseName(a) === slugifyCourseName(b)
}

function inferType(name: string): RouteRequirement['type'] {
  if (/licence|license|sia|dbs|cscs|cpc|hgv/i.test(name)) return 'licence'
  if (/certificate|certification|level \d|nvq|btec|diploma/i.test(name)) return 'certification'
  return 'course'
}

function impactFromCourse(name: string, type: RouteRequirement['type'], courseType?: string): string {
  if (/dbs/i.test(name)) return 'Required for roles working with vulnerable people'
  if (/sia/i.test(name)) return 'Legal requirement for licensed security work in the UK'
  if (/care certificate/i.test(name)) return 'Required by most care employers'
  if (/moving|handling/i.test(name)) return 'Essential for safe manual handling in care'
  if (/safeguarding/i.test(name)) return 'Required for regulated care and education roles'
  if (/cscs/i.test(name)) return 'Required on most UK construction sites'
  if (/teaching|learning/i.test(name)) return 'Expected qualification for school support roles'
  if (courseType?.includes('Professional')) return 'Professional certification for this route'
  if (type === 'licence') return 'Licence required before you can work in this role'
  return 'Builds skills employers expect on your chosen route'
}

function collectAssessmentNames(bundle: AssessmentBundle): string[] {
  const names: string[] = []
  const uk = bundle.brain?.ukTransitionGrowth
  if (uk) names.push(...extractUkTransitionRecommendations(uk).map((s) => s.courseName))
  const report = uk?.finalReport
  if (report) names.push(...report.recommendedCertifications, ...report.recommendedCourses)
  if (bundle.brain?.recommendedCourses?.length) names.push(...bundle.brain.recommendedCourses)
  for (const role of bundle.brain?.recommendedPaths?.workNow ?? []) {
    if (role.recommendedTraining?.length) names.push(...role.recommendedTraining)
  }
  for (const role of bundle.brain?.recommendedPaths?.buildNext ?? []) {
    if (role.recommendedTraining?.length) names.push(...role.recommendedTraining)
  }
  const change = bundle.brain?.careerChangeTransition
  if (change?.recommendedTraining?.length) names.push(...change.recommendedTraining)
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))]
}

export function extractRouteRequirements(
  bundle: AssessmentBundle,
  pathId: string | null,
  signals: PlanActivitySignals,
  includeTraining: boolean
): RouteRequirement[] {
  if (!includeTraining || !pathId) return []

  const path = getCareerPathById(pathId)
  if (!path) return []

  const assessmentNames = collectAssessmentNames(bundle)
  const pathCourses = path.courses ?? []

  const selectedCourses = pathCourses.filter((course) => {
    if (assessmentNames.length === 0) return true
    return assessmentNames.some((n) => matchesCourse(course.name, n))
  })

  const coursesToUse =
    selectedCourses.length > 0
      ? selectedCourses.slice(0, 5)
      : pathCourses.slice(0, 4)

  const reqs: RouteRequirement[] = coursesToUse.map((course, index) => {
    const type = inferType(course.name)
    return {
      id: slugifyCourseName(course.name),
      name: course.name,
      slug: slugifyCourseName(course.name),
      type,
      status: requirementStatus(course.name, signals.planItems),
      required: index < 2 || type === 'licence' || /required|certificate/i.test(course.type),
      estimatedTime: course.duration || path.realityCheck.timeToReady,
      estimatedCost: course.funding || 'Check provider',
      expectedImpact: impactFromCourse(course.name, type, course.type),
      pathId,
      courseHref: course.externalLink || courseDetailHref(pathId, slugifyCourseName(course.name)),
      source: 'path_requirement',
    }
  })

  for (const licence of path.requirements.licences.slice(0, 2)) {
    const shortName = licence.split('(')[0]?.trim() ?? licence
    if (reqs.some((r) => matchesCourse(r.name, shortName))) continue
    reqs.push({
      id: slugifyCourseName(shortName),
      name: shortName,
      slug: slugifyCourseName(shortName),
      type: 'licence',
      status: requirementStatus(shortName, signals.planItems),
      required: true,
      estimatedTime: path.realityCheck.timeToReady,
      estimatedCost: 'Varies — check provider',
      expectedImpact: impactFromCourse(shortName, 'licence'),
      pathId,
      courseHref: courseDetailHref(pathId, slugifyCourseName(shortName)),
      source: 'path_requirement',
    })
  }

  return reqs.map(enrichRequirement)
}

/** Career Engine structured results (education / experience paths). */
export function extractCareerEngineRouteRequirements(
  bundle: AssessmentBundle,
  signals: PlanActivitySignals
): RouteRequirement[] {
  const raw = bundle.aiState?.career_engine_result

  if (isExtraIncomeResult(raw)) {
    const skillBlob = collectSkillHints(raw.skillsLabels, raw.answers ?? {})
    const routeLabel = `${raw.skillsLabels[0] ?? 'Side'} extra income`
    return raw.qualifications
      .filter((qual) => allowExtraIncomeQualTitle(qual.title, skillBlob, routeLabel))
      .slice(0, 5)
      .map((qual) =>
        enrichRequirement({
          id: qual.id,
          name: qual.title,
          slug: slugifyCourseName(qual.title),
          type: inferType(qual.title),
          status: requirementStatus(qual.title, signals.planItems),
          required: Boolean(qual.recommendedBadge),
          estimatedTime: qual.studyTime || 'Varies',
          estimatedCost: qual.cost || 'Check provider',
          expectedImpact: qual.whyHelps.slice(0, 140),
          courseHref: '/dashboard#recommended-training',
          source: 'recommended_course',
        })
      )
  }

  if (!isCareerEngineResult(raw)) return []

  const reqs: RouteRequirement[] = []
  const defaultPathId = raw.recommendedCourses[0]?.pathId

  for (const action of raw.essentialActions) {
    reqs.push({
      id: action.id,
      name: action.title,
      slug: action.id,
      type: inferType(action.title),
      status: requirementStatus(action.title, signals.planItems),
      required: action.priority === 'critical',
      estimatedTime: 'Varies',
      estimatedCost: 'Check provider',
      expectedImpact: action.description.slice(0, 140),
      pathId: defaultPathId,
      courseHref: action.href ?? '/dashboard#recommended-training',
      source: 'essential_action',
    })
  }

  for (const course of raw.recommendedCourses) {
    const slug = course.slug ?? slugifyCourseName(course.title)
    if (reqs.some((r) => r.slug === slug || matchesCourse(r.name, course.title))) continue
    reqs.push({
      id: slug,
      name: course.title,
      slug,
      type: 'course',
      status: requirementStatus(course.title, signals.planItems),
      required: true,
      estimatedTime: course.duration ?? 'Varies',
      estimatedCost: course.costLabel ?? 'Check provider',
      expectedImpact: course.whyReasons[0] ?? 'Builds skills employers expect on your chosen route',
      pathId: course.pathId ?? defaultPathId,
      courseHref:
        course.href ??
        (course.pathId ? courseDetailHref(course.pathId, slug) : '/dashboard#recommended-training'),
      source: 'recommended_course',
    })
  }

  return reqs.map(enrichRequirement)
}

function requirementFromTitle(
  name: string,
  signals: PlanActivitySignals,
  options: {
    pathId?: string | null
    source: NonNullable<RouteRequirement['source']>
    href?: string
    required?: boolean
    impact?: string
    id?: string
  }
): RouteRequirement {
  const slug = options.id ?? slugifyCourseName(name)
  const type = inferType(name)
  const pathId = options.pathId ?? undefined
  const base: RouteRequirement = {
    id: slug,
    name: name.trim(),
    slug,
    type,
    status: requirementStatus(name, signals.planItems),
    required: options.required ?? true,
    estimatedTime: 'Varies',
    estimatedCost: 'Check provider',
    expectedImpact: options.impact ?? impactFromCourse(name, type),
    pathId,
    courseHref:
      options.href ??
      (pathId ? courseDetailHref(pathId, slug) : '/dashboard?tab=training'),
    source: options.source,
  }
  const sectionTier = categorizeTrainingTier(base)
  return {
    ...base,
    sectionTier,
    actionLabel: getTrainingActionLabel(base),
  }
}

function sortTrainingRequirements(reqs: RouteRequirement[]): RouteRequirement[] {
  const score = (req: RouteRequirement) => {
    if (/enic|qualification recognition|uk qualification/i.test(req.name)) return 0
    if (req.type === 'licence') return 1
    if (req.source === 'essential_action') return 2
    if (req.type === 'course') return 3
    return req.required ? 4 : 5
  }
  return [...reqs].sort((a, b) => score(a) - score(b))
}

/**
 * Single collector for all assessment-generated training unlock steps.
 * Used exclusively by generateCareerRoadmap() — do not duplicate elsewhere.
 */
export function collectAssessmentTrainingRequirements(
  bundle: AssessmentBundle,
  pathId: string | null,
  signals: PlanActivitySignals
): RouteRequirement[] {
  const reqs: RouteRequirement[] = []
  const seen = new Set<string>()

  const push = (req: RouteRequirement) => {
    const key = normalizeName(req.name)
    if (seen.has(key)) return
    seen.add(key)
    reqs.push(req)
  }

  const engineResult = bundle.aiState?.career_engine_result
  const isSideJob = isExtraIncomeResult(engineResult)

  // Extra Income: qualifications from Career Coach only — never path catalog / long-term streams
  if (isSideJob) {
    for (const req of extractCareerEngineRouteRequirements(bundle, signals)) {
      push(req)
    }
    return sortTrainingRequirements(reqs.map(enrichRequirement))
  }

  for (const req of extractRouteRequirements(bundle, pathId, signals, true)) {
    push(req)
  }

  for (const req of extractCareerEngineRouteRequirements(bundle, signals)) {
    push(req)
  }

  // Prefer ladder titles when present (keeps training aligned to Coach plan)
  const ladderTitles = new Set(
    extractPathTrainingTitles(bundle).map((t) => normalizeName(t))
  )

  for (const dir of bundle.ruleResult.improve_later?.directions ?? []) {
    const title = dir.direction_title?.trim()
    if (!title) continue
    if (ladderTitles.size > 0 && !ladderTitles.has(normalizeName(title))) {
      // Still allow ENIC / professional body essentials
      const isEssential = /enic|recognition|\b(ACCA|CIMA|ICAEW|AAT|CFA)\b|route|membership/i.test(
        title
      )
      if (!isEssential) continue
    }
    const isEssential = /enic|recognition|\b(ACCA|CIMA|ICAEW|AAT|CFA)\b|route|membership/i.test(title)
    push(
      requirementFromTitle(title, signals, {
        pathId,
        source: isEssential ? 'essential_action' : 'recommended_course',
        id: dir.direction_id ? slugifyCourseName(String(dir.direction_id)) : undefined,
      })
    )
  }

  const uk = bundle.brain?.ukTransitionGrowth?.finalReport
  for (const title of [...(uk?.recommendedCertifications ?? []), ...(uk?.recommendedCourses ?? [])]) {
    if (!title?.trim()) continue
    push(requirementFromTitle(title, signals, { pathId, source: 'path_requirement' }))
  }

  for (const title of bundle.brain?.recommendedCourses ?? []) {
    if (!title?.trim()) continue
    push(requirementFromTitle(title, signals, { pathId, source: 'recommended_course' }))
  }

  for (const role of bundle.brain?.recommendedPaths?.buildNext ?? []) {
    for (const title of role.recommendedTraining ?? []) {
      if (!title?.trim()) continue
      push(requirementFromTitle(title, signals, { pathId, source: 'recommended_course' }))
    }
  }

  for (const title of bundle.brain?.careerChangeTransition?.recommendedTraining ?? []) {
    if (!title?.trim()) continue
    push(requirementFromTitle(title, signals, { pathId, source: 'recommended_course' }))
  }

  return sortTrainingRequirements(reqs.map(enrichRequirement))
}
