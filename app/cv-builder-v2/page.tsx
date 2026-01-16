'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Download, FileText, Loader2, CheckCircle2, X, Save, Sparkles, ChevronDown, ChevronUp, FileEdit } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { exportToPDF } from '@/lib/pdf'
import { exportToDocx } from '@/lib/docx'
import CvPreview from '@/components/cv-builder-v2/CvPreview'
import PersonalInfoTab from '@/components/cv-builder-v2/PersonalInfoTab'
import SummaryTab from '@/components/cv-builder-v2/SummaryTab'
import ExperienceTab from '@/components/cv-builder-v2/ExperienceTab'
import EducationTab from '@/components/cv-builder-v2/EducationTab'
import SkillsTab from '@/components/cv-builder-v2/SkillsTab'
import MoreTab from '@/components/cv-builder-v2/MoreTab'
import JobDescriptionPanel from '@/components/cv-builder-v2/JobDescriptionPanel'
import PageHeader from '@/components/PageHeader'
import { useJazContext } from '@/contexts/JazContextContext'
import type { CvBuilderContext } from '@/components/JazAssistant'
import { getUserScopedKeySync, getCurrentUserIdSync, initUserStorageCache } from '@/lib/user-storage'
import { computeCvScore } from '@/lib/cv-score'

export type CvTemplateId = 'atsClassic' | 'twoColumnPro'

export type CvSectionExperience = {
  id: string
  jobTitle: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  bullets: string[]
}

