'use client'

import Link from 'next/link'
import { ArrowRight, CalendarCheck, Compass, RefreshCw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerJourneySnapshot } from '@/lib/career-journey/types'
import CareerReadinessOverview from './CareerReadinessOverview'
import NextSmartMoveCard, { type NextJourneyStep } from './NextSmartMoveCard'
import AiCareerInsights from './AiCareerInsights'
import AiActionPlanSection from './AiActionPlan'
import AiCareerTimeline from './AiCareerTimeline'
import SmartProfilePanel from '@/components/career-journey/SmartProfilePanel'
import { AI_CAREER_PATH_FINDER_HREF } from '@/lib/jobaz-ai/profile/recommendations'
import { MyCareerJourneyWidget } from '@/components/career-hub'

type Props = {
  snapshot: CareerJourneySnapshot | null
  snapshotLoading?: boolean
  cvQualityScore: number
  interviewConfidence: number
  applicationsSent: number
  jobMatchStrength: number
  loadingCv?: boolean
  nextStep: NextJourneyStep
}

export default function AiCareerDashboardBar({
  snapshot,
  snapshotLoading,
  cvQualityScore,
  interviewConfidence,
  applicationsSent,
  jobMatchStrength,
  loadingCv,
  nextStep,
}: Props) {
  const primary = snapshot?.nextActions.find((a) => a.priority === 'primary') ?? snapshot?.nextActions[0]
  const journeyHref = primary?.href ?? AI_CAREER_PATH_FINDER_HREF

  return (
    <section
      className={cn(
        'mb-6 rounded-2xl overflow-hidden',
        'border border-violet-500/20 bg-gradient-to-br from-slate-950/95 via-slate-950 to-violet-950/25',
        'shadow-[0_12px_40px_rgba(15,23,42,0.55),0_0_40px_rgba(139,92,246,0.08)]',
        'backdrop-blur-sm'
      )}
      aria-labelledby="ai-career-dashboard-title"
    >
      <div className="border-b border-violet-500/15 bg-gradient-to-r from-violet-950/30 via-slate-900/60 to-slate-950/80 px-4 py-3 md:px-6">
        <p className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold mb-1">
          Career intelligence
        </p>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400/80 shrink-0" />
          <h2 id="ai-career-dashboard-title" className="text-lg md:text-xl font-semibold text-slate-100">
            Your Career Intelligence
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          AI insights, readiness tracking, and next-step recommendations.
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {snapshotLoading ? (
          <div className="h-16 rounded-xl bg-slate-900/50 animate-pulse" />
        ) : snapshot?.stateDescription ? (
          <p className="text-sm text-slate-300 leading-relaxed">{snapshot.stateDescription}</p>
        ) : null}

        <CareerReadinessOverview
          cvQualityScore={cvQualityScore}
          interviewConfidence={interviewConfidence}
          applicationsSent={applicationsSent}
          jobMatchStrength={jobMatchStrength}
          loadingCv={loadingCv}
        />

        <MyCareerJourneyWidget />

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(200px,280px)]">
          <NextSmartMoveCard nextStep={nextStep} />

          <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-4 flex flex-col gap-2">
            <p className="text-[10px] uppercase tracking-wide text-cyan-300/80 font-medium mb-1">
              Quick actions
            </p>
            <Link
              href="/uk-career-assistant#action-plan"
              className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-slate-200 hover:border-violet-500/40 hover:bg-violet-500/10 transition"
            >
              <CalendarCheck className="h-4 w-4 text-violet-400 shrink-0" />
              Action plan
              <ArrowRight className="h-3 w-3 ml-auto text-slate-500" />
            </Link>
            <Link
              href={journeyHref}
              className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-xs font-medium text-violet-100 hover:bg-violet-500/20 transition"
            >
              <Compass className="h-4 w-4 text-violet-300 shrink-0" />
              Continue AI path
              <ArrowRight className="h-3 w-3 ml-auto text-violet-400/80" />
            </Link>
            <Link
              href="/uk-career-assistant"
              className="flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2.5 text-xs font-medium text-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400 shrink-0" />
              Retake assessment
              <ArrowRight className="h-3 w-3 ml-auto text-slate-500" />
            </Link>
          </div>
        </div>

        {snapshot && !snapshot.hasCompletedAssessment && (
          <Link
            href="/uk-career-assistant"
            className="flex items-center gap-3 rounded-xl border border-cyan-500/25 bg-cyan-950/25 p-4 hover:border-cyan-400/40 transition"
          >
            <Compass className="h-8 w-8 text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-100">Start with the UK Career Assistant</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Work Now, Build Next, and long-term direction in one guided conversation.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0" />
          </Link>
        )}

        {primary && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-violet-300/80">JAZ recommendation</p>
              <p className="text-sm font-medium text-slate-100 mt-0.5">{primary.title}</p>
            </div>
            <Link
              href={primary.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white transition shrink-0',
                'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500',
                'shadow-[0_0_16px_rgba(139,92,246,0.4)]'
              )}
            >
              {primary.toolLabel ?? 'Continue'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {snapshot?.profile && <SmartProfilePanel profile={snapshot.profile} compact />}

        <div className="grid gap-6 lg:grid-cols-2 pt-2 border-t border-slate-800/60">
          <AiCareerInsights embedded />
          <AiActionPlanSection embedded />
        </div>

        <AiCareerTimeline embedded />
      </div>
    </section>
  )
}
