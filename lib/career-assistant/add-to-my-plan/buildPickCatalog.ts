/**
 * Build selectable Add-to-My-Plan catalogs from public Career Assistant results.
 * Mapping only — does not change matching/ranking.
 * Applies global immediate vs progression role guardrail.
 */

import type { PublicWieAssessmentResult } from '@/lib/career-engine/work-in-education/public-contract'
import type { PublicWipMatchResult } from '@/lib/career-engine/work-in-profession'
import type { PublicSncResult } from '@/lib/career-engine/start-new-career/library'
import type { PublicExtraIncomeResult } from '@/lib/career-engine/extra-income/library'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { buildCaStepKey } from './stepKey'
import {
  applyRoleDefaultSelection,
  classifyRoleRouteTiming,
  routeTimingBadge,
  type RolePrioritySignals,
} from './rolePriority'
import type {
  CaGoalPath,
  PlanPickCatalog,
  PlanPickItem,
  PlanPickProviderStatus,
  PlanPickRouteTiming,
} from './types'

function providerStatus(hasReferral?: boolean | null, isCheck?: boolean): PlanPickProviderStatus {
  if (isCheck) return 'check'
  if (hasReferral) return 'apply_now'
  return 'provider_not_listed'
}

function roleItem(opts: {
  goal: CaGoalPath
  id: string
  title: string
  badge?: string
  reason?: string
  field?: string
  specialism?: string
  keywords?: string[]
  pathwayId?: string
  signals?: RolePrioritySignals
}): PlanPickItem {
  const signals: RolePrioritySignals = {
    title: opts.title,
    badge: opts.badge,
    reason: opts.reason,
    ...(opts.signals || {}),
  }
  const timing: PlanPickRouteTiming = classifyRoleRouteTiming(signals)
  return {
    id: `role:${opts.id}`,
    group: 'roles',
    kind: 'role',
    title: opts.title,
    badge: routeTimingBadge(timing, opts.badge),
    reason: opts.reason,
    default_selected: false,
    route_timing: timing,
    step_key: buildCaStepKey(opts.goal, 'role', opts.title),
    metadata: {
      field: opts.field,
      specialism: opts.specialism,
      role_title: opts.title,
      search_keywords: opts.keywords,
      pathway_id: opts.pathwayId,
      match_type: signals.match_type || undefined,
      start_now: signals.start_now === true ? true : signals.start_now === false ? false : undefined,
      level: signals.level || signals.professional_level_label || undefined,
      stage_label: signals.stage_label || undefined,
      timing_label: signals.timing_label || undefined,
      bucket: signals.bucket || undefined,
    },
  }
}

function trainingItem(opts: {
  goal: CaGoalPath
  id: string
  title: string
  badge?: string
  reason?: string
  kind?: PlanPickItem['kind']
  hasReferral?: boolean
  isCheck?: boolean
  field?: string
  specialism?: string
  referralUrl?: string | null
  defaultSelected?: boolean
}): PlanPickItem {
  const kind = opts.kind || (opts.isCheck ? 'check' : 'course')
  return {
    id: `training:${opts.id}`,
    group: 'training',
    kind,
    title: opts.title,
    badge: opts.badge,
    reason: opts.reason,
    provider_status: providerStatus(opts.hasReferral, opts.isCheck),
    default_selected: opts.defaultSelected,
    step_key: buildCaStepKey(opts.goal, kind, opts.title),
    metadata: {
      field: opts.field,
      specialism: opts.specialism,
      course_title: opts.title,
      referral_url: opts.referralUrl || null,
    },
  }
}

function skillItem(opts: {
  goal: CaGoalPath
  id: string
  title: string
  kind: PlanPickItem['kind']
  badge?: string
  reason?: string
  defaultSelected?: boolean
}): PlanPickItem {
  return {
    id: `skill:${opts.id}`,
    group: 'skills',
    kind: opts.kind,
    title: opts.title,
    badge: opts.badge,
    reason: opts.reason,
    provider_status: 'n_a',
    default_selected: opts.defaultSelected,
    step_key: buildCaStepKey(opts.goal, opts.kind, opts.title),
  }
}

