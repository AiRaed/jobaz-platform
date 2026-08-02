'use client'

import { Sparkles } from 'lucide-react'
import CareerReadinessOverview from './CareerReadinessOverview'
import NextSmartMoveCard, { type NextJourneyStep } from './NextSmartMoveCard'
import AiCareerInsights from './AiCareerInsights'
import AiActionPlanSection from './AiActionPlan'
import AiCareerTimeline from './AiCareerTimeline'

type Props = {
  cvQualityScore: number
  interviewConfidence: number
  applicationsSent: number
  jobMatchStrength: number
  loadingCv?: boolean
  nextStep: NextJourneyStep
}

export default function AiCareerJourneyHero({
  cvQualityScore,
  interviewConfidence,
  applicationsSent,
  jobMatchStrength,
  loadingCv,
  nextStep,
}: Props) {
  return (
    <section className="mb-8">
      <div className="rounded-2xl border border-violet-500/25 bg-slate-950/50 shadow-[0_0_50px_rgba(88,28,135,0.2)] backdrop-blur-xl overflow-hidden">
        <div className="border-b border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-slate-950/30 to-cyan-950/20 px-5 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg md:text-xl font-semibold text-slate-50">Your AI Career Journey</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Your AI career command center — scores, plan, and what to do next.
          </p>
        </div>

        <div className="p-5 md:p-6 space-y-6">
          <CareerReadinessOverview
            cvQualityScore={cvQualityScore}
            interviewConfidence={interviewConfidence}
            applicationsSent={applicationsSent}
            jobMatchStrength={jobMatchStrength}
            loadingCv={loadingCv}
          />

          <NextSmartMoveCard nextStep={nextStep} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 space-y-6">
              <AiCareerInsights embedded />
            </div>
            <div className="min-w-0 space-y-6">
              <AiActionPlanSection embedded />
            </div>
          </div>

          <AiCareerTimeline embedded />
        </div>
      </div>
    </section>
  )
}
