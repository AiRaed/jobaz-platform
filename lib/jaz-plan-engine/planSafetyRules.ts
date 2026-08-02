/**
 * Safety rules for JAZ Plan Engine outputs.
 */

import type { JazPlanAction, JazActionPlanResult } from './types'

const FAKE_APPLY =
  /guarantee|guaranteed|earn\s*£?\d+|will\s+get\s+you\s+a\s+job|100%\s*job/i

export function sanitizePlanActions(actions: JazPlanAction[]): {
  actions: JazPlanAction[]
  notes: string[]
} {
  const notes: string[] = []
  const out = actions.slice(0, 5).map((a) => {
    let next = { ...a }
    if (next.cta_label === 'Apply Now') {
      const target = (next.cta_target || '').trim()
      const looksHttp = /^https?:\/\//i.test(target)
      if (!looksHttp) {
        notes.push(`Blocked Apply Now without referral URL: ${next.title}`)
        next = {
          ...next,
          cta_label: 'Save Interest',
          cta_target: next.cta_target?.startsWith('/')
            ? next.cta_target
            : `/courses?q=${encodeURIComponent(next.title)}`,
        }
      }
    }
    if (FAKE_APPLY.test(next.title) || FAKE_APPLY.test(next.description)) {
      notes.push(`Softened over-promise wording on: ${next.title}`)
      next = {
        ...next,
        description: next.description.replace(FAKE_APPLY, 'may support').slice(0, 220),
      }
    }
    return next
  })
  return { actions: out, notes }
}

export function applyPlanSafety(plan: JazActionPlanResult): JazActionPlanResult {
  const buckets = [
    'today_actions',
    'this_week_actions',
    'next_14_days',
    'next_30_days',
    'cv_actions',
    'job_actions',
    'course_actions',
    'follow_up_actions',
  ] as const

  const safety_notes = [...plan.safety_notes]
  const next = { ...plan }

  for (const key of buckets) {
    const { actions, notes } = sanitizePlanActions(plan[key] || [])
    next[key] = actions
    safety_notes.push(...notes)
  }

  if (next.next_best_action) {
    const { actions, notes } = sanitizePlanActions([next.next_best_action])
    next.next_best_action = actions[0] || null
    safety_notes.push(...notes)
  }

  // Cap first-week actions
  next.this_week_actions = next.this_week_actions.slice(0, 5)
  if (next.today_actions.length === 0) {
    next.today_actions = next.this_week_actions.slice(0, 2)
  }

  return { ...next, safety_notes: [...new Set(safety_notes)].slice(0, 12) }
}
