/**
 * Progression refinement — role-first Build Next, connected ladders, per-role confidence.
 */

import { buildPathwayProfile, type PathwayProfile } from './pathwayRecommendations'
import { activeFieldFamilies, filterRolesForPathConsistency } from './pathConsistency'
import { getSpecialisationRecommendations } from './fieldSpecialisation'
import {
  isTrainingOrLicence,
  normalizeProgressionTitle,
  titlesOverlapProgression,
  isAdvancedCareerDestination,
} from './careerProgressionValidation'
import { ensureDualPathLongTermBalance } from './dualPathBalance'
import { getCareerDirectionPriority } from './educationExperienceSplit'
import { getCertOpenness, getWorkSpeed } from './speedDevelopmentMode'
import type {
  CareerBrainRecommendation,
  CareerBrainState,
  CareerPathRole,
  CareerProfile,
  PathConfidenceScore,
} from './types'

type FieldBlueprint = {
  buildNextRoles: string[]
  buildNextTraining: string[]
  longTermRoles: string[]
}

const BLUEPRINTS: Record<string, FieldBlueprint> = {
  marketing: {
    buildNextRoles: ['Content Producer', 'Junior Marketing Executive', 'Digital Content Coordinator'],
    buildNextTraining: ['Motion Graphics Fundamentals', 'Video Editing Course', 'Content Production Certificate'],
    longTermRoles: ['Motion Designer', 'Marketing Manager', 'Content Strategist'],
  },
  media_communications: {
    buildNextRoles: ['Content Producer', 'Junior Marketing Executive', 'Digital Content Coordinator'],
    buildNextTraining: ['Motion Graphics Fundamentals', 'Video Editing Course', 'Content Production Certificate'],
    longTermRoles: ['Motion Designer', 'Marketing Manager', 'Content Strategist'],
  },
  arts_design: {
    buildNextRoles: ['Content Creator', 'Junior Motion Designer', 'Production Assistant (creative)'],
    buildNextTraining: ['Video editing short course', 'Portfolio development'],
    longTermRoles: ['Motion Designer', 'Senior Motion Designer', 'Creative Lead'],
  },
  law: {
    buildNextRoles: ['Junior Legal Assistant', 'Legal Administrator', 'Casework Officer'],
    buildNextTraining: ['Legal Administration Course', 'Legal Research Course'],
    longTermRoles: ['Legal Assistant', 'Paralegal', 'Legal Operations Coordinator'],
  },
  education: {
    buildNextRoles: ['Learning Support Assistant', 'Education Administrator', 'Cover Supervisor'],
    buildNextTraining: ['Safeguarding training', 'Teaching assistant qualification'],
    longTermRoles: ['Education Coordinator', 'Learning Mentor', 'Senior Teaching Assistant'],
  },
  it_computing: {
    buildNextRoles: ['Junior Systems Administrator', 'IT Support Specialist', 'Helpdesk Coordinator'],
    buildNextTraining: ['CompTIA A+', 'Google IT Support Certificate'],
    longTermRoles: ['Systems Engineer', 'IT Support Specialist', 'Systems Analyst'],
  },
  science: {
    buildNextRoles: ['Laboratory Technician', 'Quality Control Coordinator', 'Research Support Officer'],
    buildNextTraining: ['Laboratory Skills Certificate', 'Quality Control Basics'],
    longTermRoles: ['Laboratory Supervisor', 'Research Technician', 'Quality Control Specialist'],
  },
  healthcare: {
    buildNextRoles: ['Senior Healthcare Assistant', 'Healthcare Support Coordinator', 'Care Team Leader'],
    buildNextTraining: ['Care Certificate', 'Moving & Handling training'],
    longTermRoles: ['Senior Care Worker', 'Healthcare Coordinator', 'Clinical Support Career Pathway'],
  },
  business_management: {
    buildNextRoles: ['Marketing Coordinator', 'Operations Assistant', 'HR Administrator'],
    buildNextTraining: ['Microsoft Office Certification', 'Business Administration Certificate'],
    longTermRoles: ['Operations Coordinator', 'Office Manager', 'Project Coordinator'],
  },
  engineering: {
    buildNextRoles: ['Engineering Technician', 'CAD Technician', 'Quality Control Coordinator'],
    buildNextTraining: ['CAD training', 'HNC Engineering (part-time)', 'Health & Safety on site'],
    longTermRoles: ['Engineering Project Coordinator', 'Project Engineer', 'Engineering Manager'],
  },
  retail: {
    buildNextRoles: ['Retail Supervisor', 'Team Leader (retail)', 'Customer Experience Coordinator'],
    buildNextTraining: ['Team Leader Training', 'Customer Service Certification'],
    longTermRoles: ['Store Manager', 'Area Manager', 'Retail Operations Manager'],
  },
  warehouse: {
    buildNextRoles: ['Warehouse Team Leader', 'Shift Coordinator (logistics)', 'Warehouse Administrator'],
    buildNextTraining: ['Forklift Licence', 'Team leader (warehouse)'],
    longTermRoles: ['Warehouse Supervisor', 'Logistics Coordinator', 'Operations Supervisor'],
  },
  driving: {
    buildNextRoles: ['Delivery Coordinator', 'Transport Administrator', 'Fleet Administrator'],
    buildNextTraining: ['CPC Qualification', 'HGV Training'],
    longTermRoles: ['Transport Planner', 'Fleet Supervisor', 'Logistics Coordinator'],
  },
  customer_service: {
    buildNextRoles: ['Customer Service Team Leader', 'Service Coordinator', 'Sales Coordinator'],
    buildNextTraining: ['Customer Service Certification', 'CRM Systems Basics'],
    longTermRoles: ['Customer Service Manager', 'Operations Coordinator', 'Team Supervisor'],
  },
  office_admin: {
    buildNextRoles: ['Office Administrator', 'Operations Support Coordinator', 'Senior Admin Assistant'],
    buildNextTraining: ['Microsoft Office Certification', 'Business Administration Certificate'],
    longTermRoles: ['Office Manager', 'Operations Coordinator', 'Project Coordinator'],
  },
  hospitality: {
    buildNextRoles: ['Shift Supervisor', 'Front of House Coordinator', 'Hospitality Team Leader'],
    buildNextTraining: ['Food Hygiene Certificate', 'Hospitality Supervisor Course'],
    longTermRoles: ['Venue Manager', 'Operations Coordinator', 'Hospitality Manager'],
  },
  trades: {
    buildNextRoles: ['Trainee Tradesperson', 'Site Operative (skilled)', 'Maintenance Technician'],
    buildNextTraining: ['CSCS Card', 'Health & Safety on site'],
    longTermRoles: ['Skilled Tradesperson', 'Site Supervisor', 'Construction Supervisor'],
  },
  fast_employment: {
    buildNextRoles: ['Customer Service Team Leader', 'Office Administrator', 'Operations Support Coordinator'],
    buildNextTraining: ['Customer Service Certification', 'Microsoft Office Certification'],
    longTermRoles: ['Team Leader', 'Office Manager', 'Operations Coordinator'],
  },
  general: {
    buildNextRoles: ['Team Leader', 'Operations Support Coordinator', 'Senior Administrator'],
    buildNextTraining: ['Customer Service Certification', 'Team Leader Training'],
    longTermRoles: ['Operations Coordinator', 'Team Supervisor', 'Office Manager'],
  },
}

