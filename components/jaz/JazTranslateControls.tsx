'use client'

import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onToggle: () => void
  hoverEnabled: boolean
  onHoverEnabledChange: (enabled: boolean) => void
  className?: string
}

export default function JazTranslateControls({
  open,
  onToggle,
  hoverEnabled,
  onHoverEnabledChange,
  className,
}: Props) {
  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'jaz-translate-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition',
          open
            ? 'jaz-translate-btn--open border-cyan-500/40 bg-cyan-950/30 text-cyan-100'
            : 'border-slate-700/50 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-200'
        )}
        title="Translation — one capability of JAZ"
      >
        <Languages className="w-3.5 h-3.5" />
        Translate
      </button>

      {open && (
        <div className="jaz-translate-menu absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-slate-700/60 bg-slate-950/95 backdrop-blur-xl shadow-xl p-3 space-y-2">
          <p className="jaz-translate-menu-label text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Translation
          </p>
          <label className="jaz-translate-menu-row flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hoverEnabled}
              onChange={(e) => onHoverEnabledChange(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-violet-600"
            />
            Hover to translate page
          </label>
          <p className="jaz-translate-menu-hint text-[10px] text-slate-500 leading-relaxed">
            Paste text below, or highlight text on the page when hover is on.
          </p>
        </div>
      )}
    </div>
  )
}
