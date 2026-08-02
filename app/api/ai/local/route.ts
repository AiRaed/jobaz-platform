import { NextRequest, NextResponse } from 'next/server'
import {
  isLocalFeatureId,
  runLocalFeature,
  type LocalFeatureId,
} from '@/lib/jobaz-ai/local/runLocalFeature'
import { isOllamaAvailable } from '@/lib/jobaz-ai/providers/ollama'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Server-side LOCAL feature execution (Ollama with OpenAI FAST fallback). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const feature = typeof body.feature === 'string' ? body.feature : 'dashboard-insights'

    if (!isLocalFeatureId(feature)) {
      return NextResponse.json(
        { ok: false, error: `Unknown local feature: ${feature}` },
        { status: 400 }
      )
    }

    const context = {
      readinessScore: typeof body.readinessScore === 'number' ? body.readinessScore : undefined,
      weakestArea: typeof body.weakestArea === 'string' ? body.weakestArea : undefined,
      strongestArea: typeof body.strongestArea === 'string' ? body.strongestArea : undefined,
      dominantGoal: typeof body.dominantGoal === 'string' ? body.dominantGoal : undefined,
      weeklyFocus: typeof body.weeklyFocus === 'string' ? body.weeklyFocus : undefined,
      nextAction: typeof body.nextAction === 'string' ? body.nextAction : undefined,
      ruleBasedFallback:
        typeof body.ruleBasedFallback === 'string' ? body.ruleBasedFallback : undefined,
    }

    const ollamaUp = await isOllamaAvailable()
    const result = await runLocalFeature(feature as LocalFeatureId, context)

    return NextResponse.json({
      ok: true,
      feature,
      provider: result.provider,
      model: result.model,
      tier: result.tier,
      response: result.text,
      fallbackUsed: result.fallbackUsed,
      responseTimeMs: result.latencyMs,
      ollamaAvailable: ollamaUp,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Local AI request failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
