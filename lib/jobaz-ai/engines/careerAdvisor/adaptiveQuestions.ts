/**
 * Adaptive follow-up selection — rules pick WHEN; AI writes question copy.
 */

import type { AiFollowUpQuestion } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { UkCareerAssistantState } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { aiProvider } from '@/lib/jobaz-ai/providers'
import { parseJsonFromText } from '@/lib/jobaz-ai/providers/base'
import type { AdaptiveFollowUpTrigger, CareerProfile } from './types'
import { applyInsightsToProfile } from './employability'
import { buildCareerProfile } from './profileBuilder'

export const UK_CAREER_ADVISOR_FOLLOW_UP = 'uk-career-advisor-follow-up'

const TRIGGERS: AdaptiveFollowUpTrigger[] = [
  {
    id: 'engineering_depth',
    priority: 90,
    hint: 'User has engineering/education background. Ask which engineering area, UK work interest, and tools/software they know.',
    matches: (p) =>
      /engineer|mechanical|electrical|civil|software/i.test(
        [p.education.field, ...p.workExperience.industries].filter(Boolean).join(' ')
      ),
  },
  {
    id: 'hospitality_transfer',
    priority: 85,
    hint: 'Hospitality background. Ask customer service depth, management experience, and shift availability for UK roles.',
    matches: (p, a) =>
      /hospitality|restaurant/i.test(String(a.experience_field ?? '')) ||
      p.workExperience.industries.some((i) => /hospitality/i.test(i)),
  },
  {
    id: 'no_experience_strengths',
    priority: 88,
    hint: 'Little or no experience. Ask strengths, interests, and comfort with communication or physical work.',
    matches: (p) => !p.workExperience.hasExperience,
  },
  {
    id: 'career_change_why',
    priority: 82,
    hint: 'Career change intent. Ask why they want to change and what they enjoyed in past work.',
    matches: (p) => p.careerDirection.wantsCareerChange === true,
  },
  {
    id: 'weak_english_roles',
    priority: 86,
    hint: 'Basic English. Ask which work environments feel manageable (small team, written instructions, minimal phone calls).',
    matches: (p) => p.ukReadiness.englishLevel === 'basic' || p.ukReadiness.englishLevel === 'functional',
  },
  {
    id: 'customer_avoidance',
    priority: 80,
    hint: 'Prefers minimal customer contact. Ask independent vs small team preference.',
    matches: (p, a) =>
      String(a.people_comfort ?? '').includes('prefer_not') ||
      String(a.customer_interaction ?? '').includes('avoid'),
  },
  {
    id: 'no_licence_training',
    priority: 78,
    hint: 'No driving licence. Ask openness to forklift, SIA, or local warehouse roles.',
    matches: (p) => p.ukReadiness.drivingLicence === false,
  },
  {
    id: 'graduate_first_role',
    priority: 75,
    hint: 'Graduate/qualified but limited experience. Ask target sector and internship vs paid entry preference.',
    matches: (p) => p.careerDirection.userSegment === 'graduate',
  },
]

const SYSTEM_PROMPT = `You are JAZ — JobAZ's UK employment advisor. Generate ONE adaptive follow-up question.

Personality: professional, warm, practical, never robotic. Reference what you already know briefly.

Return ONLY JSON:
{
  "text": "Question (max 140 chars, one sentence)",
  "options": [
    { "value": "snake_case", "label": "Short label" }
  ]
}

Rules:
- Exactly 3 or 4 options
- UK English
- Must help employability assessment
- Do not repeat topics already answered in known_answers`

export function findAdaptiveFollowUpTrigger(
  state: UkCareerAssistantState,
  profile?: CareerProfile
): AdaptiveFollowUpTrigger | null {
  const asked = new Set(state.ai_follow_up_ids ?? [])
  if (asked.size >= 3) return null

  const p = profile ?? applyInsightsToProfile(buildCareerProfile(state))
  const answers = state.answers ?? {}

  const candidates = TRIGGERS.filter((t) => !asked.has(t.id) && t.matches(p, answers)).sort(
    (a, b) => b.priority - a.priority
  )

  return candidates[0] ?? null
}

