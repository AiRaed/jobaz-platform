'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Sparkles, Download, CheckCircle2, Save, Loader2, X } from 'lucide-react'
import { ComparePanel } from '@/components/ComparePanel'
import CoverPreview from '@/components/cover/Preview'
import { useCoverStore } from '@/lib/cover-store'
import { useCVStore } from '@/lib/store'
import { exportToPDF } from '@/lib/pdf'
import { exportToDocx } from '@/lib/docx'
import { cleanCoverLetterText, normalizeSummaryParagraph, stripPlaceholders, cleanJobDetailsCoverLetter, cleanCoverLetterClosing } from '@/lib/normalize'
import { AIPreviewText } from '@/components/AIPreviewText'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getJobInfo } from '@/lib/job-store'
import { cn } from '@/lib/utils'
import { useJazContext } from '@/contexts/JazContextContext'
import type { CoverLetterContext } from '@/components/JazAssistant'
import { getUserScopedKeySync, getCurrentUserIdSync, initUserStorageCache } from '@/lib/user-storage'

type Tab = 'recipient' | 'letter' | 'layout'

interface Variant {
  id: 'A' | 'B' | 'C'
  letter: string
}

interface JobContext {
  jobTitle: string | null
  company: string | null
  jobId: string | null
  jobDescription: string | null
}

interface TailorOptions {
  mode: 'hard' | 'soft' | 'both'
  targetRole?: string
  summaryText?: string
  experiencePreview?: string
  userNotes?: string
}

