/**
 * Rules/template fallback when Ollama is unavailable.
 * Reuses Extra Income route intelligence where skills match; never uses OpenAI.
 */

import {
  resolveExtraIncomeRoute,
  orderedRouteCourseTypes,
  type CareerRouteLogic,
} from '@/lib/career-engine/extra-income/routeIntelligence'
import type { JazAnalyseInput, JazBrainReasoning, JazRecommendedCourseType } from './types'

function collectSkillKeys(input: JazAnalyseInput): string[] {
  const keys = new Set<string>()
  for (const s of input.skills ?? []) {
    const t = String(s).trim().toLowerCase()
    if (!t) continue
    const key = t.replace(/\s+/g, '_')
    keys.add(key)
    if (key === 'admin' || key === 'office') keys.add('administration')
  }

  const answers = input.answers ?? {}
  const prefs = input.preferences ?? {}
  const bags = [answers, prefs]

  for (const bag of bags) {
    for (const [k, v] of Object.entries(bag)) {
      if (/skill|interest|side|route|sector|industry/i.test(k)) {
        if (Array.isArray(v)) {
          for (const item of v) keys.add(String(item).trim().toLowerCase().replace(/\s+/g, '_'))
        } else if (typeof v === 'string' && v.trim()) {
          keys.add(v.trim().toLowerCase().replace(/\s+/g, '_'))
        }
      }
    }
  }

  const blob = JSON.stringify({ answers, prefs, skills: input.skills }).toLowerCase()
  const aliases: Array<[RegExp, string]> = [
    [/security|sia|steward|door\s*supervisor/, 'security'],
    [/retail|shop|sales\s*assistant/, 'retail'],
    [/customer\s*service|call\s*centre|call\s*center/, 'customer_service'],
    [/language|tutor|tefl|bilingual|translat/, 'languages'],
    [/\bit\b|digital|coding|software/, 'tech'],
    [/care\b|support\s*worker|nhs|carer/, 'care'],
    [/warehouse|forklift|logistics/, 'warehouse'],
    [/construction|cscs|site\s*labour/, 'construction'],
    [/hospitality|kitchen|barista|food\s*hygiene/, 'hospitality'],
    [/driv(e|ing)|delivery|taxi|phv/, 'driving'],
    [/teach|tutor|education/, 'teaching'],
    [/admin|office|reception|excel|microsoft/, 'administration'],
    [/account|finance|aat|bookkeep/, 'administration'],
    [/teach|teaching\s*assistant|education/, 'teaching'],
  ]
  for (const [re, key] of aliases) {
    if (re.test(blob)) keys.add(key)
  }

  return [...keys]
}

function courseTypesFromRoute(route: CareerRouteLogic): JazRecommendedCourseType[] {
  const { primary, optional } = orderedRouteCourseTypes(route)
  const out: JazRecommendedCourseType[] = []
  for (const c of primary.slice(0, 2)) {
    out.push({
      title: c.title,
      priority: 'primary',
      reason: c.why,
      related_roles: route.after_training_roles.slice(0, 3),
      related_skills: route.skill_keys,
      pathway_stage: /sia|cscs|licence|license/i.test(c.title) ? 'licence' : 'upgrade',
    })
  }
  for (const c of optional.slice(0, 2)) {
    out.push({
      title: c.title,
      priority: 'optional',
      reason: c.why,
      related_roles: route.after_training_roles.slice(0, 2),
      related_skills: route.skill_keys,
      pathway_stage: 'optional',
    })
  }
  return out.slice(0, 4)
}

