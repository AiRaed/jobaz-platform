'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, FileText, Mail, Send, GraduationCap, ArrowRight, Briefcase, Lock, Search, Sparkles, Zap, Target, RefreshCw, Star, LogOut, Compass, FileCheck, Wrench } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import { type AppliedJob } from '@/lib/applied-jobs-storage'
import Logo from '@/components/Logo'
import { ConfirmModal } from '@/components/ConfirmModal'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'
import { extractCVKeywords, calculateMatchPercentage, generateSearchQueryFromCV, extractSummaryKeywords, filterJobsByRelevance, isTrainingJob } from '@/lib/job-matching'
import { supabase } from '@/lib/supabase'
import { clearCurrentUserStorage, initUserStorageCache, getCurrentUserIdSync, getUserScopedKeySync } from '@/lib/user-storage'
import { UK_CITIES, getLocationValue } from '@/lib/uk-cities'
import { computeCvScore, type CvScoreResult } from '@/lib/cv-score'
import type { CvData } from '@/app/cv-builder-v2/page'

// CV Score calculation - use shared utility

// Helper to convert dashboard CV format to CvData format
function convertDashboardCvToCvData(cv: any): CvData {
  // Convert experience format: dashboard uses { jobTitle, company, description } 
  // but CvData expects { id, jobTitle, company, bullets: string[] }
  const experience = (cv?.experience || []).map((exp: any) => {
    // If it already has bullets array (V2 format), use it
    if (Array.isArray(exp.bullets)) {
      return exp
    }
    // Otherwise, convert description string to bullets array
    const bullets = exp.description
      ? exp.description.split(/\n/).filter((line: string) => line.trim().length > 0)
      : []
    return {
      id: exp.id || `exp-${Math.random()}`,
      jobTitle: exp.jobTitle || exp.title || '',
      company: exp.company || '',
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isCurrent: exp.isCurrent,
      bullets,
    }
  })

  return {
    personalInfo: {
      fullName: cv?.fullName || '',
      email: cv?.email || '',
      phone: cv?.phone || '',
      location: cv?.city || cv?.location || '',
      linkedin: cv?.linkedin,
      website: cv?.website,
    },
    summary: cv?.summary || '',
    experience,
    education: cv?.education || [],
    skills: cv?.skills || [],
  }
}

// Wrapper function for backward compatibility
function calculateCVScore(cv: any): CvScoreResult {
  const cvData = convertDashboardCvToCvData(cv)
  return computeCvScore(cvData)
}

const JOB_STORAGE_PREFIX = 'jobaz_job_'

interface StoredJobState {
  cvSummary: string
  coverLetterText: string
  statuses: {
    cv: 'not-tailored' | 'ready'
    cover: 'not-created' | 'ready'
    application: 'not-submitted' | 'submitted'
    training: 'not-available' | 'available'
  }
}

interface SavedJob {
  id: string
  cvSummary: string
  coverLetterText: string
  statuses: StoredJobState['statuses']
  title?: string
  company?: string
}

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  type: string
  link?: string
  matchPercentage?: number
  isTraining?: boolean // Classified as training or real job
}

