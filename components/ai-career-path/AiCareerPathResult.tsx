'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Briefcase,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Target,
  TrendingUp,
  AlertCircle,
  Zap,
  Clock,
  ArrowRight,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerAssessmentResult } from '@/lib/jobaz-ai'
import type { RichCareerInsights } from '@/lib/jobaz-ai/engines/careerAssessment/richInsights'
import {
  trackAiPathResultViewed,
  trackAiPathSignupClicked,
  trackAiPathToolClicked,
} from '@/lib/ai-career-path/tracking'

const SIGNUP_HREF = '/auth?mode=signup&redirectTo=/dashboard'

type AiCareerPathResultProps = {
  result: CareerAssessmentResult
  richInsights: RichCareerInsights
  onRestart: () => void
}

const PRIORITY_STYLES = {
  high: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  low: 'border-slate-600/50 bg-slate-800/50 text-slate-400',
} as const

export default function AiCareerPathResult({
  result,
  richInsights,
  onRestart,
}: AiCareerPathResultProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [glowReady, setGlowReady] = useState(false)

  useEffect(() => {
    const t1 = window.setTimeout(() => setShowSuccess(true), 60)
    const t2 = window.setTimeout(() => setGlowReady(true), 400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    trackAiPathResultViewed({
      recommended_path: result.recommendedPath,
      readiness_score: richInsights.readinessScore,
      career_stage: richInsights.careerStage,
    })
  }, [result.recommendedPath, richInsights.readinessScore, richInsights.careerStage])

  const { readinessScore, engagementScore, actionPlan } = richInsights

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5 md:space-y-6">
      {/* Success hero */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-blue-950/20 px-6 py-8 text-center shadow-[0_0_48px_rgba(16,185,129,0.15)] transition-all duration-700',
          showSuccess ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/10 via-emerald-500/10 to-violet-600/10 transition-opacity duration-1000',
            glowReady ? 'opacity-100 animate-pulse' : 'opacity-0'
          )}
        />
        <div className="relative">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/25" />
            <span className="absolute inline-flex h-12 w-12 animate-pulse rounded-full bg-blue-500/20" />
            <CheckCircle2 className="relative h-14 w-14 text-emerald-400" />
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-300/90">
            Assessment complete
          </p>
          <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
            Your AI career profile is ready
          </h2>
          <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
            JobAZ analysed your answers and built a personalised UK career plan — no AI API
            required, fully tailored to you.
          </p>
        </div>
      </div>

      {/* Recommended path + reason */}
      <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-[#111827]/90 to-blue-950/30 p-5 md:p-6 shadow-[0_0_50px_rgba(37,99,235,0.18)]">
        <p className="mb-1 text-xs uppercase tracking-wide text-blue-300/90">
          Recommended career path
        </p>
        <h3 className="mb-3 text-2xl font-bold text-white">{result.recommendedPath}</h3>
        <p className="text-slate-300 leading-relaxed text-sm md:text-base mb-4">
          {result.summary}
        </p>
        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-blue-300/80 mb-1">
            Why this path fits you
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {richInsights.recommendationReason}
          </p>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <InsightCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          label="Strongest area"
          value={richInsights.strongestArea}
          variant="positive"
          delay={0}
          visible={showSuccess}
        />
        <InsightCard
          icon={<AlertCircle className="h-4 w-4 text-amber-400" />}
          label="Weakest area"
          value={richInsights.weakestArea}
          variant="focus"
          delay={80}
          visible={showSuccess}
        />
        <InsightCard
          icon={<Zap className="h-4 w-4 text-violet-400" />}
          label="Recommended next action"
          value={richInsights.nextAction.replace(/^Recommended next action:\s*/i, '')}
          variant="action"
          delay={160}
          visible={showSuccess}
          className="sm:col-span-2"
        />
        <InsightCard
          icon={<Brain className="h-4 w-4 text-blue-400" />}
          label="Best JobAZ tool for your stage"
          value={`${richInsights.bestToolName} · ${richInsights.careerStage}`}
          variant="tool"
          delay={240}
          visible={showSuccess}
          className="sm:col-span-2"
          href={richInsights.bestToolRoute}
          toolId={richInsights.bestToolId}
          toolName={richInsights.bestToolName}
          recommendedPath={result.recommendedPath}
        />
      </div>

      {/* Scores */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ScoreCard
          label="Career readiness"
          score={readinessScore}
          icon={<Target className="h-5 w-5 text-blue-400" />}
          gradient="from-blue-500 to-violet-500"
          animate={glowReady}
        />
        <ScoreCard
          label="AI engagement"
          score={engagementScore}
          icon={<Sparkles className="h-5 w-5 text-violet-400" />}
          gradient="from-violet-500 to-fuchsia-500"
          animate={glowReady}
          hint="Grows as you complete assessments and use JobAZ tools."
        />
      </div>

      {/* Dynamic AI explanations */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-5 md:p-6 shadow-[0_0_32px_rgba(139,92,246,0.12)]">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
          <Sparkles className="h-5 w-5 text-violet-400" />
          Your AI career insights
        </h3>
        <ul className="space-y-3">
          {richInsights.personalizedInsights.map((line, i) => (
            <li
              key={line}
              className={cn(
                'flex gap-3 text-sm md:text-base text-slate-300 leading-relaxed transition-all duration-500',
                showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-violet-200/90 border-t border-violet-500/20 pt-4">
          {richInsights.fastestImprovementPath}
        </p>
      </div>

      {/* Timeline + week focus */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Improvement timeline
          </p>
          <p className="text-sm text-slate-200">{richInsights.improvementTimeline}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-300/80 mb-2">
            Suggested first-week focus
          </p>
          <p className="text-sm text-slate-200">{richInsights.firstWeekFocus}</p>
        </div>
      </div>

      {/* Weekly action plan */}
      <div className="rounded-2xl border border-blue-500/20 bg-[#111827]/60 p-5 md:p-6">
        <h3 className="font-semibold text-slate-100 mb-1">{actionPlan.title}</h3>
        <p className="text-sm text-slate-400 mb-4">{actionPlan.summary}</p>
        <ul className="space-y-3">
          {actionPlan.weeklyTasks.map((task) => (
            <li
              key={`${task.route}-${task.label}`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100">{task.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{task.toolName}</span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="h-3 w-3" />
                    ~{task.estimatedMinutes} min
                  </span>
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                  PRIORITY_STYLES[task.priority]
                )}
              >
                {task.priority}
              </span>
              <Link
                href={task.route}
                onClick={() =>
                  trackAiPathToolClicked({
                    tool_id: task.toolId,
                    tool_name: task.toolName,
                    destination: task.route,
                    recommended_path: result.recommendedPath,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-500/20 transition"
              >
                Open
                <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <ResultBlock icon={<Briefcase className="h-5 w-5 text-violet-400" />} title="Suitable job ideas">
        <ul className="space-y-2">
          {result.suggestedJobs.map((job) => (
            <li key={job} className="flex items-start gap-2 text-slate-300 text-sm md:text-base">
              <span className="text-violet-400">•</span>
              {job}
            </li>
          ))}
        </ul>
      </ResultBlock>

      <ResultBlock icon={<Wrench className="h-5 w-5 text-blue-400" />} title="All recommended JobAZ tools">
        <div className="space-y-3">
          {result.recommendedTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              onClick={() =>
                trackAiPathToolClicked({
                  tool_id: tool.id,
                  tool_name: tool.name,
                  destination: tool.href,
                  recommended_path: result.recommendedPath,
                })
              }
              className="block rounded-xl border border-slate-600/30 bg-slate-800/40 px-4 py-3.5 transition duration-200 hover:scale-[1.01] hover:border-blue-400/40 hover:bg-blue-600/10 hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]"
            >
              <span className="font-medium text-slate-100">{tool.name}</span>
              <p className="mt-1 text-sm text-slate-400">{tool.description}</p>
            </Link>
          ))}
        </div>
      </ResultBlock>

      <div className="rounded-2xl border border-blue-500/25 bg-[#111827]/60 p-5 md:p-6 text-center shadow-[0_0_40px_rgba(37,99,235,0.12)]">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200">
          <Sparkles className="h-3.5 w-3.5" />
          Save your progress
        </div>
        <p className="mb-5 text-slate-200 text-sm md:text-base">
          Create free account to save your AI career profile
        </p>
        <Link
          href={SIGNUP_HREF}
          onClick={() => trackAiPathSignupClicked('create_account_save_profile')}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:scale-[1.02]"
        >
          Create free account
        </Link>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mx-auto flex items-center gap-2 text-sm text-slate-400 transition hover:text-violet-300"
      >
        <RotateCcw className="h-4 w-4" />
        Start again
      </button>
    </section>
  )
}

function InsightCard({
  icon,
  label,
  value,
  variant,
  delay,
  visible,
  className,
  href,
  toolId,
  toolName,
  recommendedPath,
}: {
  icon: React.ReactNode
  label: string
  value: string
  variant: 'positive' | 'focus' | 'action' | 'tool'
  delay: number
  visible: boolean
  className?: string
  href?: string
  toolId?: string
  toolName?: string
  recommendedPath?: string
}) {
  const border =
    variant === 'positive'
      ? 'border-emerald-500/25'
      : variant === 'focus'
        ? 'border-amber-500/25'
        : variant === 'tool'
          ? 'border-blue-500/25'
          : 'border-violet-500/25'

  const content = (
    <div
      className={cn(
        'rounded-xl border bg-slate-900/50 p-4 transition-all duration-500 h-full',
        border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        href && 'hover:border-blue-400/40 hover:bg-blue-600/5',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="text-sm font-medium text-slate-100 leading-snug">{value}</p>
      {href && (
        <p className="mt-2 text-xs text-blue-300/80 flex items-center gap-1">
          Open tool <ArrowRight className="h-3 w-3" />
        </p>
      )}
    </div>
  )

  if (href && toolId && toolName) {
    return (
      <Link
        href={href}
        onClick={() =>
          trackAiPathToolClicked({
            tool_id: toolId,
            tool_name: toolName,
            destination: href,
            recommended_path: recommendedPath,
          })
        }
        className="block"
      >
        {content}
      </Link>
    )
  }

  return content
}

function ScoreCard({
  label,
  score,
  icon,
  gradient,
  animate,
  hint,
}: {
  label: string
  score: number
  icon: React.ReactNode
  gradient: string
  animate: boolean
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]/50 p-5 backdrop-blur-sm relative overflow-hidden">
      <div
        className={cn(
          'pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-1000',
          animate && 'opacity-100'
        )}
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-slate-100 text-sm">{label}</h3>
          </div>
          <span className="tabular-nums text-sm font-semibold text-slate-200">
            {score}/100
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out', gradient)}
            style={{ width: animate ? `${Math.min(score, 100)}%` : '0%' }}
          />
        </div>
        {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}

function ResultBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]/50 p-4 md:p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  )
}
