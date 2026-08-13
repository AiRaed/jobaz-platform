'use client'

import Link from 'next/link'
import { ArrowRight, BookmarkPlus, Check, Clock, ExternalLink, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrainingCourseItem } from '@/lib/training/types'
import { canApplyToCourse, openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'

type Props = {
  course: TrainingCourseItem
  variant: 'recommended' | 'plan' | 'completed'
  onUpdate?: () => void
}

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  recommended: 'Recommended',
  saved: 'Saved',
  interested: 'Interested',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function TrainingCourseCard({ course, variant, onUpdate }: Props) {
  const canApply = canApplyToCourse({
    referralUrl: course.referralUrl ?? course.affiliateUrl,
    officialUrl: course.courseHref,
  })

  const handleSave = () => {
    upsertCareerPlanItem({
      courseName: course.name,
      courseSlug: course.slug,
      pathId: course.pathId,
      routeLabel: course.routeLabel,
      status: 'saved',
      source: course.source === 'career_assistant' ? 'ai_assessment' : 'career_hub',
      icon: course.icon,
      priceFrom: course.cost,
      referralUrl: course.referralUrl,
      affiliateUrl: course.affiliateUrl,
      providerId: course.providerId,
    })
    onUpdate?.()
  }

  const handleApply = () => {
    openCourseApply(
      {
        id: course.id,
        title: course.name,
        providerName: course.provider,
        referralUrl: course.referralUrl ?? course.affiliateUrl,
        officialUrl: course.courseHref,
      },
      'dashboard_training'
    )
  }

  const handleStart = () => {
    upsertCareerPlanItem({
      courseName: course.name,
      courseSlug: course.slug,
      pathId: course.pathId,
      routeLabel: course.routeLabel,
      status: 'in_progress',
      source: 'manual',
      icon: course.icon,
    })
    onUpdate?.()
  }

  const handleComplete = () => {
    upsertCareerPlanItem({
      courseName: course.name,
      courseSlug: course.slug,
      pathId: course.pathId,
      routeLabel: course.routeLabel,
      status: 'completed',
      source: 'manual',
      icon: course.icon,
    })
    onUpdate?.()
  }

  return (
    <article className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 flex gap-3">
      <div className="shrink-0 w-14 h-14 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center overflow-hidden">
        {course.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{course.icon ?? '📚'}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-100 truncate">{course.name}</h4>
            <p className="text-[11px] text-slate-500 truncate">{course.provider}</p>
          </div>
          <div className="flex flex-wrap gap-1 shrink-0">
            {course.required && variant === 'recommended' && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-violet-500/40 text-violet-300">
                Required
              </span>
            )}
            {!course.required && variant === 'recommended' && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-600/50 text-slate-400">
                Recommended
              </span>
            )}
            {variant !== 'recommended' && (
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border',
                  course.status === 'completed'
                    ? 'border-emerald-500/40 text-emerald-300'
                    : course.status === 'in_progress'
                      ? 'border-amber-500/40 text-amber-300'
                      : 'border-slate-600/50 text-slate-400'
                )}
              >
                {STATUS_LABEL[course.status] ?? course.status}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-2">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
          <span>{course.cost}</span>
        </div>

        <p className="text-xs text-slate-400 leading-snug line-clamp-2 mb-2">
          <span className="text-slate-500">Impact: </span>
          {course.careerImpact}
        </p>

        {variant === 'completed' && course.unlockedOpportunity && (
          <p className="text-xs text-emerald-400/90 mb-2">
            Unlocked: {course.unlockedOpportunity}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Link
            href={course.courseHref}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-600/50 text-slate-200 hover:border-violet-400/50 hover:text-violet-200 transition"
          >
            View Course
          </Link>

          {variant === 'recommended' && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 transition"
              >
                <BookmarkPlus className="w-3 h-3" />
                Save
              </button>
              {canApply ? (
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                >
                  Apply Now
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700/60 text-slate-500">
                  Provider not listed yet
                </span>
              )}
            </>
          )}

          {variant === 'plan' && course.status !== 'completed' && (
            <>
              {(course.status === 'not_started' ||
                course.status === 'recommended' ||
                course.status === 'saved') && (
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                >
                  Start Training
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {course.status === 'in_progress' && (
                <>
                  <Link
                    href={course.courseHref}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-violet-600 text-white hover:bg-violet-500 transition"
                  >
                    Continue
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10 transition"
                  >
                    <Check className="w-3 h-3" />
                    Mark Complete
                  </button>
                </>
              )}
            </>
          )}

          {variant === 'completed' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
              <Check className="w-3 h-3" />
              {course.certificateStatus === 'pending' ? 'Certificate pending' : 'Completed'}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export function TrainingEmptyHint({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string
  description: string
  href?: string
  linkLabel?: string
}) {
  const isCareerAssistant = href === '/uk-career-assistant'
  const linkClass =
    'inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200'

  return (
    <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/20 px-4 py-6 text-center">
      <GraduationCap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
      <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-3 max-w-sm mx-auto">{description}</p>
      {href && linkLabel &&
        (isCareerAssistant ? (
          <UkCareerAssistantLink href={href} className={linkClass}>
            {linkLabel}
            <ArrowRight className="w-3 h-3" />
          </UkCareerAssistantLink>
        ) : (
          <Link href={href} className={linkClass}>
            {linkLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ))}
    </div>
  )
}
