import type { CareerRouteStageRule, CareerUserGoal } from '../types'

function stubRule(input: {
  route_id: string
  route_title: string
  user_goal: CareerUserGoal
  match: RegExp
  work_now_roles: string[]
  training_upgrades: Array<{ title: string; match: RegExp; primary?: boolean }>
  after_training_roles: string[]
  optional_addons?: string[]
  afterLabel: string
}): CareerRouteStageRule {
  const primary = input.training_upgrades.find((t) => t.primary) ?? input.training_upgrades[0]
  const workNow = input.work_now_roles[0] ?? 'Entry role'
  const after = input.after_training_roles[0] ?? 'Next role'
  const trainingTitle = primary?.title ?? 'Recommended training'

  return {
    route_id: input.route_id,
    route_title: input.route_title,
    user_goal: input.user_goal,
    implementation: 'stub',
    matchRoute: (routeTitle, currentTarget) =>
      input.match.test(`${routeTitle} ${currentTarget ?? ''}`),
    work_now_roles: input.work_now_roles,
    training_upgrades: input.training_upgrades,
    after_training_roles: input.after_training_roles,
    optional_addons: input.optional_addons ?? [],
    recommended_courses: input.training_upgrades.map((t) => ({
      title: t.title,
      match: t.match,
      affiliateExpected: Boolean(t.primary),
    })),
    cv_stages: {
      work_now: {
        id: 'work_now',
        buttonLabel: 'Work Now CV',
        stageLabel: 'CV stage: Work Now',
        targetRole: workNow,
        jobSearchTerms: input.work_now_roles.slice(0, 2),
        primaryJobQuery: workNow,
      },
      after_training: {
        id: 'after_training',
        buttonLabel: input.afterLabel,
        stageLabel: `CV stage: ${input.afterLabel}`,
        targetRole: after,
        jobSearchTerms: input.after_training_roles.slice(0, 2),
        primaryJobQuery: after,
        requiresCompletedUpgrade: true,
        warning: `Use this version only if you have completed or hold ${trainingTitle}.`,
      },
      general: {
        id: 'general',
        buttonLabel: 'General CV',
        stageLabel: 'CV stage: General',
        targetRole: workNow,
        jobSearchTerms: [workNow],
        primaryJobQuery: workNow,
      },
    },
    // Stub summaries — filled in when route is promoted to full
    summary_templates: [],
    skills: [],
    experience_bullets: [],
    qualifications: input.training_upgrades.map((t) => ({
      label: t.title,
      mode: 'completed_only' as const,
      match: t.match,
    })),
    trust_rules: {
      neverClaimCompletedUnlessConfirmed: true,
      incompletePhrases: ['working_towards', 'interested_in', 'planning_to_complete', 'building_experience'],
    },
    analytics: {
      route_id: input.route_id,
      route_key: input.route_id,
    },
  }
}

/** Future routes — structure only until content/providers are ready. */
export const careRouteStub = stubRule({
  route_id: 'care_support',
  route_title: 'Care support',
  user_goal: 'start_new_career',
  match: /care\s*assistant|support\s*worker|\bcare\b|safeguarding/i,
  work_now_roles: ['Care Assistant', 'Support Worker'],
  training_upgrades: [
    { title: 'Care Certificate', match: /care\s*certificate/i, primary: true },
    { title: 'Safeguarding', match: /safeguarding/i },
    { title: 'Moving & Handling', match: /moving|handling/i },
  ],
  after_training_roles: ['Care Assistant', 'Senior Care Assistant'],
  optional_addons: ['Medication Awareness'],
  afterLabel: 'After Training CV',
})

export const warehouseRouteStub = stubRule({
  route_id: 'warehouse_forklift',
  route_title: 'Warehouse / forklift',
  user_goal: 'extra_income',
  match: /warehouse|picker|packer|forklift/i,
  work_now_roles: ['Warehouse Operative', 'Picker Packer'],
  training_upgrades: [
    { title: 'Forklift Licence', match: /forklift/i, primary: true },
    { title: 'Manual Handling', match: /manual\s*handling/i },
  ],
  after_training_roles: ['Forklift Driver', 'Warehouse Forklift Operator'],
  afterLabel: 'After Forklift CV',
})

export const constructionRouteStub = stubRule({
  route_id: 'construction_cscs',
  route_title: 'Construction / CSCS',
  user_goal: 'start_new_career',
  match: /construction|cscs|labourer|site\s*operative/i,
  work_now_roles: ['Labourer', 'Site Assistant'],
  training_upgrades: [
    { title: 'CSCS Card', match: /cscs/i, primary: true },
    { title: 'Health & Safety in Construction', match: /health\s*&\s*safety|construction\s*health/i },
  ],
  after_training_roles: ['CSCS Labourer', 'Construction Operative'],
  afterLabel: 'After CSCS CV',
})

export const hospitalityRouteStub = stubRule({
  route_id: 'hospitality',
  route_title: 'Hospitality',
  user_goal: 'extra_income',
  match: /hospitality|front\s*of\s*house|kitchen\s*assistant|bar\s*staff|catering/i,
  work_now_roles: ['Front of House', 'Kitchen Assistant', 'Bar Staff'],
  training_upgrades: [
    { title: 'Food Safety', match: /food\s*safety|food\s*hygiene/i, primary: true },
    { title: 'First Aid', match: /first\s*aid/i },
  ],
  after_training_roles: ['Hospitality Assistant', 'Hospitality Supervisor'],
  afterLabel: 'After Training CV',
})

export const customerServiceRouteStub = stubRule({
  route_id: 'customer_service',
  route_title: 'Customer service',
  user_goal: 'change_career',
  match: /customer\s*service|call\s*centre|call\s*center|contact\s*centre/i,
  work_now_roles: ['Customer Service Assistant', 'Call Centre Advisor'],
  training_upgrades: [
    { title: 'Customer Service course', match: /customer\s*service/i, primary: true },
  ],
  after_training_roles: ['Customer Service Advisor', 'Admin Support'],
  afterLabel: 'Improved Customer Service CV',
})

export const digitalItRouteStub = stubRule({
  route_id: 'digital_it',
  route_title: 'Digital / IT',
  user_goal: 'start_new_career',
  match: /it\s*support|digital|comptia|cyber|web\s*dev|junior\s*developer/i,
  work_now_roles: ['IT Support Trainee', 'Digital Assistant'],
  training_upgrades: [
    { title: 'CompTIA / IT fundamentals', match: /comptia|it\s*fundamentals/i, primary: true },
    { title: 'Cyber Security basics', match: /cyber/i },
  ],
  after_training_roles: ['IT Support', 'Junior Digital role'],
  afterLabel: 'After Training Digital CV',
})

export const routeStageStubs: CareerRouteStageRule[] = [
  careRouteStub,
  warehouseRouteStub,
  constructionRouteStub,
  hospitalityRouteStub,
  customerServiceRouteStub,
  digitalItRouteStub,
]
