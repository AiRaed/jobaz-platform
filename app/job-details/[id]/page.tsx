'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Briefcase, Clock, CheckCircle2, XCircle, FileText, Mail, Send, GraduationCap, Sparkles, Save, Copy, Edit, X, Bot, Target, ArrowRight } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { addAppliedJob, type AppliedJob } from '@/lib/applied-jobs-storage'
import { cleanJobDetailsCoverLetter, cleanCoverLetterClosing } from '@/lib/normalize'
import TranslatableText from '@/components/TranslatableText'
import PageHeader from '@/components/PageHeader'
import { useJazStore } from '@/lib/jaz-store'
import ApplyAssistantPanel from '@/components/apply/ApplyAssistantPanel'
import { getCurrentUserIdSync, getUserScopedKeySync, initUserStorageCache } from '@/lib/user-storage'
import { useNextStepLoadingStore, generateRequestId } from '@/lib/next-step-loading-store'
import { getBaseCvAnyScope } from '@/lib/cv-storage'

type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

function cleanJobDescription(html: string): DescriptionBlock[] {
  if (!html || !html.trim()) return []

  const result: DescriptionBlock[] = []
  
  // Helper to decode HTML entities
  const decodeHtml = (text: string): string => {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
  }

  // Helper to strip HTML tags
  const stripTags = (text: string): string => {
    return text.replace(/<[^>]+>/g, '').trim()
  }

  // Remove formatting tags but keep content
  let cleaned = html
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<b>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<em>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<i>/gi, '')
    .replace(/<\/i>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')

  // Extract lists with their positions
  const listMatches: Array<{ start: number; end: number; items: string[] }> = []
  const listRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi
  let listMatch

  while ((listMatch = listRegex.exec(cleaned)) !== null) {
    const listContent = listMatch[1]
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    const items: string[] = []
    let liMatch

    while ((liMatch = liRegex.exec(listContent)) !== null) {
      let itemText = stripTags(liMatch[1])
      itemText = decodeHtml(itemText)
      if (itemText) {
        items.push(itemText)
      }
    }

    if (items.length > 0) {
      listMatches.push({
        start: listMatch.index,
        end: listMatch.index + listMatch[0].length,
        items,
      })
    }
  }

  // Extract paragraphs
  const paragraphMatches: Array<{ start: number; end: number; text: string }> = []
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let paraMatch

  while ((paraMatch = paragraphRegex.exec(cleaned)) !== null) {
    let paraText = stripTags(paraMatch[1])
    paraText = decodeHtml(paraText).replace(/\n+/g, ' ').trim()
    if (paraText) {
      paragraphMatches.push({
        start: paraMatch.index,
        end: paraMatch.index + paraMatch[0].length,
        text: paraText,
      })
    }
  }

  // Combine and sort all matches by position
  type Match = { start: number; end: number; type: 'list' | 'paragraph'; data: any }
  const allMatches: Match[] = [
    ...listMatches.map(m => ({ ...m, type: 'list' as const, data: m.items })),
    ...paragraphMatches.map(m => ({ ...m, type: 'paragraph' as const, data: m.text })),
  ].sort((a, b) => a.start - b.start)

  // Add all matches in order
  for (const match of allMatches) {
    if (match.type === 'list') {
      result.push({ type: 'list', items: match.data })
    } else {
      result.push({ type: 'paragraph', text: match.data })
    }
  }

  // If no structured content found, process as plain text
  if (result.length === 0) {
    // Remove all HTML tags
    let plainText = cleaned.replace(/<[^>]+>/g, '')
    plainText = decodeHtml(plainText)
    
    // Split by double newlines or single newlines
    const blocks = plainText.split(/\n\n+/).filter(Boolean)
    for (const block of blocks) {
      const trimmed = block.trim()
      if (trimmed) {
        // Check if it looks like a list (lines starting with bullet-like characters)
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean)
        const looksLikeList = lines.length > 1 && lines.every(line => 
          /^[-•*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)
        )
        
        if (looksLikeList) {
          const items = lines.map(line => line.replace(/^[-•*\d.)]\s+/, '').trim())
          result.push({ type: 'list', items })
        } else {
          result.push({ type: 'paragraph', text: trimmed })
        }
      }
    }
  }

  return result
}

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  type?: string
  requirements?: string
  duties?: string
  skills?: string
  link?: string
}

const JOB_STORAGE_PREFIX = 'jobaz_job_'

/**
 * Get user-scoped storage key helper
 */
function getUserScopedKey(baseKey: string): string {
  if (typeof window === 'undefined') return baseKey
  const userId = getCurrentUserIdSync()
  if (userId) {
    return getUserScopedKeySync(baseKey, userId)
  }
  return baseKey // Fallback to legacy key
}

/**
 * Get user-scoped job storage key
 */
function getUserScopedJobKey(jobId: string): string {
  if (typeof window === 'undefined') return JOB_STORAGE_PREFIX + jobId
  const userId = getCurrentUserIdSync()
  if (userId) {
    return getUserScopedKeySync(`job_${jobId}`, userId)
  }
  return JOB_STORAGE_PREFIX + jobId // Fallback to legacy key
}

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

