/**
 * Final validation for grow-career results — profession isolation, ladder integrity, IC vs management.
 */

import {
  isSoftwareIcTrack,
  isSoftwareManagementTrack,
  pickEducationLadder,
  pickHealthcareLadder,
  pickSoftwareLadder,
} from './growCareerProfessionLadders'
import type { DynamicProgression } from './growCareerGrowthAdvisor'
import { getProfessionTrack } from './jaz/jazProfessionProgression'
import { resolveGrowCareerCurrentJobTitle } from './growCareerPath'
import type { CareerBrainRecommendation, CareerBrainState } from './types'
import type { JazProfessionTrack } from './jaz/jazTypes'

const EDUCATION_VOCAB =
  /\b(classroom|school progression|education pathway|hlta|teaching assistant|pastoral lead|cover supervisor|sen support|learning support|uk schools)\b/i
const SOFTWARE_VOCAB =
  /\b(software engineering|tech stack|architecture exposure|developer|engineer|staff engineer|mid-level developer|codebase|deployment)\b/i
const HEALTHCARE_VOCAB =
  /\b(care assistant|clinical|nhs|band \d|nmc|hca|patient care|ward|healthcare)\b/i
const MANAGEMENT_VOCAB = /\b(engineering manager|head of engineering|director of engineering)\b/i

function answers(state: CareerBrainState): Record<string, unknown> {
  return (state.answers ?? {}) as Record<string, unknown>
}

function str(state: CareerBrainState, key: string): string {
  return String(answers(state)[key] ?? '').trim()
}

function collectText(recs: CareerBrainRecommendation[]): string {
  return recs.map((r) => `${r.title} ${r.why}`).join(' ')
}

function forbiddenVocabForTrack(track: JazProfessionTrack): RegExp[] {
  switch (track) {
    case 'software':
      return [EDUCATION_VOCAB, HEALTHCARE_VOCAB]
    case 'education':
      return [SOFTWARE_VOCAB, HEALTHCARE_VOCAB]
    case 'healthcare':
      return [EDUCATION_VOCAB, SOFTWARE_VOCAB]
    default:
      return []
  }
}

function expectedLadderPick(
  track: JazProfessionTrack,
  state: CareerBrainState,
  jobTitle: string
): { buildNext: string; longTerm: string } {
  switch (track) {
    case 'software': {
      const pick = pickSoftwareLadder(state, jobTitle)
      return { buildNext: pick.buildNextTitle, longTerm: pick.longTermTitle }
    }
    case 'education': {
      const pick = pickEducationLadder(state, jobTitle)
      return { buildNext: pick.buildNextTitle, longTerm: pick.longTermTitle }
    }
    case 'healthcare': {
      const pick = pickHealthcareLadder(state, jobTitle)
      return { buildNext: pick.buildNextTitle, longTerm: pick.longTermTitle }
    }
    default:
      return { buildNext: '', longTerm: '' }
  }
}

export type GrowValidationResult = {
  valid: boolean
  issues: string[]
  repairedProgression?: DynamicProgression
}

export function validateGrowCareerOutput(
  state: CareerBrainState,
  progression: DynamicProgression,
  recommendations: CareerBrainRecommendation[]
): GrowValidationResult {
  const issues: string[] = []
  const track = getProfessionTrack(state)
  const jobTitle = resolveGrowCareerCurrentJobTitle(state)
  const allText = collectText(recommendations)

  for (const pattern of forbiddenVocabForTrack(track)) {
    if (pattern.test(allText)) {
      issues.push(`Cross-path contamination: ${track} output contains foreign profession vocabulary`)
      break
    }
  }

  if (track === 'software' && isSoftwareIcTrack(state) && !isSoftwareManagementTrack(state)) {
    if (MANAGEMENT_VOCAB.test(`${progression.buildNextTitle} ${progression.longTermTitle} ${allText}`)) {
      issues.push('IC track must not recommend engineering management roles')
    }
  }

  const ladder = expectedLadderPick(track, state, jobTitle)
  if (ladder.buildNext && progression.buildNextTitle !== ladder.buildNext) {
    const skipped =
      /senior developer/i.test(progression.buildNextTitle) &&
      /mid-level developer/i.test(ladder.buildNext) &&
      track === 'software'
    if (skipped) {
      issues.push('Build Next skips a ladder rung (e.g. Junior → Senior without Mid-Level)')
    }
  }

  if (/you will become|your future role is|guaranteed/i.test(allText)) {
    issues.push('Long-term wording is too deterministic')
  }

  const goal = str(state, 'jaz_goal') || str(state, 'cb_grow_goal')
  if (goal === 'leadership' && track === 'software' && isSoftwareIcTrack(state)) {
    if (MANAGEMENT_VOCAB.test(progression.buildNextTitle)) {
      issues.push('Build Next does not match stated IC career goal')
    }
  }

  const valid = issues.length === 0
  let repairedProgression: DynamicProgression | undefined

  if (!valid && ladder.buildNext) {
    repairedProgression = {
      ...progression,
      buildNextTitle: ladder.buildNext,
      longTermTitle: ladder.longTerm || progression.longTermTitle,
      nextStepReason: progression.nextStepReason.replace(
        progression.buildNextTitle,
        ladder.buildNext
      ),
    }
  }

  return { valid, issues, repairedProgression }
}

export function applyGrowValidationRepairs(
  progression: DynamicProgression,
  recommendations: CareerBrainRecommendation[],
  validation: GrowValidationResult
): { progression: DynamicProgression; recommendations: CareerBrainRecommendation[] } {
  if (validation.valid || !validation.repairedProgression) {
    return { progression, recommendations }
  }

  const repaired = validation.repairedProgression
  const oldBuildNext = progression.buildNextTitle
  const updatedRecs = recommendations.map((r) => {
    if (r.track === 'build_next' && r.title === oldBuildNext) {
      return { ...r, title: repaired.buildNextTitle, why: r.why.replace(oldBuildNext, repaired.buildNextTitle) }
    }
    if (r.track === 'long_term' && r.title === progression.longTermTitle) {
      return {
        ...r,
        title: repaired.longTermTitle,
        why: r.why.replace(progression.longTermTitle, repaired.longTermTitle),
      }
    }
    return r
  })

  return { progression: repaired, recommendations: updatedRecs }
}