export function buildCatalogFromWie(result: PublicWieAssessmentResult): PlanPickCatalog {
  const goal: CaGoalPath = 'work_in_my_education'
  const field = result.matched_direction?.field
  const specialism = result.matched_direction?.specialism
  const roles: PlanPickItem[] = []

  const pushBucket = (
    list: typeof result.recommendations.available_now,
    bucket: RolePrioritySignals['bucket']
  ) => {
    for (const role of list.slice(0, 8)) {
      roles.push(
        roleItem({
          goal,
          id: role.pathway_id || role.title,
          title: role.title,
          badge: role.eligibility_label || undefined,
          reason: Array.isArray(role.why) ? role.why[0] : undefined,
          field: role.field_name || field,
          specialism: role.specialism_name || specialism,
          pathwayId: role.pathway_id,
          signals: {
            title: role.title,
            match_type: role.match_type,
            badge: role.eligibility_label,
            stage_label: role.stage_label,
            reason: Array.isArray(role.why) ? role.why[0] : undefined,
            bucket,
            field,
            specialism,
            route_title: specialism || field,
          },
        })
      )
    }
  }

  pushBucket(result.recommendations?.available_now || [], 'available_now')
  pushBucket(result.recommendations?.realistic_next || [], 'realistic_next')
  pushBucket(result.recommendations?.future_options || [], 'future_options')

  const training: PlanPickItem[] = []
  const tr = result.training_recommendations
  const pushCards = (
    cards: Array<{
      id?: string
      title: string
      whyRecommended?: string
      referralUrl?: string
      status_label?: string
      badge?: string
      training_status?: string
      training_item_type?: string
    }> | undefined,
    _preferDefault: boolean,
    forceCheck?: boolean
  ) => {
    for (const c of cards || []) {
      const isCheck =
        forceCheck ||
        c.training_status === 'checks' ||
        c.training_item_type === 'licence' ||
        /licence|license|dbs|check/i.test(c.title)
      // Never auto-select training — user must opt in for the current run only
      training.push(
        trainingItem({
          goal,
          id: c.id || c.title,
          title: c.title,
          badge: c.status_label || c.badge,
          reason: c.whyRecommended,
          hasReferral: Boolean(c.referralUrl?.trim()),
          isCheck,
          kind: isCheck ? 'licence' : 'course',
          field,
          specialism,
          referralUrl: c.referralUrl,
          defaultSelected: false,
        })
      )
    }
  }
  if (tr) {
    pushCards(tr.professional_regulated as never, true, true)
    pushCards(tr.recommended_next as never, true)
    pushCards(tr.optional_boosters as never, false)
    pushCards(tr.provider_not_listed as never, false)
  }

  const skills: PlanPickItem[] = [
    skillItem({
      goal,
      id: 'cv-prep',
      title: 'Prepare my CV for this route',
      kind: 'cv',
      badge: 'CV',
      reason: 'Tailor your CV to the selected start-now target roles.',
      defaultSelected: false,
    }),
    skillItem({
      goal,
      id: 'interview-prep',
      title: 'Practise interview answers for this route',
      kind: 'interview',
      badge: 'Interview',
    }),
    skillItem({
      goal,
      id: 'job-search',
      title: 'Search UK jobs for matched roles',
      kind: 'job_search',
      badge: 'Job search',
    }),
  ]

  return {
    goal_path: goal,
    route_title: result.matched_direction?.specialism || result.headline?.text || 'Work in My Education',
    field,
    specialism,
    result_token: result.result_token || null,
    roles: applyRoleDefaultSelection(roles),
    training,
    skills,
  }
}

export function buildCatalogFromWip(result: PublicWipMatchResult): PlanPickCatalog {
  const goal: CaGoalPath = 'work_in_my_profession'
  const roles = applyRoleDefaultSelection(
    result.roles.slice(0, 12).map((r) =>
      roleItem({
        goal,
        id: r.id,
        title: r.role_title,
        badge: r.match_label,
        reason: r.description,
        field: result.profession_field,
        specialism: result.specialism,
        keywords: r.uk_role_keywords,
        signals: {
          title: r.role_title,
          start_now: r.start_now,
          match_label: r.match_label,
          badge: r.match_label,
          professional_level_label: r.professional_level_label,
          description: r.description,
          field: result.profession_field,
          specialism: result.specialism,
          route_title: result.specialism || result.profession_field,
        },
      })
    )
  )

  const training: PlanPickItem[] = []
  const tr = result.training_recommendations
  const push = (
    cards: NonNullable<PublicWipMatchResult['training_recommendations']>['required_licence'],
    _preferDefault: boolean,
    asCheck?: boolean
  ) => {
    for (const c of cards || []) {
      const isCheck = asCheck || Boolean(c.is_check_not_course) || c.training_status === 'checks'
      training.push(
        trainingItem({
          goal,
          id: c.id || c.title,
          title: c.title,
          badge: c.status_label || c.badge,
          reason: c.whyRecommended,
          hasReferral: Boolean(c.referralUrl?.trim()),
          isCheck,
          kind: isCheck ? 'licence' : 'course',
          field: result.profession_field,
          specialism: result.specialism,
          referralUrl: c.referralUrl,
          defaultSelected: false,
        })
      )
    }
  }
  if (tr) {
    push(tr.required_licence, true, true)
    push(tr.checks, true, true)
    push(tr.recommended_next, true)
    push(tr.useful_boosters, false)
    push(tr.provider_not_listed, false)
  } else if (result.requirements?.length) {
    for (const req of result.requirements.slice(0, 4)) {
      training.push(
        trainingItem({
          goal,
          id: req,
          title: req,
          badge: 'Licence / check',
          isCheck: true,
          kind: 'licence',
          field: result.profession_field,
          specialism: result.specialism,
          defaultSelected: false,
        })
      )
    }
  }

  const skills: PlanPickItem[] = [
    skillItem({
      goal,
      id: 'cv-prep',
      title: 'Prepare my CV for this profession route',
      kind: 'cv',
      badge: 'CV',
      defaultSelected: false,
    }),
    skillItem({
      goal,
      id: 'interview-prep',
      title: 'Practise interview answers for target roles',
      kind: 'interview',
      badge: 'Interview',
    }),
  ]

  return {
    goal_path: goal,
    route_title: result.specialism || result.profession_field,
    field: result.profession_field,
    specialism: result.specialism,
    roles,
    training,
    skills,
  }
}

