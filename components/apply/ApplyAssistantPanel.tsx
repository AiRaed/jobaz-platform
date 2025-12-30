'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown, RefreshCw, Copy, ExternalLink, CheckCircle2, X, Bot, FileText, Mail, Send, GraduationCap, AlertCircle, Loader2, Sparkles, Target } from 'lucide-react'
import { useTranslationSettings } from '@/contexts/TranslationSettingsContext'
import { useJazStore } from '@/lib/jaz-store'
import { NextStepLoadingCard } from '@/components/NextStepLoadingCard'
import { useNextStepLoadingStore, generateRequestId } from '@/lib/next-step-loading-store'
import { getBaseCvAnyScope } from '@/lib/cv-storage'

interface ApplyAssistantPanelProps {
  jobId: string
  job: {
    title: string
    company?: string
    description?: string
    location?: string
  }
  language?: 'EN' | 'AR' | 'FA' | 'KU' | 'ES' | 'PL'
  onApply?: () => void
  // Status props to determine next step
  cvStatus?: 'not-tailored' | 'ready'
  coverStatus?: 'not-created' | 'ready'
  applicationStatus?: 'not-submitted' | 'submitted'
  trainingStatus?: 'not-available' | 'available'
  // Handler callbacks
  onOptimizeCV?: () => void
  onGenerateCoverLetter?: () => void
  onTrainInterview?: () => void
  // Reactive props for insight recalculation
  cvSummary?: string
  coverLetterText?: string
  // Flag to trigger instant refetch (e.g., after AI actions)
  shouldRefetch?: boolean
}

type ApplyAssistantResult = {
  jobAnalysis: {
    requiredSkills?: string[]
    responsibilities?: string[]
    keywords?: string[]
    seniorityLevel?: string
  }
  comparison: {
    matchingSkills?: string[]
    missingSkills?: string[]
    strengths?: string[]
    risks?: string[]
  }
  fitScore: {
    score: number
    strengths?: string[]
    weaknesses?: string[]
  }
  improvedSummary: string
  coverLetter: string
  actionPlan: string // Will be parsed into array
}

// Parse action plan string into checklist items
function parseActionPlan(actionPlan: string): string[] {
  if (!actionPlan) return []
  
  // Split by lines and filter empty
  const lines = actionPlan.split('\n').filter(line => line.trim())
  
  // Extract numbered items or bullet points
  return lines
    .map(line => {
      // Remove numbering (1., 2., etc.) or bullets (-, •, *)
      const cleaned = line.replace(/^\d+[.)]\s*/, '').replace(/^[-•*]\s*/, '').trim()
      return cleaned
    })
    .filter(item => item.length > 0)
}

function getFitScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent match', color: 'text-green-400' }
  if (score >= 60) return { label: 'Strong match', color: 'text-yellow-400' }
  if (score >= 40) return { label: 'Growing match', color: 'text-orange-400' }
  return { label: 'Early-stage match', color: 'text-red-400' }
}

