'use client'

/**
 * Learning recommendations for WIE public results.
 * Grouped by trainingItemType. Apply Now only when a real referral_url exists.
 * Provider-missing messaging only for provider-eligible types.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookmarkPlus, CheckCircle2, ExternalLink, GraduationCap, Search } from 'lucide-react'
import type {
  WieTrainingCard,
  WieTrainingRecommendations,
} from '@/lib/career-engine/work-in-education/course-alignment'
import {
  groupTrainingCardsByItemType,
  type WieTrainingItemType,
} from '@/lib/career-engine/work-in-education/course-alignment/training-item-type'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import { trackGoogleCourseSearchClick } from '@/lib/recommendations/trackGoogleSearch'
import { cn } from '@/lib/utils'

type Props = {
  training: WieTrainingRecommendations
  field?: string
  specialism?: string
}

function statusTone(status: WieTrainingCard['training_status']): string {
  if (status === 'already_completed') return 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
  if (status === 'provider_not_listed') return 'border-amber-500/40 bg-amber-950/30 text-amber-100'
  if (status === 'professional_regulated') return 'border-rose-500/40 bg-rose-950/30 text-rose-100'
  if (status === 'optional_boosters') return 'border-slate-500/40 bg-slate-900/50 text-slate-300'
  if (status === 'recommended_next') return 'border-cyan-500/40 bg-cyan-950/30 text-cyan-100'
  return 'border-slate-600/40 bg-slate-900/40 text-slate-300'
}

function typeCtas(type: WieTrainingItemType): { primary: string; secondary: string } {
  switch (type) {
    case 'skill':
      return { primary: 'Add to development plan', secondary: 'Find training' }
    case 'career_preparation':
      return { primary: 'Start preparation', secondary: 'Save to plan' }
    case 'knowledge_area':
      return { primary: 'Learn more', secondary: 'Add to plan' }
    default:
      return { primary: 'Save interest', secondary: 'Search courses later' }
  }
}

function TrainingCardRow({
  card,
  field,
  specialism,
}: {
  card: WieTrainingCard
  field?: string
  specialism?: string
}) {
  const [saved, setSaved] = useState(false)
  const hasReferral = Boolean(card.referralUrl?.trim())
  const hasOfficial = Boolean(card.officialUrl?.trim())
  const completed = card.already_completed || card.training_status === 'already_completed'
  const itemType = card.training_item_type ?? 'knowledge_area'
  const providerEligible = card.provider_eligible ?? false
  const showProviderMissing =
    providerEligible &&
    (card.training_status === 'provider_not_listed' ||
      /provider not listed/i.test(card.status_label || '') ||
      /provider not listed/i.test(card.statusMessage || ''))
  const ctas = typeCtas(itemType)

  const handleApply = () => {
    if (!hasReferral) return
    openCourseApply(
      {
        id: card.publishedCourseId ?? card.id,
        title: card.title,
        referralUrl: card.referralUrl,
        officialUrl: card.officialUrl,
      },
      'education_path_result',
      'apply_now'
    )
    void trackJazEvent({
      event_type: 'wie_course_apply_clicked',
      event_source: 'work_in_education_result',
      goal_path: 'work_in_education',
      course_id: card.opportunityId || card.id,
      metadata: { title: card.title, field, specialism, training_item_type: itemType },
    })
  }

  const handleSaveInterest = () => {
    setSaved(true)
    void trackJazEvent({
      event_type: 'wie_course_save_interest_clicked',
      event_source: 'work_in_education_result',
      goal_path: 'work_in_education',
      course_id: card.opportunityId || card.id,
      metadata: {
        title: card.title,
        field,
        specialism,
        training_status: card.training_status,
        training_item_type: itemType,
      },
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
      source: 'education_path_result',
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100">{card.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {card.whyRecommended || 'Useful next step for this pathway.'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            {card.training_item_type_label || 'Knowledge area'}
          </span>
          <span
            className={cn(
              'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium',
              statusTone(card.training_status)
            )}
          >
            {completed
              ? 'Already completed'
              : showProviderMissing
                ? 'Provider not listed yet'
                : card.status_label || card.badge}
          </span>
        </div>
      </div>

      {showProviderMissing && !completed ? (
        <p className="mt-2 text-[11px] text-slate-500">
          {card.statusMessage || 'Coming soon on JobAZ — save interest or search courses later.'}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {completed ? (
          <>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 text-xs font-medium text-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              Completed
            </span>
            <Link
              href="/cv-builder-v2"
              className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
            >
              Use in CV
            </Link>
          </>
        ) : hasReferral && providerEligible ? (
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            Apply Now
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : !providerEligible ? (
          <>
            <button
              type="button"
              onClick={handleSaveInterest}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
              {saved ? 'Saved' : ctas.primary}
            </button>
            {card.googleSearchUrl ? (
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                <Search className="h-3.5 w-3.5" aria-hidden />
                {ctas.secondary}
              </button>
            ) : (
              <Link
                href="/career-assistant"
                className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                {ctas.secondary}
              </Link>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSaveInterest}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
              {saved ? 'Interest saved' : ctas.primary}
            </button>
            {card.googleSearchUrl ? (
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                <Search className="h-3.5 w-3.5" aria-hidden />
                {ctas.secondary}
              </button>
            ) : (
              <Link
                href="/courses"
                className="inline-flex min-h-9 items-center rounded-lg border border-white/15 px-3 text-xs font-medium text-slate-100 hover:bg-white/5"
              >
                {ctas.secondary}
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
  emptyHide = true,
}: {
  title: string
  description: string
  cards: WieTrainingCard[]
  field?: string
  specialism?: string
  emptyHide?: boolean
}) {
  if (emptyHide && cards.length === 0) return null
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
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-3 py-2 text-xs text-slate-500">
          None for this pathway yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {cards.map((card) => (
            <TrainingCardRow
              key={`${card.training_status}-${card.training_item_type}-${card.id}`}
              card={card}
              field={field}
              specialism={specialism}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function WieTrainingSection({ training, field, specialism }: Props) {
  const openCards = useMemo(() => {
    const merged = [
      ...training.recommended_next,
      ...training.optional_boosters,
      ...training.provider_not_listed,
    ]
    const seen = new Set<string>()
    return merged.filter((c) => {
      const key = c.id || c.title
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [training])

  const grouped = useMemo(() => groupTrainingCardsByItemType(openCards), [openCards])

  useEffect(() => {
    const missing = openCards.filter(
      (c) =>
        c.provider_eligible &&
        (c.commercialStatus === 'no_link' || c.training_status === 'provider_not_listed')
    )
    for (const card of missing.slice(0, 5)) {
      void trackJazEvent({
        event_type: 'wie_missing_provider_logged',
        event_source: 'work_in_education_result_view',
        goal_path: 'work_in_education',
        course_id: card.opportunityId || card.id,
        metadata: {
          title: card.title,
          field,
          specialism,
          training_item_type: card.training_item_type,
        },
      })
    }
  }, [openCards, field, specialism])

  const hasAny =
    training.already_completed.length +
      openCards.length +
      training.professional_regulated.length >
    0

  if (!hasAny && training.course_confidence === 'none') {
    return (
      <section className="space-y-3" aria-label="Learning recommendations">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Learning recommendations</h2>
          <p className="mt-1 text-xs text-slate-400">
            We will suggest learning options as Course Library coverage grows for this pathway.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4" aria-label="Learning recommendations">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">Learning recommendations</h2>
        <p className="mt-1 text-xs text-slate-400">
          Grouped by type — courses, skills, career preparation, and knowledge areas for this pathway.
        </p>
      </div>

      <Bucket
        title="Already completed"
        description="Training you marked as done — we will not push these as your next step."
        cards={training.already_completed}
        field={field}
        specialism={specialism}
        emptyHide={false}
      />
      <Bucket
        title="Courses & qualifications"
        description="Formal courses, qualifications, licences, certifications, and workshops."
        cards={grouped.courses_and_qualifications}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Skills to develop"
        description="Practical skills to build — not always a formal course listing."
        cards={grouped.skills_to_develop}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Career preparation"
        description="Application, CV, and pathway-prep actions that support your next role."
        cards={grouped.career_preparation}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Knowledge areas"
        description="Topics to deepen — useful context, not necessarily a provider course."
        cards={grouped.knowledge_areas}
        field={field}
        specialism={specialism}
      />
      <Bucket
        title="Professional / regulated"
        description="Recognition or registration pathways — review carefully."
        cards={training.professional_regulated}
        field={field}
        specialism={specialism}
      />
    </section>
  )
}
