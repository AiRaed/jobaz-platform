/**
 * Global Work in My Education role-title polish.
 * Converts artificial specialism-prefixed library titles into natural UK job titles.
 */

import {
  isHumanitiesSocialSciencesRoute,
  polishHumanitiesRoleTitle,
} from './humanities-polish'

type PolishRule = { re: RegExp; out: string }

function applyRules(raw: string, rules: PolishRule[]): string | null {
  for (const { re, out } of rules) {
    if (re.test(raw)) return out
  }
  return null
}

function stripSpecialismPrefix(raw: string): string {
  return raw
    .replace(/\s*\([^)]+\)\s*$/g, '')
    .replace(
      /^\s*[A-Za-z][A-Za-z0-9\s/&-]{0,48}?\s+(?=(Graduate|Junior|Assistant|Trainee|Technician|Support|Officer|Coordinator|Co-ordinator|Administrator|Admin|Analyst|Engineer|Developer|Tester|Bookkeeper|Accounts|Finance|Payroll|HR|Marketing|Teaching|Learning|SEN|Cover|Lab|Laboratory|Research|Policy|Programme|Program|Project|Charity|Community|Public|CAD|Site|IT|Web|QA|Data|Care|Healthcare|Paralegal|Legal|Customer|Operations|Business))\b/i,
      ''
    )
    .trim()
}

