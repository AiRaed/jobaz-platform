'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import UkCareerBackground from '@/components/uk-career-assistant/UkCareerBackground'
import { PublicResultExperience } from '@/components/career-engine/work-in-education/wizard/PublicResultExperience'
import type { PublicWieAssessmentResult } from '@/lib/career-engine/work-in-education/public-contract'
import {
  clearPublicResultHandoff,
  loadPublicResultHandoff,
} from '@/lib/career-engine/work-in-education/wizard/session'

/**
 * Career Assistant result route for knowledge-engine Work in My Education.
 * Hydrates from session handoff or signed result token (no answers in URL).
 */
export default function WorkInMyEducationResultPage() {
  const [result, setResult] = useState<PublicWieAssessmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function hydrate() {
      try {
        const handoff = loadPublicResultHandoff()
        if (handoff?.result && typeof handoff.result === 'object') {
          if (alive) setResult(handoff.result as PublicWieAssessmentResult)
          return
        }

        const token = handoff?.result_token
        if (!token) {
          if (alive) setError('No results found for this session.')
          return
        }

        const res = await fetch(
          `/api/career-assistant/work-in-my-education/result?token=${encodeURIComponent(token)}`
        )
        const data = await res.json()
        if (!alive) return

        if (!res.ok) {
          setExpired(data.code === 'token_expired')
          setError(data.error || 'Could not restore your results.')
          return
        }
        setResult(data.result as PublicWieAssessmentResult)
      } catch {
        if (alive) setError('Could not restore your results. Please try again.')
      } finally {
        // Always clear loading for the active mount. Skipping this under React Strict Mode
        // cleanup races left the page on “Loading your results…” forever.
        if (alive) setLoading(false)
      }
    }

    void hydrate()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-100">
      <UkCareerBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <p className="mb-4 text-[11px] uppercase tracking-wider text-violet-300/80">
          Career Assistant · Your results
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading your results…
          </div>
        ) : null}

        {!loading && result ? (
          <PublicResultExperience
            result={{
              ...result,
              recommendations: {
                available_now: result.recommendations?.available_now ?? [],
                realistic_next: result.recommendations?.realistic_next ?? [],
                future_options: result.recommendations?.future_options ?? [],
                academic_research: result.recommendations?.academic_research ?? [],
                requirements_needed: result.recommendations?.requirements_needed ?? [],
              },
            }}
            onStartAgain={() => {
              clearPublicResultHandoff()
              void import('@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession').then((m) =>
                m.clearAddToPlanSessionState()
              )
              window.location.assign('/career-engine/work-in-education')
            }}
          />
        ) : null}

        {!loading && !result ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-xl font-semibold text-white">
              {expired ? 'Results expired' : 'Results unavailable'}
            </h1>
            <p className="text-sm text-slate-300">
              {error ||
                (expired
                  ? 'Your results have expired for privacy. Start the assessment again to continue.'
                  : 'We could not find your results for this session.')}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/career-engine/work-in-education"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Restart assessment
              </Link>
              <Link
                href="/uk-career-assistant"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white"
              >
                Return to Career Assistant
              </Link>
              <Link
                href="/career-engine/work-in-education?legacy=1"
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200"
              >
                Classic flow
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