function reasoningFromRoute(route: CareerRouteLogic, goal: string): JazBrainReasoning {
  const current = route.work_now_roles[0] || 'Entry role'
  const upgrade = route.primary_next_upgrades[0]?.title || route.after_training_roles[0] || 'Skills course'
  return {
    route_title: route.route_title,
    route_category: route.route_id,
    user_goal: route.user_goal || goal,
    why_this_route_fits: `Your answers point toward ${route.route_title.toLowerCase()}.`,
    current_focus: current,
    next_upgrade: upgrade === current ? `${upgrade} progression` : upgrade,
    readiness: 58,
    work_now_roles: route.work_now_roles.slice(0, 3).map((title) => ({
      title,
      why: `Realistic UK entry option on the ${route.route_title.toLowerCase()} path.`,
      pay_range: 'Varies by employer and hours',
      job_search_terms: route.job_search_terms.length
        ? route.job_search_terms
        : [title],
    })),
    recommended_course_types: courseTypesFromRoute(route),
    cv_focus: route.cv_focus,
    first_action_plan: [
      {
        step: `Search for ${current} roles`,
        why: 'Build momentum with work you can apply for now.',
        action_type: 'job_search',
      },
      {
        step: `Plan ${upgrade}`,
        why: 'This unlocks stronger roles on your route.',
        action_type: 'course',
      },
      {
        step: 'Update your CV for this route',
        why: route.cv_focus,
        action_type: 'cv',
      },
    ],
    confidence: 0.55,
  }
}

/** Safe broad UK route when skills are unclear */
function broadFallback(goal: string): JazBrainReasoning {
  return {
    route_title: 'Flexible UK entry work',
    route_category: 'general',
    user_goal: goal || 'Find practical UK work options',
    why_this_route_fits:
      'We need a little more detail, so this is a safe broad route with customer-facing and admin entry options.',
    current_focus: 'Customer Service Assistant',
    next_upgrade: 'Customer Service Skills',
    readiness: 45,
    work_now_roles: [
      {
        title: 'Customer Service Assistant',
        why: 'Common UK entry role using communication skills.',
        pay_range: 'Varies by employer',
        job_search_terms: ['Customer Service Assistant', 'Retail Assistant'],
      },
      {
        title: 'Retail Assistant',
        why: 'Widely available and builds workplace experience.',
        pay_range: 'Varies by employer',
        job_search_terms: ['Retail Assistant', 'Sales Assistant'],
      },
      {
        title: 'Admin Assistant',
        why: 'Suits organised candidates building office experience.',
        pay_range: 'Varies by employer',
        job_search_terms: ['Admin Assistant', 'Office Administrator'],
      },
    ],
    recommended_course_types: [
      {
        title: 'Customer Service Skills',
        priority: 'primary',
        reason: 'Supports retail, admin, and support roles.',
        related_roles: ['Customer Service Assistant', 'Retail Assistant'],
        related_skills: ['communication'],
        pathway_stage: 'start',
      },
      {
        title: 'Microsoft Office',
        priority: 'secondary',
        reason: 'Useful for admin and remote support pathways.',
        related_roles: ['Admin Assistant'],
        related_skills: ['admin'],
        pathway_stage: 'upgrade',
      },
    ],
    cv_focus: 'reliability, communication, and right to work',
    first_action_plan: [
      {
        step: 'Apply to 3 customer service or retail roles',
        why: 'Practical applications create feedback fast.',
        action_type: 'job_search',
      },
      {
        step: 'Add one short skills course to your plan',
        why: 'Shows employers you are building UK workplace skills.',
        action_type: 'course',
      },
    ],
    confidence: 0.35,
  }
}