export function buildCatalogFromSnc(result: PublicSncResult): PlanPickCatalog {
  const goal: CaGoalPath = 'start_new_career'
  const roles = applyRoleDefaultSelection([
    ...result.first_jobs.map((r) =>
      roleItem({
        goal,
        id: r.id,
        title: r.role_title,
        badge: 'Start now',
        reason: r.description,
        field: result.mapped_profession_field,
        specialism: result.mapped_specialism,
        keywords: r.uk_role_keywords,
        signals: {
          title: r.role_title,
          timing_label: r.timing_label || 'after_first_step',
          badge: 'Start now',
          description: r.description,
          bucket: 'first_jobs',
        },
      })
    ),
    ...result.better_roles_later.slice(0, 6).map((r) =>
      roleItem({
        goal,
        id: r.id,
        title: r.role_title,
        badge: 'Progression route',
        reason: r.description,
        field: result.mapped_profession_field,
        specialism: result.mapped_specialism,
        keywords: r.uk_role_keywords,
        signals: {
          title: r.role_title,
          timing_label: r.timing_label || 'future_progression',
          badge: 'Progression route',
          description: r.description,
          bucket: 'better_roles_later',
        },
      })
    ),
  ])

  const training: PlanPickItem[] = []
  for (const c of [...result.entry_courses, ...result.upgrade_courses, ...result.checks]) {
    const isCheck = Boolean(c.is_check_not_course) || c.training_status === 'checks'
    training.push(
      trainingItem({
        goal,
        id: c.id || c.title,
        title: c.title,
        badge: c.status_label || c.badge,
        reason: c.whyRecommended,
        hasReferral: Boolean(c.referralUrl?.trim()),
        isCheck,
        kind: isCheck ? 'licence' : 'course',
        field: result.mapped_profession_field,
        specialism: result.mapped_specialism,
        referralUrl: c.referralUrl,
        defaultSelected: false,
      })
    )
  }

  const skills: PlanPickItem[] = [
    skillItem({
      goal,
      id: 'cv-prep',
      title: 'Prepare my CV for this starter route',
      kind: 'cv',
      badge: 'CV',
      defaultSelected: false,
    }),
    skillItem({
      goal,
      id: 'first-steps',
      title: result.start_status_note || 'Complete the first training step for this route',
      kind: 'first_step',
      badge: 'First step',
    }),
  ]

  return {
    goal_path: goal,
    route_title: result.route_label,
    field: result.mapped_profession_field,
    specialism: result.mapped_specialism,
    roles,
    training,
    skills,
  }
}