const ENGINEERING_RULES: PolishRule[] = [
  { re: /graduate\s+civil\s+engineer|civil\s+graduate\s+engineer/i, out: 'Graduate Civil Engineer' },
  { re: /assistant\s+civil\s+engineer|civil\s+assistant\s+engineer/i, out: 'Assistant Civil Engineer' },
  { re: /site\s+engineering\s+assistant|site\s+engineer\s+assistant|graduate\s+site/i, out: 'Site Engineering Assistant' },
  { re: /cad\s+technician|autocad\s+technician|draughtsman|drafter/i, out: 'CAD Technician' },
  { re: /engineering\s+technician|technician\s+\(.*engineer/i, out: 'Engineering Technician' },
  { re: /graduate\s+engineer/i, out: 'Graduate Engineer' },
  { re: /assistant\s+engineer/i, out: 'Assistant Engineer' },
  { re: /bim\s+technician|bim\s+coordinator/i, out: 'BIM Technician' },
  { re: /chartered\s+(civil\s+)?engineer/i, out: 'Chartered Engineer' },
]

const ACCOUNTING_RULES: PolishRule[] = [
  { re: /accounts\s+assistant|accounting\s+assistant|graduate\s+accounts/i, out: 'Accounts Assistant' },
  { re: /finance\s+assistant|graduate\s+finance/i, out: 'Finance Assistant' },
  { re: /payroll\s+assistant/i, out: 'Payroll Assistant' },
  { re: /bookkeep/i, out: 'Bookkeeping Assistant' },
  { re: /credit\s+control/i, out: 'Credit Control Assistant' },
  { re: /chartered\s+accountant|acca\s+qualified/i, out: 'Chartered Accountant' },
]

const IT_RULES: PolishRule[] = [
  { re: /junior\s+(software\s+)?developer|graduate\s+(software\s+)?developer/i, out: 'Junior Developer' },
  { re: /it\s+support|helpdesk|service\s+desk|technical\s+support/i, out: 'IT Support Assistant' },
  { re: /web\s+developer|junior\s+web/i, out: 'Web Developer' },
  { re: /qa\s+tester|software\s+tester|test\s+analyst/i, out: 'QA Tester' },
  { re: /data\s+(analyst\s+)?assistant|junior\s+data\s+analyst/i, out: 'Data Analyst Assistant' },
  { re: /software\s+architect|solutions\s+architect/i, out: 'Software Architect' },
]

const BUSINESS_RULES: PolishRule[] = [
  { re: /business\s+support|operations\s+assistant/i, out: 'Business Support Officer' },
  { re: /project\s+coordinator/i, out: 'Project Coordinator' },
  { re: /account\s+coordinator|customer\s+success/i, out: 'Account Coordinator' },
  { re: /office\s+manager\s+assistant|office\s+assistant|administrator|admin\s+assistant/i, out: 'Administrator' },
  { re: /hr\s+assistant|people\s+operations\s+assistant/i, out: 'HR Assistant' },
  { re: /marketing\s+assistant|digital\s+marketing\s+assistant/i, out: 'Marketing Assistant' },
  { re: /social\s+media\s+assistant|content\s+assistant/i, out: 'Social Media Assistant' },
  { re: /junior\s+analyst|business\s+analyst\s+assistant/i, out: 'Junior Analyst' },
]

const EDUCATION_RULES: PolishRule[] = [
  { re: /sen\s+(teaching\s+)?assistant|sen\s+support/i, out: 'SEN Support Assistant' },
  { re: /learning\s+support\s+assistant/i, out: 'Learning Support Assistant' },
  { re: /teaching\s+assistant/i, out: 'Teaching Assistant' },
  { re: /cover\s+supervisor/i, out: 'Cover Supervisor' },
  { re: /qualified\s+teacher|qts\b/i, out: 'Qualified Teacher' },
]

const HEALTHCARE_RULES: PolishRule[] = [
  { re: /healthcare\s+assistant|\bhca\b/i, out: 'Healthcare Assistant' },
  { re: /care\s+assistant/i, out: 'Care Assistant' },
  { re: /support\s+worker|mental\s+health\s+support/i, out: 'Support Worker' },
  { re: /nhs\s+admin|ward\s+clerk|medical\s+secretary/i, out: 'NHS Administrator' },
  { re: /registered\s+nurse|\bstaff\s+nurse\b/i, out: 'Registered Nurse' },
  { re: /clinical\s+psychologist/i, out: 'Clinical Psychologist' },
]

const SCIENCE_RULES: PolishRule[] = [
  { re: /lab(oratory)?\s+technician|lab\s+assistant/i, out: 'Lab Technician' },
  { re: /research\s+assistant/i, out: 'Research Assistant' },
  { re: /quality\s+control\s+technician|qc\s+technician/i, out: 'Quality Control Technician' },
  { re: /scientific\s+officer/i, out: 'Scientific Officer Assistant' },
]

const LAW_RULES: PolishRule[] = [
  { re: /paralegal/i, out: 'Paralegal' },
  { re: /legal\s+assistant|legal\s+admin/i, out: 'Legal Assistant' },
  { re: /compliance\s+assistant/i, out: 'Compliance Assistant' },
  { re: /casework\s+assistant/i, out: 'Casework Assistant' },
  { re: /\bsolicitor\b/i, out: 'Solicitor' },
  { re: /\bbarrister\b/i, out: 'Barrister' },
]

function matchFieldPack(
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null
): PolishRule[] | null {
  const hay = `${fieldName ?? ''} ${fieldSlug ?? ''} ${specialismName ?? ''}`
  if (/engineer|civil|mechanical|electrical|structural|built\s*environment|construction|manufactur/i.test(hay)) {
    return ENGINEERING_RULES
  }
  if (/account|finance|banking|bookkeep|payroll/i.test(hay)) return ACCOUNTING_RULES
  if (/\bit\b|technology|computer|software|cyber|data\s*science|information\s*tech|computing|digital\s*tech/i.test(hay)) {
    return IT_RULES
  }
  if (/educat|teach|pgce|school|early\s*year|tutoring/i.test(hay)) return EDUCATION_RULES
  if (/health|nurs|midwif|care\s*&|social\s*care|paramedic|allied\s*health/i.test(hay)) {
    return HEALTHCARE_RULES
  }
  if (/\blaw\b|legal|paralegal|solicitor|barrister/i.test(hay)) return LAW_RULES
  if (/biology|chemistry|physics|natural\s*science|laboratory|lab\b|environ/i.test(hay)) {
    return SCIENCE_RULES
  }
  if (/business|management|marketing|hr\b|human\s*resource|admin|office|operations|commerce/i.test(hay)) {
    return BUSINESS_RULES
  }
  return null
}

/** Lead / senior titles that need experience — not Best immediate at 0 years. */
export function isLeadOrSeniorTitle(title: string): boolean {
  return /\b(programme\s+lead|program\s+lead|research\s*\/\s*programme\s+lead|policy\s+lead|team\s+lead|director|head\b|senior\s+|experienced\s+|principal|consultant|chartered|manager\b)\b/i.test(
    title
  ) && !/\b(assistant|coordinator|co-ordinator|officer|trainee|junior|graduate|technician|support|administrator)\b/i.test(title)
}

/**
 * Polish a library role title for public WIE results.
 */
export function polishWieRoleTitle(
  title: string,
  fieldName?: string | null,
  specialismName?: string | null,
  fieldSlug?: string | null
): string {
  const raw = title.trim()
  if (!raw) return title

  if (isHumanitiesSocialSciencesRoute(fieldName, specialismName, fieldSlug)) {
    return polishHumanitiesRoleTitle(raw, fieldName, specialismName, fieldSlug)
  }

  const pack = matchFieldPack(fieldName, specialismName, fieldSlug)
  if (pack) {
    const direct = applyRules(raw, pack)
    if (direct) return direct
    const stripped = stripSpecialismPrefix(raw)
    if (stripped && stripped !== raw) {
      const again = applyRules(stripped, pack)
      if (again) return again
      // Prefer stripped natural title when prefix was artificial
      if (stripped.length >= 8 && stripped.length < raw.length) return stripped
    }
  }

  // Generic cleanup: strip trailing (Specialism) and leading specialism words when title is long
  const generic = stripSpecialismPrefix(raw)
  if (generic && generic.length >= 8 && generic.length < raw.length - 4) return generic
  return raw
}
