import { NextRequest, NextResponse } from 'next/server'
import { isOllamaAvailable } from '@/lib/jobaz-ai/providers/ollama'
import { runLocalFeature } from '@/lib/jobaz-ai/local/runLocalFeature'

export const dynamic = 'force-dynamic'

const PROMPTS: Record<string, (ctx: Record<string, unknown>) => string> = {
  'profile-about': (ctx) =>
    `Write a professional "About me" paragraph (80-120 words) for a UK ${ctx.profileType} profile. Headline: ${ctx.headline ?? ''}. Skills: ${(ctx.skills as string[])?.join(', ') ?? ''}. Business: ${ctx.businessName ?? ''}. Tone: warm, capable, not arrogant.`,
  'profile-headline': (ctx) =>
    `Improve this professional headline to under 80 characters for UK work: "${ctx.headline ?? ''}". Return only the headline.`,
  'profile-skills': (ctx) =>
    `Suggest 8 comma-separated job-relevant skills for: ${ctx.headline ?? 'UK worker'}. No numbering.`,
  'profile-business-desc': (ctx) =>
    `Write a short business description (60-90 words) for ${ctx.businessName ?? 'a UK small business'}, category ${ctx.category ?? ''}, services: ${(ctx.services as string[])?.join(', ') ?? ''}.`,
  'profile-services': (ctx) =>
    `Improve this services list for a UK small business, one service per line:\n${(ctx.services as string[])?.join('\n') ?? ''}`,
  'profile-career-tips': () =>
    'Give 4 bullet points of practical UK career growth tips for a job seeker using JobAZ.',
  'profile-business-tips': () =>
    'Give 4 bullet points to grow a small UK business using social pulse and local visibility.',
}

/** Profile AI — tries Ollama local feature, falls back to rule-based text */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const feature = typeof body.feature === 'string' ? body.feature : 'profile-about'
    const ctx = (body.context ?? {}) as Record<string, unknown>
    const fallback =
      typeof body.ruleBasedFallback === 'string' ? body.ruleBasedFallback : ''

    const promptFn = PROMPTS[feature]
    const prompt = promptFn ? promptFn(ctx) : String(ctx.bio ?? '')

    const ollamaUp = await isOllamaAvailable()
    if (ollamaUp) {
      try {
        const result = await runLocalFeature('dashboard-insights', {
          ruleBasedFallback: prompt,
          weeklyFocus: prompt.slice(0, 200),
        })
        if (result.text?.trim()) {
          return NextResponse.json({
            ok: true,
            text: result.text.trim(),
            provider: result.provider,
          })
        }
      } catch {
        /* fallback below */
      }
    }

    return NextResponse.json({
      ok: true,
      text: fallback || 'Add more profile details for better AI suggestions.',
      provider: 'rules',
      ollamaAvailable: ollamaUp,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Profile AI failed' },
      { status: 500 }
    )
  }
}