function accountingEducationFallback(): JazBrainReasoning {
  return {
    route_title: 'Accounts / Finance Admin route',
    route_category: 'admin',
    user_goal: 'Use your accounting education in UK finance admin roles.',
    why_this_route_fits: 'Your accounting education maps well to Accounts Assistant and Finance Admin entry roles.',
    current_focus: 'Accounts Assistant',
    next_upgrade: 'AAT / Bookkeeping foundation',
    readiness: 62,
    work_now_roles: [
      {
        title: 'Accounts Assistant',
        why: 'Direct use of accounting study in UK offices.',
        pay_range: 'Varies by employer',
        job_search_terms: ['Accounts Assistant', 'Finance Assistant'],
      },
      {
        title: 'Finance Admin',
        why: 'Combines admin systems with finance support.',
        pay_range: 'Varies by employer',
        job_search_terms: ['Finance Admin', 'Purchase Ledger'],
      },
    ],
    recommended_course_types: [
      {
        title: 'AAT / Bookkeeping',
        priority: 'primary',
        reason: 'Recognised UK finance pathway from education into work.',
        related_roles: ['Accounts Assistant'],
        related_skills: ['accounting'],
        pathway_stage: 'upgrade',
      },
      {
        title: 'Excel for Finance',
        priority: 'primary',
        reason: 'Core skill for UK accounts roles.',
        related_roles: ['Accounts Assistant', 'Finance Admin'],
        related_skills: ['excel'],
        pathway_stage: 'start',
      },
      {
        title: 'Xero / QuickBooks',
        priority: 'secondary',
        reason: 'Common accounting software in UK SMEs.',
        related_roles: ['Accounts Assistant'],
        related_skills: ['bookkeeping'],
        pathway_stage: 'optional',
      },
    ],
    cv_focus: 'accounting education, Excel, accuracy and right to work',
    first_action_plan: [
      { step: 'Search Accounts Assistant roles', why: 'Matches your education now.', action_type: 'job_search' },
      { step: 'Compare AAT or Excel for Finance', why: 'Strengthens UK finance applications.', action_type: 'course' },
      { step: 'Update CV for finance admin', why: 'Highlight coursework and systems.', action_type: 'cv' },
    ],
    confidence: 0.7,
  }
}

function growAdminFallback(currentRole: string): JazBrainReasoning {
  const focus = currentRole || 'Admin Assistant'
  return {
    route_title: 'Admin career growth',
    route_category: 'admin',
    user_goal: 'Progress from admin assistant toward senior office coordination.',
    why_this_route_fits: 'Your current admin experience supports a clear promotion path in UK offices.',
    current_focus: focus,
    next_upgrade: 'Advanced Excel / Microsoft Office',
    readiness: 65,
    work_now_roles: [
      {
        title: focus,
        why: 'Your current role — strengthen while preparing for promotion.',
        pay_range: 'Varies by employer',
        job_search_terms: [focus, 'Admin Assistant'],
      },
      {
        title: 'Office Coordinator',
        why: 'Natural next step with stronger office systems skills.',
        pay_range: 'Varies by employer',
        job_search_terms: ['Office Coordinator', 'Senior Admin Assistant'],
      },
    ],
    recommended_course_types: [
      {
        title: 'Microsoft Office / Advanced Excel',
        priority: 'primary',
        reason: 'Primary upgrade for admin promotion paths.',
        related_roles: ['Senior Admin Assistant', 'Office Coordinator'],
        related_skills: ['administration'],
        pathway_stage: 'growth',
      },
      {
        title: 'Business Admin',
        priority: 'secondary',
        reason: 'Supports coordinator and team support responsibilities.',
        related_roles: ['Office Coordinator'],
        related_skills: ['administration'],
        pathway_stage: 'upgrade',
      },
      {
        title: 'Customer Service Skills',
        priority: 'optional',
        reason: 'Useful for reception and stakeholder-facing admin.',
        related_roles: ['Reception', 'Office Coordinator'],
        related_skills: ['customer_service'],
        pathway_stage: 'optional',
      },
    ],
    cv_focus: 'ownership, Excel/Office systems, process improvement and reliability',
    first_action_plan: [
      { step: 'List promotion criteria for Senior Admin / Coordinator', why: 'Clarifies what to evidence.', action_type: 'research' },
      { step: 'Start Advanced Excel / Microsoft Office', why: 'Common promotion unlocker.', action_type: 'course' },
      { step: 'Refresh CV for Senior Admin', why: 'Show measurable admin impact.', action_type: 'cv' },
    ],
    confidence: 0.68,
  }
}

