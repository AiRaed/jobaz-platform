import type { StartNewCareerSituation } from './types'

export function hasWorkExperience(situation?: string): boolean {
  return situation === 'experienced_known_target' || situation === 'experienced_unknown_target'
}

/** Situation A — user already knows their target career (still must pick it explicitly). */
export function knowsTargetCareer(situation?: string): boolean {
  return situation === 'experienced_known_target' || situation === 'no_experience_known_target'
}

/** Situation B — user is exploring; career must not be decided by the engine. */
export function isExploringCareers(situation?: string): boolean {
  return situation === 'experienced_unknown_target' || situation === 'no_experience_unknown_target'
}

/** User explicitly selected a target career sector — never infer from situation alone. */
export function hasExplicitTargetSelection(answers: Record<string, string>): boolean {
  return Boolean(answers.target_field?.trim())
}

export function hasUserConfirmedTarget(answers: Record<string, string>): boolean {
  if (!hasExplicitTargetSelection(answers)) return false
  if (knowsTargetCareer(answers.starting_situation)) return true
  return answers.target_confirmed === 'yes'
}

export function shouldBuildRoadmap(answers: Record<string, string>): boolean {
  return hasUserConfirmedTarget(answers)
}

export function shouldShowRecommendations(answers: Record<string, string>): boolean {
  return isExploringCareers(answers.starting_situation) && !hasUserConfirmedTarget(answers)
}

export function parseSituation(answers: Record<string, string>): StartNewCareerSituation {
  return answers.starting_situation as StartNewCareerSituation
}

export function requireExplicitTargetForKnownCareerPath(answers: Record<string, string>): void {
  if (knowsTargetCareer(answers.starting_situation) && !hasExplicitTargetSelection(answers)) {
    throw new Error(
      'Target career must be selected explicitly. Which career field would you like to move into?'
    )
  }
}