export default function DashboardPage() {
  const router = useRouter()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingCv, setLoadingCv] = useState(true)
  const [baseCv, setBaseCv] = useState<any | null>(null)
  const [cvLastUpdated, setCvLastUpdated] = useState<string | null>(null)
  const [cvId, setCvId] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<{ score: number; level: string; topFixes: string[]; lastUpdated: string } | null>(null)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [baseCover, setBaseCover] = useState<any | null>(null)
  const [coverLastUpdated, setCoverLastUpdated] = useState<string | null>(null)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean
    jobId: string | null
  }>({
    isOpen: false,
    jobId: null,
  })
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [cvError, setCvError] = useState<{ type: '403' | '500' | 'network'; message: string } | null>(null)
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [loadingRecommendedJobs, setLoadingRecommendedJobs] = useState(false)
  const [savedJobsFromJobFinder, setSavedJobsFromJobFinder] = useState<Job[]>([])
  const [isSavedJobsInitialized, setIsSavedJobsInitialized] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{ query: string; keywords: string[]; apiUrl?: string; location?: string } | null>(null)
  const [filterMode, setFilterMode] = useState<'strict' | 'balanced' | 'loose'>('balanced')
  const [resultType, setResultType] = useState<'all' | 'jobs-only' | 'training-only'>('all')
  const [fallbackToAll, setFallbackToAll] = useState(false) // Track if we fell back from Jobs Only
  const [recommendedLocation, setRecommendedLocation] = useState<string>('UK (Anywhere)')

  // User info from Supabase auth
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')

  // Refs for scrolling to sections
  const recommendedJobsRef = useRef<HTMLDivElement>(null)
  const appliedJobsRef = useRef<HTMLDivElement>(null)

  // Fetch CV from API - single source of truth (Supabase only)
  const fetchCvFromApi = useCallback(async () => {
    setLoadingCv(true)
    setCvError(null) // Clear previous errors
    
    try {
      const response = await fetch('/api/cv/get-latest')
      
      // Handle 401 - Not authenticated
      if (response.status === 401) {
        setLoadingCv(false)
        setLoading(false)
        setIsLoading(false)
        router.push('/')
        return
      }
      
      // Handle 403 - RLS permission error
      if (response.status === 403) {
        setCvError({
          type: '403',
          message: 'Permission error. Please sign out and sign in again to refresh your session.'
        })
        setBaseCv(null)
        setCvLastUpdated(null)
        setReadiness(null)
        setLoadingCv(false)
        setLoading(false)
        setIsLoading(false)
        return
      }
      
      // Handle 500 - Server error
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Server error occurred'
        console.error('[Dashboard] Server error:', errorMessage)
        setCvError({
          type: '500',
          message: `Server error: ${errorMessage}`
        })
        setBaseCv(null)
        setCvLastUpdated(null)
        setReadiness(null)
        setLoadingCv(false)
        setLoading(false)
        setIsLoading(false)
        return
      }
      
      // Handle other non-ok responses
      if (!response.ok) {
        throw new Error(`Failed to fetch CV: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle API-level errors (ok: false)
      if (!data.ok) {
        console.error('[Dashboard] API returned error:', data.error)
        setCvError({
          type: '500',
          message: data.error || 'Failed to fetch CV'
        })
        setBaseCv(null)
        setCvLastUpdated(null)
        setReadiness(null)
        setLoadingCv(false)
        setLoading(false)
        setIsLoading(false)
        return
      }
      
      // Success - no error
      setCvError(null)
      
      // Handle hasCv: false (no CV found - this is OK)
      if (!data.hasCv || !data.cv) {
        setBaseCv(null)
        setCvLastUpdated(null)
        setReadiness(null)
        setLoadingCv(false)
        setLoading(false)
        setIsLoading(false)
        return
      }
      
      // Map API CV format to dashboard format
      const mappedExperience = (data.cv.experience || []).map((exp: any) => {
        let period = ''
        if (exp.startDate || exp.endDate) {
          if (exp.isCurrent) {
            period = `${exp.startDate || ''} - Present`
          } else {
            period = `${exp.startDate || ''} - ${exp.endDate || ''}`
          }
        }
        
        const description = exp.bullets && Array.isArray(exp.bullets) 
          ? exp.bullets.join('\n')
          : ''
        
        return {
          jobTitle: exp.jobTitle || '',
          company: exp.company || '',
          period: period,
          description: description,
        }
      })
      
      const dashboardCv = {
        fullName: data.cv.personalInfo?.fullName || '',
        email: data.cv.personalInfo?.email || '',
        phone: data.cv.personalInfo?.phone || '',
        city: data.cv.personalInfo?.location || '',
        summary: data.cv.summary || '',
        skills: data.cv.skills || [],
        experience: mappedExperience,
        education: data.cv.education || [],
      }
      
      setBaseCv(dashboardCv)
      setCvLastUpdated(data.readiness?.lastUpdated || null)
      setReadiness(data.readiness)
    } catch (error: any) {
      // Network or unexpected errors
      console.error('[Dashboard] Error fetching CV from API:', error)
      setCvError({
        type: 'network',
        message: error.message || 'Network error. Please check your connection and try again.'
      })
      setBaseCv(null)
      setCvLastUpdated(null)
      setReadiness(null)
    } finally {
      // ALWAYS end loading states
      setLoadingCv(false)
      setLoading(false)
      setIsLoading(false)
    }
  }, [router])

  // Fetch cover letter from API - single source of truth (Supabase only)
  const fetchCoverFromApi = useCallback(async () => {
    try {
      const response = await fetch('/api/cover/get-latest')
      
      // Handle 401 - Not authenticated (this is OK, user may not be logged in)
      if (response.status === 401) {
        setBaseCover(null)
        setCoverLastUpdated(null)
        return
      }
      
      // Handle other non-ok responses
      if (!response.ok) {
        throw new Error(`Failed to fetch cover letter: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle API-level errors (ok: false)
      if (!data.ok) {
        console.error('[Dashboard] Cover letter API returned error:', data.error)
        setBaseCover(null)
        setCoverLastUpdated(null)
        return
      }
      
      // Handle hasCover: false (no cover letter found - this is OK)
      if (!data.hasCover || !data.cover) {
        setBaseCover(null)
        setCoverLastUpdated(null)
        return
      }
      
      // Map API cover letter format to dashboard format
      const coverData = data.cover || {}
      
      const dashboardCover = {
        applicantName: coverData.applicantName || '',
        recipientName: coverData.recipientName || '',
        company: coverData.company || '',
        cityState: coverData.cityState || '',
        role: coverData.role || '',
        bodyText: coverData.bodyText || '',
        keywords: coverData.keywords || '',
        layout: coverData.layout || 'minimal',
        atsMode: coverData.atsMode || false,
      }
      
      setBaseCover(dashboardCover)
      setCoverLastUpdated(data.meta?.updated_at || null)
    } catch (error: any) {
      // Network or unexpected errors
      console.error('[Dashboard] Error fetching cover letter from API:', error)
      setBaseCover(null)
      setCoverLastUpdated(null)
    }
  }, [])

  // Fetch applied jobs from API - single source of truth (Supabase only)
  const fetchAppliedJobsFromApi = useCallback(async () => {
    console.log('[AppliedJobs] Dashboard: Fetching applied jobs from API')
    
    try {
      const response = await fetch('/api/jobs/applied/list')
      
      // Handle 401 - Not authenticated (this is OK, user may not be logged in)
      if (response.status === 401) {
        console.log('[AppliedJobs] Dashboard: Not authenticated (401)')
        setAppliedJobs([])
        return
      }
      
      // Handle other non-ok responses
      if (!response.ok) {
        throw new Error(`Failed to fetch applied jobs: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle API-level errors (ok: false)
      if (!data.ok) {
        console.error('[AppliedJobs] Dashboard: API returned error:', data.error)
        setAppliedJobs([])
        return
      }
      
      // Map API response to AppliedJob format expected by dashboard
      const mappedJobs: AppliedJob[] = (data.jobs || []).map((job: any) => ({
        id: job.job_key || job.id || '',
        title: job.job_title || job.title || '',
        company: job.company || '',
        location: job.location || undefined,
        sourceSite: job.source || undefined,
        jobUrl: job.url || undefined,
        createdAt: job.applied_at || job.created_at || new Date().toISOString(),
        status: job.data?.status || 'submitted',
        hasCv: job.data?.hasCv || false,
        hasCover: job.data?.hasCover || false,
      }))
      
      console.log('[AppliedJobs] Dashboard: Successfully loaded', mappedJobs.length, 'applied jobs')
      setAppliedJobs(mappedJobs)
    } catch (error: any) {
      // Network or unexpected errors
      console.error('[AppliedJobs] Dashboard: Error fetching applied jobs from API:', error)
      setAppliedJobs([])
    }
  }, [])

  // Fetch user info from Supabase auth
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Get full_name from user_metadata, fallback to email prefix
          const fullName = user.user_metadata?.full_name || ''
          const email = user.email || ''
          
          // If no full_name, use email prefix (part before @)
          const displayName = fullName || (email ? email.split('@')[0] : '')
          
          setUserName(displayName)
          setUserEmail(email)
          
          // Fetch CV, cover letter, and applied jobs from API after user is confirmed
          fetchCvFromApi()
          fetchCoverFromApi()
          fetchAppliedJobsFromApi()
        } else {
          // No user - redirect to login
          setLoadingCv(false)
          setLoading(false)
          setIsLoading(false)
          router.push('/')
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching user:', error)
        setLoadingCv(false)
        setLoading(false)
        setIsLoading(false)
        // Don't redirect on error - let fetchCvFromApi handle auth errors
      }
    }

    fetchUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name || ''
        const email = session.user.email || ''
        const displayName = fullName || (email ? email.split('@')[0] : '')
        setUserName(displayName)
        setUserEmail(email)
      } else {
        setUserName('')
        setUserEmail('')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchCvFromApi, fetchCoverFromApi, fetchAppliedJobsFromApi])

  // Load saved jobs from Job Finder's storage on mount and sync changes
  // NOTE: localStorage persistence has been removed - saved jobs are now in-memory only
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadSavedJobs = () => {
      // No-op: localStorage persistence has been removed
      setSavedJobsFromJobFinder([])
      setIsSavedJobsInitialized(true)
    }

    // Load on mount
    loadSavedJobs()

    // Listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadSavedJobs()
    }

    window.addEventListener('jobaz-saved-jobs-changed', handleCustomStorageChange)

    return () => {
      window.removeEventListener('jobaz-saved-jobs-changed', handleCustomStorageChange)
    }
  }, [])

  // Initial load - ensure loading states always end
  useEffect(() => {
    // If CV loading completes (success or error), ensure all loading states are cleared
    if (!loadingCv) {
      setLoading(false)
      setIsLoading(false)
    }
  }, [loadingCv])

  // Listen for CV and cover letter save events and storage changes to auto-refresh
  useEffect(() => {
    if (typeof window === 'undefined') return

    const userId = getCurrentUserIdSync()
    const getUserKey = (baseKey: string) => {
      if (userId) {
        return getUserScopedKeySync(baseKey, userId)
      }
      return baseKey
    }

    // Handle custom CV save event (fired when CV is saved in builder)
    const handleCvSaved = () => {
      // Reload CV data from API when CV is saved
      fetchCvFromApi()
    }

    // Handle custom cover letter save event (fired when cover letter is saved in builder)
    const handleCoverSaved = () => {
      // Reload cover letter data from API when cover letter is saved
      fetchCoverFromApi()
    }

    // Handle applied jobs changes (fired when user applies for a job)
    const handleAppliedJobsChanged = () => {
      console.log('[AppliedJobs] Dashboard: Event received, refreshing applied jobs')
      // Reload applied jobs from API when applied jobs change
      fetchAppliedJobsFromApi()
    }

    // Handle storage events (for cross-tab updates)
    // NOTE: localStorage persistence has been removed - storage events are no longer used
    const handleStorageChange = (e: StorageEvent) => {
      // No-op: localStorage persistence has been removed
    }

    // Listen for custom CV, cover letter, and applied jobs save events
    window.addEventListener('jobaz-cv-saved', handleCvSaved)
    window.addEventListener('jobaz-cover-saved', handleCoverSaved)
    window.addEventListener('jobaz-applied-jobs-changed', handleAppliedJobsChanged)
    
    // Listen for storage events (cross-tab)
    // NOTE: localStorage persistence has been removed - storage events are no longer used
    // window.addEventListener('storage', handleStorageChange)
    
    // Also check on window focus (in case CV, cover, or applied jobs were updated in another tab)
    const handleFocus = () => {
      fetchCvFromApi()
      fetchCoverFromApi()
      fetchAppliedJobsFromApi()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('jobaz-cv-saved', handleCvSaved)
      window.removeEventListener('jobaz-cover-saved', handleCoverSaved)
      window.removeEventListener('jobaz-applied-jobs-changed', handleAppliedJobsChanged)
      // window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchCvFromApi, fetchCoverFromApi, fetchAppliedJobsFromApi])

  // Load recommendedLocation from localStorage on mount
  // NOTE: localStorage persistence has been removed - recommendedLocation is now in-memory only
  useEffect(() => {
    // No-op: localStorage persistence has been removed
  }, [])

  // Save recommendedLocation to localStorage when it changes
  // NOTE: localStorage persistence has been removed - recommendedLocation is now in-memory only
  useEffect(() => {
    // No-op: localStorage persistence has been removed
  }, [recommendedLocation])

  // Create CV signature to track CV changes for auto-refresh
  const cvSignature = useMemo(() => {
    if (!baseCv) {
      return 'no-cv' // No CV exists
    }
    
    // Create signature from relevant CV fields
    const summary = baseCv.summary || ''
    const skills = Array.isArray(baseCv.skills) ? baseCv.skills.join(',') : ''
    const experience = Array.isArray(baseCv.experience) ? baseCv.experience : []
    
    // Get latest role (most recent experience)
    const latestRole = experience.length > 0 
      ? (experience[0]?.jobTitle || experience[0]?.title || '').toLowerCase()
      : ''
    
    // Create signature: summary length + skills + latest role
    const signature = `${summary.length}_${skills.length}_${latestRole}_${cvLastUpdated || ''}`
    return signature
  }, [baseCv, cvLastUpdated])

  // AbortController ref for canceling previous fetches
  const abortControllerRef = useRef<AbortController | null>(null)

  // Function to fetch recommended jobs - ALWAYS fetches, even with incomplete CV
  const fetchRecommendedJobs = useCallback(async (signal?: AbortSignal) => {
    // Cancel previous fetch if still in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new AbortController for this fetch
    const controller = new AbortController()
    abortControllerRef.current = controller
    const fetchSignal = signal || controller.signal

    setLoadingRecommendedJobs(true)
    try {
      // Use baseCv if available, otherwise use empty object
      const cvData = baseCv || {
        summary: undefined,
        skills: undefined,
        experience: undefined,
        city: undefined,
      }

      // Generate search query from CV (with fallbacks)
      const searchQuery = generateSearchQueryFromCV({
        summary: cvData.summary,
        skills: cvData.skills,
        experience: cvData.experience,
      })

      // Extract CV keywords for matching (will return empty array if no CV)
      const cvKeywords = extractCVKeywords({
        summary: cvData.summary,
        skills: cvData.skills,
        experience: cvData.experience,
      })

      // Extract summary keywords for debug info
      const summaryKeywords = extractSummaryKeywords({
        summary: cvData.summary,
      })

      // Use selected location from dropdown
      const location = getLocationValue(recommendedLocation)

      // Fetch jobs from API
      const params = new URLSearchParams()
      params.set('keyword', searchQuery.trim())
      params.set('location', location)

      const apiUrl = `/api/jobs/search?${params.toString()}`
      
      // Log API request (DEV only)
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] API Request:', {
          url: apiUrl,
          keyword: searchQuery.trim(),
          location: location,
          queryUsed: searchQuery,
        })
        setDebugInfo({
          query: searchQuery,
          keywords: summaryKeywords.length > 0 ? summaryKeywords : cvKeywords.slice(0, 6),
          apiUrl: apiUrl,
          location: location,
        })
      } else {
        setDebugInfo(null)
      }

      const response = await fetch(apiUrl, { signal: fetchSignal })

      // Check if request was aborted
      if (fetchSignal.aborted) {
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch recommended jobs')
      }

      const data = await response.json()
      let results: Job[] = (data.results || []).slice(0, 20) // Get up to 20 jobs for filtering

      // Check again if aborted after fetch
      if (fetchSignal.aborted) {
        return
      }

      // Apply relevance filtering
      if (results.length > 0 && cvKeywords.length > 0) {
        // Try filtering with current mode
        let filtered = filterJobsByRelevance(results, cvKeywords, searchQuery, filterMode) as Job[]
        
        // If filtering removes too many, fall back gradually
        if (filtered.length === 0 && filterMode === 'strict') {
          filtered = filterJobsByRelevance(results, cvKeywords, searchQuery, 'balanced') as Job[]
        }
        if (filtered.length === 0 && filterMode === 'balanced') {
          filtered = filterJobsByRelevance(results, cvKeywords, searchQuery, 'loose') as Job[]
        }
        
        results = filtered.slice(0, 12) // Take top 12 after filtering
      } else {
        results = results.slice(0, 12) // Take top 12 if no filtering
      }

      // Check again if aborted before processing
      if (fetchSignal.aborted) {
        return
      }

      // Classify and calculate match percentage for each job
      const jobsWithClassification = results.map(job => {
        const isTraining = isTrainingJob(job)
        const matchPercentage = calculateMatchPercentage(
          cvKeywords,
          job.title,
          job.description,
          searchQuery // Pass queryUsed for better matching
        )
        return {
          ...job,
          matchPercentage,
          isTraining,
        }
      })

      // Separate jobs and training
      const realJobs = jobsWithClassification.filter(job => !job.isTraining)
      const trainingJobs = jobsWithClassification.filter(job => job.isTraining)

      // Sort each category by match percentage (highest first)
      realJobs.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
      trainingJobs.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))

      // Apply result type filter
      let filteredJobs: typeof jobsWithClassification = []

      if (resultType === 'jobs-only') {
        filteredJobs = realJobs
        // If empty, fall back to showing all with a message
        if (filteredJobs.length === 0 && jobsWithClassification.length > 0) {
          setFallbackToAll(true)
          filteredJobs = jobsWithClassification // Show all instead
          // Automatically switch filter back to 'all' for better UX
          // Use setTimeout to avoid triggering useEffect during render
          setTimeout(() => setResultType('all'), 0)
        } else {
          setFallbackToAll(false)
        }
      } else if (resultType === 'training-only') {
        filteredJobs = trainingJobs
        setFallbackToAll(false)
      } else {
        // 'all' mode: real jobs first, then training
        filteredJobs = [...realJobs, ...trainingJobs]
        setFallbackToAll(false)
      }

      // Final check before setting state
      if (!fetchSignal.aborted) {
        setRecommendedJobs(filteredJobs)

        // Cache Adzuna jobs to sessionStorage when loaded
        if (typeof window !== 'undefined') {
          filteredJobs.forEach((job: Job) => {
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
                
                // NOTE: sessionStorage persistence has been removed
                // sessionStorage.setItem(cacheKey, JSON.stringify(cachedJob))
              } catch (error) {
                console.error('Error caching Adzuna job:', error)
              }
            }
          })
        }
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError' || fetchSignal.aborted) {
        return
      }
      console.error('Error fetching recommended jobs:', error)
      if (!fetchSignal.aborted) {
        setRecommendedJobs([])
      }
    } finally {
      if (!fetchSignal.aborted) {
        setLoadingRecommendedJobs(false)
      }
    }
  }, [baseCv, filterMode, resultType, fallbackToAll, recommendedLocation])

  // Auto-refresh recommended jobs when CV signature changes
  useEffect(() => {
    // Debounce for rapid changes (like typing), but immediate for saves
    // If cvSignature changed from 'no-cv' to something, it's a save - update immediately
    // Otherwise, debounce by 400ms
    const timeoutId = setTimeout(() => {
      fetchRecommendedJobs()
    }, 400)

    return () => {
      clearTimeout(timeoutId)
      // Cancel fetch on cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [cvSignature, fetchRecommendedJobs])

  // Handler for saving a job to Job Finder
  // NOTE: localStorage persistence has been removed - saved jobs are now in-memory only
  const handleSaveRecommendedJob = (job: Job) => {
    if (typeof window === 'undefined') return

    // No-op: localStorage persistence has been removed - use in-memory state only
    // Jobs can still be saved to in-memory state via setSavedJobsFromJobFinder
    setSavedJobsFromJobFinder(prev => {
      // Check if job is already saved
      if (prev.some((j) => j.id === job.id)) {
        return prev // Already saved
      }
      // Add job to saved jobs (in-memory only)
      return [...prev, job]
    })
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('jobaz-saved-jobs-changed'))
  }

  // Cache Adzuna job to sessionStorage before navigation
  const cacheAdzunaJob = (job: Job) => {
    if (typeof window === 'undefined' || !job.id?.startsWith('adzuna_')) return
    
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

  // Handler for viewing job
  const handleViewRecommendedJob = (job: Job) => {
    // Cache Adzuna job before navigation
    cacheAdzunaJob(job)
    
    if (job.link) {
      window.open(job.link, '_blank')
    } else {
      router.push(`/job-details/${job.id}`)
    }
  }

  // Handler for tailoring CV
  const handleTailorCVFromRecommended = (jobId: string) => {
    // Find the job in recommendedJobs to cache it
    const job = recommendedJobs.find(j => j.id === jobId)
    if (job) {
      cacheAdzunaJob(job)
    }
    
    router.push(`/job-details/${jobId}?mode=tailorCV`)
  }

  // Handler for train interview
  const handleTrainInterviewFromRecommended = (job: Job) => {
    const query = new URLSearchParams({
      jobId: job.id,
      title: job.title,
      company: job.company,
    }).toString()
    router.push(`/interview-coach?${query}`)
  }

  // Check if job is saved in Job Finder
  const isRecommendedJobSaved = (jobId: string) => {
    return savedJobsFromJobFinder.some((j) => j.id === jobId)
  }

  const handleViewJobDetails = (jobId: string) => {
    router.push(`/job-details/${jobId}`)
  }

  const handleGoToInterviewTraining = (appliedJob: AppliedJob) => {
    // Use job data from appliedJob object (already stored when user applied)
    const jobIdValue = appliedJob.id?.toString() ?? ''
    const jobTitle = appliedJob.title || ''
    const company = appliedJob.company || ''
    
    // Prefer incomplete job-specific mode over general mode
    // Only navigate to generic coach if we have absolutely no job data
    if (!jobIdValue && !jobTitle && !company) {
      router.push('/interview-coach')
      return
    }
    
    // Build query params matching Job Details page format
    const query = new URLSearchParams({
      jobId: jobIdValue,
      title: jobTitle,
      company: company,
    }).toString()
    
    router.push(`/interview-coach?${query}`)
  }

  const handleRemoveJob = (jobId: string) => {
    // Open the confirmation modal
    setConfirmModalState({
      isOpen: true,
      jobId,
    })
  }

  const handleConfirmRemove = () => {
    if (confirmModalState.jobId) {
      // Remove from UI state immediately (optimistic update)
      // NOTE: Deletion from Supabase would require a DELETE API endpoint
      // For now, we just remove from UI state
      console.log('[AppliedJobs] Dashboard: Removing job from UI:', confirmModalState.jobId)
      setAppliedJobs(prevJobs => prevJobs.filter(job => job.id !== confirmModalState.jobId))
    }
    
    // Close the modal
    setConfirmModalState({
      isOpen: false,
      jobId: null,
    })
  }

  const handleCancelRemove = () => {
    // Close the modal without removing
    setConfirmModalState({
      isOpen: false,
      jobId: null,
    })
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    
    try {
      // Call the delete account API
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        const errorMessage = data.error || 'Failed to delete account'
        console.error('[Delete Account] Error:', errorMessage)
        setToast({ type: 'error', message: errorMessage })
        setIsDeletingAccount(false)
        return
      }

      // Success - sign out and redirect
      await supabase.auth.signOut()
      
      // Clear user storage
      await clearCurrentUserStorage()
      
      // Show success message briefly before redirect
      setToast({ type: 'success', message: 'Account deleted' })
      
      // Redirect to landing page after a short delay
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error: any) {
      console.error('[Delete Account] Unexpected error:', error)
      setToast({ type: 'error', message: error.message || 'Failed to delete account' })
      setIsDeletingAccount(false)
    }
  }

  const formatDaysAgo = (isoDateString: string | null): string | null => {
    if (!isoDateString) return null
    
    try {
      const date = new Date(isoDateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      return `${diffDays} days ago`
    } catch (error) {
      return null
    }
  }

  const hasCvSummary = savedJobs.some(job => job.cvSummary.trim() !== '')
  const hasCoverLetters = savedJobs.some(job => job.coverLetterText.trim() !== '')

  // Display name and email: prefer Supabase auth user info, fallback to CV data
  const displayName = userName || baseCv?.fullName || ''
  const displayEmail = userEmail || baseCv?.email || ''

  // Helper function to check if a job is meaningful
  const isMeaningfulJob = (job: SavedJob): boolean => {
    // Job is meaningful if it has a title
    if (job.title && job.title.trim()) {
      return true
    }
    // Or if at least one status is positive
    return (
      job.statuses.cv === 'ready' ||
      job.statuses.cover === 'ready' ||
      job.statuses.application === 'submitted' ||
      job.statuses.training === 'available'
    )
  }

  // Filter jobs to show only meaningful ones
  const meaningfulJobs = savedJobs.filter(isMeaningfulJob)

  // Journey flow logic
  const getNextJourneyStep = () => {
    // Check journey state
    const hasBaseCV = !!baseCv
    const hasSelectedJob = meaningfulJobs.length > 0
    const hasTailoredCV = savedJobs.some(job => job.statuses.cv === 'ready')
    const hasCoverLetter = savedJobs.some(job => job.statuses.cover === 'ready')
    const hasInterviewTraining = savedJobs.some(job => job.statuses.training === 'available') || appliedJobs.length > 0

    // Check if user has started interview training (to avoid suggesting "Find Jobs" during training)
    // NOTE: localStorage persistence has been removed - interview training flags are now in-memory only
    const hasStartedInterviewTraining = false // localStorage persistence removed

    // Determine next step based on priority
    // Critical UX Rule: Never suggest "Find Jobs" during Interview Coach
    // If user has started interview training, prioritize completing it
    if (!hasBaseCV) {
      return {
        step: 'create-cv',
        title: 'Create your CV',
        description: 'Start by creating your professional CV',
        action: () => router.push('/cv-builder-v2'),
        actionText: 'Create your CV',
      }
    } else if (!hasSelectedJob && !hasStartedInterviewTraining) {
      // Only suggest "Find Jobs" if user hasn't started interview training
      return {
        step: 'find-jobs',
        title: 'Find Jobs',
        description: 'Search for jobs that match your skills',
        action: () => {
          const params = new URLSearchParams()
          if (baseCv) {
            const searchQuery = generateSearchQueryFromCV({
              summary: baseCv.summary,
              skills: baseCv.skills,
              experience: baseCv.experience,
            })
            if (searchQuery) {
              params.set('jobTitle', searchQuery)
            }
            if (baseCv.city) {
              params.set('location', baseCv.city)
            }
          }
          router.push(`/job-finder?${params.toString()}`)
        },
        actionText: 'Find Jobs',
      }
    } else if (!hasTailoredCV) {
      // Find the first job that needs CV tailoring
      const jobNeedingTailoring = meaningfulJobs.find(job => job.statuses.cv !== 'ready')
      return {
        step: 'tailor-cv',
        title: 'Tailor CV',
        description: 'Customize your CV for the job you selected',
        action: () => {
          if (jobNeedingTailoring) {
            router.push(`/job-details/${jobNeedingTailoring.id}?mode=tailorCV`)
          } else {
            router.push('/job-finder')
          }
        },
        actionText: 'Tailor CV',
      }
    } else if (!hasCoverLetter) {
      // Find the first job that needs a cover letter
      const jobNeedingCover = meaningfulJobs.find(job => job.statuses.cover !== 'ready')
      return {
        step: 'generate-cover',
        title: 'Generate Cover Letter',
        description: 'Create a tailored cover letter for your application',
        action: () => {
          if (jobNeedingCover) {
            router.push(`/job-details/${jobNeedingCover.id}`)
          } else {
            router.push('/cover')
          }
        },
        actionText: 'Generate Cover Letter',
      }
    } else if (!hasInterviewTraining) {
      // Find the first job that needs interview training
      const jobNeedingTraining = meaningfulJobs.find(job => job.statuses.training !== 'available')
      return {
        step: 'interview-training',
        title: 'Start Interview Training',
        description: 'Prepare for your interview with AI-powered coaching',
        action: () => {
          if (jobNeedingTraining) {
            const query = new URLSearchParams({
              jobId: jobNeedingTraining.id,
              title: jobNeedingTraining.title || '',
              company: jobNeedingTraining.company || '',
            }).toString()
            router.push(`/interview-coach?${query}`)
          } else if (appliedJobs.length > 0) {
            handleGoToInterviewTraining(appliedJobs[0])
          } else {
            router.push('/interview-coach')
          }
        },
        actionText: 'Start Interview Training',
      }
    } else {
      return {
        step: 'ready',
        title: "You're ready to apply 🎉",
        description: 'You have everything you need to apply for jobs',
        action: () => router.push('/job-finder'),
        actionText: 'Find More Jobs',
      }
    }
  }

  const nextStep = getNextJourneyStep()

  // Helper for truncated summary
  const shortSummary = baseCv?.summary ? (baseCv.summary.length > 160 ? baseCv.summary.slice(0, 160) + "…" : baseCv.summary) : ""

  // Loading state - show dark skeleton instead of blank screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

        {/* Main container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* Skeleton Header */}
          <div className="mb-8">
            <div className="h-10 w-64 bg-slate-800/50 rounded-lg mb-3 animate-pulse" />
            <div className="h-5 w-96 bg-slate-800/30 rounded-lg animate-pulse" />
          </div>

          {/* Skeleton Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-6"
              >
                <div className="h-5 w-24 bg-slate-800/50 rounded-lg mb-3 animate-pulse" />
                <div className="h-8 w-16 bg-slate-800/40 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Skeleton Content Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-6"
              >
                <div className="h-6 w-40 bg-slate-800/50 rounded-lg mb-4 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-20 bg-slate-800/40 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
  <AppShell>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="flex-1">
            <div className="flex items-end gap-3 -ml-4">
              <Logo />
              <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
            </div>
            {(displayName || displayEmail) && (
              <div className="text-sm md:text-base text-slate-300/90 mt-1">
                {displayName && <span>{displayName}</span>}
                {displayName && displayEmail && <span className="mx-2">·</span>}
                {displayEmail && <span>{displayEmail}</span>}
              </div>
            )}
            <p className="text-slate-300/90 text-sm md:text-base mt-1">
              Everything you've prepared in one place.
            </p>
          </div>
          {/* Logout Button and Support Button */}
          <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
            {/* Right Actions Container - Both buttons on one row */}
            <div className="flex items-center gap-3 flex-nowrap">
              {/* Support Button and Text Container */}
              <div className="flex flex-col items-start">
                <a
                  href="https://buymeacoffee.com/jobaz.support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-violet-500/40 hover:bg-violet-500/10 text-slate-300 hover:text-violet-300 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                >
                  <span>☕</span>
                  <span>Support JobAZ — Keep it free</span>
                </a>
                {/* Support message text below button */}
                <p className="text-xs text-slate-400/70 text-left mt-1 max-w-[300px]">
                  If JobAZ helped you, your support helps keep it free — especially for people who can't afford paid tools.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    // Get user ID before signing out (needed to clear user-scoped storage)
                    const { data: { user } } = await supabase.auth.getUser()
                    const userId = user?.id || null
                    
                    // Sign out from Supabase
                    await supabase.auth.signOut()
                    
                    // Clear all user-scoped localStorage data
                    if (typeof window !== 'undefined' && userId) {
                      await clearCurrentUserStorage()
                    }
                    
                    router.push('/')
                    router.refresh()
                  } catch (error) {
                    console.error('Error signing out:', error)
                    router.push('/')
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-red-500/50 hover:bg-red-500/10 text-slate-200 hover:text-red-400 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      </div>

      {/* Main Dashboard Content */}
      <>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300/80 uppercase mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Link
              href="/cv-builder-v2"
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-950/50",
                "px-4 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(88,28,135,0.35)]/20",
                "hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold text-slate-50">CV Builder</div>
                <div className="text-xs text-slate-400 leading-snug">Create or edit your CV</div>
              </div>
            </Link>
            
            <Link
              href="/cover"
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-950/50",
                "px-4 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(88,28,135,0.35)]/20",
                "hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold text-slate-50">Cover Letter</div>
                <div className="text-xs text-slate-400 leading-snug">Write a tailored cover letter</div>
              </div>
            </Link>
            
            <Link
              href="/job-finder"
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-950/50",
                "px-4 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(88,28,135,0.35)]/20",
                "hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <Search className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold text-slate-50">Job Finder</div>
                <div className="text-xs text-slate-400 leading-snug">Search for jobs with this CV</div>
              </div>
            </Link>
            
            <Link
              href="/interview-coach"
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-950/50",
                "px-4 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(88,28,135,0.35)]/20",
                "hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <GraduationCap className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold text-slate-50">Interview Coach</div>
                <div className="text-xs text-slate-400 leading-snug">Practice your interview answers</div>
              </div>
            </Link>

            <Link
              href="/build-your-path"
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-950/50",
                "px-4 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(88,28,135,0.35)]/20",
                "hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <Compass className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-semibold text-slate-50">Build Your Path</div>
                <div className="text-xs text-slate-400 leading-snug">Explore career paths and build skills</div>
              </div>
            </Link>

            <Link
              href="/proofreading"
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-950/50",
                "px-4 py-3 flex items-center gap-3 shadow-[0_0_40px_rgba(88,28,135,0.35)]/20",
                "hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] transition-all duration-300 cursor-pointer"
              )}
            >
              {/* Bold diagonal maintenance stripe - corner to corner */}
              <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl z-0">
                <div 
                  className="absolute top-0 right-0 w-[200%] h-6 bg-gradient-to-br from-red-600/30 via-orange-600/35 to-red-500/30 origin-top-right"
                  style={{
                    transform: 'rotate(-38deg)',
                    transformOrigin: 'top right',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)',
                  }}
                />
              </div>
              
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <FileCheck className="w-4 h-4 text-violet-400 flex-shrink-0 relative z-10" />
              <div className="flex flex-col min-w-0 flex-1 relative z-10">
                <div className="text-sm font-semibold text-slate-50">Writing Review</div>
                <div className="text-xs text-slate-400 leading-snug">Review and improve any text</div>
                <div className="flex flex-col items-start gap-0.5 mt-1">
                  <Wrench className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[11px] text-red-400 font-semibold leading-tight">Under development</span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* My CV & My Cover Letters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* My CV Section */}
          <div>
            {baseCv ? (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition max-h-[160px] flex flex-col">
                <h3 className="text-base font-semibold text-slate-50 mb-2">My CV</h3>
                {formatDaysAgo(cvLastUpdated) && (
                  <p className="text-xs text-slate-400 mb-3">
                    Last updated: {formatDaysAgo(cvLastUpdated)}
                  </p>
                )}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setIsCvModalOpen(true)}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      const url = cvId 
                        ? `/cv-builder-v2?cvId=${cvId}`
                        : '/cv-builder-v2'
                      router.push(url)
                    }}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition max-h-[160px] flex flex-col">
                <h3 className="text-base font-semibold text-slate-50 mb-2">My CV</h3>
                <p className="text-sm text-slate-400 mb-3">
                  You don't have a base CV saved yet.
                </p>
                <div className="mt-auto">
                  <button
                    onClick={() => router.push("/cv-builder-v2")}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    Create your CV
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* My Cover Letters Section */}
          <div>
            {baseCover ? (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition max-h-[160px] flex flex-col">
                <h3 className="text-base font-semibold text-slate-50 mb-2">My Cover Letters</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Base cover letter saved.
                </p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => setIsCoverModalOpen(true)}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push("/cover")}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition max-h-[160px] flex flex-col">
                <h3 className="text-base font-semibold text-slate-50 mb-2">My Cover Letters</h3>
                <p className="text-sm text-slate-400 mb-3">
                  No base cover letter saved yet.
                </p>
                <div className="mt-auto">
                  <button
                    onClick={() => router.push("/cover")}
                    className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    Create a cover letter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Section: CV Readiness + How to use JobAZ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
          {/* Left Column: CV Readiness - Always shown */}
          <section className="flex flex-col h-full">
            <h2 className="text-xl font-semibold text-slate-50 tracking-tight mb-4 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
              Your CV Readiness
            </h2>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition flex-1 flex flex-col">
              {loadingCv ? (
                // Loading skeleton
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-16 bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-12 bg-slate-800 rounded mt-1 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden animate-pulse mb-2" />
                      <div className="h-3 w-3/4 bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="h-3 w-20 bg-slate-800 rounded mb-2 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-5/6 bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-4/6 bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                </>
              ) : cvError ? (
                // Error state
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-red-400 mb-1">
                        {cvError.type === '403' ? 'Permission Error' : cvError.type === '500' ? 'Server Error' : 'Network Error'}
                      </div>
                      <div className="text-xs text-slate-400 mb-3">
                        {cvError.message}
                      </div>
                      {cvError.type === '403' && (
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/')
                          }}
                          className="text-xs text-violet-400 hover:text-violet-300 underline"
                        >
                          Sign out and sign in again
                        </button>
                      )}
                      {(cvError.type === '500' || cvError.type === 'network') && (
                        <button
                          onClick={fetchCvFromApi}
                          disabled={loadingCv}
                          className="text-xs text-violet-400 hover:text-violet-300 underline disabled:opacity-50"
                        >
                          Try again
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : baseCv ? (() => {
                // Use readiness from API if available, otherwise calculate
                const scoreResult = readiness 
                  ? { score: readiness.score, level: readiness.level, fixes: readiness.topFixes }
                  : calculateCVScore(baseCv)
                const searchQuery = generateSearchQueryFromCV({
                  summary: baseCv.summary,
                  skills: baseCv.skills,
                  experience: baseCv.experience,
                })
                
                return (
                  <>
                    {/* Header with Refresh button */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        {/* Score Display */}
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "text-4xl font-bold",
                              scoreResult.score >= 70 ? "text-emerald-400" : scoreResult.score >= 50 ? "text-amber-400" : "text-red-400"
                            )}>
                              {scoreResult.score}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">out of 100</div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="flex-1">
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full transition-all duration-500 rounded-full",
                                  scoreResult.score >= 70 
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                    : scoreResult.score >= 50
                                    ? "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                                    : "bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                                )}
                                style={{ width: `${scoreResult.score}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-400 mt-1.5">
                              {scoreResult.score >= 80 
                                ? "Your CV is ready for job applications."
                                : scoreResult.score >= 60
                                ? "Your CV is solid. A few improvements can boost results."
                                : "Your CV needs improvement before applying."}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Refresh Readiness button */}
                      <button
                        onClick={fetchCvFromApi}
                        disabled={loadingCv}
                        className="ml-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh Readiness"
                      >
                        <RefreshCw className={cn("w-4 h-4", loadingCv && "animate-spin")} />
                      </button>
                    </div>

                    {/* Top Fixes */}
                    {scoreResult.fixes.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Top Fixes</div>
                        <ul className="space-y-1.5">
                          {scoreResult.fixes.map((fix, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="text-violet-400 mt-0.5">•</span>
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Last Updated */}
                    {readiness?.lastUpdated && (
                      <div className="text-xs text-slate-500 mb-2">
                        Last updated: {new Date(readiness.lastUpdated).toLocaleDateString()}
                      </div>
                    )}

                    {/* Counters */}
                    <div className="space-y-3 mb-4">
                      {/* Recommended Jobs Counter */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
                            <Star className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-50">Recommended Jobs</div>
                            <div className="text-xs text-slate-400">{recommendedJobs.length} available</div>
                          </div>
                        </div>
                        <button
                          onClick={() => recommendedJobsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                        >
                          View
                        </button>
                      </div>

                      {/* Jobs Applied Counter */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-50">Jobs You Applied For</div>
                            <div className="text-xs text-slate-400">{appliedJobs.length} {appliedJobs.length === 1 ? 'job' : 'jobs'}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => appliedJobsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                        >
                          View
                        </button>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        if (scoreResult.score < 70) {
                          const url = cvId 
                            ? `/cv-builder-v2?cvId=${cvId}`
                            : '/cv-builder-v2'
                          router.push(url)
                        } else {
                          // Navigate to job-finder with query auto-filled
                          const params = new URLSearchParams()
                          if (searchQuery) {
                            params.set('jobTitle', searchQuery)
                          }
                          router.push(`/job-finder?${params.toString()}`)
                        }
                      }}
                      className={cn(
                        "w-full rounded-full px-4 py-2.5 text-sm font-medium text-white transition",
                        scoreResult.score < 70
                          ? "bg-violet-600 hover:bg-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                          : "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.8)]"
                      )}
                    >
                      {scoreResult.score < 70 ? 'Improve my CV' : 'Find Jobs for this CV'}
                    </button>
                  </>
                )
              })() : (
                <>
                  {/* Empty State - No CV */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="text-4xl font-bold text-slate-500">
                        0
                      </div>
                      <div className="text-xs text-slate-400 mt-1">out of 100</div>
                    </div>
                    
                    {/* Progress Bar - Neutral */}
                    <div className="flex-1">
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full bg-slate-600"
                          style={{ width: '0%' }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5">
                        No CV saved yet. Create your CV to get a readiness score and recommendations.
                      </div>
                    </div>
                  </div>

                  {/* Top Fixes - Placeholders */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Top Fixes</div>
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-violet-400 mt-0.5">•</span>
                        <span>Add a summary</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-violet-400 mt-0.5">•</span>
                        <span>Add experience</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-violet-400 mt-0.5">•</span>
                        <span>Add skills</span>
                      </li>
                    </ul>
                  </div>

                  {/* CTA Button - Create CV */}
                  <button
                    onClick={() => router.push('/cv-builder-v2')}
                    className="w-full rounded-full px-4 py-2.5 text-sm font-medium text-white transition bg-violet-600 hover:bg-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    Create your CV
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Right Column: How to use JobAZ */}
          <section className="flex flex-col h-full">
            <h2 className="text-xl font-semibold text-slate-50 tracking-tight mb-4 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
              How to use JobAZ
            </h2>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-base text-slate-300 mb-3">
                    JobAZ can be used step by step or as individual tools. Choose what works best for you!
                  </p>
                  <p className="text-base text-slate-300 mb-3">
                    Not sure where to start? Use Build Your Path to explore career options, understand required skills, and get job-ready before applying.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-200 mb-2">Use tools individually:</h3>
                  <ul className="space-y-2 text-base text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">•</span>
                      <span><strong>CV Builder:</strong> Create or update your CV anytime.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">•</span>
                      <span><strong>Cover Letter:</strong> Write a tailored cover letter for any job.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">•</span>
                      <span><strong>Job Finder:</strong> Search for jobs that match your CV.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-violet-400 mt-0.5">•</span>
                      <span><strong>Interview Coach:</strong> Practice interviews to build confidence.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-200 mb-2">Or follow the full journey:</h3>
                  <p className="text-base text-slate-300">
                    <strong>Build your CV</strong> → Tailor CV & cover letter → Apply for jobs → Track applications → Prepare for interviews.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Recommended Jobs for You (AI Match) */}
        <section ref={recommendedJobsRef} className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-50 tracking-tight flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
                  Recommended Jobs for You
                </h2>
                <span className="text-xs text-slate-400 font-normal">
                  AI-powered recommendations
                </span>
              </div>
              <p className="text-sm text-slate-400">Personalized recommendations based on your CV and career goals</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/job-finder')}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)] hover:shadow-[0_0_25px_rgba(139,92,246,1)]"
              >
                <Search className="w-4 h-4" />
                Find More Jobs
                <ArrowRight className="w-4 h-4" />
              </button>
              {/* Result Type Filter */}
              <select
                value={resultType}
                onChange={(e) => {
                  const newType = e.target.value as 'all' | 'jobs-only' | 'training-only'
                  setResultType(newType)
                  setFallbackToAll(false) // Reset fallback when changing filter
                }}
                className="rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:border-violet-400/60 transition"
              >
                <option value="all">All</option>
                <option value="jobs-only">Jobs Only</option>
                <option value="training-only">Training Only</option>
              </select>
              
              {/* Location Filter */}
              <select
                value={recommendedLocation}
                onChange={(e) => {
                  setRecommendedLocation(e.target.value)
                  // Refetch with new location
                  fetchRecommendedJobs()
                }}
                className="rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:border-violet-400/60 transition"
              >
                {UK_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              
              {/* Refine Results Dropdown (DEV only) */}
              {process.env.NODE_ENV === 'development' && (
                <select
                  value={filterMode}
                  onChange={(e) => {
                    const newMode = e.target.value as 'strict' | 'balanced' | 'loose'
                    setFilterMode(newMode)
                    // Refetch with new filter mode
                    fetchRecommendedJobs()
                  }}
                  className="rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:border-violet-400/60 transition"
                >
                  <option value="strict">Strict (2 keywords)</option>
                  <option value="balanced">Balanced (1 keyword)</option>
                  <option value="loose">Loose (no filter)</option>
                </select>
              )}
              <button
                onClick={() => fetchRecommendedJobs()}
                disabled={loadingRecommendedJobs}
                className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-3 h-3", loadingRecommendedJobs && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>

          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-xs text-slate-400">
              <div className="font-semibold text-slate-300 mb-1">Debug Info:</div>
              <div>Query used: <span className="text-violet-300">{debugInfo.query || 'N/A'}</span></div>
              <div>Keywords extracted: <span className="text-violet-300">{debugInfo.keywords.length > 0 ? debugInfo.keywords.join(', ') : 'N/A'}</span></div>
              {debugInfo.location && (
                <div className="mt-1">
                  Location: <span className="text-violet-300">{debugInfo.location}</span>
                </div>
              )}
              {debugInfo.apiUrl && (
                <div className="mt-1">
                  API URL: <span className="text-violet-300 break-all">{debugInfo.apiUrl}</span>
                </div>
              )}
              <div className="mt-1">
                Filter mode: <span className="text-violet-300">{filterMode}</span>
              </div>
            </div>
          )}

          {loadingRecommendedJobs ? (
            <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/50">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mb-4"></div>
              <p className="text-slate-400">Finding jobs that match your CV...</p>
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/50">
              <Star className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              {!baseCv ? (
                <>
                  <p className="text-slate-300 text-lg mb-2">Create your CV to get personalized job recommendations</p>
                  <p className="text-slate-400 text-sm mb-4">
                    We'll analyze your skills and experience to find the best matches for you.
                  </p>
                  <button
                    onClick={() => router.push('/cv-builder-v2')}
                    className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                  >
                    Create your CV
                  </button>
                </>
              ) : (
                <>
                  <p className="text-slate-300 text-lg mb-2">We're still learning about your experience. Update your CV to get more accurate matches.</p>
                  <p className="text-slate-400 text-sm mb-4">
                    Try Refresh or broaden your CV keywords.
                  </p>
                  {debugInfo && debugInfo.query && (
                    <button
                      onClick={() => {
                        const params = new URLSearchParams()
                        params.set('jobTitle', debugInfo.query)
                        if (baseCv?.city) {
                          params.set('location', baseCv.city)
                        }
                        router.push(`/job-finder?${params.toString()}`)
                      }}
                      className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                    >
                      Open Job Finder with &quot;{debugInfo.query}&quot;
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Show hint if CV exists but is light */}
              {baseCv && (!baseCv.summary?.trim() || (baseCv.skills?.length || 0) < 5 || (baseCv.experience?.length || 0) < 1) && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  💡 Add more skills/experience to improve matching.
                </div>
              )}

              {/* Fallback message when Jobs Only filter returned empty */}
              {fallbackToAll && recommendedJobs.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  ⚠️ No direct job openings found. Showing training options instead.
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition"
                  >
                    {/* Match Badge */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                          (job.matchPercentage || 0) >= 70
                            ? "bg-emerald-500/20 text-emerald-300"
                            : (job.matchPercentage || 0) >= 50
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-700/50 text-slate-400"
                        )}>
                          <Target className="w-3 h-3" />
                          {job.matchPercentage || 0}% Match
                        </span>
                        {(job.matchPercentage || 0) < 40 && (
                          <span className="text-xs text-slate-400">Entry-level friendly</span>
                        )}
                      </div>
                    </div>

                    {/* Job Header */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-slate-50 mb-1 line-clamp-2">
                        {job.title}
                      </h3>
                      {/* Job Type Badge */}
                      <div className="mb-2">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          job.isTraining
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        )}>
                          {job.isTraining ? 'Training' : 'Job'}
                        </span>
                      </div>
                      <p className="text-sm text-violet-300 font-medium mb-1">
                        {job.company}
                      </p>
                      <p className="text-xs text-slate-400">
                        {job.location}
                      </p>
                    </div>

                    {/* Description Preview */}
                    {job.description && (
                      <p className="text-xs text-slate-300 leading-snug mb-4 line-clamp-2">
                        {job.description}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewRecommendedJob(job)}
                        className="w-full rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                      >
                        View Job
                      </button>
                      <button
                        onClick={() => handleSaveRecommendedJob(job)}
                        disabled={isRecommendedJobSaved(job.id)}
                        className="w-full rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRecommendedJobSaved(job.id) ? 'Saved ✓' : 'Save to Job Finder'}
                      </button>
                      <button
                        onClick={() => handleTailorCVFromRecommended(job.id)}
                        className="w-full rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition"
                      >
                        Tailor CV
                      </button>
                      <button
                        onClick={() => handleTrainInterviewFromRecommended(job)}
                        className="w-full rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition"
                      >
                        Train Interview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Jobs you applied for */}
        <section ref={appliedJobsRef} className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-50 tracking-tight flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  Jobs You Applied For
                </h2>
                {appliedJobs.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300">
                    {appliedJobs.length} {appliedJobs.length === 1 ? 'Job' : 'Jobs'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">Track your application progress and manage your job applications</p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/50">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mb-4"></div>
              <p className="text-slate-400">Loading your jobs...</p>
            </div>
          ) : appliedJobs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-700/60 bg-gradient-to-br from-slate-950/50 to-slate-900/30">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                <Briefcase className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-300 text-lg font-semibold mb-2">You haven't applied for any jobs yet</p>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                Start your job search journey by finding and applying for jobs that match your skills
              </p>
              <button
                onClick={() => router.push('/job-finder')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-medium text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)] hover:shadow-[0_0_25px_rgba(139,92,246,1)]"
              >
                <Search className="w-4 h-4" />
                Find Jobs Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {appliedJobs.map((appliedJob) => {
                // Try to find matching saved job to get status information
                const savedJob = savedJobs.find(j => j.id === appliedJob.id)
                const isComplete = (appliedJob.hasCv || savedJob?.statuses?.cv === 'ready') && 
                                  (appliedJob.hasCover || savedJob?.statuses?.cover === 'ready') && 
                                  (appliedJob.status === 'submitted' || savedJob?.statuses?.application === 'submitted')
                
                return (
                  <div
                    key={appliedJob.id}
                    className="group rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-950/50 to-slate-900/30 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Status Badge */}
                    {isComplete && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </span>
                      </div>
                    )}
                    
                    {/* Job Header */}
                    <div className="mb-4 pr-16">
                      <h3 className="text-lg font-bold text-slate-50 mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                        {appliedJob.title || 'Untitled Job'}
                      </h3>
                      {appliedJob.company && (
                        <p className="text-sm text-violet-300 font-medium mb-1 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {appliedJob.company}
                        </p>
                      )}
                      {appliedJob.location && (
                        <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-500" />
                          {appliedJob.location}
                        </p>
                      )}
                    </div>

                    {/* Status List */}
                    <div className="mb-4 p-3 rounded-xl bg-slate-900/40 border border-slate-700/50 space-y-2.5">
                      {/* CV Status */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                          <FileText className={cn(
                            "w-4 h-4",
                            (appliedJob.hasCv || savedJob?.statuses?.cv === 'ready')
                              ? "text-emerald-400" 
                              : "text-slate-500"
                          )} />
                          CV
                        </span>
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          (appliedJob.hasCv || savedJob?.statuses?.cv === 'ready')
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                        )}>
                          {(appliedJob.hasCv || savedJob?.statuses?.cv === 'ready') ? 'Ready' : 'Not tailored'}
                        </span>
                      </div>

                      {/* Cover Letter Status */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                          <Mail className={cn(
                            "w-4 h-4",
                            (appliedJob.hasCover || savedJob?.statuses?.cover === 'ready')
                              ? "text-emerald-400" 
                              : "text-slate-500"
                          )} />
                          Cover Letter
                        </span>
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          (appliedJob.hasCover || savedJob?.statuses?.cover === 'ready')
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                        )}>
                          {(appliedJob.hasCover || savedJob?.statuses?.cover === 'ready') ? 'Ready' : 'Not created'}
                        </span>
                      </div>

                      {/* Application Status */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
                          <Send className={cn(
                            "w-4 h-4",
                            (appliedJob.status === 'submitted' || savedJob?.statuses?.application === 'submitted')
                              ? "text-emerald-400" 
                              : "text-slate-500"
                          )} />
                          Application
                        </span>
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          (appliedJob.status === 'submitted' || savedJob?.statuses?.application === 'submitted')
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                        )}>
                          {(appliedJob.status === 'submitted' || savedJob?.statuses?.application === 'submitted') ? 'Submitted' : 'Not submitted'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewJobDetails(appliedJob.id)}
                        className="w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)] hover:shadow-[0_0_25px_rgba(139,92,246,1)] flex items-center justify-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Job Details
                      </button>
                      
                      <button
                        onClick={() => handleGoToInterviewTraining(appliedJob)}
                        className="w-full rounded-full bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 hover:bg-slate-800 transition flex items-center justify-center gap-2"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Interview Training
                      </button>
                      
                      <div className="flex items-center gap-2 pt-1">
                        {appliedJob.createdAt && (
                          <p className="text-xs text-slate-500 flex-1">
                            Applied {formatDaysAgo(appliedJob.createdAt) || 'recently'}
                          </p>
                        )}
                        <button
                          onClick={() => handleRemoveJob(appliedJob.id)}
                          className="px-3 py-1.5 rounded-full border border-slate-600/50 text-xs font-medium text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Support JobAZ Section */}
        <section className="mt-12 pt-8 border-t border-slate-700/40">
          <div className="max-w-xl mx-auto text-center">
            <blockquote className="text-xs md:text-sm text-slate-400/80 mb-4 italic border-l-2 border-violet-500/20 pl-3">
              If JobAZ helped you, your support helps keep the platform free and accessible — especially for people who can't afford paid tools.
            </blockquote>
            <a
              href="https://buymeacoffee.com/jobaz.support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/40 border border-violet-500/30 text-violet-300/90 hover:border-violet-400/50 hover:bg-slate-800/60 hover:text-violet-200 transition-all duration-300 text-xs md:text-sm font-medium"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-violet-300/90"
                style={{ width: '14px', height: '14px' }}
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
              Support JobAZ — Keep it free for everyone
            </a>
          </div>
        </section>

        {/* CV Modal */}
        {isCvModalOpen && baseCv && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsCvModalOpen(false)}
          >
            <div 
              className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-950/95 backdrop-blur-xl p-6 shadow-[0_18px_50px_rgba(76,29,149,0.65)] max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsCvModalOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 text-sm transition"
              >
                ✕
              </button>

              <h2 className="text-2xl font-extrabold mb-4 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">My CV</h2>
              
              {baseCv.fullName && (
                <h3 className="text-3xl font-semibold mb-4 text-slate-50">{baseCv.fullName}</h3>
              )}

              {/* Contact Info */}
              {(baseCv.email || baseCv.phone || baseCv.city) && (
                <div className="mb-6 pb-4 border-b border-slate-700/60">
                  <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                    {baseCv.email && <span>{baseCv.email}</span>}
                    {baseCv.phone && <span>{baseCv.phone}</span>}
                    {baseCv.city && <span>{baseCv.city}</span>}
                  </div>
                </div>
              )}

              {/* Summary */}
              {baseCv.summary && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-2 text-slate-50">Summary</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{baseCv.summary}</p>
                </div>
              )}

              {/* Experience */}
              {baseCv.experience && Array.isArray(baseCv.experience) && baseCv.experience.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3 text-slate-50">Experience</h4>
                  <div className="space-y-4">
                    {baseCv.experience.map((exp: any, index: number) => (
                      <div key={index} className="pb-4 border-b border-slate-700/60 last:border-b-0 last:pb-0">
                        {exp.jobTitle && (
                          <h5 className="text-lg font-semibold text-slate-50">{exp.jobTitle}</h5>
                        )}
                        {exp.company && (
                          <p className="text-violet-300 font-medium">{exp.company}</p>
                        )}
                        {exp.period && (
                          <p className="text-sm text-slate-400 mb-2">{exp.period}</p>
                        )}
                        {exp.description && (
                          <p className="text-slate-300 whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {baseCv.education && Array.isArray(baseCv.education) && baseCv.education.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3 text-slate-50">Education</h4>
                  <div className="space-y-4">
                    {baseCv.education.map((edu: any, index: number) => (
                      <div key={index} className="pb-4 border-b border-slate-700/60 last:border-b-0 last:pb-0">
                        {edu.degree && (
                          <h5 className="text-lg font-semibold text-slate-50">{edu.degree}</h5>
                        )}
                        {edu.school && (
                          <p className="text-violet-300 font-medium">{edu.school}</p>
                        )}
                        {edu.period && (
                          <p className="text-sm text-slate-400 mb-2">{edu.period}</p>
                        )}
                        {edu.description && (
                          <p className="text-slate-300 whitespace-pre-wrap">{edu.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {baseCv.skills && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold mb-3 text-slate-50">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(baseCv.skills) ? (
                      baseCv.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-violet-600/20 text-violet-300 rounded-lg text-sm border border-violet-600/30"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-300">{baseCv.skills}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cover Letter Modal */}
        {isCoverModalOpen && baseCover && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsCoverModalOpen(false)}
          >
            <div 
              className="w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-950/95 backdrop-blur-xl p-6 shadow-[0_18px_50px_rgba(76,29,149,0.65)] max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsCoverModalOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 text-sm transition"
              >
                ✕
              </button>
              <h2 className="text-xl font-extrabold mb-2 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">My Cover Letter</h2>
              {baseCover.jobTitle && baseCover.company && (
                <p className="text-sm text-violet-300 mb-3">
                  {baseCover.jobTitle} @ {baseCover.company}
                </p>
              )}
              <pre className="whitespace-pre-wrap text-sm text-slate-100">
                {baseCover.bodyText}
              </pre>
            </div>
          </div>
        )}

        {/* Confirm Remove Job Modal */}
        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          title="Remove Job"
          message="Remove this job from your applied list?"
          onConfirm={handleConfirmRemove}
          onCancel={handleCancelRemove}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={deleteAccountModalOpen}
          onConfirm={handleDeleteAccount}
          onCancel={() => {
            if (!isDeletingAccount) {
              setDeleteAccountModalOpen(false)
            }
          }}
          isDeleting={isDeletingAccount}
        />
      </>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-slate-700/60">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-violet-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-violet-300 transition-colors">
              Terms & Conditions
            </Link>
            <button
              onClick={() => setDeleteAccountModalOpen(true)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Delete Account
            </button>
          </div>
          <p className="text-slate-500">© {new Date().getFullYear()} JobAZ</p>
        </div>
      </footer>
  </AppShell>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div
            className={cn(
              'rounded-lg px-4 py-3 shadow-lg flex items-center gap-2',
              toast.type === 'success'
                ? 'bg-green-600/90 text-white'
                : 'bg-red-600/90 text-white'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
  </div>
  )
}