function businessPhase1Fallback(idea: string): JazBrainReasoning {
  return {
    route_title: 'UK business setup (phase 1)',
    route_category: 'general',
    user_goal: 'Start a practical UK business with basics first.',
    why_this_route_fits:
      'Phase-1 focus: planning, registration basics, bookkeeping, marketing and a simple web presence — no random affiliate courses.',
    current_focus: 'Business planning & setup',
    next_upgrade: 'Bookkeeping basics for sole traders',
    readiness: 50,
    work_now_roles: [
      {
        title: 'Business planning & setup',
        why: 'Clarify offer, customers and costs before spending on courses.',
        pay_range: 'N/A — setup stage',
        job_search_terms: ['sole trader UK', 'business plan'],
      },
      {
        title: 'Basic bookkeeping',
        why: 'Track income and expenses from day one.',
        pay_range: 'N/A — setup stage',
        job_search_terms: ['bookkeeping sole trader'],
      },
    ],
    recommended_course_types: [
      {
        title: 'Business planning basics',
        priority: 'primary',
        reason: 'Phase-1 foundation for any UK start-up idea.',
        related_roles: [],
        related_skills: ['business'],
        pathway_stage: 'start',
      },
      {
        title: 'Bookkeeping for sole traders',
        priority: 'primary',
        reason: 'Keeps finances clean for HMRC and growth.',
        related_roles: [],
        related_skills: ['bookkeeping'],
        pathway_stage: 'upgrade',
      },
      {
        title: 'Digital marketing basics',
        priority: 'secondary',
        reason: 'Helps find first customers online.',
        related_roles: [],
        related_skills: ['marketing'],
        pathway_stage: 'optional',
      },
      {
        title: 'Website basics',
        priority: 'optional',
        reason: 'Simple online presence without overbuilding.',
        related_roles: [],
        related_skills: ['digital'],
        pathway_stage: 'optional',
      },
    ],
    cv_focus: idea
      ? `practical setup for ${idea.replace(/_/g, ' ')} — customers, costs and compliance`
      : 'practical UK business setup — customers, costs and compliance',
    first_action_plan: [
      { step: 'Write a one-page offer and customer list', why: 'Keeps the idea concrete.', action_type: 'research' },
      { step: 'Set up basic bookkeeping', why: 'Track money from day one.', action_type: 'course' },
      { step: 'Choose one marketing channel', why: 'Avoid spreading effort too thin.', action_type: 'profile' },
    ],
    confidence: 0.55,
  }
}

export function buildFallbackBrainReasoning(input: JazAnalyseInput): JazBrainReasoning {
  const goal = String(input.goal || 'unknown')
  const skillKeys = collectSkillKeys(input)
  const blob = JSON.stringify({ answers: input.answers, skills: input.skills, goal }).toLowerCase()

  // Goal-specific controlled templates
  if (goal === 'start_business') {
    return businessPhase1Fallback(String(input.answers?.biz_idea || ''))
  }

  if (
    (goal === 'work_in_education' || goal === 'grow_current_career') &&
    /account|finance|aat|bookkeep|xero|quickbooks/.test(blob)
  ) {
    return accountingEducationFallback()
  }

  if (
    goal === 'grow_current_career' &&
    (/admin|office|reception|coordinator/.test(blob) || skillKeys.includes('administration'))
  ) {
    return growAdminFallback(String(input.answers?.current_role || 'Admin Assistant'))
  }

  // Experience / education care
  if ((goal === 'work_in_experience' || goal === 'work_in_education') && skillKeys.includes('care')) {
    const route = resolveExtraIncomeRoute(['care'])
    return {
      ...reasoningFromRoute(route, goal),
      route_title: 'Care work route',
      user_goal: 'Use care experience in UK support roles.',
    }
  }

  // Start new career security
  if (goal === 'start_new_career' && skillKeys.includes('security')) {
    return reasoningFromRoute(resolveExtraIncomeRoute(['security']), goal)
  }

  const route = resolveExtraIncomeRoute(skillKeys)
  if (route.route_id === 'general' && skillKeys.length === 0) {
    return broadFallback(goal)
  }
  return reasoningFromRoute(route, goal)
}
