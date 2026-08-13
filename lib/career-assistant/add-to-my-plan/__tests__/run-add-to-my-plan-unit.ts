/**
 * Add to My Plan — unit checks (no DB).
 *   npx tsx lib/career-assistant/add-to-my-plan/__tests__/run-add-to-my-plan-unit.ts
 */

import assert from 'node:assert/strict'
import { buildCaStepKey } from '../stepKey'
import { selectedToJazActions, selectedToJobAZPlan, mergeJobAZPlans } from '../mapSelected'
import {
  classifyRoleRouteTiming,
  applyRoleDefaultSelection,
  pickPrimaryImmediateRole,
} from '../rolePriority'
import { resolveSelectedPlanIdentity } from '../planIdentity'
import { jobazPlanToPathLadder } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import type { PlanPickCatalog, PlanPickItem } from '../types'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'

console.log('\n=== Add to My Plan unit tests ===\n')

{
  const a = buildCaStepKey('work_in_my_profession', 'role', 'HGV Class 2 Driver')
  const b = buildCaStepKey('work_in_my_profession', 'role', 'HGV Class 2 Driver')
  assert.equal(a, b)
  console.log('  ✓ 1. Stable step keys')
}

{
  assert.equal(
    classifyRoleRouteTiming({
      title: 'Midwifery',
      specialism: 'Midwifery',
      field: 'Healthcare & Medicine',
      bucket: 'future_options',
    }),
    'future_progression'
  )
  assert.equal(
    classifyRoleRouteTiming({
      title: 'Care Assistant',
      match_type: 'best_immediate_route',
      specialism: 'Midwifery',
      bucket: 'available_now',
    }),
    'start_now'
  )
  console.log('  ✓ 2. Pathway label Midwifery is never start-now')
}

{
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Midwifery',
    field: 'Healthcare & Medicine',
    specialism: 'Midwifery',
    roles: [
      {
        id: 'role:care',
        group: 'roles',
        kind: 'role',
        title: 'Care Assistant',
        route_timing: 'start_now',
        step_key: buildCaStepKey('work_in_my_education', 'role', 'Care Assistant'),
        metadata: { match_type: 'best_immediate_route', bucket: 'available_now', start_now: true },
      },
      {
        id: 'role:edu',
        group: 'roles',
        kind: 'role',
        title: 'Midwifery Educator',
        route_timing: 'future_progression',
        step_key: buildCaStepKey('work_in_my_education', 'role', 'Midwifery Educator'),
        metadata: { match_type: 'future_career_option', bucket: 'future_options' },
      },
    ],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    catalog.roles[0]!,
    catalog.roles[1]!,
    {
      id: 'train:nhs',
      group: 'training',
      kind: 'course',
      title: 'NHS Job Application Support',
      step_key: buildCaStepKey('work_in_my_education', 'course', 'NHS Job Application Support'),
      provider_status: 'provider_not_listed',
      default_selected: true,
    },
  ]

  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.current_focus_role, 'Care Assistant')
  assert.equal(identity.focus_source, 'selected_immediate_role')
  assert.notEqual(identity.current_focus_role, 'Midwifery')
  assert.equal(identity.next_upgrade, 'NHS Job Application Support')
  assert.equal(identity.future_route, 'Midwifery Educator')

  const plan = selectedToJobAZPlan(catalog, selected)
  assert.equal(plan.route_summary.route_title, 'Care Assistant')
  assert.equal(plan.route_summary.current_target_role, 'Care Assistant')
  assert.equal(plan.cv_target_role, 'Care Assistant')
  assert.equal(plan.route_summary.next_upgrade_role, 'NHS Job Application Support')
  assert.ok(!/^[Mm]idwifery$/.test(plan.route_summary.route_title))
  assert.ok(plan.ca_selection?.immediate_role === 'Care Assistant')
  assert.ok(plan.ca_selection?.future_route === 'Midwifery Educator')
  assert.ok(plan.ca_selection?.selected_courses?.some((c) => c.title.includes('NHS')))
  assert.ok(plan.work_now.every((r) => r.title !== 'Midwifery'))
  assert.ok(plan.after_training.some((r) => r.title === 'Midwifery Educator'))

  const ladder = jobazPlanToPathLadder(plan)
  assert.equal(ladder.routeLabel, 'Care Assistant')
  assert.equal(ladder.startNow[0]?.title, 'Care Assistant')
  assert.equal(ladder.trainNext[0]?.title, 'NHS Job Application Support')

  const actions = selectedToJazActions(selected, catalog)
  assert.ok(actions.some((a) => /Care Assistant/i.test(a.title) && /CV/i.test(a.title)))
  assert.ok(actions.every((a) => !/^Create \/ improve CV for Midwifery$/i.test(a.title)))
  console.log('  ✓ 3. Acceptance A — Midwifery pathway uses Care Assistant as focus')
}

