'use client'

import { useMemo, useState } from 'react'
import type { WorkInEducationAssessmentResult } from '@/lib/career-engine/work-in-education'
import { fitSectionTitle } from '@/lib/career-engine/work-in-education/wizard'
import { NextActionCard } from './NextActionCard'
import { RecommendationCard } from './RecommendationCard'
import { ResultHeader } from './ResultHeader'
import { WarningCard } from './WarningCard'

type Props = {
  result: WorkInEducationAssessmentResult
}

export function ResultExperience({ result }: Props) {
  const [showFuture, setShowFuture] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [showAcademic, setShowAcademic] = useState(false)

  const recs = result.recommendations
  const matched =
    result.summary.primary_direction ||
    result.summary.matched_education ||
    result.profile?.subject ||
    'Your pathway'

  const summaryLines = useMemo(
    () => (result.presentation?.summary_items || []).map((s) => s.text),
    [result.presentation?.summary_items]
  )

  const userWarnings = (result.warnings ?? []).filter(
    (w) =>
      !/draft library/i.test(w) &&
      !/stripped unknown/i.test(w) &&
      !/Field\/specialism resolution/i.test(w)
  )

  return (
    <div className="space-y-6">
      <ResultHeader
        headline={result.presentation?.headline || matched}
        matchedLabel={matched}
        confidence={result.resolution?.confidence ?? 0}
        needsClarification={Boolean(result.clarification?.required)}
        summaryLines={summaryLines}
      />

      {userWarnings.map((w) => (
        <WarningCard key={w} message={w} />
      ))}

      {result.next_actions.length > 0 && (
        <section aria-labelledby="next-actions-heading" className="space-y-3">
          <h2 id="next-actions-heading" className="text-sm font-semibold text-slate-200">
            Next actions
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.next_actions.map((a) => (
              <NextActionCard key={a.type + a.message_key} type={a.type} text={a.text} />
            ))}
          </div>
        </section>
      )}

      {recs && (
        <>
          <RoleSection
            title={fitSectionTitle('immediate')}
            roles={recs.immediate}
            empty="No immediate opportunities identified from your current answers."
          />
          <RoleSection
            title={fitSectionTitle('realistic_next')}
            roles={recs.realistic_next}
            empty="No realistic next-step roles identified yet."
          />

          {(recs.future_progression.length > 0 || showFuture) && (
            <div className="space-y-3">
              {!showFuture ? (
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                  onClick={() => setShowFuture(true)}
                >
                  Show {fitSectionTitle('future_progression')} ({recs.future_progression.length})
                </button>
              ) : (
                <RoleSection
                  title={fitSectionTitle('future_progression')}
                  roles={recs.future_progression}
                />
              )}
            </div>
          )}

          {(recs.academic_or_research.length > 0 || showAcademic) && (
            <div className="space-y-3">
              {!showAcademic ? (
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                  onClick={() => setShowAcademic(true)}
                >
                  Show {fitSectionTitle('academic_or_research')} ({recs.academic_or_research.length})
                </button>
              ) : (
                <RoleSection
                  title={fitSectionTitle('academic_or_research')}
                  roles={recs.academic_or_research}
                />
              )}
            </div>
          )}

          {(recs.blocked_or_needs_review.length > 0 || showBlocked) && (
            <div className="space-y-3">
              {!showBlocked ? (
                <button
                  type="button"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                  onClick={() => setShowBlocked(true)}
                >
                  Show {fitSectionTitle('blocked_or_needs_review')} (
                  {recs.blocked_or_needs_review.length})
                </button>
              ) : (
                <RoleSection
                  title={fitSectionTitle('blocked_or_needs_review')}
                  roles={recs.blocked_or_needs_review}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RoleSection({
  title,
  roles,
  empty,
}: {
  title: string
  roles: NonNullable<WorkInEducationAssessmentResult['recommendations']>['immediate']
  empty?: string
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="text-sm font-semibold text-slate-200">
        {title}
        {roles.length > 0 ? (
          <span className="ml-2 font-normal text-slate-500">({roles.length})</span>
        ) : null}
      </h2>
      {roles.length === 0 && empty ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="grid gap-3">
          {roles.map((r) => (
            <RecommendationCard key={r.role_id} role={r} />
          ))}
        </div>
      )}
    </section>
  )
}
