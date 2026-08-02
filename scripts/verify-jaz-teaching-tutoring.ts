/**
 * Teaching/Tutoring Extra Income persona — JAZ + routeIntelligence acceptance.
 * Run: npx tsx scripts/verify-jaz-teaching-tutoring.ts
 */

import { buildExtraIncomeResult } from '../lib/career-engine/extra-income/decisionEngine'
import { buildFallbackBrainReasoning } from '../lib/jaz-career-engine/fallbackPlan'
import { applySafetyToReasoning } from '../lib/jaz-career-engine/safetyRules'
import { buildJazAnalyseInputFromAnswers } from '../lib/jaz-career-engine/buildInputFromAnswers'
import { mapJazAnalyseToJobAZPlan } from '../lib/jaz-career-engine/mapJazAnalyseToJobAZPlan'
import { mapCareerCoachResultToPlan } from '../lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { JazAnalyseResult } from '../lib/jaz-career-engine/types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function runTeachingPersona() {
  const answers = {
    side_profile: 'employed_part',
    side_hours: '10_20',
    side_schedule: 'flexible',
    side_income_goal: '500_1000',
    side_skills: 'teaching',
  }

  const legacy = buildExtraIncomeResult(answers)
  assert(legacy.routeLogic?.route_id === 'teaching', `route_id=${legacy.routeLogic?.route_id}`)
  assert(
    !legacy.immediateOpportunities.some((o) => /delivery\s*driver/i.test(o.title)),
    `Delivery Driver in immediate opportunities: ${legacy.immediateOpportunities.map((o) => o.title).join(', ')}`
  )
  assert(
    !legacy.qualifications.some((q) => /sia|door\s*supervisor/i.test(q.title)),
    'SIA in qualifications'
  )
  const primary = legacy.qualifications.find((q) => q.recommendedBadge) || legacy.qualifications[0]
  assert(primary && !/microsoft\s*office/i.test(primary.title), `primary qual was ${primary?.title}`)
  assert(
    /tefl|safeguard|teaching\s*assistant|english/i.test(primary!.title),
    `expected tutoring primary, got ${primary?.title}`
  )

  const legacyPlan = mapCareerCoachResultToPlan(legacy)!
  assert(
    !/online\s*tutor/i.test(legacyPlan.route_summary.next_upgrade_role) ||
      /tefl|safeguard|teaching|english|digital/i.test(legacyPlan.route_summary.next_upgrade_role),
    `legacy next_upgrade bad: ${legacyPlan.route_summary.next_upgrade_role}`
  )
  assert(
    !legacyPlan.work_now.some((w) => /delivery\s*driver/i.test(w.title)),
    'Delivery Driver in legacy plan work_now'
  )

  const input = buildJazAnalyseInputFromAnswers({
    goal: 'extra_income',
    answers: { ...answers, side_skills: ['teaching'] },
  })
  input.skills = ['teaching']
  input.work_mode_preference = 'online'

  const raw = buildFallbackBrainReasoning(input)
  const { reasoning } = applySafetyToReasoning(raw)

  assert(/teach|tutor/i.test(reasoning.route_title), `route_title=${reasoning.route_title}`)
  assert(/tutor/i.test(reasoning.current_focus), `current_focus=${reasoning.current_focus}`)
  assert(
    !/online\s*tutor/i.test(reasoning.next_upgrade) ||
      /tefl|safeguard|teaching\s*assistant|english|digital/i.test(reasoning.next_upgrade),
    `next_upgrade must not be Online Tutor: ${reasoning.next_upgrade}`
  )
  assert(
    !reasoning.work_now_roles.some((r) => /delivery\s*driver/i.test(r.title)),
    'Delivery Driver in JAZ work_now'
  )
  assert(
    !reasoning.recommended_course_types.some((c) => /sia/i.test(c.title)),
    'SIA in JAZ courses'
  )
  const primaryCourse = reasoning.recommended_course_types.find((c) => c.priority === 'primary')
  assert(
    primaryCourse && !/microsoft\s*office/i.test(primaryCourse.title),
    `primary course was ${primaryCourse?.title}`
  )
  assert(
    reasoning.recommended_course_types.some((c) =>
      /tefl|teaching\s*assistant|safeguard|english\s*for\s*work|digital/i.test(c.title)
    ),
    `courses=${reasoning.recommended_course_types.map((c) => c.title).join(', ')}`
  )

  const fakeAnalyse: JazAnalyseResult = {
    engine_version: 'jaz-career-engine-v1',
    ai_provider: 'fallback',
    route_title: reasoning.route_title,
    route_category: reasoning.route_category,
    user_goal: reasoning.user_goal,
    why_this_route_fits: reasoning.why_this_route_fits,
    current_focus: reasoning.current_focus,
    next_upgrade: reasoning.next_upgrade,
    readiness: reasoning.readiness,
    work_now_roles: reasoning.work_now_roles,
    recommended_course_types: reasoning.recommended_course_types,
    matched_jobaz_courses: [],
    missing_affiliate_opportunities: [],
    cv_focus: reasoning.cv_focus,
    first_action_plan: reasoning.first_action_plan,
    safety_notes: [],
  }
  const jazPlan = mapJazAnalyseToJobAZPlan(fakeAnalyse, { pathId: 'side_job' })
  assert(jazPlan.route_summary.next_upgrade_role === reasoning.next_upgrade, 'plan next_upgrade mismatch')
  assert(
    !jazPlan.work_now.some((w) => /delivery\s*driver/i.test(w.title)),
    'Delivery Driver in jaz plan'
  )

  console.log('✓ Teaching/Tutoring persona')
  console.log('  route:', reasoning.route_title)
  console.log('  focus:', reasoning.current_focus)
  console.log('  upgrade:', reasoning.next_upgrade)
  console.log('  work_now:', reasoning.work_now_roles.map((r) => r.title).join(', '))
  console.log(
    '  courses:',
    reasoning.recommended_course_types.map((c) => `${c.priority}:${c.title}`).join(' | ')
  )
  console.log('  legacy primary qual:', primary!.title)
  console.log('  legacy next_upgrade:', legacyPlan.route_summary.next_upgrade_role)
}

function runLanguagesPersona() {
  const input = buildJazAnalyseInputFromAnswers({
    goal: 'extra_income',
    answers: { side_skills: ['languages'], side_hours: '10_20' },
  })
  input.skills = ['languages']
  const { reasoning } = applySafetyToReasoning(buildFallbackBrainReasoning(input))
  assert(!reasoning.work_now_roles.some((r) => /delivery/i.test(r.title)), 'languages delivery')
  assert(!/sia/i.test(JSON.stringify(reasoning.recommended_course_types)), 'languages SIA')
  assert(
    !rolesDuplicate(reasoning.current_focus, reasoning.next_upgrade),
    `languages next_upgrade duplicate: ${reasoning.next_upgrade}`
  )
  console.log('✓ Languages persona →', reasoning.next_upgrade)
}

function rolesDuplicate(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/ing$/, '')
  const nb = b.toLowerCase().replace(/ing$/, '')
  return na === nb || na.includes(nb) || nb.includes(na)
}

runTeachingPersona()
runLanguagesPersona()
console.log('\nTeaching/Tutoring Extra Income checks passed.')
