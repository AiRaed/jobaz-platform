'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import type { ProfileCompletion } from '@/lib/identity-profile/types'

type Props = {
  completion: ProfileCompletion
}

export default function ProfileCompletionCard({ completion }: Props) {
  const pct = completion.percentage

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-950/80 via-cyan-950/10 to-slate-950/80 p-5 shadow-[0_0_28px_rgba(6,182,212,0.08)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Identity strength</p>
          <p className="text-xs text-slate-500 mt-0.5">{completion.nextStep}</p>
        </div>
        <span className="text-2xl font-bold text-cyan-300">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {completion.items.map((item) => {
          const inner = (
            <>
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-300'}>
                {item.label}
              </span>
            </>
          )
          return (
            <li key={item.id} className="flex items-center gap-2 text-xs">
              {item.href && !item.done ? (
                <Link href={item.href} className="flex items-center gap-2 hover:text-cyan-300 transition">
                  {inner}
                </Link>
              ) : (
                <span className="flex items-center gap-2">{inner}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
