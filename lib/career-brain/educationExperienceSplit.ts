/**
 * Education vs experience split — separate pathways when fields diverge; no merged progression.
 */

import { inferBridgeField } from './bridgeRoleIntelligence'
import { getUserGoal } from './userGoal'
import { buildFallbackRecommendations } from './fallbackRecommendations'
import { resolveEffectiveStudyField } from './fieldSpecialisation'
import { applyBridgeModeToProfile } from './bridgeRoleIntelligence'
import { assembleCareerRoadmap } from './careerRoadmap'
import { applyGlobalRecommendationRules } from './globalPreferenceEngine'
import { applyUniversalCareerPathRules } from './universalCareerPath'
import type {
  CareerBrainRecommendation,
  CareerBrainState,
  CareerPathRole,
  CareerProfile,
  DualCareerPathsOutput,
  PathOrigin,
} from './types'
import type { CareerBrainQuestion } from './types'

export type CareerDirectionPriority =
  | 'education_field'
  | 'experience_field'
  | 'both'
  | 'not_sure'
  | 'fast_employment'

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>
): CareerBrainQuestion {
  return { id, text, type: 'single', options, allow_free_text: false }
}

export const CAREER_DIRECTION_PRIORITY_QUESTION = q(
  'cb_career_direction_priority',
  'Which path would you like to prioritise?',
  [
    { value: 'education_field', label: 'My education field' },
    { value: 'experience_field', label: 'My work experience' },
    { value: 'both', label: 'Both are important' },
    { value: 'not_sure', label: 'Not sure' },
  ]
)

const PRIORITY_LABELS: Record<CareerDirectionPriority, string> = {
  education_field: 'your education field',
  experience_field: 'your work experience',
  both: 'both your education and experience equally',
  not_sure: 'a balanced blend while you decide',
  fast_employment: 'the fastest realistic route into employment',
}

function originLabel(origin: PathOrigin): string {
  if (origin === 'education') return 'education'
  if (origin === 'experience') return 'experience'
  return 'blended'
}

function tagRecOrigin(
  rec: CareerBrainRecommendation,
  origin: PathOrigin
): CareerBrainRecommendation {
  const tag = originLabel(origin)
  const whyHasTag = new RegExp(`\\(${tag}\\)`, 'i').test(rec.why)
  return {
    ...rec,
    pathOrigin: origin,
    why: whyHasTag ? rec.why : `${rec.why} (${tag})`,
  }
}

function dedupeByTitle(recs: CareerBrainRecommendation[]): CareerBrainRecommendation[] {
  const out: CareerBrainRecommendation[] = []
  for (const rec of recs) {
    const key = rec.title.toLowerCase()
    if (out.some((r) => r.title.toLowerCase() === key && r.track === rec.track)) continue
    out.push(rec)
  }
  return out
}

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function tokenSet(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  )
}

function fieldsAppearRelated(a: string, b: string): boolean {
  const ta = tokenSet(a)
  const tb = tokenSet(b)
  if (!ta.size || !tb.size) return false
  const bridgeA = inferBridgeField(a, null)
  const bridgeB = inferBridgeField(b, null)
  if (bridgeA !== 'general' && bridgeA === bridgeB) return true
  for (const t of ta) {
    if (tb.has(t)) return true
  }
  return false
}

export function getStudyFieldText(state: CareerBrainState, profile?: CareerProfile): string {
  const a = answers(state)
  const slug = String(a.cb_first_job_study_field ?? '').trim()
  const resolved = resolveEffectiveStudyField(state, profile?.studyField ?? '')
  if (resolved) return resolved
  return String(
    a.cb_graduate_study_field ??
      a.cb_student_study_field ??
      a.cb_study_field ??
      profile?.studyField ??
      ''
  ).trim()
}

export function getExperienceFieldText(state: CareerBrainState, profile?: CareerProfile): string {
  return String(
    answers(state).cb_work_experience_field ??
      answers(state).cb_basic_experience_text ??
      answers(state).cb_professional_field ??
      answers(state).cb_grow_field ??
      profile?.workExperienceField ??
      ''
  ).trim()
}