function fieldAlignmentIsNo(state?: CareerBrainState): boolean {
  return String(state?.answers?.cb_field_alignment ?? '') === 'no'
}

function experienceBlueprintFromText(exp: string): FieldBlueprint {
  if (/hospitality|bar|hotel|kitchen|restaurant|waiter|barista/.test(exp)) return BLUEPRINTS.hospitality
  if (/retail|shop|store/.test(exp)) return BLUEPRINTS.retail
  if (/warehouse|logistics|picker|packer/.test(exp)) return BLUEPRINTS.warehouse
  if (/driving|driver|delivery|courier/.test(exp)) return BLUEPRINTS.driving
  if (/customer service|call centre/.test(exp)) return BLUEPRINTS.customer_service
  if (/marketing|social media|communications/.test(exp)) return BLUEPRINTS.marketing
  if (/admin|office|reception/.test(exp)) return BLUEPRINTS.office_admin
  if (/healthcare|care|nursing/.test(exp)) return BLUEPRINTS.healthcare
  if (/it\b|software|helpdesk/.test(exp)) return BLUEPRINTS.it_computing
  return BLUEPRINTS.customer_service
}

function resolveBlendedBlueprint(study: string, exp: string): FieldBlueprint {
  const edu =
    study === 'law'
      ? BLUEPRINTS.law
      : study === 'engineering'
        ? BLUEPRINTS.engineering
        : study && BLUEPRINTS[study]
          ? BLUEPRINTS[study]
          : BLUEPRINTS.general
  const expBp = experienceBlueprintFromText(exp)
  const buildNextRoles = [
    expBp.buildNextRoles[0],
    edu.buildNextRoles[0],
    edu.buildNextRoles[1] ?? expBp.buildNextRoles[1],
  ].filter(Boolean) as string[]

  return {
    buildNextRoles: buildNextRoles.slice(0, 3),
    buildNextTraining: [...edu.buildNextTraining.slice(0, 2), ...expBp.buildNextTraining.slice(0, 1)].slice(
      0,
      3
    ),
    longTermRoles: [edu.longTermRoles[0], expBp.longTermRoles[0]].filter(Boolean).slice(0, 2),
  }
}