export default function ApplyAssistantPanel({ 
  jobId, 
  job, 
  language, 
  onApply,
  cvStatus = 'not-tailored',
  coverStatus = 'not-created',
  applicationStatus = 'not-submitted',
  trainingStatus = 'not-available',
  onOptimizeCV,
  onGenerateCoverLetter,
  onTrainInterview,
  cvSummary: propCvSummary,
  coverLetterText: propCoverLetterText,
  shouldRefetch = false,
}: ApplyAssistantPanelProps) {
  const router = useRouter()
  const { targetLanguage: globalLanguage } = useTranslationSettings()
  const { openJaz } = useJazStore()
  
  const finalLanguage = language || globalLanguage || 'EN'
  const [isMobile, setIsMobile] = useState(false)
  // Desktop: open by default; Mobile: closed by default
  const [isOpen, setIsOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ApplyAssistantResult | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Analysis status: idle | analyzing | ready
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'ready'>('idle')
  
  // AbortController for canceling previous requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // On desktop, ensure panel stays open; on mobile, close if transitioning from desktop
      if (!mobile && !isOpen) {
        setIsOpen(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isOpen])

  // Track request ID to ensure only latest response is applied
  const latestRequestIdRef = useRef<number>(0)

  // Load from cache or fetch data
  const loadData = useCallback(async (forceRefresh = false, useProps = false) => {
    if (!jobId || !job) return

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Generate request ID for this call
    const requestId = ++latestRequestIdRef.current

    const cacheKey = `jobaz_apply_assistant_${jobId}_${finalLanguage}`
    
    // Try cache first (unless force refresh)
    if (!forceRefresh && typeof window !== 'undefined' && !useProps) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          // Only apply if this is still the latest request
          if (requestId === latestRequestIdRef.current) {
            setResult(parsed)
            setError(null)
            // Set status to ready if we have cached data
            setAnalysisStatus('ready')
          }
          return
        }
      } catch (e) {
        console.warn('Failed to load cached result:', e)
      }
    }

    // Track loading for next step updates - start early so loading card appears immediately
    const loadingRequestId = generateRequestId('apply-assistant')
    const { startLoading, stopLoading } = useNextStepLoadingStore.getState()
    startLoading(loadingRequestId)
    
    // Set analysis status to analyzing
    setAnalysisStatus('analyzing')

    // Load CV data - prefer props if provided, otherwise fallback to localStorage
    let cvSummary = propCvSummary || ''
    let cvExperience: Array<{ title?: string; company?: string; duration?: string; description?: string }> = []
    let cvSkills: string[] = []

    // Only load from localStorage if props not provided
    if (!propCvSummary) {
      try {
        // Use shared helper to get CV from any scope
        const { hasCv, cv } = getBaseCvAnyScope()
        
        if (hasCv && cv) {
          cvSummary = cv.summary || ''
          cvSkills = Array.isArray(cv.skills) ? cv.skills : []
          
          // Convert experience format (handle both V2 and legacy formats)
          if (Array.isArray(cv.experience)) {
            cvExperience = cv.experience.map((exp: any) => ({
              title: exp.jobTitle || exp.title || exp.role,
              company: exp.company,
              duration: exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : undefined,
              description: Array.isArray(exp.bullets) ? exp.bullets.join('\n') : exp.description || '',
            }))
          }
        }
      } catch (e) {
        console.error('Error loading CV:', e)
      }
    }

    // Check if CV exists
    if (!cvSummary && cvExperience.length === 0 && cvSkills.length === 0) {
      // Only set error if this is still the latest request
      if (requestId === latestRequestIdRef.current) {
        setError('cv-missing')
        setLoading(false)
      }
      stopLoading(loadingRequestId)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/apply-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: {
            title: job.title,
            company: job.company || '',
            description: job.description || '',
          },
          cv: {
            summary: cvSummary,
            experience: cvExperience,
            skills: cvSkills,
          },
          language: finalLanguage,
        }),
        signal: abortController.signal,
      })

      // Check if request was aborted
      if (abortController.signal.aborted) {
        stopLoading(loadingRequestId)
        return
      }

      const data = await response.json()
      
      // Check again if request was aborted after response
      if (abortController.signal.aborted) {
        stopLoading(loadingRequestId)
        return
      }
      
      // Only apply result if this is still the latest request (prevent stale responses)
      if (requestId !== latestRequestIdRef.current) {
        stopLoading(loadingRequestId)
        return
      }
      
      // Consider success if we got content, even if response.ok is false
      if (!response.ok && (!data || !data.fitScore || data.fitScore.score === 0)) {
        throw new Error(data?.error || 'Failed to fetch analysis')
      }
      
      // Transform API response to match our type
      const transformed: ApplyAssistantResult = {
        jobAnalysis: {
          requiredSkills: data.jobAnalysis?.requiredSkills || [],
          responsibilities: data.jobAnalysis?.responsibilities || [],
          keywords: data.jobAnalysis?.keywords || [],
          seniorityLevel: data.jobAnalysis?.seniorityLevel,
        },
        comparison: {
          matchingSkills: data.comparison?.matchingSkills || [],
          missingSkills: data.comparison?.missingSkills || [],
          strengths: data.comparison?.strengths || [],
          risks: data.comparison?.risks || [],
        },
        fitScore: {
          score: data.fitScore?.score || 0,
          strengths: data.fitScore?.strengths || [],
          weaknesses: data.fitScore?.weaknesses || [],
        },
        improvedSummary: data.improvedSummary || '',
        coverLetter: data.coverLetter || '',
        actionPlan: data.actionPlan || '',
      }

      // Only apply if this is still the latest request
      if (requestId === latestRequestIdRef.current) {
        setResult(transformed)
        
        // Cache result
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(transformed))
        }
        
        // Set analysis status to ready after result is set
        setAnalysisStatus('ready')
      }
      
      // Stop loading only after result is successfully set and cached
      stopLoading(loadingRequestId)
    } catch (err: any) {
      // Don't set error if request was aborted
      if (err.name === 'AbortError') {
        stopLoading(loadingRequestId)
        return
      }
      
      // Only handle error if this is still the latest request
      if (requestId !== latestRequestIdRef.current) {
        stopLoading(loadingRequestId)
        return
      }
      
      console.error('Error fetching apply assistant data:', err)
      // Only set error if we didn't get any result
      if (!result) {
        setError(err.message || 'Failed to analyze job application')
        // If no result, keep status as analyzing to hide old data
        setAnalysisStatus('analyzing')
      } else {
        // If we have a previous result, keep status as ready
        // Show non-blocking warning near Recommended Next Step
        setAnalysisStatus('ready')
      }
      // Stop loading on error (but keep result if exists)
      stopLoading(loadingRequestId)
    } finally {
      // Only set loading to false if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
      // Note: stopLoading is called in catch block, not here
      // This ensures loading stops only after result is set or error occurs
    }
  }, [jobId, job, finalLanguage, propCvSummary, result])

  // Helper function to create a key from all relevant inputs for recompute detection
  // Uses trimmed text and hashes/slices large content to keep key short
  const getNextStepKey = useCallback((): string => {
    const trimmedCv = (propCvSummary || '').trim()
    const trimmedCover = (propCoverLetterText || '').trim()
    
    // Create a short hash by taking first 200 chars and length
    const cvKey = trimmedCv.length > 0 
      ? `${trimmedCv.slice(0, 200)}|${trimmedCv.length}` 
      : ''
    const coverKey = trimmedCover.length > 0 
      ? `${trimmedCover.slice(0, 200)}|${trimmedCover.length}` 
      : ''
    
    // Job identity: provider + jobId + title/company (first 50 chars each)
    const jobTitle = (job?.title || '').slice(0, 50)
    const jobCompany = (job?.company || '').slice(0, 50)
    
    // Combine all inputs into a key
    return `${jobId}|${jobTitle}|${jobCompany}|${cvKey}|${coverKey}|${cvStatus}|${coverStatus}`
  }, [jobId, job?.title, job?.company, propCvSummary, propCoverLetterText, cvStatus, coverStatus])

  // Track last computed key and debounce timer to prevent duplicate calls
  const lastComputedKeyRef = useRef<string>('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevShouldRefetchRef = useRef<boolean>(false)
  const isAIActionRef = useRef<boolean>(false)

  // Unified recompute trigger - watches for key changes
  useEffect(() => {
    const currentKey = getNextStepKey()
    
    // Check if shouldRefetch changed (AI action completed)
    const shouldRefetchChanged = shouldRefetch && !prevShouldRefetchRef.current
    prevShouldRefetchRef.current = shouldRefetch || false
    
    // If key hasn't changed and shouldRefetch didn't change, no need to recompute
    if (currentKey === lastComputedKeyRef.current && !shouldRefetchChanged) {
      return
    }

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Determine if this is an AI action (shouldRefetch flag changed) or manual typing
    // AI actions should trigger immediately, typing should be debounced
    const isAIAction = shouldRefetchChanged || isAIActionRef.current
    isAIActionRef.current = false // Reset flag after checking

    const triggerRecompute = () => {
      // Update last computed key when launching request
      lastComputedKeyRef.current = currentKey
      
      // Trigger loadData with force refresh and use props
      loadData(true, true)
    }

    if (isAIAction) {
      // AI actions: trigger immediately (no debounce)
      triggerRecompute()
    } else {
      // Manual typing: debounce (800-1200ms range, using 1000ms)
      debounceTimerRef.current = setTimeout(() => {
        triggerRecompute()
      }, 1000)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [getNextStepKey, shouldRefetch, loadData])

  // Load data when panel opens for the first time
  useEffect(() => {
    if (isOpen && !result && !loading && !error) {
      // Reset key on first load to ensure initial analysis runs
      lastComputedKeyRef.current = ''
      loadData()
    }
  }, [isOpen, result, loading, error, loadData])

  // Reset computed key when job changes (switching to another job)
  useEffect(() => {
    lastComputedKeyRef.current = ''
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [jobId])


  const handleRefresh = () => {
    loadData(true)
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast({ message: `${label} copied to clipboard!`, type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast({ message: 'Failed to copy to clipboard', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleCopySummary = () => {
    if (result?.improvedSummary) {
      handleCopy(result.improvedSummary, 'Summary')
    }
  }

  const handleCopyCoverLetter = () => {
    if (result?.coverLetter) {
      handleCopy(result.coverLetter, 'Cover letter')
    }
  }

  const handleOpenCVBuilder = () => {
    if (result?.improvedSummary) {
      localStorage.setItem('jobaz_prefill_summary', result.improvedSummary)
    }
    router.push('/cv-builder-v2')
  }

  const handleOpenCoverBuilder = () => {
    if (result?.coverLetter && job) {
      const draft = {
        jobTitle: job.title || '',
        company: job.company || '',
        jobDescription: job.description || '',
        body: result.coverLetter,
        savedAt: Date.now(),
      }
      localStorage.setItem('jobaz-cover-draft', JSON.stringify(draft))
    }
    router.push('/cover?mode=tailorCv')
  }

  const handleTrainInterview = () => {
    const query = new URLSearchParams({
      jobId: jobId,
      title: job.title,
      company: job.company || '',
    }).toString()
    router.push(`/interview-coach?${query}`)
  }

  const handleOpenJAZ = () => {
    openJaz('apply', {
      title: job.title,
      company: job.company || '',
      description: job.description || '',
      id: jobId,
    })
  }

  const handleToggleCheckItem = (index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const actionPlanItems = useMemo(() => {
    return result?.actionPlan ? parseActionPlan(result.actionPlan) : []
  }, [result?.actionPlan])

  const fitScoreInfo = result ? getFitScoreLabel(result.fitScore.score) : { label: '', color: '' }

  // Determine next step based on status
  type NextStep = {
    name: string
    description: string
    primaryAction: {
      label: string
      onClick: () => void
      icon: JSX.Element
    }
  }

  const getNextStep = useCallback((): NextStep | null => {
    // Step 1: Optimize CV (if CV not tailored)
    if (cvStatus === 'not-tailored') {
      return {
        name: 'Optimize CV',
        description: 'Tailor your CV summary to match this job description',
        primaryAction: {
          label: 'Optimize CV',
          onClick: () => {
            if (onOptimizeCV) {
              onOptimizeCV()
            } else {
              handleOpenCVBuilder()
            }
          },
          icon: <FileText className="w-4 h-4" />,
        },
      }
    }

    // Step 2: Generate Cover Letter (if CV ready but cover not created)
    if (cvStatus === 'ready' && coverStatus === 'not-created') {
      return {
        name: 'Generate Cover Letter',
        description: 'Create a tailored cover letter for this position',
        primaryAction: {
          label: 'Generate Cover Letter',
          onClick: () => {
            if (onGenerateCoverLetter) {
              onGenerateCoverLetter()
            } else {
              handleOpenCoverBuilder()
            }
          },
          icon: <Mail className="w-4 h-4" />,
        },
      }
    }

    // Step 3: Apply (if both CV and cover ready but not applied)
    if (cvStatus === 'ready' && coverStatus === 'ready' && applicationStatus === 'not-submitted') {
      return {
        name: 'Apply for Job',
        description: 'You\'re ready to submit your application',
        primaryAction: {
          label: 'Apply for this job',
          onClick: () => {
            if (onApply) {
              onApply()
            }
          },
          icon: <Send className="w-4 h-4" />,
        },
      }
    }

    // Step 4: Train Interview (if application submitted)
    if (applicationStatus === 'submitted' && trainingStatus === 'available') {
      return {
        name: 'Train for Interview',
        description: 'Prepare for your interview with AI-powered training',
        primaryAction: {
          label: 'Train for Interview',
          onClick: () => {
            if (onTrainInterview) {
              onTrainInterview()
            } else {
              handleTrainInterview()
            }
          },
          icon: <GraduationCap className="w-4 h-4" />,
        },
      }
    }

    // All steps complete
    if (applicationStatus === 'submitted') {
      return {
        name: 'Application Submitted',
        description: 'Great job! Your application has been submitted.',
        primaryAction: {
          label: 'Train for Interview',
          onClick: () => {
            if (onTrainInterview) {
              onTrainInterview()
            } else {
              handleTrainInterview()
            }
          },
          icon: <GraduationCap className="w-4 h-4" />,
        },
      }
    }

    return null
  }, [cvStatus, coverStatus, applicationStatus, trainingStatus, onOptimizeCV, onGenerateCoverLetter, onApply, onTrainInterview])

  const nextStep = getNextStep()

  // Check if JAZ Insight is ready (fit score available)
  const isInsightReady = result && result.fitScore && result.fitScore.score > 0

  // Determine if "Match score is low" card should be shown (deterministic visibility)
  const shouldShowLowScoreCard = useMemo(() => {
    const threshold = 50 // Match score threshold
    
    // If we have a result with fitScore, check deterministically
    if (result && result.fitScore) {
      const matchScore = result.fitScore.score
      const topFixes = result.fitScore.weaknesses || []
      const topFixesCount = topFixes.length
      
      // Show if matchScore < threshold OR if there are top fixes
      const shouldShow = matchScore < threshold || topFixesCount > 0
      
      // Debug logging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.debug('[MatchScoreCard] Visibility decision', {
          matchScore,
          threshold,
          topFixesCount,
          shouldShow,
          loadingState: analysisStatus,
          hasResult: !!result,
          hasWeaknesses: topFixesCount > 0
        })
      }
      
      return shouldShow
    }
    
    // During loading/analyzing, we don't know yet, so return false
    // (skeleton will be handled separately in the render logic)
    return false
  }, [result, analysisStatus])

  // Determine if we should show skeleton placeholder (during loading when card might appear)
  const shouldShowSkeleton = useMemo(() => {
    // Show skeleton if we have a result with fitScore but weaknesses are not yet loaded
    // This ensures the card space is reserved during loading transitions
    if (result && result.fitScore) {
      const hasWeaknesses = result.fitScore.weaknesses && result.fitScore.weaknesses.length > 0
      const matchScore = result.fitScore.score || 0
      const threshold = 50
      
      // If score suggests card should appear but weaknesses aren't loaded yet, show skeleton
      if ((matchScore < threshold || matchScore === 0) && !hasWeaknesses) {
        return true
      }
    }
    return false
  }, [result])

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile handle button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/60 p-4 flex items-center justify-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Bot className="w-5 h-5" />
            <span className="font-medium">AI Apply Assistant</span>
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Mobile drawer */}
        {isOpen && (
          <>
            {/* Backdrop - pointer-events-none to allow page clicks, but pointer-events-auto for click to close */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 pointer-events-auto"
              onClick={() => setIsOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-700/60 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {/* Handle bar */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-violet-400" />
                  <h3 className="font-semibold text-white">AI Apply Assistant</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {renderContent()}
              </div>
            </div>
          </>
        )}

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg ${
            toast.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}>
            {toast.message}
          </div>
        )}
      </>
    )
  }

  // Desktop sticky sidebar
  function renderContent() {
    if (error === 'cv-missing') {
      return (
        <div className="rounded-xl bg-amber-500/20 border border-amber-500/50 p-4 text-amber-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">CV Required</p>
              <p className="text-sm text-amber-300/80">
                You need a base CV to use Apply Assistant. Go to CV Builder to create one.
              </p>
              <button
                onClick={() => router.push('/cv-builder-v2')}
                className="mt-3 text-sm underline hover:text-amber-300"
              >
                Open CV Builder →
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4 text-red-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Error</p>
              <p className="text-sm text-red-300/80">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-sm underline hover:text-red-300 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Always show result if available, even during loading
    // Only show placeholder if no result exists AND we're loading for the first time
    const showPlaceholder = !result && loading && !error && analysisStatus !== 'ready'
    
    if (showPlaceholder) {
      return (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition p-6 space-y-5">
          {/* Analyzing card - same style as re-analysis */}
          <div className="mb-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 hover:border-violet-500/50 transition-colors group">
            <div className="flex-shrink-0">
              <img 
                src="/jaz/jaz-eye.png" 
                alt="JAZ" 
                className="w-4 h-4 object-cover rounded-full animate-pulse" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-violet-300 mb-0.5">
                JAZ is analyzing…
              </div>
              <div className="text-xs text-slate-400">Updating match score & next steps</div>
            </div>
          </div>
          
          {/* Skeleton placeholders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-800/50 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-20 bg-slate-800/30 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-slate-800/30 rounded-lg animate-pulse"></div>
          </div>
        </div>
      )
    }

    // If no result and not loading, show next step only (no placeholder)
    if (!result) {
      return (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide">Recommended next step</h3>
            </div>
            <p className="text-xs text-slate-400">Based on your CV and current application progress</p>
            {nextStep ? (
              <>
                <h2 className="text-xl font-heading font-semibold text-white">{nextStep.name}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{nextStep.description}</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-heading font-semibold text-white">Analyzing Job...</h2>
                <p className="text-sm text-slate-300 leading-relaxed">Preparing your next steps</p>
              </>
            )}
          </div>

          {nextStep && (
            <button
              onClick={nextStep.primaryAction.onClick}
              className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
            >
              {nextStep.primaryAction.icon}
              {nextStep.primaryAction.label}
            </button>
          )}

          <div className="pt-3 border-t border-slate-700/50">
            <button
              onClick={handleOpenJAZ}
              className="w-full px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 border border-slate-700/50 hover:border-violet-400/50 hover:text-violet-300"
            >
              <Bot className="w-4 h-4" />
              Open AI Apply Assistant
            </button>
          </div>
        </div>
      )
    }

    // Show analyzing state: hide all results, show only analyzing card
    if (analysisStatus === 'analyzing') {
      return (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition p-6 space-y-5">
          {/* Analyzing card - same style as initial analysis */}
          <div className="mb-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 hover:border-violet-500/50 transition-colors group">
            <div className="flex-shrink-0">
              <img 
                src="/jaz/jaz-eye.png" 
                alt="JAZ" 
                className="w-4 h-4 object-cover rounded-full animate-pulse" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-violet-300 mb-0.5">
                JAZ is analyzing…
              </div>
              <div className="text-xs text-slate-400">Updating match score & next steps</div>
            </div>
          </div>
          
          {/* Skeleton placeholders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-slate-800/50 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-20 bg-slate-800/30 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-slate-800/30 rounded-lg animate-pulse"></div>
          </div>
        </div>
      )
    }

    // New streamlined card layout - only show when analysisStatus === 'ready'
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition p-6 space-y-5">
        {/* 1. Title: "Next Step" + step name */}
        {nextStep ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide">Recommended next step</h3>
            </div>
            <p className="text-xs text-slate-400">Based on your CV and current application progress</p>
            <h2 className="text-xl font-heading font-semibold text-white">{nextStep.name}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{nextStep.description}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide">Apply Assistant</h3>
            <p className="text-sm text-slate-300">Loading next steps...</p>
          </div>
        )}

        {/* 2. JAZ Insight (only if ready) */}
        {isInsightReady && result && (
          <div className="rounded-xl bg-gradient-to-br from-violet-900/30 to-slate-800/50 border border-violet-700/50 p-4 space-y-3 hover:border-violet-600/60 transition-colors group">
            <div className="flex items-center gap-2">
              <img 
                src="/jaz/jaz-eye.png" 
                alt="JAZ" 
                className="w-4 h-4 object-cover rounded-full group-hover:drop-shadow-[0_0_4px_rgba(139,92,246,0.6)] group-hover:drop-shadow-[0_0_8px_rgba(139,92,246,0.3)] transition-all duration-200" 
              />
              <h4 className="text-sm font-semibold text-violet-300">JAZ Insight</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{result.fitScore.score}</span>
                <span className={`text-sm font-medium ${fitScoreInfo.color}`}>
                  {fitScoreInfo.label} Match
                </span>
              </div>
              <div className="w-full bg-slate-800/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    result.fitScore.score >= 80 ? 'bg-green-500' :
                    result.fitScore.score >= 60 ? 'bg-yellow-500' :
                    result.fitScore.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.fitScore.score}%` }}
                />
              </div>
              {result.comparison.strengths && result.comparison.strengths.length > 0 && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.comparison.strengths[0]}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 3. Match score is low / Top fixes card (deterministic visibility) */}
        {(shouldShowLowScoreCard || shouldShowSkeleton) && (
          shouldShowLowScoreCard && result && result.fitScore && result.fitScore.weaknesses && result.fitScore.weaknesses.length > 0 ? (
            // Show actual content when data is available
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-amber-400 mb-1.5">Match score is low</h4>
                  <p className="text-xs text-slate-300 mb-2">Top fixes:</p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {result.fitScore.weaknesses.slice(0, 3).map((weakness, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Show skeleton placeholder during loading (same size as actual card)
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 animate-pulse">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-4 h-4 bg-amber-400/20 rounded-full flex-shrink-0 mt-0.5"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-amber-400/20 rounded w-32"></div>
                  <div className="h-3 bg-slate-300/10 rounded w-24"></div>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-300/10 rounded w-full"></div>
                    <div className="h-3 bg-slate-300/10 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-300/10 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* 4. Primary action button (context-based) */}
        {nextStep && (
          <button
            onClick={nextStep.primaryAction.onClick}
            className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
          >
            {nextStep.primaryAction.icon}
            {nextStep.primaryAction.label}
          </button>
        )}

        {/* 5. Optional supporting actions */}
        <div className="space-y-2">
          {/* Show Optimize CV if not the primary action and CV not ready */}
          {cvStatus === 'not-tailored' && nextStep?.name !== 'Optimize CV' && (
            <button
              onClick={() => {
                if (onOptimizeCV) {
                  onOptimizeCV()
                } else {
                  handleOpenCVBuilder()
                }
              }}
              className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 border border-slate-700/50 hover:border-violet-400/50"
            >
              <FileText className="w-4 h-4" />
              Optimize CV
            </button>
          )}

          {/* Show Generate Cover Letter if not the primary action and cover not ready */}
          {coverStatus === 'not-created' && nextStep?.name !== 'Generate Cover Letter' && cvStatus === 'ready' && (
            <button
              onClick={() => {
                if (onGenerateCoverLetter) {
                  onGenerateCoverLetter()
                } else {
                  handleOpenCoverBuilder()
                }
              }}
              className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 border border-slate-700/50 hover:border-violet-400/50"
            >
              <Mail className="w-4 h-4" />
              Generate Cover Letter
            </button>
          )}

          {/* Show Train Interview if not the primary action and available */}
          {trainingStatus === 'available' && nextStep?.name !== 'Train for Interview' && (
            <button
              onClick={() => {
                if (onTrainInterview) {
                  onTrainInterview()
                } else {
                  handleTrainInterview()
                }
              }}
              className="w-full px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 border border-slate-700/50 hover:border-violet-400/50"
            >
              <GraduationCap className="w-4 h-4" />
              Train Interview
            </button>
          )}
        </div>

        {/* 5. Secondary link/button: "Open AI Apply Assistant" (always visible) */}
        <div className="pt-3 border-t border-slate-700/50">
          <button
            onClick={handleOpenJAZ}
            className="w-full px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 border border-slate-700/50 hover:border-violet-400/50 hover:text-violet-300"
          >
            <Bot className="w-4 h-4" />
            Open AI Apply Assistant
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-[360px] flex-shrink-0">
        <div className="sticky top-4">
          {isOpen ? (
            <div className="space-y-3">
              {/* Content */}
              {renderContent()}
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="w-full rounded-2xl border border-slate-700/60 bg-slate-950/50 shadow-[0_18px_40px_rgba(15,23,42,0.85)] hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)] transition p-4 text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm font-medium">Show Apply Assistant</span>
            </button>
          )}
        </div>
      </aside>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-red-500/20 border border-red-500/50 text-red-400'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