/** True when education and experience point to meaningfully different career families. */
export function hasEducationExperienceMismatch(
  state: CareerBrainState,
  profile?: CareerProfile
): boolean {
  if (getUserGoal(state) === 'first_job') return false

  if (getUserGoal(state) === 'unemployed') {
    const { wantsBothEducationAndExperience } = require('./unemployedPath') as typeof import('./unemployedPath')
    return wantsBothEducationAndExperience(state)
  }

  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  if (!study || !exp) return false
  if (fieldsAppearRelated(study, exp)) return false

  const relation = String(answers(state).cb_experience_field_relation ?? '')
  if (relation.includes('study_related') && !relation.includes('both_fields')) return false
  if (relation.includes('different_field') || relation.includes('both_fields')) return true

  return !fieldsAppearRelated(study, exp)
}

export function getCareerDirectionPriority(state: CareerBrainState): CareerDirectionPriority | null {
  const v = String(answers(state).cb_career_direction_priority ?? '')
  if (
    v === 'education_field' ||
    v === 'experience_field' ||
    v === 'both' ||
    v === 'not_sure' ||
    v === 'fast_employment'
  ) {
    return v
  }
  return null
}

export function wantsMergedEducationExperiencePath(state: CareerBrainState): boolean {
  const p = getCareerDirectionPriority(state)
  return p === 'both' || p === 'not_sure'
}

export function wantsDualEducationExperiencePaths(state: CareerBrainState): boolean {
  return getCareerDirectionPriority(state) === 'not_sure'
}

export function needsCareerDirectionPriorityQuestion(
  state: CareerBrainState,
  profile?: CareerProfile
): boolean {
  const { needsUnemployedPathPriorityQuestion } = require('./unemployedPath') as typeof import('./unemployedPath')
  if (needsUnemployedPathPriorityQuestion(state)) {
    return !hasAnswer(state, 'cb_career_direction_priority')
  }
  if (!hasEducationExperienceMismatch(state, profile)) return false
  if (hasAnswer(state, 'cb_career_direction_priority')) return false
  return true
}

export function pickCareerDirectionPriorityQuestion(
  state: CareerBrainState,
  profile?: CareerProfile
): { question: CareerBrainQuestion | null; reason: string } {
  const {
    needsUnemployedPathPriorityQuestion,
    pickUnemployedPathPriorityQuestion,
  } = require('./unemployedPath') as typeof import('./unemployedPath')
  if (needsUnemployedPathPriorityQuestion(state)) {
    return pickUnemployedPathPriorityQuestion(state)
  }
  if (!needsCareerDirectionPriorityQuestion(state, profile)) {
    return { question: null, reason: 'No education/experience split needed' }
  }
  return {
    question: CAREER_DIRECTION_PRIORITY_QUESTION,
    reason: 'Education and experience fields differ — choose career direction',
  }
}

export function profileForPath(
  base: CareerProfile,
  state: CareerBrainState,
  focus: 'education' | 'experience'
): CareerProfile {
  const study = getStudyFieldText(state, base)
  const exp = getExperienceFieldText(state, base)
  const label = focus === 'education' ? study : exp
  const next: CareerProfile = {
    ...base,
    studyField: focus === 'education' ? study || base.studyField : base.studyField,
    workExperienceField: focus === 'experience' ? exp || base.workExperienceField : null,
    targetField: label || base.targetField,
    wantsSameField: true,
    wantsCareerChange: false,
    constraints: [
      ...new Set([
        ...base.constraints.filter(
          (c) =>
            ![
              'dual-path-mode',
              'hybrid-path-mode',
              'flexible-employment-mode',
              'deprioritise-study-alignment',
              'any-job-ok',
            ].includes(c)
        ),
        'career-track-locked',
        'field-first-education',
        'bridge-role-mode',
        focus === 'education' ? 'path-focus-education' : 'path-focus-experience',
      ]),
    ],
  }
  return applyBridgeModeToProfile(next, state)
}