function resolveBlueprint(profile: CareerProfile, state?: CareerBrainState): FieldBlueprint {
  const answers = state?.answers ?? {}
  const study = String(
    answers.cb_first_job_study_field ?? answers.cb_student_study_field ?? ''
  ).toLowerCase()
  const exp = String(
    profile.workExperienceField ??
      answers.cb_work_experience_field ??
      answers.cb_basic_experience_text ??
      ''
  ).toLowerCase()
  const priority = String(answers.cb_career_direction_priority ?? '')
  const spec = String(answers.cb_field_specialisation ?? '').toLowerCase()
  const studentExpTypes = Array.isArray(answers.cb_student_experience_type)
    ? answers.cb_student_experience_type.join(' ')
    : String(answers.cb_student_experience_type ?? '')

  if (
    /it_technology|it technology|software/.test(studentExpTypes) &&
    answers.cb_student_continue_experience === 'yes_continue'
  ) {
    return BLUEPRINTS.it_computing
  }

  const specPack = getSpecialisationRecommendations(state, profile)
  if (specPack?.length) {
    const buildNextRoles = specPack
      .filter((r) => r.track === 'build_next' && !isTrainingOrLicence(r.title))
      .map((r) => r.title)
    const buildNextTraining = specPack
      .filter((r) => r.track === 'build_next' && isTrainingOrLicence(r.title))
      .map((r) => r.title)
    const longTermRoles = specPack.filter((r) => r.track === 'long_term').map((r) => r.title)
    if (buildNextRoles.length || longTermRoles.length) {
      return {
        buildNextRoles: buildNextRoles.length
          ? buildNextRoles
          : BLUEPRINTS.it_computing.buildNextRoles,
        buildNextTraining: buildNextTraining.length
          ? buildNextTraining
          : BLUEPRINTS.it_computing.buildNextTraining,
        longTermRoles: longTermRoles.length ? longTermRoles : BLUEPRINTS.it_computing.longTermRoles,
      }
    }
  }

  if (study === 'science' || spec.includes('science')) {
    if (!fieldAlignmentIsNo(state ?? { answers: {} })) return BLUEPRINTS.science
  }
  if (study === 'law' && !fieldAlignmentIsNo(state ?? { answers: {} })) return BLUEPRINTS.law
  if (
    (spec.includes('software') || study === 'it_computing') &&
    !fieldAlignmentIsNo(state ?? { answers: {} })
  ) {
    return BLUEPRINTS.it_computing
  }
  if (
    study === 'engineering' &&
    spec.includes('software') &&
    !fieldAlignmentIsNo(state ?? { answers: {} })
  ) {
    return BLUEPRINTS.it_computing
  }

  if (study === 'education' && /marketing|communications|media/.test(exp)) {
    return {
      buildNextRoles: [
        'Marketing Admin Assistant',
        'Teaching Assistant',
        'Learning Support Assistant',
      ],
      buildNextTraining: ['Education Administration short course', 'Digital Marketing Certificate'],
      longTermRoles: ['Education Coordinator', 'Marketing Coordinator', 'Learning & Development Specialist'],
    }
  }

  if (priority === 'fast_employment') return BLUEPRINTS.fast_employment

  if (
    (priority === 'both' || priority === 'not_sure') &&
    !fieldAlignmentIsNo(state ?? { answers: {} }) &&
    study &&
    exp
  ) {
    return resolveBlendedBlueprint(study, exp)
  }

  if (fieldAlignmentIsNo(state ?? { answers: {} })) {
    if (/hospitality|bar|hotel|kitchen|waiter|barista/.test(exp)) return BLUEPRINTS.hospitality
    if (/retail|customer service|shop/.test(exp)) return BLUEPRINTS.retail
    if (/warehouse|logistics|driving/.test(exp)) return BLUEPRINTS.warehouse
    if (getWorkSpeed(state) === 'urgent' || answers.cb_entry_work_preference === 'quick_income') {
      return BLUEPRINTS.fast_employment
    }
    return BLUEPRINTS.customer_service
  }

  if (priority === 'experience_field' || priority === 'fast_employment') {
    if (/marketing/.test(exp)) return BLUEPRINTS.marketing
    if (/retail|shop|store/.test(exp)) return BLUEPRINTS.retail
    if (/warehouse|logistics|picker|packer/.test(exp)) return BLUEPRINTS.warehouse
    if (/driving|driver|delivery|courier/.test(exp)) return BLUEPRINTS.driving
    if (/customer service|call centre/.test(exp)) return BLUEPRINTS.customer_service
    if (/admin|office|reception/.test(exp)) return BLUEPRINTS.office_admin
    if (/hospitality|kitchen|bar|hotel/.test(exp)) return BLUEPRINTS.hospitality
    if (/healthcare|care|nursing/.test(exp)) return BLUEPRINTS.healthcare
    if (/it\b|software|helpdesk/.test(exp)) return BLUEPRINTS.it_computing
    if (/trades|construction|electric/.test(exp)) return BLUEPRINTS.trades
    if (/animation|design|creative|video|motion/.test(exp)) return BLUEPRINTS.arts_design
  }

  if (priority === 'education_field') {
    if (study && BLUEPRINTS[study]) return BLUEPRINTS[study]
  }

  if (study === 'law' && !fieldAlignmentIsNo(state ?? { answers: {} })) return BLUEPRINTS.law
  if (study && BLUEPRINTS[study] && !fieldAlignmentIsNo(state ?? { answers: {} })) return BLUEPRINTS[study]
  if (/marketing/.test(exp)) return BLUEPRINTS.marketing
  if (/retail/.test(exp)) return BLUEPRINTS.retail
  if (/warehouse/.test(exp)) return BLUEPRINTS.warehouse

  const workStyle = String(
    answers.cb_student_work_style ?? answers.cb_entry_work_preference ?? ''
  ).toLowerCase()
  if (
    answers.cb_physical_ability === 'yes' ||
    /physical|warehouse|logistics|practical|driving/.test(workStyle)
  ) {
    return BLUEPRINTS.warehouse
  }

  return BLUEPRINTS.general
}

