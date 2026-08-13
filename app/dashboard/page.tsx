'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, FileText, Mail, Send, GraduationCap, ArrowRight, Briefcase, Lock, Search, Sparkles, Zap, Target, RefreshCw, Star, Compass, FileCheck, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformSectionHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import { CareerOsDashboard } from '@/components/dashboard/career-os'
import DocumentsHub from '@/components/dashboard/DocumentsHub'
import DashboardSupportFooter from '@/components/dashboard/DashboardSupportFooter'
import { resolveDashboardTab, dashboardTabHref } from '@/lib/dashboard/navigateDashboardTab'
import { useCareerJourney } from '@/hooks/useCareerJourney'
import RecommendedJobCard from '@/components/dashboard/RecommendedJobCard'
import { type AppliedJob } from '@/lib/applied-jobs-storage'
import { ConfirmModal } from '@/components/ConfirmModal'
import { DeleteAccountModal } from '@/components/DeleteAccountModal'
import { calculateMatchPercentage, filterJobsByRelevance, isTrainingJob } from '@/lib/job-matching'
import {
  JOBS_FOR_YOU_REFRESH_EVENT,
  resolveJobsForYouSource,
  type JobsForYouSource,
} from '@/lib/jobs/resolveJobsForYouSource'
import {
  clearJobsForYouLocalCache,
  filterJobsByForbiddenAndScore,
} from '@/lib/jobs/mapPlanOrCvToJobQueries'
import { CAREER_PLAN_REFRESH_EVENT } from '@/lib/dashboard/careerOs/types'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { supabase } from '@/lib/supabase'
import { clearCurrentUserStorage, initUserStorageCache, getCurrentUserIdSync, getUserScopedKeySync } from '@/lib/user-storage'
import { clearCachesOnLogout } from '@/lib/career-engine/clearSharedCareerCache'
import { resetAssessmentLoaderUserCache } from '@/lib/dashboard/careerOs/assessmentLoader'
import { UK_CITIES, getLocationValue } from '@/lib/uk-cities'
import { calculateCvReadiness } from '@/lib/cv/calculateCvReadiness'
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
    certifications: Array.isArray(cv?.certifications) ? cv.certifications : [],
  }
}

