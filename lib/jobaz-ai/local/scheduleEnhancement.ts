/**
 * Client-side scheduler — runs LOCAL AI via server API after rule-based profile updates.
 */

import { supabase } from '@/lib/supabase'
import { memoryDevLog } from '@/lib/jobaz-ai/memory/logger'
import { notifyProfileUpdated } from '@/lib/jobaz-ai/emitSignal'
import type { LocalFeatureId } from '@/lib/jobaz-ai/local/runLocalFeature'

type EnhancementContext = {
  profileId: string
  readinessScore?: number
  weakestArea?: string | null
  strongestArea?: string | null
  dominantGoal?: string | null
  weeklyFocus: string
  nextAction: string
}

async function fetchLocalAi(
  feature: LocalFeatureId,
  context: Omit<EnhancementContext, 'profileId'> & { ruleBasedFallback: string }
): Promise<string | null> {
  const res = await fetch('/api/ai/local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      feature,
      readinessScore: context.readinessScore,
      weakestArea: context.weakestArea,
      strongestArea: context.strongestArea,
      dominantGoal: context.dominantGoal,
      weeklyFocus: context.weeklyFocus,
      nextAction: context.nextAction,
      ruleBasedFallback: context.ruleBasedFallback,
    }),
  })

  if (!res.ok) return null
  const data = (await res.json()) as { ok?: boolean; response?: string }
  return data.ok && data.response?.trim() ? data.response.trim() : null
}

/**
 * Fire-and-forget LOCAL AI enhancement (Ollama → OpenAI FAST fallback).
 * Keeps rule-based values if local AI is unavailable.
 */
export function scheduleLocalAiProfileEnhancement(context: EnhancementContext): void {
  if (typeof window === 'undefined') return

  void (async () => {
    try {
      const [weeklyPlan, coaching] = await Promise.all([
        fetchLocalAi('weekly-plan', {
          ...context,
          ruleBasedFallback: context.weeklyFocus,
        }),
        fetchLocalAi('ai-coaching', {
          ...context,
          ruleBasedFallback: context.nextAction,
        }),
      ])

      const patch: Record<string, string> = {}
      if (weeklyPlan) patch.weekly_focus = weeklyPlan
      if (coaching) patch.next_action = coaching

      if (Object.keys(patch).length === 0) return

      const now = new Date().toISOString()
      const { error } = await supabase
        .from('ai_user_profiles')
        .update({ ...patch, last_ai_update: now, updated_at: now })
        .eq('id', context.profileId)

      if (error) {
        memoryDevLog('Local AI profile enhancement save failed', error)
        return
      }

      notifyProfileUpdated()
    } catch (err) {
      memoryDevLog('Local AI profile enhancement failed', err)
    }
  })()
}
