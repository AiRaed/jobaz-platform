'use client'

/**
 * Training & Licences for Work in My Profession results.
 * Apply Now only when a real referral_url exists.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, ExternalLink, GraduationCap, Search, Shield } from 'lucide-react'
import type {
  WipTrainingCard,
  WipTrainingRecommendations,
} from '@/lib/career-engine/work-in-profession/course-alignment'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import { trackGoogleCourseSearchClick } from '@/lib/recommendations/trackGoogleSearch'
import { cn } from '@/lib/utils'

type Props = {
  training: WipTrainingRecommendations
  field?: string
  specialism?: string
}

function statusTone(status: WipTrainingCard['training_status']): string {
  if (status === 'checks') return 'border-amber-500/40 bg-amber-950/30 text-amber-100'
  if (status === 'provider_not_listed') return 'border-amber-500/40 bg-amber-950/30 text-amber-100'
  if (status === 'required_licence') return 'border-rose-500/40 bg-rose-950/30 text-rose-100'
  if (status === 'useful_boosters') return 'border-slate-500/40 bg-slate-900/50 text-slate-300'
  if (status === 'recommended_next') return 'border-cyan-500/40 bg-cyan-950/30 text-cyan-100'
  return 'border-slate-600/40 bg-slate-900/40 text-slate-300'
}

function TrainingCardRow({
  card,
  field,
  specialism,
}: {
  card: WipTrainingCard
  field?: string
  specialism?: string
}) {
  const [saved, setSaved] = useState(false)
  const hasReferral = Boolean(card.referralUrl?.trim())
  const hasOfficial = Boolean(card.officialUrl?.trim())
  const isCheck = card.is_check_not_course || card.training_status === 'checks'

  const handleApply = () => {
    if (!hasReferral || isCheck) return
    openCourseApply(
      {
        id: card.publishedCourseId ?? card.id,
        title: card.title,
        referralUrl: card.referralUrl,
        officialUrl: card.officialUrl,
      },
      'profession_path_result',
      'apply_now'
    )
    void trackJazEvent({
      event_type: 'course_apply_clicked',
      event_source: 'work_in_profession_result',
      goal_path: 'work_in_profession',
      course_id: card.opportunityId || card.id,
      metadata: { title: card.title, field, specialism },
    })
  }

  const handleSaveInterest = () => {
    setSaved(true)
    void trackJazEvent({
      event_type: 'course_save_interest_clicked',
      event_source: 'work_in_profession_result',
      goal_path: 'work_in_profession',
      course_id: card.opportunityId || card.id,
      metadata: { title: card.title, field, specialism, training_status: card.training_status },
    })
  }

  const handleSearch = () => {
    const url = card.googleSearchUrl
    if (!url) return
    void trackGoogleCourseSearchClick({
      courseOpportunityId: card.opportunityId,
      publishedCourseId: card.publishedCourseId,
      title: card.title,
      suggestedSearchKeywords: card.suggestedSearchKeywords,
      source: 'profession_path_result',
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

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
              {card.whyRecommended || 'Useful next step for this profession route.'}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium',
            statusTone(card.training_status)
          )}
        >
          {card.status_label || card.badge}
        </span>
      </div>

      {card.statusMessage ? (
        <p className="mt-2 text-[11px] text-slate-500">{card.statusMessage}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {isCheck ? (
          <span className="inline-flex min-h-9 items-center rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 text-xs font-medium text-amber-100">
            Check / requirement — not a course Apply Now
          </span>
        ) : hasReferral ? (
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            Apply Now
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSaveInterest}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
              {saved ? 'Interest saved' : 'Save interest'}
            </button>
            {card.googleSearchUrl ? (
              <button
                type="button"
                onClick={handleSearch}
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
    </article>
  )
}

function Bucket({
  title,
  description,
  cards,
  field,
  specialism,
}: {
  title: string
  description: string
  cards: WipTrainingCard[]
  field?: string
  specialism?: string
}) {
  if (cards.length === 0) return null
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {title}
          <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">
            ({cards.length})
          </span>
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
      </div>
      <div className="grid gap-2">
        {cards.map((card) => (
          <TrainingCardRow
            key={`${card.training_status}-${card.id}`}
            card={card}
            field={field}
            specialism={specialism}
          />
        ))}
      </div>
    </div>
  )
}

export function WipTrainingSection({ training, field, specialism }: Props) {
  useEffect(() => {
    for (const card of training.provider_not_listed.slice(0, 5)) {
      void trackJazEvent({
        event_type: 'course_missing_affiliate_detected',
        event_source: 'work_in_profession_result_view',
        goal_path: 'work_in_profession',
        course_id: card.opportunityId || card.id,
        metadata: { title: card.title, field, specialism },
      })
    }
  }, [training, field, specialism])

  const hasAny =
    training.required_licence.length +
      training.recommended_next.length +
      training.useful_boosters.length +
      training.checks.length +
      training.provider_not_listed.length >
    0

  if (!hasAny) {
    return (
      <section className="space-y-3" aria-label="Training and licences">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Training & licences</h2>
          <p className="mt-1 text-xs text-slate-400">
            Training and licence recommendations will be added as Course Library coverage grows for
            this profession route.
          </p>
        </div>
      </section>
    )
  }

  const comingSoon = (() => {
    const seen = new Set(
      [
        ...training.required_licence,
        ...training.checks,
        ...training.recommended_next,
        ...training.useful_boosters,
      ].map((c) => c.title.trim().toLowerCase().replace(/\s+/g, ' '))
    )
    return training.provider_not_listed.filter((c) => {
      const key = c.title.trim().toLowerCase().replace(/\s+/g, ' ')
      return key && !seen.has(key)
    })
  })()

  return (
    <section className="space-y-4" aria-label="Training and licences">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">Training & licences</h2>
        <p className="mt-1 text-xs text-slate-400">
          Based on your profession, specialism, and experience. Apply Now only appears when a real
          JobAZ partner link exists.
        </p>
      </div>

      <Bucket
        title="Required licence / check"
        description="Licences and checks commonly needed for this route."
        cards={[...training.required_licence, ...training.checks]}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Recommended next"
        description="Highest-value training for this profession path."
        cards={training.recommended_next}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Useful boosters"
        description="Optional extras that can strengthen applications."
        cards={training.useful_boosters}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Need provider / Coming soon"
        description="Recommended course types without a JobAZ partner yet — save interest or search later."
        cards={comingSoon}
        field={field}
        specialism={specialism}
      />
    </section>
  )
}
