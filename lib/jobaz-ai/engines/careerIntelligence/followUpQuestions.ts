/**
 * AI-generated follow-up questions for UK Career Assistant.
 * Rules decide WHEN to ask; AI generates structured question copy (local tier).
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import { parseJsonFromText } from '@/lib/jobaz-ai/providers/base'
import type { AiFollowUpQuestion, UkCareerAssistantState } from './types'

export const UK_CAREER_FOLLOW_UP_FEATURE = 'uk-career-follow-up'

const MAX_FOLLOW_UPS = 2

type FollowUpTrigger = {
  id: string
  matches: (answers: Record<string, unknown>) => boolean
  hint: string
}

const TRIGGERS: FollowUpTrigger[] = [
  {
    id: 'customer_preference',
    matches: (a) =>
      a.people_comfort === 'avoid_customers' ||
      a.people_comfort === 'minimal' ||
      a.customer_interaction === 'avoid',
    hint: 'User prefers minimal customer contact. Ask whether they prefer independent work or small team environments.',
  },
  {
    id: 'no_driving_licence',
    matches: (a) => {
      const t = String(a.transport ?? '')
      return t.includes('no_licence') || t.includes('no_license') || t === 'public_only'
    },
    hint: 'User has no driving licence. Ask if they would consider short training like forklift or SIA security.',
  },
  {
    id: 'training_openness',
    matches: (a) =>
      a.training_openness === 'yes_soon' ||
      a.training_openness === 'yes_later' ||
      a.training_openness === 'open',
    hint: 'User is open to training. Ask which licence or short course interests them most.',
  },
  {
    id: 'physical_limits',
    matches: (a) => a.physical_ability === 'limited' || a.physical_ability === 'light_only',
    hint: 'User has physical limits. Ask about preferred work intensity (seated, light movement, mixed).',
  },
]

export function findFollowUpTrigger(
  state: UkCareerAssistantState
): FollowUpTrigger | null {
  const asked = new Set(state.ai_follow_up_ids ?? [])
  if (asked.size >= MAX_FOLLOW_UPS) return null

  const answers = state.answers ?? {}
  for (const trigger of TRIGGERS) {
    if (asked.has(trigger.id) && !answers[`ai_follow_up_${trigger.id}`]) continue
    if (asked.has(trigger.id)) continue
    if (trigger.matches(answers)) return trigger
  }
  return null
}

const SYSTEM_PROMPT = `You are JobAZ AI for UK job seekers. Generate ONE short follow-up question with 3-4 answer options.

Return ONLY valid JSON:
{
  "text": "The question (one sentence, max 120 chars)",
  "options": [
    { "value": "snake_case_id", "label": "Short label" }
  ]
}

Rules:
- UK English, practical, no markdown
- Exactly 3 or 4 options
- Options must be mutually exclusive
- Do not repeat questions already answered`

function parseFollowUpPayload(
  raw: string,
  triggerId: string
): AiFollowUpQuestion | null {
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
    }
  } catch {
    return null
  }
}

/** Rule-based fallback when AI unavailable. */
function ruleBasedFollowUp(trigger: FollowUpTrigger): AiFollowUpQuestion {
  if (trigger.id === 'customer_preference') {
    return {
      id: `ai_follow_up_${trigger.id}`,
      text: 'Would you prefer mostly independent work or a small team environment?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'independent', label: 'Mostly independent work' },
        { value: 'small_team', label: 'Small team (2–5 people)' },
        { value: 'either', label: 'Either is fine' },
      ],
    }
  }

  if (trigger.id === 'no_driving_licence') {
    return {
      id: `ai_follow_up_${trigger.id}`,
      text: 'Would you consider a short training course such as forklift or SIA security?',
      type: 'single',
      triggerId: trigger.id,
      options: [
        { value: 'forklift', label: 'Yes — forklift' },
        { value: 'sia', label: 'Yes — SIA security' },
        { value: 'other_training', label: 'Other short course' },
        { value: 'no_training', label: 'Not right now' },
      ],
    }
  }

  return {
    id: `ai_follow_up_${trigger.id}`,
    text: 'Which option best describes your preference?',
    type: 'single',
    triggerId: trigger.id,
    options: [
      { value: 'option_a', label: 'Option A' },
      { value: 'option_b', label: 'Option B' },
      { value: 'not_sure', label: 'Not sure yet' },
    ],
  }
}

export async function generateAiFollowUpQuestion(
  state: UkCareerAssistantState,
  trigger: FollowUpTrigger
): Promise<AiFollowUpQuestion> {
  const answers = state.answers ?? {}

  try {
    const completion = await aiProvider.generateText({
      feature: UK_CAREER_FOLLOW_UP_FEATURE,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(
            {
              trigger: trigger.id,
              hint: trigger.hint,
              path: state.path,
              known_answers: answers,
            },
            null,
            2
          ),
        },
      ],
      temperature: 0.5,
      maxTokens: 280,
      responseFormat: 'json_object',
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 45_000),
    })

    const parsed = parseFollowUpPayload(completion.text, trigger.id)
    if (parsed) return parsed
  } catch {
    // Rule fallback below
  }

  return ruleBasedFollowUp(trigger)
}
