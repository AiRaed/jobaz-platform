'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserAiProfile } from '@/lib/jobaz-ai/profile/getUserAiProfile'
import { generateAiActionPlan } from '@/lib/jobaz-ai/profile/actionPlan'
import { AI_CAREER_PATH_FINDER_HREF } from '@/lib/jobaz-ai/profile/recommendations'
import { trackAiDashboardEvent } from '@/lib/jobaz-ai/profile/dashboardEvents'
import type { AiActionPlan, AiActionPlanPriority, AiActionPlanTask } from '@/lib/jobaz-ai/profile/types'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'

const PRIORITY_STYLES: Record<AiActionPlanPriority, string> = {
  high: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  low: 'border-slate-600/50 bg-slate-800/50 text-slate-400',
}

type Props = { embedded?: boolean }

export default function AiActionPlanSection({ embedded = false }: Props) {
  const [plan, setPlan] = useState<AiActionPlan | null>(null)
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
          setPlan(null)
          return
        }

        const generated = generateAiActionPlan(profile)
        setHasProfile(true)
        setPlan(generated)

        void trackAiDashboardEvent('ai_action_plan_viewed', {
          has_profile: true,
          task_count: generated.weeklyTasks.length,
          recommended_path: profile.lastRecommendedPath ?? undefined,
        })
      } catch {
        if (!cancelled) {
          setHasProfile(false)
          setPlan(null)
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

  const content = !hasProfile || !plan ? <EmptyActionPlan /> : <ActionPlanCard plan={plan} />

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-300/90 mb-3 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-violet-400" />
          AI Action Plan
        </h3>
        {content}
      </div>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-300/80 uppercase mb-3 flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-violet-400" />
        This Week&apos;s AI Action Plan
      </h2>
      {content}
    </section>
  )
}

function EmptyActionPlan() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-950/50 shadow-[0_0_40px_rgba(88,28,135,0.15)] backdrop-blur p-4 md:p-5">
      <p className="text-sm text-slate-300">
        Complete the Career Assistant to generate your first action plan.
      </p>
      <UkCareerAssistantLink
        href={AI_CAREER_PATH_FINDER_HREF}
        className="jobaz-btn-primary jobaz-btn-primary-sm mt-3"
      >
        Start Career Assistant
        <ArrowRight className="h-3.5 w-3.5" />
      </UkCareerAssistantLink>
    </div>
  )
}

function ActionPlanCard({ plan }: { plan: AiActionPlan }) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-slate-950/50 shadow-[0_0_40px_rgba(88,28,135,0.15)] backdrop-blur p-4 md:p-5 space-y-4">
      <p className="text-sm text-slate-300">{plan.summary}</p>
      <ul className="space-y-3">
        {plan.weeklyTasks.map((task) => (
          <ActionPlanTaskRow key={`${task.route}-${task.label}`} task={task} />
        ))}
      </ul>
    </div>
  )
}

function ActionPlanTaskRow({ task }: { task: AiActionPlanTask }) {
  const handleTaskClick = () => {
    void trackAiDashboardEvent('ai_action_task_clicked', {
      has_profile: true,
      task_label: task.label,
      tool_name: task.toolName,
      route: task.route,
      priority: task.priority,
      destination: task.route,
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-3 sm:flex-nowrap">
      <label className="flex shrink-0 items-center gap-2 cursor-default">
        <input
          type="checkbox"
          disabled
          aria-label={`Mark "${task.label}" complete (coming soon)`}
          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-500 opacity-60"
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100">{task.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{task.toolName}</span>
                  {task.estimatedMinutes != null && (
                    <span>~{task.estimatedMinutes} min</span>
                  )}
                </p>
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          PRIORITY_STYLES[task.priority]
        )}
      >
        {task.priority}
      </span>
      <Link
        href={task.route}
        onClick={handleTaskClick}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:border-violet-400/60 hover:bg-violet-500/20 transition"
      >
        Open tool
        <ArrowRight className="h-3 w-3" />
      </Link>
    </li>
  )
}
