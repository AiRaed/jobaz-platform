import { NextRequest, NextResponse } from 'next/server'
import { runLocalFeature } from '@/lib/jobaz-ai/local/runLocalFeature'
import {
  generateWithOllama,
  isOllamaAvailable,
  resolveOllamaModelName,
} from '@/lib/jobaz-ai/providers/ollama'
import { aiProvider } from '@/lib/jobaz-ai/providers'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function isDevAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_OLLAMA_DEBUG === 'true'
}

/**
 * Development route to verify Ollama inference and LOCAL feature routing.
 * GET  — quick health + direct generate smoke test
 * POST — run full router path for a LOCAL feature
 */
export async function GET() {
  if (!isDevAllowed()) {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 })
  }

  const startedAt = Date.now()
  const model = resolveOllamaModelName('local')
  const ollamaAvailable = await isOllamaAvailable(model)

  if (!ollamaAvailable) {
    return NextResponse.json({
      ok: false,
      ollamaAvailable: false,
      model,
      message: 'Ollama is not reachable or the configured model is not pulled.',
      hint: 'Run: ollama pull llama3',
    })
  }

  try {
    const direct = await generateWithOllama({
      prompt: 'System:\nYou are JobAZ AI.\n\nUser:\nSay hello in one short sentence.\n\nAssistant:',
      model,
      maxTokens: 64,
      temperature: 0.3,
      feature: 'debug-ollama-test',
    })

    return NextResponse.json({
      ok: true,
      test: 'direct-generate',
      ollamaAvailable: true,
      provider: 'ollama',
      model: direct.model,
      response: direct.text,
      fallbackUsed: false,
      responseTimeMs: direct.latencyMs,
      tokens: direct.tokens,
      totalMs: Date.now() - startedAt,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      ollamaAvailable: true,
      model,
      error: err instanceof Error ? err.message : String(err),
      responseTimeMs: Date.now() - startedAt,
    })
  }
}

export async function POST(req: NextRequest) {
  if (!isDevAllowed()) {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const feature = typeof body.feature === 'string' ? body.feature : 'dashboard-insights'
  const mode = body.mode === 'router' ? 'router' : 'local-feature'

  const startedAt = Date.now()
  const ollamaAvailable = await isOllamaAvailable()

  if (mode === 'router') {
    const result = await aiProvider.generateText({
      feature,
      messages: [
        {
          role: 'system',
          content: 'You are JobAZ AI. Reply in one short encouraging sentence for a UK job seeker.',
        },
        {
          role: 'user',
          content: typeof body.prompt === 'string' ? body.prompt : 'Give me a quick dashboard insight.',
        },
      ],
      maxTokens: 120,
      temperature: 0.5,
    })

    return NextResponse.json({
      ok: true,
      test: 'router',
      feature,
      provider: result.provider,
      model: result.model,
      tier: result.tier,
      response: result.text,
      fallbackUsed: result.fallbackUsed,
      responseTimeMs: result.latencyMs,
      ollamaAvailable,
      totalMs: Date.now() - startedAt,
    })
  }

  const result = await runLocalFeature('dashboard-insights', {
    readinessScore: 52,
    weakestArea: 'Interview confidence',
    strongestArea: 'CV quality',
    dominantGoal: 'find_jobs',
    ruleBasedFallback: 'Focus on interview practice this week.',
  })

  return NextResponse.json({
    ok: true,
    test: 'local-feature',
    feature: 'dashboard-insights',
    provider: result.provider,
    model: result.model,
    tier: result.tier,
    response: result.text,
    fallbackUsed: result.fallbackUsed,
    responseTimeMs: result.latencyMs,
    ollamaAvailable,
    totalMs: Date.now() - startedAt,
  })
}
