import { aiProvider } from '@/lib/jobaz-ai/providers'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  toSiteBrainLoadMeta,
} from '@/lib/admin/ai/siteBrain'
import type { PulseAiAudience, PulseAiGoal, PulseCircle, PulsePostType } from './types'

export type PulseAiSuggestionDraft = {
  title: string
  body: string
  post_type: PulsePostType
  circle: PulseCircle
  tags: string[]
  reason: string
  video_url?: string | null
  source_url?: string | null
}

const AUDIENCE_LABEL: Record<PulseAiAudience, string> = {
  no_uk_experience: 'people new to UK work',
  extra_income: 'people seeking extra income',
  career_change: 'career changers',
  care: 'care route seekers',
  security: 'security route seekers',
  warehouse: 'warehouse / logistics seekers',
  driving: 'driving / delivery seekers',
  customer_service: 'customer service seekers',
  migrant_jobseeker: 'migrant jobseekers in the UK',
  general: 'UK jobseekers on JobAZ',
}

const GOAL_LABEL: Record<PulseAiGoal, string> = {
  educate: 'educate with practical steps',
  motivate: 'motivate with realistic next steps',
  drive_course_click: 'encourage exploring relevant course types on JobAZ',
  drive_cv_builder: 'encourage opening CV Builder',
  drive_jobs_search: 'encourage searching jobs on JobAZ',
  encourage_pulse_activity: 'encourage saving useful Pulse tips',
}

/** Deterministic fallback templates when AI is not configured. */
export function buildTemplatePulseSuggestions(params: {
  count: number
  audience: PulseAiAudience
  goal: PulseAiGoal
  circle: PulseCircle
  courseHint?: string | null
  videoUrl?: string | null
}): PulseAiSuggestionDraft[] {
  const audience = AUDIENCE_LABEL[params.audience]
  const circle = params.circle
  const course = params.courseHint?.trim() || null
  const bank: PulseAiSuggestionDraft[] = [
    {
      title: 'How to start without UK experience',
      body: [
        `If you are ${audience}, start with one clear route — not ten applications.`,
        '',
        'This week:',
        '1) Pick one target role on JobAZ My Plan',
        '2) Update your CV for that role only',
        '3) Apply to 3 suitable jobs',
        '',
        'JobAZ does not guarantee jobs — it helps you take practical next steps.',
        '',
        'Next action: Open My Plan and set this week’s focus.',
      ].join('\n'),
      post_type: 'career_advice',
      circle,
      tags: ['my-plan', 'first-steps'],
      reason: 'Practical career route post for Phase 1.',
    },
    {
      title: course
        ? `Course type to explore: ${course}`
        : 'Matchday Steward now, Door Supervisor later',
      body: [
        course
          ? `A common UK path is to explore “${course}” as a course type — check Career Hub for published partners when available.`
          : 'Many people start with event stewarding experience, then plan SIA Door Supervisor training when ready.',
        '',
        'Rules:',
        '- Do not invent providers or prices',
        '- If no published affiliate course exists, treat it as a course type only',
        '',
        'Next action: Open Career Hub and search your route’s training type.',
      ].join('\n'),
      post_type: 'course_guide',
      circle: circle === 'general' ? 'security' : circle,
      tags: ['training', 'licence'],
      reason: 'Course/licence guidance without fake providers.',
    },
    {
      title: '3 CV tweaks before warehouse applications',
      body: [
        'Before applying for warehouse or logistics roles:',
        '',
        '1) Put location + right-to-work clearly near the top',
        '2) Add shift flexibility in one short line',
        '3) List physical/teamwork examples with outcomes',
        '',
        'Next action: Open CV Builder and tailor for warehouse roles.',
      ].join('\n'),
      post_type: 'job_search_tip',
      circle: circle === 'general' ? 'warehouse_logistics' : circle,
      tags: ['cv', 'warehouse'],
      reason: 'Job-search / CV tip aligned to JobAZ tools.',
    },
    {
      title: 'Small business idea: weekend local cleaning',
      body: [
        'Idea: a weekend cleaning service for local landlords or short-lets.',
        '',
        'Start small:',
        '- One area / postcode',
        '- Clear pricing for a 2-hour clean',
        '- Simple WhatsApp booking',
        '',
        'This is an idea starter — not income advice or a guarantee.',
        '',
        'Next action: Save this idea and list your first 3 practical steps in My Plan.',
      ].join('\n'),
      post_type: 'small_business_idea',
      circle: 'business_startup',
      tags: ['startup', 'local'],
      reason: 'Optional small business idea for variety.',
    },
    {
      title: 'Local flexible work — check Opportunities',
      body: [
        'Looking for flexible or local work?',
        '',
        'Use JobAZ Opportunities for admin-checked local listings when available.',
        'Always verify details yourself before arranging anything.',
        '',
        'Next action: Browse /opportunities and save anything that fits your week.',
      ].join('\n'),
      post_type: 'opportunity',
      circle,
      tags: ['opportunities', 'flexible'],
      reason: 'Opportunity-style post pointing to real JobAZ surface.',
    },
    {
      title: 'Watch: practical UK career tip',
      body: [
        'Short video tip for your career plan this week.',
        '',
        'Watch externally (no autoplay). Then do one action in JobAZ — update My Plan or your CV target role.',
        '',
        'Next action: Open the video, then return to My Plan.',
      ].join('\n'),
      post_type: 'video',
      circle,
      tags: ['video', 'tips'],
      reason: 'Optional video post idea (link required before publish).',
      video_url: params.videoUrl || null,
    },
  ]

  // Rotate mix based on goal
  const order =
    params.goal === 'drive_cv_builder'
      ? [2, 0, 1, 3, 4, 5]
      : params.goal === 'drive_course_click'
        ? [1, 0, 2, 4, 3, 5]
        : params.goal === 'drive_jobs_search'
          ? [2, 4, 0, 1, 3, 5]
          : [0, 1, 2, 3, 4, 5]

  return order.slice(0, Math.min(params.count, bank.length)).map((i) => ({
    ...bank[i],
    reason: `${bank[i].reason} Goal: ${GOAL_LABEL[params.goal]}.`,
  }))
}

