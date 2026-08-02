'use client'

import { useCallback, useEffect, useState } from 'react'
import { UK_CITIES, getLocationValue } from '@/lib/uk-cities'

export type ApiJob = {
  id: string
  title: string
  company: string
  location: string
  description: string
}

export type PublicJob = ApiJob & { matchPercentage: number }

function estimateMatch(job: ApiJob, keyword: string): number {
  const words = keyword.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  if (words.length === 0) return 55
  const text = `${job.title} ${job.description}`.toLowerCase()
  const hits = words.filter((w) => text.includes(w)).length
  return Math.min(92, 42 + hits * 14)
}

export function usePublicJobSearch(initialKeyword = 'warehouse') {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [location, setLocation] = useState('UK (Anywhere)')
  const [jobs, setJobs] = useState<PublicJob[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(
    async (kw?: string, loc?: string) => {
      const q = (kw ?? keyword).trim()
      if (!q) return
      setLoading(true)
      setSearched(true)
      try {
        const params = new URLSearchParams({
          keyword: q,
          location: getLocationValue(loc ?? location),
        })
        const res = await fetch(`/api/jobs/search?${params.toString()}`)
        if (!res.ok) throw new Error('Search failed')
        const data = (await res.json()) as { results?: ApiJob[] }
        const list = (data.results ?? []).map((j) => ({
          ...j,
          matchPercentage: estimateMatch(j, q),
        }))
        setJobs(list)
      } catch {
        setJobs([])
      } finally {
        setLoading(false)
      }
    },
    [keyword, location]
  )

  useEffect(() => {
    void runSearch(initialKeyword, 'UK (Anywhere)')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    keyword,
    setKeyword,
    location,
    setLocation,
    jobs,
    loading,
    searched,
    runSearch,
  }
}
