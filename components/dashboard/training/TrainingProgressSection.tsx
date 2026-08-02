'use client'

import { cn } from '@/lib/utils'
import type { TrainingProgressStats } from '@/lib/training/types'

type Props = {
  stats: TrainingProgressStats
}

const CARDS: { key: keyof TrainingProgressStats; label: string; accent: string }[] = [
  { key: 'required', label: 'Required', accent: 'text-violet-300 border-violet-500/30 bg-violet-950/20' },
  { key: 'inProgress', label: 'In Progress', accent: 'text-amber-300 border-amber-500/30 bg-amber-950/20' },
  { key: 'completed', label: 'Completed', accent: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20' },
  { key: 'saved', label: 'Saved', accent: 'text-cyan-300 border-cyan-500/30 bg-cyan-950/20' },
]

export default function TrainingProgressSection({ stats }: Props) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {CARDS.map(({ key, label, accent }) => (
        <div key={key} className={cn('rounded-lg border px-3 py-2.5', accent)}>
          <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{stats[key]}</p>
        </div>
      ))}
    </section>
  )
}