function toRec(
  title: string,
  track: CareerBrainRecommendation['track'],
  why: string,
  profile: CareerProfile
): CareerBrainRecommendation {
  return {
    title,
    why,
    track,
    field_tag: profile.domain,
    domain: profile.domain,
    source: 'fallback',
    stepType: isTrainingOrLicence(title) ? 'training' : 'career_step',
  }
}

function dedupeRecs(recs: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const out: CareerBrainRecommendation[] = []
  for (const rec of recs) {
    if (out.some((o) => titlesOverlapProgression(o.title, rec.title) && o.track === rec.track)) continue
    out.push(rec)
  }
  return out
}

/** Build Next = intermediate job roles only; training nested on each role card. */
export function normalizeBuildNextRoles(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  const blueprint = resolveBlueprint(profile, state)
  const certOpen = getCertOpenness(state) === 'yes'

  const trainingTitles: string[] = []
  const roleRecs: CareerBrainRecommendation[] = []

  for (const item of buildNext) {
    if (isTrainingOrLicence(item.title) || item.stepType === 'training') {
      if (!trainingTitles.some((t) => titlesOverlapProgression(t, item.title))) {
        trainingTitles.push(item.title)
      }
      continue
    }
    roleRecs.push({ ...item, stepType: 'career_step' })
  }

  if (certOpen) {
    for (const title of blueprint.buildNextTraining) {
      if (trainingTitles.length >= 3) break
      if (trainingTitles.some((t) => titlesOverlapProgression(t, title))) continue
      trainingTitles.push(title)
    }
  }

  const roleTitles: string[] = []
  for (const title of [...blueprint.buildNextRoles, ...roleRecs.map((r) => r.title)]) {
    if (isTrainingOrLicence(title)) continue
    if (workNow.some((w) => titlesOverlapProgression(w.title, title))) continue
    if (longTerm.some((l) => titlesOverlapProgression(l.title, title))) continue
    if (roleTitles.some((t) => titlesOverlapProgression(t, title))) continue
    roleTitles.push(title)
    if (roleTitles.length >= 3) break
  }

  const training = trainingTitles.slice(0, 3)
  return roleTitles.slice(0, 3).map((title) => {
    const existing = roleRecs.find((r) => titlesOverlapProgression(r.title, title))
    return {
      ...(existing ??
        toRec(
          title,
          'build_next',
          'Build Next — realistic role you can target in the next 6–24 months',
          profile
        )),
      stepType: 'career_step' as const,
      recommendedTraining: certOpen && training.length ? training : undefined,
    }
  })
}

