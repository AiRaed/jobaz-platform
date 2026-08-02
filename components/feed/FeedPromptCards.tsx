'use client'

import { FEED_PROMPTS } from '@/lib/feed/sampleData'

type Props = {
  onUsePrompt: (text: string, postType?: import('@/lib/feed/types').FeedPostType) => void
}

export default function FeedPromptCards({ onUsePrompt }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
      {FEED_PROMPTS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onUsePrompt(p.text, p.postType)}
          className="text-left rounded-xl border border-dashed border-violet-500/25 bg-violet-950/15 px-3 py-3 hover:border-violet-500/40 hover:bg-violet-950/25 transition"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">{p.action}</span>
          <p className="text-xs text-slate-400 mt-1 leading-snug">{p.text}</p>
        </button>
      ))}
    </div>
  )
}