{
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'IT & Technology',
    field: 'IT & Technology',
    specialism: 'IT Support',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'role:it',
      group: 'roles',
      kind: 'role',
      title: 'IT Support Assistant',
      route_timing: 'start_now',
      step_key: buildCaStepKey('work_in_my_education', 'role', 'IT Support Assistant'),
      metadata: { start_now: true, match_type: 'best_immediate_route' },
    },
    {
      id: 'train:comptia',
      group: 'training',
      kind: 'course',
      title: 'CompTIA A+',
      step_key: buildCaStepKey('work_in_my_education', 'course', 'CompTIA A+'),
      provider_status: 'provider_not_listed',
    },
  ]
  const plan = selectedToJobAZPlan(catalog, selected)
  assert.equal(plan.route_summary.route_title, 'IT Support Assistant')
  assert.notEqual(plan.route_summary.current_target_role, 'IT & Technology')
  assert.notEqual(plan.route_summary.current_target_role, 'IT Support')
  assert.equal(plan.route_summary.next_upgrade_role, 'CompTIA A+')
  console.log('  ✓ 4. Acceptance B — IT Support Assistant not field title')
}

{
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_profession',
    route_title: 'Taxi PHV',
    field: 'Driving',
    specialism: 'Taxi PHV',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'role:phv',
      group: 'roles',
      kind: 'role',
      title: 'Private Hire Driver',
      route_timing: 'start_now',
      step_key: buildCaStepKey('work_in_my_profession', 'role', 'Private Hire Driver'),
      metadata: { start_now: true },
    },
    {
      id: 'train:phv',
      group: 'training',
      kind: 'licence',
      title: 'PHV licence / DBS',
      step_key: buildCaStepKey('work_in_my_profession', 'licence', 'PHV licence / DBS'),
      provider_status: 'check',
    },
  ]
  const plan = selectedToJobAZPlan(catalog, selected)
  assert.equal(plan.route_summary.route_title, 'Private Hire Driver')
  assert.equal(plan.training_next?.title, 'PHV licence / DBS')
  console.log('  ✓ 5. Acceptance C — Private Hire Driver focus')
}

{
  const catalog: PlanPickCatalog = {
    goal_path: 'extra_income',
    route_title: 'Cleaning / Facilities Shifts',
    field: 'Cleaning',
    specialism: 'Cleaning / Facilities Shifts',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'role:clean',
      group: 'roles',
      kind: 'role',
      title: 'Cleaner',
      route_timing: 'start_now',
      step_key: buildCaStepKey('extra_income', 'role', 'Cleaner'),
      metadata: { bucket: 'extra_income' },
    },
  ]
  const plan = selectedToJobAZPlan(catalog, selected)
  assert.equal(plan.route_summary.route_title, 'Cleaner')
  assert.notEqual(plan.route_summary.current_target_role, 'Looking for Extra Income')
  console.log('  ✓ 6. Acceptance D — Cleaner not generic Extra Income')
}

