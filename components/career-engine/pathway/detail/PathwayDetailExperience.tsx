'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import UkCareerBackground from '@/components/uk-career-assistant/UkCareerBackground'
import {
  buildMatchExplanationFromContext,
  fetchPathwayDetail,
  type PathwayDetailResponse,
  type PathwayMatchContextPayload,
} from '@/lib/career-engine/pathway-knowledge'
import {
  findRoleCardInResultHandoff,
  loadPathwayMatchContext,
  loadPublicResultHandoff,
} from '@/lib/career-engine/work-in-education/wizard/session'
import { PathwayHero } from './PathwayHero'
import { PathwayEligibilitySummary } from './PathwayEligibilitySummary'
import { PathwayOverview } from './PathwayOverview'
import { PathwayRequirements } from './PathwayRequirements'
import { PathwaySkills } from './PathwaySkills'
import { PathwayProgression } from './PathwayProgression'
import { PathwaySalary } from './PathwaySalary'
import { PathwayLearningOptions } from './PathwayLearningOptions'
import { PathwayDetailActions } from './PathwayActions'
import { PathwayDataNotice } from './PathwayDataNotice'

const RESULTS_HREF = '/career-assistant/work-in-my-education/result'

type Props = {
  roleId: string
}

function resolveLocalMatchContext(roleId: string): PathwayMatchContextPayload | null {
  const saved = loadPathwayMatchContext(roleId)
  if (saved) return saved

  const card = findRoleCardInResultHandoff(roleId)
  if (!card) return null

  return {
    role_id: card.pathway_id,
    title: card.title,
    field_name: card.field_name,
    specialism_name: card.specialism_name,
    stage_label: card.stage_label,
    category: card.category,
    eligibility_label: card.eligibility_label,
    match_score: card.match_score,
    lead_in: card.lead_in,
    why: card.why.map((text) => {
      const lower = text.toLowerCase()
      const kind: 'positive' | 'gap' | 'warning' =
        lower.includes('review') || lower.includes('may need')
          ? 'warning'
          : lower.includes('more ') ||
              lower.includes('required') ||
              lower.includes('missing') ||
              lower.includes('may not')
            ? 'gap'
            : 'positive'
      return { kind, text }
    }),
    requirements: card.requirements,
    next_step: card.next_step,
    saved_at: new Date().toISOString(),
  }
}

export function PathwayDetailExperience({ roleId }: Props) {
  const [detail, setDetail] = useState<PathwayDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hasResultsHandoff, setHasResultsHandoff] = useState(false)

  useEffect(() => {
    setHasResultsHandoff(Boolean(loadPublicResultHandoff()?.result))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPathwayDetail(roleId)
        if (cancelled) return

        // Merge assessment match context client-side (session) — display only.
        const localCtx = resolveLocalMatchContext(roleId)
        if (data.found && localCtx) {
          const match = buildMatchExplanationFromContext(localCtx)
          setDetail({
            ...data,
            match,
            provenance: {
              ...data.provenance,
              match_context_source: 'assessment_session',
            },
          })
        } else {
          setDetail(data)
        }
        if (!data.found) {
          setError(
            data.error_code === 'invalid_id'
              ? 'That pathway link is not valid.'
              : 'We could not find this pathway in the Career Knowledge Library.'
          )
        }
      } catch {
        if (!cancelled) {
          setError('Pathway details could not be loaded right now.')
          setDetail(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [roleId])

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-100">
      <UkCareerBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:py-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={hasResultsHandoff ? RESULTS_HREF : '/career-engine/work-in-education'}
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {hasResultsHandoff ? 'Back to results' : 'Work in My Education'}
          </Link>
          <Link href="/uk-career-assistant" className="text-xs text-slate-500 hover:text-slate-300">
            Career Assistant
          </Link>
        </div>

        <p className="text-[11px] uppercase tracking-wider text-violet-300/80">
          Career Assistant · Pathway detail
        </p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading pathway from Career Knowledge Library…
          </div>
        ) : null}

        {!loading && (error || !detail?.found || !detail.role || !detail.knowledge) ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-xl font-semibold text-white">Pathway unavailable</h1>
            <p className="text-sm text-slate-300">
              {error || 'This role could not be found in the Career Knowledge Library.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {hasResultsHandoff ? (
                <Link
                  href={RESULTS_HREF}
                  className="inline-flex min-h-11 items-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Return to results
                </Link>
              ) : null}
              <Link
                href="/career-engine/work-in-education"
                className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white"
              >
                Restart assessment
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && detail?.found && detail.role && detail.knowledge ? (
          <div className="space-y-5">
            <PathwayHero role={detail.role} match={detail.match} />
            <PathwayEligibilitySummary
              match={detail.match}
              regulated={detail.role.is_regulated}
            />
            <PathwayOverview knowledge={detail.knowledge} />
            <PathwayRequirements
              role={detail.role}
              knowledge={detail.knowledge}
              extraRequirements={detail.match?.requirements_still_needed ?? []}
            />
            <PathwaySkills knowledge={detail.knowledge} />
            <PathwayProgression role={detail.role} knowledge={detail.knowledge} />
            <PathwaySalary knowledge={detail.knowledge} />
            <PathwayLearningOptions knowledge={detail.knowledge} />
            <PathwayDetailActions
              role={detail.role}
              resultsHref={hasResultsHandoff ? RESULTS_HREF : undefined}
            />
            <PathwayDataNotice provenance={detail.provenance} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
