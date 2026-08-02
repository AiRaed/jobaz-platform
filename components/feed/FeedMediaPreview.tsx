'use client'

import type { FeedMedia } from '@/lib/feed/types'
import { parsePulseVideoUrl } from '@/lib/pulse/video'
import { ExternalLink, FileText, ImageIcon, Play, Sparkles } from 'lucide-react'

type Props = { media: FeedMedia }

export default function FeedMediaPreview({ media }: Props) {
  if (media.type === 'cv-comparison') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-violet-500/20 bg-slate-900/60">
        <div className="px-3 py-2 border-b border-slate-800/60 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-medium text-violet-300">{media.label}</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-800/50">
          <div className="bg-slate-950/80 p-4 min-h-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-rose-400/80 mb-2">Before</p>
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded bg-slate-700/60" />
              <div className="h-2 w-[90%] rounded bg-slate-700/40" />
              <div className="h-2 w-full rounded bg-slate-700/40" />
              <div className="h-2 w-[70%] rounded bg-slate-700/30" />
            </div>
            <p className="text-[9px] text-slate-600 mt-3 italic">Dense wall of text</p>
          </div>
          <div className="bg-gradient-to-br from-violet-950/40 to-cyan-950/20 p-4 min-h-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400/80 mb-2">After</p>
            <div className="space-y-2">
              <div className="h-2 w-[40%] rounded bg-violet-500/40" />
              <div className="h-1.5 w-full rounded bg-cyan-500/20" />
              <div className="h-1.5 w-[85%] rounded bg-cyan-500/15" />
              <div className="h-2 w-[35%] rounded bg-violet-500/30 mt-2" />
              <div className="h-1.5 w-full rounded bg-cyan-500/20" />
            </div>
            <p className="text-[9px] text-emerald-400/60 mt-3">Structured · ATS-friendly</p>
          </div>
        </div>
      </div>
    )
  }

  if (media.type === 'video' && media.url) {
    const parsed = parsePulseVideoUrl(media.url)
    if (parsed.allowed && parsed.provider === 'youtube' && parsed.embedUrl) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-cyan-500/25 aspect-video bg-black">
          <iframe
            title={media.label || 'Pulse video'}
            src={parsed.embedUrl}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-gradient-to-br from-slate-900 to-slate-950 px-4 py-4 hover:border-cyan-400/40 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <Play className="w-5 h-5 text-cyan-300 fill-cyan-300/30 ml-0.5" />
          </div>
          <div>
            <p className="text-sm text-cyan-100 font-medium">Watch video</p>
            <p className="text-[11px] text-slate-500 capitalize">
              {parsed.provider !== 'unknown' ? parsed.provider : 'External link'} · opens in new tab
            </p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-500" />
      </a>
    )
  }

  if (media.url) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-violet-500/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt="" className="w-full max-h-80 object-cover" />
      </div>
    )
  }

  if (media.type === 'video') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-cyan-500/25 bg-gradient-to-br from-slate-900 to-slate-950 aspect-video relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
            <Play className="w-6 h-6 text-cyan-300 fill-cyan-300/30 ml-0.5" />
          </div>
          <span className="text-xs text-cyan-300/80">{media.label}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-slate-900 to-cyan-950/20 aspect-[16/10] relative group">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-violet-300" />
        </div>
        <span className="text-xs text-slate-300 text-center">{media.label}</span>
        {media.label.toLowerCase().includes('certificate') && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90">
            <Sparkles className="w-3 h-3" />
            Achievement unlocked
          </div>
        )}
      </div>
    </div>
  )
}
