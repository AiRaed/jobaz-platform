'use client'

import { Heart } from 'lucide-react'

type Props = {
  message: string
}

export default function UkCareerEmotionalNudge({ message }: Props) {
  return (
    <div className="uk-ca-panel mb-4 flex items-start gap-3 px-4 py-3 rounded-xl border border-violet-500/15 bg-gradient-to-r from-violet-950/30 to-transparent animate-in fade-in duration-700">
      <Heart className="w-4 h-4 text-rose-400/80 shrink-0 mt-0.5" />
      <p className="text-xs text-slate-300 leading-relaxed italic">{message}</p>
    </div>
  )
}