export default function CoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams?.get('jobId')
  const mode = searchParams?.get('mode') || 'tailorCv'
  const returnTo = searchParams?.get('returnTo')
  const jobTitleFromUrl = searchParams?.get('jobTitle') || ''
  const [activeTab, setActiveTab] = useState<Tab>('recipient')
  const [generateMode, setGenerateMode] = useState<'Executive' | 'Creative' | 'Academic' | 'Technical'>('Executive')
  const [rewriteMode, setRewriteMode] = useState<'Enhance' | 'Executive Tone' | 'Creative Portfolio' | 'Academic Formal'>('Enhance')
  const [variants, setVariants] = useState<Variant[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState({ gen: false, rewrite: false, compare: false, export: false, improve: false, tailor: false, tailorFromDescription: false })
  const [aiPreview, setAiPreview] = useState<string>('')
  const [isImprovePreview, setIsImprovePreview] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  
  // Job context from query parameters
  const [jobContext, setJobContext] = useState<JobContext>({
    jobTitle: null,
    company: null,
    jobId: null,
    jobDescription: null,
  })

  // Job draft from localStorage (when coming from Job Details page)
  const [jobDraft, setJobDraft] = useState<null | {
    jobTitle?: string
    company?: string
    jobDescription?: string
    body?: string
    savedAt?: number
  }>(null)

  // Job description for AI tailoring
  const [jobDescription, setJobDescription] = useState<string>('')

  const {
    recipientName,
    company,
    cityState,
    role,
    keywords,
    letterBody,
    applicantName,
    layout,
    atsMode,
    setRecipientInfo,
    setKeywords,
    setLetterBody,
    setApplicantName,
    setLayout,
    setAtsMode,
  } = useCoverStore()

  // Prevent hydration mismatch by only rendering client-specific content after mount
  useEffect(() => {
    setMounted(true)
    initUserStorageCache()
  }, [])

  // Helper function to get user-scoped storage keys
  const getUserKey = useCallback((baseKey: string) => {
    const userId = getCurrentUserIdSync()
    return userId ? getUserScopedKeySync(baseKey, userId) : baseKey
  }, [])

  // Helper function to load cover draft from localStorage (user-scoped)
  const loadCoverDraft = useCallback(() => {
    if (typeof window === 'undefined' || !mounted) return

    try {
      const draftKey = getUserKey('cover-draft')
      const raw = window.localStorage.getItem(draftKey)
      if (!raw) return
      
      const parsed = JSON.parse(raw)
      setJobDraft(parsed)

      // Check if we came from job details page
      const cameFromJD = searchParams?.get('from') === 'jobDetails' || searchParams?.get('mode') === 'tailorCv'
      
      // Update job context
      if (parsed.jobTitle || parsed.company) {
        setJobContext({
          jobTitle: parsed.jobTitle || null,
          company: parsed.company || null,
          jobId: null,
          jobDescription: parsed.jobDescription || null,
        })
      }

      // Update job description
      if (parsed.jobDescription) {
        setJobDescription(parsed.jobDescription)
      }

      // Hydrate letter body - allow overwrite if coming from job details
      if (parsed.body) {
        const cleanedBody = cleanJobDetailsCoverLetter(parsed.body)
        if (cameFromJD) {
          // Always hydrate when coming from job details
          setLetterBody(cleanedBody)
        } else {
          // Only hydrate if letter body is empty (check current value)
          const currentBody = typeof letterBody === 'string' ? letterBody : ''
          if (!currentBody.trim()) {
            setLetterBody(cleanedBody)
          }
        }
      }

      // Switch to letter tab when coming from job details
      if (cameFromJD) {
        setActiveTab('letter')
        // Show toast notification
        setToast({ type: 'success', message: 'Draft loaded from Job Details' })
        setTimeout(() => setToast(null), 3000)
      }
    } catch (e) {
      console.error('Failed to read cover draft', e)
    }
  }, [mounted, searchParams, setLetterBody, setJobDescription])

  // Load draft on mount
  useEffect(() => {
    loadCoverDraft()
  }, [loadCoverDraft])

  // Load draft when searchParams change
  useEffect(() => {
    if (mounted) {
      loadCoverDraft()
    }
  }, [mounted, searchParams?.toString(), loadCoverDraft])

  // Listen for storage events (cross-tab updates)
  useEffect(() => {
    if (typeof window === 'undefined' || !mounted) return

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'jobaz-cover-draft') {
        loadCoverDraft()
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [mounted, loadCoverDraft])

  // Read job context from query parameters
  useEffect(() => {
    if (!mounted) return
    
    const jobTitle = searchParams?.get('jobTitle')
    const company = searchParams?.get('company')
    const jobId = searchParams?.get('jobId')
    const jobDescription = searchParams?.get('jobDescription')
    
    if (jobTitle || company) {
      setJobContext({
        jobTitle: jobTitle ? decodeURIComponent(jobTitle) : null,
        company: company ? decodeURIComponent(company) : null,
        jobId: jobId || null,
        jobDescription: jobDescription ? decodeURIComponent(jobDescription) : null,
      })
      
      // Note: Company, City/State, and Role Title fields removed from UI
      // Job context is still stored for AI generation purposes
    }
  }, [mounted, searchParams, role, company, setRecipientInfo])

  // Auto-fill job information when coming from Job Details page
  useEffect(() => {
    if (!mounted) return
    
    const jobInfo = getJobInfo()
    if (jobInfo && returnTo) {
      // Note: Company, City/State, and Role Title fields removed from UI
      // Only pre-fill keywords if available
      if (jobInfo.skills && !keywords) {
        setKeywords(jobInfo.skills)
      }
    }
  }, [mounted, returnTo, role, cityState, keywords, setRecipientInfo, setKeywords])

  const { personal } = useCVStore()
  const { setContext } = useJazContext()

  // Headers for API requests
  const headers = { 'Content-Type': 'application/json' }
  
  // Normalize letterBody to a safe string - handle cases where it might be non-string after hydration
  const safeLetterBody =
    typeof letterBody === 'string'
      ? letterBody
      : (letterBody && typeof (letterBody as any).body === 'string'
          ? (letterBody as any).body
          : '')

  const hasLetterContent = safeLetterBody.trim().length > 0
  
  // Compute JAZ context for Cover Letter
  const jazContext = useMemo<CoverLetterContext>(() => {
    // Check for placeholders in letter text and extract them
    const placeholderPatterns = [
      /\[([^\]]+)\]/g,  // [Company], [Your Name]
      /\{([^}]+)\}/g,   // {Company}, {Your Name}
    ]
    const foundPlaceholders: string[] = []
    placeholderPatterns.forEach(pattern => {
      const matches = safeLetterBody.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && !foundPlaceholders.includes(match[1])) {
          foundPlaceholders.push(match[1])
        }
      }
    })
    const hasPlaceholders = foundPlaceholders.length > 0
    
    return {
      page: 'cover-letter',
      mode: generateMode,
      rewriteMode,
      hasLetterText: hasLetterContent,
      hasJobDescription: jobDescription.trim().length > 0,
      hasPlaceholders,
      placeholders: hasPlaceholders ? foundPlaceholders : undefined,
    }
  }, [generateMode, rewriteMode, hasLetterContent, jobDescription, safeLetterBody])

  // Update JAZ context when it changes
  useEffect(() => {
    setContext(jazContext)
    return () => setContext(null) // Cleanup on unmount
  }, [jazContext, setContext])

  const hasJobContext = !!(
    jobId ||
    returnTo ||
    jobContext.jobTitle ||
    jobContext.company ||
    (jobDraft && (jobDraft.jobTitle || jobDraft.company))
  )

  const handleBackToJobDetails = () => {
    if (returnTo) {
      const decoded = decodeURIComponent(returnTo)
      const urlObj = new URL(decoded, window.location.origin)
      urlObj.searchParams.set('from', 'cover')
      router.push(urlObj.pathname + urlObj.search)
      return
    }
    
    if (jobId) {
      const url = `/job-details/${jobId}?mode=${mode}&from=cover`
      router.push(url)
      return
    }
    
    router.back()
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  /**
   * Post-processing cleanup: Remove any closing/signature blocks from AI output.
   * This function ALWAYS removes common sign-offs and any trailing name lines after them.
   * Applied before showing AI preview and before applying to form.
   */
  const removeClosingSignature = (text: string): string => {
    if (!text || text.trim().length === 0) {
      return text
    }

    let cleaned = text.trim()

    // Common sign-off patterns (case-insensitive, with optional comma)
    const signOffPatterns = [
      /\bSincerely,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bKind regards,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bBest regards,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bRegards,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bYours sincerely,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bYours faithfully,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bRespectfully,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bThank you,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bCordially,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
      /\bWith appreciation,?\s*(?:\n\s*[A-Za-z\s]+)?\s*/gim,
    ]

    // Remove all sign-off patterns
    signOffPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '')
    })

    // Additional cleanup: remove any trailing lines that look like names
    // (lines with 2-4 capitalized words, typically at the end)
    const lines = cleaned.split('\n')
    const cleanedLines: string[] = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (line.length === 0) {
        // Only keep empty line if it's not at the very end
        if (i < lines.length - 1) {
          cleanedLines.push('')
        }
        continue
      }
      
      // Check if this line looks like a name (2-4 capitalized words)
      const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/
      const isLikelyName = namePattern.test(line)
      
      // If it's a likely name and we're near the end (last 2 lines), skip it
      if (isLikelyName && i >= lines.length - 2) {
        continue
      }
      
      cleanedLines.push(line)
    }

    cleaned = cleanedLines.join('\n').trim()

    // Final cleanup: remove any remaining sign-off words that might have been missed
    cleaned = cleaned.replace(/\b(Sincerely|Kind regards|Best regards|Regards|Yours sincerely|Yours faithfully|Respectfully|Thank you|Cordially|With appreciation),?\s*/gim, '')

    return cleaned.trim()
  }

  const handleSaveCoverLetterToDashboard = async () => {
    try {
      // Clean the cover letter before saving
      const cleanedBody = hasLetterContent ? cleanCoverLetterClosing(safeLetterBody, applicantName || 'Your Name') : ''
      
      // Build the cover letter data object from current state
      const coverLetterData = {
        applicantName: applicantName || '',
        recipientName: recipientName || '',
        company: company || '',
        cityState: cityState || '',
        role: role || '',
        bodyText: cleanedBody || '',
        keywords: keywords || '',
      }

      // Call API to upsert cover letter
      const response = await fetch('/api/cover/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Cover Letter',
          job_key: null,
          data: coverLetterData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save cover letter')
      }

      const result = await response.json()
      if (!result.ok) {
        throw new Error(result.error || 'Failed to save cover letter')
      }

      // Re-fetch latest cover letter from API to ensure we have the updated version
      const refreshResponse = await fetch('/api/cover/get-latest')
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.ok && refreshData.hasCoverLetter && refreshData.coverLetter) {
          // Update local state with the latest cover letter from API
          const savedData = refreshData.coverLetter.data || {}
          if (savedData.applicantName !== undefined) setApplicantName(savedData.applicantName)
          // Batch recipient info updates using setRecipientInfo
          const recipientUpdates: { recipientName?: string; company?: string; cityState?: string; role?: string } = {}
          if (savedData.recipientName !== undefined) recipientUpdates.recipientName = savedData.recipientName
          if (savedData.company !== undefined) recipientUpdates.company = savedData.company
          if (savedData.cityState !== undefined) recipientUpdates.cityState = savedData.cityState
          if (savedData.role !== undefined) recipientUpdates.role = savedData.role
          if (Object.keys(recipientUpdates).length > 0) {
            setRecipientInfo(recipientUpdates)
          }
          if (savedData.bodyText !== undefined) setLetterBody(savedData.bodyText)
          if (savedData.keywords !== undefined) setKeywords(savedData.keywords)
        }
      }

      // Show success message
      showToast('success', 'Cover letter saved to your dashboard.')
    } catch (error) {
      console.error('Error saving cover letter to dashboard:', error)
      showToast('error', error instanceof Error ? error.message : 'Failed to save cover letter. Please try again.')
    }
  }

  const handleGenerate = async () => {
    setLoading(prev => ({ ...prev, gen: true }))

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      )

      const fetchPromise = fetch('/api/cover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: applicantName, // keep user's name field unchanged
          recipientName, company, cityState, role, mode: generateMode, keywords
        }),
      })

      const res = await Promise.race([fetchPromise, timeoutPromise]) as Response

      let data: any = null
      try { data = await res.json(); } catch {}

      if (!res.ok || !data?.ok) {
        showToast('error', 'AI temporarily unavailable. Using a safe draft.')
        // fallback to mock if server ever returns non-ok - use local preview state
        const cleanedText = cleanCoverLetterText(
          data?.letter || '(temporary draft)…',
          applicantName
        )
        // Post-processing: remove any closing/signature blocks
        const finalText = removeClosingSignature(cleanedText)
        setAiPreview(finalText)
        setIsImprovePreview(false)
        showToast('success', 'Preview generated - click Apply to update')
      } else {
        // Clean the AI-generated text and store in local preview state (preview only)
        const cleanedText = cleanCoverLetterText(data.letter, applicantName)
        // Post-processing: remove any closing/signature blocks
        const finalText = removeClosingSignature(cleanedText)
        setAiPreview(finalText)
        setIsImprovePreview(false)
        showToast('success', 'Preview generated - click Apply to update')
      }
    } catch (error: any) {
      console.error('[AI] Generate error:', error)
      showToast('error', 'Request timed out or failed. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, gen: false }))
    }
  }

  const handleImprove = async () => {
    if (!hasLetterContent) {
      showToast('error', 'Please write or paste content first')
      return
    }

    console.log('[COVER] improve', { chars: safeLetterBody.length })
    setLoading(prev => ({ ...prev, improve: true }))

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      )

      const fetchPromise = fetch('/api/cover/rewrite', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          letter: safeLetterBody,
          mode: 'Improve',
          role,
          company,
          applicantName,
        }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

      const data = await response.json()
      console.log('[AI] improve result:', data)

      if (!response.ok || !data.ok) {
        console.error('[AI] request failed')
        showToast('error', '⚠️ AI request failed')
        return
      }

      if (data.body || data.letter) {
        // For Improve mode, we get just the body (paragraph text)
        // Normalize it to ensure it's a clean paragraph
        const improvedText = data.body || data.letter
        
        // Strip any prefixes and normalize to paragraph format
        const normalized = normalizeSummaryParagraph(improvedText.trim())
        
        if (normalized) {
          // Post-processing: remove any closing/signature blocks
          const finalText = removeClosingSignature(normalized)
          setAiPreview(finalText)
          setIsImprovePreview(true)
          showToast('success', 'Preview generated - click Apply to update')
        } else {
          showToast('error', 'Failed to generate improved version')
        }
      }
    } catch (error: any) {
      console.error('[AI] error improving cover letter:', error)
      showToast('error', error.message?.includes('timeout') ? 'Request timed out. Please try again.' : '⚠️ AI request failed')
    } finally {
      setLoading(prev => ({ ...prev, improve: false }))
    }
  }

  const handleRewrite = async () => {
    if (!hasLetterContent) {
      showToast('error', 'Please generate or write content first')
      return
    }

    console.log('[COVER] rewrite', { mode: rewriteMode, chars: safeLetterBody.length })
    setLoading(prev => ({ ...prev, rewrite: true }))

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      )

      const fetchPromise = fetch('/api/cover/rewrite', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          letter: safeLetterBody,
          mode: rewriteMode,
        }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

      const data = await response.json()
      console.log('[AI] result:', data)

      if (!response.ok || !data.ok) {
        console.error('[AI] request failed')
        showToast('error', '⚠️ AI request failed')
        return
      }

      if (data.body) {
        // Clean the rewritten text (body only, no greetings/closings) and store in local preview state (preview only)
        // Use stripPlaceholders instead of cleanCoverLetterText since rewrite returns body-only text
        const cleanedText = stripPlaceholders(data.body.trim())
        // Post-processing: remove any closing/signature blocks
        const finalText = removeClosingSignature(cleanedText)
        setAiPreview(finalText)
        setIsImprovePreview(false)
        showToast('success', 'Preview generated - click Apply to update')
      } else if (data.letter) {
        // Fallback for backward compatibility - clean the text (body only, no greetings/closings) and store in local preview state
        // Use stripPlaceholders instead of cleanCoverLetterText since rewrite returns body-only text
        const cleanedText = stripPlaceholders(data.letter.trim())
        // Post-processing: remove any closing/signature blocks
        const finalText = removeClosingSignature(cleanedText)
        setAiPreview(finalText)
        setIsImprovePreview(false)
        showToast('success', 'Preview generated - click Apply to update')
        
      }
    } catch (error: any) {
      console.error('[AI] error rewriting cover letter:', error)
      showToast('error', error.message?.includes('timeout') ? 'Request timed out. Please try again.' : '⚠️ AI request failed')
    } finally {
      setLoading(prev => ({ ...prev, rewrite: false }))
    }
  }

  const handleCompare = async () => {
    if (!hasLetterContent) {
      showToast('error', 'Please generate or write content first')
      return
    }

    console.log('[COVER] compare', { keywords, mode: generateMode })
    setLoading(prev => ({ ...prev, compare: true }))

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      )

      const fetchPromise = fetch('/api/cover/compare', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: safeLetterBody, // Pass current body text for rewriting/improving
          keywords,
          mode: generateMode,
          recipientName,
          company,
          role,
          fullName: applicantName,
        }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

      const data = await response.json()
      console.log('[AI] result:', data)

      if (!response.ok || !data.ok) {
        console.error('[AI] request failed')
        showToast('error', '⚠️ AI request failed')
        return
      }

      if (data.variants && data.variants.length > 0) {
        // Variants are already cleaned by the API (removes greetings and closings)
        // Apply post-processing cleanup to remove any closing/signature blocks
        const normalizedVariants = data.variants.map((v: Variant) => {
          const trimmed = (v.letter || '').trim()
          const cleaned = removeClosingSignature(trimmed)
          return {
            ...v,
            letter: cleaned,
            content: cleaned, // For compatibility with ComparePanel
          }
        })
        setVariants(normalizedVariants)
        setShowCompare(true)
        showToast('success', 'Generated variants')
      }
    } catch (error: any) {
      console.error('[AI] error comparing cover letters:', error)
      showToast('error', error.message?.includes('timeout') ? 'Request timed out. Please try again.' : '⚠️ AI request failed')
    } finally {
      setLoading(prev => ({ ...prev, compare: false }))
    }
  }

  const handleTailorFromJobTitle = () => {
    if (!jobTitleFromUrl) return
    
    // Fill the keywords textarea with the job title
    setKeywords(jobTitleFromUrl)
    
    // Switch to the Letter Body tab
    setActiveTab('letter')
  }

  const handleTailor = async () => {
    if (!jobContext.jobTitle && !jobContext.company) {
      showToast('error', 'Job information is missing')
      return
    }

    console.log('[COVER] tailor', { jobContext })
    setLoading(prev => ({ ...prev, tailor: true }))

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      )

      // Use the rewrite endpoint with a special "tailor" mode
      // If letterBody is empty, we'll generate from scratch; otherwise, we'll rewrite
      const fetchPromise = fetch('/api/cover/rewrite', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          letter: safeLetterBody || '', // Pass current body if exists, empty string if not
          mode: 'tailor_cover_from_job',
          jobTitle: jobContext.jobTitle,
          company: jobContext.company,
          jobDescription: jobContext.jobDescription,
          role: jobContext.jobTitle || role,
          applicantName,
        }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

      let data: any = null
      try { data = await response.json(); } catch {}

      if (!response.ok || !data?.ok) {
        console.error('[AI] tailor request failed')
        showToast('error', 'AI temporarily unavailable. Please try again.')
        return
      }

      if (data.body || data.letter) {
        // Clean the tailored text and directly update the letter body
        const tailoredText = (data.body || data.letter).trim()
        const cleanedText = stripPlaceholders(tailoredText)
        // Post-processing: remove any closing/signature blocks
        const cleanedFromSignatures = removeClosingSignature(cleanedText)
        const final = cleanCoverLetterClosing(cleanedFromSignatures, applicantName || 'Your Name')
        setLetterBody(final)
        setAiPreview('') // Clear any existing preview
        setIsImprovePreview(false)
        
        const jobInfo = jobContext.company 
          ? `${jobContext.jobTitle || 'this position'} at ${jobContext.company}`
          : jobContext.jobTitle || 'this job'
        showToast('success', `Cover letter tailored to ${jobInfo}.`)
      } else {
        showToast('error', 'Failed to tailor cover letter. Please try again.')
      }
    } catch (error: any) {
      console.error('[AI] error tailoring cover letter:', error)
      showToast('error', error.message?.includes('timeout') ? 'Request timed out. Please try again.' : '⚠️ AI request failed')
    } finally {
      setLoading(prev => ({ ...prev, tailor: false }))
    }
  }

  const handleGenerateFromJobDescription = async () => {
    if (!jobDescription.trim()) {
      showToast('error', 'Please paste a job description first')
      return
    }

    console.log('[COVER] generate from job description', { jobDescription, jobDraft })
    setLoading(prev => ({ ...prev, tailorFromDescription: true }))

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 second timeout
      )

      // Use the rewrite endpoint with tailor_cover_from_job mode
      const fetchPromise = fetch('/api/cover/rewrite', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          letter: safeLetterBody || '', // Pass current body if exists, empty string if not
          mode: 'tailor_cover_from_job',
          jobTitle: jobDraft?.jobTitle || jobContext.jobTitle || null,
          company: jobDraft?.company || jobContext.company || null,
          jobDescription: jobDescription,
          role: jobDraft?.jobTitle || jobContext.jobTitle || role,
          applicantName,
        }),
      })

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

      let data: any = null
      try { data = await response.json(); } catch {}

      if (!response.ok || !data?.ok) {
        console.error('[AI] generate from job description request failed')
        showToast('error', 'AI temporarily unavailable. Please try again.')
        return
      }

      if (data.body || data.letter) {
        // Clean the tailored text and directly update the letter body
        const tailoredText = (data.body || data.letter).trim()
        const cleanedText = stripPlaceholders(tailoredText)
        // Post-processing: remove any closing/signature blocks
        const cleanedFromSignatures = removeClosingSignature(cleanedText)
        const final = cleanCoverLetterClosing(cleanedFromSignatures, applicantName || 'Your Name')
        setLetterBody(final)
        setAiPreview('') // Clear any existing preview
        setIsImprovePreview(false)
        
        const jobInfo = jobDraft?.company 
          ? `${jobDraft?.jobTitle || 'this position'} at ${jobDraft.company}`
          : jobDraft?.jobTitle || jobContext.jobTitle || 'this job'
        showToast('success', `Cover letter generated from job description for ${jobInfo}.`)
      } else {
        showToast('error', 'Failed to generate cover letter. Please try again.')
      }
    } catch (error: any) {
      console.error('[AI] error generating from job description:', error)
      showToast('error', error.message?.includes('timeout') ? 'Request timed out. Please try again.' : '⚠️ AI request failed')
    } finally {
      setLoading(prev => ({ ...prev, tailorFromDescription: false }))
    }
  }

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!hasLetterContent) {
      showToast('error', 'Please add content first')
      return
    }

    setLoading(prev => ({ ...prev, export: true }))
    try {
      const date = new Date().toISOString().split('T')[0]
      
      if (format === 'pdf') {
        const name = personal.fullName || 'Cover'
        const filename = `Cover-${name.replace(/\s+/g, '-')}-${date}`
        await exportToPDF('cover-preview', filename)
      } else {
        // DOCX filename: Cover-[Date].docx (per requirements)
        const filename = `Cover-${date}`
        
        // Check if letterBody already contains a complete letter
        // (both greeting starting with "Dear" and closing with "Sincerely,")
        const hasFullLetter =
          safeLetterBody.trim().toLowerCase().includes("dear ") &&
          safeLetterBody.toLowerCase().includes("sincerely,");
        
        // Build full letter content - use letterBody as-is if it's complete, otherwise add greeting and closing
        const greetName = recipientName.trim() || 'Hiring Manager'
        const signatureName = applicantName.trim() || 'Your Name'
        
        const letterContent = hasFullLetter
          ? safeLetterBody
          : `Dear ${greetName},\n\n${safeLetterBody}\n\nSincerely,\n${signatureName}`
        
        const sections = [{ title: 'Cover Letter', content: [letterContent] }]
        await exportToDocx('Cover Letter', sections, filename)
      }
      showToast('success', '✅ Export successful')
    } catch (error) {
      console.error('Export error:', error)
      showToast('error', `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      {/* Main container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <header className="mb-4 pb-4 border-b border-slate-800/60">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-3">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="hover:text-slate-100 transition"
              >
                ← Back to Dashboard
              </button>

              {hasJobContext && (
                <button
                  type="button"
                  onClick={handleBackToJobDetails}
                  className="hover:text-slate-100 transition"
                >
                  ← Back to Job Details
                </button>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 m-0">
              JobAZ – Cover Letter Builder
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-400 m-0">
              Generate personalized cover letters that match your CV and target job
            </p>
          </div>
        </header>

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={handleSaveCoverLetterToDashboard}
            className="rounded-full bg-slate-900/80 px-4 py-2 text-xs md:text-sm font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Cover Letter to Dashboard
          </button>
        </div>

        {/* Two-column layout */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)] items-start">
          {/* LEFT: Form + AI Engine */}
          <div className="space-y-6">
            {/* Tabs Card */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur overflow-hidden">
              <div className="flex overflow-x-auto border-b border-slate-700/60 scrollbar-thin scrollbar-thumb-violet-600">
                {[
                  { id: 'recipient' as Tab, label: 'Recipient' },
                  { id: 'letter' as Tab, label: 'Letter Body' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium transition whitespace-nowrap relative',
                      activeTab === tab.id
                        ? 'text-violet-300 border-b-2 border-violet-500'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4 md:p-5 space-y-3">
                {/* Recipient Tab */}
                {activeTab === 'recipient' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-200 mb-2">Applicant Name</label>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                      />
                      <p className="text-[10px] md:text-xs text-slate-400 mt-1">
                        Used in the signature (e.g., &quot;Sincerely, Your Name&quot;)
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-200 mb-2">Recipient Name (optional)</label>
                      <input
                        type="text"
                        placeholder="Hiring Manager"
                        value={recipientName}
                        onChange={(e) => setRecipientInfo({ recipientName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                      />
                      <p className="text-[10px] md:text-xs text-slate-400 mt-1">
                        If left blank, we&apos;ll use generic salutations (&apos;Dear Hiring Manager,&apos;).
                      </p>
                    </div>
                  </div>
                )}

                {/* Letter Body Tab */}
                {activeTab === 'letter' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        placeholder="Write or paste your cover letter here..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition resize-y"
                        value={letterBody}
                        onChange={(e) => setLetterBody(e.target.value)}
                      />
                    </div>
                    {/* AI Improve Button - only show when letterBody has content */}
                    {hasLetterContent && (
                      <div>
                        <button
                          onClick={handleImprove}
                          disabled={loading.improve || !hasLetterContent}
                          data-jaz-action="cover_improve"
                          className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading.improve ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              AI Improve Cover Letter
                            </>
                          )}
                        </button>
                        <p className="text-[10px] md:text-xs text-slate-400 mt-2">
                          Refine your existing cover letter—clearer, tighter, and tailored.
                        </p>
                      </div>
                    )}
                    {/* AI Draft Preview */}
                    {aiPreview && (
                      <div className="rounded-xl border border-violet-500/30 p-4 bg-violet-950/30 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-violet-300">AI Preview Available</span>
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-400 mb-2">AI-generated content ready to apply</p>
                        <div className="text-sm bg-slate-900/50 p-3 rounded-lg text-white">
                          <AIPreviewText text={aiPreview || ''} paragraph={isImprovePreview} />
                        </div>
                        <div className="mt-3 flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              if (!aiPreview?.trim()) return;
                              // Post-processing: remove any closing/signature blocks before applying
                              const cleanedPreview = removeClosingSignature(aiPreview.trim());
                              const final = cleanCoverLetterClosing(cleanedPreview, applicantName || 'Your Name');
                              setLetterBody(final);
                              setAiPreview('');
                              setIsImprovePreview(false);
                              showToast('success', 'Applied to form');
                            }}
                            disabled={!aiPreview.trim()}
                            className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white border border-violet-400/70 hover:bg-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Apply to Form
                          </button>
                          <button
                            onClick={() => {
                              setAiPreview('');
                              setIsImprovePreview(false);
                              showToast('success', 'Preview cancelled');
                            }}
                            className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600/70 hover:bg-slate-700 transition"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* AI Engine Card - Only show in Letter Body tab */}
            {activeTab === 'letter' && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-slate-100 mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                      AI Engine
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-400 mb-4">
                      No cover letter yet? Enter a few keywords and AI will create one for you.
                    </p>
                  </div>
                  
                  {/* Tailor from job title button - Only show when jobTitleFromUrl is not empty */}
                  {jobTitleFromUrl && (
                    <div className="mb-4">
                      <button
                        onClick={handleTailorFromJobTitle}
                        className="px-3 py-1.5 text-xs font-medium text-violet-300 border border-violet-500/50 rounded-lg hover:bg-violet-500/10 hover:border-violet-400/70 transition"
                      >
                        Tailor from job title
                      </button>
                    </div>
                  )}
                  
                  {/* Tailor to Job Button - Only show when job context exists */}
                  {(jobContext.jobTitle || jobContext.company) && (
                    <div className="border-b border-slate-700/60 pb-4 space-y-2">
                      <button
                        onClick={handleTailor}
                        disabled={loading.tailor}
                        className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading.tailor ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Tailoring...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Tailor cover letter to this job
                          </>
                        )}
                      </button>
                      <p className="text-[10px] md:text-xs text-slate-400">
                        Use the job title and description to adapt your cover letter automatically.
                      </p>
                    </div>
                  )}
                  
                  {/* Generate from Keywords */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-200 mb-2">Generate from Keywords</label>
                      <textarea
                        placeholder="e.g., Senior Software Engineer, Python, React, AWS..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition resize-y"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-200 mb-2">Mode</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                        value={generateMode}
                        onChange={(e) => setGenerateMode(e.target.value as any)}
                      >
                        <option value="Executive">Executive</option>
                        <option value="Creative">Creative</option>
                        <option value="Academic">Academic</option>
                        <option value="Technical">Technical</option>
                      </select>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={loading.gen || !keywords}
                      data-jaz-action="cover_generate_keywords"
                      className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading.gen ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rewrite Section */}
                  <div className="border-t border-slate-700/60 pt-4 space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-200 mb-2">Rewrite Mode</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition"
                        value={rewriteMode}
                        onChange={(e) => setRewriteMode(e.target.value as any)}
                      >
                        <option value="Enhance">Enhance</option>
                        <option value="Executive Tone">Executive Tone</option>
                        <option value="Creative Portfolio">Creative Portfolio</option>
                        <option value="Academic Formal">Academic Formal</option>
                      </select>
                    </div>
                    <button
                      onClick={handleRewrite}
                      disabled={loading.rewrite || !hasLetterContent}
                      data-jaz-action="cover_rewrite"
                      className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading.rewrite ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Rewrite'
                      )}
                    </button>
                  </div>

                  {/* Compare Section */}
                  <div className="border-t border-slate-700/60 pt-4">
                    <button
                      onClick={handleCompare}
                      disabled={loading.compare || !hasLetterContent}
                      data-jaz-action="cover_compare_3"
                      className="w-full rounded-full bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 border border-slate-600/70 hover:bg-slate-700 hover:border-slate-500 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading.compare ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Compare 3 AI Versions'
                      )}
                    </button>
                    <p className="text-[10px] md:text-xs text-slate-400 mt-2">
                      Generate and compare three different AI-written versions of your text.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description & AI Tailoring Card - Only show in Letter Body tab */}
            {activeTab === 'letter' && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-slate-100 mb-1 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                      Job Description & AI Tailoring
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-400 mb-4">
                      Paste the job description here so we can tailor your cover letter to this role.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-200 mb-2">Job Description</label>
                      <textarea
                        placeholder="Paste the job description here so we can tailor your cover letter to this role..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition resize-y"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleGenerateFromJobDescription}
                      disabled={loading.tailorFromDescription || !jobDescription.trim()}
                      data-jaz-action="cover_generate_from_jd"
                      className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading.tailorFromDescription ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate from job description
                        </>
                      )}
                    </button>
                    <p className="text-[10px] md:text-xs text-slate-400">
                      Generate or tailor your cover letter based on the full job description.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Preview + Export */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-100">Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={loading.export}
                    className="rounded-full bg-violet-600 px-4 py-2 text-xs md:text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Download PDF"
                  >
                    {loading.export ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        PDF
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    disabled={loading.export}
                    className="rounded-full bg-violet-600 px-4 py-2 text-xs md:text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Download DOCX"
                  >
                    {loading.export ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        DOCX
                      </>
                    )}
                  </button>
                </div>
              </div>
              {returnTo && (
                <button
                  onClick={() => {
                    const decoded = decodeURIComponent(returnTo)
                    const urlObj = new URL(decoded, window.location.origin)
                    urlObj.searchParams.set('from', 'cover')
                    router.push(urlObj.pathname + urlObj.search)
                  }}
                  className="w-full rounded-full bg-green-600/20 px-4 py-2 text-xs md:text-sm font-medium text-green-400 border border-green-500/50 hover:bg-green-600/30 transition"
                >
                  ✓ Return to Job Details
                </button>
              )}
              <div className="mx-auto aspect-[1/1.414] w-full max-w-[460px] bg-white text-slate-900 shadow-lg overflow-hidden rounded-md">
                <div 
                  ref={previewRef} 
                  id="cover-preview" 
                  className="p-8 h-full overflow-y-auto"
                >
                  <CoverPreview aiPreview={aiPreview} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Compare Panel */}
      {showCompare && variants.length > 0 && (
        <ComparePanel
          variants={variants.map((v) => ({ id: v.id, content: v.letter }))}
          isOpen={showCompare}
          onClose={() => {
            setVariants([])
            setShowCompare(false)
          }}
          onSelect={(variant) => {
            // Store variant in local preview state (preview only)
            // Variant content is already cleaned by API (body text only, no greetings/closings)
            const cleanedText = (variant.content || '').trim()
            // Post-processing: remove any closing/signature blocks
            const finalText = removeClosingSignature(cleanedText)
            setAiPreview(finalText)
            setIsImprovePreview(false)
            setVariants([])
            setShowCompare(false)
            showToast('success', 'Preview generated - click Apply to update')
          }}
        />
      )}

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
              <X className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

