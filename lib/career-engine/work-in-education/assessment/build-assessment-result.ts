/**
 * Deterministic non-LLM result presenter (message keys + short templates).
 */

import type { WorkInEducationMatchResult } from '../types'
import type { AssessmentPresentation, PresentationNextAction, PresentationMessage } from './types'

function tpl(template: string, params: Record<string, string | number | boolean | null>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key]
    return v == null ? '' : String(v)
  })
}

const HEADLINES: Record<string, string> = {
  'assessment.headline.matched': 'Your qualification most closely matches {specialism}.',
  'assessment.headline.field_only': 'Your qualification aligns with {field}.',
  'assessment.headline.needs_clarification':
    'Your {subject} qualification is broad, so we need your preferred specialism.',
  'assessment.headline.invalid': 'We could not complete the assessment from these answers.',
  'assessment.headline.overseas_regulated':
    'Your overseas {subject} qualification needs UK registration review before clinical work.',
}

const SUMMARY: Record<string, string> = {
  'assessment.summary.immediate_count': 'You currently have {count} roles that appear accessible now.',
  'assessment.summary.realistic_next':
    'There are {count} realistic next-step roles once you gain experience or credentials.',
  'assessment.summary.future': 'Some professional roles require more experience or chartered status.',
  'assessment.summary.blocked': '{count} roles are blocked until registration or other requirements are met.',
  'assessment.summary.academic': '{count} academic or research pathways are relevant to your profile.',
  'assessment.summary.recognition':
    'Qualification recognition may be required for regulated practice in the UK.',
  'assessment.summary.clarification': 'Select a specialism to unlock precise role recommendations.',
}

const ACTIONS: Record<string, string> = {
  'assessment.action.clarification': 'Choose your preferred specialism from the options provided.',
  'assessment.action.registration': 'Review professional registration requirements for regulated roles.',
  'assessment.action.recognition': 'Confirm UK recognition status for your overseas qualification.',
  'assessment.action.experience': 'Build relevant experience toward realistic next-step roles.',
  'assessment.action.review': 'Some matches need manual review before they can be recommended as immediate.',
}

export function buildAssessmentPresentation(
  match: WorkInEducationMatchResult | null,
  opts: {
    assessment_status: 'complete' | 'needs_clarification' | 'invalid'
    subject?: string
  }
): AssessmentPresentation {
  const summary_items: PresentationMessage[] = []
  const next_action_items: PresentationNextAction[] = []

  if (opts.assessment_status === 'invalid' || !match) {
    return {
      headline_key: 'assessment.headline.invalid',
      headline_params: {},
      headline: HEADLINES['assessment.headline.invalid'],
      summary_items: [],
      next_action_items: [],
    }
  }

  const specialism = match.resolution.primary_specialism?.name ?? ''
  const field = match.resolution.primary_field?.name ?? ''
  const subject = opts.subject || match.profile_summary.subject || 'qualification'

  let headline_key = 'assessment.headline.matched'
  let headline_params: Record<string, string | number | boolean | null> = {
    specialism: specialism || field,
    field,
    subject,
  }

  if (match.resolution.needs_clarification) {
    headline_key = 'assessment.headline.needs_clarification'
  } else if (
    match.qualification_recognition.review_needed &&
    /medicine|nurs|midwif/i.test(subject)
  ) {
    headline_key = 'assessment.headline.overseas_regulated'
  } else if (!specialism && field) {
    headline_key = 'assessment.headline.field_only'
  }

  const imm = match.recommendations.immediate.length
  const next = match.recommendations.realistic_next.length
  const future = match.recommendations.future_progression.length
  const blocked = match.recommendations.blocked_or_needs_review.length
  const academic = match.recommendations.academic_or_research.length

  if (match.resolution.needs_clarification) {
    summary_items.push({
      message_key: 'assessment.summary.clarification',
      params: {},
      text: SUMMARY['assessment.summary.clarification'],
    })
    next_action_items.push({
      type: 'clarification',
      message_key: 'assessment.action.clarification',
      params: {},
      text: ACTIONS['assessment.action.clarification'],
    })
  } else {
    if (imm > 0) {
      summary_items.push({
        message_key: 'assessment.summary.immediate_count',
        params: { count: imm },
        text: tpl(SUMMARY['assessment.summary.immediate_count'], { count: imm }),
      })
    }
    if (next > 0) {
      summary_items.push({
        message_key: 'assessment.summary.realistic_next',
        params: { count: next },
        text: tpl(SUMMARY['assessment.summary.realistic_next'], { count: next }),
      })
    }
    if (future > 0) {
      summary_items.push({
        message_key: 'assessment.summary.future',
        params: { count: future },
        text: SUMMARY['assessment.summary.future'],
      })
    }
    if (blocked > 0) {
      summary_items.push({
        message_key: 'assessment.summary.blocked',
        params: { count: blocked },
        text: tpl(SUMMARY['assessment.summary.blocked'], { count: blocked }),
      })
    }
    if (academic > 0) {
      summary_items.push({
        message_key: 'assessment.summary.academic',
        params: { count: academic },
        text: tpl(SUMMARY['assessment.summary.academic'], { count: academic }),
      })
    }
  }

  if (match.qualification_recognition.review_needed) {
    summary_items.push({
      message_key: 'assessment.summary.recognition',
      params: { country: match.qualification_recognition.country },
      text: SUMMARY['assessment.summary.recognition'],
    })
    next_action_items.push({
      type: 'recognition',
      message_key: 'assessment.action.recognition',
      params: {},
      text: ACTIONS['assessment.action.recognition'],
    })
  }

  const hasRegGap = match.overall_gaps.some(
    (g) => g.type === 'registration' || g.type === 'registration_scope'
  )
  if (hasRegGap) {
    next_action_items.push({
      type: 'registration',
      message_key: 'assessment.action.registration',
      params: {},
      text: ACTIONS['assessment.action.registration'],
    })
  }

  if (next > 0 && !match.resolution.needs_clarification) {
    next_action_items.push({
      type: 'experience',
      message_key: 'assessment.action.experience',
      params: {},
      text: ACTIONS['assessment.action.experience'],
    })
  }

  if (match.qa_summary.regulated_role_safety === 'FAIL' || blocked > 0) {
    next_action_items.push({
      type: 'review',
      message_key: 'assessment.action.review',
      params: {},
      text: ACTIONS['assessment.action.review'],
    })
  }

  return {
    headline_key,
    headline_params,
    headline: tpl(HEADLINES[headline_key] ?? HEADLINES['assessment.headline.matched'], headline_params),
    summary_items,
    next_action_items,
  }
}