function parsePayload(raw: string, triggerId: string): AiFollowUpQuestion | null {
  try {
    const parsed = parseJsonFromText<{
      text?: string
      options?: Array<{ value?: string; label?: string }>
    }>(raw)
    if (!parsed.text?.trim() || !Array.isArray(parsed.options) || parsed.options.length < 3) {
      return null
    }
    const options = parsed.options
      .filter((o) => o.value && o.label)
      .slice(0, 4)
      .map((o) => ({ value: String(o.value), label: String(o.label) }))
    if (options.length < 3) return null
    return {
      id: `ai_follow_up_${triggerId}`,
      text: parsed.text.trim(),
      type: 'single',
      options,
      triggerId,
      allow_free_text: true,
    }
  } catch {
    return null
  }
}

function ruleFallback(trigger: AdaptiveFollowUpTrigger): AiFollowUpQuestion {
  const map: Record<string, AiFollowUpQuestion> = {
    engineering_depth: {
      id: `ai_follow_up_${trigger.id}`,
      text: 'Which engineering area fits you best for UK work, and do you use any design or technical software?',
      type: 'single',
      triggerId: trigger.id,
      allow_free_text: true,
      options: [
        { value: 'mechanical', label: 'Mechanical / manufacturing' },
        { value: 'electrical', label: 'Electrical / maintenance' },
        { value: 'software', label: 'Software / digital' },
        { value: 'unsure', label: 'Still exploring' },
      ],
    },
    hospitality_transfer: {
      id: `ai_follow_up_${trigger.id}`,
      text: 'In hospitality, were you mainly front-of-house with customers, or back-of-house operations?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'front', label: 'Front-of-house / customers' },
        { value: 'back', label: 'Kitchen / operations' },
        { value: 'supervisor', label: 'Supervisor / team lead' },
        { value: 'mixed', label: 'Mixed roles' },
      ],
    },
    no_experience_strengths: {
      id: `ai_follow_up_${trigger.id}`,
      text: 'What are you naturally good at — helping people, practical tasks, organisation, or learning on the job?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'people', label: 'Helping people' },
        { value: 'practical', label: 'Practical / hands-on' },
        { value: 'organisation', label: 'Organisation & admin' },
        { value: 'learning', label: 'Learning quickly' },
      ],
    },
    career_change_why: {
      id: `ai_follow_up_${trigger.id}`,
      text: 'What is the main reason you want a different career path in the UK?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'income', label: 'Better income' },
        { value: 'stress', label: 'Less stress / burnout' },
        { value: 'interest', label: 'New interest' },
        { value: 'opportunity', label: 'More UK opportunities' },
      ],
    },
    weak_english_roles: {
      id: `ai_follow_up_${trigger.id}`,
      text: 'Which work setting feels most manageable for your English right now?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'small_team', label: 'Small team, simple tasks' },
        { value: 'written', label: 'Clear written instructions' },
        { value: 'physical', label: 'Physical work, less talking' },
        { value: 'training', label: 'Happy to build English at work' },
      ],
    },
  }

  return (
    map[trigger.id] ?? {
      id: `ai_follow_up_${trigger.id}`,
      text: 'What would help us recommend the most realistic UK path for you?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'income_fast', label: 'Income as soon as possible' },
        { value: 'stable', label: 'Stable long-term career' },
        { value: 'skills', label: 'Build skills first' },
        { value: 'unsure', label: 'Not sure yet' },
      ],
    }
  )
}

export async function generateAdaptiveFollowUp(
  state: UkCareerAssistantState,
  trigger: AdaptiveFollowUpTrigger,
  profile: CareerProfile
): Promise<AiFollowUpQuestion> {
  try {
    const completion = await aiProvider.generateText({
      feature: UK_CAREER_ADVISOR_FOLLOW_UP,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(
            {
              trigger: trigger.id,
              hint: trigger.hint,
              memory: profile.memorySnippets,
              employability: profile.aiInsights.employabilityScore,
              segment: profile.careerDirection.userSegment,
              known_answers: state.answers ?? {},
            },
            null,
            2
          ),
        },
      ],
      temperature: 0.55,
      maxTokens: 320,
      responseFormat: 'json_object',
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 45_000),
    })
    const parsed = parsePayload(completion.text, trigger.id)
    if (parsed) return parsed
  } catch {
    /* rule fallback */
  }
  return ruleFallback(trigger)
}