/** Role-first Build Next with training nested on roles; connected long-term ladder. */
export function refineProgressionLadder(
  workNow: CareerBrainRecommendation[],
  buildNext: CareerBrainRecommendation[],
  longTerm: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): {
  workNow: CareerBrainRecommendation[]
  buildNext: CareerBrainRecommendation[]
  longTerm: CareerBrainRecommendation[]
} {
  const blueprint = resolveBlueprint(profile, state)
  const priority = getCareerDirectionPriority(state ?? { answers: {} })
  const isBoth = priority === 'both' || priority === 'not_sure'

  const longTermTitles: string[] = []
  const pushLongTitle = (title: string, allowWorkNowOverlap = false) => {
    if (
      !allowWorkNowOverlap &&
      workNow.some((w) => titlesOverlapProgression(w.title, title))
    ) {
      return
    }
    if (
      allowWorkNowOverlap &&
      workNow.some((w) => titlesOverlapProgression(w.title, title)) &&
      !isAdvancedCareerDestination(title)
    ) {
      return
    }
    if (longTermTitles.some((t) => titlesOverlapProgression(t, title))) return
    longTermTitles.push(title)
  }

  if (isBoth) {
    for (const rec of longTerm) {
      pushLongTitle(rec.title, true)
      if (longTermTitles.length >= 2) break
    }
  }

  if (longTermTitles.length < 2) {
    for (const title of [...blueprint.longTermRoles, ...longTerm.map((r) => r.title)]) {
      pushLongTitle(title, isBoth)
      if (longTermTitles.length >= 2) break
    }
  }

  const pathwayProfile = buildPathwayProfile(state?.answers ?? {}) as PathwayProfile
  const filteredLong = filterRolesForPathConsistency(
    longTermTitles.map((title) => ({
      title,
      track: 'long_term' as const,
      why: '',
    })),
    pathwayProfile
  )

  const nextLongTerm = dedupeRecs(
    filteredLong.map((r) => {
      const existing = longTerm.find((l) => titlesOverlapProgression(l.title, r.title))
      if (existing) {
        return {
          ...existing,
          why:
            existing.why ||
            'Long-Term Path — career destination after experience and progression (3–5+ years)',
        }
      }
      return toRec(
        r.title,
        'long_term',
        'Long-Term Path — career destination after experience and progression (3–5+ years)',
        profile
      )
    })
  )

  let resolvedLongTerm = nextLongTerm.length ? nextLongTerm : dedupeRecs(longTerm).slice(0, 2)
  if (isBoth && state) {
    resolvedLongTerm = ensureDualPathLongTermBalance(resolvedLongTerm, profile, state)
  }

  const nextBuildNext = normalizeBuildNextRoles(
    dedupeRecs(workNow),
    buildNext,
    resolvedLongTerm,
    profile,
    state
  )

  const keepWorkNow =
    isBoth &&
    workNow.some((r) => r.pathOrigin === 'education' || r.pathOrigin === 'experience')

  return {
    workNow: keepWorkNow ? dedupeRecs(workNow).slice(0, 3) : dedupeRecs(workNow),
    buildNext: nextBuildNext,
    longTerm: resolvedLongTerm,
  }
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeProgressionTitle(a).split(' ').filter((t) => t.length > 2))
  const tb = new Set(normalizeProgressionTitle(b).split(' ').filter((t) => t.length > 2))
  let hits = 0
  for (const t of ta) if (tb.has(t)) hits++
  return hits
}

