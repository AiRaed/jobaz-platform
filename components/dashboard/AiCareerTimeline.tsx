'use client'

import { useEffect, useState, useCallback } from 'react'
import { History } from 'lucide-react'
import { getRecentAiCareerEvents, type AiCareerTimelineEvent } from '@/lib/jobaz-ai/profile/recentEvents'

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function formatSource(source: string | null): string | null {
  if (!source) return null
  const labels: Record<string, string> = {
    cv_builder: 'CV Builder',
    writing_review: 'Writing Review',
    interview_coach: 'Interview Coach',
    job_finder: 'Job Finder',
    build_your_path: 'Build Your Path',
    jobaz_ai_signal: 'JobAZ AI',
    ai_intelligence_engine: 'AI Engine',
  }
  return labels[source] ?? source.replace(/_/g, ' ')
}

type Props = { embedded?: boolean }

export default function AiCareerTimeline({ embedded = false }: Props) {
  const [entries, setEntries] = useState<AiCareerTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const events = await getRecentAiCareerEvents(5)
      setEntries(events)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const onUpdate = () => {
      void load()
    }
    window.addEventListener('jobaz-ai-profile-updated', onUpdate)
    return () => window.removeEventListener('jobaz-ai-profile-updated', onUpdate)
  }, [load])

  if (loading) return null
  if (entries.length === 0) return null

  const timeline = (
    <div className="rounded-2xl border border-blue-500/20 bg-slate-950/50 shadow-[0_0_40px_rgba(37,99,235,0.12)] backdrop-blur p-4 md:p-5">
      <ul className="relative ml-2 space-y-3 border-l border-blue-500/25 pl-5">
        {entries.map((entry) => (
          <li key={entry.id} className="relative">
            <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <p className="text-sm text-slate-100">{entry.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatWhen(entry.createdAt)}
              {entry.source ? ` · ${formatSource(entry.source)}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )

  if (embedded) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-300/90 mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-blue-400" />
          Career Journey Timeline
        </h3>
        {timeline}
      </div>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-300/80 uppercase mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-blue-400" />
        Your AI Career Journey
      </h2>
      {timeline}
    </section>
  )
}