interface SavedCV {
  fullName: string
  email: string
  phone: string
  city: string
  summary: string
  skills: string[]
  experience: any[]
  education: any[]
}

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = params?.id as string
  const { openJaz } = useJazStore()
  
  // Initialize user storage cache
  useEffect(() => {
    initUserStorageCache()
  }, [])

  // Helper function to get user-scoped storage keys
  const getUserKey = useCallback((baseKey: string) => {
    const userId = getCurrentUserIdSync()
    return userId ? getUserScopedKeySync(baseKey, userId) : baseKey
  }, [])

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Local state for statuses
  const [cvStatus, setCvStatus] = useState<'not-tailored' | 'ready'>('not-tailored')
  const [coverStatus, setCoverStatus] = useState<'not-created' | 'ready'>('not-created')
  const [applicationStatus, setApplicationStatus] = useState<'not-submitted' | 'submitted'>('not-submitted')
  const [trainingStatus, setTrainingStatus] = useState<'not-available' | 'available'>('not-available')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  
  // CV Tailoring state
  const [cvSummary, setCvSummary] = useState<string>('')
  const [isTailoringCv, setIsTailoringCv] = useState(false)
  const [cvTailorMessage, setCvTailorMessage] = useState<string | null>(null)
  
  // Cover Letter state
  const [coverLetterText, setCoverLetterText] = useState<string>('')
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [coverMessage, setCoverMessage] = useState<string | null>(null)
  
  // Flag to trigger instant refetch of JAZ Insight after AI actions
  const [shouldRefetchInsight, setShouldRefetchInsight] = useState(0)
  
  // Determine if user is ready to apply (CV tailored and cover letter ready, but not yet submitted)
  const isReadyToApply = cvStatus === 'ready' && coverStatus === 'ready' && applicationStatus !== 'submitted'

  const handleAIApplyAssistant = useCallback(() => {
    if (!job) return

    // Prepare job data for JAZ
    const jobDescription = (job as any)?._reedJob?.fullDescription || 
                          (job as any)?._reedJob?.jobDescription || 
                          job.description || 
                          ''
    const jobRequirements = (job as any)?._reedJob?.requirements || 
                         job.requirements || 
                         ''

    // Open JAZ with apply mode and job data
    openJaz('apply', {
      title: job.title,
      company: job.company,
      description: jobDescription,
      requirements: jobRequirements,
      id: job.id,
    })
  }, [job, openJaz])

  const handleApply = useCallback(() => {
    if (!job) return

    // Update application status to submitted
    setApplicationStatus('submitted')
    // Update training status to available
    setTrainingStatus('available')
    
    // Save to localStorage with updated state (user-scoped)
    const jobStorageKey = jobId ? getUserScopedJobKey(jobId) : null
    if (typeof window !== 'undefined' && jobStorageKey) {
      // Get user name for cleaning cover letter (user-scoped)
      let userName = 'Your Name'
      try {
        const hasCVKey = getUserScopedKey('hasCV')
        const baseCvKey = getUserScopedKey('baseCv')
        const hasCV = localStorage.getItem(hasCVKey) === 'true'
        const rawCv = localStorage.getItem(baseCvKey)
        if (hasCV && rawCv) {
          const baseCv = JSON.parse(rawCv)
          if (baseCv.fullName && baseCv.fullName.trim()) {
            userName = baseCv.fullName.trim()
          }
        }
        // Also check saved cover letter (user-scoped)
        const hasCoverLetterKey = getUserScopedKey('hasCoverLetter')
        const baseCoverKey = getUserScopedKey('baseCoverLetter')
        const hasCoverLetter = localStorage.getItem(hasCoverLetterKey) === 'true'
        const rawCover = localStorage.getItem(baseCoverKey)
        if (hasCoverLetter && rawCover) {
          const baseCover = JSON.parse(rawCover)
          if (baseCover.applicantName && baseCover.applicantName.trim()) {
            userName = baseCover.applicantName.trim()
          }
        }
      } catch (error) {
        console.error('Error getting user name:', error)
      }

      // Clean cover letter text before saving
      const cleanedCoverLetter = coverLetterText ? cleanCoverLetterClosing(coverLetterText, userName) : coverLetterText

      const data: StoredJobState = {
        cvSummary: cvSummary,
        coverLetterText: cleanedCoverLetter,
        statuses: {
          cv: cvStatus,
          cover: coverStatus,
          application: 'submitted',
          training: 'available',
        },
      }

      localStorage.setItem(jobStorageKey, JSON.stringify(data))
      
      // Dispatch custom event for JAZ to detect state changes
      window.dispatchEvent(new Event('jobaz-job-state-changed'))
    }
    
    // Add job to applied jobs list
    const appliedJob: AppliedJob = {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      sourceSite: (job as any)?._reedJob ? 'Reed' : undefined, // Detect source if available
      jobUrl: job.link || (job as any)?.applyUrl || (job as any)?.url,
      createdAt: new Date().toISOString(),
      status: 'submitted',
      hasCv: cvStatus === 'ready',
      hasCover: coverStatus === 'ready',
    }
    addAppliedJob(appliedJob)
    
    // Show success message
    setShowSuccessMessage(true)
    setTimeout(() => {
      setShowSuccessMessage(false)
    }, 5000)

    // Trigger refetch of JAZ Insight after applying
    setShouldRefetchInsight(prev => prev + 1)

    // Open job application URL in new tab
    const jobUrl = job?.link || (job as any)?.applyUrl || (job as any)?.url || 'https://www.indeed.com'
    window.open(jobUrl, '_blank', 'noopener,noreferrer')
  }, [job, jobId, cvSummary, coverLetterText, cvStatus, coverStatus, addAppliedJob])

  const handleTrainForInterview = useCallback(() => {
    if (!job) return
    
    const jobIdValue = job.id?.toString() ?? jobId
    
    // Set interview trained flag when user clicks Train Interview (user-scoped)
    if (typeof window !== 'undefined' && jobIdValue) {
      const userId = getCurrentUserIdSync()
      const interviewKey = userId 
        ? getUserScopedKeySync(`job_${jobIdValue}_interview_trained`, userId)
        : `jobaz_job_${jobIdValue}_interview_trained`
      localStorage.setItem(interviewKey, 'true')
      // Dispatch event for JAZ to detect state changes
      window.dispatchEvent(new Event('jobaz-job-state-changed'))
    }
    
    const query = new URLSearchParams({
      jobId: jobIdValue,
      title: job.title,
      company: job.company,
    }).toString()
    
    router.push(`/interview-coach?${query}`)
  }, [job, jobId, router])

  // Debounced text values for typing (350ms delay)
  // Use immediate values when AI is generating (no debounce)
  const [debouncedCvSummary, setDebouncedCvSummary] = useState(cvSummary)
  const [debouncedCoverLetterText, setDebouncedCoverLetterText] = useState(coverLetterText)

  // Update debounced values when typing (but not when AI is generating)
  useEffect(() => {
    if (isTailoringCv || isGeneratingCover) {
      // AI is generating - use immediate values, no debounce
      setDebouncedCvSummary(cvSummary)
      setDebouncedCoverLetterText(coverLetterText)
      return
    }

    // User is typing - debounce for 350ms
    const timeoutId = setTimeout(() => {
      setDebouncedCvSummary(cvSummary)
      setDebouncedCoverLetterText(coverLetterText)
    }, 350)

    return () => clearTimeout(timeoutId)
  }, [cvSummary, coverLetterText, isTailoringCv, isGeneratingCover])

  // Determine effective ready states based on actual text content
  // This ensures the recommendation updates immediately when text changes
  const cvHasContent = useMemo(() => {
    // Use immediate value if AI is generating, otherwise use debounced
    const textToCheck = isTailoringCv ? cvSummary : debouncedCvSummary
    return textToCheck.trim().length > 0
  }, [cvSummary, debouncedCvSummary, isTailoringCv])

  const coverHasContent = useMemo(() => {
    // Use immediate value if AI is generating, otherwise use debounced
    const textToCheck = isGeneratingCover ? coverLetterText : debouncedCoverLetterText
    return textToCheck.trim().length > 0
  }, [coverLetterText, debouncedCoverLetterText, isGeneratingCover])

  // Determine recommended next step - made reactive with useMemo
  // Now checks actual text content directly, not just status flags
  const recommendedNextStep = useMemo(() => {
    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      const cvLen = cvSummary?.length || 0
      const coverLen = coverLetterText?.length || 0
      const cvReady = cvStatus === 'ready' || cvHasContent
      const coverReady = coverStatus === 'ready' || coverHasContent
      const interviewDone = trainingStatus === 'available'
      const applied = applicationStatus === 'submitted'
      console.log("[NextStep] recompute", { cvLen, coverLen, cvReady, coverReady, interviewDone, applied, cvHasContent, coverHasContent })
    }

    // Step 1: Optimize CV (if CV not tailored AND no content)
    if (cvStatus === 'not-tailored' && !cvHasContent) {
      return {
        name: 'Optimize CV',
        description: 'Tailor your CV summary to match this job description',
        explanation: 'Your CV needs to be optimized for this specific role to increase your chances of getting noticed.',
        primaryAction: {
          label: 'Optimize CV',
          onClick: () => {
            // Scroll to CV panel first, then user can use AI Tailor Summary button there
            if (cvPanelRef.current) {
              cvPanelRef.current.scrollIntoView({ behavior: 'smooth' })
            }
          },
          icon: <FileText className="w-4 h-4" />,
        },
        secondaryAction: {
          label: 'Open AI Apply Assistant',
          onClick: handleAIApplyAssistant,
          icon: <Bot className="w-4 h-4" />,
        },
      }
    }

    // Step 2: Generate Cover Letter (if CV ready/has content but cover not created/has no content)
    if ((cvStatus === 'ready' || cvHasContent) && coverStatus === 'not-created' && !coverHasContent) {
      return {
        name: 'Generate Cover Letter',
        description: 'Create a tailored cover letter for this position',
        explanation: 'A personalized cover letter helps you stand out and shows your genuine interest in this role.',
        primaryAction: {
          label: 'Generate Cover Letter',
          onClick: () => {
            // Scroll to Cover Letter panel first, then user can use AI Generate Cover Letter button there
            if (coverLetterPanelRef.current) {
              coverLetterPanelRef.current.scrollIntoView({ behavior: 'smooth' })
            }
          },
          icon: <Mail className="w-4 h-4" />,
        },
        secondaryAction: {
          label: 'Open AI Apply Assistant',
          onClick: handleAIApplyAssistant,
          icon: <Bot className="w-4 h-4" />,
        },
      }
    }

    // Step 3: Apply (if both CV and cover ready/have content but not applied)
    if ((cvStatus === 'ready' || cvHasContent) && (coverStatus === 'ready' || coverHasContent) && applicationStatus === 'not-submitted') {
      return {
        name: 'Apply for Job',
        description: 'You\'re ready to submit your application',
        explanation: 'Your CV and cover letter are tailored and ready. Submit your application now!',
        primaryAction: {
          label: 'Apply for this Job',
          onClick: handleApply,
          icon: <Send className="w-4 h-4" />,
        },
        secondaryAction: {
          label: 'Open AI Apply Assistant',
          onClick: handleAIApplyAssistant,
          icon: <Bot className="w-4 h-4" />,
        },
      }
    }

    // Step 4: Train Interview (if application submitted)
    if (applicationStatus === 'submitted' && trainingStatus === 'available') {
      return {
        name: 'Train for Interview',
        description: 'Prepare for your interview with AI-powered training',
        explanation: 'Now that you\'ve applied, prepare for potential interview questions to increase your confidence.',
        primaryAction: {
          label: 'Train for Interview',
          onClick: handleTrainForInterview,
          icon: <GraduationCap className="w-4 h-4" />,
        },
        secondaryAction: {
          label: 'Open AI Apply Assistant',
          onClick: handleAIApplyAssistant,
          icon: <Bot className="w-4 h-4" />,
        },
      }
    }

    // All steps complete
    if (applicationStatus === 'submitted') {
      return {
        name: 'Application Submitted',
        description: 'Great job! Your application has been submitted.',
        explanation: 'Your application is complete. Keep an eye on your email for updates from the employer.',
        primaryAction: trainingStatus === 'available' ? {
          label: 'Train for Interview',
          onClick: handleTrainForInterview,
          icon: <GraduationCap className="w-4 h-4" />,
        } : null,
        secondaryAction: {
          label: 'Open AI Apply Assistant',
          onClick: handleAIApplyAssistant,
          icon: <Bot className="w-4 h-4" />,
        },
      }
    }

    return null
  }, [cvStatus, coverStatus, applicationStatus, trainingStatus, cvSummary, coverLetterText, cvHasContent, coverHasContent, handleAIApplyAssistant, handleApply, handleTrainForInterview])
  
  // Job Description state
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  
  // Saved CV Modal state
  const [showSavedCVModal, setShowSavedCVModal] = useState(false)
  const [savedCVSummary, setSavedCVSummary] = useState<string | null>(null)
  const [hasSavedCV, setHasSavedCV] = useState(false)
  
  // Refs for panel scrolling
  const cvPanelRef = useRef<HTMLDivElement>(null)
  const coverLetterPanelRef = useRef<HTMLDivElement>(null)
  const fullDescRef = useRef<HTMLDivElement>(null)

  // Flag to track if we've loaded from localStorage
  const hasLoadedFromStorage = useRef(false)

  // Derive localStorage key for this job (user-scoped)
  const jobStorageKey = jobId ? getUserScopedJobKey(jobId) : null

  // Clear old job-related data from localStorage when a new job is selected
  // This MUST run before any other useEffect that reads from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !jobId) return

    try {
      const from = searchParams?.get('from')
      const lastJobIdKey = getUserScopedKey('lastJobId')
      const lastJobId = window.localStorage.getItem(lastJobIdKey)
      const isNewJob = lastJobId && lastJobId !== jobId
      const cameFromFinder = from === 'finder'

      // Only reset when explicitly coming from finder (starting fresh for a new job)
      // When coming from dashboard, we want to restore the saved state, so don't clear
      if (cameFromFinder) {
        // Clear the current job's data to start fresh (user-scoped)
        const currentJobKey = getUserScopedJobKey(jobId)
        localStorage.removeItem(currentJobKey)

        // Clear specific keys that might contain old job data (user-scoped)
        const specificKeysToRemove = [
          getUserScopedKey('prefill_summary'),
          getUserScopedKey('cover-draft'),
          getUserScopedKey('job_info'),
          getUserScopedKey('hasCoverLetter'),
        ]
        specificKeysToRemove.forEach(key => localStorage.removeItem(key))

        // Clear any other draft keys containing summary or cover letter data
        // Check for keys with "draft" in the name that might be job-related
        const draftKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
            (key.toLowerCase().includes('draft') && (key.toLowerCase().includes('summary') || key.toLowerCase().includes('cover'))) ||
            (key.startsWith('jobaz') && key.toLowerCase().includes('draft'))
          )) {
            draftKeys.push(key)
          }
        }
        draftKeys.forEach(key => localStorage.removeItem(key))

        // Reset state variables to ensure they start empty
        setCvSummary('')
        setCoverLetterText('')
        setCvTailorMessage(null)
        setCoverMessage(null)
        
        // Reset statuses to initial state for a fresh start
        setCvStatus('not-tailored')
        setCoverStatus('not-created')
        setApplicationStatus('not-submitted')
        setTrainingStatus('not-available')
        
        // Reset the flag so that default initialization won't happen
        hasLoadedFromStorage.current = false
      }
      // If NOT coming from finder (e.g., from dashboard), we'll restore the saved state
      // in the next useEffect, so we don't clear anything here

      // Always update the last job ID (user-scoped)
      window.localStorage.setItem(lastJobIdKey, jobId)
    } catch (error) {
      console.error('Error clearing old job data from localStorage:', error)
    }
  }, [jobId, searchParams]) // Run whenever jobId or searchParams changes

  // Helper function to save state to localStorage
  const saveJobStateToStorage = useCallback((overrides?: Partial<StoredJobState>) => {
    if (typeof window === 'undefined' || !jobStorageKey) return

    // Get user name for cleaning cover letter (user-scoped)
    let userName = 'Your Name'
    try {
      const hasCVKey = getUserScopedKey('hasCV')
      const baseCvKey = getUserScopedKey('baseCv')
      const hasCV = localStorage.getItem(hasCVKey) === 'true'
      const rawCv = localStorage.getItem(baseCvKey)
      if (hasCV && rawCv) {
        const baseCv = JSON.parse(rawCv)
        if (baseCv.fullName && baseCv.fullName.trim()) {
          userName = baseCv.fullName.trim()
        }
      }
      // Also check saved cover letter (user-scoped)
      const hasCoverLetterKey = getUserScopedKey('hasCoverLetter')
      const baseCoverKey = getUserScopedKey('baseCoverLetter')
      const hasCoverLetter = localStorage.getItem(hasCoverLetterKey) === 'true'
      const rawCover = localStorage.getItem(baseCoverKey)
      if (hasCoverLetter && rawCover) {
        const baseCover = JSON.parse(rawCover)
        if (baseCover.applicantName && baseCover.applicantName.trim()) {
          userName = baseCover.applicantName.trim()
        }
      }
    } catch (error) {
      console.error('Error getting user name:', error)
    }

    // Clean cover letter text before saving
    const textToSave = overrides?.coverLetterText ?? coverLetterText
    const cleanedCoverLetter = textToSave ? cleanCoverLetterClosing(textToSave, userName) : textToSave

    const data: StoredJobState = {
      cvSummary: overrides?.cvSummary ?? cvSummary,
      coverLetterText: cleanedCoverLetter,
      statuses: {
        cv: overrides?.statuses?.cv ?? cvStatus,
        cover: overrides?.statuses?.cover ?? coverStatus,
        application: overrides?.statuses?.application ?? applicationStatus,
        training: overrides?.statuses?.training ?? trainingStatus,
      },
    }

    localStorage.setItem(jobStorageKey, JSON.stringify(data))
    
    // Dispatch custom event for JAZ to detect state changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jobaz-job-state-changed'))
    }
  }, [jobStorageKey, cvSummary, coverLetterText, cvStatus, coverStatus, applicationStatus, trainingStatus])

  useEffect(() => {
    if (!jobId) return

    // Parse provider from job ID
    const isAdzuna = jobId.startsWith('adzuna_')
    const isReed = jobId.startsWith('reed_')

    // Fetch job data from unified API route (handles provider prefixes)
    const fetchJob = async () => {
      try {
        setError(null)
        
        // For Adzuna jobs, check sessionStorage cache first
        if (isAdzuna && typeof window !== 'undefined') {
          const rawId = jobId.replace('adzuna_', '')
          const cacheKey = `adzuna_job_${rawId}`
          const cachedData = sessionStorage.getItem(cacheKey)
          
          if (cachedData) {
            try {
              const cachedJob = JSON.parse(cachedData)
              
              // Map cached job to our Job interface
              const mappedJob: Job = {
                id: cachedJob.id || jobId,
                title: cachedJob.title || 'Untitled Job',
                company: cachedJob.company || 'Unknown Company',
                location: cachedJob.location || 'Location not specified',
                description: cachedJob.description || '',
                type: cachedJob.type || undefined,
                link: cachedJob.link || cachedJob.redirect_url || undefined,
                requirements: undefined,
                duties: undefined,
                skills: undefined,
              }
              
              // Store additional fields for compatibility
              if (cachedJob.salary) {
                ;(mappedJob as any).salary = cachedJob.salary
              }
              if (cachedJob.contract) {
                ;(mappedJob as any).contract = cachedJob.contract
              }
              if (cachedJob.redirect_url) {
                ;(mappedJob as any).redirect_url = cachedJob.redirect_url
              }
              if (cachedJob.created) {
                ;(mappedJob as any).created = cachedJob.created
              }
              if (cachedJob.category) {
                ;(mappedJob as any).category = cachedJob.category
              }
              
              setJob(mappedJob)
              setError(null)
              setLoading(false)
              return // Successfully loaded from cache, no API call needed
            } catch (parseError) {
              console.error('Error parsing cached Adzuna job:', parseError)
              // Fall through to API call if cache parse fails
            }
          }
          // If cache miss or parse error, fall through to API call
        }
        
        // For Reed jobs or Adzuna cache miss, use API
        // Use the unified /api/jobs/[id] route which handles provider prefixes (reed_*, adzuna_*)
        const apiUrl = `/api/jobs/${encodeURIComponent(jobId)}`
        const response = await fetch(apiUrl)
        
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || 'Job not found'
          
          // Show specific error for Adzuna jobs
          if (isAdzuna) {
            const parsedId = jobId.replace('adzuna_', '')
            const apiBase = 'https://api.adzuna.com/v1/api'
            const debugUrl = `${apiBase}/jobs/gb/${parsedId}`
            console.error(`Adzuna job not found. Job ID: ${parsedId}, API URL: ${debugUrl}`)
            setError(`Adzuna job not found (ID: ${parsedId}). The job may have been removed or the ID is incorrect.`)
          } else {
            setError(errorMessage)
          }
          
          setJob(null)
          setLoading(false)
          return
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || 'Failed to fetch job'
          
          // Log exact URL for Adzuna jobs
          if (isAdzuna) {
            const parsedId = jobId.replace('adzuna_', '')
            const apiBase = 'https://api.adzuna.com/v1/api'
            const debugUrl = `${apiBase}/jobs/gb/${parsedId}`
            console.error(`Adzuna API error. Job ID: ${parsedId}, API URL: ${debugUrl}, Status: ${response.status}`)
            setError(`Failed to fetch Adzuna job. Please try again or check if the job ID is correct.`)
          } else {
            setError(errorMessage)
          }
          
          setJob(null)
          setLoading(false)
          return
        }
        
        const data = await response.json()
        
        if (data.job) {
          // Map API response to our Job interface
          const apiJob = data.job
          const mappedJob: Job = {
            id: apiJob.id || jobId,
            title: apiJob.title || 'Untitled Job',
            company: apiJob.company || 'Unknown Company',
            location: apiJob.location || 'Location not specified',
            description: apiJob.description || '',
            type: apiJob.type || undefined,
            link: apiJob.link || undefined,
            requirements: undefined,
            duties: undefined,
            skills: undefined,
          }
          
          // Store provider-specific job objects for compatibility
          if (apiJob._reedJob) {
            ;(mappedJob as any)._reedJob = apiJob._reedJob
          }
          if (apiJob._adzunaJob) {
            ;(mappedJob as any)._adzunaJob = apiJob._adzunaJob
          }
          
          setJob(mappedJob)
          setError(null)
        } else {
          setJob(null)
          setError(isAdzuna ? 'Adzuna job not found' : 'Job not found')
        }
      } catch (error) {
        console.error('Error fetching job:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Log exact URL for Adzuna jobs
        if (isAdzuna) {
          const parsedId = jobId.replace('adzuna_', '')
          const apiBase = 'https://api.adzuna.com/v1/api'
          const debugUrl = `${apiBase}/jobs/gb/${parsedId}`
          console.error(`Adzuna job fetch error. Job ID: ${parsedId}, API URL: ${debugUrl}, Error: ${errorMessage}`)
          setError(`Failed to fetch Adzuna job: ${errorMessage}`)
        } else {
          setError(`Failed to fetch job: ${errorMessage}`)
        }
        
        setJob(null)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  // Load state from localStorage on mount
  // Restore cvSummary, coverLetterText, and statuses when coming back from dashboard or cover/cvBuilder
  // (When resetting from finder, these will be empty and won't be restored)
  useEffect(() => {
    if (typeof window === 'undefined' || !jobStorageKey) return

    const stored = localStorage.getItem(jobStorageKey)
    if (stored) {
      try {
        const data: StoredJobState = JSON.parse(stored)
        
        // Restore cvSummary and coverLetterText
        if (data.cvSummary) {
          setCvSummary(data.cvSummary)
        }
        if (data.coverLetterText) {
          setCoverLetterText(data.coverLetterText)
        }
        
        // Restore statuses
        if (data.statuses) {
          setCvStatus(data.statuses.cv || 'not-tailored')
          setCoverStatus(data.statuses.cover || 'not-created')
          setApplicationStatus(data.statuses.application || 'not-submitted')
          setTrainingStatus(data.statuses.training || 'not-available')
        }
        hasLoadedFromStorage.current = true
      } catch (error) {
        console.error('Error parsing stored job state:', error)
        hasLoadedFromStorage.current = true // Mark as loaded even on error to prevent defaults
      }
    } else {
      hasLoadedFromStorage.current = true // Mark as loaded even if no stored data
    }
  }, [jobStorageKey, searchParams]) // Also depend on searchParams to re-run when navigation changes

  // Auto-update statuses based on text content (debounced for typing, immediate for AI generation)
  // This ensures Recommended Next Step updates reactively when user types or AI generates content
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return

    // Debounce status updates for typing (300ms)
    const timeoutId = setTimeout(() => {
      let statusChanged = false
      const updates: Partial<StoredJobState['statuses']> = {}

      // Update CV status based on content
      if (cvSummary.trim().length > 0 && cvStatus === 'not-tailored') {
        updates.cv = 'ready'
        statusChanged = true
      } else if (cvSummary.trim().length === 0 && cvStatus === 'ready') {
        // Only reset to 'not-tailored' if user manually cleared it (not during initial load)
        // We'll keep it as 'ready' if it was previously set, to avoid flickering
      }

      // Update Cover Letter status based on content
      if (coverLetterText.trim().length > 0 && coverStatus === 'not-created') {
        updates.cover = 'ready'
        statusChanged = true
      } else if (coverLetterText.trim().length === 0 && coverStatus === 'ready') {
        // Only reset to 'not-created' if user manually cleared it
      }

      if (statusChanged) {
        setCvStatus(prev => updates.cv || prev)
        setCoverStatus(prev => updates.cover || prev)
        saveJobStateToStorage({
          statuses: {
            cv: updates.cv || cvStatus,
            cover: updates.cover || coverStatus,
            application: applicationStatus,
            training: trainingStatus,
          },
        })
      }
    }, 300) // Debounce: 300ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [cvSummary, coverLetterText, cvStatus, coverStatus, applicationStatus, trainingStatus, saveJobStateToStorage, hasLoadedFromStorage])

  // Immediate status update when AI generation finishes (no debounce)
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return

    // When AI finishes tailoring CV (isTailoringCv becomes false and cvSummary has content)
    if (!isTailoringCv && cvSummary.trim().length > 0 && cvStatus === 'not-tailored') {
      setCvStatus('ready')
      saveJobStateToStorage({
        statuses: {
          cv: 'ready',
          cover: coverStatus,
          application: applicationStatus,
          training: trainingStatus,
        },
      })
    }

    // When AI finishes generating cover letter (isGeneratingCover becomes false and coverLetterText has content)
    if (!isGeneratingCover && coverLetterText.trim().length > 0 && coverStatus === 'not-created') {
      setCoverStatus('ready')
      saveJobStateToStorage({
        statuses: {
          cv: cvStatus,
          cover: 'ready',
          application: applicationStatus,
          training: trainingStatus,
        },
      })
    }
  }, [isTailoringCv, isGeneratingCover, cvSummary, coverLetterText, cvStatus, coverStatus, applicationStatus, trainingStatus, saveJobStateToStorage, hasLoadedFromStorage])

  // Auto-save cvSummary and coverLetterText when they change (debounced)
  // Only save after initial load is complete to avoid overwriting restored data
  useEffect(() => {
    if (!hasLoadedFromStorage.current || !jobStorageKey) return

    const timeoutId = setTimeout(() => {
      saveJobStateToStorage()
    }, 500) // Debounce: save 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [cvSummary, coverLetterText, saveJobStateToStorage, jobStorageKey])

  // Listen for job state changes to automatically update Recommended Next Step
  useEffect(() => {
    if (typeof window === 'undefined' || !jobStorageKey) return

    const handleJobStateChanged = () => {
      // Reload statuses from localStorage when state changes
      const stored = localStorage.getItem(jobStorageKey)
      if (stored) {
        try {
          const data: StoredJobState = JSON.parse(stored)
          if (data.statuses) {
            setCvStatus(data.statuses.cv || 'not-tailored')
            setCoverStatus(data.statuses.cover || 'not-created')
            setApplicationStatus(data.statuses.application || 'not-submitted')
            setTrainingStatus(data.statuses.training || 'not-available')
          }
        } catch (error) {
          console.error('Error parsing stored job state on change:', error)
        }
      }
    }

    window.addEventListener('jobaz-job-state-changed', handleJobStateChanged)
    return () => {
      window.removeEventListener('jobaz-job-state-changed', handleJobStateChanged)
    }
  }, [jobStorageKey])

  // Note: Removed default initialization useEffects - fields should always start empty
  // Prefill only happens when user explicitly clicks "AI Tailor Summary" or "AI Generate Cover Letter"

  // Load saved CV summary on mount (using CV Builder V2 storage, same as Dashboard)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Get cvId from URL search params first, then from localStorage
      const cvIdFromUrl = searchParams?.get('cvId') || null
      
      // Try to get cvId from localStorage (jobaz_job_info or other sources)
      let cvId = cvIdFromUrl
      if (!cvId) {
        try {
          const jobInfo = localStorage.getItem(`jobaz_job_info`)
          if (jobInfo) {
            const parsed = JSON.parse(jobInfo)
            if (parsed.cvId) {
              cvId = parsed.cvId
            }
          }
        } catch (e) {
          // Ignore errors from job info
        }
      }

      // Use shared helper to get CV from any scope
      let cvSummary: string | null = null
      
      // If cvId is specified, try to find that specific CV first
      if (cvId) {
        const userId = getCurrentUserIdSync()
        const cvsKey = userId ? getUserScopedKeySync('cvs', userId) : 'jobaz-cvs'
        const rawCvs = localStorage.getItem(cvsKey)
        if (rawCvs) {
          try {
            const cvs = JSON.parse(rawCvs)
            if (Array.isArray(cvs) && cvs.length > 0) {
              const targetCv = cvs.find((cv: any) => cv.id === cvId)
              if (targetCv && targetCv.summary && targetCv.summary.trim()) {
                cvSummary = targetCv.summary.trim()
              }
            }
          } catch (error) {
            console.error('Error parsing CVs for cvId:', error)
          }
        }
      }
      
      // If no cvId or CV not found by cvId, use shared helper
      if (!cvSummary) {
        const { hasCv, cv } = getBaseCvAnyScope()
        if (hasCv && cv && cv.summary && cv.summary.trim()) {
          cvSummary = cv.summary.trim()
        }
      }

      if (cvSummary) {
        setSavedCVSummary(cvSummary)
        setHasSavedCV(true)
      } else {
        setSavedCVSummary(null)
        setHasSavedCV(false)
      }
    } catch (error) {
      console.error('Error loading saved CV:', error)
      setSavedCVSummary(null)
      setHasSavedCV(false)
    }
  }, [searchParams])

  const handleOptimizeCV = () => {
    // Scroll to CV panel only - status updates are handled by handleAITailorSummary
    if (cvPanelRef.current) {
      cvPanelRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleGenerateCoverLetter = () => {
    // Scroll to cover letter panel only - status updates are handled by handleAIGenerateCoverLetter
    if (coverLetterPanelRef.current) {
      coverLetterPanelRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleAITailorSummary = async () => {
    if (!cvSummary.trim()) {
      alert('Please enter a CV summary first.')
      return
    }

    if (!job) return

    const requestId = generateRequestId('ai-tailor-summary')
    const { startLoading, stopLoading } = useNextStepLoadingStore.getState()

    setIsTailoringCv(true)
    setCvTailorMessage(null)
    startLoading(requestId)

    try {
      // Get job description from Reed job or fallback to description field
      const jobDescription = (job as any)?._reedJob?.fullDescription || 
                            (job as any)?._reedJob?.jobDescription || 
                            job.description || 
                            ''

      if (!jobDescription.trim()) {
        setCvTailorMessage('Job description not available. Cannot tailor CV.')
        setIsTailoringCv(false)
        stopLoading(requestId)
        return
      }

      // Use the CV AI tailor endpoint with job description
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'summary',
          jobDescription: jobDescription,
          currentSummary: cvSummary,
        }),
      })

      const data = await response.json()

      // Consider success if we got content, even if response.ok is false
      if (data.ok && data.tailoredSummary && data.tailoredSummary.trim()) {
        setCvSummary(data.tailoredSummary)
        setCvTailorMessage('Summary tailored for this job.')
        
        // Immediately update CV status to ready (tailored)
        setCvStatus('ready')
        saveJobStateToStorage({
          cvSummary: data.tailoredSummary,
          statuses: {
            cv: 'ready',
            cover: coverStatus,
            application: applicationStatus,
            training: trainingStatus,
          },
        })
        
        // Trigger instant refetch of JAZ Insight
        setShouldRefetchInsight(prev => prev + 1)
      } else if (data.tailoredSummary && data.tailoredSummary.trim()) {
        // Content received even if ok is false - treat as success
        setCvSummary(data.tailoredSummary)
        setCvTailorMessage('Summary tailored for this job.')
        setCvStatus('ready')
        saveJobStateToStorage({
          cvSummary: data.tailoredSummary,
          statuses: {
            cv: 'ready',
            cover: coverStatus,
            application: applicationStatus,
            training: trainingStatus,
          },
        })
        setShouldRefetchInsight(prev => prev + 1)
      } else {
        setCvTailorMessage(data.error || 'Failed to tailor summary. Please try again.')
      }
    } catch (error) {
      console.error('Error tailoring CV:', error)
      // Only show error if we didn't get any content
      if (!cvSummary || cvSummary.trim().length === 0) {
        setCvTailorMessage('An error occurred. Please try again.')
      }
    } finally {
      setIsTailoringCv(false)
      stopLoading(requestId)
    }
  }

  const handleCopyToCV = () => {
    if (typeof window === 'undefined') return

    // Check if user has a saved CV (user-scoped)
    const hasCVKey = getUserKey('hasCV')
    const baseCvKey = getUserKey('baseCv')
    const hasCV = localStorage.getItem(hasCVKey) === 'true'
    const rawCv = localStorage.getItem(baseCvKey)

    if (!hasCV || !rawCv) {
      alert('No saved CV found. Please create one first.')
      return
    }

    try {
      const baseCv = JSON.parse(rawCv)
      // Update the summary field with the tailored summary
      baseCv.summary = cvSummary.trim() || baseCv.summary
      localStorage.setItem(baseCvKey, JSON.stringify(baseCv))
      
      setCvTailorMessage('Tailored summary copied to your CV.')
      
      // Note: CV status is already updated when AI Tailor Summary is clicked
      // No need to update again here
    } catch (error) {
      console.error('Error copying to CV:', error)
      setCvTailorMessage('Failed to copy to CV. Please try again.')
    }
  }

  const handleEditInCVBuilder = () => {
    // Save tailored summary to localStorage (user-scoped)
    if (typeof window !== 'undefined') {
      const summaryText = cvSummary
      const prefillKey = getUserKey('prefill_summary')

      if (summaryText && summaryText.trim().length > 0) {
        localStorage.setItem(prefillKey, summaryText)
      } else {
        localStorage.removeItem(prefillKey)
      }
    }

    // Construct URL with query params: cvId, jobId, and mode
    const cvId = searchParams?.get('cvId') || ''
    const jobIdValue = jobId || ''
    const mode = searchParams?.get('mode') || ''

    const params = new URLSearchParams()
    if (cvId) params.set('cvId', cvId)
    if (jobIdValue) params.set('jobId', jobIdValue)
    if (mode) params.set('mode', mode)

    const queryString = params.toString()
    const target = queryString ? `/cv-builder-v2?${queryString}` : '/cv-builder-v2'

    router.push(target)
  }

  const handleViewSavedCV = () => {
    // Reload CV summary from V2 storage before opening modal to ensure we have the latest
    if (typeof window !== 'undefined') {
      try {
        // Get cvId from URL search params first, then from localStorage
        const cvIdFromUrl = searchParams?.get('cvId') || null
        
        // Try to get cvId from localStorage (user-scoped)
        let cvId = cvIdFromUrl
        if (!cvId) {
          try {
            const jobInfoKey = getUserKey('job_info')
            const jobInfo = localStorage.getItem(jobInfoKey)
            if (jobInfo) {
              const parsed = JSON.parse(jobInfo)
              if (parsed.cvId) {
                cvId = parsed.cvId
              }
            }
          } catch (e) {
            // Ignore errors
          }
        }

        // Read CVs from V2 storage (user-scoped) (same logic as useEffect)
        let cvSummary: string | null = null
        
        const cvsKey = getUserKey('cvs')
        const rawCvs = localStorage.getItem(cvsKey)
        if (rawCvs) {
          try {
            const cvs = JSON.parse(rawCvs)
            if (Array.isArray(cvs) && cvs.length > 0) {
              let targetCv = null
              
              // If cvId is specified, find that CV
              if (cvId) {
                targetCv = cvs.find((cv: any) => cv.id === cvId)
              }
              
              // If no cvId or CV not found, get the latest CV
              if (!targetCv) {
                targetCv = cvs.reduce((latest, current) => {
                  const latestTime = latest?.savedAt ? new Date(latest.savedAt).getTime() : 0
                  const currentTime = current?.savedAt ? new Date(current.savedAt).getTime() : 0
                  return currentTime > latestTime ? current : latest
                }, cvs[cvs.length - 1])
              }
              
              // Get summary from the found CV
              if (targetCv && targetCv.summary && targetCv.summary.trim()) {
                cvSummary = targetCv.summary.trim()
              }
            }
          } catch (error) {
            console.error('Error parsing V2 CVs:', error)
          }
        }
        
        // Fallback to old storage only if V2 storage is empty (user-scoped)
        if (!cvSummary) {
          const hasCVKey = getUserKey('hasCV')
          const baseCvKey = getUserKey('baseCv')
          const hasCV = localStorage.getItem(hasCVKey) === 'true'
          const rawCv = localStorage.getItem(baseCvKey)
          
          if (hasCV && rawCv) {
            const baseCv: SavedCV = JSON.parse(rawCv)
            if (baseCv.summary && baseCv.summary.trim()) {
              cvSummary = baseCv.summary.trim()
            }
          }
        }

        if (cvSummary) {
          setSavedCVSummary(cvSummary)
          setHasSavedCV(true)
          setShowSavedCVModal(true)
        } else {
          // If no summary found, don't open modal
          setSavedCVSummary(null)
          setHasSavedCV(false)
        }
      } catch (error) {
        console.error('Error loading CV summary:', error)
        setSavedCVSummary(null)
        setHasSavedCV(false)
      }
    }
  }

  const handleCopySavedCVSummary = async () => {
    if (!savedCVSummary) return

    try {
      await navigator.clipboard.writeText(savedCVSummary)
      setCvTailorMessage('Saved CV summary copied to clipboard!')
      setTimeout(() => {
        setCvTailorMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      setCvTailorMessage('Failed to copy. Please try again.')
    }
  }

  const handleAIGenerateCoverLetter = async () => {
    if (!job) return

    const requestId = generateRequestId('ai-generate-cover-letter')
    const { startLoading, stopLoading } = useNextStepLoadingStore.getState()

    setIsGeneratingCover(true)
    setCoverMessage(null)
    startLoading(requestId)

    try {
      const response = await fetch('/api/job-details/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          baseText: coverLetterText || undefined,
        }),
      })

      const data = await response.json()

      // Consider success if we got content, even if response.ok is false
      const coverLetterContent = data.coverLetter || data.letter || ''
      if ((data.ok && coverLetterContent.trim()) || coverLetterContent.trim()) {
        // Clean the cover letter text to remove any heading and duplicate greetings
        const cleanedText = cleanJobDetailsCoverLetter(coverLetterContent)
        // Get user name from saved CV or cover letter, fallback to "Your Name" (user-scoped)
        let userName = 'Your Name'
        try {
          const hasCVKey = getUserKey('hasCV')
          const baseCvKey = getUserKey('baseCv')
          const hasCV = localStorage.getItem(hasCVKey) === 'true'
          const rawCv = localStorage.getItem(baseCvKey)
          if (hasCV && rawCv) {
            const baseCv = JSON.parse(rawCv)
            if (baseCv.fullName && baseCv.fullName.trim()) {
              userName = baseCv.fullName.trim()
            }
          }
          // Also check saved cover letter (user-scoped)
          const hasCoverLetterKey = getUserKey('hasCoverLetter')
          const baseCoverKey = getUserKey('baseCoverLetter')
          const hasCoverLetter = localStorage.getItem(hasCoverLetterKey) === 'true'
          const rawCover = localStorage.getItem(baseCoverKey)
          if (hasCoverLetter && rawCover) {
            const baseCover = JSON.parse(rawCover)
            if (baseCover.applicantName && baseCover.applicantName.trim()) {
              userName = baseCover.applicantName.trim()
            }
          }
        } catch (error) {
          console.error('Error getting user name:', error)
        }
        const final = cleanCoverLetterClosing(cleanedText, userName)
        setCoverLetterText(final)
        setCoverMessage('Cover letter generated for this job.')
        
        // Immediately update Cover Letter status to ready
        setCoverStatus('ready')
        saveJobStateToStorage({
          coverLetterText: final,
          statuses: {
            cv: cvStatus,
            cover: 'ready',
            application: applicationStatus,
            training: trainingStatus,
          },
        })
        
        // Trigger instant refetch of JAZ Insight
        setShouldRefetchInsight(prev => prev + 1)
      } else {
        // Only show error if we didn't get any content
        setCoverMessage('Failed to generate cover letter. Please try again.')
      }
    } catch (error) {
      console.error('Error generating cover letter:', error)
      // Only show error if we didn't get any content
      if (!coverLetterText || coverLetterText.trim().length === 0) {
        setCoverMessage('An error occurred. Please try again.')
      }
    } finally {
      setIsGeneratingCover(false)
      stopLoading(requestId)
    }
  }

  const handleCopyToCoverLetter = () => {
    if (typeof window === 'undefined') return

    // Check if user has a saved cover letter (user-scoped)
    const hasCoverLetterKey = getUserKey('hasCoverLetter')
    const baseCoverKey = getUserKey('baseCoverLetter')
    const hasCoverLetter = localStorage.getItem(hasCoverLetterKey) === 'true'
    const rawCover = localStorage.getItem(baseCoverKey)

    if (!hasCoverLetter || !rawCover) {
      alert('No saved Cover Letter found. Please create one first.')
      return
    }

    try {
      const baseCover = JSON.parse(rawCover)
      // Update the bodyText field with the generated cover letter
      baseCover.bodyText = coverLetterText.trim() || baseCover.bodyText
      localStorage.setItem(baseCoverKey, JSON.stringify(baseCover))
      
      setCoverMessage('Cover letter copied to your main cover letter.')
      
      // Note: Cover letter status is already updated when AI Generate Cover Letter is clicked
      // No need to update again here
    } catch (error) {
      console.error('Error copying to cover letter:', error)
      setCoverMessage('Failed to copy to cover letter. Please try again.')
    }
  }

  const handleEditInCoverLetterBuilder = async () => {
    if (!job) return
    
    // Get job description from Reed job or fallback to description field
    const jobDescription = (job as any)?._reedJob?.fullDescription || 
                          (job as any)?._reedJob?.jobDescription || 
                          job.description || 
                          ''
    
    // Create draft object with job details and generated cover letter
    // Clean the cover letter text before saving to ensure no heading or duplicate greetings
    const cleanedBody = coverLetterText ? cleanJobDetailsCoverLetter(coverLetterText) : ''
    const draft = {
      jobTitle: job.title || '',
      company: job.company || '',
      jobDescription: jobDescription,
      body: cleanedBody,
      savedAt: Date.now(),
    }
    
    // Save draft to localStorage (user-scoped)
    if (typeof window !== 'undefined') {
      try {
        const draftKey = getUserKey('cover-draft')
        window.localStorage.setItem(draftKey, JSON.stringify(draft))
        // Ensure flush before navigation
        await Promise.resolve()
      } catch (error) {
        console.error('Error saving cover letter draft to localStorage:', error)
      }
    }
    
    // Build returnTo URL for navigation back
    const returnTo = window.location.pathname + window.location.search
    
    // Navigate to cover letter builder with query params
    router.push(`/cover?mode=tailorCv&from=jobDetails&returnTo=${encodeURIComponent(returnTo)}&ts=${Date.now()}`)
  }

  const scrollToFullDescription = () => {
    fullDescRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Helper function to create a preview description
  const getJobDescriptionPreview = (): string => {
    if (!job?.description) return ''
    
    const cleanedBlocks = cleanJobDescription(job.description)
    
    // Get first 2-3 sentences from paragraphs
    let previewText = ''
    for (const block of cleanedBlocks) {
      if (block.type === 'paragraph') {
        const sentences = block.text.split(/[.!?]+/).filter(s => s.trim().length > 0)
        previewText += sentences.slice(0, 2).join('. ').trim()
        if (sentences.length > 0) previewText += '.'
        if (previewText.length > 0) break
      }
    }
    
    // If no paragraph found, try to get text from first list items
    if (!previewText) {
      for (const block of cleanedBlocks) {
        if (block.type === 'list' && block.items.length > 0) {
          previewText = block.items[0]
          break
        }
      }
    }
    
    // Fallback: use raw description and truncate
    if (!previewText) {
      // Strip HTML tags and get first 240 characters
      const rawText = job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      previewText = rawText.substring(0, 240)
      if (rawText.length > 240) {
        // Try to end at a sentence boundary
        const lastPeriod = previewText.lastIndexOf('.')
        const lastExclamation = previewText.lastIndexOf('!')
        const lastQuestion = previewText.lastIndexOf('?')
        const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion)
        if (lastSentenceEnd > 100) {
          previewText = previewText.substring(0, lastSentenceEnd + 1)
        } else {
          previewText += '...'
        }
      }
    } else if (previewText.length > 260) {
      // Truncate if too long
      const truncated = previewText.substring(0, 240)
      const lastPeriod = truncated.lastIndexOf('.')
      if (lastPeriod > 100) {
        previewText = truncated.substring(0, lastPeriod + 1)
      } else {
        previewText = truncated + '...'
      }
    }
    
    return previewText || 'Job description available below.'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9b5cff] mb-4"></div>
          <p className="text-gray-400">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    // Extract job ID for display (remove prefix if present)
    const displayJobId = jobId?.replace(/^(adzuna_|reed_)/, '') || jobId || 'Unknown'
    
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                {error || 'Job not found'}
              </h2>
              {error && jobId && (
                <p className="text-slate-400 text-sm mb-2">
                  Job ID: {displayJobId}
                </p>
              )}
              <p className="text-slate-500 text-sm">
                {jobId?.startsWith('adzuna_') 
                  ? 'The job may have been removed from Adzuna or the ID is incorrect.'
                  : jobId?.startsWith('reed_')
                  ? 'The job may have been removed from Reed or the ID is incorrect.'
                  : 'The job may have been removed or the ID is incorrect.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/job-finder')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#9b5cff] to-[#8a4ae8] hover:from-[#8a4ae8] hover:to-[#7a3ad8] text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Job Finder
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell className="max-w-7xl">
        <PageHeader
          title={job.title}
          subtitle="Job Details"
          showBackToJobFinder={true}
        />
        
        {/* JAZ Insight - Show when user is ready */}
        {isReadyToApply && (
          <div className="mb-4 p-3 rounded-xl bg-violet-900/20 border border-violet-700/50">
            <p className="text-sm text-violet-200">
              <span className="font-semibold text-violet-300">JAZ Insight:</span>{' '}
              Your CV and cover letter look ready. You can apply now or make final improvements below.
            </p>
          </div>
        )}
        
        {/* Job Info */}
        <div className="mb-8 flex flex-wrap items-center gap-4 text-gray-400">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            <span className="text-[#9b5cff] font-medium">{job.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>{job.location}</span>
          </div>
          {job.type && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{job.type}</span>
            </div>
          )}
        </div>

        {/* Responsive Grid: Preparation Status + CV/Cover Letter */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,400px)_minmax(0,1fr)] gap-6 mt-6">
          {/* Column 1: Preparation Status + Apply Assistant Panel */}
          <div className="space-y-4">
            {/* Preparation Status - Status Only, Smaller, Muted */}
            <section className="rounded-xl border border-slate-700/40 bg-slate-950/40 shadow-sm p-3 space-y-2">
              <h2 className="text-sm font-heading font-medium text-slate-400">Preparation Status</h2>
              <div className="space-y-1.5">
                {/* CV Status */}
                <div className="flex items-center gap-2 py-1.5 bg-[#0D0D0D]/50 rounded-lg border border-gray-800/50 px-2.5">
                  <div className={`flex-shrink-0 ${cvStatus === 'ready' ? 'text-green-500/70' : 'text-gray-500/60'}`}>
                    {cvStatus === 'ready' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-300 text-xs">CV</p>
                    <p className="text-xs text-slate-500 truncate">
                      {cvStatus === 'ready' ? 'Ready' : 'Not Ready'}
                    </p>
                  </div>
                </div>

                {/* Cover Letter Status */}
                <div className="flex items-center gap-2 py-1.5 bg-[#0D0D0D]/50 rounded-lg border border-gray-800/50 px-2.5">
                  <div className={`flex-shrink-0 ${coverStatus === 'ready' ? 'text-green-500/70' : 'text-gray-500/60'}`}>
                    {coverStatus === 'ready' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-300 text-xs">Cover Letter</p>
                    <p className="text-xs text-slate-500 truncate">
                      {coverStatus === 'ready' ? 'Ready' : 'Not Ready'}
                    </p>
                  </div>
                </div>

                {/* Application Status */}
                <div className="flex items-center gap-2 py-1.5 bg-[#0D0D0D]/50 rounded-lg border border-gray-800/50 px-2.5">
                  <div className={`flex-shrink-0 ${applicationStatus === 'submitted' ? 'text-green-500/70' : 'text-gray-500/60'}`}>
                    {applicationStatus === 'submitted' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-300 text-xs">Application</p>
                    <p className="text-xs text-slate-500 truncate">
                      {applicationStatus === 'submitted' ? 'Submitted' : 'Not Submitted'}
                    </p>
                  </div>
                </div>

                {/* Interview Training Status */}
                <div className="flex items-center gap-2 py-1.5 bg-[#0D0D0D]/50 rounded-lg border border-gray-800/50 px-2.5">
                  <div className={`flex-shrink-0 ${trainingStatus === 'available' ? 'text-green-500/70' : 'text-gray-500/60'}`}>
                    {trainingStatus === 'available' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-300 text-xs">Interview Training</p>
                    <p className="text-xs text-slate-500 truncate">
                      {trainingStatus === 'available' ? 'Completed' : 'Not Started'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Apply Assistant Panel (moved here from Column 3) */}
            <ApplyAssistantPanel
              jobId={jobId}
              job={{
                title: job.title,
                company: job.company,
                description: job.description,
                location: job.location,
              }}
              onApply={handleApply}
              cvStatus={cvHasContent ? 'ready' : cvStatus}
              coverStatus={coverHasContent ? 'ready' : coverStatus}
              applicationStatus={applicationStatus}
              trainingStatus={trainingStatus}
              onOptimizeCV={handleOptimizeCV}
              onGenerateCoverLetter={handleGenerateCoverLetter}
              onTrainInterview={handleTrainForInterview}
              cvSummary={cvSummary}
              coverLetterText={coverLetterText}
              shouldRefetch={shouldRefetchInsight > 0}
            />
          </div>

          {/* Column 2: CV + Cover letter (expanded to fill space) */}
          <div className="space-y-6">
            {/* Job Snapshot */}
            {job.description && (
              <section className="mb-4 rounded-2xl border border-slate-700/60 bg-slate-950/70 px-4 py-3">
                <h3 className="text-xs md:text-sm font-semibold text-slate-100 mb-1">
                  Job Snapshot
                </h3>
                <p className="text-xs md:text-sm text-slate-300 line-clamp-3">
                  {getJobDescriptionPreview()}
                </p>
                <button
                  type="button"
                  className="mt-2 text-[11px] md:text-xs text-violet-300 hover:text-violet-100 transition-colors"
                  onClick={scrollToFullDescription}
                >
                  Show full description ↓
                </button>
              </section>
            )}

            {/* CV Tailoring Panel */}
            <div ref={cvPanelRef} className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
              <h2 className="text-xl font-heading font-semibold mb-2">CV for this job</h2>
              <p className="text-gray-400 text-sm mb-4">Adjust your CV summary to match this role.</p>
              
              <div className="space-y-4">
                <textarea
                  value={cvSummary}
                  onChange={(e) => setCvSummary(e.target.value)}
                  placeholder="Enter your CV summary..."
                  className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9b5cff] focus:border-transparent resize-y min-h-[120px]"
                  rows={5}
                />
                
                {cvTailorMessage && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${
                    cvTailorMessage.includes('Failed') || cvTailorMessage.includes('error')
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-green-500/20 border border-green-500/50 text-green-400'
                  }`}>
                    {cvTailorMessage}
                  </div>
                )}
                
                <div className="flex gap-3 flex-wrap">
                  <button
                    id="jobaz-tailor-summary-btn"
                    onClick={handleAITailorSummary}
                    disabled={isTailoringCv}
                    title="Matches your CV to this role's keywords"
                    className="flex-1 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isTailoringCv ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Tailoring...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI Tailor Summary
                      </>
                    )}
                  </button>
                  
                  {hasSavedCV && (
                    <button
                      onClick={handleViewSavedCV}
                      className="rounded-full bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <FileText className="w-4 h-4" />
                      View my saved CV
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyToCV}
                    className="flex-1 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to your CV
                  </button>
                  
                  <button
                    onClick={handleEditInCVBuilder}
                    className="flex-1 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit in CV Builder
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Letter Panel */}
            <div ref={coverLetterPanelRef} className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-4">
              <h2 className="text-xl font-heading font-semibold mb-2">Cover letter for this job</h2>
              <p className="text-gray-400 text-sm mb-4">Create a tailored cover letter based on this role and your CV.</p>
              
              <div className="space-y-4">
                <textarea
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  placeholder="Enter your cover letter..."
                  className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9b5cff] focus:border-transparent resize-y min-h-[200px]"
                  rows={10}
                />
                
                {coverMessage && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${
                    coverMessage.includes('Failed') || coverMessage.includes('error')
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-green-500/20 border border-green-500/50 text-green-400'
                  }`}>
                    {coverMessage}
                  </div>
                )}
                
                <div className="flex gap-3 flex-wrap">
                  <button
                    id="jobaz-generate-cover-btn"
                    onClick={handleAIGenerateCoverLetter}
                    disabled={isGeneratingCover}
                    className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingCover ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI Generate Cover Letter
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyToCoverLetter}
                    className="flex-1 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy to your Cover Letter
                  </button>
                  
                  <button
                    onClick={handleEditInCoverLetterBuilder}
                    className="flex-1 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit in Cover Letter Builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description Sections */}
        <div className="space-y-6 mt-6">
          {/* Full Job Description */}
          {job.description && (() => {
            const cleanedBlocks = cleanJobDescription(job.description)
            const INITIAL_BLOCKS_TO_SHOW = 5
            const shouldTruncate = cleanedBlocks.length > INITIAL_BLOCKS_TO_SHOW
            const blocksToShow = showFullDescription || !shouldTruncate 
              ? cleanedBlocks 
              : cleanedBlocks.slice(0, INITIAL_BLOCKS_TO_SHOW)

            return (
              <div ref={fullDescRef} className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6">
                <h2 className="text-xl font-heading font-semibold mb-4">Job Description</h2>
                
                <div className="max-h-72 overflow-y-auto pr-2 space-y-3">
                  {blocksToShow.map((block, i) => {
                    if (block.type === 'paragraph') {
                      return (
                        <p key={i} className="text-sm leading-relaxed text-slate-200">
                          <TranslatableText text={block.text}>
                            {block.text}
                          </TranslatableText>
                        </p>
                      )
                    }
                    if (block.type === 'list') {
                      return (
                        <ul key={i} className="list-disc list-inside space-y-1 text-sm text-slate-200">
                          {block.items.map((item, j) => (
                            <li key={j}>
                              <TranslatableText text={item}>
                                {item}
                              </TranslatableText>
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    return null
                  })}
                </div>

                {shouldTruncate && !showFullDescription && (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setShowFullDescription(true)}
                      className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                    >
                      Show full description
                    </button>
                    <span className="text-gray-500 text-sm">|</span>
                    <button
                      onClick={() => setShowDescriptionModal(true)}
                      className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                    >
                      Review full description
                    </button>
                  </div>
                )}

                {shouldTruncate && showFullDescription && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowDescriptionModal(true)}
                      className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                    >
                      Review full description
                    </button>
                  </div>
                )}

                {/* Full Description Modal */}
                {showDescriptionModal && (
                  <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setShowDescriptionModal(false)
                      }
                    }}
                  >
                    <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-xl relative">
                      <button
                        onClick={() => setShowDescriptionModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      
                      <h2 className="text-2xl font-heading font-semibold mb-4 pr-8">Job Description</h2>
                      
                      <div className="space-y-3">
                        {cleanedBlocks.map((block, i) => {
                          if (block.type === 'paragraph') {
                            return (
                              <p key={i} className="text-sm leading-relaxed text-slate-200">
                                {block.text}
                              </p>
                            )
                          }
                          if (block.type === 'list') {
                            return (
                              <ul key={i} className="list-disc list-inside space-y-1 text-sm text-slate-200">
                                {block.items.map((item, j) => (
                                  <li key={j}>{item}</li>
                                ))}
                              </ul>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved CV Summary Modal */}
                {showSavedCVModal && savedCVSummary && (
                  <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setShowSavedCVModal(false)
                      }
                    }}
                  >
                    <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl relative">
                      <button
                        onClick={() => setShowSavedCVModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      
                      <h2 className="text-2xl font-heading font-semibold mb-4 pr-8">My saved CV summary</h2>
                      
                      <div className="space-y-4">
                        <textarea
                          readOnly
                          value={savedCVSummary}
                          className="w-full bg-[#0D0D0D] border border-gray-800 rounded-xl px-4 py-3 text-white resize-none min-h-[200px] focus:outline-none"
                          rows={10}
                        />
                        
                        <div className="flex gap-3">
                          <button
                            onClick={handleCopySavedCVSummary}
                            className="flex-1 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/60 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy summary
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Requirements */}
          {job.requirements && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Requirements</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          {/* Responsibilities */}
          {job.duties && (
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/60 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-400/60 hover:shadow-[0_18px_50px_rgba(76,29,149,0.7)] transition p-6">
              <h2 className="text-xl font-heading font-semibold mb-4">Responsibilities</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{job.duties}</p>
            </div>
          )}
        </div>
    </AppShell>
  )
}