// Wrapper — shared readiness used by My Plan + Documents
function calculateCVScore(cv: any): { score: number } {
  return { score: calculateCvReadiness(convertDashboardCvToCvData(cv)).score }
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = useMemo(
    () => resolveDashboardTab(pathname, searchParams.get('tab')),
    [pathname, searchParams]
  )
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
  const [debugInfo, setDebugInfo] = useState<{
    query: string
    keywords: string[]
    apiUrl?: string
    location?: string
    matchSource?: string
  } | null>(null)
  const [jobsForYouQuery, setJobsForYouQuery] = useState<string>('')
  const [jobsForYouMatchLabel, setJobsForYouMatchLabel] = useState<string>('')
  const [jobsForYouSourceType, setJobsForYouSourceType] = useState<JobsForYouSource['sourceType']>('empty')
  const [jobsForYouMeta, setJobsForYouMeta] = useState<{
    planId?: string
    cvId?: string
    targetRole?: string
    route?: string
    forbiddenTerms?: string[]
    alternativeQueries?: string[]
  }>({})
  const [isAdminDebug, setIsAdminDebug] = useState(false)
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
      const response = await fetch('/api/cv/get-latest', {
        signal: AbortSignal.timeout(12_000),
      })
      
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
        setCvId(null)
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
        setCvId(null)
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
        setCvId(null)
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
        setCvId(null)
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
        certifications: Array.isArray(data.cv.certifications) ? data.cv.certifications : [],
      }
      
      setBaseCv(dashboardCv)
      setCvId(typeof data.cvId === 'string' ? data.cvId : null)
      if (typeof data.cvId === 'string') {
        try {
          localStorage.setItem('jobaz_active_cv_id', data.cvId)
        } catch {
          // ignore
        }
      }
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
      setCvId(null)
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
          setIsAdminDebug(isAdminUser(email))

          // Load user-scoped saved jobs
          void (async () => {
            try {
              const res = await fetch('/api/saved-jobs/list')
              if (!res.ok) {
                setIsSavedJobsInitialized(true)
                return
              }
              const data = await res.json()
              if (data.ok && Array.isArray(data.items)) {
                const mapped: Job[] = data.items.map((item: any) => {
                  const j = item.job || {}
                  return {
                    id: item.job_key || j.id || '',
                    title: j.title || '',
                    company: j.company || '',
                    location: j.location || '',
                    description: j.description || '',
                    type: j.type || '',
                    link: j.link || j.redirect_url || j.url,
                  }
                }).filter((j: Job) => j.id)
                setSavedJobsFromJobFinder(mapped)
              }
            } catch {
              // ignore — empty saved list
            } finally {
              setIsSavedJobsInitialized(true)
            }
          })()

          // Jobs For You always resolves from Supabase via resolveJobsForYouSource on refresh
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

  // Safety net: never leave the full-page skeleton forever if a fetch hangs
  useEffect(() => {
    const safety = window.setTimeout(() => {
      setLoadingCv(false)
      setLoading(false)
      setIsLoading(false)
    }, 15_000)
    return () => window.clearTimeout(safety)
  }, [])

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
    
    // Throttle focus refresh — avoid refetching CV/cover/jobs on every tab switch
    const FOCUS_REFRESH_MS = 60_000
    let lastFocusRefresh = 0
    const handleFocus = () => {
      const now = Date.now()
      if (now - lastFocusRefresh < FOCUS_REFRESH_MS) return
      lastFocusRefresh = now
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

  // AbortController ref for canceling previous fetches
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Jobs For You — always re-resolve source from Supabase (active plan + saved CV)
   * for the signed-in user, then search. Never uses stale localStorage as primary.
   */
  const fetchRecommendedJobs = useCallback(async (opts?: { showToast?: 'cv' | 'plan' | 'manual' }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller
    const fetchSignal = controller.signal

    setLoadingRecommendedJobs(true)
    setRecommendedJobs([])
    clearJobsForYouLocalCache()
    try {
      const source = await resolveJobsForYouSource()
      if (fetchSignal.aborted) return

      setJobsForYouQuery(source.primaryQuery)
      setJobsForYouMatchLabel(source.matchLabel)
      setJobsForYouSourceType(source.sourceType)
      setJobsForYouMeta({
        planId: source.planId,
        cvId: source.cvId,
        targetRole: source.targetRole,
        route: source.route,
        forbiddenTerms: source.forbiddenTerms,
        alternativeQueries: source.alternativeQueries,
      })

      // Keep dashboard CV state in sync with latest saved CV from Supabase
      if (source.cvRaw) {
        setBaseCv(source.cvRaw)
        if (source.cvId) setCvId(source.cvId)
        if (source.cvUpdatedAt) setCvLastUpdated(source.cvUpdatedAt)
      }

      if (opts?.showToast === 'cv') {
        setToast({ type: 'success', message: 'CV saved — job matches updated' })
      } else if (opts?.showToast === 'plan') {
        setToast({ type: 'success', message: 'Career plan saved — job matches updated' })
      }

      if (!source.primaryQuery || source.sourceType === 'empty') {
        setRecommendedJobs([])
        setDebugInfo(null)
        return
      }

      const searchQuery = source.primaryQuery
      const matchKeywords = [
        ...source.supportingKeywords,
        ...(source.alternativeQueries || []),
      ]
      const forbiddenTerms = source.forbiddenTerms || []
      const location = getLocationValue(recommendedLocation)

      const params = new URLSearchParams()
      params.set('keyword', searchQuery.trim())
      params.set('location', location)
      const apiUrl = `/api/jobs/search?${params.toString()}`

      if (isAdminDebug && process.env.NODE_ENV === 'development') {
        console.log('[Admin/Dev] Jobs For You source:', {
          sourceType: source.sourceType,
          query: searchQuery,
          alternatives: source.alternativeQueries,
          forbidden: forbiddenTerms,
          planId: source.planId,
          cvId: source.cvId,
        })
        setDebugInfo({
          query: searchQuery,
          keywords: matchKeywords.slice(0, 12),
          apiUrl,
          location,
          matchSource: source.sourceType,
        })
      } else {
        setDebugInfo(null)
      }

      const response = await fetch(apiUrl, { signal: fetchSignal, cache: 'no-store' })
      if (fetchSignal.aborted) return
      if (!response.ok) throw new Error('Failed to fetch recommended jobs')

      const data = await response.json()
      let results: Job[] = (data.results || []).slice(0, 24)
      if (fetchSignal.aborted) return

      if (results.length > 0 && matchKeywords.length > 0) {
        let filtered = filterJobsByRelevance(results, matchKeywords, searchQuery, filterMode) as Job[]
        if (filtered.length === 0 && filterMode === 'strict') {
          filtered = filterJobsByRelevance(results, matchKeywords, searchQuery, 'balanced') as Job[]
        }
        if (filtered.length === 0 && filterMode === 'balanced') {
          filtered = filterJobsByRelevance(results, matchKeywords, searchQuery, 'loose') as Job[]
        }
        results = filtered.slice(0, 16)
      } else {
        results = results.slice(0, 16)
      }

      if (fetchSignal.aborted) return

      let jobsWithClassification = results.map((job) => {
        const isTraining = isTrainingJob(job)
        const matchPercentage = calculateMatchPercentage(
          matchKeywords,
          job.title,
          job.description,
          searchQuery
        )
        return { ...job, matchPercentage, isTraining }
      })

      jobsWithClassification = filterJobsByForbiddenAndScore(
        jobsWithClassification,
        forbiddenTerms,
        1
      )

      const realJobs = jobsWithClassification.filter((job) => !job.isTraining)
      const trainingJobs = jobsWithClassification.filter((job) => job.isTraining)
      realJobs.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
      trainingJobs.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))

      let filteredJobs: typeof jobsWithClassification = []
      if (resultType === 'jobs-only') {
        filteredJobs = realJobs
        if (filteredJobs.length === 0 && jobsWithClassification.length > 0) {
          setFallbackToAll(true)
          filteredJobs = jobsWithClassification
          setTimeout(() => setResultType('all'), 0)
        } else {
          setFallbackToAll(false)
        }
      } else if (resultType === 'training-only') {
        filteredJobs = trainingJobs
        setFallbackToAll(false)
      } else {
        filteredJobs = [...realJobs, ...trainingJobs]
        setFallbackToAll(false)
      }

      if (!fetchSignal.aborted) {
        setRecommendedJobs(filteredJobs.slice(0, 12))
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || fetchSignal.aborted) return
      console.error('Error fetching recommended jobs:', error)
      if (!fetchSignal.aborted) setRecommendedJobs([])
    } finally {
      if (!fetchSignal.aborted) setLoadingRecommendedJobs(false)
    }
  }, [filterMode, resultType, recommendedLocation, isAdminDebug])

  // Page load + filter/location change — resolve from Supabase (no polling)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchRecommendedJobs()
    }, 300)
    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [fetchRecommendedJobs])

  // CV / plan save events → refetch Supabase source
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onCvSaved = () => {
      void fetchCvFromApi()
      void fetchRecommendedJobs()
    }
    const onJobsRefresh = (e: Event) => {
      const detail = (e as CustomEvent)?.detail as { reason?: string } | undefined
      const reason = detail?.reason
      void fetchRecommendedJobs({
        showToast: reason === 'plan' ? 'plan' : undefined,
      })
    }
    const onPlanRefresh = () => {
      // Prefer JOBS_FOR_YOU_REFRESH_EVENT for toast; this covers older callers
      void fetchRecommendedJobs()
    }

    window.addEventListener('jobaz-cv-saved', onCvSaved)
    window.addEventListener(JOBS_FOR_YOU_REFRESH_EVENT, onJobsRefresh as EventListener)
    window.addEventListener(CAREER_PLAN_REFRESH_EVENT, onPlanRefresh)
    window.addEventListener('jobaz-career-plan-generated-updated', onPlanRefresh)

    return () => {
      window.removeEventListener('jobaz-cv-saved', onCvSaved)
      window.removeEventListener(JOBS_FOR_YOU_REFRESH_EVENT, onJobsRefresh as EventListener)
      window.removeEventListener(CAREER_PLAN_REFRESH_EVENT, onPlanRefresh)
      window.removeEventListener('jobaz-career-plan-generated-updated', onPlanRefresh)
    }
  }, [fetchRecommendedJobs, fetchCvFromApi])

  // Handler for saving a job (user-scoped via /api/saved-jobs/toggle)
  const handleSaveRecommendedJob = async (job: Job) => {
    if (typeof window === 'undefined') return

    const jobKey = job.id
    const already = savedJobsFromJobFinder.some((j) => j.id === jobKey)
    if (already) return

    setSavedJobsFromJobFinder((prev) => [...prev, job])

    try {
      const response = await fetch('/api/saved-jobs/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_key: jobKey, job }),
      })
      if (!response.ok) {
        setSavedJobsFromJobFinder((prev) => prev.filter((j) => j.id !== jobKey))
        return
      }
      window.dispatchEvent(new Event('jobaz-saved-jobs-changed'))
    } catch {
      setSavedJobsFromJobFinder((prev) => prev.filter((j) => j.id !== jobKey))
    }
  }

  const handleMarkRecommendedApplied = async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/applied/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobKey: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          url: job.link,
          source: 'jobs_for_you',
          data: { status: 'submitted', from: 'jobs_for_you' },
        }),
      })
      if (response.ok) {
        await fetchAppliedJobsFromApi()
        setToast({ type: 'success', message: 'Marked as applied.' })
      }
    } catch (error) {
      console.error('Failed to mark job as applied:', error)
      setToast({ type: 'error', message: 'Could not mark as applied.' })
    }
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
      clearCachesOnLogout()
      resetAssessmentLoaderUserCache()
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
          const searchQuery = jobsForYouQuery.trim()
          if (searchQuery) {
            params.set('jobTitle', searchQuery)
            params.set('query', searchQuery)
          }
          if (baseCv?.city) {
            params.set('location', baseCv.city)
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

  useEffect(() => {
    if (searchParams.get('tab') === 'feed') {
      router.replace('/feed')
    }
    if (searchParams.get('tab') === 'training') {
      router.replace('/dashboard#recommended-training')
    }
  }, [searchParams, router])

  const cvQualityScore = useMemo(() => {
    // Always derive from real saved CV fields (shared calculateCvReadiness)
    if (!baseCv) return 0
    if (readiness?.score != null && typeof readiness.score === 'number') {
      // Prefer API shared score when present; recompute as fallback for consistency
      return readiness.score
    }
    return calculateCVScore(baseCv).score
  }, [readiness, baseCv])

  const interviewConfidence = useMemo(() => {
    let score = 15
    if (savedJobs.some((j) => j.statuses.training === 'available')) score += 45
    if (appliedJobs.length > 0) score += 25
    if (appliedJobs.some((j) => j.hasCv)) score += 15
    return Math.min(score, 100)
  }, [savedJobs, appliedJobs])

  const jobMatchStrength = useMemo(() => {
    if (recommendedJobs.length === 0) return 0
    return Math.round(
      recommendedJobs.reduce((s, j) => s + (j.matchPercentage ?? 0), 0) / recommendedJobs.length
    )
  }, [recommendedJobs])

  const journeySignals = useMemo(
    () => ({
      hasAssessment: false,
      readinessScore: cvQualityScore,
      cvQualityScore,
      hasBaseCv: !!baseCv,
      applicationsCount: appliedJobs.length,
      interviewConfidence,
      savedJobsCount: savedJobs.length,
    }),
    [cvQualityScore, baseCv, appliedJobs.length, interviewConfidence, savedJobs.length]
  )

  const { snapshot: careerJourneySnapshot } = useCareerJourney(journeySignals)

  const handleLogout = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const userId = user?.id || null
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        clearCachesOnLogout()
        resetAssessmentLoaderUserCache()
        if (userId) {
          await clearCurrentUserStorage()
        }
      }
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/')
    }
  }, [router])

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
            <div className="h-5 w-full max-w-sm bg-slate-800/30 rounded-lg animate-pulse" />
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
  <AppShell wide platform>
      <PlatformShell
        identity={{
          displayName: displayName || 'Your career',
          displayEmail: displayEmail || undefined,
          careerStateLabel: careerJourneySnapshot?.stateLabel,
          onLogout: handleLogout,
        }}
      >
      <PlatformContent>
      {/* Tab-specific platform content */}
      <>
        {activeTab === 'overview' && (
          <CareerOsDashboard
            cvQualityScore={cvQualityScore}
            hasBaseCv={Boolean(baseCv)}
            appliedJobsCount={appliedJobs.length}
            savedJobsCount={savedJobs.length + savedJobsFromJobFinder.length}
            interviewConfidence={interviewConfidence}
            onCvCleared={() => {
              setBaseCv(null)
              setCvId(null)
              setCvLastUpdated(null)
              setReadiness(null)
            }}
            onPlanCleared={() => {
              // Plan local caches cleared by ManagePlanDataControls; page reloads
            }}
          />
        )}

        {activeTab === 'career-path' && (
          <section className="mb-10 space-y-5">
            <h2 className="text-xl font-semibold text-slate-50 tracking-tight flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
              Career Path
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                href="/uk-career-assistant"
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-950/50 p-6',
                  'hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition'
                )}
              >
                <span className="absolute top-3 right-3 rounded-full bg-violet-600/90 px-2 py-0.5 text-[10px] font-medium uppercase text-violet-100">
                  Recommended
                </span>
                <MessageSquare className="w-6 h-6 text-violet-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-50 mb-2">UK Career Assistant</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  AI-guided assessment: Work Now vs Improve Later, personalised paths, and next steps.
                </p>
              </Link>
              <Link
                href="/career-hub"
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6',
                  'hover:border-violet-400/70 hover:shadow-[0_0_40px_rgba(168,85,247,0.35)] transition'
                )}
              >
                <Compass className="w-6 h-6 text-violet-400 mb-3" />
                <h3 className="text-lg font-semibold text-slate-50 mb-2">Career Hub</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Courses, licences, certifications, and career routes — explore or follow your AI plan.
                </p>
              </Link>
            </div>
          </section>
        )}

        {activeTab === 'documents' && (
          <>
        <PlatformSectionHeader
          title="Documents"
          description="Your CV hub — view, improve, and keep applications ready."
          dotColor="violet"
        />

        <DocumentsHub
          baseCv={baseCv}
          cvId={cvId}
          cvLastUpdated={cvLastUpdated}
          baseCover={baseCover}
          formatDaysAgo={formatDaysAgo}
          onViewCv={() => setIsCvModalOpen(true)}
          onViewCover={() => setIsCoverModalOpen(true)}
          appliedJobsCount={appliedJobs.length}
          savedJobsCount={savedJobs.length + savedJobsFromJobFinder.length}
          interviewConfidence={interviewConfidence}
          cvQualityScore={cvQualityScore}
        />

        {cvError && (
          <p className="text-sm text-red-400 mb-6 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-2">
            {cvError.message}
          </p>
        )}
          </>
        )}

        {activeTab === 'interview' && (
          <section className="mb-10 space-y-6">
            <h2 className="text-xl font-semibold text-slate-50 tracking-tight flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
              Interview Readiness
            </h2>
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div>
                  <p className="text-xs uppercase text-slate-500 mb-1">Interview Confidence</p>
                  <p className={cn('text-4xl font-bold tabular-nums', interviewConfidence >= 70 ? 'text-emerald-400' : interviewConfidence >= 50 ? 'text-amber-400' : 'text-slate-300')}>
                    {interviewConfidence}
                    <span className="text-lg text-slate-500 font-normal">/100</span>
                  </p>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${interviewConfidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Practice with Interview Coach and tailor applications to build confidence.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/interview-coach')}
                className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_18px_rgba(139,92,246,0.6)]"
              >
                Open Interview Coach
              </button>
            </div>
            {appliedJobs.length > 0 && (
              <p className="text-sm text-slate-400">
                You have {appliedJobs.length} application{appliedJobs.length !== 1 ? 's' : ''} — use the{' '}
                <Link href={dashboardTabHref('jobs')} className="text-violet-400 hover:text-violet-300 underline">
                  Jobs For You tab
                </Link>{' '}
                to train for specific roles.
              </p>
            )}
          </section>
        )}

        {activeTab === 'jobs' && (
        <>
        <PlatformSectionHeader
          title="Jobs For You"
          description="Personalised job matches based on your CV and current career plan."
          dotColor="amber"
        />

        <section ref={recommendedJobsRef}>
          <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-50 tracking-tight flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse" />
                  Recommended Jobs
                </h2>
                {jobsForYouMatchLabel && (
                  <span className="text-xs text-violet-300/90 font-medium rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5">
                    {jobsForYouMatchLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                {jobsForYouSourceType === 'plan_and_cv' || jobsForYouSourceType === 'plan_only'
                  ? `Prioritising your ${jobsForYouMeta.targetRole || jobsForYouMeta.route || 'career'} plan${
                      jobsForYouSourceType === 'plan_and_cv' ? ', with CV skills as supporting fit' : ''
                    }.`
                  : jobsForYouSourceType === 'cv_only'
                    ? 'Based on your saved CV — add a Career Assistant plan to steer recommendations.'
                    : 'Build a CV or create a career plan to get personalised matches.'}
              </p>
              {jobsForYouQuery && (
                <p className="text-xs text-slate-500 mt-1">
                  Search focus: <span className="text-slate-300">{jobsForYouQuery}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const params = new URLSearchParams()
                  if (jobsForYouQuery.trim()) {
                    params.set('query', jobsForYouQuery.trim())
                    params.set('jobTitle', jobsForYouQuery.trim())
                  }
                  const loc = getLocationValue(recommendedLocation)
                  if (loc) params.set('location', loc)
                  const qs = params.toString()
                  router.push(qs ? `/job-finder?${qs}` : '/job-finder')
                }}
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
                  setFallbackToAll(false)
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
              
              {/* Refine Results — Admin / Dev debug only */}
              {isAdminDebug && process.env.NODE_ENV === 'development' && (
                <select
                  value={filterMode}
                  onChange={(e) => {
                    const newMode = e.target.value as 'strict' | 'balanced' | 'loose'
                    setFilterMode(newMode)
                    fetchRecommendedJobs()
                  }}
                  className="rounded-full bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-amber-500/40 hover:border-amber-400/60 transition"
                  title="Admin / Dev debug only"
                >
                  <option value="strict">Strict (2 keywords)</option>
                  <option value="balanced">Balanced (1 keyword)</option>
                  <option value="loose">Loose (no filter)</option>
                </select>
              )}
              <button
                onClick={() => void fetchRecommendedJobs({ showToast: undefined })}
                disabled={loadingRecommendedJobs}
                className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-3 h-3", loadingRecommendedJobs && "animate-spin")} />
                Refresh matches
              </button>
            </div>
          </div>

          {/* Admin / Dev debug only — never shown to public users */}
          {isAdminDebug && process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-100/90">
              <div className="font-semibold text-amber-200 mb-1">Admin / Dev debug only</div>
              <div>Query used: <span className="text-violet-300">{debugInfo.query || 'N/A'}</span></div>
              <div>Keywords: <span className="text-violet-300">{debugInfo.keywords.length > 0 ? debugInfo.keywords.join(', ') : 'N/A'}</span></div>
              {debugInfo.matchSource && (
                <div>Match source: <span className="text-violet-300">{debugInfo.matchSource}</span></div>
              )}
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
              {(jobsForYouMeta.forbiddenTerms?.length || 0) > 0 && (
                <div className="mt-1">
                  Forbidden: <span className="text-violet-300">{jobsForYouMeta.forbiddenTerms?.join(', ')}</span>
                </div>
              )}
              {(jobsForYouMeta.alternativeQueries?.length || 0) > 0 && (
                <div className="mt-1">
                  Alternatives: <span className="text-violet-300">{jobsForYouMeta.alternativeQueries?.join(', ')}</span>
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
              <p className="text-slate-400">Finding jobs that match your plan and CV...</p>
            </div>
          ) : jobsForYouSourceType === 'empty' || (!baseCv && !jobsForYouMeta.planId) ? (
            <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/50">
              <Star className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 text-lg mb-2">
                Build a CV or create a career plan to get personalised job matches.
              </p>
              <p className="text-slate-400 text-sm mb-6">
                We combine your Career Assistant plan with your saved CV to recommend the right UK roles.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => router.push('/uk-career-assistant')}
                  className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                >
                  Start Career Assistant
                </button>
                <button
                  onClick={() => router.push('/cv-builder-v2')}
                  className="rounded-full border border-slate-600/70 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-violet-400/50 transition"
                >
                  Open CV Builder
                </button>
              </div>
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/50">
              <Star className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 text-lg mb-2">No matches yet — try Refresh jobs or broaden your location.</p>
              <p className="text-slate-400 text-sm mb-4">
                Update your CV or Career Assistant plan to improve results.
              </p>
              {jobsForYouQuery && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams()
                    params.set('query', jobsForYouQuery)
                    params.set('jobTitle', jobsForYouQuery)
                    if (baseCv?.city) params.set('location', baseCv.city)
                    router.push(`/job-finder?${params.toString()}`)
                  }}
                  className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition shadow-[0_0_18px_rgba(139,92,246,0.8)]"
                >
                  Open Job Finder
                </button>
              )}
            </div>
          ) : (
            <>
              {baseCv && (!baseCv.summary?.trim() || (baseCv.skills?.length || 0) < 5 || (baseCv.experience?.length || 0) < 1) && jobsForYouSourceType === 'cv_only' && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  Add more skills/experience to improve matching.
                </div>
              )}

              {fallbackToAll && recommendedJobs.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  No direct job openings found. Showing training options instead.
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recommendedJobs.map((job) => (
                  <RecommendedJobCard
                    key={job.id}
                    job={job}
                    isSaved={isRecommendedJobSaved(job.id)}
                    isApplied={appliedJobs.some((a) => a.id === job.id)}
                    onView={() => handleViewRecommendedJob(job)}
                    onSave={() => handleSaveRecommendedJob(job)}
                    onMarkApplied={() => handleMarkRecommendedApplied(job)}
                    onTailorCv={() => handleTailorCVFromRecommended(job.id)}
                    onTrainInterview={() => handleTrainInterviewFromRecommended(job)}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Saved / Applied Jobs — private to signed-in user */}
        {(savedJobsFromJobFinder.length > 0 || appliedJobs.length > 0) && (
          <section className="mt-10 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-50 tracking-tight mb-1 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
                Saved / Applied Jobs
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Your private shortlist — only visible to you while signed in.
              </p>
            </div>

            {savedJobsFromJobFinder.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Saved Jobs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedJobsFromJobFinder.map((job) => (
                    <RecommendedJobCard
                      key={job.id}
                      job={job}
                      isSaved
                      isApplied={appliedJobs.some((a) => a.id === job.id)}
                      onView={() => handleViewRecommendedJob(job)}
                      onSave={() => {}}
                      onMarkApplied={() => handleMarkRecommendedApplied(job)}
                      onTailorCv={() => handleTailorCVFromRecommended(job.id)}
                      onTrainInterview={() => handleTrainInterviewFromRecommended(job)}
                    />
                  ))}
                </div>
              </div>
            )}

        {/* Jobs you applied for */}
        {appliedJobs.length > 0 && (
        <section ref={appliedJobsRef} className={savedJobsFromJobFinder.length > 0 ? 'mt-2' : ''}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  Jobs You Applied For
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300">
                  {appliedJobs.length} {appliedJobs.length === 1 ? 'Job' : 'Jobs'}
                </span>
              </div>
              <p className="text-sm text-slate-400">Track your application progress and manage your job applications</p>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-12 rounded-2xl border border-slate-700/60 bg-slate-950/50">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mb-4"></div>
              <p className="text-slate-400">Loading your jobs...</p>
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
          )}
        </section>
        )}
        </>
        )}

        {activeTab === 'overview' && (
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
        )}

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
      </PlatformContent>

      <DashboardSupportFooter
        onDeleteAccount={() => setDeleteAccountModalOpen(true)}
        onCvCleared={() => {
          setBaseCv(null)
          setCvId(null)
          setCvLastUpdated(null)
          setReadiness(null)
        }}
        onPlanCleared={() => {
          // Plan local caches cleared by ManagePlanDataControls; refresh UI
        }}
      />
      </PlatformShell>
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

