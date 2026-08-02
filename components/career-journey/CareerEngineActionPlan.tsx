'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase, GraduationCap, Map, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { countCatalogCourses } from '@/lib/career-journey/enrichRecommendations'
import type {
  ActionTier,
  CareerActionPlan,
  CourseRecommendation,
  JobRecommendation,
} from '@/lib/career-journey/actionPlanTypes'
import { useJobAvailabilityCounts } from '@/hooks/useJobAvailabilityCounts'
import { getGuestCareerSignupUrl } from '@/lib/career-journey/guestMissions'
import RecommendationCourseCard from '@/components/recommendations/RecommendationCourseCard'
import type { RecommendationCourseCardData } from '@/lib/recommendations/types'
import AppLevelAuthLink from '@/components/auth/AppLevelAuthLink'
import CareerJourneyStrip from './CareerJourneyStrip'
import TodaysMissionPanel from './TodaysMissionPanel'
import CollapsibleSection from './CollapsibleSection'

const TIER_STYLES: Record<ActionTier['accent'], { border: string; bg: string; text: string }> = {
  emerald: { border: 'border-emerald-500/25', bg: 'bg-emerald-950/20', text: 'text-emerald-300' },
  cyan: { border: 'border-cyan-500/25', bg: 'bg-cyan-950/20', text: 'text-cyan-300' },
  violet: { border: 'border-violet-500/25', bg: 'bg-violet-950/20', text: 'text-violet-300' },
}

type Props = {
  plan: CareerActionPlan
  isGuest?: boolean
  guestRegistrationSlot?: React.ReactNode
  detailsSlot?: React.ReactNode
  whyExpandedSlot?: React.ReactNode
}

function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'emerald' | 'cyan' | 'amber' | 'slate' }) {
  const tones = {
    emerald: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300',
    cyan: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300',
    amber: 'border-amber-500/30 bg-amber-950/30 text-amber-300',
    slate: 'border-slate-600/50 bg-slate-900/60 text-slate-400',
  }
  return (
    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium uppercase tracking-wide', tones[tone])}>
      {children}
    </span>
  )
}

