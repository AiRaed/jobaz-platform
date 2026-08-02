/**
 * Course / certification layer — enhances Build Next without rewriting career direction.
 */

import { inferBridgeField } from './bridgeRoleIntelligence'
import { buildBuildNextCourses } from './careerRoadmap'
import { hasCareerCommitmentLock } from './universalCareerPath'
import { isStudyAlignedProgression } from './careerTrackAlignment'
import { isTrainingOrLicence, titlesOverlapProgression } from './careerProgressionValidation'
import { isCertOpen } from './speedDevelopmentMode'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

function isFieldAlignedTraining(
  title: string,
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  if (isStudyAlignedProgression(title, profile)) return true
  const field = inferBridgeField(profile.studyField, profile.targetField ?? profile.workExperienceField)
  const t = title.toLowerCase()
  const byField: Partial<Record<typeof field, RegExp>> = {
    law: /legal|paralegal|casework|research skills|administration certificate/i,
    computer_science: /comptia|google it|networking|technical|cyber|cloud|software|developer/i,
    engineering: /cad|solidworks|hnc|btec|ceng|fea|18th edition|ecs|cscs|lean|six sigma|graduate/i,
    medicine: /care certificate|moving|clinical|nhs|first aid/i,
    nursing: /care certificate|moving|nhs|clinical/i,
    healthcare: /care certificate|clinical|pharmacy/i,
    animation: /video|motion|editing|creative|production/i,
    business: /excel|office|bookkeep|business admin|customer service cert/i,
    finance: /bookkeep|aat|account|payroll/i,
    construction: /cscs|site safety|health & safety/i,
  }
  const pattern = byField[field]
  return pattern ? pattern.test(t) : false
}

/** Merge field-aligned courses into existing Build Next — never replace the career path. */
export function mergeFieldAlignedTraining(
  recs: CareerBrainRecommendation[],
  profile: CareerProfile,
  state?: CareerBrainState
): CareerBrainRecommendation[] {
  if (!state || !isCertOpen(profile, state)) return recs

  const workNow = recs.filter((r) => r.track === 'work_now')
  const buildNext = recs.filter((r) => r.track === 'build_next')
  const longTerm = recs.filter((r) => r.track === 'long_term')
  const backup = recs.filter((r) => r.track === 'backup_income')

  const courses = buildBuildNextCourses(profile, state)
  if (!courses.length) {
    return [...workNow, ...backup, ...buildNext, ...longTerm]
  }

  const committed = hasCareerCommitmentLock(state, profile)
  const merged: CareerBrainRecommendation[] = [...buildNext]

  for (const course of courses) {
    if (workNow.some((w) => titlesOverlapProgression(w.title, course.title))) continue
    if (longTerm.some((l) => titlesOverlapProgression(l.title, course.title))) continue
    if (merged.some((b) => titlesOverlapProgression(b.title, course.title))) continue

    if (committed && !isFieldAlignedTraining(course.title, profile, state)) {
      continue
    }

    merged.push({
      ...course,
      why: course.why.startsWith('Build Next')
        ? course.why
        : `Build Next — field-aligned training: ${course.why}`,
    })
  }

  const cap = committed ? 6 : 8
  return [...workNow, ...backup, ...merged.slice(0, cap), ...longTerm]
}

export function buildCourseLayerReasoning(
  profile: CareerProfile,
  state?: CareerBrainState
): string[] {
  if (!state || !isCertOpen(profile, state)) return []
  if (hasCareerCommitmentLock(state, profile)) {
    return [
      'Training & certifications — recommendations support your chosen career path only; they do not change your field.',
      'Courses and licences are listed in Build Next as enhancements after Work Now roles are set.',
    ]
  }
  return [
    'Open to training — Build Next may include short courses and licences that improve employability for your situation.',
  ]
}
