import { NextRequest, NextResponse } from 'next/server'
import {
  FEATURE_MODEL_MAP,
  FEATURE_ROUTING_GROUPS,
  getAiProviderConfig,
} from '@/lib/jobaz-ai/providers'
import {
  getAiUsageSummary,
  resetAiUsageSummary,
} from '@/lib/jobaz-ai/providers/usageTracker'
import { isOllamaAvailable } from '@/lib/jobaz-ai/providers/ollama'

export const dynamic = 'force-dynamic'

function isDevAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_OLLAMA_DEBUG === 'true'
}

/**
 * Development-only AI usage summary — OpenAI vs Ollama call counts and cost buckets.
 * GET  /api/debug/ai-usage
 * POST /api/debug/ai-usage { "reset": true }
 */
export async function GET() {
  if (!isDevAllowed()) {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 })
  }

  const config = getAiProviderConfig()
  const ollamaAvailable = await isOllamaAvailable()
  const summary = getAiUsageSummary()

  return NextResponse.json({
    ok: true,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      preferredProvider: config.preferredProvider,
      fallbackEnabled: config.fallbackEnabled,
      openaiFastModel: config.openai.fastModel,
      openaiQualityModel: config.openai.qualityModel,
      ollamaModel: config.ollama.localModel,
      ollamaAvailable,
    },
    usage: summary,
    routing: {
      groups: FEATURE_ROUTING_GROUPS,
      map: FEATURE_MODEL_MAP,
    },
    costLegend: {
      free: 'Ollama / local tier (no API cost)',
      low: 'OpenAI fast tier (gpt-4o-mini class)',
      high: 'OpenAI quality tier (gpt-4o class)',
    },
  })
}

export async function POST(req: NextRequest) {
  if (!isDevAllowed()) {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  if (body.reset === true) {
    resetAiUsageSummary()
  }

  return NextResponse.json({ ok: true, usage: getAiUsageSummary() })
}
