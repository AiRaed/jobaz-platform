'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Building2, Briefcase, Loader2, Search, User, Users } from 'lucide-react'
import { searchPulse } from '@/lib/network/pulseSearch'
import type { PulseSearchResult } from '@/lib/network/types'
import { cn } from '@/lib/utils'

const typeIcon = {
  person: User,
  business: Building2,
  opportunity: Briefcase,
  group: Users,
}

export default function PulseSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PulseSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      setResults(await searchPulse(q))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void runSearch(query), 280)
    return () => clearTimeout(t)
  }, [query, runSearch])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, businesses, opportunities…"
          className="w-full rounded-full border border-slate-700/60 bg-slate-900/60 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <ul className="absolute z-40 mt-2 w-full rounded-xl border border-slate-700/50 bg-slate-950/95 backdrop-blur shadow-[0_0_32px_rgba(139,92,246,0.15)] overflow-hidden max-h-72 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <li className="px-4 py-3 text-xs text-slate-500">No results yet</li>
          ) : (
            results.map((r) => {
              const Icon = typeIcon[r.type]
              return (
                <li key={`${r.type}-${r.id}`}>
                  <Link
                    href={r.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-violet-500/10 transition cursor-pointer"
                  >
                    {r.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-violet-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate">{r.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[9px] uppercase text-slate-600 shrink-0">
                      {r.type === 'group' ? 'circle' : r.type}
                    </span>
                  </Link>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
