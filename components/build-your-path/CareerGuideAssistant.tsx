'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Send, Sparkles } from 'lucide-react'
import type { GuideInsight, QuickQuestion } from '@/lib/build-your-path/types'
import JazEyeIcon from '@/components/ui/JazEyeIcon'

type Props = {
  insights: GuideInsight[]
  readinessRange: string
  quickQuestions: QuickQuestion[]
  onAsk: (question: string) => string
  variant?: 'sidebar' | 'mobile'
}

export default function CareerGuideAssistant({
  insights,
  readinessRange,
  quickQuestions,
  onAsk,
  variant = 'sidebar',
}: Props) {
  const [input, setInput] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const submit = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setReply(onAsk(trimmed))
    setInput('')
    if (variant === 'mobile') setMobileOpen(true)
  }

  const panel = (
    <>
      <div className="flex items-center gap-2 mb-3">
        <JazEyeIcon variant="inline" />
        <div>
          <h3 className="text-sm font-semibold text-violet-200">JAZ Guide</h3>
          <p className="text-[10px] text-slate-500">Your path assistant</p>
        </div>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-slate-900/40 p-3 mb-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Based on your profile</p>
        <ul className="space-y-1.5">
          {insights.map((item, i) => (
            <li key={i} className="text-xs text-slate-300 flex gap-2">
              <span className="text-violet-400">•</span>
              {item.text}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-cyan-400/90 mt-3 pt-2 border-t border-slate-800/50">
          Estimated readiness: <span className="font-medium">{readinessRange}</span>
        </p>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit(input)}
          placeholder="Ask about this path..."
          className="flex-1 text-xs px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <button
          type="button"
          onClick={() => submit(input)}
          className="px-3 py-2 rounded-lg bg-violet-600/80 text-white hover:bg-violet-500 transition"
          aria-label="Send question"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickQuestions.map((q) => (
          <button
            key={q.question}
            type="button"
            onClick={() => submit(q.question)}
            className="text-[10px] px-2.5 py-1 rounded-full border border-slate-700/50 bg-slate-900/50 text-slate-400 hover:border-violet-500/30 hover:text-violet-300 transition text-left"
          >
            {q.question}
          </button>
        ))}
      </div>

      {reply && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 p-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-medium text-cyan-300">JAZ</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{reply}</p>
        </div>
      )}
    </>
  )

  if (variant === 'mobile') {
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pointer-events-none">
        <div className="pointer-events-auto max-w-lg mx-auto rounded-2xl border border-violet-500/30 bg-slate-950/95 backdrop-blur-xl shadow-[0_-8px_40px_rgba(139,92,246,0.2)] overflow-hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-violet-200">
              <JazEyeIcon variant="inline" />
              JAZ Guide
            </span>
            {mobileOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>
          {mobileOpen && <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">{panel}</div>}
        </div>
      </div>
    )
  }

  return (
    <aside className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 to-slate-950/80 p-5 shadow-[0_0_28px_rgba(139,92,246,0.12)] lg:sticky lg:top-6">
      {panel}
    </aside>
  )
}