function toPathRoles(recs: CareerBrainRecommendation[]): {
  workNow: CareerPathRole[]
  buildNext: CareerPathRole[]
  longTerm: CareerPathRole[]
} {
  const map = (r: CareerBrainRecommendation): CareerPathRole => ({
    title: r.title,
    why: r.why,
    domain: r.domain,
    source: r.source,
  })
  return {
    workNow: recs.filter((r) => r.track === 'work_now').map(map),
    buildNext: recs.filter((r) => r.track === 'build_next').map(map),
    longTerm: recs.filter((r) => r.track === 'long_term').map(map),
  }
}

export function buildMergedEducationExperienceRecommendations(
  profile: CareerProfile,
  state: CareerBrainState
): CareerBrainRecommendation[] | null {
  const priority = getCareerDirectionPriority(state)
  if (priority !== 'both' && priority !== 'not_sure') return null

  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)
  if (!study.trim() || !exp.trim()) return null

  const eduProfile = profileForPath(profile, state, 'education')
  const expProfile = profileForPath(profile, state, 'experience')
  const eduRecs = buildFallbackRecommendations(eduProfile, state).recommendations
  const expRecs = buildFallbackRecommendations(expProfile, state).recommendations

  const blend = priority === 'not_sure'
  const workEdu = eduRecs.filter((r) => r.track === 'work_now').slice(0, blend ? 1 : 2)
  const workExp = expRecs.filter((r) => r.track === 'work_now').slice(0, blend ? 2 : 2)
  const buildEdu = eduRecs.filter((r) => r.track === 'build_next').slice(0, 2)
  const buildExp = expRecs.filter((r) => r.track === 'build_next').slice(0, blend ? 1 : 2)
  const longEdu = eduRecs.filter((r) => r.track === 'long_term').slice(0, 2)
  const longExp = expRecs.filter((r) => r.track === 'long_term').slice(0, 1)

  const merged = dedupeByTitle([
    ...workEdu.map((r) => tagRecOrigin(r, 'education')),
    ...workExp.map((r) => tagRecOrigin(r, 'experience')),
    ...buildEdu.map((r) => tagRecOrigin(r, 'education')),
    ...buildExp.map((r) => tagRecOrigin(r, 'experience')),
    ...longEdu.map((r) => tagRecOrigin(r, blend ? 'blended' : 'education')),
    ...longExp.map((r) => tagRecOrigin(r, 'experience')),
  ])

  let enriched = assembleCareerRoadmap(merged, profile, state)
  enriched = applyGlobalRecommendationRules(enriched, profile, state)
  enriched = applyUniversalCareerPathRules(enriched, profile, state)
  return enriched
}

export function buildDualEducationExperiencePaths(
  profile: CareerProfile,
  state: CareerBrainState
): DualCareerPathsOutput | null {
  if (!wantsDualEducationExperiencePaths(state)) return null

  const eduProfile = profileForPath(profile, state, 'education')
  const expProfile = profileForPath(profile, state, 'experience')

  const enrichPath = (
    raw: CareerBrainRecommendation[],
    pathProfile: CareerProfile
  ): { workNow: CareerPathRole[]; buildNext: CareerPathRole[]; longTerm: CareerPathRole[] } => {
    let recs = assembleCareerRoadmap(raw, pathProfile, state)
    recs = applyGlobalRecommendationRules(recs, pathProfile, state)
    recs = applyUniversalCareerPathRules(recs, pathProfile, state)
    return toPathRoles(recs)
  }

  const eduRecs = buildFallbackRecommendations(eduProfile, state).recommendations
  const expRecs = buildFallbackRecommendations(expProfile, state).recommendations

  const studyLabel = getStudyFieldText(state, profile) || 'Education field'
  const expLabel = getExperienceFieldText(state, profile) || 'Experience field'

  return {
    primary: 'not_sure',
    educationPath: {
      label: `Path A — ${studyLabel}`,
      ...enrichPath(eduRecs, eduProfile),
    },
    experiencePath: {
      label: `Path B — ${expLabel}`,
      ...enrichPath(expRecs, expProfile),
    },
  }
}

