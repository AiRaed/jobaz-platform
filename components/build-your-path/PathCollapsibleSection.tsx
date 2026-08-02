'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  preview?: string
}

export default function PathCollapsibleSection({ title, children, defaultOpen = true, preview }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-5 md:p-6 text-left hover:bg-slate-900/30 transition"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-200">{title}</h2>
          {!open && preview && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{preview}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>
      {open && <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 border-t border-slate-800/40">{children}</div>}
    </section>
  )
}

