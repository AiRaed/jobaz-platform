/**
 * JAZ dialogue — contextual assistant messages (LLM + rule fallback).
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import type { UkCareerAssistantState } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { CareerProfile } from './types'
import { detectUncertainty, type UncertaintySignals } from './uncertainty'

export const UK_CAREER_ADVISOR_DIALOGUE = 'uk-career-advisor-dialogue'

const JAZ_DIALOGUE_SYSTEM = `You are JAZ — JobAZ's UK employment advisor.
Write ONE short assistant message (max 220 characters) before the next question.

Personality:
- Professional, warm, practical, intelligent
- Like a UK career consultant + recruiter + employability coach
- Never robotic, never repetitive filler ("Great!", "Thanks for sharing!" alone)
- Reference something specific they already said when possible
- If user seems uncertain, be reassuring and clear
- If simplify_language is true, use short sentences and simple words (A2-B1 level)

Rules:
- Plain text only, no markdown
- Do NOT include the question text itself
- Do NOT say "Next:"
- UK English`

type QuestionRef = { id: string; text: string }

function pickReference(profile: CareerProfile): string | null {
  if (profile.memorySnippets.length) return profile.memorySnippets[0]
  if (profile.workExperience.industries[0]) {
    return `your background in ${profile.workExperience.industries[0].replace(/_/g, ' ')}`
  }
  return null
}

export function ruleBasedAdvisorMessage(
  profile: CareerProfile,
  question: QuestionRef,
  phase: string,
  uncertainty?: UncertaintySignals
): string {
  const ref = pickReference(profile)
  const segment = profile.careerDirection.userSegment

  if (uncertainty?.reassuranceNeeded) {
    if (uncertainty.simplifyLanguage) {
      return ref
        ? `Thank you. I remember ${ref}. This next question is simple — it helps me find good UK jobs for you.`
        : 'No problem if you are not sure yet. This question helps me understand you better for UK work.'
    }
    return ref
      ? `That is completely fine — many people are unsure at this stage. From what you shared about ${ref}, I will keep recommendations realistic.`
      : 'Many people feel unsure here — I will guide you step by step toward realistic UK options.'
  }

  if (phase === 'CLASSIFY' || phase === 'classification') {
    if (question.id === 'edu') {
      return 'To map realistic UK options, I need to understand your education background first — this shapes which roles are open to you.'
    }
    if (question.id === 'exp') {
      return 'Experience matters as much as qualifications in the UK market. This helps me see what skills you can transfer straight away.'
    }
    return 'A couple more basics will help me place you on the right career path for the UK.'
  }

  if (segment === 'migrant' && profile.barriers.language) {
    return ref
      ? `You mentioned ${ref} — I'll focus on UK roles that match your strengths while keeping communication realistic.`
      : 'I will keep language and training needs in mind so recommendations stay achievable.'
  }

  if (segment === 'career_changer') {
    return ref
      ? `Since you want to change direction, I'll look at transferable skills from ${ref} — not just your old job title.`
      : 'Career changes work best when we spot transferable skills — I will guide you through that.'
  }

  if (!profile.workExperience.hasExperience) {
    return 'No UK experience yet is common — I will focus on entry routes that hire quickly and build your profile.'
  }

  if (ref) {
    return `Building on ${ref}, this next detail helps me narrow down sectors that actually fit the UK job market.`
  }

  if (profile.aiInsights.employabilityScore >= 60) {
    return 'Your profile is taking shape — one more detail will sharpen which UK roles to prioritise.'
  }

  return 'This helps me understand your situation so recommendations stay realistic, not generic.'
}

export async function generateAdvisorTransition(
  state: UkCareerAssistantState,
  profile: CareerProfile,
  question: QuestionRef,
  lastAnswerLabel?: string | null
): Promise<string> {
  const phase = String(state.phase ?? 'PATH')
  const uncertainty = detectUncertainty(
    state.answers ?? {},
    state.last_question_id as string | undefined,
    profile
  )

  if (!aiProvider.isConfigured()) {
    return ruleBasedAdvisorMessage(profile, question, phase, uncertainty)
  }

  const lastKey = state.last_question_id as string | undefined
  const lastVal = lastKey ? state.answers?.[lastKey] : undefined

  try {
    const completion = await aiProvider.generateText({
      feature: UK_CAREER_ADVISOR_DIALOGUE,
      messages: [
        { role: 'system', content: JAZ_DIALOGUE_SYSTEM },
        {
          role: 'user',
          content: JSON.stringify({
            phase,
            path: state.path,
            next_question_id: question.id,
            memory_snippets: profile.memorySnippets,
            segment: profile.careerDirection.userSegment,
            employability_score: profile.aiInsights.employabilityScore,
            barriers: profile.barriers,
            uncertainty,
            simplify_language: uncertainty.simplifyLanguage,
            last_answer: lastAnswerLabel ?? lastVal ?? null,
            recent_answers: Object.fromEntries(
              Object.entries(state.answers ?? {}).slice(-5)
            ),
          }),
        },
      ],
      temperature: 0.65,
      maxTokens: 120,
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 30_000),
    })

    const text = completion.text.trim().replace(/^["']|["']$/g, '')
    if (text.length >= 20 && text.length <= 280 && !text.toLowerCase().startsWith('next:')) {
      return text
    }
  } catch {
    /* fallback */
  }

  return ruleBasedAdvisorMessage(profile, question, phase, uncertainty)
}

export function buildClassifyAdvisorMessage(
  profile: CareerProfile,
  question: QuestionRef,
  state?: UkCareerAssistantState
): string {
  const uncertainty = state
    ? detectUncertainty(state.answers ?? {}, state.last_question_id as string | undefined, profile)
    : undefined
  return ruleBasedAdvisorMessage(profile, question, 'CLASSIFY', uncertainty)
}

export function buildResultAdvisorMessage(profile: CareerProfile): string {
  const score = profile.aiInsights.employabilityScore
  const top = profile.aiInsights.recommendedSectors[0]

  if (score >= 70 && top) {
    return `Based on everything you shared, ${top} looks like a strong realistic focus for the UK market — here is your personalised plan.`
  }
  if (profile.barriers.language) {
    return 'I have mapped paths that fit your background and English level, with clear steps to improve employability — here are your recommendations.'
  }
  return 'Here is a realistic UK career plan based on your background, constraints, and goals — not generic advice.'
}
