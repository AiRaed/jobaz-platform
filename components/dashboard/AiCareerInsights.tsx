'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Target, ArrowRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserAiProfile } from '@/lib/jobaz-ai/profile/getUserAiProfile'
import {
  AI_CAREER_PATH_FINDER_HREF,
  generateDashboardRecommendations,
} from '@/lib/jobaz-ai/profile/recommendations'
import { trackAiDashboardEvent } from '@/lib/jobaz-ai/profile/dashboardEvents'
import type { DashboardAiInsights } from '@/lib/jobaz-ai/profile/types'

type Props = { embedded?: boolean }

export default function AiCareerInsights({ embedded = false }: Props) {
  const [insights, setInsights] = useState<DashboardAiInsights | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const profile = await getUserAiProfile()
        if (cancelled) return

        if (!profile) {
          setHasProfile(false)
          setInsights(null)
          trackAiDashboardEvent('ai_dashboard_viewed', { has_profile: false })
          return
        }

        const generated = generateDashboardRecommendations(profile)
        setHasProfile(Boolean(generated))
        setInsights(generated)
        trackAiDashboardEvent('ai_dashboard_viewed', {
          has_profile: true,
          recommended_path: profile.lastRecommendedPath ?? undefined,
        })
      } catch {
        if (!cancelled) {
          setHasProfile(false)
          setInsights(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    const onProfileUpdate = () => {
      if (!cancelled) void load()
    }
    window.addEventListener('jobaz-ai-profile-updated', onProfileUpdate)

    return () => {
      cancelled = true
      window.removeEventListener('jobaz-ai-profile-updated', onProfileUpdate)
    }
  }, [])

  if (loading) return null

  const content = !hasProfile || !insights ? <EmptyInsights /> : <ProfileInsights insights={insights} />

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-300/90 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          Career Readiness Summary
        </h3>
        {content}
      </div>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-300/80 uppercase mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-400" />
        Your AI Career Insights
      </h2>
      {content}
    </section>
  )
}

function EmptyInsights() {
  const continueHref = AI_CAREER_PATH_FINDER_HREF

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-950/50 shadow-[0_0_40px_rgba(88,28,135,0.15)] backdrop-blur p-4 md:p-5 space-y-4">
      <p className="text-sm text-slate-300">
        Not sure where to start? Try the Career Assistant.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={continueHref}
          onClick={() =>
            trackAiDashboardEvent('ai_dashboard_continue_path_clicked', {
              destination: continueHref,
              has_profile: false,
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.5)]"
        >
          Continue my AI path
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={AI_CAREER_PATH_FINDER_HREF}
          onClick={() =>
            trackAiDashboardEvent('ai_dashboard_retake_clicked', {
              destination: AI_CAREER_PATH_FINDER_HREF,
              has_profile: false,
            })
          }
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 hover:border-violet-400/60 hover:bg-violet-500/20 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retake AI assessment
        </Link>
      </div>
    </div>
  )
}

function ProfileInsights({ insights }: { insights: DashboardAiInsights }) {
  const handleRecommendationClick = (
    href: string,
    meta: {
      recommendation_type?: string
      tool_name?: string
      tool_id?: string
    }
  ) => {
    trackAiDashboardEvent('ai_dashboard_recommendation_clicked', {
      destination: href,
      recommended_path: insights.lastRecommendedPath ?? undefined,
      weakest_area: insights.weakestArea,
      has_profile: true,
      ...meta,
    })
  }

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-950/50 shadow-[0_0_40px_rgba(88,28,135,0.15)] backdrop-blur p-4 md:p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {insights.isReturning && (
          <p className="text-sm text-violet-200/90 w-full sm:w-auto">
            Welcome back — continuing your AI career journey.
          </p>
        )}
        <span className="inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-200">
          {insights.evolutionStageLabel ?? insights.careerStage}
        </span>
        <span className="text-xs text-slate-400">{insights.progressTrendLabel}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Current path</p>
          <p className="text-sm font-medium text-slate-100 leading-snug">
            {insights.currentPath ?? 'Not set yet'}
          </p>
          {insights.lastRecommendedPath && (
            <p className="text-xs text-slate-500 mt-2">
              Last recommendation:{' '}
              <span className="text-slate-300">{insights.lastRecommendedPath}</span>
            </p>
          )}
          {insights.goalLabel && (
            <p className="text-xs text-slate-500 mt-1">Goal: {insights.goalLabel}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Career readiness</span>
            <span className="tabular-nums text-slate-200">{insights.readinessScore}/100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400'
              )}
              style={{ width: `${Math.min(insights.readinessScore, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {insights.personalizedSummary && (
        <p className="text-sm text-slate-300 leading-relaxed">{insights.personalizedSummary}</p>
      )}

      {insights.whyThisPathFits && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Why this path fits you</p>
          <p className="text-sm text-slate-200 leading-relaxed">{insights.whyThisPathFits}</p>
          {insights.confidenceNote && (
            <p className="text-xs text-slate-400 mt-2 italic">{insights.confidenceNote}</p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Recommended next action</p>
        <p className="text-sm text-slate-100">{insights.nextAction}</p>
        {insights.weeklyFocus && (
          <p className="text-xs text-slate-400 mt-2 whitespace-pre-line">{insights.weeklyFocus}</p>
        )}
      </div>

      {insights.suggestedTools.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Suggested JobAZ tools</p>
          <div className="flex flex-wrap gap-2">
            {insights.suggestedTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={() =>
                  handleRecommendationClick(tool.href, {
                    recommendation_type: tool.type,
                    tool_name: tool.toolName,
                    tool_id: tool.toolId,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:border-violet-400/60 hover:bg-violet-500/20 transition"
              >
                <Target className="h-3 w-3" />
                {tool.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          href={insights.continuePathHref}
          onClick={() =>
            trackAiDashboardEvent('ai_dashboard_continue_path_clicked', {
              destination: insights.continuePathHref,
              recommended_path: insights.lastRecommendedPath ?? undefined,
              weakest_area: insights.weakestArea,
              tool_id: insights.continueToolId,
              tool_name: insights.continueToolName,
              has_profile: true,
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.5)]"
        >
          Continue my AI path
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={insights.retakeAssessmentHref}
          onClick={() =>
            trackAiDashboardEvent('ai_dashboard_retake_clicked', {
              destination: insights.retakeAssessmentHref,
              recommended_path: insights.lastRecommendedPath ?? undefined,
              has_profile: true,
            })
          }
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 hover:border-violet-400/60 hover:bg-violet-500/20 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retake AI assessment
        </Link>
      </div>
    </div>
  )
}
