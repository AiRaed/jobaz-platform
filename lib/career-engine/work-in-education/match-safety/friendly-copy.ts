/**
 * Friendly public wording for match safety (global).
 */

import type { DetectedBlocker } from './blockers'
import type { SafetyMatchType } from './classify-role'
import {
  fieldFamilyAllowsProfessionalRegistrationLanguage,
  softRequirementWarning,
  type WieFieldFamily,
} from './field-families'

const TECHNICAL_REPLACEMENTS: Array<{ re: RegExp; text: string }> = [
  {
    re: /qualification level is ambiguous|cannot automatically satisfy/i,
    text: 'Some UK employers may ask for qualification recognition, portfolio evidence, or manual review depending on the role.',
  },
  {
    re: /this role does not require prior experience/i,
    text: 'This may be possible after relevant UK experience.',
  },
  {
    re: /education level compatible|qualification level matches this role/i,
    text: 'This role sits in your matched education area.',
  },
  {
    re: /draft library roles included/i,
    text: '',
  },
  {
    re: /integration testing|not for public publish/i,
    text: '',
  },
]

const SOFT_REGISTRATION_RE =
  /professional registration required or commonly expected|professional registration\/membership commonly expected|chartered or professional registration status is unconfirmed|professional registration or licence must be confirmed|professional registration is required and not confirmed|this route may need professional registration/i

export function friendlyRewrite(
  text: string,
  opts?: { suppressNoExperience?: boolean; fieldFamily?: WieFieldFamily }
): string {
  let t = text.trim()
  if (!t) return ''

  if (opts?.suppressNoExperience && /does not require prior experience/i.test(t)) {
    return 'This is better treated as a future option, not your first step.'
  }

  if (SOFT_REGISTRATION_RE.test(t)) {
    const allowHard = opts?.fieldFamily
      ? fieldFamilyAllowsProfessionalRegistrationLanguage(opts.fieldFamily)
      : false
    return allowHard
      ? 'Professional registration may be required.'
      : softRequirementWarning('employer')
  }

  if (/regulated role — registration\/licence pathway/i.test(t)) {
    return 'Professional registration may be required.'
  }

  for (const { re, text: replacement } of TECHNICAL_REPLACEMENTS) {
    if (re.test(t)) {
      t = replacement
      break
    }
  }
  return t
}

export function blockerToFriendly(
  blocker: DetectedBlocker,
  fieldFamily?: WieFieldFamily
): string {
  switch (blocker.kind) {
    case 'experience':
      return softRequirementWarning('experience')
    case 'professional':
      if (fieldFamily && !fieldFamilyAllowsProfessionalRegistrationLanguage(fieldFamily)) {
        return softRequirementWarning('employer')
      }
      return 'Professional registration may be required.'
    case 'academic':
      return softRequirementWarning('study')
    case 'qualification':
      return softRequirementWarning('employer')
    case 'recognition':
      return softRequirementWarning('employer')
    case 'stage_mismatch':
      return 'This is better treated as a future option, not your first step.'
    default:
      return blocker.label
  }
}

export function matchTypeLabel(type: SafetyMatchType): string {
  switch (type) {
    case 'best_immediate_route':
      return 'Best immediate route'
    case 'developing_match':
      return 'Practical adjacent route'
    case 'future_career_option':
      return 'Progression route'
    case 'needs_review_regulated':
      return 'Needs review'
    case 'not_recommended_now':
      return 'Not recommended now'
    default:
      return 'Match'
  }
}

export function matchTypeBucketCopy(type: SafetyMatchType): { title: string; description: string } {
  switch (type) {
    case 'best_immediate_route':
      return {
        title: 'Best immediate routes',
        description: 'Practical roles you can realistically start preparing for now.',
      }
    case 'developing_match':
      return {
        title: 'Practical adjacent routes',
        description:
          'Close roles that use your field — you may need CV positioning, UK experience, or small skill upgrades.',
      }
    case 'future_career_option':
      return {
        title: 'Progression routes',
        description:
          'Roles to work toward after more experience, further study, or stronger evidence — not immediate options.',
      }
    case 'needs_review_regulated':
      return {
        title: 'Needs review',
        description:
          'Roles with genuine regulation, licensing, or high requirement risk — confirm before applying.',
      }
    default:
      return {
        title: 'Other options',
        description: 'Roles that are not a strong fit for your current stage.',
      }
  }
}
