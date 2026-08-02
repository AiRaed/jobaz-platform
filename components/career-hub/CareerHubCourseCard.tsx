'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookmarkPlus,
  Building2,
  Check,
  Clock,
  GraduationCap,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import { courseDetailHref } from '@/lib/career-hub/myPlan'
import { canApplyToCourse, openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { trackCourseEvent, type CourseClickSource } from '@/lib/career-hub/marketplace/track'
import { isCourseSaved, saveCourseToPlan } from '@/lib/career-hub/marketplace/savedPlan'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'
import { getCategoryForPathId } from '@/lib/career-hub/routeCategories'
import { courseCardBadges } from '@/lib/admin/courses/publicBadges'
import CoursePurposePill from '@/components/career-hub/marketplace/CoursePurposePill'
import CourseOfferBadge from '@/components/career-hub/marketplace/CourseOfferBadge'
import CourseOfferHelperLine from '@/components/career-hub/marketplace/CourseOfferHelperLine'
import CourseMediaImage from '@/components/career-hub/CourseMediaImage'

type Props = {
  course: CareerHubCourseListing
  featured?: boolean
  inline?: boolean
  compact?: boolean
  onSave?: () => void
  saveLabel?: string
  applySource?: CourseClickSource
  pathwayBadge?: string
  className?: string
}

function applyInputFromListing(course: CareerHubCourseListing) {
  const m = course.marketplace
  return {
    id: course.adminCourseId ?? course.slug,
    title: course.name,
    providerName: m?.providerName ?? course.referralPartner,
    referralUrl: m?.referralUrl ?? course.affiliateUrl,
    providerDefaultReferralUrl: m?.providerDefaultReferralUrl,
    officialUrl: m?.officialUrl ?? course.officialSearchUrl,
  }
}

export default function CareerHubCourseCard({
  course,
  featured,
  inline,
  compact,
  onSave,
  saveLabel = 'Save to Plan',
  applySource = 'course_detail',
  pathwayBadge,
  className,
}: Props) {
  const detailHref = courseDetailHref(course.pathId, course.slug)
  const applyInput = applyInputFromListing(course)
  const canApply = canApplyToCourse(applyInput)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (course.adminCourseId) setSaved(isCourseSaved(course.adminCourseId))
  }, [course.adminCourseId])

  const trackSource = applySource

  const handleSave = () => {
    void trackCourseEvent({
      courseId: applyInput.id,
      source: trackSource,
      action: 'save_to_plan',
    })
    if (course.marketplace) {
      saveCourseToPlan(course.marketplace, 'career_hub')
    }
    upsertCareerPlanItem({
      courseName: course.name,
      courseSlug: course.slug,
      pathId: course.pathId,
      status: 'saved',
      source: 'career_hub',
      priceFrom: course.priceLabel,
      courseId: course.adminCourseId,
    })
    setSaved(true)
    onSave?.()
  }

  const handleApply = () => {
    openCourseApply(applyInput, trackSource, 'apply_now')
  }

  const handleViewDetails = () => {
    void trackCourseEvent({
      courseId: applyInput.id,
      source: trackSource,
      action: 'view_details',
    })
  }

  const showFeatured = featured ?? course.isFeatured
  const provider = course.providerPlaceholder ?? 'Check provider'
  const price = course.priceLabel ?? 'Check provider'
  const durationText = course.duration.replace(/^Duration:\s*/i, '') || 'On request'
  const routeLabel = getCategoryForPathId(course.pathId)?.label ?? course.pathId
  const badges = courseCardBadges(course.publicBadges, pathwayBadge)
  const coursePurpose = course.coursePurpose ?? course.marketplace?.coursePurpose
  const publicOffer = course.publicOffer ?? course.marketplace?.publicOffer
  const showOffer = publicOffer?.visible

  return (
    <article
      className={cn(
        'group rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 h-full',
        compact
          ? [
              /* Same surface language as Courses cards — light in day, dark glass in dark */
              'jobaz-card bg-[var(--jaz-surface)] dark:bg-slate-900/80',
              'border-[var(--jaz-border)] dark:border-[rgba(64,135,255,0.24)]',
              'shadow-[var(--shadow-soft)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]',
              'hover:-translate-y-[3px] hover:border-violet-300 dark:hover:border-[rgba(64,135,255,0.48)]',
              'hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.35),0_0_28px_rgba(30,144,255,0.14)]',
            ]
          : [
              'jobaz-card bg-[var(--jaz-surface)] dark:bg-slate-900/50',
              'hover:border-violet-300 dark:hover:border-violet-500/40',
              'hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_8px_40px_rgba(139,92,246,0.12)]',
              showFeatured
                ? 'border-violet-300 dark:border-violet-500/35 shadow-[0_0_24px_rgba(109,40,217,0.08)]'
                : 'border-slate-200 dark:border-slate-700/50',
            ],
        inline && 'md:flex-row md:max-w-none',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden shrink-0',
          compact ? 'h-[170px]' : 'h-44',
          inline ? 'md:w-48 w-full' : 'w-full'
        )}
        style={
          course.imageUrl
            ? { background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.35))' }
            : undefined
        }
      >
        {course.imageUrl ? (
          <div className={cn('relative h-full w-full', compact ? 'p-4' : 'p-6')}>
            <div className="relative h-full w-full">
              <CourseMediaImage
                src={course.imageUrl}
                fit="contain"
                sizes={compact ? '(max-width: 768px) 100vw, 280px' : '(max-width: 768px) 100vw, 360px'}
              />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center',
              compact
                ? 'bg-gradient-to-br from-[var(--jaz-hero-from)] via-[var(--jaz-hero-via)] to-[var(--jaz-hero-to)] dark:from-[#122248]/80 dark:via-[#0a1428] dark:to-[#080f22]'
                : 'bg-gradient-to-br from-violet-950/50 via-slate-900 to-slate-950'
            )}
          >
            <GraduationCap
              className={cn('text-violet-500/30', compact ? 'w-10 h-10' : 'w-12 h-12')}
            />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {showFeatured && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest rounded-full border border-violet-500/40 bg-violet-950/80 backdrop-blur px-2.5 py-1 text-violet-200">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>
        {showOffer && publicOffer?.badgeDisplay && (
          <div className="absolute top-3 right-3 z-10">
            <CourseOfferBadge display={publicOffer.badgeDisplay} />
          </div>
        )}
      </div>

      <div className={cn('flex flex-col gap-3 flex-1', compact ? 'p-4' : 'p-5')}>
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <p
              className={cn(
                'text-[10px] uppercase tracking-widest',
                compact
                  ? 'text-violet-700 dark:text-[#5eb3ff]/80'
                  : 'text-violet-700 dark:text-violet-400/80'
              )}
            >
              {routeLabel}
            </p>
            {coursePurpose && <CoursePurposePill label={coursePurpose} />}
          </div>
          <h3
            className={cn(
              'font-semibold text-[#0F172A] dark:text-slate-50 leading-snug line-clamp-2',
              compact ? 'text-base' : 'text-lg'
            )}
          >
            {course.name}
          </h3>
          <p
            className={cn(
              'text-[#475569] dark:text-slate-400 mt-2 leading-relaxed',
              compact ? 'text-xs line-clamp-3' : 'text-sm line-clamp-2'
            )}
          >
            {course.description}
          </p>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className="text-[10px] uppercase tracking-wider rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700 dark:border-slate-600/50 dark:bg-slate-900/60 dark:text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-violet-400 shrink-0" />
          <span className="truncate">{provider}</span>
        </div>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-[#334155] dark:text-slate-300">
          <li className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[#2563EB] dark:text-violet-400 shrink-0" />
            <span className="truncate">{course.location}</span>
          </li>
          <li className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">{durationText}</span>
          </li>
          <li className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="truncate text-[#334155] dark:text-slate-300 font-medium">{price}</span>
            </div>
            {showOffer && publicOffer && (
              <CourseOfferHelperLine text={publicOffer.cardHint} />
            )}
          </li>
          <li className="flex items-center gap-1.5 min-w-0">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{course.type}</span>
          </li>
        </ul>

        <div className="flex flex-col gap-2 mt-auto pt-2 course-actions">
          {canApply ? (
            <button
              type="button"
              onClick={handleApply}
              className={cn(
                'jobaz-btn-primary w-full',
                compact && 'px-3 py-2 text-sm'
              )}
            >
              Apply Now
              <ArrowRight className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium border cursor-not-allowed',
                compact
                  ? 'px-3 py-2 border-slate-200 bg-slate-50 text-slate-400 dark:border-[rgba(64,135,255,0.15)] dark:bg-[rgba(7,14,31,0.4)] dark:text-slate-500'
                  : 'px-4 py-2.5 border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700/50 dark:bg-slate-900/40 dark:text-slate-500'
              )}
            >
              Link not available
            </button>
          )}

          <Link
            href={detailHref}
            onClick={handleViewDetails}
            className={cn('jobaz-btn-secondary w-full', compact && 'px-3 py-2 text-sm')}
          >
            View Details
            <ArrowRight className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className={cn(
              'jobaz-btn-ghost w-full !font-medium',
              compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-1.5 text-sm',
              saved && 'text-emerald-700 dark:text-emerald-400/90'
            )}
          >
            {saved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            {saved ? 'Saved to Plan' : saveLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
