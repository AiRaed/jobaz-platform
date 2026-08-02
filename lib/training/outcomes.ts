import type { TrainingUnlockOpportunity } from './types'

type UnlockRule = {
  id: string
  match: RegExp
  trainingName: string
  unlocksRole: string
  trainingType: TrainingUnlockOpportunity['trainingType']
  pathId?: string
}

const UNLOCK_RULES: UnlockRule[] = [
  {
    id: 'sia',
    match: /sia|door supervisor|security licence/i,
    trainingName: 'SIA Licence',
    unlocksRole: 'Security Officer Jobs',
    trainingType: 'licence',
    pathId: 'security-facilities',
  },
  {
    id: 'forklift',
    match: /forklift|reach truck|counterbalance/i,
    trainingName: 'Forklift Licence',
    unlocksRole: 'Warehouse Operator Jobs',
    trainingType: 'licence',
    pathId: 'warehouse-logistics',
  },
  {
    id: 'care-cert',
    match: /care certificate/i,
    trainingName: 'Care Certificate',
    unlocksRole: 'Care Assistant Jobs',
    trainingType: 'certification',
    pathId: 'care-support',
  },
  {
    id: 'moving-handling',
    match: /moving|handling/i,
    trainingName: 'Moving & Handling',
    unlocksRole: 'Care & Support Roles',
    trainingType: 'course',
    pathId: 'care-support',
  },
  {
    id: 'first-aid',
    match: /first aid|cpr/i,
    trainingName: 'First Aid',
    unlocksRole: 'Workplace Safety Roles',
    trainingType: 'course',
  },
  {
    id: 'cscs',
    match: /cscs/i,
    trainingName: 'CSCS Card',
    unlocksRole: 'Construction Site Jobs',
    trainingType: 'licence',
    pathId: 'construction-trades',
  },
  {
    id: 'ta-course',
    match: /teaching assistant|learning support|hlta/i,
    trainingName: 'Teaching Assistant Course',
    unlocksRole: 'TA Opportunities',
    trainingType: 'course',
    pathId: 'teaching-support',
  },
  {
    id: 'food-hygiene',
    match: /food hygiene|haccp/i,
    trainingName: 'Food Hygiene Certificate',
    unlocksRole: 'Hospitality & Catering Jobs',
    trainingType: 'certification',
    pathId: 'hospitality-front',
  },
  {
    id: 'hgv',
    match: /hgv|cpc|lorry/i,
    trainingName: 'HGV / Driver CPC',
    unlocksRole: 'HGV Driver Opportunities',
    trainingType: 'licence',
    pathId: 'driving-transport',
  },
  {
    id: 'dbs',
    match: /dbs|enhanced check/i,
    trainingName: 'DBS Check',
    unlocksRole: 'Regulated Care & Education Roles',
    trainingType: 'licence',
  },
]

export function unlockForCourseName(name: string): Pick<TrainingUnlockOpportunity, 'unlocksRole' | 'trainingType'> | null {
  for (const rule of UNLOCK_RULES) {
    if (rule.match.test(name)) {
      return { unlocksRole: rule.unlocksRole, trainingType: rule.trainingType }
    }
  }
  return null
}

export function buildUnlockOpportunities(
  courseNames: string[],
  completedNames: string[],
  pathId: string | null
): TrainingUnlockOpportunity[] {
  const seen = new Set<string>()
  const results: TrainingUnlockOpportunity[] = []

  const candidates = [...UNLOCK_RULES]
  if (pathId) {
    const pathRules = UNLOCK_RULES.filter((r) => r.pathId === pathId)
    const other = UNLOCK_RULES.filter((r) => r.pathId !== pathId)
    candidates.splice(0, candidates.length, ...pathRules, ...other)
  }

  for (const rule of candidates) {
    if (seen.has(rule.id)) continue
    const relevant =
      courseNames.some((n) => rule.match.test(n)) ||
      (pathId === rule.pathId && rule.pathId != null)
    if (!relevant) continue
    seen.add(rule.id)
    const completed = completedNames.some((n) => rule.match.test(n))
    results.push({
      id: rule.id,
      trainingName: rule.trainingName,
      trainingType: rule.trainingType,
      unlocksRole: rule.unlocksRole,
      pathId: rule.pathId,
      completed,
    })
  }

  return results.slice(0, 6)
}

export function impactForCourse(name: string): string {
  const unlock = unlockForCourseName(name)
  if (unlock) {
    if (/required|legal/i.test(unlock.unlocksRole)) return unlock.unlocksRole
    return `Unlocks: ${unlock.unlocksRole}`
  }
  if (/licence|license|sia|dbs|cscs/i.test(name)) return 'Licence required before you can work in this role'
  if (/certificate|certification|nvq|level \d/i.test(name)) return 'Certification improves employability on your route'
  return 'Builds skills employers expect for your career goals'
}