function scoreRoleConfidence(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState
): { score: number; reason: string } {
  const pp = buildPathwayProfile(state?.answers ?? {})
  const study = (pp.studyFieldSlug ?? pp.studyFieldText ?? '').toLowerCase()
  const exp = (pp.experienceFieldText ?? profile.workExperienceField ?? '').toLowerCase()
  const priority = pp.careerDirectionPriority
  const t = title.toLowerCase()
  let score = track === 'work_now' ? 78 : track === 'build_next' ? 72 : 68
  const reasons: string[] = []

  if (priority === 'experience_field' && exp) {
    if (tokenOverlap(t, exp) > 0 || /admin|assistant|coordinator|advisor|support/.test(t)) {
      score += 12
      reasons.push('Experience match')
    }
    if (study && tokenOverlap(t, study) > 0 && !/admin|assistant|coordinator/.test(t)) score -= 8
  }

  if (priority === 'education_field' && study) {
    if (tokenOverlap(t, study) > 0 || (study.includes('law') && /legal|casework|paralegal/.test(t))) {
      score += 12
      reasons.push('Education match')
    }
  }

  if (priority === 'both') {
    const studyHit = study && tokenOverlap(t, study) > 0
    const expHit = exp && tokenOverlap(t, exp) > 0
    if (studyHit || expHit) {
      score += 10
      reasons.push('Blended fit')
    }
    if (/admin|assistant|coordinator|support/.test(t)) score += 4
  }

  if (priority === 'fast_employment' && /customer service|retail|reception|office assistant|warehouse|advisor|operative/.test(t)) {
    score += 10
    reasons.push('Fast hiring fit')
  }

  const years = pp.experienceYearsBand
  if (years === '10_plus' || years === '5_10') {
    if (/supervisor|coordinator|team leader|manager|executive/.test(t) && track !== 'work_now') score += 6
  } else if (years === 'under_1' || years === '1_3') {
    if (/assistant|operative|support|entry/.test(t) && track === 'work_now') score += 5
    if (/manager|director|executive/.test(t) && track === 'work_now') score -= 10
  }

  if (pp.experienceCountry === 'mostly_uk') score += 3
  if (String(state?.answers?.cb_cert_openness ?? '') === 'yes' && isTrainingOrLicence(title)) score += 4

  const allowed = activeFieldFamilies(pp)
  const filtered = filterRolesForPathConsistency(
    [{ title, track: track === 'backup_income' ? 'long_term' : track, why: '' }],
    pp
  )
  if (!filtered.length && !allowed.has('admin')) score = Math.min(score, 35)

  score = Math.max(5, Math.min(98, Math.round(score)))
  return { score, reason: reasons[0] ?? 'Profile fit' }
}

export function computeRecommendationConfidence(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): PathConfidenceScore[] {
  const scored = recs
    .filter((r) => r.track !== 'backup_income')
    .map((r, index) => {
      const { score, reason } = scoreRoleConfidence(r.title, r.track, profile, state)
      return {
        title: r.title,
        track: r.track,
        score: score - (r.track === 'work_now' ? index : 0),
        reason,
      }
    })

  const byTrack = (track: PathConfidenceScore['track']) =>
    scored
      .filter((s) => s.track === track)
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, score: Math.max(5, s.score - i) }))

  return [...byTrack('work_now'), ...byTrack('build_next'), ...byTrack('long_term')]
}

export function buildCareerLadderFromPaths(
  workNow: CareerPathRole[],
  buildNext: CareerPathRole[],
  longTerm: CareerPathRole[]
): string {
  const start = workNow[0]?.title ?? 'entry role'
  const step = buildNext.find((r) => r.stepType !== 'training')?.title ?? buildNext[0]?.title
  const dest = longTerm[0]?.title ?? 'long-term goal'
  return `${start} → ${step ?? 'next step'} → ${dest}`
}
