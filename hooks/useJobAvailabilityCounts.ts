'use client'

import { useEffect, useState } from 'react'

/** Fetch live job match counts for recommendation keywords (best-effort). */
export function useJobAvailabilityCounts(keywords: string[]): Record<string, number | null> {
  const [counts, setCounts] = useState<Record<string, number | null>>({})

  useEffect(() => {
    const unique = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))].slice(0, 4)
    if (!unique.length) return

    let cancelled = false

    void (async () => {
      const next: Record<string, number | null> = {}
      for (const kw of unique) {
        next[kw] = null
      }
      if (!cancelled) setCounts({ ...next })

      await Promise.all(
        unique.map(async (kw) => {
          try {
            const res = await fetch(
              `/api/jobs/search?keyword=${encodeURIComponent(kw)}&location=UK`,
              { cache: 'no-store' }
            )
            if (!res.ok) {
              next[kw] = null
              return
            }
            const body = (await res.json()) as { results?: unknown[] }
            next[kw] = body.results?.length ?? 0
          } catch {
            next[kw] = null
          }
        })
      )

      if (!cancelled) setCounts({ ...next })
    })()

    return () => {
      cancelled = true
    }
  }, [keywords.join('|')])

  return counts
}
