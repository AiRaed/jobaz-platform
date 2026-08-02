'use client'

import JazEyeIcon from '@/components/ui/JazEyeIcon'

export default function CareerEngineTypingBubble() {
  return (
    <div className="flex justify-start items-start gap-3 animate-in fade-in duration-300">
      <JazEyeIcon variant="header" className="flex-shrink-0" />
      <div className="rounded-2xl px-5 py-3.5 border border-violet-500/20 bg-violet-950/20">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-violet-400/70 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
