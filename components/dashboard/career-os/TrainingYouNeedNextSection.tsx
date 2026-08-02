'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Search } from 'lucide-react'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import { openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { dedupeByCourseIdentity } from '@/lib/dashboard/careerOs/courseDisplayIdentity'
import { isSiaDoorTitle, titlesMatchLoose } from '@/lib/dashboard/careerOs/myPlanDisplayFilter'
import { cn } from '@/lib/utils'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'

type Props = {
  ladder: PathPlanLadder | null | undefined
  fallbackTitles?: string[]
}

function shortTrainingCopy(text?: string): string {
  if (!text?.trim()) return ''
  const cleaned = text.replace(/^Complete\s+/i, '').trim()
  const first = cleaned.split(/[.|!]/)[0]?.trim() || cleaned
  return first.length > 110 ? `${first.slice(0, 107)}…` : first
}

function displayTrainingTitle(raw: string, isSecurity: boolean): string {
  if (isSecurity && isSiaDoorTitle(raw)) return 'SIA Door Supervisor Course'
  return raw
}

/** Upgrade training card + compact add-ons. Display wording only. */
export default function TrainingYouNeedNextSection({ ladder, fallbackTitles = [] }: Props) {
  const isSecurity =
    Boolean(ladder?.isSecurityRoute) || /security/i.test(ladder?.routeLabel ?? '')
  const upgradeRole =
    ladder?.upgradeAfter[0]?.title ||
    (isSecurity ? 'Door Supervisor' : ladder?.trainNext[0]?.title || 'your next role')

  const primaryTitle =
    ladder?.trainNext[0]?.title ??
    ladder?.trainingTitles[0] ??
    fallbackTitles[0]

  const addOnTitles = useMemo(() => {
    const source =
      (ladder?.relevantAddOns?.length ?? 0) > 0
        ? ladder!.relevantAddOns
        : (ladder?.optionalAddOns ?? [])
    const fromLadder = source.map((s) => ({ title: s.title, description: s.description }))
    return dedupeByCourseIdentity(fromLadder).filter(
      (s) => !primaryTitle || !titlesMatchLoose(s.title, primaryTitle)
    )
  }, [ladder, primaryTitle])

  const [primaryCard, setPrimaryCard] = useState<RecommendationCourseCardData | null>(
    () =>
      ladder?.structuredCards.find((c) =>
        primaryTitle ? titlesMatchLoose(c.title, primaryTitle) : false
      ) ?? null
  )

  useEffect(() => {
    if (!primaryTitle) {
      setPrimaryCard(null)
      return
    }
    const existing = ladder?.structuredCards.find((c) => titlesMatchLoose(c.title, primaryTitle))
    if (existing) {
      setPrimaryCard(existing)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/recommendations/resolve-courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles: [primaryTitle], limit: 1 }),
        })
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { cards?: RecommendationCourseCardData[] }
        if (!cancelled) setPrimaryCard(body.cards?.[0] ?? null)
      } catch {
        if (!cancelled) setPrimaryCard(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [primaryTitle, ladder?.structuredCards])

  if (!primaryTitle && addOnTitles.length === 0) return null

  const rawTitle = primaryCard?.title || primaryTitle || 'Recommended training'
  const displayTitle = displayTrainingTitle(rawTitle, isSecurity)
  const referralUrl = (primaryCard?.referralUrl || '').trim()
  const officialUrl = (primaryCard?.officialUrl || '').trim()
  const googleUrl = primaryCard?.googleSearchUrl
  const isPartner = Boolean(referralUrl)
  const isOfficial = Boolean(officialUrl) && !referralUrl
  const detailHref = primaryCard?.slug ? `/courses/${primaryCard.slug}` : null

  const description =
    isSecurity && isSiaDoorTitle(rawTitle)
      ? `Complete this while starting event/security work to unlock ${upgradeRole} and better-paid security roles.`
      : shortTrainingCopy(ladder?.trainNext[0]?.description) ||
        shortTrainingCopy(primaryCard?.shortDescription) ||
        shortTrainingCopy(primaryCard?.whyRecommended) ||
        `Complete this upgrade training to unlock ${upgradeRole} and better-paid roles on your route.`

  const showPartnerBadge =
    isPartner ||
    /partner/i.test(primaryCard?.badge ?? '') ||
    Boolean(primaryCard?.publicOfferLabel)

  const trainingStyles = PLAN_SECTION_STYLES.training
  const addons = PLAN_SECTION_STYLES.addons

  return (
    <section id="recommended-training" className="space-y-3">
      <PlanSectionHeader
        accent="training"
        title="Next Upgrade Training"
        subtitle="The qualification that unlocks your next upgrade role — not required to start work now."
      />

      {primaryTitle && (
        <article
          className={cn(
            'rounded-2xl border p-4 md:p-5 shadow-[0_10px_28px_rgba(76,29,149,0.18)]',
            trainingStyles.border,
            trainingStyles.panel
          )}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {showPartnerBadge && (
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  trainingStyles.chip
                )}
              >
                JobAZ Partner
              </span>
            )}
                            {!showPartnerBadge && primaryCard?.badge && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600/50 dark:bg-slate-900/60 dark:text-slate-400">
                {primaryCard.badge}
              </span>
            )}
            {!isPartner && !isOfficial && (
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600/50 dark:bg-slate-900/50 dark:text-slate-400">
                Course type recommendation
              </span>
            )}
          </div>

          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50 leading-snug">
            {displayTitle}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
            {description}
          </p>
          {!isPartner && !isOfficial && (
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1.5">
              Provider not listed yet — use this as a training target.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {isPartner && (
              <button
                type="button"
                onClick={() => {
                  openCourseApply(
                    {
                      id: primaryCard?.publishedCourseId ?? primaryCard?.id ?? displayTitle,
                      title: displayTitle,
                      referralUrl,
                      officialUrl,
                      route: ladder?.routeLabel ?? null,
                    },
                    'my_plan',
                    'apply_now'
                  )
                  void import('@/lib/dashboard/careerOs/actionPlanProgress').then(
                    ({ ACTION_PLAN_TASK, markActionPlanTask }) => {
                      markActionPlanTask(ACTION_PLAN_TASK.TRAIN_SIA, 'in_progress', {
                        note: 'viewed',
                      })
                    }
                  )
                }}
                className="jobaz-btn-primary w-full"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {isOfficial && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="jobaz-btn-secondary w-full"
              >
                View Course
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {!isPartner && !isOfficial && (
              <button
                type="button"
                onClick={() => {
                  if (googleUrl) window.open(googleUrl, '_blank', 'noopener,noreferrer')
                }}
                className="jobaz-btn-secondary w-full"
              >
                <Search className="w-3.5 h-3.5" />
                Search courses later
              </button>
            )}

            {detailHref ? (
              <Link
                href={detailHref}
                onClick={() => {
                  if (primaryCard?.publishedCourseId || primaryCard?.id) {
                    void import('@/lib/career-hub/marketplace/track').then(({ trackCourseEvent }) =>
                      trackCourseEvent({
                        courseId: primaryCard.publishedCourseId ?? primaryCard.id,
                        source: 'my_plan',
                        action: 'view_details',
                        route: ladder?.routeLabel ?? null,
                      })
                    )
                    void import('@/lib/cv-builder/courseInterest').then(({ recordCourseInterest }) =>
                      recordCourseInterest({
                        courseId: primaryCard.publishedCourseId ?? primaryCard.id,
                        title: displayTitle,
                        status: 'viewed',
                        source: 'my_plan',
                        route: ladder?.routeLabel ?? null,
                      })
                    )
                  }
                }}
                className="jobaz-btn-ghost w-full text-xs"
              >
                View details
              </Link>
            ) : officialUrl && isPartner ? (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="jobaz-btn-ghost w-full text-xs"
              >
                View details
              </a>
            ) : null}
          </div>
        </article>
      )}

      {addOnTitles.length > 0 && (
        <div className="space-y-2">
          <PlanSectionHeader accent="addons" title="Optional add-ons" />
          <ul
            className={cn(
              'divide-y divide-amber-100 dark:divide-amber-900/30 rounded-xl border overflow-hidden',
              addons.border,
              addons.panel
            )}
          >
            {addOnTitles.slice(0, 3).map((item) => (
              <li key={item.title} className="px-3.5 py-2.5">
                <p className="text-sm text-slate-800 dark:text-amber-50/90 leading-snug">
                  {item.title}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!primaryTitle && (
        <Link
          href="/uk-career-assistant"
          className="text-sm font-medium text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
        >
          Open Career Coach to unlock training →
        </Link>
      )}
    </section>
  )
}
