'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getLocationValue } from '@/lib/uk-cities'
import type { JobSearchResult } from '@/lib/jobs/types'

type LandingJobsContextValue = {
  keyword: string
  location: string
  setKeyword: (value: string) => void
  setLocation: (value: string) => void
  jobs: JobSearchResult[]
  loading: boolean
  error: string | null
  emptyMessage: string | null
  search: (keyword?: string, location?: string) => Promise<void>
  loadDefault: () => Promise<void>
}

const LandingJobsContext = createContext<LandingJobsContextValue | null>(null)

export function LandingJobsProvider({ children }: { children: ReactNode }) {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('UK (Anywhere)')
  const [jobs, setJobs] = useState<JobSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)

  const fetchJobs = useCallback(async (params: URLSearchParams) => {
    setLoading(true)
    setError(null)
    setEmptyMessage(null)

    try {
      const res = await fetch(`/api/jobs/landing?${params.toString()}`, { cache: 'no-store' })
      const data = (await res.json()) as {
        results?: JobSearchResult[]
        error?: string
        providers?: { reed: boolean; adzuna: boolean }
      }

      const list = data.results ?? []
      const bothFailed = data.providers && !data.providers.reed && !data.providers.adzuna

      if (bothFailed) {
        setJobs([])
        setError(data.error || 'Unable to load jobs right now. Please try again.')
        return
      }

      setJobs(list)
      if (list.length === 0) {
        setEmptyMessage(data.error || 'No jobs found. Try a different keyword or location.')
      }
    } catch {
      setJobs([])
      setError('Unable to load jobs right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDefault = useCallback(async () => {
    const params = new URLSearchParams({ default: '1', location: 'UK' })
    await fetchJobs(params)
  }, [fetchJobs])

  const search = useCallback(
    async (kw?: string, loc?: string) => {
      const nextKeyword = (kw ?? keyword).trim()
      const nextLocation = getLocationValue(loc ?? location)

      if (kw !== undefined) setKeyword(kw)
      if (loc !== undefined) setLocation(loc)

      if (!nextKeyword) {
        await loadDefault()
        return
      }

      const params = new URLSearchParams({
        keyword: nextKeyword,
        location: nextLocation,
      })
      await fetchJobs(params)
    },
    [fetchJobs, keyword, location, loadDefault]
  )

  useEffect(() => {
    void loadDefault()
  }, [loadDefault])

  const value = useMemo(
    () => ({
      keyword,
      location,
      setKeyword,
      setLocation,
      jobs,
      loading,
      error,
      emptyMessage,
      search,
      loadDefault,
    }),
    [keyword, location, jobs, loading, error, emptyMessage, search, loadDefault]
  )

  return <LandingJobsContext.Provider value={value}>{children}</LandingJobsContext.Provider>
}

export function useLandingJobs() {
  const ctx = useContext(LandingJobsContext)
  if (!ctx) throw new Error('useLandingJobs must be used within LandingJobsProvider')
  return ctx
}

export function useLandingJobsOptional() {
  return useContext(LandingJobsContext)
}
