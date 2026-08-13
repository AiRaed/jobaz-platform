/**
 * Reusable professional levels for Work in My Profession (not education stages).
 */

import type { ProfessionalLevel } from './types'

export const PROFESSIONAL_LEVELS: ProfessionalLevel[] = [
  {
    key: 'helper_assistant',
    label: 'Helper / Assistant',
    sort_order: 10,
    description: 'Supporting roles with limited responsibility — good entry points.',
  },
  {
    key: 'beginner',
    label: 'Beginner',
    sort_order: 20,
    description: 'Early practical experience; still building core trade skills.',
  },
  {
    key: 'experienced_worker',
    label: 'Experienced Worker',
    sort_order: 30,
    description: 'Confident day-to-day delivery with relevant UK workplace experience.',
  },
  {
    key: 'supervisor',
    label: 'Supervisor',
    sort_order: 40,
    description: 'Leads a small team or shift; accountable for quality and handover.',
  },
  {
    key: 'specialist_technician',
    label: 'Specialist / Technician',
    sort_order: 50,
    description: 'Specialist technical skill or certified trade competence.',
  },
  {
    key: 'self_employed_owner',
    label: 'Self-employed / Business Owner',
    sort_order: 60,
    description: 'Runs own jobs, clients, or small local service business.',
  },
]

export function getProfessionalLevel(key: ProfessionalLevel['key']): ProfessionalLevel | null {
  return PROFESSIONAL_LEVELS.find((l) => l.key === key) ?? null
}