export type CvData = {
  personalInfo: {
    fullName: string
    email: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary: string
  experience: CvSectionExperience[]
  education: Array<{
    degree: string
    school: string
    year?: string
    details?: string
  }>
  skills: string[]
  projects?: Array<{
    name: string
    description: string
    url?: string
  }>
  languages?: string[]
  certifications?: string[]
  publications?: Array<{
    title: string
    authors?: string
    venueOrJournal?: string
    year?: string
    doiOrUrl?: string
    notes?: string
  }>
}

type Tab = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'more'

const STORAGE_KEY = 'jobaz-cv-v2-draft'

// Accordion component for grouped grammar issues
function GrammarSectionAccordion({
  section,
  issues,
  selectedIssues,
  onToggleIssue,
  onApplyFix,
}: {
  section: string
  issues: GrammarIssue[]
  selectedIssues: Set<string>
  onToggleIssue: (fieldPath: string) => void
  onApplyFix: (issue: GrammarIssue) => void
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800/40 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">{section}</span>
          <span className="text-xs text-slate-400">({issues.length})</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-2 space-y-2">
          {issues.map((issue, idx) => (
            <div key={idx} className="rounded-lg border border-slate-700/40 bg-slate-950/60 p-2.5">
              <div className="flex items-start gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedIssues.has(issue.fieldPath)}
                  onChange={() => onToggleIssue(issue.fieldPath)}
                  disabled={!issue.isSafeFix}
                  className="mt-0.5 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500 disabled:opacity-40"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-300 mb-1 break-all">{issue.fieldPath}</div>
                  <div className="text-xs text-slate-400 mb-1">
                    <span className="text-slate-500 line-through">{issue.original}</span>
                    <span className="mx-2">→</span>
                    <span className="text-violet-300">{issue.suggestion}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded',
                      issue.isSafeFix ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {issue.isSafeFix ? 'Safe' : 'Review'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Confidence: {Math.round(issue.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onApplyFix(issue)}
                  className="rounded-full border border-violet-500/60 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 text-[10px] font-semibold transition flex-shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type ReviewResult = {
  ok: boolean
  score?: number
  completionScore?: number
  qualityScore?: number
  level?: 'Strong' | 'Good' | 'Needs Improvement'
  topFixes?: string[]
  notes?: string[]
  isGated?: boolean
  gateMessage?: string
  error?: string
}

type GrammarIssue = {
  fieldPath: string
  original: string
  suggestion: string
  confidence: number
  isSafeFix: boolean
}

type GrammarResult = {
  ok: boolean
  issues?: GrammarIssue[]
  summary?: {
    issueCount: number
    safeCount: number
  }
  error?: string
}

export default function CvBuilderV2Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  const mode = searchParams.get('mode') || 'tailorCv'
  const previewRef = useRef<HTMLDivElement>(null)
  const prefillCheckedRef = useRef(false)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>('atsClassic')
  const [loading, setLoading] = useState({ export: false, ai: false })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { setContext } = useJazContext()
  const [jobDescription, setJobDescription] = useState<string>('')

  // Right-column toolbar modals (compact)
  const [showCvCheck, setShowCvCheck] = useState(false)
  const [showGrammar, setShowGrammar] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null)

  // Initialize user storage cache
  useEffect(() => {
    initUserStorageCache()
  }, [])

  // Helper function to get user-scoped storage keys
  const getUserKey = (baseKey: string) => {
    const userId = getCurrentUserIdSync()
    return userId ? getUserScopedKeySync(baseKey, userId) : baseKey
  }

  const [cvData, setCvData] = useState<CvData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
    },
    summary: '',
    experience: [
      {
        id: Date.now().toString(),
        jobTitle: '',
        company: '',
        bullets: [''],
      },
    ],
    education: [
      {
        degree: '',
        school: '',
      },
    ],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
    publications: [],
  })

  // Track unsaved changes
  const [isDirty, setIsDirty] = useState(false)
  const initialCvDataRef = useRef<string>('')
  const initialTemplateRef = useRef<CvTemplateId>('atsClassic')

  // Compute CV score for badge display
  const cvScore = useMemo(() => {
    try {
      return computeCvScore(cvData)
    } catch (error) {
      console.error('Error computing CV score:', error)
      return null
    }
  }, [cvData])

  // Compute JAZ context for CV Builder
  const jazContext = useMemo<CvBuilderContext>(() => {
    // Count words in summary (approximate)
    const summaryTextLength = cvData.summary.trim().split(/\s+/).filter(Boolean).length
    
    return {
      page: 'cv-builder',
      activeTab,
      atsScore: cvScore?.score || null,
      summaryTextLength,
      experienceCount: cvData.experience.length,
      skillsCount: cvData.skills.length,
      hasJobDescription: jobDescription.trim().length > 0,
      template: selectedTemplate,
    }
  }, [activeTab, cvData.summary, cvData.experience.length, cvData.skills.length, jobDescription, selectedTemplate, cvScore])

  // Update JAZ context when it changes
  useEffect(() => {
    setContext(jazContext)
    return () => setContext(null) // Cleanup on unmount
  }, [jazContext, setContext])

  // Listen for JAZ tab switch events
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent<{ tab: Tab }>) => {
      const { tab } = event.detail
      if (['summary', 'experience', 'education', 'skills'].includes(tab)) {
        setActiveTab(tab)
      }
    }

    window.addEventListener('jaz-switch-cv-tab', handleTabSwitch as EventListener)
    return () => {
      window.removeEventListener('jaz-switch-cv-tab', handleTabSwitch as EventListener)
    }
  }, [])

  // Load CV from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let cvLoaded = false
    
    try {
      // Check if cvId query parameter is present
      const cvId = searchParams.get('cvId')
      
      if (cvId) {
        // Load specific CV from saved CVs array (user-scoped)
        const cvsKey = getUserKey('cvs')
        const savedCvsJson = localStorage.getItem(cvsKey)
        if (savedCvsJson) {
          const savedCvs = JSON.parse(savedCvsJson)
          if (Array.isArray(savedCvs)) {
            const foundCv = savedCvs.find((cv: any) => cv.id === cvId)
            if (foundCv) {
              // Load the found CV
              const defaultPersonalInfo = {
                fullName: '',
                email: '',
                phone: '',
                location: '',
                linkedin: '',
                website: '',
              }
              const loadedExperience = Array.isArray(foundCv.experience) && foundCv.experience.length > 0
                ? foundCv.experience
                : [{ id: Date.now().toString(), jobTitle: '', company: '', bullets: [''] }]
              const loadedEducation = Array.isArray(foundCv.education) && foundCv.education.length > 0
                ? foundCv.education
                : [{ degree: '', school: '' }]
              
              setCvData({
                personalInfo: foundCv.personalInfo && typeof foundCv.personalInfo === 'object'
                  ? { ...defaultPersonalInfo, ...foundCv.personalInfo }
                  : defaultPersonalInfo,
                summary: foundCv.summary || '',
                experience: loadedExperience,
                education: loadedEducation,
                skills: Array.isArray(foundCv.skills) ? foundCv.skills : [],
                projects: Array.isArray(foundCv.projects) ? foundCv.projects : [],
                languages: Array.isArray(foundCv.languages) ? foundCv.languages : [],
                certifications: Array.isArray(foundCv.certifications) ? foundCv.certifications : [],
                publications: Array.isArray(foundCv.publications) ? foundCv.publications : [],
              })
              if (foundCv.template) {
                setSelectedTemplate(foundCv.template)
              }
              cvLoaded = true
            }
          }
        }
      }
      
      // Fallback to loading draft if CV wasn't loaded (user-scoped)
      if (!cvLoaded) {
        const draftKey = getUserKey(STORAGE_KEY)
        const saved = localStorage.getItem(draftKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Ensure personalInfo has all required fields and is never null/undefined
          const defaultPersonalInfo = {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            website: '',
          }
          const loadedExperience = Array.isArray(parsed.experience) && parsed.experience.length > 0
            ? parsed.experience
            : [{ id: Date.now().toString(), jobTitle: '', company: '', bullets: [''] }]
          const loadedEducation = Array.isArray(parsed.education) && parsed.education.length > 0
            ? parsed.education
            : [{ degree: '', school: '' }]
          
          setCvData({
            ...parsed,
            personalInfo: parsed.personalInfo && typeof parsed.personalInfo === 'object'
              ? { ...defaultPersonalInfo, ...parsed.personalInfo }
              : defaultPersonalInfo,
            experience: loadedExperience,
            education: loadedEducation,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          })
        }
      }
      
    } catch (error) {
      console.error('Error loading CV:', error)
    }
  }, [searchParams])

  // Load prefill summary from localStorage on mount (separate useEffect as required)
  // This runs after CV loading to ensure it overrides the summary
  useEffect(() => {
    if (typeof window === 'undefined' || prefillCheckedRef.current) return
    
    // Use a small delay to ensure this runs after CV loading useEffect
    const timeoutId = setTimeout(() => {
      if (prefillCheckedRef.current) return
      
      const prefillKey = getUserKey('prefill_summary')
      const prefill = localStorage.getItem(prefillKey)
      if (prefill && prefill.trim().length > 0) {
        setCvData((prev) => ({
          ...prev,
          summary: prefill,
        }))
        localStorage.removeItem(prefillKey)
        prefillCheckedRef.current = true
      } else {
        prefillCheckedRef.current = true
      }
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Track initial state after CV data is loaded from storage
  // Wait for data to be loaded, then set initial state once
  const [isInitialized, setIsInitialized] = useState(false)
  useEffect(() => {
    if (!isInitialized && prefillCheckedRef.current) {
      // Small delay to ensure all data is loaded
      const timeout = setTimeout(() => {
        initialCvDataRef.current = JSON.stringify(cvData)
        initialTemplateRef.current = selectedTemplate
        setIsDirty(false)
        setIsInitialized(true)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [cvData, selectedTemplate, isInitialized])

  // Track changes to detect if CV is dirty
  useEffect(() => {
    if (isInitialized && initialCvDataRef.current) {
      const currentData = JSON.stringify(cvData)
      const hasDataChanged = currentData !== initialCvDataRef.current
      const hasTemplateChanged = selectedTemplate !== initialTemplateRef.current
      setIsDirty(hasDataChanged || hasTemplateChanged)
    }
  }, [cvData, selectedTemplate, isInitialized])

  // Warn user before leaving page if there are unsaved changes
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      return e.returnValue
    }

    const handleRouteChange = () => {
      if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        throw new Error('Route change cancelled by user')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Note: Next.js router doesn't have a built-in way to intercept navigation
    // We'll handle this via the beforeunload event for external navigation
    // For internal navigation, we can add checks to Link components if needed

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  // Save draft to localStorage (debounced, user-scoped)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const timeout = setTimeout(() => {
      try {
        const draftKey = getUserKey(STORAGE_KEY)
        localStorage.setItem(draftKey, JSON.stringify(cvData))
      } catch (error) {
        console.error('Error saving draft:', error)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [cvData])

  const updateCvData = (updates: Partial<CvData>) => {
    setCvData((prev) => ({ ...prev, ...updates }))
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCvCheck = async () => {
    setShowCvCheck(true)
    setReviewLoading(true)
    setReviewResult(null)
    try {
      const response = await fetch('/api/cv/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      })
      const data = await response.json()
      setReviewResult(data)
    } catch (error: any) {
      setReviewResult({ ok: false, error: error?.message || 'Failed to check CV' })
    } finally {
      setReviewLoading(false)
    }
  }

  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())

  const handleGrammarCheck = async () => {
    setShowGrammar(true)
    setGrammarResult(null)
    setSelectedIssues(new Set())
    setGrammarLoading(true)
    try {
      const response = await fetch('/api/cv/grammar-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      })
      const data = await response.json()
      setGrammarResult(data)
      // Auto-select all safe fixes
      if (data.ok && data.issues) {
        const safeIssuePaths = new Set<string>(
          data.issues
            .filter((issue: GrammarIssue) => issue.isSafeFix)
            .map((issue: GrammarIssue) => issue.fieldPath)
            .filter((path): path is string => typeof path === 'string')
        )
        setSelectedIssues(safeIssuePaths)
      }
    } catch (error: any) {
      setGrammarResult({ ok: false, error: error?.message || 'Failed to check grammar' })
    } finally {
      setGrammarLoading(false)
    }
  }

  // Group issues by section
  const groupedIssues = useMemo(() => {
    if (!grammarResult?.ok || !grammarResult.issues) return {}
    
    const groups: Record<string, GrammarIssue[]> = {}
    grammarResult.issues.forEach((issue) => {
      let section = 'Other'
      if (issue.fieldPath.startsWith('personalInfo')) section = 'Personal Info'
      else if (issue.fieldPath.startsWith('summary')) section = 'Summary'
      else if (issue.fieldPath.startsWith('experience')) section = 'Experience'
      else if (issue.fieldPath.startsWith('education')) section = 'Education'
      else if (issue.fieldPath.startsWith('skills')) section = 'Skills'
      else if (issue.fieldPath.startsWith('projects')) section = 'Projects'
      else if (issue.fieldPath.startsWith('certifications')) section = 'Certifications'
      else if (issue.fieldPath.startsWith('languages')) section = 'Languages'
      else if (issue.fieldPath.startsWith('publications')) section = 'Publications'
      
      if (!groups[section]) groups[section] = []
      groups[section].push(issue)
    })
    
    return groups
  }, [grammarResult])

  // Apply a single fix by fieldPath
  const applySingleFix = (issue: GrammarIssue) => {
    const updates: Partial<CvData> = {}
    
    try {
      const fieldPath = issue.fieldPath
      
      // Personal Info
      if (fieldPath.startsWith('personalInfo.')) {
        const field = fieldPath.replace('personalInfo.', '') as keyof typeof cvData.personalInfo
        if (field && field in cvData.personalInfo) {
          updates.personalInfo = {
            ...cvData.personalInfo,
            [field]: issue.suggestion
          }
        }
      } 
      // Summary
      else if (fieldPath === 'summary') {
        updates.summary = issue.suggestion
      } 
      // Experience
      else if (fieldPath.startsWith('experience[')) {
        const expMatch = fieldPath.match(/experience\[(\d+)\]\.(\w+)(?:\[(\d+)\])?/)
        if (expMatch && cvData.experience[parseInt(expMatch[1], 10)]) {
          const expIdx = parseInt(expMatch[1], 10)
          const field = expMatch[2]
          const bulletIdx = expMatch[3] ? parseInt(expMatch[3], 10) : null
          const newExperience = [...cvData.experience]
          
          if (field === 'jobTitle') {
            newExperience[expIdx] = { ...newExperience[expIdx], jobTitle: issue.suggestion }
          } else if (field === 'company') {
            newExperience[expIdx] = { ...newExperience[expIdx], company: issue.suggestion }
          } else if (field === 'location') {
            newExperience[expIdx] = { ...newExperience[expIdx], location: issue.suggestion }
          } else if (field === 'bullets' && bulletIdx !== null && newExperience[expIdx].bullets[bulletIdx]) {
            const newBullets = [...newExperience[expIdx].bullets]
            newBullets[bulletIdx] = issue.suggestion
            newExperience[expIdx] = { ...newExperience[expIdx], bullets: newBullets }
          }
          updates.experience = newExperience
        }
      } 
      // Education
      else if (fieldPath.startsWith('education[')) {
        const eduMatch = fieldPath.match(/education\[(\d+)\]\.(\w+)/)
        if (eduMatch && cvData.education[parseInt(eduMatch[1], 10)]) {
          const eduIdx = parseInt(eduMatch[1], 10)
          const field = eduMatch[2]
          const newEducation = [...cvData.education]
          
          if (field === 'degree') {
            newEducation[eduIdx] = { ...newEducation[eduIdx], degree: issue.suggestion }
          } else if (field === 'school') {
            newEducation[eduIdx] = { ...newEducation[eduIdx], school: issue.suggestion }
          } else if (field === 'details') {
            newEducation[eduIdx] = { ...newEducation[eduIdx], details: issue.suggestion }
          }
          updates.education = newEducation
        }
      } 
      // Skills
      else if (fieldPath.startsWith('skills[')) {
        const skillMatch = fieldPath.match(/skills\[(\d+)\]/)
        if (skillMatch && cvData.skills[parseInt(skillMatch[1], 10)]) {
          const idx = parseInt(skillMatch[1], 10)
          const newSkills = [...cvData.skills]
          newSkills[idx] = issue.suggestion
          updates.skills = newSkills
        }
      } 
      // Projects
      else if (fieldPath.startsWith('projects[')) {
        const projMatch = fieldPath.match(/projects\[(\d+)\]\.(\w+)/)
        if (projMatch && cvData.projects && cvData.projects[parseInt(projMatch[1], 10)]) {
          const idx = parseInt(projMatch[1], 10)
          const field = projMatch[2]
          const newProjects = [...cvData.projects]
          
          if (field === 'name') {
            newProjects[idx] = { ...newProjects[idx], name: issue.suggestion }
          } else if (field === 'description') {
            newProjects[idx] = { ...newProjects[idx], description: issue.suggestion }
          }
          updates.projects = newProjects
        }
      } 
      // Certifications
      else if (fieldPath.startsWith('certifications[')) {
        const certMatch = fieldPath.match(/certifications\[(\d+)\]/)
        if (certMatch && cvData.certifications && cvData.certifications[parseInt(certMatch[1], 10)]) {
          const idx = parseInt(certMatch[1], 10)
          const newCertifications = [...cvData.certifications]
          newCertifications[idx] = issue.suggestion
          updates.certifications = newCertifications
        }
      } 
      // Languages
      else if (fieldPath.startsWith('languages[')) {
        const langMatch = fieldPath.match(/languages\[(\d+)\]/)
        if (langMatch && cvData.languages && cvData.languages[parseInt(langMatch[1], 10)]) {
          const idx = parseInt(langMatch[1], 10)
          const newLanguages = [...cvData.languages]
          newLanguages[idx] = issue.suggestion
          updates.languages = newLanguages
        }
      } 
      // Publications
      else if (fieldPath.startsWith('publications[')) {
        const pubMatch = fieldPath.match(/publications\[(\d+)\]\.(\w+)/)
        if (pubMatch && cvData.publications && cvData.publications[parseInt(pubMatch[1], 10)]) {
          const idx = parseInt(pubMatch[1], 10)
          const field = pubMatch[2]
          const newPublications = [...cvData.publications]
          
          if (field === 'title') {
            newPublications[idx] = { ...newPublications[idx], title: issue.suggestion }
          } else if (field === 'notes') {
            newPublications[idx] = { ...newPublications[idx], notes: issue.suggestion }
          }
          updates.publications = newPublications
        }
      }
      
      if (Object.keys(updates).length > 0) {
        updateCvData(updates)
        showToast('success', 'Applied fix. Review your CV to confirm.')
      }
    } catch (error) {
      console.error('Error applying fix:', error)
      showToast('error', 'Failed to apply fix. Please try again.')
    }
  }

  // Apply all selected fixes
  const applySelectedFixes = () => {
    if (!grammarResult?.ok || !grammarResult.issues) return
    
    const issuesToApply = grammarResult.issues.filter(issue => selectedIssues.has(issue.fieldPath))
    
    if (issuesToApply.length === 0) {
      showToast('error', 'No fixes selected.')
      return
    }
    
    // Apply fixes one by one (they update the same state)
    issuesToApply.forEach(issue => {
      applySingleFix(issue)
    })
    
    showToast('success', `Applied ${issuesToApply.length} fix${issuesToApply.length > 1 ? 'es' : ''}. Review your CV to confirm.`)
    setShowGrammar(false)
  }

  const canApplySafeFixes = !!(grammarResult?.ok && grammarResult.summary && grammarResult.summary.safeCount > 0)

  const handleExport = async (format: 'pdf' | 'docx') => {
    setLoading((prev) => ({ ...prev, export: true }))
    try {
      const name = cvData.personalInfo.fullName || 'CV'
      const date = new Date().toISOString().split('T')[0]
      const filename = `CV-${name.replace(/\s+/g, '-')}-${date}`

      if (format === 'pdf') {
        await exportToPDF('cv-preview', filename)
        showToast('success', 'PDF exported successfully!')
      } else {
        // Prepare sections for DOCX export
        const sections: Array<{ title: string; content: string[] }> = []

        // Contact Info
        const contactParts: string[] = []
        if (cvData.personalInfo.email) contactParts.push(cvData.personalInfo.email)
        if (cvData.personalInfo.phone) contactParts.push(cvData.personalInfo.phone)
        if (cvData.personalInfo.location) contactParts.push(cvData.personalInfo.location)
        if (cvData.personalInfo.linkedin) contactParts.push(cvData.personalInfo.linkedin)
        if (cvData.personalInfo.website) contactParts.push(cvData.personalInfo.website)
        if (contactParts.length > 0) {
          sections.push({ title: 'Contact Information', content: [contactParts.join(' · ')] })
        }

        // Summary
        if (cvData.summary.trim()) {
          sections.push({ title: 'Summary', content: [cvData.summary] })
        }

        // Experience - filter empty entries only at export time (non-destructive)
        const validExperiences = cvData.experience.filter(
          (exp) => exp.jobTitle?.trim() || exp.company?.trim()
        )
        const experienceContent = validExperiences.map((exp) => {
          const parts = [`${exp.jobTitle} at ${exp.company}`]
          if (exp.location) parts.push(exp.location)
          if (exp.startDate || exp.endDate) {
            const period = exp.isCurrent
              ? `${exp.startDate} - Present`
              : `${exp.startDate || ''} - ${exp.endDate || ''}`
            parts.push(period)
          }
          const validBullets = exp.bullets.filter((b) => b.trim())
          if (validBullets.length > 0) {
            parts.push('', ...validBullets)
          }
          return parts.join('\n')
        })
        if (experienceContent.length > 0) {
          sections.push({ title: 'Experience', content: experienceContent })
        }

        // Education - filter empty entries only at export time (non-destructive)
        const validEducations = cvData.education.filter(
          (edu) => edu.degree?.trim() || edu.school?.trim()
        )
        const educationContent = validEducations.map((edu) => {
          const parts = [edu.degree, edu.school]
          if (edu.year) parts.push(edu.year)
          if (edu.details) parts.push(edu.details)
          return parts.join(' · ')
        })
        if (educationContent.length > 0) {
          sections.push({ title: 'Education', content: educationContent })
        }

        // Skills
        if (cvData.skills.length > 0) {
          sections.push({ title: 'Skills', content: [cvData.skills.join(', ')] })
        }

        // Publications
        if (cvData.publications && cvData.publications.length > 0) {
          const publicationsContent = cvData.publications.map((pub) => {
            const parts: string[] = []
            parts.push(pub.title)
            const citationParts: string[] = []
            if (pub.authors) citationParts.push(pub.authors)
            if (pub.year) citationParts.push(`(${pub.year})`)
            if (citationParts.length > 0) parts.push(citationParts.join(' '))
            if (pub.venueOrJournal) parts.push(pub.venueOrJournal)
            if (pub.doiOrUrl) parts.push(pub.doiOrUrl)
            let result = parts.join(' — ')
            if (pub.notes) {
              result += `\n${pub.notes}`
            }
            return result
          })
          sections.push({ title: 'Publications', content: publicationsContent })
        }

        await exportToDocx(name, sections, filename)
        showToast('success', 'DOCX exported successfully!')
      }
    } catch (error: any) {
      console.error('Export error:', error)
      showToast('error', error.message || 'Export failed. Please try again.')
    } finally {
      setLoading((prev) => ({ ...prev, export: false }))
    }
  }

  const handleFindJobs = async () => {
    try {
      // Collect data for smart role extraction
      const summaryText = cvData.summary || ''
      
      // Get top 5 skills
      const topSkills = cvData.skills?.slice(0, 5) || []
      const skillsText = topSkills.join(', ')
      
      // Get the most recent experience job title (last in array, not first)
      const latestExperience = cvData.experience && cvData.experience.length > 0
        ? cvData.experience[cvData.experience.length - 1]
        : null
      const latestJobTitle = latestExperience?.jobTitle || ''
      
      // Build context text
      const contextParts: string[] = []
      if (summaryText.trim()) {
        contextParts.push(`Summary: ${summaryText.trim()}`)
      }
      if (skillsText.trim()) {
        contextParts.push(`Skills: ${skillsText}`)
      }
      if (latestJobTitle.trim()) {
        contextParts.push(`LatestExperience: ${latestJobTitle}`)
      }
      
      const contextText = contextParts.join(' ')
      
      // Fallback: if no context at all, show error
      if (!contextText.trim()) {
        showToast('error', 'Add a summary or at least one job title first.')
        return
      }
      
      // Call the extract-role API
      let extractedRole = ''
      try {
        const response = await fetch('/api/cv/extract-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ context: contextText }),
        })
        
        const data = await response.json()
        
        if (data.ok && data.role && data.role.trim()) {
          extractedRole = data.role.trim()
        }
      } catch (error) {
        console.error('Error calling extract-role API:', error)
        // Will fall through to fallback logic
      }
      
      // Fallback: use latest experience job title if API failed or returned empty
      const finalJobTitle = extractedRole || latestJobTitle
      
      if (!finalJobTitle.trim()) {
        showToast('error', 'Add a summary or at least one job title first.')
        return
      }
      
      // Redirect to job finder with the extracted role
      const encodedJobTitle = encodeURIComponent(finalJobTitle)
      router.push(`/job-finder?jobTitle=${encodedJobTitle}`)
    } catch (error) {
      console.error('Error in handleFindJobs:', error)
      showToast('error', 'Failed to find jobs. Please try again.')
    }
  }

  const handleSaveCvToDashboard = () => {
    try {
      if (typeof window === 'undefined') return

      // Create CV object with all current data including template
      const cvToSave = {
        id: `cv-${Date.now()}`, // Timestamp-based ID
        savedAt: new Date().toISOString(),
        template: selectedTemplate,
        personalInfo: cvData.personalInfo,
        summary: cvData.summary,
        experience: cvData.experience,
        education: cvData.education,
        skills: cvData.skills,
        projects: cvData.projects || [],
        languages: cvData.languages || [],
        certifications: cvData.certifications || [],
        publications: cvData.publications || [],
      }

      // Load existing CVs from localStorage (user-scoped)
      const cvsKey = getUserKey('cvs')
      const existingCvsJson = localStorage.getItem(cvsKey)
      let existingCvs: any[] = []
      
      if (existingCvsJson) {
        try {
          existingCvs = JSON.parse(existingCvsJson)
          if (!Array.isArray(existingCvs)) {
            existingCvs = []
          }
        } catch (error) {
          console.error('Error parsing existing CVs:', error)
          existingCvs = []
        }
      }

      // Check for duplicate CVs by comparing content (excluding id and savedAt)
      const cvContent = {
        template: cvToSave.template,
        personalInfo: cvToSave.personalInfo,
        summary: cvToSave.summary,
        experience: cvToSave.experience,
        education: cvToSave.education,
        skills: cvToSave.skills,
        projects: cvToSave.projects,
        languages: cvToSave.languages,
        certifications: cvToSave.certifications,
        publications: cvToSave.publications,
      }

      const isDuplicate = existingCvs.some(existingCv => {
        const existingContent = {
          template: existingCv.template,
          personalInfo: existingCv.personalInfo,
          summary: existingCv.summary,
          experience: existingCv.experience,
          education: existingCv.education,
          skills: existingCv.skills,
          projects: existingCv.projects || [],
          languages: existingCv.languages || [],
          certifications: existingCv.certifications || [],
          publications: existingCv.publications || [],
        }
        return JSON.stringify(cvContent) === JSON.stringify(existingContent)
      })

      if (isDuplicate) {
        showToast('error', 'This CV is already saved to your dashboard.')
        return
      }

      // Append new CV to the array
      existingCvs.push(cvToSave)

      // Save back to localStorage (user-scoped)
      localStorage.setItem(cvsKey, JSON.stringify(existingCvs))

      // Also save legacy flags (hasCV + baseCv) using the same scope logic
      const userId = getCurrentUserIdSync()
      const hasCvKey = userId ? getUserScopedKeySync('hasCV', userId) : 'jobaz_hasCV'
      const baseCvKey = userId ? getUserScopedKeySync('baseCv', userId) : 'jobaz_baseCv'
      
      // Set hasCV flag
      localStorage.setItem(hasCvKey, 'true')
      
      // Set baseCv (minimal object with essential fields from latest CV)
      const baseCv = {
        fullName: cvToSave.personalInfo?.fullName || '',
        email: cvToSave.personalInfo?.email || '',
        phone: cvToSave.personalInfo?.phone || '',
        city: cvToSave.personalInfo?.location || '',
        summary: cvToSave.summary || '',
        skills: cvToSave.skills || [],
        experience: cvToSave.experience || [],
        education: cvToSave.education || [],
      }
      localStorage.setItem(baseCvKey, JSON.stringify(baseCv))

      // Dispatch custom event to notify dashboard of CV save
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('jobaz-cv-saved'))
      }

      // Mark as saved (reset dirty state)
      initialCvDataRef.current = JSON.stringify(cvData)
      initialTemplateRef.current = selectedTemplate
      setIsDirty(false)

      // Show success toast
      showToast('success', 'CV saved to your dashboard!')
    } catch (error) {
      console.error('Error saving CV to dashboard:', error)
      showToast('error', 'Failed to save CV. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      {/* Main container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <PageHeader
          title="JobAZ – AI CV Builder"
          subtitle="Dark Neon CV Builder with AI tailoring"
          jobId={jobId}
          mode={mode}
          from="cvBuilder"
        />

        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={handleFindJobs}
            data-jaz-action="cv_find_jobs"
            className="rounded-full bg-slate-900/80 px-4 py-2 text-xs md:text-sm font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition"
          >
            Find jobs for this CV
          </button>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleSaveCvToDashboard}
              className={cn(
                'rounded-full px-4 py-2 text-xs md:text-sm font-medium text-slate-100 border transition flex items-center gap-2 relative',
                isDirty
                  ? 'bg-violet-900/80 border-violet-500/70 hover:border-violet-400/80 hover:bg-violet-800/80 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                  : 'bg-slate-900/80 border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100'
              )}
            >
              {isDirty && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
              )}
              <Save className="w-4 h-4" />
              {isDirty ? 'Save changes' : 'Save this CV to Dashboard'}
            </button>
            {isDirty && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400/90 ml-1">
                <span>⚠️</span>
                <span>You have unsaved changes. Don't forget to save your CV.</span>
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
          {/* LEFT: Editor & AI */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur overflow-hidden">
              <div className="flex border-b border-slate-700/60 gap-0.5">
                {[
                  { id: 'personal' as Tab, label: 'Personal Info' },
                  { id: 'summary' as Tab, label: 'Summary' },
                  { id: 'experience' as Tab, label: 'Experience' },
                  { id: 'education' as Tab, label: 'Education' },
                  { id: 'skills' as Tab, label: 'Skills' },
                  { id: 'more' as Tab, label: 'More' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-2 py-2.5 text-xs font-medium transition whitespace-nowrap relative',
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
              <div className="p-4 md:p-5">
                {activeTab === 'personal' && (
                  <div data-cv-tab="personal">
                    <PersonalInfoTab
                      personalInfo={cvData.personalInfo}
                      onUpdate={(updates) => {
                        const currentPersonalInfo = cvData.personalInfo ?? { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' }
                        updateCvData({ personalInfo: { ...currentPersonalInfo, ...updates } })
                      }}
                    />
                  </div>
                )}
                {activeTab === 'summary' && (
                  <div data-cv-tab="summary">
                    <SummaryTab
                      summary={cvData.summary}
                      personalInfo={cvData.personalInfo}
                      skills={cvData.skills}
                      experience={cvData.experience}
                      onUpdate={(summary) => updateCvData({ summary })}
                      onLoadingChange={(loading) => setLoading((prev) => ({ ...prev, ai: loading }))}
                    />
                  </div>
                )}
                {activeTab === 'experience' && (
                  <div data-cv-section="experience" data-cv-tab="experience">
                    <ExperienceTab
                      experience={cvData.experience}
                      onUpdate={(experience) => updateCvData({ experience })}
                    />
                  </div>
                )}
                {activeTab === 'education' && (
                  <div data-cv-tab="education">
                    <EducationTab
                      education={cvData.education}
                      onUpdate={(education) => updateCvData({ education })}
                    />
                  </div>
                )}
                {activeTab === 'skills' && (() => {
                  // Build context for AI suggestions
                  // Target role: use first experience job title, or empty if none
                  const targetRole = cvData.experience?.[0]?.jobTitle || ''
                  
                  // Summary text
                  const summaryText = cvData.summary || ''
                  
                  // Experience preview: build from first 1-2 experience entries
                  const experiencePreview = cvData.experience
                    .slice(0, 2)
                    .map((exp) => {
                      const parts = [exp.jobTitle]
                      if (exp.company) parts.push(`at ${exp.company}`)
                      if (exp.bullets && exp.bullets.length > 0) {
                        parts.push(exp.bullets.slice(0, 2).join(' '))
                      }
                      return parts.join(' ')
                    })
                    .join('. ')
                  
                  return (
                    <div data-cv-tab="skills">
                      <SkillsTab
                        skills={cvData.skills}
                        onUpdate={(skills) => updateCvData({ skills })}
                        targetRole={targetRole}
                        summaryText={summaryText}
                        experiencePreview={experiencePreview}
                        onToast={showToast}
                        jobDescription={jobDescription}
                      />
                    </div>
                  )
                })()}
                {activeTab === 'more' && (
                  <div data-cv-tab="more">
                    <MoreTab
                      projects={cvData.projects || []}
                      languages={cvData.languages || []}
                      certifications={cvData.certifications || []}
                      publications={cvData.publications || []}
                      onUpdate={(updates) => updateCvData({ ...updates })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Job Description & AI Tailoring Panel */}
            <JobDescriptionPanel
              cvData={cvData}
              onCvDataUpdate={updateCvData}
              onLoadingChange={(loading) => setLoading((prev) => ({ ...prev, ai: loading }))}
              onJobDescriptionChange={setJobDescription}
            />
          </div>

          {/* RIGHT: Templates & Preview */}
          <div className="space-y-3">
            {/* Compact sticky toolbar (desktop sticky, mobile normal) */}
            <div className="lg:sticky lg:top-4 lg:z-40">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur px-3 py-2">
                <div className="w-full space-y-2">
                  {/* Shared toolbar button style - rounded-lg, unified sizing */}
                  {/* Row 1: Templates + Downloads */}
                  <div className="flex w-full items-center justify-between gap-3">
                    {/* Left group: Template label + buttons */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400 font-medium">Template</span>
                      <button
                        onClick={() => setSelectedTemplate('atsClassic')}
                        className={cn(
                          'inline-flex items-center justify-center h-8 px-3 py-1.5 text-sm font-medium rounded-lg border transition shrink-0 gap-2',
                          selectedTemplate === 'atsClassic'
                            ? 'border-violet-500 text-violet-200 bg-violet-500/15 shadow-[0_0_10px_rgba(139,92,246,0.45)]'
                            : 'border-slate-700/60 text-slate-300 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-100 hover:bg-slate-800/50'
                        )}
                      >
                        ATS Classic
                      </button>
                      <button
                        onClick={() => setSelectedTemplate('twoColumnPro')}
                        className={cn(
                          'inline-flex items-center justify-center h-8 px-3 py-1.5 text-sm font-medium rounded-lg border transition shrink-0 gap-2',
                          selectedTemplate === 'twoColumnPro'
                            ? 'border-violet-500 text-violet-200 bg-violet-500/15 shadow-[0_0_10px_rgba(139,92,246,0.45)]'
                            : 'border-slate-700/60 text-slate-300 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-100 hover:bg-slate-800/50'
                        )}
                      >
                        Two Column Pro
                      </button>
                    </div>
                    {/* Right group: PDF + DOCX */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport('pdf')}
                        disabled={loading.export}
                        className="inline-flex items-center justify-center h-8 px-3 py-1.5 text-sm font-semibold text-white rounded-lg bg-violet-600/90 border border-violet-400/60 shadow-[0_0_18px_rgba(139,92,246,0.55)] hover:bg-violet-500 hover:border-violet-300 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 gap-2"
                      >
                        {loading.export ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        PDF
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        disabled={loading.export}
                        className="inline-flex items-center justify-center h-8 px-3 py-1.5 text-sm font-semibold text-white rounded-lg bg-violet-600/90 border border-violet-400/60 shadow-[0_0_18px_rgba(139,92,246,0.55)] hover:bg-violet-500 hover:border-violet-300 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 gap-2"
                      >
                        {loading.export ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        DOCX
                      </button>
                    </div>
                  </div>

                  {/* Row 2: AI + Score + Grammar */}
                  <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3">
                    {/* Left: CV Check (AI) */}
                    <button
                      onClick={handleCvCheck}
                      disabled={reviewLoading || grammarLoading}
                      className="inline-flex items-center justify-center h-8 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-br from-sky-900/30 to-slate-800/50 border border-sky-500/70 text-sky-200 hover:border-sky-400/80 hover:text-sky-100 shadow-lg shadow-sky-900/30 hover:shadow-sky-900/40 backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-sky-500/70 disabled:hover:text-sky-200 disabled:hover:shadow-sky-900/30 shrink-0 gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      CV Check (AI)
                    </button>
                    
                    {/* Center: CV Score */}
                    {cvScore && (
                      <div 
                        className="text-center justify-self-center whitespace-nowrap"
                        title="CV Score shows how complete and ATS-ready your CV is."
                      >
                        <span className="text-sm text-slate-400">
                          CV Score{' '}
                          <span
                            className={cn(
                              'text-sm font-bold',
                              cvScore.score >= 70
                                ? 'text-green-400'
                                : cvScore.score >= 40 && cvScore.score <= 69
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block mr-1',
                                cvScore.score >= 70
                                  ? 'text-green-400'
                                  : cvScore.score >= 40 && cvScore.score <= 69
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              )}
                            >
                              •
                            </span>
                            {cvScore.score}/100
                          </span>
                        </span>
                      </div>
                    )}
                    
                    {/* Right: Grammar & Spelling */}
                    <button
                      onClick={handleGrammarCheck}
                      disabled={reviewLoading || grammarLoading}
                      className="inline-flex items-center justify-center h-8 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-br from-amber-900/30 to-slate-800/50 border border-amber-500/60 text-amber-200 hover:border-amber-400/70 hover:text-amber-100 shadow-lg shadow-amber-900/20 hover:shadow-amber-900/30 backdrop-blur-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-amber-500/60 disabled:hover:text-amber-200 disabled:hover:shadow-amber-900/20 shrink-0 gap-2"
                    >
                      <FileEdit className="w-4 h-4" />
                      Grammar &amp; Spelling
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* A4 Preview - keep preview component unchanged */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-3 md:p-4 flex items-center justify-center min-h-[600px]">
              <div className="mx-auto aspect-[1/1.414] w-full max-w-[460px] bg-white text-slate-900 shadow-lg overflow-hidden rounded-md">
                <div id="cv-preview" ref={previewRef} className="p-8 h-full overflow-y-auto">
                  <CvPreview data={cvData} template={selectedTemplate} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* CV Check modal */}
      {showCvCheck && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !reviewLoading && setShowCvCheck(false)}
          />
          <div className="absolute left-1/2 top-20 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-slate-700/60 bg-slate-950/90 backdrop-blur shadow-[0_18px_40px_rgba(15,23,42,0.9)] p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-200">CV Check (AI)</div>
                <div className="text-xs text-slate-400">Score + top fixes + issues list</div>
              </div>
              <button
                onClick={() => setShowCvCheck(false)}
                disabled={reviewLoading}
                className="rounded-full border border-slate-700/60 bg-slate-900/40 px-2 py-1 text-xs text-slate-300 hover:text-slate-100 hover:border-slate-600/80 transition disabled:opacity-50"
              >
                Close
              </button>
            </div>

            {reviewLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                Running CV check…
              </div>
            )}

            {!reviewLoading && reviewResult?.ok && (
              <div className="space-y-3">
                {/* Gate message */}
                {reviewResult.isGated && reviewResult.gateMessage && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                    <div className="text-xs font-medium text-amber-300">{reviewResult.gateMessage}</div>
                  </div>
                )}

                {/* Final Score */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Final Score</span>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      (reviewResult.score ?? 0) >= 80 ? 'text-green-400' : (reviewResult.score ?? 0) >= 55 ? 'text-yellow-400' : 'text-red-400'
                    )}
                  >
                    {reviewResult.score ?? '—'}/100
                  </span>
                </div>

                {/* Sub-scores */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Completion</div>
                    <div className="text-xs font-semibold text-slate-200">
                      {reviewResult.completionScore ?? '—'}/60
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Quality</div>
                    <div className="text-xs font-semibold text-slate-200">
                      {reviewResult.qualityScore ?? '—'}/40
                    </div>
                  </div>
                </div>

                {/* Level */}
                {reviewResult.level && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Level</span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        reviewResult.level === 'Strong' ? 'text-green-400' : reviewResult.level === 'Good' ? 'text-yellow-400' : 'text-red-400'
                      )}
                    >
                      {reviewResult.level}
                    </span>
                  </div>
                )}

                {/* Top fixes */}
                {reviewResult.topFixes && reviewResult.topFixes.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">Top fixes</div>
                    <ul className="space-y-1 pl-4">
                      {reviewResult.topFixes.slice(0, 5).map((fix, idx) => (
                        <li key={idx} className="text-xs text-slate-200 list-disc">
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional notes */}
                {reviewResult.notes && reviewResult.notes.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">Additional issues</div>
                    <ul className="space-y-1 pl-4 max-h-56 overflow-y-auto">
                      {reviewResult.notes.map((note, idx) => (
                        <li key={idx} className="text-xs text-slate-200 list-disc">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!reviewLoading && reviewResult && !reviewResult.ok && (
              <div className="flex items-start gap-2 text-xs text-red-300">
                <X className="w-4 h-4 mt-0.5" />
                <div>{reviewResult.error || 'CV check failed. Please try again.'}</div>
              </div>
            )}

            {!reviewLoading && !reviewResult && (
              <div className="text-xs text-slate-400">No results yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Grammar & Spelling modal (Full CV) */}
      {showGrammar && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !grammarLoading && setShowGrammar(false)}
          />
          <div className="absolute left-1/2 top-12 w-[min(720px,calc(100vw-2rem))] max-h-[85vh] -translate-x-1/2 rounded-2xl border border-slate-700/60 bg-slate-950/90 backdrop-blur shadow-[0_18px_40px_rgba(15,23,42,0.9)] p-4 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-3 flex-shrink-0">
              <div>
                <div className="text-sm font-semibold text-slate-200">Grammar &amp; Spelling (Full CV)</div>
                <div className="text-xs text-slate-400">Review issues grouped by section</div>
              </div>
              <div className="flex items-center gap-2">
                {canApplySafeFixes && (
                  <button
                    onClick={applySelectedFixes}
                    disabled={grammarLoading || selectedIssues.size === 0}
                    className="rounded-full border border-violet-500/60 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply safe fixes ({selectedIssues.size})
                  </button>
                )}
                <button
                  onClick={() => setShowGrammar(false)}
                  disabled={grammarLoading}
                  className="rounded-full border border-slate-700/60 bg-slate-900/40 px-2 py-1 text-xs text-slate-300 hover:text-slate-100 hover:border-slate-600/80 transition disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>

            {grammarLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-300 flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning entire CV for grammar and spelling issues…
              </div>
            )}

            {!grammarLoading && grammarResult?.ok && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Summary stats */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <span className="text-xs text-slate-400">Total Issues</span>
                  <span className={cn('text-sm font-semibold', (grammarResult.summary?.issueCount || 0) === 0 ? 'text-green-400' : 'text-yellow-300')}>
                    {(grammarResult.summary?.issueCount || 0) === 0 ? 'No issues found' : `${grammarResult.summary?.issueCount || 0} issue${(grammarResult.summary?.issueCount || 0) > 1 ? 's' : ''}`}
                  </span>
                </div>
                {grammarResult.summary && grammarResult.summary.safeCount > 0 && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <span className="text-xs text-slate-400">Safe fixes available</span>
                    <span className="text-xs font-semibold text-green-400">{grammarResult.summary.safeCount}</span>
                  </div>
                )}

                {/* Grouped issues by section (accordion) */}
                {Object.keys(groupedIssues).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(groupedIssues).map(([section, issues]) => (
                      <GrammarSectionAccordion
                        key={section}
                        section={section}
                        issues={issues}
                        selectedIssues={selectedIssues}
                        onToggleIssue={(fieldPath) => {
                          const newSelected = new Set(selectedIssues)
                          if (newSelected.has(fieldPath)) {
                            newSelected.delete(fieldPath)
                          } else {
                            newSelected.add(fieldPath)
                          }
                          setSelectedIssues(newSelected)
                        }}
                        onApplyFix={applySingleFix}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-400 py-4">
                    <CheckCircle2 className="w-4 h-4" />
                    No issues found
                  </div>
                )}
              </div>
            )}

            {!grammarLoading && grammarResult && !grammarResult.ok && (
              <div className="flex items-start gap-2 text-xs text-red-300 flex-shrink-0">
                <X className="w-4 h-4 mt-0.5" />
                <div>{grammarResult.error || 'Grammar check failed. Please try again.'}</div>
              </div>
            )}

            {!grammarLoading && !grammarResult && (
              <div className="text-xs text-slate-400 flex-shrink-0">No results yet.</div>
            )}
          </div>
        </div>
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

