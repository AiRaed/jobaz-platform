'use client'

import { Users } from 'lucide-react'

type Props = { items: string[] }

export default function PeopleLikeYouSection({ items }: Props) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-200">People like you start here</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Supportive, realistic first steps â€” especially if you are new to the UK job market
      </p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-slate-300 rounded-xl border border-slate-800/60 bg-slate-900/30 px-3 py-2.5"
          >
            <span className="text-violet-400 mt-0.5">â€¢</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