function PlanNavLink({
  href,
  isGuest,
  className,
  children,
}: {
  href: string
  isGuest?: boolean
  className?: string
  children: React.ReactNode
}) {
  if (isGuest) {
    return (
      <AppLevelAuthLink href={href} className={className}>
        {children}
      </AppLevelAuthLink>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

function JobCard({
  job,
  jobCount,
  isGuest,
  guestAuthHref,
}: {
  job: JobRecommendation
  jobCount: number | null | undefined
  isGuest?: boolean
  guestAuthHref: string
}) {
  const href = isGuest ? guestAuthHref : job.href
  return (
    <PlanNavLink
      href={href}
      isGuest={isGuest}
      className="block rounded-lg border border-slate-700/50 bg-slate-900/50 p-3 hover:border-emerald-500/35 transition group"
    >
      <p className="text-sm font-semibold text-slate-100 group-hover:text-emerald-200">{job.title}</p>
      {job.subtitle && <p className="text-[10px] text-slate-500 capitalize mt-0.5">{job.subtitle}</p>}
      {job.salaryRange && <p className="text-xs text-emerald-300/90 mt-1.5 font-medium">{job.salaryRange}</p>}
      <div className="flex flex-wrap gap-1 mt-2">
        {job.demandLevel && <Badge tone="emerald">{job.demandLevel} Demand</Badge>}
        {job.entryDifficulty && <Badge tone="cyan">{job.entryDifficulty} Entry</Badge>}
        {job.hiringSpeed && <Badge tone="slate">{job.hiringSpeed}</Badge>}
        {job.badges.map((b) => (
          <Badge key={b} tone="slate">
            {b}
          </Badge>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        {jobCount != null ? `${jobCount} jobs available` : 'Searching jobs…'}
      </p>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 mt-2 group-hover:text-violet-200">
        Find Jobs
        <ArrowRight className="w-3 h-3" />
      </span>
    </PlanNavLink>
  )
}

function CourseCard({
  course,
  courseCount,
  isGuest,
  guestAuthHref,
}: {
  course: CourseRecommendation
  courseCount: number
  isGuest?: boolean
  guestAuthHref: string
}) {
  const href = isGuest ? guestAuthHref : course.href
  return (
    <PlanNavLink
      href={href}
      isGuest={isGuest}
      className="block rounded-lg border border-slate-700/50 bg-slate-900/50 p-3 hover:border-cyan-500/35 transition group"
    >
      <p className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200">{course.title}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {course.costLabel && <Badge tone="emerald">{course.costLabel}</Badge>}
        {course.duration && <Badge tone="cyan">{course.duration}</Badge>}
        {course.qualification && <Badge tone="slate">{course.qualification}</Badge>}
      </div>
      {course.careerImpact && (
        <p className="text-[11px] text-slate-400 mt-2 leading-snug">{course.careerImpact}</p>
      )}
      {course.salaryImprovement && course.salaryImprovement !== course.careerImpact && (
        <p className="text-[10px] text-emerald-400/80 mt-1">{course.salaryImprovement}</p>
      )}
      {courseCount > 0 && (
        <p className="text-[10px] text-slate-500 mt-1.5">{courseCount} courses available</p>
      )}
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 mt-2 group-hover:text-cyan-200">
        Start Course
        <ArrowRight className="w-3 h-3" />
      </span>
    </PlanNavLink>
  )
}

function TimelineView({ steps }: { steps: NonNullable<ActionTier['timeline']> }) {
  return (
    <div className="space-y-0 flex-1">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-2">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                step.kind === 'today' && 'bg-violet-400',
                step.kind === 'role' && 'bg-emerald-400',
                step.kind === 'qualification' && 'bg-cyan-400',
                step.kind === 'goal' && 'bg-fuchsia-400'
              )}
            />
            {index < steps.length - 1 && <span className="w-px flex-1 min-h-[12px] bg-slate-700/80 my-0.5" />}
          </div>
          <p
            className={cn(
              'text-xs pb-2 leading-snug',
              step.kind === 'goal' ? 'text-violet-200 font-semibold' : 'text-slate-300',
              step.kind === 'today' && 'text-slate-500'
            )}
          >
            {step.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function ActionTierCard({
  tier,
  isGuest,
  jobCounts,
  pathId,
  guestAuthHref,
  resolvedCards,
}: {
  tier: ActionTier
  isGuest?: boolean
  jobCounts: Record<string, number | null>
  pathId?: string
  guestAuthHref: string
  resolvedCards?: RecommendationCourseCardData[]
}) {
  const style = TIER_STYLES[tier.accent]
  const Icon = tier.id === 'work_now' ? Briefcase : tier.id === 'build_next' ? GraduationCap : Map

  return (
    <div className={cn('rounded-xl border p-4 flex flex-col', style.border, style.bg)}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-3.5 h-3.5', style.text)} />
        <p className={cn('text-[10px] uppercase tracking-wider font-semibold', style.text)}>{tier.label}</p>
      </div>
      <p className="text-[10px] text-slate-500 mb-3">{tier.subtitle}</p>

      <div className="space-y-2 flex-1 mb-3">
        {tier.id === 'work_now' &&
          (tier.jobs?.length ? (
            tier.jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                jobCount={jobCounts[job.searchKeyword]}
                isGuest={isGuest}
                guestAuthHref={guestAuthHref}
              />
            ))
          ) : (
            <p className="text-xs text-slate-500">Explore matching roles in Job Finder.</p>
          ))}

        {tier.id === 'build_next' &&
          (resolvedCards && resolvedCards.length > 0 ? (
            resolvedCards.map((card) => (
              <RecommendationCourseCard
                key={card.id}
                card={card}
                source="uk_career_assistant"
                compact
              />
            ))
          ) : tier.courses?.length ? (
            tier.courses.map((course: CourseRecommendation) => (
              <CourseCard
                key={course.id}
                course={course}
                courseCount={countCatalogCourses(course.searchKeyword, course.pathId ?? pathId) || 1}
                isGuest={isGuest}
                guestAuthHref={guestAuthHref}
              />
            ))
          ) : (
            <p className="text-xs text-slate-500">Browse training for your route.</p>
          ))}

        {tier.id === 'long_term' && tier.timeline && tier.timeline.length > 0 && (
          <TimelineView steps={tier.timeline} />
        )}
      </div>

      <PlanNavLink
        href={isGuest ? guestAuthHref : tier.cta.href}
        isGuest={isGuest}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 w-full rounded-lg px-3 py-2 text-xs font-semibold transition',
          tier.id === 'work_now'
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500'
            : 'border border-slate-600/50 bg-slate-900/60 text-slate-200 hover:border-violet-500/40'
        )}
      >
        {tier.cta.label}
        <ArrowRight className="w-3.5 h-3.5" />
      </PlanNavLink>
    </div>
  )
}

export default function CareerEngineActionPlan({
  plan,
  isGuest,
  guestRegistrationSlot,
  detailsSlot,
  whyExpandedSlot,
}: Props) {
  const jobKeywords = plan.tiers.flatMap((t) => t.jobs?.map((j) => j.searchKeyword) ?? [])
  const jobCounts = useJobAvailabilityCounts(jobKeywords)
  const guestAuthHref = getGuestCareerSignupUrl()
  const [resolvedCards, setResolvedCards] = useState<RecommendationCourseCardData[]>([])

  useEffect(() => {
    const titles =
      plan.tiers.find((t) => t.id === 'build_next')?.courses?.map((c) => c.title) ?? []
    if (titles.length === 0) {
      setResolvedCards([])
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/recommendations/resolve-courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titles, pathId: plan.pathId, limit: 4 }),
        })
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { cards?: RecommendationCourseCardData[] }
        if (!cancelled) setResolvedCards(body.cards ?? [])
      } catch {
        if (!cancelled) setResolvedCards([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [plan.pathId, plan.tiers])

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 to-slate-950/80 px-4 py-3">
        <p className="text-[10px] uppercase tracking-widest text-violet-300/90 font-semibold flex items-center gap-1 mb-1">
          <Sparkles className="w-3 h-3" />
          {plan.headline}
        </p>
        <p className="text-sm text-slate-200 leading-snug">{plan.oneLiner}</p>
      </header>

      {isGuest && guestRegistrationSlot}

      <CareerJourneyStrip currentStep={plan.journeyStep} />

      <TodaysMissionPanel missions={plan.missions} />

      <div className={cn('grid gap-3 md:grid-cols-3', isGuest && 'opacity-95')}>
        {plan.tiers.map((tier) => (
          <ActionTierCard
            key={tier.id}
            tier={tier}
            isGuest={isGuest}
            jobCounts={jobCounts}
            pathId={plan.pathId}
            guestAuthHref={guestAuthHref}
            resolvedCards={tier.id === 'build_next' ? resolvedCards : undefined}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <PlanNavLink
          href={isGuest ? guestAuthHref : plan.primaryCta.href}
          isGuest={isGuest}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
        >
          {plan.primaryCta.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </PlanNavLink>
        <PlanNavLink
          href={isGuest ? guestAuthHref : '/job-finder'}
          isGuest={isGuest}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-slate-600/50 text-slate-200 hover:border-emerald-500/40"
        >
          Find Jobs
        </PlanNavLink>
        <PlanNavLink
          href={isGuest ? guestAuthHref : '/career-hub'}
          isGuest={isGuest}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-slate-600/50 text-slate-200 hover:border-cyan-500/40"
        >
          Career Hub
        </PlanNavLink>
        <PlanNavLink
          href={isGuest ? guestAuthHref : '/dashboard?tab=plan'}
          isGuest={isGuest}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-slate-600/50 text-slate-200 hover:border-violet-500/40"
        >
          Save Journey
        </PlanNavLink>
      </div>

      {(plan.whySummary || whyExpandedSlot) && (
        <CollapsibleSection title="Why this recommendation" defaultOpen={false}>
          {plan.whySummary && (
            <p className="text-sm text-slate-400 leading-relaxed mb-3">{plan.whySummary}</p>
          )}
          {whyExpandedSlot}
        </CollapsibleSection>
      )}

      {detailsSlot && (
        <CollapsibleSection title="Full analysis & details" defaultOpen={false}>
          {detailsSlot}
        </CollapsibleSection>
      )}
    </section>
  )
}