export async function generatePulseAiSuggestions(params: {
  count: number
  audience: PulseAiAudience
  goal: PulseAiGoal
  circle: PulseCircle
  courseHint?: string | null
  videoUrl?: string | null
}): Promise<{
  suggestions: PulseAiSuggestionDraft[]
  source: 'ai' | 'templates'
  siteBrain?: ReturnType<typeof toSiteBrainLoadMeta>
  error?: string
}> {
  const count = Math.min(7, Math.max(1, params.count || 3))
  const templates = buildTemplatePulseSuggestions({ ...params, count })

  if (!aiProvider.isConfigured()) {
    return { suggestions: templates, source: 'templates' }
  }

  try {
    const { brain, source } = await getActiveSiteBrain()
    const siteBrain = toSiteBrainLoadMeta(brain, source)
    const siteBlock = buildActiveSiteBrainContextBlock(brain)

    const prompt = [
      'You are JobAZ Pulse Content Planner for a UK career platform.',
      'Return ONLY valid JSON: {"suggestions":[{"title":"...","body":"...","post_type":"...","circle":"...","tags":["..."],"reason":"..."}]}',
      `Create exactly ${count} short Pulse posts.`,
      `Audience: ${AUDIENCE_LABEL[params.audience]}`,
      `Goal: ${GOAL_LABEL[params.goal]}`,
      `Preferred circle: ${params.circle}`,
      params.courseHint ? `Course hint (type only unless published): ${params.courseHint}` : '',
      'Mix: career advice, course/licence guidance, job-search/CV tip; optional business idea / opportunity / video idea.',
      'Rules: no job guarantees, no fake providers/prices, no hype, UK-focused, practical, clear next action.',
      'post_type must be one of: career_advice, course_guide, job_search_tip, opportunity, small_business_idea, success_story, project, question, video',
      siteBlock,
    ]
      .filter(Boolean)
      .join('\n')

    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: 'You write practical UK career Pulse posts. Output JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 2500,
    })

    const text = completion.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return { suggestions: templates, source: 'templates', siteBrain, error: 'AI returned no JSON' }
    }
    const parsed = JSON.parse(match[0]) as { suggestions?: PulseAiSuggestionDraft[] }
    const list = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    const cleaned = list
      .slice(0, count)
      .map((s) => ({
        title: String(s.title || '').slice(0, 160),
        body: String(s.body || '').slice(0, 4000),
        post_type: (s.post_type || 'career_advice') as PulsePostType,
        circle: (s.circle || params.circle) as PulseCircle,
        tags: Array.isArray(s.tags) ? s.tags.map(String).slice(0, 8) : [],
        reason: String(s.reason || 'AI suggestion').slice(0, 500),
        video_url: params.videoUrl || null,
        source_url: null,
      }))
      .filter((s) => s.body.length >= 20)

    if (cleaned.length === 0) {
      return { suggestions: templates, source: 'templates', siteBrain, error: 'AI suggestions empty' }
    }

    return { suggestions: cleaned, source: 'ai', siteBrain }
  } catch (err) {
    return {
      suggestions: templates,
      source: 'templates',
      error: err instanceof Error ? err.message : 'AI failed',
    }
  }
}
