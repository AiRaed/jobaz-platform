/**
 * Route-specific career progression ladders for My Plan destination + roadmap.
 */

import { getCareerPathById } from '@/lib/career-paths'
import { defaultSalaryForPath } from '@/lib/career-hub/marketplace/salary'

export type RouteProgression = {
  entryRole: string
  nextRole: string
  advancedPath: string
  salaries: [string, string, string]
  horizons: [string, string, string]
}

const PROGRESSION: Record<string, RouteProgression> = {
  'care-support': {
    entryRole: 'Care Assistant',
    nextRole: 'Senior Care Worker',
    advancedPath: 'Nursing Associate',
    salaries: ['£22k–24k', '£26k–30k', '£32k–40k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'security-facilities': {
    entryRole: 'Security Officer',
    nextRole: 'Senior Security Officer',
    advancedPath: 'Security Supervisor',
    salaries: ['£22k–26k', '£28k–32k', '£32k–38k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'teaching-support': {
    entryRole: 'Teaching Assistant',
    nextRole: 'Higher Level Teaching Assistant',
    advancedPath: 'Qualified Teacher',
    salaries: ['£20k–24k', '£24k–28k', '£30k–38k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'digital-ai-beginner': {
    entryRole: 'IT Support Trainee',
    nextRole: 'Junior Developer',
    advancedPath: 'Senior Developer',
    salaries: ['£22k–26k', '£28k–35k', '£40k–55k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'warehouse-logistics': {
    entryRole: 'Warehouse Operative',
    nextRole: 'Team Leader',
    advancedPath: 'Warehouse Supervisor',
    salaries: ['£22k–25k', '£26k–30k', '£30k–35k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'office-admin': {
    entryRole: 'Admin Assistant',
    nextRole: 'Office Administrator',
    advancedPath: 'Office Manager',
    salaries: ['£21k–24k', '£25k–28k', '£30k–36k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'driving-transport': {
    entryRole: 'Delivery Driver',
    nextRole: 'Experienced Driver',
    advancedPath: 'HGV Driver',
    salaries: ['£24k–28k', '£30k–35k', '£35k–45k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'construction-trades': {
    entryRole: 'Construction Operative',
    nextRole: 'Skilled Trade Worker',
    advancedPath: 'Site Supervisor',
    salaries: ['£22k–26k', '£28k–34k', '£35k–42k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  'hospitality-front': {
    entryRole: 'Front of House Staff',
    nextRole: 'Shift Supervisor',
    advancedPath: 'Restaurant Manager',
    salaries: ['£20k–23k', '£24k–28k', '£30k–36k'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  },
  electrician: {
    entryRole: 'Electrician Trainee',
    nextRole: 'Qualified Electrician',
    advancedPath: 'Senior Electrician',
    salaries: ['£24k–28k', '£32k–40k', '£45k+'],
    horizons: ['Now', '1–2 years', '3–5 years'],
  },
}

/** Experienced / qualified professional tech progression */
export const EXPERIENCED_TECH_PROGRESSION: RouteProgression = {
  entryRole: 'Junior Developer',
  nextRole: 'Developer',
  advancedPath: 'Senior Developer',
  salaries: ['£30k–38k', '£40k–50k', '£55k–70k'],
  horizons: ['Now', '6–18 months', '2–5 years'],
}

export function getRouteProgression(pathId: string | null): RouteProgression {
  if (pathId && PROGRESSION[pathId]) return PROGRESSION[pathId]!
  if (pathId) {
    const path = getCareerPathById(pathId)
    const salary = defaultSalaryForPath(pathId)
    return {
      entryRole: path?.title.replace(/\s*\(.*\)/, '').trim() ?? 'Entry-level role',
      nextRole: 'Experienced role',
      advancedPath: 'Advanced career path',
      salaries: [
        salary.starting,
        salary.experienced,
        salary.levels?.[2]?.range ?? '£35k+',
      ],
      horizons: ['Now', '6–24 months', '2–5 years'],
    }
  }
  return {
    entryRole: 'Entry-level role',
    nextRole: 'Experienced role',
    advancedPath: 'Long-term career path',
    salaries: ['£22k–26k', '£28k–32k', '£35k+'],
    horizons: ['Now', '6–24 months', '2–5 years'],
  }
}

const SENIOR_PATTERN = /\b(senior|supervisor|manager|director|nursing associate|qualified teacher|lead|head of)\b/i
const COMBINED_PATTERN = /\//

export function isUnrealisticEntryTitle(title: string): boolean {
  const t = title.trim()
  if (!t || t.length > 55) return true
  if (COMBINED_PATTERN.test(t)) return true
  if (SENIOR_PATTERN.test(t) && !/assistant|trainee|junior|operative|support worker/i.test(t)) return true
  return false
}

export function resolveFirstRealisticRole(
  candidates: (string | undefined | null)[],
  pathId: string | null
): string {
  const profile = getRouteProgression(pathId)
  for (const c of candidates) {
    if (c && !isUnrealisticEntryTitle(c)) return c.trim()
  }
  return profile.entryRole
}

export function isExperiencedProfessionalPlan(input: {
  pathId: string | null
  yearsOfExperience?: number | null
  planType: string
  domain?: string | null
}): boolean {
  if (input.planType === 'qualified_professional' || input.planType === 'promotion_seeker') return true
  if ((input.yearsOfExperience ?? 0) >= 3) return true
  if (input.domain === 'IT_digital' && (input.yearsOfExperience ?? 0) >= 2) return true
  return false
}

export function shouldIncludeTrainingSteps(input: {
  planType: string
  requirementsCount: number
  isExperienced: boolean
}): boolean {
  if (input.isExperienced && input.planType === 'qualified_professional') return false
  if (input.planType === 'qualified_professional' && input.requirementsCount === 0) return false
  if (input.planType === 'freelancer') return false
  return input.requirementsCount > 0 || input.planType === 'entry_with_licence' || input.planType === 'career_changer'
}
