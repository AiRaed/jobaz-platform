/**
 * Humanities & Social Sciences polish — natural UK role titles + care-course gates.
 * Display / prioritisation only; does not change other career engines.
 */

import { classifyWieFieldFamily } from './field-families'

/** Care / support / MH courses that must not top HSS recommendations by default. */
export const HSS_CARE_SUPPORT_COURSE_RE =
  /\b(community\s+support\s+worker|support\s+worker\s+bridge|counselling\s+skills|mental\s+health\s+awareness|care\s+certificate|medication\s+admin|moving\s*(&|and)\s*handling|dementia\s+awareness|safeguarding(\s+(adults?|children))?)\b/i

/** Specialisms / directions where care-support courses are appropriate. */
export const HSS_CARE_DIRECTION_RE =
  /\b(psycholog|counsell|mental\s*health|social\s*care|support\s*worker|community\s*care|youth\s*work|care\s*&?\s*support)\b/i

/** Core HSS academic fields that are non-regulated practical. */
export const HSS_FIELD_RE =
  /\b(humanities|social\s*science|anthropolog|sociolog|history|politic|international\s*relation|philosoph|criminolog|social\s*policy|cultural\s*studies|media\s*studies|communication\s*studies|development\s*studies|gender\s*studies|archaeolog|geography|theology|religious\s*studies|classical\s*studies)\b/i

export function isHumanitiesSocialSciencesRoute(
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null
): boolean {
  const hay = `${fieldName ?? ''} ${fieldSlug ?? ''} ${specialismName ?? ''}`
  if (HSS_FIELD_RE.test(hay)) return true
  return classifyWieFieldFamily(fieldName, fieldSlug, specialismName) === 'non_regulated_practical' &&
    /humanities|social/i.test(hay)
}

export function isCareSupportDirection(
  fieldName?: string | null,
  specialismName?: string | null
): boolean {
  return HSS_CARE_DIRECTION_RE.test(`${fieldName ?? ''} ${specialismName ?? ''}`)
}

/** True when a care/MH/safeguarding course should be excluded from top HSS lists. */
export function shouldDeprioritiseCareCourseForHss(
  title: string,
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null
): boolean {
  if (!isHumanitiesSocialSciencesRoute(fieldName, specialismName, fieldSlug)) return false
  if (isCareSupportDirection(fieldName, specialismName)) return false
  return HSS_CARE_SUPPORT_COURSE_RE.test(title)
}

/**
 * Strip artificial specialism-prefixed library titles into natural UK job titles.
 */
export function polishHumanitiesRoleTitle(
  title: string,
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null
): string {
  if (!isHumanitiesSocialSciencesRoute(fieldName, specialismName, fieldSlug)) {
    return title
  }

  const raw = title.trim()
  const rules: Array<{ re: RegExp; out: string }> = [
    { re: /doctoral\s+researcher/i, out: 'Doctoral Researcher' },
    { re: /academic\s+researcher|research\s+fellow/i, out: 'Academic Researcher' },
    { re: /monitoring\s*(&|and)\s*evaluation\s+officer|\bm&e\s+officer\b/i, out: 'Monitoring & Evaluation Officer' },
    { re: /research\s*\/\s*programme\s+lead|research\s+programme\s+lead|programme\s+lead|program\s+lead/i, out: 'Programme Lead' },
    { re: /programme\s+coordinator|program\s+coordinator/i, out: 'Programme Coordinator' },
    { re: /policy\s+lead|policy\s+officer|policy\s+specialist|policy\s+adviser|policy\s+advisor/i, out: 'Policy Officer' },
    { re: /research\s+officer/i, out: 'Research Officer' },
    { re: /community\s+engagement\s+officer|outreach\s+coordinator/i, out: 'Community Engagement Officer' },
    { re: /outreach\s+coordinator/i, out: 'Outreach Coordinator' },
    { re: /public\s+sector\s+officer|public\s+sector\s+research/i, out: 'Public Sector Officer' },
    { re: /ngo\s*\/?\s*charity\s+administrator|charity\s+administrator/i, out: 'NGO / Charity Administrator' },
    { re: /charity\s+project\s+assistant|charity\s+\/?\s*ngo\s+project/i, out: 'Charity Project Assistant' },
    { re: /policy\s+support\s+officer|graduate\s+policy\s+assistant|policy\s+admin\s+assistant/i, out: 'Policy Support Officer' },
    { re: /project\s+coordinator/i, out: 'Project Coordinator' },
    { re: /programme\s+assistant|program\s+assistant|programme\s+support\s+assistant|programme\s+admin\s+assistant/i, out: 'Programme Assistant' },
    { re: /social\s+research\s+assistant|graduate\s+research\s+assistant/i, out: 'Social Research Assistant' },
    { re: /research\s+admin\s+assistant|research\s+assistant/i, out: 'Research Assistant' },
    { re: /public\s+sector\s+research\s+assistant/i, out: 'Public Sector Research Assistant' },
  ]

  for (const { re, out } of rules) {
    if (re.test(raw)) return out
  }

  // Strip leading specialism label: "Anthropology Foo" → try remaining rules on Foo
  const stripped = raw
    .replace(/^\s*[A-Za-z][A-Za-z\s/&-]{1,40}?\s+(?=(Research|Policy|Programme|Program|Graduate|Doctoral|Community|Charity|Project|Public|NGO|Outreach|Monitoring))/i, '')
    .replace(/\s*\([^)]+\)\s*$/g, '')
    .trim()

  if (stripped && stripped !== raw) {
    for (const { re, out } of rules) {
      if (re.test(stripped)) return out
    }
  }

  return raw
}

/** Lead / senior HSS titles that need experience — not Best immediate at 0 years. */
export function isHumanitiesLeadOrSeniorTitle(title: string): boolean {
  return /\b(programme\s+lead|program\s+lead|research\s*\/\s*programme\s+lead|policy\s+lead|team\s+lead|director|head\b|senior\s+|experienced\s+)\b/i.test(
    title
  )
}

export const HSS_PREFERRED_IMMEDIATE_TITLES = [
  'Research Assistant',
  'Social Research Assistant',
  'Public Sector Research Assistant',
  'Charity Project Assistant',
  'Programme Assistant',
  'Project Coordinator',
  'Community Engagement Officer',
  'Outreach Coordinator',
  'Policy Support Officer',
  'Public Sector Officer',
  'NGO / Charity Administrator',
] as const

export const HSS_PREFERRED_FUTURE_TITLES = [
  'Research Officer',
  'Programme Coordinator',
  'Policy Officer',
  'Monitoring & Evaluation Officer',
  'Programme Lead',
  'Academic Researcher',
  'Doctoral Researcher',
] as const
