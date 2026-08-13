'use client'

/**
 * Extra Income training cards — Apply Now only with real referral URL.
 */

import { useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, ExternalLink, GraduationCap, Search, Shield } from 'lucide-react'
import type { ExtraIncomeCourseCard } from '@/lib/career-engine/extra-income/library'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import { trackGoogleCourseSearchClick } from '@/lib/recommendations/trackGoogleSearch'
import { cn } from '@/lib/utils'

function TrainingCardRow({
  card,
  category,
  option,
}: {
  card: ExtraIncomeCourseCard
  category?: string
  option?: string
}) {
  const [saved, setSaved] = useState(false)
  const hasReferral = Boolean(card.referralUrl?.trim())
  const hasOfficial = Boolean(card.officialUrl?.trim())
  const isCheck = card.is_check_not_course || card.training_status === 'checks'

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {isCheck ? (
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          ) : (
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">{card.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {card.whyRecommended || 'Useful for this Extra Income route.'}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium',
            isCheck
              ? 'border-amber-500/40 bg-amber-950/30 text-amber-100'
              : hasReferral
                ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-100'
                : 'border-amber-500/40 bg-amber-950/30 text-amber-100'
          )}
        >
          {card.status_label || card.badge}
        </span>
      </div>

      {card.statusMessage && (!hasReferral || isCheck) ? (
        <p className="mt-2 text-[11px] text-slate-500">{card.statusMessage}</p>
      ) : null}

      {!isCheck ? (
      <div className="mt-3 flex flex-wrap gap-2">
        {hasReferral ? (
          <button
            type="button"
            onClick={() => {
              openCourseApply(
                {
                  id: card.publishedCourseId ?? card.id,
                  title: card.title,
                  referralUrl: card.referralUrl,
                  officialUrl: card.officialUrl,
                },
                'extra_income_result',
                'apply_now'
              )
              void trackJazEvent({
                event_type: 'course_apply_clicked',
                event_source: 'extra_income_result',
                goal_path: 'extra_income',
                course_id: card.opportunityId || card.id,
                metadata: { title: card.title, category, option },
              })
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            Apply Now
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setSaved(true)
                void trackJazEvent({
                  event_type: 'course_save_interest_clicked',
                  event_source: 'extra_income_result',
                  goal_path: 'extra_income',
                  course_id: card.opportunityId || card.id,
                  metadata: { title: card.title, category, option },
                })
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
              {saved ? 'Interest saved' : 'Save interest'}
            </button>
            {card.googleSearchUrl ? (
              <button
                type="button"
                onClick={() => {
                  void trackGoogleCourseSearchClick({
                    courseOpportunityId: card.opportunityId,
                    publishedCourseId: card.publishedCourseId,
                    title: card.title,
                    suggestedSearchKeywords: card.suggestedSearchKeywords,
                    source: 'extra_income_result',
                  })
                  window.open(card.googleSearchUrl, '_blank', 'noopener,noreferrer')
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                <Search className="h-3.5 w-3.5" aria-hidden />
                Search courses later
              </button>
            ) : (
              <Link
                href="/courses"
                className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                Search courses later
              </Link>
            )}
            {!hasOfficial ? (
              <span className="inline-flex min-h-9 items-center rounded-lg px-2 text-[11px] text-amber-200/90">
                Coming soon on JobAZ
              </span>
            ) : (
              <a
                href={card.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                View official page
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </>
        )}
      </div>
      ) : null}
    </article>
  )
}

export function ExtraIncomeCourseSection({
  title,
  description,
  cards,
  category,
  option,
}: {
  title: string
  description?: string
  cards: ExtraIncomeCourseCard[]
  category?: string
  option?: string
}) {
  if (!cards.length) return null
  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">
          {title}
          <span className="ml-2 font-normal text-slate-500">({cards.length})</span>
        </h2>
        {description ? <p className="mt-0.5 text-[11px] text-slate-500">{description}</p> : null}
      </div>
      <div className="grid gap-2">
        {cards.map((card) => (
          <TrainingCardRow
            key={`${card.training_status}-${card.id}`}
            card={card}
            category={category}
            option={option}
          />
        ))}
      </div>
    </div>
  )
}