export function applyCareerDirectionPriorityToProfile(
  profile: CareerProfile,
  state: CareerBrainState
): CareerProfile {
  const priority = getCareerDirectionPriority(state)
  if (!priority) return profile

  if (priority === 'fast_employment') {
    const exp = getExperienceFieldText(state, profile)
    return applyBridgeModeToProfile(
      {
        ...profile,
        workExperienceField: exp || profile.workExperienceField,
        wantsSameField: true,
        wantsCareerChange: false,
        constraints: [
          ...new Set([
            ...profile.constraints,
            'path-focus-experience',
            'fast-employment-priority',
            'bridge-role-mode',
          ]),
        ],
      },
      state
    )
  }

  if (priority === 'both' || priority === 'not_sure') {
    return {
      ...profile,
      constraints: [
        ...new Set([
          ...profile.constraints,
          priority === 'both' ? 'dual-education-experience-paths' : 'unemployed-blended-path',
        ]),
      ],
    }
  }

  if (priority === 'education_field') {
    const study = getStudyFieldText(state, profile)
    return applyBridgeModeToProfile(
      {
        ...profile,
        studyField: study || profile.studyField,
        wantsSameField: true,
        wantsCareerChange: false,
        constraints: [...new Set([...profile.constraints, 'path-focus-education', 'bridge-role-mode'])],
      },
      state
    )
  }

  const exp = getExperienceFieldText(state, profile)
  return applyBridgeModeToProfile(
    {
      ...profile,
      workExperienceField: exp || profile.workExperienceField,
      studyField: profile.studyField,
      wantsSameField: true,
      wantsCareerChange: false,
      constraints: [...new Set([...profile.constraints, 'path-focus-experience', 'bridge-role-mode'])],
    },
    state
  )
}

export function buildSplitPathReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state) return []
  const priority = getCareerDirectionPriority(state)
  const study = getStudyFieldText(state, profile)
  const exp = getExperienceFieldText(state, profile)

  if (priority === 'both') {
    return [
      `You prioritised ${PRIORITY_LABELS.both} — Work Now, Build Next, and Long-Term combine realistic roles from ${study || 'your qualification'} and ${exp || 'your experience'}.`,
      'Each recommendation is tagged (education) or (experience) so you can see which input shaped it.',
    ]
  }

  if (priority === 'not_sure') {
    return [
      'You are not sure which path to prioritise — we blended education-aligned and experience-aligned options with trade-offs explained below.',
      `Education path (${study || 'qualification'}): field-aligned progression when you want to use your studies.`,
      `Experience path (${exp || 'prior work'}): faster income and roles that build on what you have already done.`,
      'Compare Path A and Path B below, then use the blended recommendations as a practical starting mix.',
    ]
  }

  if (priority === 'education_field') {
    return [
      `You prioritised ${PRIORITY_LABELS.education_field} — recommendations follow your qualification (${study || 'study field'}) only.`,
    ]
  }

  if (priority === 'experience_field') {
    return [
      `You prioritised ${PRIORITY_LABELS.experience_field} — recommendations follow your previous work (${exp || 'experience field'}) only.`,
    ]
  }

  if (priority === 'fast_employment') {
    return [
      `You prioritised ${PRIORITY_LABELS.fast_employment} — Work Now roles favour realistic UK hiring speed over qualification prestige.`,
    ]
  }

  return []
}

export function primaryPathFromDual(
  dual: DualCareerPathsOutput,
  priority: CareerDirectionPriority
): DualCareerPathsOutput['educationPath'] {
  if (priority === 'experience_field') return dual.experiencePath
  return dual.educationPath
}

export function buildCareerDirectionReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state) return []
  return buildSplitPathReasoning(profile, state)
}
