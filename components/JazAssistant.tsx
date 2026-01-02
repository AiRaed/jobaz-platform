'use client'

import { useState, useRef, useEffect, useMemo, useCallback, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslationSettings } from '@/contexts/TranslationSettingsContext'
import { useJazContext } from '@/contexts/JazContextContext'
import { useJazStore, type JazMode } from '@/lib/jaz-store'
import { Copy, ExternalLink, FileText, CheckCircle2, Sparkles, Check, AlertTriangle, Rocket, Target, CheckSquare, ChevronDown, ChevronUp, Zap, X } from 'lucide-react'
import { getNextBestAction, type JazGuidanceState, type NextBestAction } from '@/lib/jaz-guidance'
import { getAppliedJobs } from '@/lib/applied-jobs-storage'
import { scrollAndHighlight } from '@/lib/jaz-ui'
import { NextStepLoadingCard } from '@/components/NextStepLoadingCard'
import { useNextStepLoadingStore, generateRequestId } from '@/lib/next-step-loading-store'
import { getBaseCvAnyScope } from '@/lib/cv-storage'
import { getCurrentUserIdSync, getUserScopedKeySync } from '@/lib/user-storage'

export type JazLanguage = 'EN' | 'AR' | 'FA' | 'KU' | 'ES' | 'PL'

// Normalize language value to standard format
// Handles variations like "Arabic", "AR", "ar", etc.
function normalizeLang(value: string): 'en' | 'ar' | 'fa' | 'ku' | 'es' | 'pl' {
  if (!value) return 'en'
  
  const normalized = value.trim().toLowerCase()
  
  // Arabic variations
  if (normalized === 'ar' || normalized === 'arabic' || normalized === 'عربي') {
    return 'ar'
  }
  
  // Persian/Farsi variations
  if (normalized === 'fa' || normalized === 'persian' || normalized === 'farsi' || normalized === 'فارسی') {
    return 'fa'
  }
  
  // Kurdish variations
  if (normalized === 'ku' || normalized === 'kurdish' || normalized === 'کوردی') {
    return 'ku'
  }
  
  // Spanish variations
  if (normalized === 'es' || normalized === 'spanish' || normalized === 'español') {
    return 'es'
  }
  
  // Polish variations
  if (normalized === 'pl' || normalized === 'polish' || normalized === 'polski') {
    return 'pl'
  }
  
  // English (default)
  return 'en'
}

// Check if language is RTL
function isRTLLanguage(lang: string): boolean {
  const normalized = normalizeLang(lang)
  return normalized === 'ar' || normalized === 'fa' || normalized === 'ku'
}

// Apply Assistant Result type matching API response
export interface ApplyAssistantResult {
  jobAnalysis: {
    requiredSkills: string[]
    requiredExperience: string[]
    responsibilities: string[]
    sector: string
    keywords: string[]
    seniorityLevel: string
  }
  comparison: {
    matchingSkills: string[]
    missingSkills: string[]
    strengths: string[]
    risks: string[]
  }
  fitScore: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  improvedSummary: string
  coverLetter: string
  actionPlan: string
}

export type JazMessage =
  | { id: string; role: 'user'; content: string; timestamp: Date }
  | { id: string; role: 'assistant'; content: string; timestamp: Date }
  | { id: string; role: 'assistant-cards'; data: ApplyAssistantResult; timestamp: Date }

// Legacy type for backward compatibility
export interface LegacyJazMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'fit-score' | 'cv-improvement' | 'cover-letter' | 'action-plan'
  data?: any
}

// Context types for CV Builder and Cover Letter pages
export interface CvBuilderContext {
  page: 'cv-builder'
  activeTab: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'more'
  atsScore?: number | null
  summaryTextLength: number
  experienceCount: number
  skillsCount: number
  hasJobDescription: boolean
  template?: 'atsClassic' | 'twoColumnPro'
}

export interface CoverLetterContext {
  page: 'cover-letter'
  mode?: 'Executive' | 'Friendly' | 'Creative' | 'Academic' | 'Technical'
  rewriteMode?: 'Enhance' | 'Shrink' | 'Executive Tone' | 'Creative Portfolio' | 'Academic Formal'
  hasLetterText: boolean
  hasJobDescription: boolean
  hasPlaceholders: boolean
  placeholders?: string[] // Optional list of found placeholders
}

export interface InterviewCoachContext {
  page: 'interview-coach'
  activeTab: 'writing' | 'voice' | 'hard' | 'simulation'
  // Writing Training state
  canEvaluate?: boolean
  isEvaluating?: boolean
  canSaveNext?: boolean
  // Voice/Hard/Simulation state
  isRecording?: boolean
  isProcessing?: boolean
  canSubmit?: boolean
  canNext?: boolean
}

export type JazPageContext = CvBuilderContext | CoverLetterContext | InterviewCoachContext | null

interface JazAssistantProps {
  // Context is now provided via JazContextProvider
}