{
  // Selecting only Midwifery Educator + course must not use Midwifery as focus if catalog has Care Assistant
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Midwifery',
    field: 'Healthcare & Medicine',
    specialism: 'Midwifery',
    roles: [
      {
        id: 'role:care',
        group: 'roles',
        kind: 'role',
        title: 'Maternity Support Worker',
        route_timing: 'start_now',
        step_key: buildCaStepKey('work_in_my_education', 'role', 'Maternity Support Worker'),
        metadata: { match_type: 'best_immediate_route', bucket: 'available_now' },
      },
      {
        id: 'role:edu',
        group: 'roles',
        kind: 'role',
        title: 'Midwifery Educator',
        route_timing: 'future_progression',
        step_key: buildCaStepKey('work_in_my_education', 'role', 'Midwifery Educator'),
        metadata: { bucket: 'future_options' },
      },
    ],
    training: [],
    skills: [],
  }
  const plan = selectedToJobAZPlan(catalog, [catalog.roles[1]!])
  assert.notEqual(plan.route_summary.current_target_role, 'Midwifery')
  assert.notEqual(plan.route_summary.current_target_role, 'Midwifery Educator')
  assert.equal(plan.route_summary.current_target_role, 'Maternity Support Worker')
  console.log('  ✓ 7. Future-only selection falls back to catalog start-now, not specialism')
}

{
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_profession',
    route_title: 'Driving',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'role:hgv',
      group: 'roles',
      kind: 'role',
      title: 'HGV Class 2 Driver',
      route_timing: 'start_now',
      step_key: buildCaStepKey('work_in_my_profession', 'role', 'HGV Class 2 Driver'),
    },
  ]
  const oldPlan = {
    version: 1 as const,
    source_path_id: 'side_job',
    route_summary: {
      route_title: 'Old Fallback',
      one_sentence_summary: 'old',
      current_target_role: 'Generic Admin',
      next_upgrade_role: 'Generic Admin',
      readiness_score: 10,
    },
    work_now: [
      {
        title: 'Generic Admin',
        href: '/jobs',
        why_it_matches: 'fallback',
        estimated_pay_range: 'n/a',
        action_label: 'View jobs' as const,
      },
    ],
    training_next: null,
    optional_training: [],
    after_training: [],
    cv_action: 'old cv',
    this_week_plan: ['old week'],
    dashboard_handoff: {
      save_label: 'x',
      open_dashboard_label: 'y',
      continue_guest_label: 'z',
    },
    structured_cards: [],
  } satisfies JobAZPlan
  const replaced = mergeJobAZPlans(oldPlan, selectedToJobAZPlan(catalog, selected, oldPlan))
  assert.equal(replaced.work_now[0]?.title, 'HGV Class 2 Driver')
  assert.ok(!replaced.work_now.some((r) => r.title === 'Generic Admin'))
  console.log('  ✓ 8. Replace does not merge old plan')
}

{
  // Role + course → title/focus is the role; course is next upgrade only
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Adult Social Care',
    field: 'Healthcare & Medicine',
    specialism: 'Adult Social Care',
    roles: [
      {
        id: 'role:care',
        group: 'roles',
        kind: 'role',
        title: 'Care Assistant',
        route_timing: 'start_now',
        step_key: buildCaStepKey('work_in_my_education', 'role', 'Care Assistant'),
        metadata: { start_now: true, match_type: 'best_immediate_route' },
      },
    ],
    training: [
      {
        id: 'train:qualifi',
        group: 'training',
        kind: 'course',
        title: 'Qualifi Level 2 Diploma in Care',
        step_key: buildCaStepKey(
          'work_in_my_education',
          'course',
          'Qualifi Level 2 Diploma in Care'
        ),
        provider_status: 'provider_not_listed',
      },
    ],
    skills: [],
  }
  const selected = [catalog.roles[0]!, catalog.training[0]!]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.current_focus_role, 'Care Assistant')
  assert.equal(identity.plan_title, 'Care Assistant')
  assert.ok(identity.is_career_role_focus)
  assert.equal(identity.next_upgrade, 'Qualifi Level 2 Diploma in Care')
  assert.ok(!/Qualifi|Diploma/i.test(identity.plan_title))

  const plan = selectedToJobAZPlan(catalog, selected)
  assert.equal(plan.route_summary.route_title, 'Care Assistant')
  assert.equal(plan.route_summary.next_upgrade_role, 'Qualifi Level 2 Diploma in Care')
  assert.equal(plan.training_next?.title, 'Qualifi Level 2 Diploma in Care')
  assert.ok(plan.work_now.every((r) => !/Qualifi|Diploma/i.test(r.title)))

  const actions = selectedToJazActions(selected, catalog)
  assert.ok(actions.every((a) => !/Apply to first Qualifi/i.test(a.title)))
  assert.ok(actions.every((a) => !/Apply to first .*Diploma/i.test(a.title)))
  assert.ok(
    actions.some((a) =>
      /Complete \/ check selected training: Qualifi Level 2 Diploma in Care/i.test(a.title)
    )
  )
  assert.ok(actions.some((a) => /Apply to first Care Assistant roles/i.test(a.title)))
  console.log('  ✓ 9. Role + course → role title; no Apply-to-course action')
}

