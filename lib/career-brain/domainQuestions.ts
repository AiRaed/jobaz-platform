/**
 * Phase 2 — domain specialist question banks.
 */

import type { CareerBrainQuestion, CareerProfile } from './types'

type QuestionDef = {
  id: string
  when: (profile: CareerProfile, asked: Set<string>) => boolean
  question: CareerBrainQuestion
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false,
  maxSelect?: number
): CareerBrainQuestion {
  return {
    id,
    text,
    type: multi ? 'multi' : 'single',
    options,
    max_select: maxSelect,
    allow_free_text: true,
  }
}

export function isCreativeDomain(domain: CareerProfile['domain']): boolean {
  return domain === 'animation_design' || domain === 'creative_media'
}

export const CREATIVE_QUESTION_IDS = [
  'cb_creative_portfolio',
  'cb_animation_tools',
  'cb_creative_target_roles',
  'cb_creative_work_mode',
] as const

export const CREATIVE_QUESTION_BANK: QuestionDef[] = [
  {
    id: 'cb_creative_portfolio',
    when: (p, a) =>
      !a.has('cb_creative_portfolio') && isCreativeDomain(p.domain) && p.hasPortfolio === null,
    question: q('cb_creative_portfolio', 'Do you have a portfolio or showreel?', [
      { value: 'yes_strong', label: 'Yes — strong portfolio / showreel' },
      { value: 'yes_basic', label: 'Yes — student or basic work' },
      { value: 'building', label: 'Building one now' },
      { value: 'no', label: 'Not yet' },
    ]),
  },
  {
    id: 'cb_animation_tools',
    when: (p, a) =>
      !a.has('cb_animation_tools') && isCreativeDomain(p.domain) && p.toolsAndSkills.length < 2,
    question: q('cb_animation_tools', 'What animation or motion tools do you use?', [
      { value: 'maya', label: 'Maya' },
      { value: 'after_effects', label: 'After Effects' },
      { value: 'premiere', label: 'Premiere Pro' },
      { value: 'blender', label: 'Blender' },
      { value: 'cinema4d', label: 'Cinema 4D' },
    ], true, 4),
  },
  {
    id: 'cb_creative_target_roles',
    when: (p, a) => !a.has('cb_creative_target_roles') && isCreativeDomain(p.domain),
    question: q(
      'cb_creative_target_roles',
      'Are you targeting Junior Animator, Motion Designer, Video Editor, 3D Artist, or Content Designer?',
      [
        { value: 'junior_animator', label: 'Junior Animator' },
        { value: 'motion_designer', label: 'Motion Designer' },
        { value: 'video_editor', label: 'Video Editor' },
        { value: '3d_artist', label: '3D Artist / Assistant' },
        { value: 'content_designer', label: 'Content Designer' },
        { value: 'open', label: 'Open to any creative role first' },
      ],
      true,
      2
    ),
  },
  {
    id: 'cb_creative_work_mode',
    when: (p, a) => !a.has('cb_creative_work_mode') && isCreativeDomain(p.domain),
    question: q('cb_creative_work_mode', 'What type of creative work setup do you want in the UK?', [
      { value: 'studio', label: 'Studio / in-house' },
      { value: 'agency', label: 'Agency' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'remote', label: 'Remote / hybrid' },
      { value: 'any_first', label: 'Any creative job first' },
    ]),
  },
]

function countAnswered(ids: readonly string[], asked: Set<string>): number {
  return ids.filter((id) => asked.has(id)).length
}

export function isCreativeSpecialistQuestioningComplete(
  profile: CareerProfile,
  asked: Set<string>
): boolean {
  const answered = countAnswered(CREATIVE_QUESTION_IDS, asked)
  const hasPortfolio = profile.hasPortfolio !== null || asked.has('cb_creative_portfolio')
  const hasTargets = asked.has('cb_creative_target_roles')
  const hasMode = asked.has('cb_creative_work_mode')
  const toolsOk = profile.toolsAndSkills.length >= 2 || asked.has('cb_animation_tools')

  return answered >= 3 && hasPortfolio && hasTargets && hasMode && toolsOk
}

export function pickCreativeQuestions(
  profile: CareerProfile,
  asked: Set<string>
): { question: CareerBrainQuestion | null; reason: string } {
  for (const def of CREATIVE_QUESTION_BANK) {
    if (def.when(profile, asked)) {
      return { question: def.question, reason: `Phase 2 creative: ${def.id}` }
    }
  }
  return { question: null, reason: 'No creative questions pending' }
}
