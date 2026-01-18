'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Briefcase, Clock } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import PageHeader from '@/components/PageHeader'
import TranslatableText from '@/components/TranslatableText'
// NOTE: Removed user-storage imports - saved jobs now use Supabase API
import { UK_CITIES, getLocationValue } from '@/lib/uk-cities'

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
  const [savedItems, setSavedItems] = useState<Array<{ job_key: string; job: Job; created_at: string }>>([]) // Full saved items from Supabase
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasAutoSearchedRef = useRef(false)

  // Read query or jobTitle from URL query parameter on mount
  useEffect(() => {
    // Priority: query param (new) > jobTitle param (legacy)
    const queryFromUrl = searchParams.get('query')
    const jobTitleFromUrl = searchParams.get('jobTitle')
    const locationFromUrl = searchParams.get('location')
    
    if (queryFromUrl) {
      setTitle(decodeURIComponent(queryFromUrl))
    } else if (jobTitleFromUrl) {
      setTitle(decodeURIComponent(jobTitleFromUrl))
    }
    
    // Set location if provided in URL
    if (locationFromUrl && UK_CITIES.includes(locationFromUrl as any)) {
      setLocation(locationFromUrl)
    }
  }, [searchParams])

  // Auto-trigger search when query param exists (only once to avoid API spam)
  useEffect(() => {
    const queryFromUrl = searchParams.get('query')
    
    // Only auto-search if:
    // 1. We have a query param
    // 2. We haven't auto-searched yet
    // 3. We're not currently loading
    // 4. Title is set (from previous effect)
    // 5. We haven't already searched
    if (queryFromUrl && !hasAutoSearchedRef.current && !loading && title && !searched) {
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

  // Load saved jobs from Supabase on mount
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

  return (
    <AppShell className="max-w-7xl">
        <PageHeader
          title="Find jobs that match your skills"
          subtitle="Search for roles based on your CV and preferences"
        />

        {/* Search Controls */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label className="block text-gray-400 font-medium mb-2 text-sm">
                Job Title
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Customer Service"
                  className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#9b5cff] transition-colors"
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
              <label className="block text-gray-400 font-medium mb-2 text-sm">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none z-10" />
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    // Auto-trigger search when location changes
                    if (searched || title.trim()) {
                      handleSearch()
                    }
                  }}
                  className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#9b5cff] transition-colors appearance-none cursor-pointer"
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
              <label className="block text-gray-400 font-medium mb-2 text-sm">
                Job Type
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none z-10" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#9b5cff] transition-colors appearance-none cursor-pointer"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-6">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full md:w-auto rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
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
                  <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                    <p className="text-gray-400 text-lg mb-2">No jobs found for this search.</p>
                    <p className="text-gray-500 text-sm">
                      Try different keywords or location.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <p className="text-gray-400">
                        Found <span className="text-white font-semibold">{jobs.length}</span>{' '}
                        {jobs.length === 1 ? 'job' : 'jobs'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6"
                        >
                          {/* Job Header */}
                          <div className="mb-4">
                            <h3 className="text-xl font-heading font-semibold mb-1 text-white">
                              <TranslatableText text={job.title}>
                                {job.title}
                              </TranslatableText>
                            </h3>
                            <p className="text-[#9b5cff] font-medium">{job.company}</p>
                          </div>

                          {/* Job Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Clock className="w-4 h-4" />
                              <span>{job.type}</span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-300 text-sm mb-6 line-clamp-3">
                            <TranslatableText text={job.description}>
                              {job.description}
                            </TranslatableText>
                          </p>

                          {/* Match Badge (Optional placeholder) */}
                          <div className="mb-4">
                            <span className="inline-block bg-[#9b5cff]/20 text-[#9b5cff] text-xs font-medium px-3 py-1 rounded-full">
                              Good Match
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={() => handleViewJob(job)}
                              className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition"
                            >
                              View Job
                            </button>
                            <button
                              onClick={() => handleSaveJob(job)}
                              disabled={isJobSaved(job.id)}
                              className="w-full rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isJobSaved(job.id) ? 'Saved' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleTailorCV(job.id)}
                              className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition"
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
              <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)]">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">
                  Start your job search
                </p>
                <p className="text-gray-500 text-sm">
                  Enter your criteria above and click Search to find matching jobs
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Saved Jobs Sidebar */}
          <div className="w-full md:w-80">
            <div className="md:sticky md:top-4">
              <h2 className="text-2xl font-heading font-semibold mb-6">Saved Jobs</h2>
              {savedJobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] p-8 text-center">
                  <p className="text-gray-400">No saved jobs yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-heading font-semibold mb-1 text-white">
                            {job.title}
                          </h3>
                          <p className="text-[#9b5cff] font-medium mb-2">{job.company}</p>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleViewJob(job)}
                            className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2"
                          >
                            View Job
                          </button>
                          <button
                            onClick={() => handleTailorCV(job.id)}
                            className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2"
                          >
                            Tailor CV
                          </button>
                          <button
                            onClick={() => handleRemoveSavedJob(job.id)}
                            className="w-full rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition"
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
    </AppShell>
  )
}