{
  // Courses only + catalog start-now → infer route, not course title
  const catalog: PlanPickCatalog = {
    goal_path: 'start_new_career',
    route_title: 'Security',
    field: 'Security',
    specialism: 'Door Supervisor',
    roles: [
      {
        id: 'role:steward',
        group: 'roles',
        kind: 'role',
        title: 'Event Steward',
        route_timing: 'start_now',
        step_key: buildCaStepKey('start_new_career', 'role', 'Event Steward'),
        metadata: { start_now: true, match_type: 'best_immediate_route' },
      },
    ],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'train:sia',
      group: 'training',
      kind: 'licence',
      title: 'SIA Door Supervisor Course',
      step_key: buildCaStepKey('start_new_career', 'licence', 'SIA Door Supervisor Course'),
      provider_status: 'check',
    },
  ]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.current_focus_role, 'Event Steward')
  assert.equal(identity.plan_title, 'Event Steward')
  assert.equal(identity.focus_source, 'catalog_start_now_suggested')
  assert.equal(identity.next_upgrade, 'SIA Door Supervisor Course')
  assert.ok(!/SIA|Course/i.test(identity.plan_title))
  assert.equal(identity.is_course_only_plan, false)

  const actions = selectedToJazActions(selected, catalog)
  assert.ok(actions.every((a) => !/Apply to first SIA/i.test(a.title)))
  assert.ok(actions.some((a) => /Create \/ improve CV for Event Steward/i.test(a.title)))
  assert.ok(
    actions.some((a) =>
      /Complete \/ check selected training: SIA Door Supervisor Course/i.test(a.title)
    )
  )
  console.log('  ✓ 10. Courses only → infer catalog role; SIA stays training')
}

{
  // Midwifery — course only → specialism pathway, never Qualifi as title
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Midwifery',
    field: 'Healthcare & Medicine',
    specialism: 'Midwifery',
    roles: [
      {
        id: 'role:edu',
        group: 'roles',
        kind: 'role',
        title: 'Midwifery Educator',
        route_timing: 'future_progression',
        step_key: buildCaStepKey('work_in_my_education', 'role', 'Midwifery Educator'),
        metadata: { bucket: 'future_options' },
      },
    ],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'train:qualifi',
      group: 'training',
      kind: 'course',
      title: 'Qualifi Level 2 Diploma in Care',
      step_key: buildCaStepKey(
        'work_in_my_education',
        'course',
        'Qualifi Level 2 Diploma in Care'
      ),
      provider_status: 'provider_not_listed',
    },
  ]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.plan_title, 'Midwifery')
  assert.equal(identity.current_focus_role, 'Midwifery')
  assert.ok(identity.training_only_selection)
  assert.equal(identity.next_upgrade, 'Qualifi Level 2 Diploma in Care')
  assert.ok(!/Qualifi|Diploma/i.test(identity.plan_title))

  const plan = selectedToJobAZPlan(catalog, selected)
  assert.equal(plan.route_summary.route_title, 'Midwifery')
  assert.equal(plan.route_summary.next_upgrade_role, 'Qualifi Level 2 Diploma in Care')
  assert.equal(plan.training_next?.title, 'Qualifi Level 2 Diploma in Care')
  assert.ok(plan.work_now.every((r) => !/Qualifi|Diploma/i.test(r.title)))
  assert.ok(plan.ca_selection?.future_route === 'Midwifery Educator' || plan.after_training.length === 0)

  const actions = selectedToJazActions(selected, catalog)
  assert.ok(actions.every((a) => !/Qualifi|Diploma in Care/i.test(a.title) || /training/i.test(a.title)))
  assert.ok(actions.some((a) => /Create \/ improve CV for Midwifery/i.test(a.title)))
  assert.ok(actions.some((a) => /Apply to first Midwifery roles/i.test(a.title)))
  assert.ok(actions.every((a) => !/Apply to first Qualifi/i.test(a.title)))
  console.log('  ✓ 11. Midwifery course-only → Midwifery focus; Qualifi is training')
}