export default function JazAssistant({}: JazAssistantProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { hoverEnabled, targetLanguage, setHoverEnabled, setTargetLanguage } = useTranslationSettings()
  const { context } = useJazContext()
  const { isOpen, mode, jobData, openJaz, closeJaz, setMode: setStoreMode, setJobData } = useJazStore()
  
  // Separate message histories for each tab
  const [askMessages, setAskMessages] = useState<JazMessage[]>([])
  const [guideMessages, setGuideMessages] = useState<JazMessage[]>([])
  const [translateMessages, setTranslateMessages] = useState<JazMessage[]>([])
  
  const [guideResults, setGuideResults] = useState<ApplyAssistantResult | null>(null) // Guide-specific results
  
  // Helper function to append message to the correct tab
  const appendMessage = useCallback((tab: 'ask' | 'guide' | 'translate', message: JazMessage) => {
    if (tab === 'ask') {
      setAskMessages((prev) => [...prev, message])
    } else if (tab === 'guide') {
      setGuideMessages((prev) => [...prev, message])
    } else if (tab === 'translate') {
      setTranslateMessages((prev) => [...prev, message])
    }
  }, [])
  
  // Helper function to get messages for current tab
  const getCurrentMessages = useCallback((): JazMessage[] => {
    if (mode === 'ask') return askMessages
    if (mode === 'guide') return guideMessages
    if (mode === 'translate') return translateMessages
    // For 'apply' mode, use guide messages (apply mode uses guide tab)
    return guideMessages
  }, [mode, askMessages, guideMessages, translateMessages])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasShownInitialGreeting = useRef(false)
  const hasTriggeredApplyMode = useRef(false)
  const applyResultsShown = useRef(false)
  const [showWhyStep, setShowWhyStep] = useState<Record<string, boolean>>({})
  const [actionToast, setActionToast] = useState<string | null>(null)
  const [dashboardGuideMode, setDashboardGuideMode] = useState<'welcome' | 'quick-actions' | 'guided-journey'>('welcome')
  const [showWhyWelcome, setShowWhyWelcome] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showWelcomePulse, setShowWelcomePulse] = useState(false)
  const hasShownWelcomePulse = useRef(false)
  
  // Client-side mounting state to prevent hydration errors
  const [mounted, setMounted] = useState(false)
  
  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Trigger welcome pulse on first page load (only on landing page)
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/' && !hasShownWelcomePulse.current && mounted) {
      hasShownWelcomePulse.current = true
      setShowWelcomePulse(true)
      // Remove the class after animation completes (1.2s)
      setTimeout(() => {
        setShowWelcomePulse(false)
      }, 1200)
    }
  }, [pathname, mounted])
  
  // Tooltip state for hover translation hint
  const [showHoverTooltip, setShowHoverTooltip] = useState(false)
  const hoverTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hoverTooltipDismissedRef = useRef<Set<string>>(new Set())
  const prevTranslateModeRef = useRef(false)
  const prevTargetLanguageRef = useRef<string>(targetLanguage || 'EN')
  const hoverCheckboxRef = useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left?: number; right?: number; isRTL: boolean; arrowLeft?: number; arrowRight?: number } | null>(null)

  // Reset dashboard guide mode when navigating away from dashboard
  useEffect(() => {
    if (!pathname.includes('/dashboard')) {
      setDashboardGuideMode('welcome')
      setShowWhyWelcome(false)
    }
  }, [pathname])

  // Initialize dismissed tooltip flags (in-memory only, no localStorage)
  // This will be populated as users dismiss tooltips during the session

  // Show tooltip when Translate tab becomes active OR when Target Language changes
  useEffect(() => {
    const isTranslateMode = mode === 'translate'
    const currentLang = targetLanguage || 'EN'
    const normalizedCurrentLang = normalizeLang(currentLang)
    const normalizedPrevLang = normalizeLang(prevTargetLanguageRef.current)
    const langChanged = normalizedPrevLang !== normalizedCurrentLang
    const justEnteredTranslateMode = !prevTranslateModeRef.current && isTranslateMode

    // Update refs
    const wasTranslateMode = prevTranslateModeRef.current
    prevTranslateModeRef.current = isTranslateMode
    prevTargetLanguageRef.current = currentLang

    // Only show in translate mode when open
    if (!isTranslateMode || !isOpen) {
      setShowHoverTooltip(false)
      if (hoverTooltipTimeoutRef.current) {
        clearTimeout(hoverTooltipTimeoutRef.current)
        hoverTooltipTimeoutRef.current = null
      }
      return
    }

    // Show tooltip when:
    // 1. Translate tab becomes active (just entered translate mode)
    // 2. Target Language changes
    const shouldShow = justEnteredTranslateMode || langChanged

    if (!shouldShow) {
      return
    }

    // Clear any existing timeout
    if (hoverTooltipTimeoutRef.current) {
      clearTimeout(hoverTooltipTimeoutRef.current)
      hoverTooltipTimeoutRef.current = null
    }

    // Show tooltip immediately (no delay for instant update)
    setShowHoverTooltip(true)
    
    // Auto-hide after 6 seconds
    hoverTooltipTimeoutRef.current = setTimeout(() => {
      setShowHoverTooltip(false)
    }, 6000)

    return () => {
      if (hoverTooltipTimeoutRef.current) {
        clearTimeout(hoverTooltipTimeoutRef.current)
        hoverTooltipTimeoutRef.current = null
      }
    }
  }, [mode, isOpen, targetLanguage])

  // Calculate tooltip position when it should be shown
  useEffect(() => {
    if (!showHoverTooltip || !hoverCheckboxRef.current) {
      setTooltipPosition(null)
      return
    }

    const updatePosition = () => {
      if (!hoverCheckboxRef.current) return
      
      const containerRect = hoverCheckboxRef.current.getBoundingClientRect()
      const normalizedLang = normalizeLang(targetLanguage || 'EN')
      // Check RTL via language or dir attribute (for text direction only, not positioning)
      const hasRTLDir = typeof document !== 'undefined' && 
        (document.documentElement.dir === 'rtl' || 
         document.documentElement.getAttribute('dir') === 'rtl' ||
         hoverCheckboxRef.current.closest('[dir="rtl"]') !== null)
      const isRTL = isRTLLanguage(targetLanguage || 'EN') || hasRTLDir
      
      // Always use LTR positioning regardless of language (tooltip position matches LTR)
      const tooltipWidth = 256 // w-64 = 256px
      const tooltipLeft = containerRect.left
      
      // Find the actual checkbox input element to get its precise position
      const checkboxElement = hoverCheckboxRef.current.querySelector('#hover-translation-toggle') as HTMLInputElement
      const checkboxRect = checkboxElement?.getBoundingClientRect()
      
      // Calculate arrow position: left: 24px (always LTR anchor)
      let arrowLeft = 24 // Fixed at 24px from left (always LTR)
      
      setTooltipPosition({
        top: containerRect.bottom + 6, // mt-1.5 equivalent (6px)
        left: tooltipLeft,
        right: undefined,
        isRTL, // Keep for text direction inside tooltip only
        arrowLeft,
        arrowRight: undefined
      })
    }

    updatePosition()
    
    // Update on scroll/resize - use requestAnimationFrame for smooth updates
    let rafId: number | null = null
    const scheduleUpdate = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        updatePosition()
        rafId = null
      })
    }
    
    // Find scroll container (Messages Area) by traversing up from checkbox
    const scrollContainer = hoverCheckboxRef.current?.closest('.overflow-y-auto') || document
    
    scrollContainer.addEventListener('scroll', scheduleUpdate, true)
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true) // Also listen to window scroll as fallback
    
    return () => {
      scrollContainer.removeEventListener('scroll', scheduleUpdate, true)
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [showHoverTooltip, targetLanguage])

  // Clear guideResults when job changes
  useEffect(() => {
    setGuideResults(null)
  }, [jobData?.id])

  // Extract jobId from pathname if on job-details page
  const jobIdFromPath = useMemo(() => {
    if (pathname.startsWith('/job-details/')) {
      const match = pathname.match(/\/job-details\/([^/]+)/)
      return match ? match[1] : undefined
    }
    return undefined
  }, [pathname])

  // Track job state changes for auto-update (only on job-details page)
  const [jobStateVersion, setJobStateVersion] = useState(0)
  
  // Poll job state while JAZ is open on job-details page
  useEffect(() => {
    if (!isOpen || !pathname.startsWith('/job-details') || !jobIdFromPath) {
      return
    }

    let pollInterval: NodeJS.Timeout | null = null
    let lastStateHash: string = ''

    const checkJobState = () => {
      try {
        const jobStorageKey = `jobaz_job_${jobIdFromPath}`
        const jobState = localStorage.getItem(jobStorageKey)
        
        // Also check applied jobs
        const appliedJobs = getAppliedJobs()
        const appliedJob = appliedJobs.find(j => j.id === jobIdFromPath)
        
        // Create a hash of the current state for comparison
        const stateHash = JSON.stringify({
          jobState,
          appliedStatus: appliedJob?.status || 'not-submitted',
        })
        
        // Only update if state actually changed
        if (stateHash !== lastStateHash) {
          lastStateHash = stateHash
          setJobStateVersion(prev => prev + 1)
        }
      } catch (error) {
        console.error('Error checking job state:', error)
      }
    }

    // Initial check
    checkJobState()

    // Poll every 1.5 seconds
    pollInterval = setInterval(checkJobState, 1500)

    // Listen to storage events (fires when localStorage changes in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `jobaz_job_${jobIdFromPath}` || e.key === 'jobaz-applied-jobs') {
        checkJobState()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Custom event listener for same-tab localStorage changes
    // Job Details page can dispatch this event when it updates localStorage
    const handleCustomStorageChange = () => {
      checkJobState()
    }
    window.addEventListener('jobaz-job-state-changed', handleCustomStorageChange)

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('jobaz-job-state-changed', handleCustomStorageChange)
    }
  }, [isOpen, pathname, jobIdFromPath])

  // Action Plan types and helpers
  interface ActionPlanItem {
    id: string
    text: string
    done: boolean
  }

  interface ActionPlan {
    items: ActionPlanItem[]
    updatedAt: string
  }

  // Get or create action plan for a job
  const getActionPlan = useCallback((jobId: string | undefined, guidanceState: {
    isCVTailored: boolean
    hasCoverLetter: boolean
    interviewTrained: boolean
    applicationSubmitted: boolean
  }): ActionPlan | null => {
    if (!jobId || typeof window === 'undefined') return null

    try {
      const storageKey = `jobaz_job_${jobId}_action_plan`
      const stored = localStorage.getItem(storageKey)
      
      if (stored) {
        const parsed = JSON.parse(stored)
        // Update items based on current state
        const updatedItems = parsed.items.map((item: ActionPlanItem) => {
          if (item.id === 'tailor-cv') return { ...item, done: guidanceState.isCVTailored || item.done }
          if (item.id === 'cover-letter') return { ...item, done: guidanceState.hasCoverLetter || item.done }
          if (item.id === 'practice-interview') return { ...item, done: guidanceState.interviewTrained || item.done }
          if (item.id === 'apply') return { ...item, done: guidanceState.applicationSubmitted || item.done }
          return item
        })
        return {
          items: updatedItems,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        }
      }

      // Create default action plan
      const defaultItems: ActionPlanItem[] = [
        { id: 'tailor-cv', text: 'Tailor CV', done: guidanceState.isCVTailored },
        { id: 'cover-letter', text: 'Generate Cover Letter', done: guidanceState.hasCoverLetter },
        { id: 'practice-interview', text: 'Practice Interview', done: guidanceState.interviewTrained },
        { id: 'apply', text: 'Apply', done: guidanceState.applicationSubmitted },
        { id: 'follow-up', text: 'Follow up after 7 days', done: false },
        { id: 'save-job', text: 'Save job link + screenshot', done: false },
      ]

      const plan: ActionPlan = {
        items: defaultItems,
        updatedAt: new Date().toISOString(),
      }

      localStorage.setItem(storageKey, JSON.stringify(plan))
      return plan
    } catch (e) {
      console.error('Error getting action plan:', e)
      return null
    }
  }, [])

  // Update action plan item
  const updateActionPlanItem = useCallback((jobId: string | undefined, itemId: string, done: boolean) => {
    if (!jobId || typeof window === 'undefined') return

    try {
      const storageKey = `jobaz_job_${jobId}_action_plan`
      const stored = localStorage.getItem(storageKey)
      
      if (stored) {
        const parsed = JSON.parse(stored)
        const updatedItems = parsed.items.map((item: ActionPlanItem) =>
          item.id === itemId ? { ...item, done } : item
        )
        const updatedPlan: ActionPlan = {
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem(storageKey, JSON.stringify(updatedPlan))
        // Dispatch event for JAZ to detect state changes
        window.dispatchEvent(new Event('jobaz-job-state-changed'))
      }
    } catch (e) {
      console.error('Error updating action plan:', e)
    }
  }, [])

  // Build guidance state and get next best action
  const nextBestAction = useMemo<NextBestAction | null>(() => {
    if (typeof window === 'undefined') return null

    try {
      // ROUTE GUARD: If on interview-coach, return null immediately
      // Interview Coach has its own guidance system and should never show global guidance
      if (pathname.includes('/interview-coach')) {
        return null
      }

      // Detect page context
      let page: JazGuidanceState['page'] = 'unknown'
      if (pathname.startsWith('/dashboard')) page = 'dashboard'
      else if (pathname.startsWith('/job-details')) page = 'job-details'
      else if (pathname.startsWith('/job-finder')) page = 'job-finder'
      else if (pathname.startsWith('/cv-builder-v2')) page = 'cv-builder'
      else if (pathname.startsWith('/cover')) page = 'cover'
      else if (pathname.startsWith('/interview-coach')) page = 'interview'
      else if (pathname.startsWith('/build-your-path')) page = 'build-your-path'

      // Get jobId (from pathname or jobData)
      const jobId = jobIdFromPath || jobData?.id

      // Get job title and company (from jobData or localStorage)
      let jobTitle: string | undefined = jobData?.title
      let company: string | undefined = jobData?.company

      // Try to get from localStorage if not in jobData
      if (!jobTitle || !company) {
        try {
          const jobInfo = localStorage.getItem('jobaz_job_info')
          if (jobInfo) {
            const parsed = JSON.parse(jobInfo)
            if (!jobTitle && parsed.title) jobTitle = parsed.title
            if (!company && parsed.company) company = parsed.company
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Check if user has base CV using shared helper
      const { hasCv: hasBaseCV } = getBaseCvAnyScope()

      // Check CV tailored status (for job-details page)
      let isCVTailored = false
      if (page === 'job-details' && jobId) {
        try {
          const jobStorageKey = `jobaz_job_${jobId}`
          const jobState = localStorage.getItem(jobStorageKey)
          if (jobState) {
            const parsed = JSON.parse(jobState)
            isCVTailored = parsed.statuses?.cv === 'ready' || !!parsed.cvSummary
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Check cover letter status (for job-details page)
      let hasCoverLetter = false
      if (page === 'job-details' && jobId) {
        try {
          const jobStorageKey = `jobaz_job_${jobId}`
          const jobState = localStorage.getItem(jobStorageKey)
          if (jobState) {
            const parsed = JSON.parse(jobState)
            hasCoverLetter = parsed.statuses?.cover === 'ready' || !!parsed.coverLetterText
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Check interview trained status (for job-details page)
      // First check the new dedicated localStorage key
      let interviewTrained = false
      if (page === 'job-details' && jobId) {
        try {
          // Check new dedicated key: jobaz_job_${jobId}_interview_trained
          const interviewTrainedFlag = localStorage.getItem(`jobaz_job_${jobId}_interview_trained`)
          if (interviewTrainedFlag === 'true') {
            interviewTrained = true
          } else {
            // Fallback to old job state storage for backward compatibility
            const jobStorageKey = `jobaz_job_${jobId}`
            const jobState = localStorage.getItem(jobStorageKey)
            if (jobState) {
              const parsed = JSON.parse(jobState)
              interviewTrained = parsed.statuses?.training === 'available'
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Check application submitted status
      let applicationSubmitted = false
      if (jobId) {
        try {
          const appliedJobs = getAppliedJobs()
          const appliedJob = appliedJobs.find(j => j.id === jobId)
          applicationSubmitted = appliedJob?.status === 'submitted' || false
        } catch (e) {
          // Ignore errors
        }
      }

      const guidanceState: JazGuidanceState = {
        page,
        jobId,
        jobTitle,
        company,
        hasBaseCV,
        isCVTailored,
        hasCoverLetter,
        interviewTrained,
        applicationSubmitted,
      }

      return getNextBestAction(guidanceState)
    } catch (error) {
      console.error('Error computing guidance state:', error)
      return null
    }
  }, [pathname, jobIdFromPath, jobData, jobStateVersion]) // Include jobStateVersion to trigger re-computation

  // Get fit score data from Apply Assistant cache (if available)
  const fitScoreData = useMemo(() => {
    if (typeof window === 'undefined' || !pathname.startsWith('/job-details')) return null
    
    const jobId = jobIdFromPath || jobData?.id
    if (!jobId) return null

    try {
      // Try to get cached Apply Assistant result
      const cacheKey = `jobaz_apply_assistant_${jobId}_${targetLanguage || 'EN'}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.fitScore && typeof parsed.fitScore.score === 'number') {
          return {
            score: parsed.fitScore.score,
            weaknesses: parsed.fitScore.weaknesses || [],
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return null
  }, [pathname, jobIdFromPath, jobData, targetLanguage, jobStateVersion]) // Include jobStateVersion to refresh when job state changes

  // Convert weaknesses to positive "Top fixes" phrasing
  const getTopFixes = (weaknesses: string[]): string[] => {
    if (!weaknesses || weaknesses.length === 0) return []
    
    return weaknesses.slice(0, 3).map(weakness => {
      // Convert negative phrasing to positive actionable phrasing
      let fix = weakness.toLowerCase()
      
      // Common transformations
      fix = fix.replace(/no experience|lack of experience|missing experience/gi, 'Add 1–2 examples of')
      fix = fix.replace(/no skills|missing skills|lack of skills/gi, 'Highlight')
      fix = fix.replace(/not mentioned|not included|missing/gi, 'Include')
      fix = fix.replace(/weak|poor|insufficient/gi, 'Strengthen')
      fix = fix.replace(/doesn't|don't|does not|do not/gi, 'Ensure it')
      fix = fix.replace(/should|need to|must/gi, 'Consider')
      
      // Ensure it starts with an action verb
      if (!/^(add|highlight|include|strengthen|ensure|consider|tailor|improve|expand|showcase)/i.test(fix)) {
        fix = 'Add ' + fix
      }
      
      // Capitalize first letter
      return fix.charAt(0).toUpperCase() + fix.slice(1)
    })
  }

  // Get action plan for current job (only on job-details page)
  const actionPlan = useMemo<ActionPlan | null>(() => {
    if (typeof window === 'undefined' || pathname !== '/job-details') return null
    
    const jobId = jobIdFromPath || jobData?.id
    if (!jobId) return null

    try {
      // Rebuild guidance state to get current readiness
      let isCVTailored = false
      let hasCoverLetter = false
      let interviewTrained = false
      let applicationSubmitted = false

      // Check CV tailored
      const jobStorageKey = `jobaz_job_${jobId}`
      const jobState = localStorage.getItem(jobStorageKey)
      if (jobState) {
        const parsed = JSON.parse(jobState)
        isCVTailored = parsed.statuses?.cv === 'ready' || !!parsed.cvSummary
        hasCoverLetter = parsed.statuses?.cover === 'ready' || !!parsed.coverLetterText
      }

      // Check interview trained
      const interviewTrainedFlag = localStorage.getItem(`jobaz_job_${jobId}_interview_trained`)
      interviewTrained = interviewTrainedFlag === 'true'

      // Check application submitted
      const appliedJobs = getAppliedJobs()
      const appliedJob = appliedJobs.find(j => j.id === jobId)
      applicationSubmitted = appliedJob?.status === 'submitted' || false

      return getActionPlan(jobId, {
        isCVTailored,
        hasCoverLetter,
        interviewTrained,
        applicationSubmitted,
      })
    } catch (error) {
      console.error('Error getting action plan:', error)
      return null
    }
  }, [pathname, jobIdFromPath, jobData, jobStateVersion, getActionPlan])

  // Handle CTA button click for next best action
  const handleNextBestActionClick = () => {
    if (!nextBestAction) return

    const action = nextBestAction.action

    switch (action) {
      case 'CREATE_CV':
        router.push('/cv-builder-v2')
        break

      case 'TAILOR_CV':
        if (pathname.startsWith('/job-details')) {
          // Use a small delay to ensure page is loaded, then scroll and highlight
          setTimeout(() => {
            const success = scrollAndHighlight('jobaz-tailor-summary-btn')
            if (!success) {
              // Fallback: scroll to top where CV section usually is
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }, 100)
        } else {
          router.push('/cv-builder-v2')
        }
        break

      case 'GENERATE_COVER':
        if (pathname.startsWith('/job-details')) {
          // Use a small delay to ensure page is loaded, then scroll and highlight
          setTimeout(() => {
            const success = scrollAndHighlight('jobaz-generate-cover-btn')
            if (!success) {
              // Fallback: navigate to cover page
              if (jobIdFromPath || jobData?.id) {
                const jobId = jobIdFromPath || jobData?.id
                if (jobId) {
                  const returnTo = `/job-details/${jobId}`
                  const params = new URLSearchParams()
                  params.set('mode', 'tailorCv')
                  params.set('jobId', jobId)
                  params.set('returnTo', returnTo)
                  if (jobData?.title) params.set('title', jobData.title)
                  if (jobData?.company) params.set('company', jobData.company)
                  router.push(`/cover?${params.toString()}`)
                }
              } else {
                router.push('/cover')
              }
            }
          }, 100)
        } else {
          // Not on job-details page, navigate to cover page
          if (jobIdFromPath || jobData?.id) {
            const jobId = jobIdFromPath || jobData?.id
            if (jobId) {
              const returnTo = `/job-details/${jobId}`
              const params = new URLSearchParams()
              params.set('mode', 'tailorCv')
              params.set('jobId', jobId)
              params.set('returnTo', returnTo)
              if (jobData?.title) params.set('title', jobData.title)
              if (jobData?.company) params.set('company', jobData.company)
              router.push(`/cover?${params.toString()}`)
            }
          } else {
            router.push('/cover')
          }
        }
        break

      case 'TRAIN_INTERVIEW':
        // Set interview trained flag when user clicks Train Interview from JAZ
        const trainJobId = jobIdFromPath || jobData?.id
        if (trainJobId && typeof window !== 'undefined') {
          localStorage.setItem(`jobaz_job_${trainJobId}_interview_trained`, 'true')
          window.dispatchEvent(new Event('jobaz-job-state-changed'))
        }

        if (pathname.startsWith('/job-details')) {
          // Use a small delay to ensure page is loaded, then scroll and highlight
          setTimeout(() => {
            const success = scrollAndHighlight('jobaz-train-interview-btn')
            if (!success) {
              // Fallback: navigate to interview coach
              if (trainJobId) {
                const params = new URLSearchParams({ jobId: trainJobId })
                if (jobData?.title) params.set('title', jobData.title)
                if (jobData?.company) params.set('company', jobData.company)
                router.push(`/interview-coach?${params.toString()}`)
              } else {
                router.push('/interview-coach')
              }
            }
          }, 100)
        } else {
          // Not on job-details page, navigate to interview coach
          if (trainJobId) {
            const params = new URLSearchParams({ jobId: trainJobId })
            if (jobData?.title) params.set('title', jobData.title)
            if (jobData?.company) params.set('company', jobData.company)
            router.push(`/interview-coach?${params.toString()}`)
          } else {
            router.push('/interview-coach')
          }
        }
        break

      case 'READY_TO_APPLY':
        // Check if application is already submitted
        const checkJobId = jobIdFromPath || jobData?.id
        if (checkJobId) {
          try {
            const appliedJobs = getAppliedJobs()
            const appliedJob = appliedJobs.find(j => j.id === checkJobId)
            if (appliedJob?.status === 'submitted') {
              // Application already submitted, navigate to dashboard
              router.push('/dashboard')
              return
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        if (pathname.startsWith('/job-details')) {
          // Use a small delay to ensure page is loaded, then scroll and highlight
          setTimeout(() => {
            const success = scrollAndHighlight('jobaz-apply-btn')
            if (!success) {
              // Fallback: scroll to bottom where apply button usually is
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
            }
          }, 100)
        } else {
          // Not on job-details page, navigate to job-finder
          router.push('/job-finder')
        }
        break

      case 'FIND_JOBS':
        router.push('/job-finder')
        break
    }
  }

  // Scroll to bottom when messages change for current tab
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [askMessages, guideMessages, translateMessages, mode])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Set initial greeting based on page when chat opens (only in Ask tab)
  useEffect(() => {
    if (isOpen && !hasShownInitialGreeting.current && askMessages.length === 0) {
      let initialGreeting = ''
      
      if (pathname.startsWith('/dashboard')) {
        initialGreeting = "I've reviewed your CV and the jobs on this page.\n\nWant help improving your chances?"
      } else if (pathname.startsWith('/cv-builder-v2')) {
        initialGreeting = "Hi, I'm JAZ. This is your CV Builder. I can help you with your summary, experience, and skills."
      } else if (pathname.startsWith('/cover')) {
        initialGreeting = "Hi, I'm JAZ. This is your Cover Letter Builder. I can help you write and improve your cover letter."
      } else if (pathname.startsWith('/job-details')) {
        initialGreeting = "Hi, I'm JAZ. I'll help you understand this job and prepare step by step."
      } else if (pathname.startsWith('/interview-coach')) {
        initialGreeting = "Hi, I'm JAZ. I can help you understand questions, practice answers, and improve your interview skills."
      } else {
        initialGreeting = "Hi, I'm JAZ. I'm here to help with your job search. Ask me anything about CVs, cover letters, jobs, or interviews."
      }

      const greetingMessage: JazMessage = {
        id: `assistant-greeting-${Date.now()}`,
        role: 'assistant',
        content: initialGreeting,
        timestamp: new Date(),
      }

      appendMessage('ask', greetingMessage)
      hasShownInitialGreeting.current = true
    }
  }, [isOpen, pathname, askMessages.length, appendMessage])

  // Reset greeting flag when chat closes
  useEffect(() => {
    if (!isOpen) {
      hasShownInitialGreeting.current = false
      hasTriggeredApplyMode.current = false
      applyResultsShown.current = false
    }
  }, [isOpen])

  // Get hint message based on current page
  const getHintMessage = useCallback(() => {
    if (pathname.startsWith('/cv-builder-v2')) {
      return "I can help you to improve your CV, rewrite sections, and translate content."
    } else if (pathname.startsWith('/cover')) {
      return "I can help you to generate, rewrite, and translate your cover letter."
    } else if (pathname.startsWith('/job-finder')) {
      return "I can help you to translate job listings and explain requirements."
    } else if (pathname.startsWith('/job-details')) {
      return "I can help you to understand this job, translate it, and guide your next steps."
    } else if (pathname.startsWith('/interview-coach')) {
      return "I can help you to improve your answers, understand feedback, and translate tips."
    } else if (pathname.startsWith('/dashboard')) {
      return "I can help you to understand the platform and guide your job application journey."
    }
    return null
  }, [pathname])

  // Show hint bubble on page load (only once per page, only if chat is closed)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Reset hint state when pathname changes
    setShowHint(false)
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }
    
    const hintKey = `jaz_hint_seen_${pathname}`
    const hasSeenHint = sessionStorage.getItem(hintKey) === 'true'
    
    // Only show if:
    // 1. Chat is closed
    // 2. User hasn't seen hint for this page
    // 3. There's a message for this page
    if (!isOpen && !hasSeenHint && getHintMessage()) {
      setShowHint(true)
      
      // Auto-hide after 5 seconds
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false)
        sessionStorage.setItem(hintKey, 'true')
      }, 5000)
    }
    
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
        hintTimeoutRef.current = null
      }
    }
  }, [pathname, isOpen, getHintMessage])

  // Hide hint when JAZ opens
  useEffect(() => {
    if (isOpen && showHint) {
      setShowHint(false)
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
        hintTimeoutRef.current = null
      }
    }
  }, [isOpen, showHint])

  // Handle hint close button
  const handleCloseHint = useCallback(() => {
    setShowHint(false)
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
      hintTimeoutRef.current = null
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`jaz_hint_seen_${pathname}`, 'true')
    }
  }, [pathname])

  // Sync local state with store
  useEffect(() => {
    if (isOpen && mode === 'apply' && !hasTriggeredApplyMode.current && jobData) {
      hasTriggeredApplyMode.current = true
      // Switch to guide mode before triggering apply assistant
      setStoreMode('guide')
      triggerApplyMode()
    }
  }, [isOpen, mode, jobData])

  const handleToggleChat = () => {
    if (isOpen) {
      closeJaz()
    } else {
      openJaz()
    }
  }

  const handleModeChange = (newMode: JazMode) => {
    if (newMode === 'apply') {
      // Apply mode can only be triggered from Job Details page
      return
    }
    setStoreMode(newMode)
    hasTriggeredApplyMode.current = false
    // Clear guideResults when switching away from guide mode
    if (newMode !== 'guide') {
      setGuideResults(null)
    }
  }

  const triggerApplyMode = async () => {
    if (!jobData) return

    const requestId = generateRequestId('jaz-apply-assistant')
    const { startLoading, stopLoading } = useNextStepLoadingStore.getState()

    // Clear previous guide messages and guide results
    setGuideMessages([])
    setGuideResults(null)
    setIsLoading(true)
    applyResultsShown.current = false
    setLoadingStage('Analyzing job post…')
    startLoading(requestId)

    try {
      // Fetch user's CV from localStorage using shared helper
      let cvData = null
      try {
        const { hasCv, cv } = getBaseCvAnyScope()
        if (hasCv && cv) {
          cvData = {
            summary: cv.summary || '',
            experience: cv.experience || [],
            skills: cv.skills || [],
          }
        }
      } catch (error) {
        console.error('Error loading CV:', error)
      }

      if (!cvData || !cvData.summary) {
        const errorMessage: JazMessage = {
          id: `apply-error-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ **No CV found**\n\nPlease create a CV first using the CV Builder before using the Apply Assistant.',
          timestamp: new Date(),
        }
        appendMessage('guide', errorMessage)
        setIsLoading(false)
        setLoadingStage(null)
        stopLoading(requestId)
        return
      }

      // Step 2: Show "Comparing with your CV..."
      await new Promise(resolve => setTimeout(resolve, 800))
      setLoadingStage('Comparing with your CV…')

      // Call apply assistant API
      const response = await fetch('/api/apply-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            requirements: jobData.requirements || '',
          },
          cv: cvData,
          language: targetLanguage,
        }),
      })

      const result: ApplyAssistantResult = await response.json()

      // Consider success if we got content, even if response.ok is false
      if (!response.ok && (!result || !result.fitScore || result.fitScore.score === 0)) {
        throw new Error('Failed to analyze application')
      }

      // Show staged loading messages
      await new Promise(resolve => setTimeout(resolve, 600))
      setLoadingStage('Generating Fit Score…')

      await new Promise(resolve => setTimeout(resolve, 500))
      setLoadingStage('Preparing improved summary…')

      await new Promise(resolve => setTimeout(resolve, 500))
      setLoadingStage('Generating tailored cover letter…')

      await new Promise(resolve => setTimeout(resolve, 400))
      setLoadingStage(null)

      // Store results in guide-specific state (not in messages)
      setGuideResults(result)
      // Ensure we're in guide mode
      setStoreMode('guide')
      applyResultsShown.current = true

    } catch (error) {
      console.error('Apply mode error:', error)
      // Only show error if we didn't get any result
      if (!guideResults) {
        const errorMessage: JazMessage = {
          id: `apply-error-${Date.now()}`,
          role: 'assistant',
          content: '❌ **Error**\n\nSorry, there was an error processing your application analysis. Please try again.',
          timestamp: new Date(),
        }
        appendMessage('guide', errorMessage)
      }
    } finally {
      setIsLoading(false)
      setLoadingStage(null)
      stopLoading(requestId)
    }
  }

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could show a toast here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Track language state locally to prevent jitter
  const [localLanguage, setLocalLanguage] = useState<JazLanguage>(targetLanguage || 'EN')
  
  // Sync local language with context language
  useEffect(() => {
    if (targetLanguage && targetLanguage !== localLanguage) {
      setLocalLanguage(targetLanguage)
    }
  }, [targetLanguage])
  
  const handleLanguageChange = (newLanguage: JazLanguage) => {
    // Update local state immediately for UI responsiveness
    setLocalLanguage(newLanguage)
    // Update context language (debounced internally by the context)
    if (targetLanguage !== newLanguage) {
      setTargetLanguage(newLanguage)
    }
  }

  // Dismiss hover tooltip
  const dismissHoverTooltip = useCallback(() => {
    setShowHoverTooltip(false)
    if (hoverTooltipTimeoutRef.current) {
      clearTimeout(hoverTooltipTimeoutRef.current)
      hoverTooltipTimeoutRef.current = null
    }
    
    // Mark as dismissed for current language (all variations) - in-memory only
    const lang = targetLanguage || 'EN'
    const normalizedLang = normalizeLang(lang)
    const langKeys = [lang, normalizedLang.toUpperCase(), normalizedLang]
    
    langKeys.forEach(key => {
      hoverTooltipDismissedRef.current.add(key)
    })
  }, [targetLanguage])

  // Get tooltip text based on language
  // Uses appropriate script: Arabic script for AR/FA/KU-Sorani, Latin for EN/ES/PL
  const getTooltipText = useCallback((lang: string) => {
    const normalized = normalizeLang(lang)
    
    const texts: Record<'en' | 'ar' | 'fa' | 'ku' | 'es' | 'pl', { title: string; message: string }> = {
      'en': {
        title: '💡 Quick tip',
        message: 'Enable this to translate text by hovering over it.'
      },
      'ar': {
        title: '💡 نصيحة سريعة',
        message: 'فعّل هذا الخيار لترجمة أي نص بمجرد المرور عليه بالماوس.'
      },
      'fa': {
        title: '💡 نکته سریع',
        message: 'این گزینه را فعال کنید تا هر متنی را با قرار دادن ماوس روی آن ترجمه کنید.'
      },
      'ku': {
        title: '💡 تیپێکی خێرا',
        message: 'ئەم هەڵبژاردەیە چالاک بکە بۆ وەرگێڕانی هەر دەقێک بە بەکارهێنانی ماوس.'
      },
      'es': {
        title: '💡 Consejo rápido',
        message: 'Activa esto para traducir texto al pasar el cursor sobre él.'
      },
      'pl': {
        title: '💡 Szybka wskazówka',
        message: 'Włącz to, aby tłumaczyć tekst po najechaniu kursorem.'
      }
    }
    
    // Safe fallback to English if mapping fails
    return texts[normalized] || texts['en']
  }, [])

  // Safe button triggering helper
  const triggerButton = (actionId: string): boolean => {
    try {
      const button = document.querySelector(`[data-jaz-action="${actionId}"]`) as HTMLButtonElement
      if (button && !button.disabled) {
        button.click()
        return true
      }
      return false
    } catch (error) {
      console.error(`Error triggering button ${actionId}:`, error)
      return false
    }
  }

  // Pulse highlight helper with enhanced neon glow
  const pulseHighlight = (selector: string, duration: number = 3000) => {
    try {
      const element = document.querySelector(selector)
      if (element) {
        element.classList.add('jaz-pulse-highlight')
        setTimeout(() => {
          element.classList.remove('jaz-pulse-highlight')
        }, duration)
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return true
      }
      return false
    } catch (error) {
      console.error(`Error highlighting element ${selector}:`, error)
      return false
    }
  }

  // Switch CV Builder tab and highlight element
  const switchCvTabAndHighlight = (tab: 'summary' | 'experience' | 'education' | 'skills', selector?: string, duration: number = 3000) => {
    try {
      // Check if tab is already active
      const isTabAlreadyActive = context?.page === 'cv-builder' && (context as CvBuilderContext).activeTab === tab

      // Dispatch custom event to switch tab (will be no-op if already active)
      const event = new CustomEvent('jaz-switch-cv-tab', {
        detail: { tab }
      })
      window.dispatchEvent(event)

      // Wait a bit for tab to switch (or immediately if already active), then highlight
      const delay = isTabAlreadyActive ? 50 : 150
      setTimeout(() => {
        if (selector) {
          pulseHighlight(selector, duration)
        } else {
          // Default: highlight the first input/textarea in the tab, or the tab button
          const tabContent = document.querySelector(`[data-cv-tab="${tab}"]`)
          if (tabContent) {
            const firstInput = tabContent.querySelector('input, textarea, button[data-jaz-action]') as HTMLElement
            if (firstInput) {
              firstInput.classList.add('jaz-pulse-highlight')
              setTimeout(() => {
                firstInput.classList.remove('jaz-pulse-highlight')
              }, duration)
              firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        }
      }, delay)
      return true
    } catch (error) {
      console.error(`Error switching CV tab to ${tab}:`, error)
      return false
    }
  }

  // Run action helper: finds element by data-jaz-action, highlights, scrolls, and clicks
  const runAction = (actionId: string): void => {
    try {
      const el = document.querySelector(`[data-jaz-action="${actionId}"]`) as HTMLElement | null
      
      if (el) {
        // Scroll into view smoothly first
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add temporary pulse highlight class (700ms as specified)
        el.classList.add('jaz-pulse-highlight')
        setTimeout(() => {
          el.classList.remove('jaz-pulse-highlight')
        }, 700)
        
        // Small delay before clicking to ensure scroll starts
        setTimeout(() => {
          if (el instanceof HTMLButtonElement && !el.disabled) {
            el.click()
          } else if (el instanceof HTMLElement) {
            // Try to trigger click on any element
            el.click()
          }
        }, 300)
      } else {
        // Special handling for Cover Letter page: if Generate action is not found,
        // navigate to Letter Body tab and focus the textarea
        if (pathname.startsWith('/cover') && (actionId === 'cover_generate_keywords' || actionId === 'cover_generate_from_jd')) {
          // Find the "Letter Body" tab button
          const tabButtons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
          const letterBodyTab = tabButtons.find(btn => btn.textContent?.trim() === 'Letter Body')
          
          if (letterBodyTab) {
            // Click the tab to switch to Letter Body
            letterBodyTab.click()
            
            // Wait for React to update the DOM, then scroll and focus the textarea
            setTimeout(() => {
              const textarea = document.querySelector('textarea[placeholder*="cover letter" i]') as HTMLTextAreaElement
              if (textarea) {
                // Scroll smoothly to the textarea
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
                
                // Focus the textarea after a small delay to ensure it's visible
                setTimeout(() => {
                  textarea.focus()
                }, 100)
              }
            }, 100)
          } else {
            // Fallback: show warning if tab not found
            setActionToast('This action isn\'t available on this screen yet.')
            setTimeout(() => setActionToast(null), 3000)
          }
        } else {
          // Show toast if action not found (for non-cover-letter pages or other actions)
          setActionToast('This action isn\'t available on this screen yet.')
          setTimeout(() => setActionToast(null), 3000)
        }
      }
    } catch (error) {
      console.error(`Error running action ${actionId}:`, error)
      setActionToast('This action isn\'t available on this screen yet.')
      setTimeout(() => setActionToast(null), 3000)
    }
  }

  const handleSendMessage = async () => {
    if (isLoading) return

    // Special handling for Translate mode: require non-empty input
    if (mode === 'translate') {
      if (!inputValue.trim()) {
        setTranslateError('Please paste the text you want me to translate.')
        setTimeout(() => setTranslateError(null), 4000)
        return
      }
    } else {
      // For Ask and Guide modes, allow empty (they have defaults)
      if (!inputValue.trim()) return
    }

    // Determine which tab to append messages to
    // In apply mode, after results are shown, allow follow-up questions - use 'ask' mode
    const effectiveMode = mode === 'apply' && applyResultsShown.current ? 'ask' : mode
    const targetTab: 'ask' | 'guide' | 'translate' = effectiveMode === 'translate' ? 'translate' : effectiveMode === 'guide' || effectiveMode === 'apply' ? 'guide' : 'ask'

    const userMessage: JazMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    appendMessage(targetTab, userMessage)
    setInputValue('')
    setTranslateError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/jaz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: userMessage.content,
          mode: effectiveMode,
          language: targetLanguage,
          pathname,
        }),
      })

      const data = await response.json()

      const assistantMessage: JazMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.assistantMessage || 'Response received',
        timestamp: new Date(),
      }

      appendMessage(targetTab, assistantMessage)
    } catch (error) {
      const errorMessage: JazMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      }
      appendMessage(targetTab, errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = '40px'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 96)}px`
    }
  }, [inputValue])

  // Get CV Builder guidance
  const getCvBuilderGuidance = (ctx: CvBuilderContext): NextBestAction | null => {
    // Priority 1: Summary too long
    if (ctx.activeTab === 'summary' && ctx.summaryTextLength > 120) {
      return {
        action: 'TAILOR_CV' as any, // Using existing action type
        title: 'Shorten your summary',
        message: `ATS performs better with 60–100 words. Yours is currently ${ctx.summaryTextLength} words.`,
        ctaLabel: 'Make Shorter',
        secondaryCtaLabel: ctx.summaryTextLength > 150 ? 'More Impact' : undefined,
      }
    }

    // Priority 2: Summary too short (but not empty)
    if (ctx.activeTab === 'summary' && ctx.summaryTextLength < 40 && ctx.summaryTextLength > 0) {
      return {
        action: 'TAILOR_CV' as any,
        title: 'Add a little more',
        message: 'A summary of 60–100 words helps ATS systems understand your profile better.',
        ctaLabel: 'Make Longer',
      }
    }

    // Priority 3: Summary empty
    if (ctx.activeTab === 'summary' && ctx.summaryTextLength === 0) {
      return {
        action: 'TAILOR_CV' as any,
        title: 'Generate a summary',
        message: 'A professional summary is essential for ATS systems and recruiters.',
        ctaLabel: 'Generate from Keywords',
      }
    }

    // Priority 4: Has job description - tailor CV
    if (ctx.hasJobDescription) {
      return {
        action: 'TAILOR_CV' as any,
        title: 'Tailor your CV to this job',
        message: 'Use the job description to optimize your CV for this specific role.',
        ctaLabel: 'Analyze JD',
        secondaryCtaLabel: 'Tailor Experience',
      }
    }

    // Priority 5: Skills count low
    if (ctx.skillsCount < 8) {
      return {
        action: 'TAILOR_CV' as any,
        title: 'Add key skills',
        message: 'Having 8+ relevant skills improves your ATS score and visibility.',
        ctaLabel: 'Suggest Skills',
      }
    }

    // Priority 6: Experience count low
    if (ctx.experienceCount < 2) {
      return {
        action: 'TAILOR_CV' as any,
        title: 'Add another experience',
        message: 'Adding at least 2 roles improves ATS and credibility.',
        ctaLabel: 'Add Experience',
      }
    }

    // All good
    return {
      action: 'FIND_JOBS' as any,
      title: "You're doing great",
      message: 'Your CV is ready. Download or search jobs.',
      ctaLabel: 'Find Jobs',
    }
  }

  // Get Cover Letter guidance
  const getCoverLetterGuidance = (ctx: CoverLetterContext): NextBestAction | null => {
    // Priority 1: No letter text but has job description
    if (!ctx.hasLetterText && ctx.hasJobDescription) {
      return {
        action: 'GENERATE_COVER' as any,
        title: 'Generate from job description',
        message: 'Use the job description to create a tailored cover letter.',
        ctaLabel: 'Generate from job description',
      }
    }

    // Priority 2: No letter text and no job description
    if (!ctx.hasLetterText && !ctx.hasJobDescription) {
      return {
        action: 'GENERATE_COVER' as any,
        title: 'Start your cover letter',
        message: 'Enter keywords or paste a job description to generate your cover letter.',
        ctaLabel: 'Generate',
      }
    }

    // Priority 3: Has letter text but has placeholders
    if (ctx.hasLetterText && ctx.hasPlaceholders) {
      return {
        action: 'GENERATE_COVER' as any,
        title: 'Replace placeholders',
        message: 'Your letter contains placeholders like [Company]. Replace them before applying.',
        ctaLabel: 'Show placeholders',
      }
    }

    // Priority 4: Has letter text - improve it
    if (ctx.hasLetterText) {
      return {
        action: 'GENERATE_COVER' as any,
        title: 'Improve your letter',
        message: 'Enhance your cover letter to make it more impactful and professional.',
        ctaLabel: 'Rewrite',
        secondaryCtaLabel: 'Compare 3 AI Versions',
      }
    }

    // All good
    return {
      action: 'FIND_JOBS' as any,
      title: "You're ready",
      message: 'Your cover letter looks good. You can download it or continue to job search.',
      ctaLabel: 'Find Jobs',
    }
  }

  // Detect Interview Coach state from DOM
  const [interviewCoachState, setInterviewCoachState] = useState<InterviewCoachContext | null>(null)

  // Update Interview Coach state when pathname changes or periodically
  useEffect(() => {
    if (!pathname.startsWith('/interview-coach')) {
      setInterviewCoachState(null)
      return
    }

    const detectState = () => {
      // Detect active tab by checking which tab button has active styling
      let activeTab: 'writing' | 'voice' | 'hard' | 'simulation' = 'writing'
      const writingTab = document.querySelector('[data-jaz-action="ic_tab_writing"]')
      const voiceTab = document.querySelector('[data-jaz-action="ic_tab_voice"]')
      const hardTab = document.querySelector('[data-jaz-action="ic_tab_hard"]')
      const simTab = document.querySelector('[data-jaz-action="ic_tab_simulation"]')
      
      if (voiceTab && (voiceTab.classList.contains('text-purple-400') || voiceTab.classList.contains('border-purple-400'))) {
        activeTab = 'voice'
      } else if (hardTab && (hardTab.classList.contains('text-purple-400') || hardTab.classList.contains('border-purple-400'))) {
        activeTab = 'hard'
      } else if (simTab && (simTab.classList.contains('text-purple-400') || simTab.classList.contains('border-purple-400'))) {
        activeTab = 'simulation'
      }

      const state: InterviewCoachContext = {
        page: 'interview-coach',
        activeTab,
      }

      // Detect Writing Training state
      if (activeTab === 'writing') {
        const evaluateBtn = document.querySelector('[data-jaz-action="ic_writing_evaluate"]') as HTMLButtonElement
        const saveNextBtn = document.querySelector('[data-jaz-action="ic_writing_save_next"]') as HTMLButtonElement
        
        state.canEvaluate = !!evaluateBtn && !evaluateBtn.disabled
        state.isEvaluating = evaluateBtn?.textContent?.includes('Evaluating') || false
        state.canSaveNext = !!saveNextBtn && !saveNextBtn.disabled
      }

      // Detect Voice Training state
      if (activeTab === 'voice') {
        const recordBtn = document.querySelector('[data-jaz-action="ic_voice_record"]') as HTMLButtonElement
        const stopBtn = document.querySelector('[data-jaz-action="ic_voice_stop"]') as HTMLButtonElement
        const submitBtn = document.querySelector('[data-jaz-action="ic_voice_submit"]') as HTMLButtonElement
        const nextBtn = document.querySelector('[data-jaz-action="ic_voice_next"]') as HTMLButtonElement
        
        state.isRecording = !!stopBtn && stopBtn.offsetParent !== null // Check if visible
        state.canSubmit = !!submitBtn && !submitBtn.disabled && submitBtn.offsetParent !== null
        state.canNext = !!nextBtn && nextBtn.offsetParent !== null
      }

      // Detect Hard Mode state
      if (activeTab === 'hard') {
        const recordBtn = document.querySelector('[data-jaz-action="ic_hard_record"]') as HTMLButtonElement
        const stopBtn = document.querySelector('[data-jaz-action="ic_hard_stop"]') as HTMLButtonElement
        const submitBtn = document.querySelector('[data-jaz-action="ic_hard_submit"]') as HTMLButtonElement
        const nextBtn = document.querySelector('[data-jaz-action="ic_hard_next"]') as HTMLButtonElement
        
        state.isRecording = !!stopBtn && stopBtn.offsetParent !== null
        state.canSubmit = !!submitBtn && !submitBtn.disabled && submitBtn.offsetParent !== null
        state.canNext = !!nextBtn && nextBtn.offsetParent !== null
      }

      // Detect Interview Simulation state
      if (activeTab === 'simulation') {
        const startBtn = document.querySelector('[data-jaz-action="ic_sim_start"]') as HTMLButtonElement
        const stopBtn = document.querySelector('[data-jaz-action="ic_sim_stop"]') as HTMLButtonElement
        
        state.canNext = !!startBtn && startBtn.offsetParent !== null // Start button visible means we can start
        state.isRecording = !!stopBtn && stopBtn.offsetParent !== null
      }

      setInterviewCoachState(state)
    }

    // Initial detection with small delay to ensure DOM is ready
    const timeout = setTimeout(detectState, 100)

    // Poll for changes every 500ms while on interview-coach page
    const interval = setInterval(detectState, 500)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [pathname])

  // Get Interview Coach guidance
  const getInterviewCoachGuidance = (ctx: InterviewCoachContext): NextBestAction | null => {
    if (ctx.activeTab === 'writing') {
      // If Save&Next is disabled but Evaluate exists and is enabled
      if (!ctx.canSaveNext && ctx.canEvaluate && !ctx.isEvaluating) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Evaluate your answer',
          message: 'Evaluate your written answer to get feedback and unlock Save & Next.',
          ctaLabel: 'Evaluate',
        }
      }
      // If evaluation finished and Save&Next enabled
      if (ctx.canSaveNext) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Save & Next',
          message: 'Save your answer and move to the next question.',
          ctaLabel: 'Save & Next',
        }
      }
    }

    if (ctx.activeTab === 'voice') {
      if (!ctx.isRecording && !ctx.canSubmit && !ctx.canNext) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Record your answer',
          message: 'Start recording your voice answer to the question.',
          ctaLabel: 'Start Recording',
        }
      }
      if (ctx.isRecording) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Stop recording',
          message: 'Stop recording when you\'ve finished your answer.',
          ctaLabel: 'Stop Recording',
        }
      }
      if (ctx.canSubmit) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Submit your answer',
          message: 'Submit your recorded answer for evaluation.',
          ctaLabel: 'Submit Answer',
        }
      }
      if (ctx.canNext) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Next question',
          message: 'Move to the next question in Voice Training.',
          ctaLabel: 'Next Question',
        }
      }
    }

    if (ctx.activeTab === 'hard') {
      if (!ctx.isRecording && !ctx.canSubmit && !ctx.canNext) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Start recording',
          message: 'Start recording your answer from memory.',
          ctaLabel: 'Start Answer',
        }
      }
      if (ctx.isRecording) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Stop recording',
          message: 'Stop recording when you\'ve finished your answer.',
          ctaLabel: 'Stop Recording',
        }
      }
      if (ctx.canSubmit) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Submit your answer',
          message: 'Submit your Hard Mode answer for evaluation.',
          ctaLabel: 'Submit Answer',
        }
      }
      if (ctx.canNext) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Next question',
          message: 'Move to the next Hard Mode question.',
          ctaLabel: 'Next Hard Question',
        }
      }
    }

    if (ctx.activeTab === 'simulation') {
      if (ctx.canNext && !ctx.isRecording) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Start simulation',
          message: 'Begin the full interview simulation.',
          ctaLabel: 'Start Interview',
        }
      }
      if (ctx.isRecording) {
        return {
          action: 'TRAIN_INTERVIEW' as any,
          title: 'Next step: Stop recording',
          message: 'Stop recording when you\'ve finished your answer.',
          ctaLabel: 'Stop Recording',
        }
      }
    }

    return null
  }

  // Get page-specific guidance
  const pageGuidance = useMemo<NextBestAction | null>(() => {
    if (context) {
      if (context.page === 'cv-builder') {
        return getCvBuilderGuidance(context)
      }

      if (context.page === 'cover-letter') {
        return getCoverLetterGuidance(context)
      }
    }

    // Check Interview Coach state
    if (interviewCoachState) {
      return getInterviewCoachGuidance(interviewCoachState)
    }

    return null
  }, [context, interviewCoachState])

  // Handle page-specific CTA clicks
  const handlePageGuidanceClick = (guidance: NextBestAction & { secondaryCtaLabel?: string }, isSecondary = false) => {
    // Handle Interview Coach actions
    if (interviewCoachState) {
      if (guidance.title === 'Next step: Evaluate your answer') {
        runAction('ic_writing_evaluate')
      } else if (guidance.title === 'Next step: Save & Next') {
        runAction('ic_writing_save_next')
      } else if (guidance.title === 'Next step: Record your answer' || guidance.title === 'Next step: Start recording') {
        if (interviewCoachState.activeTab === 'voice') {
          runAction('ic_voice_record')
        } else if (interviewCoachState.activeTab === 'hard') {
          runAction('ic_hard_record')
        }
      } else if (guidance.title === 'Next step: Stop recording') {
        if (interviewCoachState.activeTab === 'voice') {
          runAction('ic_voice_stop')
        } else if (interviewCoachState.activeTab === 'hard') {
          runAction('ic_hard_stop')
        } else if (interviewCoachState.activeTab === 'simulation') {
          runAction('ic_sim_stop')
        }
      } else if (guidance.title === 'Next step: Submit your answer') {
        if (interviewCoachState.activeTab === 'voice') {
          runAction('ic_voice_submit')
        } else if (interviewCoachState.activeTab === 'hard') {
          runAction('ic_hard_submit')
        }
      } else if (guidance.title === 'Next step: Next question') {
        if (interviewCoachState.activeTab === 'voice') {
          runAction('ic_voice_next')
        } else if (interviewCoachState.activeTab === 'hard') {
          runAction('ic_hard_next')
        }
      } else if (guidance.title === 'Next step: Start simulation') {
        runAction('ic_sim_start')
      }
      return
    }

    if (!context) return

    if (context.page === 'cv-builder') {
      const ctx = context as CvBuilderContext
      
      if (guidance.title === 'Shorten your summary') {
        // Switch to summary tab and highlight the textarea or button
        switchCvTabAndHighlight('summary', 'textarea[placeholder*="summary" i], textarea[placeholder*="professional" i]', 3000)
        setTimeout(() => {
          if (isSecondary && guidance.secondaryCtaLabel === 'More Impact') {
            runAction('cv_more_impact')
          } else {
            runAction('cv_make_shorter')
          }
        }, 200)
      } else if (guidance.title === 'Add a little more') {
        // Switch to summary tab and highlight the textarea
        switchCvTabAndHighlight('summary', 'textarea[placeholder*="summary" i], textarea[placeholder*="professional" i]', 3000)
        setTimeout(() => {
          runAction('cv_make_longer')
        }, 200)
      } else if (guidance.title === 'Generate a summary') {
        // Switch to summary tab and highlight the generate button
        switchCvTabAndHighlight('summary', '[data-jaz-action="cv_generate_from_keywords"]', 3000)
        setTimeout(() => {
          runAction('cv_generate_from_keywords')
        }, 200)
      } else if (guidance.title === 'Tailor your CV to this job') {
        // This doesn't require tab switching, but we can highlight the JD panel
        if (isSecondary && guidance.secondaryCtaLabel === 'Tailor Experience') {
          switchCvTabAndHighlight('experience', undefined, 3000)
          setTimeout(() => {
            runAction('cv_tailor_experience')
          }, 200)
        } else {
          runAction('cv_analyze_jd')
        }
      } else if (guidance.title === 'Add key skills') {
        // Switch to skills tab and highlight the AI suggest button or input
        switchCvTabAndHighlight('skills', '[data-jaz-action="cv_suggest_skills"], input[placeholder*="skill" i]', 3000)
        setTimeout(() => {
          runAction('cv_suggest_skills')
        }, 200)
      } else if (guidance.title === 'Add another experience') {
        // Switch to experience tab and highlight the add button
        switchCvTabAndHighlight('experience', '[data-jaz-action="cv_add_experience"]', 3000)
        setTimeout(() => {
          const addButton = document.querySelector('[data-jaz-action="cv_add_experience"]') as HTMLElement
          if (addButton) {
            addButton.click()
          }
        }, 200)
      } else if (guidance.title === "You're doing great") {
        runAction('cv_find_jobs')
      }
    } else if (context.page === 'cover-letter') {
      const ctx = context as CoverLetterContext
      
      if (guidance.title === 'Generate from job description') {
        runAction('cover_generate_from_jd')
      } else if (guidance.title === 'Start your cover letter') {
        // Check if keywords exist
        const keywordsInput = document.querySelector('textarea[placeholder*="keywords" i]') as HTMLTextAreaElement
        if (keywordsInput && keywordsInput.value.trim()) {
          // Keywords exist, trigger generate
          runAction('cover_generate_keywords')
        } else {
          // No keywords, scroll/focus keywords input and show tip
          if (keywordsInput) {
            keywordsInput.focus()
            pulseHighlight('textarea[placeholder*="keywords" i]', 1500)
            setActionToast('Add keywords to generate your cover letter')
            setTimeout(() => setActionToast(null), 3000)
          } else {
            runAction('cover_generate_keywords')
          }
        }
      } else if (guidance.title === 'Replace placeholders') {
        // Show placeholders in a checklist (we'll implement this in the card)
        // For now, just highlight the letter textarea
        const letterTextarea = document.querySelector('textarea[placeholder*="cover letter" i]') as HTMLTextAreaElement
        if (letterTextarea) {
          letterTextarea.focus()
          pulseHighlight('textarea[placeholder*="cover letter" i]', 1500)
        }
      } else if (guidance.title === 'Improve your letter') {
        if (isSecondary && guidance.secondaryCtaLabel === 'Compare 3 AI Versions') {
          runAction('cover_compare_3')
        } else {
          runAction('cover_rewrite')
        }
      } else if (guidance.title === "You're ready") {
        router.push('/job-finder')
      }
    }
  }

  // Get dashboard state for guide cards
  const getDashboardState = useMemo(() => {
    if (typeof window === 'undefined' || !pathname.includes('/dashboard')) return null

    try {
      // Check if user has base CV using shared helper
      const { hasCv: hasBaseCV, cv } = getBaseCvAnyScope()
      const cvId = cv?.id || null

      // Check for saved jobs
      const JOB_STORAGE_PREFIX = 'jobaz_job_'
      const savedJobs: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(JOB_STORAGE_PREFIX) && !key.includes('_interview_trained') && !key.includes('_action_plan')) {
          const jobId = key.replace(JOB_STORAGE_PREFIX, '')
          const storedValue = localStorage.getItem(key)
          if (storedValue) {
            try {
              const data = JSON.parse(storedValue)
              savedJobs.push({ id: jobId, ...data })
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      // Check for applied jobs
      const appliedJobs = getAppliedJobs()

      // Get latest applied job
      const latestAppliedJob = appliedJobs.length > 0 
        ? appliedJobs.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return bTime - aTime
          })[0]
        : null

      // Get CVs key and read from localStorage
      const userId = getCurrentUserIdSync()
      const cvsKey = userId ? getUserScopedKeySync('cvs', userId) : 'jobaz-cvs'
      const rawCvs: string | null = typeof window !== 'undefined' ? localStorage.getItem(cvsKey) : null

      // Calculate CV score if CV exists
      let cvScore: number | null = null
      if (hasBaseCV && rawCvs) {
        try {
          const cvs = JSON.parse(rawCvs)
          if (Array.isArray(cvs) && cvs.length > 0) {
            const latestCv = cvs.reduce((latest, current) => {
              const latestTime = latest?.savedAt ? new Date(latest.savedAt).getTime() : 0
              const currentTime = current?.savedAt ? new Date(current.savedAt).getTime() : 0
              return currentTime > latestTime ? current : latest
            }, cvs[cvs.length - 1])
            
            // Simple score calculation (matching dashboard logic)
            let score = 0
            if (latestCv.personalInfo?.fullName) score += 15
            if (latestCv.personalInfo?.email) score += 10
            if (latestCv.personalInfo?.phone) score += 10
            if (latestCv.summary) {
              const wordCount = latestCv.summary.trim().split(/\s+/).filter((w: string) => w.length > 0).length
              if (wordCount >= 60 && wordCount <= 120) score += 10
            }
            if ((latestCv.experience || []).length >= 2) score += 15
            if ((latestCv.skills || []).length >= 10) score += 10
            if ((latestCv.education || []).length > 0) score += 10
            cvScore = Math.max(0, Math.min(100, score))
          }
        } catch (e) {
          // Ignore
        }
      }

      // Check if there's a selected job (from URL state or localStorage)
      const selectedJobId = jobData?.id || jobIdFromPath

      return {
        hasBaseCV,
        cvId,
        savedJobs,
        appliedJobs,
        latestAppliedJob,
        cvScore,
        selectedJobId,
      }
    } catch (e) {
      return null
    }
  }, [pathname, jobData, jobIdFromPath, jobStateVersion])

  // Render Dashboard Guide Cards (only on dashboard)
  const renderDashboardGuideCards = () => {
    if (mode !== 'guide' || !pathname.includes('/dashboard')) return null
    if (!getDashboardState) return null

    const { hasBaseCV, cvId, savedJobs, appliedJobs, latestAppliedJob, cvScore, selectedJobId } = getDashboardState

    // Determine next step in guided journey
    const getNextStep = () => {
      if (!hasBaseCV) {
        return {
          step: 1,
          title: 'Create your CV',
          message: 'Start by building your base CV. This is your foundation for all job applications.',
          ctaLabel: 'Create CV',
          route: '/cv-builder-v2',
        }
      }
      if (selectedJobId) {
        return {
          step: 3,
          title: 'Open Job Details',
          message: 'Continue working on this job application.',
          ctaLabel: 'Open Job Details',
          route: `/job-details/${selectedJobId}`,
        }
      }
      if (savedJobs.length === 0 && appliedJobs.length === 0) {
        return {
          step: 2,
          title: 'Find Jobs',
          message: 'Search for jobs that match your skills and experience.',
          ctaLabel: 'Find Jobs',
          route: '/job-finder',
        }
      }
      if (appliedJobs.length > 0 && latestAppliedJob) {
        return {
          step: 5,
          title: 'Start Interview Training',
          message: `Prepare for interviews for ${latestAppliedJob.title || 'your latest application'}.`,
          ctaLabel: 'Start Interview Training',
          route: `/interview-coach?jobId=${latestAppliedJob.id}&title=${encodeURIComponent(latestAppliedJob.title || '')}&company=${encodeURIComponent(latestAppliedJob.company || '')}`,
        }
      }
      if (cvScore !== null && cvScore < 70) {
        return {
          step: 1,
          title: 'Improve CV Score',
          message: `Your CV score is ${cvScore}/100. Improve it to increase your chances.`,
          ctaLabel: 'Improve CV',
          route: cvId ? `/cv-builder-v2?cvId=${cvId}` : '/cv-builder-v2',
        }
      }
      return {
        step: 2,
        title: 'Find Jobs',
        message: 'Search for jobs that match your skills and experience.',
        ctaLabel: 'Find Jobs',
        route: '/job-finder',
      }
    }

    const nextStep = getNextStep()

    return (
      <div className="space-y-3">
        {/* A) Welcome / Overview Card */}
        {dashboardGuideMode === 'welcome' && (
          <div className="bg-gradient-to-br from-violet-900/30 to-slate-800/50 border-2 border-violet-500/70 rounded-lg p-4 shadow-lg shadow-violet-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-semibold text-violet-300">Welcome to JobAZ</h4>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              You can use each tool separately, or follow the full job application journey.
            </p>
            <div className="space-y-2 mb-2">
              <button
                onClick={() => {
                  setDashboardGuideMode('guided-journey')
                }}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
              >
                <Target className="w-4 h-4" />
                Start Guided Journey
              </button>
              <button
                onClick={() => {
                  setDashboardGuideMode('quick-actions')
                }}
                className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Show Quick Actions
              </button>
            </div>
            <button
              onClick={() => setShowWhyWelcome(!showWhyWelcome)}
              className="w-full text-xs text-slate-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-1"
            >
              <span>Why this step?</span>
              {showWhyWelcome ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showWhyWelcome && (
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Following a structured journey helps you complete all steps and increases your chances of success. Quick actions let you jump to any tool when needed.
                </p>
              </div>
            )}
          </div>
        )}

        {/* B) Quick Actions Card */}
        {dashboardGuideMode === 'quick-actions' && (
          <div className="bg-gradient-to-br from-violet-900/30 to-slate-800/50 border-2 border-violet-500/70 rounded-lg p-4 shadow-lg shadow-violet-900/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-semibold text-violet-300">Quick Actions</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => router.push('/cv-builder-v2')}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Create/Edit CV
              </button>
              <button
                onClick={() => router.push('/cover')}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Write Cover Letter
              </button>
              <button
                onClick={() => router.push('/job-finder')}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Find Jobs
              </button>
              <button
                onClick={() => router.push('/interview-coach')}
                className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Interview Coach
              </button>
            </div>
            <button
              onClick={() => {
                setDashboardGuideMode('welcome')
              }}
              className="w-full text-xs text-slate-400 hover:text-violet-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* C) Guided Journey Card */}
        {dashboardGuideMode === 'guided-journey' && (
          <div className="bg-gradient-to-br from-violet-900/30 to-slate-800/50 border-2 border-violet-500/70 rounded-lg p-4 shadow-lg shadow-violet-900/30">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-semibold text-violet-300">Guided Journey</h4>
            </div>
            
            {/* 5-step checklist */}
            <div className="space-y-2 mb-4">
              {/* Step 1: Build base CV */}
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  hasBaseCV ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {hasBaseCV ? '✓' : '1'}
                </div>
                <div className="flex-1">
                  <div className={`text-xs ${hasBaseCV ? 'text-slate-300 line-through' : 'text-slate-200'}`}>
                    Build base CV
                  </div>
                </div>
              </div>

              {/* Step 2: Find a job */}
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  (savedJobs.length > 0 || appliedJobs.length > 0) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {(savedJobs.length > 0 || appliedJobs.length > 0) ? '✓' : '2'}
                </div>
                <div className="flex-1">
                  <div className={`text-xs ${(savedJobs.length > 0 || appliedJobs.length > 0) ? 'text-slate-300 line-through' : 'text-slate-200'}`}>
                    Find a job
                  </div>
                </div>
              </div>

              {/* Step 3: Tailor CV */}
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-slate-700/50 text-slate-400">
                  3
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-200">Tailor CV for that job</div>
                </div>
              </div>

              {/* Step 4: Generate cover letter */}
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-slate-700/50 text-slate-400">
                  4
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-200">Generate cover letter</div>
                </div>
              </div>

              {/* Step 5: Train interview */}
              <div className="flex items-start gap-2">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  appliedJobs.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {appliedJobs.length > 0 ? '✓' : '5'}
                </div>
                <div className="flex-1">
                  <div className={`text-xs ${appliedJobs.length > 0 ? 'text-slate-300 line-through' : 'text-slate-200'}`}>
                    Train interview
                  </div>
                </div>
              </div>
            </div>

            {/* Loading card - appears above Recommended next step */}
            <NextStepLoadingCard />
            
            {/* Next Step */}
            <div className="mb-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <div className="text-xs font-semibold text-violet-300 mb-1">Recommended next step</div>
              <div className="text-sm font-bold text-white mb-1">{nextStep.title}</div>
              <div className="text-xs text-slate-300 mb-3">{nextStep.message}</div>
              <button
                onClick={() => router.push(nextStep.route)}
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
              >
                <Sparkles className="w-4 h-4" />
                {nextStep.ctaLabel}
              </button>
            </div>

            <button
              onClick={() => {
                setDashboardGuideMode('welcome')
              }}
              className="w-full text-xs text-slate-400 hover:text-violet-300 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    )
  }

  // Determine recommended next action based on guideResults analysis
  const getRecommendedAction = useCallback((): { action: 'cv' | 'cover' | 'interview' | null; reason: string } => {
    if (!guideResults || mode !== 'guide') {
      return { action: null, reason: '' }
    }

    const { comparison, fitScore } = guideResults

    // Priority 1: Missing skills or low match score -> Improve CV Summary
    if (comparison.missingSkills && comparison.missingSkills.length > 0) {
      return {
        action: 'cv',
        reason: `Missing key skills mentioned in the job description: ${comparison.missingSkills.slice(0, 2).join(', ')}${comparison.missingSkills.length > 2 ? '...' : ''}`
      }
    }

    // Priority 2: Low fit score -> Improve CV Summary
    if (fitScore && fitScore.score < 50) {
      const topWeakness = fitScore.weaknesses && fitScore.weaknesses.length > 0 
        ? fitScore.weaknesses[0] 
        : 'Low match score with job requirements'
      return {
        action: 'cv',
        reason: topWeakness.length > 80 ? topWeakness.substring(0, 80) + '...' : topWeakness
      }
    }

    // Priority 3: Weak summary (if we can detect it from weaknesses)
    if (fitScore && fitScore.weaknesses && fitScore.weaknesses.some(w => 
      w.toLowerCase().includes('summary') || 
      w.toLowerCase().includes('cv') || 
      w.toLowerCase().includes('resume')
    )) {
      return {
        action: 'cv',
        reason: 'CV summary needs improvement to better match job requirements'
      }
    }

    // Priority 4: Cover letter issues (if detected)
    if (fitScore && fitScore.weaknesses && fitScore.weaknesses.some(w => 
      w.toLowerCase().includes('cover') || 
      w.toLowerCase().includes('letter')
    )) {
      return {
        action: 'cover',
        reason: 'Cover letter could be improved to better highlight your fit'
      }
    }

    // Default: If no specific issues, suggest CV improvement as general best practice
    if (fitScore && fitScore.score < 75) {
      return {
        action: 'cv',
        reason: 'Improving your CV summary can increase your match score'
      }
    }

    return { action: null, reason: '' }
  }, [guideResults, mode])

  // Render Recommended Next Action block (at top of Guide tab)
  const renderRecommendedActionBlock = () => {
    // Only show when in guide mode, have guideResults, and have job context
    if (mode !== 'guide' || !guideResults || !jobData) return null

    const recommended = getRecommendedAction()
    if (!recommended.action) return null

    const actionLabels = {
      cv: 'Improve CV Summary',
      cover: 'Improve Cover Letter',
      interview: 'Start Interview Training'
    }

    return (
      <div className="mb-4 bg-gradient-to-br from-violet-900/20 to-slate-800/30 border border-violet-500/40 rounded-lg p-3.5">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-violet-300 mb-1">Recommended next action</div>
            <div className="text-sm font-medium text-white mb-1">{actionLabels[recommended.action]}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{recommended.reason}</div>
          </div>
        </div>
      </div>
    )
  }

  // Get Build Your Path guide content based on route
  const getBuildYourPathGuideContent = useCallback((currentPathname: string): { title: string; content: string } => {
    // Check if we're on a detail page (has a pathId)
    const isDetailPage = /\/build-your-path\/[^/]+/.test(currentPathname)
    
    if (isDetailPage) {
      // Guide for individual path detail pages
      return {
        title: 'Build Your Path - Career Guide',
        content: `Welcome to Build Your Path! This page helps you explore a specific career path.

📋 What you'll find here:
• Detailed information about this career
• Requirements and qualifications needed
• Recommended courses and training
• Reality check with challenges and common mistakes

🎓 Recommended Courses & Training:
• Each course card shows official training options
• Click "Find near you" to search for courses on GOV.UK
• Some courses have direct links to official providers (colleges, professional bodies)
• Location input helps you find courses in your area

🚀 Prepare with JobAZ:
Use the sidebar actions to:
• Create a CV tailored to this career path
• Practice interviews for this role
• Write a cover letter
• Find related jobs

💡 Tips:
• Read the "Reality Check" section to understand challenges
• Check course funding options - many are free or funded
• Start with short courses before committing to longer qualifications`
      }
    } else {
      // Guide for main Build Your Path list page
      return {
        title: 'Build Your Path - Explore Careers',
        content: `Welcome to Build Your Path! This section helps you discover career paths that don't require a university degree.

🎯 How to use this page:
1. Browse the career paths below
2. Click on any path that interests you
3. Learn about requirements, courses, and what the job really involves
4. Use the tools to prepare for that career

📚 What each path includes:
• Who it's for and what the job really is
• Whether you need a degree (most don't!)
• What you actually need (courses, certificates, licenses)
• Reality check with honest challenges
• Recommended courses with official links
• JobAZ tools to help you prepare

🔍 Finding Courses:
• All courses link to official UK sources (GOV.UK, colleges, professional bodies)
• Use "Find near you" to search for courses in your area
• Many courses are free or funded via Adult Skills Fund

💼 Next Steps:
Once you choose a path, you can:
• Create a CV for that career
• Find related jobs
• Practice interviews
• Write cover letters

Start exploring to find the right path for you!`
      }
    }
  }, [])

  // Render Next Best Action Card (helper for guide mode)
  const renderNextBestActionCard = () => {
    if (mode !== 'guide') return null

    // DASHBOARD: Show dashboard-specific guide cards
    if (pathname.includes('/dashboard')) {
      return renderDashboardGuideCards()
    }

    // BUILD YOUR PATH: Return null to show guide content instead
    if (pathname.startsWith('/build-your-path')) {
      return null
    }

    // ROUTE GUARD: If on interview-coach, only show Interview Coach specific guidance
    // Never show global guidance (like FIND_JOBS) on interview-coach
    let guidance: NextBestAction | null = null
    if (pathname.includes('/interview-coach')) {
      // Only show Interview Coach guidance, never fall back to global guidance
      if (!pageGuidance) return null
      guidance = pageGuidance
      // Ensure we never show FIND_JOBS or other global actions on interview-coach
      if (guidance.action === 'FIND_JOBS' || 
          guidance.title?.includes('Find Jobs') || 
          guidance.title?.includes('Want job matches') ||
          guidance.ctaLabel?.includes('Find Jobs')) {
        return null
      }
    } else {
      // For other pages, use page-specific guidance if available, otherwise fall back to nextBestAction
      guidance = pageGuidance || nextBestAction
      if (!guidance) return null
    }

    // Get explanation for why this step
    const getWhyExplanation = (action: string, title: string): string => {
      // Page-specific explanations
      if (title.includes('summary')) {
        return 'A well-crafted summary is the first thing recruiters see. It should be concise, impactful, and ATS-friendly.'
      }
      if (title.includes('Tailor')) {
        return 'Tailoring your CV to match job requirements significantly increases your chances of getting noticed by ATS systems and recruiters.'
      }
      if (title.includes('skills')) {
        return 'Relevant skills are crucial for passing ATS filters. Include both technical and soft skills.'
      }
      if (title.includes('experience')) {
        return 'Multiple relevant experiences demonstrate your expertise and career progression.'
      }
      if (title.includes('placeholders')) {
        return 'Placeholders make your cover letter look unprofessional. Always personalize it for each application.'
      }
      if (title.includes('Improve')) {
        return 'A polished cover letter shows attention to detail and professionalism, making you stand out from other candidates.'
      }
      
      // Default explanations
      switch (action) {
        case 'TAILOR_CV':
          return 'This improves your chances for similar roles.'
        case 'GENERATE_COVER':
          return 'Recruiters expect this for most applications.'
        case 'TRAIN_INTERVIEW':
          return 'Practice answers before applying.'
        case 'READY_TO_APPLY':
          return 'You\'ve completed all preparation steps. Submitting your application now means you\'re putting your best foot forward with tailored documents.'
        default:
          return 'This is the most important next action to move forward with your job application.'
      }
    }

    // Get top fixes if score < 50 (only for job-details page)
    const topFixes = fitScoreData && fitScoreData.score < 50 && !context
      ? getTopFixes(fitScoreData.weaknesses)
      : []

    const actionKey = guidance.action
    const isExpanded = showWhyStep[actionKey] || false

    // Check if this is a placeholder detection card
    const isPlaceholderCard = context?.page === 'cover-letter' && 
      (context as CoverLetterContext).hasPlaceholders &&
      guidance.title === 'Replace placeholders'

    // Extract placeholders from letter text if needed
    const extractPlaceholders = (text: string): string[] => {
      const patterns = [
        /\[([^\]]+)\]/g,  // [Company], [Your Name]
        /\{([^}]+)\}/g,   // {Company}, {Your Name}
        /\(([^)]+)\)/g,   // (Company), (Your Name) - less common but possible
      ]
      const placeholders: string[] = []
      patterns.forEach(pattern => {
        const matches = text.matchAll(pattern)
        for (const match of matches) {
          if (match[1] && !placeholders.includes(match[1])) {
            placeholders.push(match[1])
          }
        }
      })
      return placeholders
    }

    // Get placeholders from context if available
    const placeholders = context?.page === 'cover-letter' && (context as CoverLetterContext).placeholders
      ? (context as CoverLetterContext).placeholders!
      : []

    return (
      <div className="space-y-2 mb-2">
        <div className="bg-gradient-to-br from-violet-900/30 to-slate-800/50 border-2 border-violet-500/70 rounded-lg p-4 shadow-lg shadow-violet-900/30">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm font-semibold text-violet-300">Recommended next step</h4>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white mb-2">{guidance.title}</h3>

          {/* Description */}
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">{guidance.message}</p>

          {/* Placeholder checklist */}
          {isPlaceholderCard && placeholders.length > 0 && (
            <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-xs font-semibold text-amber-400 mb-2">Found placeholders:</p>
              <ul className="space-y-1">
                {placeholders.map((ph, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>[{ph}]</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Match Score (if available and < 50) - only for job-details */}
          {fitScoreData && fitScoreData.score < 50 && !context && (
            <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-amber-400">{fitScoreData.score}</span>
                <span className="text-xs text-amber-300/80">Match Score</span>
              </div>
              
              {/* Top fixes */}
              {topFixes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1.5">Top fixes:</p>
                  <ul className="space-y-1">
                    {topFixes.map((fix, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-2 mb-2">
            <button
              onClick={() => {
                if (pageGuidance) {
                  handlePageGuidanceClick(guidance as NextBestAction & { secondaryCtaLabel?: string }, false)
                } else {
                  handleNextBestActionClick()
                }
              }}
              className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
            >
              <Sparkles className="w-4 h-4" />
              {guidance.ctaLabel}
            </button>
            {/* Secondary CTA (if available) */}
            {(guidance as any).secondaryCtaLabel && (
              <button
                onClick={() => {
                  if (pageGuidance) {
                    handlePageGuidanceClick(guidance as NextBestAction & { secondaryCtaLabel?: string }, true)
                  }
                }}
                className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {(guidance as any).secondaryCtaLabel}
              </button>
            )}
          </div>

          {/* Why this step? Expandable */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowWhyStep(prev => ({ ...prev, [actionKey]: !prev[actionKey] }))
            }}
            className="w-full text-xs text-slate-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-1"
          >
            <span>Why this step?</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Expanded explanation */}
          {isExpanded && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <p className="text-xs text-slate-300 leading-relaxed">
                {getWhyExplanation(guidance.action, guidance.title)}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render Apply Assistant Cards
  const renderApplyAssistantCards = (data: ApplyAssistantResult) => {
    const { jobAnalysis, comparison, fitScore, improvedSummary, coverLetter, actionPlan } = data

    // Helper to get fit score interpretation
    const getFitScoreInterpretation = (score: number): string => {
      if (score >= 75) return 'Strong fit'
      if (score >= 50) return 'Moderate fit'
      return 'Weak fit'
    }

    // Helper to parse action plan into checklist items
    const parseActionPlan = (text: string): string[] => {
      if (!text) return []
      
      // Split by common patterns: numbered lists, dashes, bullets
      const lines = text
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
      
      // Extract items that look like checklist items
      const items: string[] = []
      for (const line of lines) {
        // Match numbered lists (1., 2., etc.) or dash/bullet lists (-, •, etc.)
        const match = line.match(/^(?:\d+[\.\)]?\s*|[-•●]\s*)(.+)$/)
        if (match) {
          items.push(match[1].trim())
        } else if (line.length > 10) {
          // If it's a substantial line without a marker, include it
          items.push(line)
        }
      }
      
      return items.length > 0 ? items : [text] // Fallback to original if no items parsed
    }

    const actionPlanItems = parseActionPlan(actionPlan)

    return (
      <div className="space-y-3">
        {/* (A) Job Analysis Card */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
            🔍 Job Analysis
          </div>
          <div className="space-y-3 text-xs text-slate-200">
            {jobAnalysis.responsibilities && jobAnalysis.responsibilities.length > 0 && (
              <div>
                <div className="font-medium text-slate-300 mb-1.5">Key responsibilities:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-200 ml-1">
                  {jobAnalysis.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {jobAnalysis.requiredSkills && jobAnalysis.requiredSkills.length > 0 && (
              <div>
                <div className="font-medium text-slate-300 mb-1.5">Required skills:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-200 ml-1">
                  {jobAnalysis.requiredSkills.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {jobAnalysis.keywords && jobAnalysis.keywords.length > 0 && (
              <div>
                <div className="font-medium text-slate-300 mb-1.5">Important keywords:</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {jobAnalysis.keywords.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded text-slate-200 text-xs">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {jobAnalysis.seniorityLevel && (
              <div>
                <div className="font-medium text-slate-300 mb-1.5">Experience level needed:</div>
                <div className="text-slate-200 capitalize ml-1">{jobAnalysis.seniorityLevel}</div>
              </div>
            )}
          </div>
        </div>

        {/* (B) CV Comparison Card */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
            📊 CV Match vs Job Requirements
          </div>
          <div className="space-y-3 text-xs text-slate-200">
            {comparison.matchingSkills && comparison.matchingSkills.length > 0 && (
              <div>
                <div className="font-medium text-green-400 mb-1.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Matched skills:
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {comparison.matchingSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-900/30 border border-green-700/50 rounded text-green-300 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {comparison.missingSkills && comparison.missingSkills.length > 0 && (
              <div>
                <div className="font-medium text-amber-400 mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Missing skills:
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {comparison.missingSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-900/30 border border-amber-700/50 rounded text-amber-300 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {comparison.strengths && comparison.strengths.length > 0 && (
              <div>
                <div className="font-medium text-slate-300 mb-1.5">Strengths:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-200 ml-1">
                  {comparison.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {comparison.risks && comparison.risks.length > 0 && (
              <div>
                <div className="font-medium text-slate-300 mb-1.5">Gaps:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-200 ml-1">
                  {comparison.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* (C) Fit Score Card */}
        <div className="bg-gradient-to-br from-violet-900/30 to-slate-800 border border-violet-700/50 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
            💯 Fit Score
          </div>
          <div className="text-4xl font-bold text-white mb-2">{fitScore.score}/100</div>
          <div className="text-sm font-medium text-slate-300 mb-3">{getFitScoreInterpretation(fitScore.score)}</div>
          <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-2">
            <div
              className="bg-gradient-to-r from-violet-500 to-violet-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, fitScore.score))}%` }}
            />
          </div>
        </div>

        {/* (D) Improved Summary Card */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
            📝 Improved CV Summary
          </div>
          <div className="text-xs text-slate-100 whitespace-pre-wrap mb-3 bg-slate-900/50 rounded p-3 border border-slate-700/30 leading-relaxed">
            {improvedSummary}
          </div>
          <button
            onClick={() => handleCopyToClipboard(improvedSummary, 'summary')}
            className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy to Summary
          </button>
        </div>

        {/* (E) Tailored Cover Letter Card */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
            📨 Tailored Cover Letter
          </div>
          <div className="text-xs text-slate-100 whitespace-pre-wrap mb-3 max-h-64 overflow-y-auto bg-slate-900/50 rounded p-3 border border-slate-700/30 leading-relaxed">
            {coverLetter.split('\n\n').map((para, i) => (
              <p key={i} className={i > 0 ? 'mt-3' : ''}>{para}</p>
            ))}
          </div>
          <button
            onClick={() => handleCopyToClipboard(coverLetter, 'cover')}
            className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Cover Letter
          </button>
        </div>

        {/* (F) Action Plan Card */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4">
          <div className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
            🚀 Action Plan
          </div>
          <div className="space-y-2">
            {actionPlanItems.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-200">
                {actionPlanItems.slice(0, 6).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span className="flex-1 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-slate-100 whitespace-pre-wrap bg-slate-900/50 rounded p-3 border border-slate-700/30 leading-relaxed">
                {actionPlan}
              </div>
            )}
          </div>
          
          {/* Low score warning with top 3 fixes */}
          {fitScore.score < 50 && fitScore.weaknesses && fitScore.weaknesses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                How to improve your chances:
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {fitScore.weaknesses.slice(0, 3).map((weakness, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">→</span>
                    <span className="flex-1">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* (G) Quick Actions Footer */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          <div className="grid grid-cols-1 gap-2">
            {(() => {
              const recommended = getRecommendedAction()
              const primaryAction = recommended.action
              
              // Smart navigation handler for CV Builder
              const handleNavigateToCV = () => {
                router.push('/cv-builder-v2')
                // Auto-scroll to summary section after navigation
                setTimeout(() => {
                  // Try to find and scroll to summary textarea
                  const summaryTextarea = document.querySelector('textarea[placeholder*="summary" i], textarea[placeholder*="Professional summary" i]')
                  if (summaryTextarea) {
                    summaryTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    // Focus the textarea
                    setTimeout(() => {
                      (summaryTextarea as HTMLTextAreaElement)?.focus()
                    }, 300)
                  } else {
                    // Fallback: scroll to top of page
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }, 500)
              }

              // Smart navigation handler for Cover Letter Builder
              const handleNavigateToCover = () => {
                router.push('/cover')
                // Auto-scroll to cover letter textarea after navigation
                setTimeout(() => {
                  const coverTextarea = document.querySelector('textarea[placeholder*="cover letter" i], textarea[placeholder*="Write or paste" i]')
                  if (coverTextarea) {
                    coverTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    setTimeout(() => {
                      (coverTextarea as HTMLTextAreaElement)?.focus()
                    }, 300)
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }, 500)
              }

              // Smart navigation handler for Interview Coach
              const handleNavigateToInterview = () => {
                if (jobData) {
                  const query = new URLSearchParams({
                    jobId: jobData.id || '',
                    title: jobData.title || '',
                    company: jobData.company || '',
                  }).toString()
                  router.push(`/interview-coach?${query}`)
                } else {
                  router.push('/interview-coach')
                }
                // Auto-scroll to writing section after navigation
                setTimeout(() => {
                  const writingSection = document.querySelector('[data-tab="writing"], button[aria-label*="Writing" i]')
                  if (writingSection) {
                    writingSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }, 500)
              }

              return (
                <>
                  <button
                    onClick={handleNavigateToCV}
                    className={`px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      primaryAction === 'cv'
                        ? 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-900/30 border border-violet-500/50'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Go to CV Builder
                  </button>
                  <button
                    onClick={handleNavigateToCover}
                    className={`px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      primaryAction === 'cover'
                        ? 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-900/30 border border-violet-500/50'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Go to Cover Letter Builder
                  </button>
                  <button
                    onClick={handleNavigateToInterview}
                    className={`px-3 py-2 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                      primaryAction === 'interview'
                        ? 'bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-900/30 border border-violet-500/50'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    Train Interview for This Job
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    )
  }

  // Orb portal content
  const orbContent = (
    <div className="fixed bottom-4 right-4 z-40" data-no-translate>
      {/* Hint Bubble */}
      {showHint && !isOpen && getHintMessage() && (
        <div 
          className="absolute bottom-0 right-20 mb-0 w-64 md:w-72 max-w-[calc(100vw-6rem)] bg-slate-900/85 backdrop-blur-md rounded-2xl shadow-2xl border border-violet-500/20 p-4 pointer-events-auto animate-in fade-in slide-in-from-right-2 duration-300"
          style={{ 
            pointerEvents: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.15), 0 0 30px rgba(124, 58, 237, 0.1)'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-100 leading-relaxed mb-2">
                {getHintMessage()}
              </p>
              <p className="text-xs text-slate-400/80 leading-relaxed">
                I can help you to translate any text on this page.
              </p>
            </div>
            <button
              onClick={handleCloseHint}
              aria-label="Close hint"
              className="w-5 h-5 rounded-full hover:bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
              style={{ pointerEvents: 'auto' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Arrow pointing to JAZ button */}
          <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 hidden md:block">
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-slate-900/85"></div>
          </div>
        </div>
      )}

      {/* Floating Orb Button with Label */}
      <div className="flex flex-col items-center gap-2">
        {/* Label */}
        <div className="jaz-label-container relative">
          <span className="jaz-label-text">Ask JAZ</span>
          {/* Subtle sparkles animation */}
          <div className="jaz-label-sparkles">
            <span className="jaz-sparkle jaz-sparkle-1">✦</span>
            <span className="jaz-sparkle jaz-sparkle-2">✦</span>
            <span className="jaz-sparkle jaz-sparkle-3">✦</span>
          </div>
        </div>
        
        {/* Floating Orb */}
        <div className="jaz-orb-container">
          <button
            onClick={handleToggleChat}
            data-testid="jaz-toggle-button"
            aria-label={isOpen ? 'Close JAZ assistant' : 'Open JAZ assistant'}
            className={`jaz-orb-button ${isLoading ? 'is-thinking' : ''} ${isOpen ? 'is-listening' : ''} ${showWelcomePulse ? 'jaz-welcome-pulse' : ''}`}
          >
            {/* Internal glow */}
            <div className="jaz-orb-glow" />
            
            {/* Neural rings (show when thinking/active) */}
            {(isLoading || isOpen) && (
              <>
                <div className="jaz-orb-neural-ring jaz-orb-neural-ring-1" />
                <div className="jaz-orb-neural-ring jaz-orb-neural-ring-2" />
              </>
            )}
            
            {/* JobAZ Eye - Large, clear, and dominant */}
            <div className="jaz-orb-eye">
              <img 
                src="/jaz/jaz-eye.png" 
                alt="JobAZ Eye" 
                className="jaz-orb-eye-image"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  // Chat window content
  const chatContent = isOpen ? (
    <div
      data-testid="jaz-chat-window"
      className="jaz-chat-panel fixed bottom-28 right-4 md:w-[360px] md:h-[480px] md:max-h-[calc(100vh-9rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden pointer-events-auto z-50"
      data-no-translate
    >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/30 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <img 
                src="/jaz/jaz-eye.png" 
                alt="JAZ" 
                className="w-5 h-5 object-contain"
              />
              <h3 className="text-sm font-semibold text-slate-100 tracking-wide">JAZ</h3>
            </div>
            <button
              onClick={handleToggleChat}
              aria-label="Close chat"
              className="w-6 h-6 rounded-full hover:bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-b border-slate-700/30 bg-slate-900/20">
            {mode !== 'apply' && (
              <>
                <button
                  onClick={() => handleModeChange('ask')}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
                    mode === 'ask'
                      ? 'text-violet-300 bg-gradient-to-b from-violet-900/20 to-transparent border-b-2 border-violet-400 shadow-[0_2px_8px_rgba(139,92,246,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`}
                >
                  Ask
                </button>
                <button
                  onClick={() => handleModeChange('guide')}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
                    mode === 'guide'
                      ? 'text-violet-300 bg-gradient-to-b from-violet-900/20 to-transparent border-b-2 border-violet-400 shadow-[0_2px_8px_rgba(139,92,246,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`}
                >
                  Guide
                </button>
                <button
                  onClick={() => handleModeChange('translate')}
                  className={`flex-1 px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
                    mode === 'translate'
                      ? 'text-violet-300 bg-gradient-to-b from-violet-900/20 to-transparent border-b-2 border-violet-400 shadow-[0_2px_8px_rgba(139,92,246,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`}
                >
                  Translate
                </button>
              </>
            )}
            {mode === 'apply' && (
              <div className="w-full px-4 py-2.5 text-xs font-medium text-violet-300 bg-gradient-to-b from-violet-900/20 to-transparent border-b-2 border-violet-400 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(139,92,246,0.15)]">
                <Sparkles className="w-3 h-3" />
                Apply Assistant
              </div>
            )}
          </div>

          {/* Translate mode - Sticky hover translation toggle (outside Messages Area to stick to tabs) */}
          {mode === 'translate' && (
            <>
              {(() => {
                // Check RTL via language or dir attribute
                const hasRTLDir = typeof document !== 'undefined' && 
                  (document.documentElement.dir === 'rtl' || 
                   document.documentElement.getAttribute('dir') === 'rtl' ||
                   (hoverCheckboxRef.current && hoverCheckboxRef.current.closest('[dir="rtl"]') !== null))
                const isRTL = isRTLLanguage(targetLanguage || 'EN') || hasRTLDir
                
                return (
                  <div 
                    ref={hoverCheckboxRef}
                    className="sticky top-0 z-40 px-4 pt-0 pb-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50"
                  >
                    <div className="relative flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                      <input
                        type="checkbox"
                        id="hover-translation-toggle"
                        checked={hoverEnabled}
                        onChange={(e) => setHoverEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <label htmlFor="hover-translation-toggle" className="text-xs text-slate-300 cursor-pointer flex-1">
                        Enable hover translation
                      </label>
                    </div>
                    
                    {/* Tooltip - always rendered via portal with LTR positioning */}
                    {showHoverTooltip && tooltipPosition && (() => {
                      const tooltipText = getTooltipText(targetLanguage || 'EN')
                      const tooltipContent = (
                        <div 
                          dir={tooltipPosition.isRTL ? 'rtl' : 'ltr'}
                          style={{
                            position: 'fixed',
                            top: `${tooltipPosition.top}px`,
                            left: tooltipPosition.left !== undefined ? `${tooltipPosition.left}px` : undefined,
                            right: 'auto',
                            transform: 'none',
                            zIndex: 1000
                          }}
                          className="w-64 bg-slate-900 border border-violet-500/50 rounded-lg shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200 overflow-visible"
                        >
                          {/* Arrow pointing up to checkbox - always LTR anchor */}
                          <div 
                            className="absolute -top-1.5 w-3 h-3 bg-slate-900 border-l border-t border-violet-500/50 rotate-45"
                            style={{
                              left: '24px',
                              right: 'auto'
                            }}
                          ></div>
                          
                          {/* Close button */}
                          <button
                            onClick={dismissHoverTooltip}
                            className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-800"
                            aria-label="Close"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          
                          {/* Content - text direction follows language, padding accounts for close button */}
                          <div className={`space-y-1.5 ${tooltipPosition.isRTL ? 'pl-5 text-right' : 'pr-5 text-left'}`}>
                            <div className="text-xs font-semibold text-violet-300">
                              {tooltipText.title}
                            </div>
                            <div className="text-xs text-slate-300 leading-relaxed">
                              {tooltipText.message}
                            </div>
                          </div>
                        </div>
                      )
                      
                      // Always render via portal for consistency
                      return typeof window !== 'undefined' ? createPortal(tooltipContent, document.body) : null
                    })()}
                  </div>
                )
              })()}
            </>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Guide mode - Recommended Next Action Block (only when guideResults available) */}
            {renderRecommendedActionBlock()}
            
            {/* Guide mode - Smart Next Step Card (only show ONE card) */}
            {renderNextBestActionCard()}

            {/* Guide mode - AI Apply Assistant Results (only in Guide tab) */}
            {mode === 'guide' && guideResults && (
              <div className="w-full mb-4">
                {renderApplyAssistantCards(guideResults)}
              </div>
            )}

            {/* Guide mode - Action Plan Checklist (only on job-details page) */}
            {mode === 'guide' && actionPlan && pathname.startsWith('/job-details') && (
              <div className="space-y-2 mb-2">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                    <h4 className="text-sm font-semibold text-violet-300">Action Plan</h4>
                  </div>
                  
                  {/* Progress line */}
                  {actionPlan.items.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">
                          {actionPlan.items.filter(item => item.done).length} / {actionPlan.items.length} completed
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                        <div
                          className="bg-violet-600 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${(actionPlan.items.filter(item => item.done).length / actionPlan.items.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Checklist items */}
                  <div className="space-y-2">
                    {actionPlan.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer hover:text-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) => {
                            const jobId = jobIdFromPath || jobData?.id
                            if (jobId) {
                              updateActionPlanItem(jobId, item.id, e.target.checked)
                              setJobStateVersion(prev => prev + 1) // Trigger re-computation
                            }
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className={item.done ? 'line-through text-slate-500' : 'flex-1'}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Translate mode hint */}
            {mode === 'translate' && (
              <>
                <div className="space-y-2 mb-2">
                  <div className="text-xs text-slate-400 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                    Paste any job-related text (CV, cover, job ad, interview question) and I will translate or simplify it into the selected language.
                  </div>
                  {/* Hover translation hint when enabled */}
                  {hoverEnabled && (
                    <div className="text-xs text-violet-300 bg-violet-900/20 border border-violet-700/50 rounded-lg px-3 py-2">
                      ✓ Hover translation is ON. Move your mouse over text anywhere on the page to see translations.
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Translate error message */}
            {translateError && (
              <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2 mb-2">
                {translateError}
              </div>
            )}

            {/* Action toast message */}
            {actionToast && (
              <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2 mb-2">
                {actionToast}
              </div>
            )}

            {/* Filter out assistant-cards messages - they should only render in guide mode via guideResults */}
            {(() => {
              const currentMessages = getCurrentMessages()
              const filteredMessages = currentMessages.filter(msg => msg.role !== 'assistant-cards')
              
              if (filteredMessages.length === 0) {
                // Build Your Path guide content
                const buildYourPathGuide = pathname.startsWith('/build-your-path') && mode === 'guide'
                  ? getBuildYourPathGuideContent(pathname)
                  : null

                return (
                  <div className="text-center text-slate-400 text-sm py-8">
                    {mode === 'translate' 
                      ? 'Paste text above to translate it into the selected language.'
                      : mode === 'guide' && buildYourPathGuide
                      ? (
                          <div className="text-left space-y-4 max-w-2xl mx-auto">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                              <h3 className="text-base font-semibold text-violet-300 mb-2">{buildYourPathGuide.title}</h3>
                              <div className="text-sm text-slate-300 space-y-3 whitespace-pre-line leading-relaxed">
                                {buildYourPathGuide.content}
                              </div>
                            </div>
                          </div>
                        )
                      : mode === 'guide'
                      ? (guideResults || nextBestAction)
                        ? (guideResults ? 'See your analysis above.' : 'See your next step above.')
                        : 'Loading your guidance...'
                      : 'No messages yet. Start a conversation!'}
                  </div>
                )
              }
              
              return filteredMessages.map((message, index) => {
                const isFirstAssistantMessage = mode === 'ask' && pathname.startsWith('/dashboard') && message.role === 'assistant' && index === 0
                
                // Default message rendering (assistant-cards already filtered out)
                return (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'jaz-user-message-bubble'
                            : 'jaz-message-bubble'
                        }`}
                      >
                        <div className={`text-xs font-medium mb-2 ${message.role === 'user' ? 'text-slate-400' : 'text-violet-100'} opacity-90`}>
                          {message.role === 'user' ? 'You' : 'JAZ'}
                        </div>
                        <div className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${message.role === 'user' ? 'text-slate-100' : 'text-white'}`}>{message.content}</div>
                        <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-slate-500' : 'text-violet-200/70'} opacity-70`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {/* Quick action chips - show after first assistant message on dashboard */}
                    {isFirstAssistantMessage && (
                      <div className="flex flex-wrap gap-2 mt-3 ml-0">
                        <button
                          onClick={() => {
                            router.push('/cv-builder-v2')
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-violet-400/50 rounded-lg transition-colors"
                        >
                          Improve my CV
                        </button>
                        <button
                          onClick={() => {
                            router.push('/job-finder')
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-violet-400/50 rounded-lg transition-colors"
                        >
                          Match me to better jobs
                        </button>
                        <button
                          onClick={() => {
                            router.push('/interview-coach')
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 hover:border-violet-400/50 rounded-lg transition-colors"
                        >
                          Practice interview
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-100 border border-slate-700/50 rounded-lg px-3 py-2">
                  <div className="text-xs font-medium mb-1 opacity-80">JAZ</div>
                  <div className="text-sm flex items-center gap-2">
                    <span>{loadingStage || 'Thinking'}</span>
                    <span className="flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Language Selector */}
          <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center gap-2">
              <label htmlFor="jaz-language-select" className="text-xs text-slate-400" title="This only changes JAZ responses">
                {mode === 'translate' ? 'Target Language:' : 'Language:'}
              </label>
              <select
                id="jaz-language-select"
                value={localLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as JazLanguage
                  handleLanguageChange(newLang)
                }}
                title="This only changes JAZ responses"
                className="flex-1 bg-slate-800 border border-slate-700/50 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="EN">English</option>
                <option value="AR">Arabic</option>
                <option value="FA">Persian</option>
                <option value="KU">Kurdish</option>
                <option value="ES">Spanish</option>
                <option value="PL">Polish</option>
              </select>
            </div>
          </div>

          {/* Input Area */}
          {(mode !== 'apply' || (mode === 'apply' && applyResultsShown.current)) && (
            <div className="p-4 border-t border-slate-700/30 bg-slate-900/20">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={mode === 'translate' ? 'Paste text here to translate…' : mode === 'apply' ? 'Ask a follow-up question...' : 'Type your message...'}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-slate-900/50 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500/70 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none max-h-24 backdrop-blur-sm transition-all duration-200"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-2.5 bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 disabled:shadow-none"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Debug: Current Pathname (hidden) */}
          <div data-testid="jaz-pathname" className="hidden">
            {pathname}
          </div>
        </div>
  ) : null

  // Main component return - render both via portals (only after mounting to prevent hydration errors)
  if (!mounted) {
    return null
  }
  
  return (
    <>
      {createPortal(orbContent, document.body)}
      {createPortal(chatContent, document.body)}
    </>
  )
}

