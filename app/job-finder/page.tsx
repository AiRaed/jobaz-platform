'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Briefcase, Clock } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import PageHeader from '@/components/PageHeader'
import TranslatableText from '@/components/TranslatableText'
// NOTE: Removed user-storage imports - saved jobs now use Supabase API
import { UK_CITIES, getLocationValue } from '@/lib/uk-cities'
import JobSourceBadge from '@/components/jobs/JobSourceBadge'
import type { JobSource } from '@/lib/jobs/types'

const JOB_FINDER_CACHE_KEY = "jobaz-job-finder-cache";
const JOB_FINDER_TTL_MS = 20 * 60 * 1000; // 20 minutes

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  type: string
  link?: string
  salary?: string
  source?: JobSource
  featured?: boolean
  partnerCompany?: boolean
  routeTags?: string[]
  bestMatch?: boolean
}

export default function JobFinderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('UK (Anywhere)')
  const [type, setType] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set()) // Set of job_key for quick lookups
  const [savedItems, setSavedItems] = useState<Array<{ job_key: string; job: Job; created_at: string }>>([])
  const jobsViewedRef = useRef(false)
  const searchViewedDayRef = useRef<string | null>(null) // Full saved items from Supabase
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefillLabel, setPrefillLabel] = useState<string | null>(null) // Label from Career Assistant
  const [caSessionId, setCaSessionId] = useState<string | null>(null) // Session ID from Career Assistant
  const hasAutoSearchedRef = useRef(false)

  // Read query or jobTitle from URL query parameter on mount
  useEffect(() => {
    // Priority: q param (Career Assistant) > query param (new) > jobTitle param (legacy)
    const qFromUrl = searchParams.get('q')
    const queryFromUrl = searchParams.get('query')
    const jobTitleFromUrl = searchParams.get('jobTitle')
    const locationFromUrl = searchParams.get('location')
    const categoryFromUrl = searchParams.get('category')
    const fromParam = searchParams.get('from')
    const sessionParam = searchParams.get('ca_session')
    const planTask = searchParams.get('planTask')

    if (planTask === 'apply-steward' || planTask === 'save-security') {
      void import('@/lib/dashboard/careerOs/actionPlanProgress').then(({ markActionPlanTask }) => {
        markActionPlanTask(planTask, 'in_progress')
      })
    }
    
    // Check if coming from Career Assistant
    if (fromParam === 'career_assistant' || sessionParam) {
      if (sessionParam) {
        // Verify snapshot exists before setting session
        if (typeof window !== 'undefined') {
          try {
            const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
            if (snapshot) {
              const parsed = JSON.parse(snapshot)
              if (parsed.sessionId === sessionParam) {
                setCaSessionId(sessionParam)
                localStorage.setItem('jobaz_ca_session', sessionParam)
              }
            }
          } catch (err) {
            console.error('Failed to verify/store CA session:', err)
          }
        }
      } else if (typeof window !== 'undefined') {
        // Try to restore from localStorage if param missing but we have stored session
        try {
          const stored = localStorage.getItem('jobaz_ca_session')
          if (stored) {
            // Verify snapshot still exists
            const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
            if (snapshot) {
              const parsed = JSON.parse(snapshot)
              if (parsed.sessionId === stored) {
                setCaSessionId(stored)
              } else {
                // Session mismatch, clear stored session
                localStorage.removeItem('jobaz_ca_session')
              }
            } else {
              // Snapshot missing, clear stored session
              localStorage.removeItem('jobaz_ca_session')
            }
          }
        } catch (err) {
          console.error('Failed to restore CA session:', err)
        }
      }
    } else if (typeof window !== 'undefined') {
      // Check localStorage for stored session (for refresh durability)
      try {
        const stored = localStorage.getItem('jobaz_ca_session')
        if (stored) {
          // Verify snapshot still exists
          const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
          if (snapshot) {
            const parsed = JSON.parse(snapshot)
            if (parsed.sessionId === stored) {
              setCaSessionId(stored)
            } else {
              // Session mismatch, clear stored session
              localStorage.removeItem('jobaz_ca_session')
            }
          } else {
            // Snapshot missing, clear stored session
            localStorage.removeItem('jobaz_ca_session')
          }
        }
      } catch (err) {
        console.error('Failed to restore CA session:', err)
      }
    }
    
    // If q param exists (from Career Assistant), use it and store the label
    // Only set title if search box is empty (on first load)
    if (qFromUrl) {
      const decodedQ = decodeURIComponent(qFromUrl)
      if (!title) {
        setTitle(decodedQ)
      }
      setPrefillLabel(decodedQ) // Always set label for UI hint
    } else if (queryFromUrl && !title) {
      setTitle(decodeURIComponent(queryFromUrl))
      setPrefillLabel(null) // Clear prefill label if not from Career Assistant
    } else if (jobTitleFromUrl && !title) {
      setTitle(decodeURIComponent(jobTitleFromUrl))
      setPrefillLabel(null) // Clear prefill label if not from Career Assistant
    } else if (!qFromUrl && !queryFromUrl && !jobTitleFromUrl) {
      // Clear prefill label if no Career Assistant params
      setPrefillLabel(null)
    }
    
    // Set location if provided in URL
    if (locationFromUrl && UK_CITIES.includes(locationFromUrl as any)) {
      setLocation(locationFromUrl)
    }
    
    // If category param exists but no q param, we still want to show it came from Career Assistant
    // But we won't have a label, so we'll use the category as fallback
    if (categoryFromUrl && !qFromUrl) {
      const decodedCategory = decodeURIComponent(categoryFromUrl)
      setPrefillLabel(decodedCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    }
  }, [searchParams])

  // Auto-trigger search when query param or q param exists (only once to avoid API spam)
  useEffect(() => {
    const queryFromUrl = searchParams.get('query')
    const qFromUrl = searchParams.get('q')
    
    // Only auto-search if:
    // 1. We have a query param or q param
    // 2. We haven't auto-searched yet
    // 3. We're not currently loading
    // 4. Title is set (from previous effect)
    // 5. We haven't already searched
    if ((queryFromUrl || qFromUrl) && !hasAutoSearchedRef.current && !loading && title && !searched) {
      hasAutoSearchedRef.current = true
      // Small delay to ensure all state is properly set before triggering search
      const timer = setTimeout(() => {
        // Use the current title value to search
        if (title.trim()) {
          handleSearch()
        }
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, title, loading, searched]) // handleSearch is stable and uses current state values

  // NOTE: jobFinderLocation localStorage persistence removed
  // Location is now only stored in component state

  // Restore cached search state on mount (but only if no URL param was provided)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip cache restoration if we have a query or jobTitle from URL
    const queryFromUrl = searchParams.get('query')
    const jobTitleFromUrl = searchParams.get('jobTitle')
    if (queryFromUrl || jobTitleFromUrl) return;

    try {
      const raw = window.localStorage.getItem(JOB_FINDER_CACHE_KEY);
      if (!raw) return;

      const cache = JSON.parse(raw) as {
        keyword: string;
        location: string;
        jobType?: string;
        jobs: Job[];
        timestamp: number;
        savedJobs?: Job[];
      };

      const now = Date.now();
      if (now - cache.timestamp > JOB_FINDER_TTL_MS) {
        // cache expired – remove it and do nothing
        window.localStorage.removeItem(JOB_FINDER_CACHE_KEY);
        return;
      }

      // restore state
      if (cache.keyword) setTitle(cache.keyword);
      // Only restore location from cache if it's a valid UK city, otherwise use saved jobFinderLocation
      if (cache.location && UK_CITIES.includes(cache.location as any)) {
        setLocation(cache.location);
      }
      if (cache.jobType) setType(cache.jobType);
      if (cache.jobs && cache.jobs.length > 0) {
        setJobs(cache.jobs);
        setSearched(true);
      }
      // NOTE: savedJobs are now loaded from Supabase, not from cache
      // Removed cache.savedJobs restoration
    } catch (err) {
      console.error("Failed to restore job finder cache", err);
    }
  }, [searchParams]);

  // Job Finder page view — once per session/day
  useEffect(() => {
    if (jobsViewedRef.current) return
    jobsViewedRef.current = true
    const day = new Date().toISOString().slice(0, 10)
    void import('@/lib/jobaz-ai/emitSignal').then(({ emitAiSignal }) =>
      emitAiSignal({
        type: 'jobs_viewed',
        source: 'job-finder',
        impact: { engagement: 2, jobSearchActivity: 3 },
        metadata: {
          dedupeId: `finder-page-${day}`,
          action: 'page_view',
        },
      })
    )
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    const loadSavedJobs = async () => {
      try {
        console.log('[SavedJobs] Loading saved jobs from Supabase')
        const response = await fetch('/api/saved-jobs/list')
        
        if (!response.ok) {
          if (response.status === 401) {
            // User not authenticated - that's okay, just start with empty saved jobs
            console.log('[SavedJobs] User not authenticated, starting with empty saved jobs')
            setIsInitialized(true)
            return
          }
          throw new Error(`Failed to load saved jobs: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.ok && Array.isArray(data.items)) {
          console.log('[SavedJobs] Loaded', data.items.length, 'saved jobs from Supabase')
          
          // Convert saved items to Job array for backward compatibility
          const jobs: Job[] = data.items.map((item: { job_key: string; job: Job; created_at: string }) => item.job)
          
          // Create Set of job_key for quick lookups
          const jobKeySet = new Set<string>(
            (data?.items ?? []).map((x: any) => String(x.job_key ?? x))
          )
          
          setSavedJobs(jobs)
          setSavedSet(jobKeySet)
          setSavedItems(data.items)
        } else {
          console.error('[SavedJobs] Invalid response format:', data)
          setSavedJobs([])
          setSavedSet(new Set())
          setSavedItems([])
        }
      } catch (error) {
        console.error('[SavedJobs] Error loading saved jobs:', error)
        // On error, start with empty saved jobs
        setSavedJobs([])
        setSavedSet(new Set())
        setSavedItems([])
      } finally {
        setIsInitialized(true)
      }
    }

    loadSavedJobs()
  }, [isInitialized])

  // Pre-fill job title from saved base CV on mount (only if no URL param)
  // NOTE: This still uses localStorage for baseCv (not related to saved jobs)
  useEffect(() => {
    // Skip if we have a query or jobTitle from URL query parameter
    const queryFromUrl = searchParams.get('query')
    const jobTitleFromUrl = searchParams.get('jobTitle')
    if (queryFromUrl || jobTitleFromUrl) return;

    if (typeof window !== 'undefined') {
      // NOTE: Using legacy non-scoped key for baseCv (not related to saved jobs migration)
      const baseCvKey = 'jobaz_baseCv'
      const raw = localStorage.getItem(baseCvKey)
      if (raw) {
        try {
          const baseCv = JSON.parse(raw)
          
          // Determine the job title to use
          let inferredTitle = ''
          
          // Priority 1: Use targetTitle if available
          if (baseCv.targetTitle && baseCv.targetTitle.trim()) {
            inferredTitle = baseCv.targetTitle.trim()
          }
          // Priority 2: Use currentRole if available
          else if (baseCv.currentRole && baseCv.currentRole.trim()) {
            inferredTitle = baseCv.currentRole.trim()
          }
          // Priority 3: Try to infer from summary (first few words before a comma)
          else if (baseCv.summary && baseCv.summary.trim()) {
            const summary = baseCv.summary.trim()
            const commaIndex = summary.indexOf(',')
            if (commaIndex > 0) {
              inferredTitle = summary.substring(0, commaIndex).trim()
            } else {
              // If no comma, take first few words (up to 5 words)
              const words = summary.split(/\s+/).slice(0, 5)
              inferredTitle = words.join(' ')
            }
          }
          
          // Only set if we found a title and the input is still empty
          if (inferredTitle && !title) {
            setTitle(inferredTitle)
          }
        } catch (error) {
          console.error('Failed to parse base CV from localStorage:', error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // Run on mount and when searchParams change

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (title.trim()) params.set('keyword', title.trim())
      // Use getLocationValue to convert dropdown selection to API value
      const locationValue = getLocationValue(location)
      if (locationValue.trim()) params.set('location', locationValue.trim())

      const response = await fetch(`/api/jobs/search?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Could not load jobs. Please try again.')
      }

      const data = await response.json()
      const results = data.results || []
      setJobs(results)

      const day = new Date().toISOString().slice(0, 10)
      if (searchViewedDayRef.current !== day) {
        searchViewedDayRef.current = day
        void import('@/lib/jobaz-ai/emitSignal').then(({ emitAiSignal }) =>
          emitAiSignal({
            type: 'jobs_viewed',
            source: 'job-finder',
            impact: { engagement: 2, jobSearchActivity: 5 },
            metadata: {
              dedupeId: `finder-search-${day}`,
              action: 'search_results',
              results_count: results.length,
              keyword: title.trim() || undefined,
              location: getLocationValue(location) || undefined,
            },
          })
        )
      }

      // Cache Adzuna jobs to sessionStorage when loaded
      if (typeof window !== 'undefined') {
        results.forEach((job: Job) => {
          if (job.id?.startsWith('adzuna_')) {
            try {
              const rawId = job.id.replace('adzuna_', '')
              const cacheKey = `adzuna_job_${rawId}`
              
              const cachedJob = {
                id: job.id,
                title: job.title || '',
                company: job.company || '',
                description: job.description || '',
                location: job.location || '',
                type: job.type || '',
                link: job.link || '',
                salary: (job as any).salary,
                contract: (job as any).contract,
                redirect_url: (job as any).redirect_url || job.link,
                created: (job as any).created,
                category: (job as any).category,
              }
              
              sessionStorage.setItem(cacheKey, JSON.stringify(cachedJob))
            } catch (error) {
              console.error('Error caching Adzuna job:', error)
            }
          }
        })
      }

      // Save search state to cache after successful search
      if (typeof window !== "undefined") {
        try {
          const cache = {
            keyword: title,
            location: location,
            jobType: type,
            jobs: results,
            timestamp: Date.now(),
            // NOTE: savedJobs are now persisted in Supabase, not in cache
          };
          window.localStorage.setItem(JOB_FINDER_CACHE_KEY, JSON.stringify(cache));
        } catch (err) {
          console.error("Failed to cache job finder state", err);
        }
      }
    } catch (error) {
      console.error('Error searching jobs:', error)
      setError(error instanceof Error ? error.message : 'Could not load jobs. Please try again.')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  // Cache Adzuna job to sessionStorage before navigation
  const cacheAdzunaJob = (job: Job) => {
    if (typeof window === 'undefined' || !job.id?.startsWith('adzuna_')) return
    
    try {
      const rawId = job.id.replace('adzuna_', '')
      const cacheKey = `adzuna_job_${rawId}`
      
      // Store minimal safe payload
      const cachedJob = {
        id: job.id,
        title: job.title || '',
        company: job.company || '',
        description: job.description || '',
        location: job.location || '',
        type: job.type || '',
        link: job.link || '',
        // Include any additional fields that might be useful
        salary: (job as any).salary,
        contract: (job as any).contract,
        redirect_url: (job as any).redirect_url || job.link,
        created: (job as any).created,
        category: (job as any).category,
      }
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cachedJob))
    } catch (error) {
      console.error('Error caching Adzuna job:', error)
    }
  }

  const handleViewJob = (job: Job) => {
    // Cache Adzuna job before navigation
    cacheAdzunaJob(job)
    
    if (job.link) {
      window.open(job.link, '_blank')
    } else {
      router.push(`/job-details/${job.id}`)
    }
  }

  const handleTailorCV = (jobId: string) => {
    // Find the job in the jobs array to cache it
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      cacheAdzunaJob(job)
    }
    
    router.push(`/job-details/${jobId}?mode=tailorCv`)
  }

  const handleSaveJob = async (job: Job) => {
    // Use job.id as job_key
    const jobKey = job.id
    
    // Optimistic update
    const wasSaved = savedSet.has(jobKey)
    
    if (!wasSaved) {
      // Optimistically add to UI
      setSavedJobs((prev) => [...prev, job])
      setSavedSet((prev) => new Set([...prev, jobKey]))
    } else {
      // Optimistically remove from UI
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobKey))
      setSavedSet((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobKey)
        return newSet
      })
      setSavedItems((prev) => prev.filter((item) => item.job_key !== jobKey))
    }

    try {
      console.log('[SavedJobs] Toggling saved job:', jobKey)
      const response = await fetch('/api/saved-jobs/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_key: jobKey,
          job: job,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.error('[SavedJobs] User not authenticated')
          // Revert optimistic update
          if (!wasSaved) {
            setSavedJobs((prev) => prev.filter((j) => j.id !== jobKey))
            setSavedSet((prev) => {
              const newSet = new Set(prev)
              newSet.delete(jobKey)
              return newSet
            })
          } else {
            setSavedJobs((prev) => [...prev, job])
            setSavedSet((prev) => new Set([...prev, jobKey]))
          }
          return
        }
        throw new Error(`Failed to toggle saved job: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.ok) {
        console.log('[SavedJobs] Toggle successful, saved:', data.saved)
        
        if (data.saved) {
          void import('@/lib/jobaz-ai/emitSignal').then(({ emitAiSignal }) =>
            emitAiSignal({
              type: 'jobs_saved',
              source: 'job-finder',
              impact: { readiness: 3, engagement: 5, jobSearchActivity: 8 },
              metadata: {
                dedupeId: jobKey,
                job_id: jobKey,
                job_title: job.title,
                company: job.company,
                location: job.location,
              },
            })
          )
          // Job was saved - add to savedItems
          setSavedItems((prev) => [
            ...prev,
            {
              job_key: jobKey,
              job: job,
              created_at: new Date().toISOString(),
            },
          ])
        } else {
          // Job was removed - remove from savedItems
          setSavedItems((prev) => prev.filter((item) => item.job_key !== jobKey))
        }
      } else {
        throw new Error(data.error || 'Failed to toggle saved job')
      }
    } catch (error) {
      console.error('[SavedJobs] Error toggling saved job:', error)
      // Revert optimistic update on error
      if (!wasSaved) {
        setSavedJobs((prev) => prev.filter((j) => j.id !== jobKey))
        setSavedSet((prev) => {
          const newSet = new Set(prev)
          newSet.delete(jobKey)
          return newSet
        })
      } else {
        setSavedJobs((prev) => [...prev, job])
        setSavedSet((prev) => new Set([...prev, jobKey]))
      }
    }
  }

  const handleRemoveSavedJob = async (jobId: string) => {
    // Use the same toggle logic
    const job = savedJobs.find((j) => j.id === jobId)
    if (job) {
      await handleSaveJob(job)
    }
  }

  const isJobSaved = (jobId: string) => {
    return savedSet.has(jobId)
  }

  // Clear prefill from Career Assistant
  const handleClearPrefill = () => {
    setPrefillLabel(null)
    setCaSessionId(null)
    // Remove category, q, from, and ca_session params from URL without triggering navigation
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('q')
    params.delete('from')
    params.delete('ca_session')
    const newUrl = params.toString() ? `/job-finder?${params.toString()}` : '/job-finder'
    router.replace(newUrl)
    // Clear stored session
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('jobaz_ca_session')
      } catch (err) {
        console.error('Failed to clear CA session:', err)
      }
    }
  }

  // Navigate back to Career Assistant results
  const handleBackToResults = () => {
    if (caSessionId) {
      router.push(`/uk-career-assistant?resume=1&ca_session=${encodeURIComponent(caSessionId)}`)
    }
  }

  return (
    <AppShell wide platform>
      <PlatformToolShell>
        <PageHeader
          title="Find jobs that match your skills"
          subtitle="Search for roles based on your CV and preferences"
          showBackToDashboard={false}
        />

        <section className="jobaz-hero jobaz-keep-light mb-5 rounded-2xl border border-slate-400/20 px-4 py-4 md:px-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300/90 font-medium mb-1">
            JobAZ
          </p>
          <h2 className="text-lg md:text-xl font-bold text-slate-50 tracking-tight">
            Job Finder
          </h2>
          <p className="text-sm text-slate-300/95 mt-1.5 max-w-2xl leading-relaxed">
            Search UK roles that match your skills — then save jobs and open them in your plan.
          </p>
        </section>

        {/* Back to Career Assistant Results Banner */}
        {caSessionId && (
          <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <span>You came from Career Assistant</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleBackToResults}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)]"
                >
                  Back to results
                </button>
                <button
                  onClick={() => {
                    // Just clear the banner, keep filters
                    setCaSessionId(null)
                    if (typeof window !== 'undefined') {
                      try {
                        localStorage.removeItem('jobaz_ca_session')
                      } catch (err) {
                        console.error('Failed to clear CA session:', err)
                      }
                    }
                    // Remove from URL
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete('from')
                    params.delete('ca_session')
                    const newUrl = params.toString() ? `/job-finder?${params.toString()}` : '/job-finder'
                    router.replace(newUrl)
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-purple-100 border border-purple-500/30 hover:border-purple-400/50 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prefill Hint from Career Assistant (only show if no back banner) */}
        {prefillLabel && !caSessionId && (
          <div className="mb-6 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <span>Prefilled from Career Assistant:</span>
              <span className="font-medium text-purple-100">{prefillLabel}</span>
            </div>
            <button
              onClick={handleClearPrefill}
              className="px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-purple-100 border border-purple-500/30 hover:border-purple-400/50 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Search Controls */}
        <div className="jobaz-card mb-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                Job Title
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Customer Service"
                  className="jobaz-input w-full pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none z-10" />
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    // Auto-trigger search when location changes
                    if (searched || title.trim()) {
                      handleSearch()
                    }
                  }}
                  className="jobaz-input w-full pl-10 appearance-none cursor-pointer"
                >
                  {UK_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-[var(--text-secondary)] font-medium mb-2 text-sm">
                Job Type
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none z-10" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="jobaz-input w-full pl-10 appearance-none cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-5">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="jobaz-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Search Jobs'}
            </button>
          </div>
        </div>

        {/* Main Content: Jobs + Saved Jobs Sidebar */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column: Job Results */}
          <div className="flex-1">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 rounded-xl border border-red-500/60 bg-red-950/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Results */}
            {searched && (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9b5cff] mb-4"></div>
                    <p className="text-gray-400">Searching for jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="jobaz-card text-center py-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                    <p className="text-[var(--text-secondary)] text-lg mb-2">No jobs found for this search.</p>
                    <p className="text-[var(--text-muted)] text-sm">
                      Try different keywords or location.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <p className="text-[var(--text-secondary)]">
                        Found <span className="text-[var(--text-primary)] font-semibold">{jobs.length}</span>{' '}
                        {jobs.length === 1 ? 'job' : 'jobs'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition hover:border-[var(--bg-primary)]/40"
                        >
                          {/* Job Header */}
                          <div className="mb-4">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {job.bestMatch && (
                                <span className="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                  Best match
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-heading font-semibold mb-1 text-[var(--text-primary)]">
                              <TranslatableText text={job.title}>
                                {job.title}
                              </TranslatableText>
                            </h3>
                            <p className="text-[var(--bg-primary)] font-medium">{job.company}</p>
                            {job.salary && (
                              <p className="text-sm text-emerald-600 dark:text-emerald-400/90 mt-1">{job.salary}</p>
                            )}
                          </div>

                          {/* Job Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{job.type}</span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-3">
                            <TranslatableText text={job.description}>
                              {job.description}
                            </TranslatableText>
                          </p>

                          {/* Match Badge (Optional placeholder) */}
                          <div className="mb-4">
                            <JobSourceBadge
                              source={job.source}
                              featured={job.featured}
                              partnerCompany={job.partnerCompany}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={() => handleViewJob(job)}
                              className="jobaz-btn-primary w-full"
                            >
                              View Job
                            </button>
                            <button
                              onClick={() => handleSaveJob(job)}
                              disabled={isJobSaved(job.id)}
                              className="jobaz-btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isJobSaved(job.id) ? 'Saved' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleTailorCV(job.id)}
                              className="jobaz-btn-primary w-full"
                            >
                              Tailor CV
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Initial State Message */}
            {!searched && (
              <div className="jobaz-card text-center py-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] text-lg mb-2">
                  Start your job search
                </p>
                <p className="text-[var(--text-muted)] text-sm">
                  Enter your criteria above and click Search to find matching jobs
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Saved Jobs Sidebar */}
          <div className="w-full md:w-80">
            <div className="md:sticky md:top-4">
              <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">Saved Jobs</h2>
              {savedJobs.length === 0 ? (
                <div className="jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                  <p className="text-[var(--text-secondary)]">No saved jobs yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[var(--bg-primary)]/40"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-heading font-semibold mb-1 text-[var(--text-primary)]">
                            {job.title}
                          </h3>
                          <p className="text-[var(--bg-primary)] font-medium mb-2">{job.company}</p>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleViewJob(job)}
                            className="jobaz-btn-primary w-full"
                          >
                            View Job
                          </button>
                          <button
                            onClick={() => handleTailorCV(job.id)}
                            className="jobaz-btn-primary w-full"
                          >
                            Tailor CV
                          </button>
                          <button
                            onClick={() => handleRemoveSavedJob(job.id)}
                            className="jobaz-btn-secondary w-full"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PlatformToolShell>
    </AppShell>
  )
}
