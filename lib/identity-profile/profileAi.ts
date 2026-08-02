/**
 * Profile AI abstraction — Ollama-ready via /api/ai/local, no OpenAI hard dependency
 */

export type ProfileAiTask =
  | 'generate-about'
  | 'improve-headline'
  | 'suggest-skills'
  | 'generate-business-description'
  | 'improve-services'
  | 'career-suggestions'
  | 'business-growth-suggestions'

const TASK_TO_FEATURE: Record<ProfileAiTask, string> = {
  'generate-about': 'profile-about',
  'improve-headline': 'profile-headline',
  'suggest-skills': 'profile-skills',
  'generate-business-description': 'profile-business-desc',
  'improve-services': 'profile-services',
  'career-suggestions': 'profile-career-tips',
  'business-growth-suggestions': 'profile-business-tips',
}

export type ProfileAiContext = {
  profileType: 'personal' | 'business'
  headline?: string
  bio?: string
  businessName?: string
  category?: string
  services?: string[]
  skills?: string[]
  location?: string
}

function ruleBasedFallback(task: ProfileAiTask, ctx: ProfileAiContext): string {
  switch (task) {
    case 'generate-about':
      return ctx.profileType === 'business'
        ? `${ctx.businessName ?? 'Our business'} helps people in ${ctx.location ?? 'the UK'} with ${(ctx.services ?? ['quality services']).slice(0, 2).join(' and ')}. We focus on reliability, clear communication, and fair pricing.`
        : `I am building my career in the UK with a focus on ${ctx.headline ?? 'meaningful work'}. I bring ${(ctx.skills ?? ['reliability', 'teamwork']).slice(0, 3).join(', ')} and I am motivated to grow with the right employer or project.`
    case 'improve-headline':
      return ctx.headline?.trim()
        ? `${ctx.headline} · UK · Open to opportunities`
        : ctx.profileType === 'business'
          ? `${ctx.businessName ?? 'Local business'} · ${ctx.category ?? 'Services'} · UK`
          : 'UK professional · Ready to contribute · Open to work'
    case 'suggest-skills':
      return 'Communication, Reliability, Problem solving, Teamwork, Customer service, Time management'
    case 'generate-business-description':
      return `We are a ${ctx.category ?? 'local'} business serving ${ctx.location ?? 'our community'}. ${(ctx.services ?? []).join(', ')}. Contact us for friendly, professional service.`
    case 'improve-services':
      return (ctx.services ?? ['Consultation', 'Standard service', 'Premium package']).join('\n')
    case 'career-suggestions':
      return 'Complete your CV, post on Pulse weekly, join a career group, and practice interviews with JobAZ tools.'
    case 'business-growth-suggestions':
      return 'Add photos, post opportunities on Pulse, collect reviews, and share your profile link locally.'
    default:
      return ''
  }
}

export async function runProfileAi(task: ProfileAiTask, ctx: ProfileAiContext): Promise<{
  text: string
  fromAi: boolean
  message?: string
}> {
  const fallback = ruleBasedFallback(task, ctx)
  const feature = TASK_TO_FEATURE[task]

  try {
    const res = await fetch('/api/ai/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        feature,
        context: ctx,
        ruleBasedFallback: fallback,
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; text?: string }
      if (data.ok && data.text?.trim()) {
        return { text: data.text.trim(), fromAi: true }
      }
    }
  } catch {
    /* use fallback */
  }

  return {
    text: fallback,
    fromAi: false,
    message: 'AI writing help will use smart suggestions until Ollama is connected.',
  }
}