export function buildCatalogFromExtraIncome(result: PublicExtraIncomeResult): PlanPickCatalog {
  const goal: CaGoalPath = 'extra_income'
  const roles = applyRoleDefaultSelection(
    result.jobs.slice(0, 10).map((title) =>
      roleItem({
        goal,
        id: title,
        title,
        badge: 'Extra income option',
        field: result.category_label,
        specialism: result.option_title,
        keywords: result.job_search_keywords,
        signals: {
          title,
          badge: 'Extra income option',
          bucket: 'extra_income',
        },
      })
    )
  )

  const training: PlanPickItem[] = []
  for (const c of [...result.courses_primary, ...result.courses_boosters]) {
    const isCheck = Boolean(c.is_check_not_course) || c.training_status === 'checks'
    training.push(
      trainingItem({
        goal,
        id: c.id || c.title,
        title: c.title,
        badge: c.status_label || c.badge,
        reason: c.whyRecommended,
        hasReferral: Boolean(c.referralUrl?.trim()),
        isCheck,
        kind: isCheck ? 'licence' : 'course',
        field: result.category_label,
        specialism: result.option_title,
        referralUrl: c.referralUrl,
        defaultSelected: false,
      })
    )
  }

  const skills: PlanPickItem[] = [
    skillItem({
      goal,
      id: 'cv-prep',
      title: 'Prepare my CV for this side-income route',
      kind: 'cv',
      badge: 'CV',
      defaultSelected: false,
    }),
    ...result.first_steps.slice(0, 5).map((step, i) =>
      skillItem({
        goal,
        id: `step-${i}`,
        title: step,
        kind: 'first_step',
        badge: 'First step',
      })
    ),
    ...result.skills_or_portfolio.slice(0, 4).map((s, i) =>
      skillItem({
        goal,
        id: `portfolio-${i}`,
        title: s,
        kind: 'portfolio',
        badge: 'Portfolio',
      })
    ),
    ...(result.job_search_keywords.length
      ? [
          skillItem({
            goal,
            id: 'job-search',
            title: `Search: ${result.job_search_keywords.slice(0, 3).join(', ')}`,
            kind: 'job_search',
            badge: 'Job search',
          }),
        ]
      : []),
  ]

  return {
    goal_path: goal,
    route_title: result.option_display_title || result.option_title,
    field: result.category_label,
    specialism: result.option_title,
    roles,
    training,
    skills,
  }
}

export function buildCatalogFromJobAZPlan(plan: JobAZPlan): PlanPickCatalog {
  const rawGoal = plan.source_path_id || 'legacy_career_assistant'
  const goal: CaGoalPath =
    rawGoal === 'side_job' || rawGoal === 'extra_income'
      ? 'extra_income'
      : rawGoal === 'work_in_education'
        ? 'work_in_my_education'
        : rawGoal === 'work_in_profession'
          ? 'work_in_my_profession'
          : rawGoal === 'start_new_career'
            ? 'start_new_career'
            : rawGoal === 'work_in_my_education' ||
                rawGoal === 'work_in_my_profession' ||
                rawGoal === 'legacy_career_assistant'
              ? (rawGoal as CaGoalPath)
              : 'legacy_career_assistant'

  const startRoles = plan.work_now.slice(0, 8).map((r) =>
    roleItem({
      goal,
      id: r.title,
      title: r.title,
      badge: 'Start now',
      reason: r.why_it_matches,
      signals: {
        title: r.title,
        badge: 'Start now',
        bucket: 'available_now',
        start_now: true,
      },
    })
  )
  const futureRoles = (plan.ca_selection?.future_routes || plan.after_training || [])
    .slice(0, 6)
    .map((r) =>
      roleItem({
        goal,
        id: `future-${r.title}`,
        title: r.title,
        badge: 'Progression route',
        signals: {
          title: r.title,
          badge: 'Progression route',
          bucket: 'future_options',
          start_now: false,
        },
      })
    )

  const roles = applyRoleDefaultSelection([...startRoles, ...futureRoles])
  const training: PlanPickItem[] = []
  if (plan.training_next) {
    training.push(
      trainingItem({
        goal,
        id: plan.training_next.id || plan.training_next.title,
        title: plan.training_next.title,
        reason: plan.training_next.why_recommended,
        hasReferral: Boolean(plan.training_next.apply_url),
        referralUrl: plan.training_next.apply_url,
        defaultSelected: false,
      })
    )
  }
  for (const t of (plan.optional_training || []).slice(0, 4)) {
    training.push(
      trainingItem({
        goal,
        id: t.id || t.title,
        title: t.title,
        reason: t.why_useful,
        defaultSelected: false,
      })
    )
  }
  const skills: PlanPickItem[] = [
    skillItem({
      goal,
      id: 'cv-prep',
      title: plan.cv_action || 'Prepare my CV for this route',
      kind: 'cv',
      badge: 'CV',
      defaultSelected: false,
    }),
    ...(plan.this_week_plan || []).slice(0, 4).map((step, i) =>
      skillItem({
        goal,
        id: `week-${i}`,
        title: step,
        kind: 'first_step',
        badge: 'First step',
      })
    ),
  ]
  return {
    goal_path: goal,
    route_title: plan.route_summary.route_title,
    roles,
    training,
    skills,
  }
}
