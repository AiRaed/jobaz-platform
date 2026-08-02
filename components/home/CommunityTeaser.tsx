'use client'

import { Users } from 'lucide-react'

const FEED = [
  { name: 'Alex M.', text: 'Completed SIA training', time: '2h ago' },
  { name: 'Priya K.', text: 'Got first warehouse interview', time: '5h ago' },
  { name: 'James T.', text: 'Improved CV score to 82', time: '1d ago' },
]

export default function CommunityTeaser() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
      <SectionHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEED.map((item) => (
          <div
            key={item.name}
            className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-semibold text-violet-200">
                {item.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{item.name}</p>
                <p className="text-[10px] text-slate-500">{item.time}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">{item.text}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-600 mt-6">Community features coming soon — share wins and learn from others.</p>
    </section>
  )
}

function SectionHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 text-violet-400 mb-2">
        <Users className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide font-medium">Career community</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">Share your journey</h2>
      <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
        Discuss jobs, training, CV tips, and career progress with others.
      </p>
    </div>
  )
}