{
  // Civil Engineering + AutoCAD only
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Civil Engineering',
    field: 'Engineering',
    specialism: 'Civil Engineering',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'train:cad',
      group: 'training',
      kind: 'course',
      title: 'AutoCAD',
      step_key: buildCaStepKey('work_in_my_education', 'course', 'AutoCAD'),
      provider_status: 'provider_not_listed',
    },
  ]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.plan_title, 'Civil Engineering')
  assert.equal(identity.next_upgrade, 'AutoCAD')
  assert.ok(!/AutoCAD/i.test(identity.plan_title))
  console.log('  ✓ 12. AutoCAD-only → Civil Engineering pathway')
}

{
  // Taxi/PHV licence only
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_profession',
    route_title: 'Taxi PHV',
    field: 'Driving',
    specialism: 'Taxi PHV',
    roles: [
      {
        id: 'role:phv',
        group: 'roles',
        kind: 'role',
        title: 'Private Hire Driver',
        route_timing: 'start_now',
        step_key: buildCaStepKey('work_in_my_profession', 'role', 'Private Hire Driver'),
        metadata: { start_now: true },
      },
    ],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'train:phv',
      group: 'training',
      kind: 'licence',
      title: 'PHV licence / DBS',
      step_key: buildCaStepKey('work_in_my_profession', 'licence', 'PHV licence / DBS'),
      provider_status: 'check',
    },
  ]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.plan_title, 'Private Hire Driver')
  assert.equal(identity.next_upgrade, 'PHV licence / DBS')
  assert.ok(!/licence|DBS/i.test(identity.plan_title))
  console.log('  ✓ 13. PHV licence-only → Private Hire Driver focus')
}

{
  // Extra Income Cleaning + COSHH only
  const catalog: PlanPickCatalog = {
    goal_path: 'extra_income',
    route_title: 'Cleaning / Facilities Shifts',
    field: 'Cleaning',
    specialism: 'Cleaning / Facilities Shifts',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'train:coshh',
      group: 'training',
      kind: 'course',
      title: 'COSHH Awareness',
      step_key: buildCaStepKey('extra_income', 'course', 'COSHH Awareness'),
      provider_status: 'provider_not_listed',
    },
  ]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.plan_title, 'Cleaning / Facilities Shifts')
  assert.equal(identity.next_upgrade, 'COSHH Awareness')
  assert.ok(!/COSHH/i.test(identity.plan_title))
  console.log('  ✓ 14. COSHH-only → Cleaning / Facilities Shifts focus')
}

{
  // Misgrouped course in roles group must not become plan title when a real role exists
  const catalog: PlanPickCatalog = {
    goal_path: 'extra_income',
    route_title: 'Kitchen / Food Assistant',
    field: 'Hospitality',
    specialism: 'Kitchen / Food Assistant',
    roles: [],
    training: [],
    skills: [],
  }
  const selected: PlanPickItem[] = [
    {
      id: 'role:kit',
      group: 'roles',
      kind: 'role',
      title: 'Kitchen Assistant',
      route_timing: 'start_now',
      step_key: buildCaStepKey('extra_income', 'role', 'Kitchen Assistant'),
      metadata: { start_now: true },
    },
    {
      id: 'role:fake-course',
      group: 'roles',
      kind: 'role',
      title: 'Food Hygiene Certificate',
      route_timing: 'start_now',
      step_key: buildCaStepKey('extra_income', 'role', 'Food Hygiene Certificate'),
      metadata: { start_now: true },
    },
  ]
  const identity = resolveSelectedPlanIdentity(catalog, selected)
  assert.equal(identity.plan_title, 'Kitchen Assistant')
  assert.equal(identity.next_upgrade, 'Food Hygiene Certificate')
  assert.ok(identity.training.some((t) => t.title === 'Food Hygiene Certificate'))
  console.log('  ✓ 15. Misgrouped course role → training, not title')
}

console.log('\nAll Add to My Plan unit tests passed.\n')
