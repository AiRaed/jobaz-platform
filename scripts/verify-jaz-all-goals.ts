/**
 * Acceptance personas for ALL UK Career Assistant goal paths via JAZ fallback + safety.
 * Run: npx tsx scripts/verify-jaz-all-goals.ts
 */

import { buildFallbackBrainReasoning } from '../lib/jaz-career-engine/fallbackPlan'
import { applySafetyToReasoning } from '../lib/jaz-career-engine/safetyRules'
import { buildJazInputForGoal } from '../lib/jaz-career-engine/goalInput'
import { OLLAMA_ONLY_FEATURES, getTierFallbackChain } from '../lib/jobaz-ai/providers/featureModelMap'
import type { StrategicGoalId } from '../lib/career-brain/userGoal'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function run(label: string, goalId: StrategicGoalId, answers: Record<string, unknown>, checks: {
  focus?: RegExp
  upgrade?: RegExp
  courses?: RegExp
  noSia?: boolean
  noDelivery?: boolean
  route?: RegExp
}) {
  const input = buildJazInputForGoal(goalId, answers)
  const { reasoning } = applySafetyToReasoning(buildFallbackBrainReasoning(input))
  const courses = reasoning.recommended_course_types.map((c) => c.title).join(' | ')

  if (checks.route) {
    assert(
      checks.route.test(reasoning.route_title) || checks.route.test(reasoning.route_category),
      `${label}: route=${reasoning.route_title}`
    )
  }
  if (checks.focus) {
    assert(
      checks.focus.test(reasoning.current_focus) ||
        reasoning.work_now_roles.some((r) => checks.focus!.test(r.title)),
      `${label}: focus=${reasoning.current_focus} work=${reasoning.work_now_roles.map((r) => r.title).join(',')}`
    )
  }
  if (checks.upgrade) {
    assert(checks.upgrade.test(reasoning.next_upgrade), `${label}: upgrade=${reasoning.next_upgrade}`)
  }
  if (checks.courses) {
    assert(checks.courses.test(courses), `${label}: courses=${courses}`)
  }
  if (checks.noSia) {
    assert(!/sia|door\s*supervisor/i.test(courses + reasoning.next_upgrade), `${label}: SIA leaked`)
  }
  if (checks.noDelivery) {
    assert(
      !reasoning.work_now_roles.some((r) => /delivery\s*driver/i.test(r.title)),
      `${label}: Delivery Driver leaked`
    )
  }

  console.log(`✓ ${label}`)
  console.log(`  route: ${reasoning.route_title}`)
  console.log(`  focus: ${reasoning.current_focus}`)
  console.log(`  upgrade: ${reasoning.next_upgrade}`)
  console.log(`  courses: ${courses}`)
}

function verifyOpenAiExcluded() {
  for (const f of ['jaz-career-analyse', 'uk-career-assistant', 'career-brain-extract']) {
    assert(OLLAMA_ONLY_FEATURES.has(f), `${f} not ollama-only`)
    assert(getTierFallbackChain('local', f).join(',') === 'local', `${f} chain`)
  }
  console.log('✓ OpenAI excluded for Career Assistant features')
}

verifyOpenAiExcluded()

// A) Work in Education — Accounting
run(
  'A) Work in Education: Accounting',
  'work_in_education',
  {
    education_field: 'accounting',
    education_specialisation: 'finance',
    qualification_level: 'bachelor',
  },
  {
    focus: /accounts|finance\s*admin/i,
    upgrade: /aat|excel|bookkeep|xero|quickbooks/i,
    courses: /aat|excel|xero|quickbooks|bookkeep/i,
    noSia: true,
  }
)

// B) Work in Experience — Care
run(
  'B) Work in Experience: Care',
  'work_in_experience',
  {
    experience_field: 'care',
    experience_specialisation: 'support_worker',
    industry: 'care',
  },
  {
    focus: /care|support/i,
    courses: /care\s*certificate|safeguard|handling|first\s*aid|medication/i,
    noSia: true,
  }
)

// C) Start New Career — Security
run(
  'C) Start New Career: Security',
  'start_new_career',
  {
    target_field: 'security',
    starting_situation: 'career_change',
  },
  {
    focus: /steward|security|event/i,
    upgrade: /sia|door/i,
    noDelivery: true,
  }
)

// D) Grow Career — Admin promotion
run(
  'D) Grow Career: Admin Assistant promotion',
  'grow_career',
  {
    grow_field: 'other',
    current_role: 'Admin Assistant',
    grow_goal: 'promotion',
  },
  {
    focus: /admin|office|coordinator/i,
    upgrade: /excel|microsoft|office|business\s*admin/i,
    courses: /excel|microsoft|office|business\s*admin|customer/i,
    noSia: true,
  }
)

// E) Extra Income — Teaching
run(
  'E) Extra Income: Teaching/Tutoring',
  'side_job',
  {
    side_skills: 'teaching',
    side_hours: '10_20',
    side_schedule: 'flexible',
  },
  {
    focus: /tutor|invigilat|study\s*support/i,
    upgrade: /tefl|safeguard|teaching\s*assistant|english|digital/i,
    courses: /tefl|safeguard|teaching|digital|english/i,
    noSia: true,
    noDelivery: true,
  }
)

// F) Start Business — phase 1
run(
  'F) Start Business: phase-1 setup',
  'start_business',
  {
    biz_idea: 'services',
    biz_capital: 'under_1k',
    biz_time: 'part_time',
  },
  {
    route: /business/i,
    focus: /business|planning|setup|bookkeep/i,
    upgrade: /bookkeep|business|marketing|website/i,
    courses: /business|bookkeep|marketing|website/i,
    noSia: true,
  }
)

console.log('\nAll goal-path JAZ persona checks passed.')
