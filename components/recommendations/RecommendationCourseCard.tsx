'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookmarkPlus, ExternalLink, GraduationCap, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'
import { trackGoogleCourseSearchClick } from '@/lib/recommendations/trackGoogleSearch'

type Props = {
  card: RecommendationCourseCardData
  source?: 'career_coach_result' | 'education_path_result' | 'uk_career_assistant'
  className?: string
  compact?: boolean
}

function badgeClass(badge: string): string {
  if (badge === 'JobAZ Partner') return 'border-emerald-500/40 bg-emerald-950/35 text-emerald-300'
  if (badge === 'Official course link') return 'border-cyan-500/40 bg-cyan-950/35 text-cyan-300'
  return 'border-violet-500/40 bg-violet-950/35 text-violet-300'
}

export default function RecommendationCourseCard({
  card,
  source = 'career_coach_result',
  className,
  compact,
}: Props) {
  const [saved, setSaved] = useState(false)
  const hasReferral = Boolean(card.referralUrl?.trim())
  const hasOfficial = Boolean(card.officialUrl?.trim())
  const showApplyNow = hasReferral
  const showViewCourse = hasOfficial && !hasReferral
  const showGoogleSearch = !hasReferral && !hasOfficial

  const handleApply = () => {
    openCourseApply(
      {
        id: card.publishedCourseId ?? card.id,
        title: card.title,
        referralUrl: card.referralUrl,
        officialUrl: card.officialUrl,
      },
      source,
      showApplyNow ? 'apply_now' : 'view_details'
    )
  }

  const handleViewCourse = () => {
    if (!card.officialUrl) return
    window.open(card.officialUrl, '_blank', 'noopener,noreferrer')
  }

  const handleGoogleSearch = () => {
    const url = card.googleSearchUrl
    if (!url) return
    void trackGoogleCourseSearchClick({
      courseOpportunityId: card.opportunityId,
      publishedCourseId: card.publishedCourseId,
      title: card.title,
      suggestedSearchKeywords: card.suggestedSearchKeywords,
      source,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleAddToRoadmap = () => {
    upsertCareerPlanItem({
      courseName: card.title,
      courseSlug: card.slug ?? card.title.toLowerCase().replace(/\s+/g, '-'),
      pathId: 'work-in-education',
      routeLabel: 'Work in my Education',
      status: 'saved',
      source: 'ai_assessment',
      priority: card.priority,
      courseId: card.publishedCourseId,
      referralUrl: card.referralUrl,
      affiliateUrl: card.referralUrl,
    })
    setSaved(true)
  }

  const detailHref =
    card.slug && card.publishedCourseId
      ? `/career-hub/work-in-education/courses/${card.slug}`
      : null

  return (
    <article
      className={cn(
        'rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 transition hover:border-cyan-500/25',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <GraduationCap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 leading-snug">{card.title}</h3>
            {card.bestFor && !compact && (
              <p className="text-[10px] text-slate-500 mt-0.5">Best for: {card.bestFor}</p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
            badgeClass(card.badge)
          )}
        >
          {card.badge}
        </span>
      </div>

      {card.shortDescription && (
        <p className="text-xs text-slate-400 leading-relaxed">{card.shortDescription}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-2">
        {card.level && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-slate-600/50 text-slate-400">
            {card.level}
          </span>
        )}
        {card.purpose && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-slate-600/50 text-slate-400">
            {card.purpose}
          </span>
        )}
        {card.duration && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-slate-600/50 text-slate-400">
            {card.duration}
          </span>
        )}
      </div>

      <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wide">Why recommended</p>
      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{card.whyRecommended}</p>

      {card.publicOfferLabel && showApplyNow && (
        <p className="text-[11px] text-emerald-300/90 mt-2">{card.publicOfferLabel}</p>
      )}

      {card.statusMessage && (
        <p className="text-[11px] text-slate-500 mt-2 leading-snug">{card.statusMessage}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {showApplyNow && (
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-emerald-500 hover:to-cyan-500 transition"
          >
            Apply Now <ExternalLink className="w-3 h-3" />
          </button>
        )}

        {showViewCourse && (
          <button
            type="button"
            onClick={handleViewCourse}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/25 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-950/40 transition"
          >
            View Course <ExternalLink className="w-3 h-3" />
          </button>
        )}

        {showGoogleSearch && (
          <button
            type="button"
            onClick={handleGoogleSearch}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-950/25 px-3 py-1.5 text-xs font-semibold text-violet-200 hover:bg-violet-950/40 transition"
          >
            Search on Google <Search className="w-3 h-3" />
          </button>
        )}

        {card.canAddToRoadmap && (
          <button
            type="button"
            onClick={handleAddToRoadmap}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 transition"
          >
            <BookmarkPlus className="w-3 h-3" />
            {saved ? 'Added to roadmap' : 'Add to roadmap'}
          </button>
        )}

        {(showApplyNow || showViewCourse) && detailHref && (
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 ml-auto"
          >
            View Details <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </article>
  )
}
