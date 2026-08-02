'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
import CvHealthPanel from '@/components/cv-builder-v2/CvHealthPanel'
import CvAiWorkflowStrip from '@/components/cv-builder-v2/CvAiWorkflowStrip'
import CvBuilderJourneyHeader from '@/components/cv-builder-v2/CvBuilderJourneyHeader'
import CvBuilderCompletionPanel from '@/components/cv-builder-v2/CvBuilderCompletionPanel'
import CvQualificationCompletionPrompt from '@/components/cv-builder-v2/CvQualificationCompletionPrompt'
import CvCourseActionPrompt from '@/components/cv-builder-v2/CvCourseActionPrompt'
import CvCustomizationPanel, { type CvCustomizationOptions } from '@/components/cv-builder-v2/CvCustomizationPanel'
import PublicToolLayout from '@/components/guest-tools/PublicToolLayout'
import { useJazContext } from '@/contexts/JazContextContext'
import type { CvBuilderContext } from '@/components/JazAssistant'
import { getUserScopedKeySync, getCurrentUserIdSync, initUserStorageCache } from '@/lib/user-storage'
import { useToolGuestMode } from '@/lib/guest-tools/useToolGuestMode'
import { certificationLabel, type CvCertificationEntry } from '@/lib/cv/cvCertification'
import {
  hasGuestDraft,
  readGuestDraft,
  writeGuestDraft,
  clearGuestDraft,
} from '@/lib/guest-tools/storage'
import GuestDraftPickerModal from '@/components/guest-tools/GuestDraftPickerModal'
import { useCvHealth } from '@/hooks/useCvHealth'
import { useCvBuilderCareerMode } from '@/hooks/useCvBuilderCareerMode'
import { useCvPlanSuggestions } from '@/hooks/useCvPlanSuggestions'
import CvPlanStageSwitcher from '@/components/cv-builder-v2/CvPlanStageSwitcher'
import {
  ACTION_PLAN_TASK,
  markActionPlanTask,
} from '@/lib/dashboard/careerOs/actionPlanProgress'
import { useCvTrainingQualifications } from '@/hooks/useCvTrainingQualifications'
import {
  buildCvCareerReadiness,
  getCvJourneyNextStep,
  type CvReadinessBoost,
} from '@/lib/cv-builder/cvCareerReadiness'
import {
  mergeQualificationIntoCvData,
  persistCvDraftFromData,
} from '@/lib/cv-builder/addTrainingQualification'
import {
  loadRecentQualificationBoost,
  pickPendingCvCompletionPrompt,
  pickQualificationReminder,
  saveRecentQualificationBoost,
  isQualificationInCvData,
  type CvTrainingQualification,
} from '@/lib/cv-builder/trainingQualifications'
import {
  dismissCourseInterest,
  pickPendingCourseActionPrompt,
  updateCourseInterestStatus,
  type CourseInterestRecord,
} from '@/lib/cv-builder/courseInterest'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'
import { slugifyCourseName } from '@/lib/career-hub/slug'
import { enrichQualificationsForCvPanel } from '@/lib/cv-builder/cvQualificationScoring'
import {
  resolveActiveCv,
  setSessionDraftChoice,
  wasGuestPickerShownThisSession,
  markGuestPickerShownThisSession,
  setStoredActiveCvId,
  normalizeToCvData,
  type ActiveCvSource,
} from '@/lib/cv/getActiveCv'
import { isMeaningfulCv } from '@/lib/cv/isMeaningfulCv'
import {
  enrichAiHintsWithCareerPlan,
  getCareerWorkflowSubtitle,
} from '@/lib/cv-builder/careerGuidanceCopy'
import { logEvent } from '@/lib/analytics/logEvent'

export type CvTemplateId = 'atsClassic' | 'twoColumnPro' | 'customizeStyle'

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
  /** Legacy strings or structured certification objects */
  certifications?: import('@/lib/cv/cvCertification').CvCertificationEntry[]
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

/** Heuristic: CV has enough content to count as completed for AI readiness. */
function isCvCompletedForAi(data: CvData): boolean {
  const hasName = Boolean(data.personalInfo?.fullName?.trim())
  const hasSummary = Boolean(data.summary?.trim())
  const hasExperience = data.experience?.some(
    (e) => Boolean(e.jobTitle?.trim()) || Boolean(e.company?.trim())
  )
  const hasSkills = (data.skills?.length ?? 0) > 0
  return hasName && (hasSummary || hasExperience) && hasSkills
}

const STORAGE_KEY = 'jobaz-cv-v2-draft'

/** Ensure builder UI always has editable experience/education shells. */
function prepareCvForEditor(raw: CvData): CvData {
  const normalized = normalizeToCvData(raw)
  const defaultPersonalInfo = {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
  }
  const loadedExperience =
    Array.isArray(normalized.experience) && normalized.experience.length > 0
      ? normalized.experience
      : [{ id: Date.now().toString(), jobTitle: '', company: '', bullets: [''] }]
  const loadedEducation =
    Array.isArray(normalized.education) && normalized.education.length > 0
      ? normalized.education
      : [{ degree: '', school: '' }]

  return {
    ...normalized,
    personalInfo: {
      ...defaultPersonalInfo,
      ...normalized.personalInfo,
    },
    experience: loadedExperience,
    education: loadedEducation,
    skills: Array.isArray(normalized.skills) ? normalized.skills : [],
    projects: Array.isArray(normalized.projects) ? normalized.projects : [],
    languages: Array.isArray(normalized.languages) ? normalized.languages : [],
    certifications: Array.isArray(normalized.certifications) ? normalized.certifications : [],
    publications: Array.isArray(normalized.publications) ? normalized.publications : [],
  }
}

// Accordion component for grouped grammar issues
function GrammarSectionAccordion({
  section,
  issues,
  getIssueId,
  selectedIssueIds,
  applyingIssueId,
  errorByIssueId,
  onToggleIssue,
  onApplyFix,
}: {
  section: string
  issues: GrammarIssue[]
  getIssueId: (issue: GrammarIssue) => string
  selectedIssueIds: Set<string>
  applyingIssueId: string | null
  errorByIssueId: Record<string, string>
  onToggleIssue: (issueId: string) => void
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
          {issues.map((issue, idx) => {
            const issueId = getIssueId(issue)
            const isApplying = applyingIssueId === issueId
            const rowError = errorByIssueId[issueId]
            return (
              <div key={issueId} className="rounded-lg border border-slate-700/40 bg-slate-950/60 p-2.5">
                <div className="flex items-start gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIssueIds.has(issueId)}
                    onChange={() => onToggleIssue(issueId)}
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
                    {rowError && (
                      <div className="text-[10px] text-red-400 mt-1">{rowError}</div>
                    )}
                  </div>
                  <button
                    onClick={() => onApplyFix(issue)}
                    disabled={isApplying}
                    className="apply-button rounded-full border border-violet-500/60 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 text-[10px] font-semibold transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Applying…
                      </>
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
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

// Stable unique id for an issue (fieldPath + span + suggestion)
function getIssueId(issue: GrammarIssue): string {
  return `${issue.fieldPath}\0${issue.original}\0${issue.suggestion}`
}

// Get current string value for a field path (for already-fixed invalidation)
function getFieldValue(state: CvData, fieldPath: string): string {
  if (!fieldPath) return ''
  if (fieldPath.startsWith('personalInfo.')) {
    const field = fieldPath.replace('personalInfo.', '') as keyof typeof state.personalInfo
    return String(state.personalInfo?.[field] ?? '')
  }
  if (fieldPath === 'summary') return state.summary ?? ''
  const expMatch = fieldPath.match(/^experience\[(\d+)\]\.(\w+)(?:\[(\d+)\])?$/)
  if (expMatch) {
    const expIdx = parseInt(expMatch[1], 10)
    const field = expMatch[2]
    const bulletIdx = expMatch[3] != null ? parseInt(expMatch[3], 10) : null
    const exp = state.experience?.[expIdx]
    if (!exp) return ''
    if (field === 'jobTitle') return exp.jobTitle ?? ''
    if (field === 'company') return exp.company ?? ''
    if (field === 'location') return exp.location ?? ''
    if (field === 'bullets' && bulletIdx != null) return exp.bullets?.[bulletIdx] ?? ''
    return ''
  }
  const eduMatch = fieldPath.match(/^education\[(\d+)\]\.(\w+)$/)
  if (eduMatch) {
    const eduIdx = parseInt(eduMatch[1], 10)
    const field = eduMatch[2]
    const edu = state.education?.[eduIdx]
    if (!edu) return ''
    if (field === 'degree') return edu.degree ?? ''
    if (field === 'school') return edu.school ?? ''
    if (field === 'details') return edu.details ?? ''
    return ''
  }
  const skillMatch = fieldPath.match(/^skills\[(\d+)\]$/)
  if (skillMatch) return state.skills?.[parseInt(skillMatch[1], 10)] ?? ''
  const certMatch = fieldPath.match(/^certifications\[(\d+)\]$/)
  if (certMatch) {
    const entry = state.certifications?.[parseInt(certMatch[1], 10)]
    return entry != null ? certificationLabel(entry) : ''
  }
  const langMatch = fieldPath.match(/^languages\[(\d+)\]$/)
  if (langMatch) return state.languages?.[parseInt(langMatch[1], 10)] ?? ''
  const projMatch = fieldPath.match(/^projects\[(\d+)\]\.(\w+)$/)
  if (projMatch) {
    const proj = state.projects?.[parseInt(projMatch[1], 10)]
    if (!proj) return ''
    if (projMatch[2] === 'name') return proj.name ?? ''
    if (projMatch[2] === 'description') return proj.description ?? ''
    return ''
  }
  const pubMatch = fieldPath.match(/^publications\[(\d+)\]\.(\w+)$/)
  if (pubMatch) {
    const pub = state.publications?.[parseInt(pubMatch[1], 10)]
    if (!pub) return ''
    if (pubMatch[2] === 'title') return pub.title ?? ''
    if (pubMatch[2] === 'notes') return pub.notes ?? ''
    return ''
  }
  return ''
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
  const improveTargetRole = searchParams.get('targetRole')
  const improveRoute = searchParams.get('route')
  const improveFocus = searchParams.get('focus')
  const planTask = searchParams.get('planTask')
  const previewRef = useRef<HTMLDivElement>(null)
  const prefillCheckedRef = useRef(false)
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>('atsClassic')
  const [loading, setLoading] = useState({ export: false, ai: false })
  const [customizationOptions, setCustomizationOptions] = useState<CvCustomizationOptions>({
    fontFamily: 'inter',
    fontSize: 'medium',
    lineSpacing: 'normal',
    headingFontWeight: 'bold',
    headingUnderline: false,
    sectionSpacing: 'normal',
  })
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const { setContext } = useJazContext()
  const [jobDescription, setJobDescription] = useState<string>('')
  const [stylePanelOpen, setStylePanelOpen] = useState(true)

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

  const guest = useToolGuestMode('cv')
  const [draftPickerOpen, setDraftPickerOpen] = useState(false)
  const [cvSource, setCvSource] = useState<ActiveCvSource>('none')
  const [activeCvId, setActiveCvId] = useState<string | null>(null)
  const [cvLastUpdated, setCvLastUpdated] = useState<string | null>(null)
  const [cvHydrated, setCvHydrated] = useState(false)
  const [cvLoadWarnings, setCvLoadWarnings] = useState<string[]>([])
  const draftPickerCheckedRef = useRef(false)

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

  const { isCareerMode, plan, roleHeadline, mission } = useCvBuilderCareerMode()
  const {
    suggestions: planSuggestions,
    setStageOverride,
  } = useCvPlanSuggestions({
    plan,
    routeTitle: improveRoute || plan?.planTitle || plan?.pathLabel,
    currentTarget: improveTargetRole || plan?.currentTarget || plan?.targetRole,
    nextUpgrade: plan?.nextUpgrade,
    cvData,
  })

  // First Action Plan: opening CV Builder marks the CV step in progress
  useEffect(() => {
    if (planTask === ACTION_PLAN_TASK.CV || planTask === 'cv-security') {
      markActionPlanTask(ACTION_PLAN_TASK.CV, 'in_progress')
    }
  }, [planTask])

  const readinessCareerPlan = useMemo(() => {
    // Do not read localStorage/sync plan here — that breaks SSR hydration.
    // Prefer URL params + plan from useCvBuilderCareerMode (post-mount).
    const fromUrl = improveFocus
      ? improveFocus.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    const planTitle = improveRoute || plan?.planTitle || plan?.pathLabel || null
    const currentTarget =
      improveTargetRole || plan?.currentTarget || plan?.targetRole || null
    const nextUpgrade = plan?.nextUpgrade || null
    const focusKeywords =
      fromUrl.length > 0
        ? fromUrl
        : plan?.cvFocusKeywords?.length
          ? plan.cvFocusKeywords
          : undefined

    return {
      targetRole: currentTarget,
      currentTarget,
      nextUpgrade,
      routeTitle: planTitle,
      focusKeywords,
      planSource: plan?.planSource || ('none' as const),
      planId: plan?.planId || null,
    }
  }, [improveTargetRole, improveRoute, improveFocus, plan])

  const { report: cvHealthReport, scoreDelta } = useCvHealth(
    cvData,
    jobDescription,
    readinessCareerPlan
  )

  const {
    qualifications,
    completedCount,
    totalCount,
    roadmapReadinessPercent,
    loaded: qualificationsLoaded,
  } = useCvTrainingQualifications()
  const [completionDismissed, setCompletionDismissed] = useState(false)
  const [dismissedPromptSlug, setDismissedPromptSlug] = useState<string | null>(null)
  const [courseActionTick, setCourseActionTick] = useState(0)
  const [recentBoost, setRecentBoost] = useState<CvReadinessBoost | null>(() => {
    const stored = loadRecentQualificationBoost()
    return stored ? { label: stored.name, delta: stored.delta } : null
  })
  const jdPanelRef = useRef<HTMLDivElement>(null)

  const showTrainingJourney = qualifications.length > 0
  const qualificationReminder = useMemo(
    () => (showTrainingJourney ? pickQualificationReminder(qualifications, cvData, cvHealthReport.overallScore) : null),
    [showTrainingJourney, qualifications, cvData, cvHealthReport.overallScore]
  )
  const pendingCourseAction = useMemo(() => {
    void courseActionTick
    const pending = pickPendingCourseActionPrompt()
    if (!pending) return null
    if (pending.slug === dismissedPromptSlug) return null
    return pending
  }, [courseActionTick, qualificationsLoaded, dismissedPromptSlug])
  const pendingQualificationPrompt = useMemo(() => {
    // Prefer course-action prompt: a click must never look like auto-completion.
    if (pendingCourseAction) return null
    if (!showTrainingJourney) return null
    const pending = pickPendingCvCompletionPrompt(qualifications, cvData)
    if (!pending || pending.slug === dismissedPromptSlug) return null
    return pending
  }, [showTrainingJourney, qualifications, cvData, dismissedPromptSlug, pendingCourseAction])

  useEffect(() => {
    const refresh = () => setCourseActionTick((n) => n + 1)
    window.addEventListener('jobaz-course-interest-updated', refresh)
    return () => window.removeEventListener('jobaz-course-interest-updated', refresh)
  }, [])

  const atsMatch = cvHealthReport.metrics.find((m) => m.id === 'ats')?.progress ?? 0

  const careerAiHints = useMemo(() => {
    if (!plan) return cvHealthReport.aiHints
    return enrichAiHintsWithCareerPlan(cvHealthReport.aiHints, plan)
  }, [cvHealthReport.aiHints, plan])

  const displayPotentialScore = useMemo(() => {
    const fromHealth = cvHealthReport.potentialScore
    if (!showTrainingJourney) return fromHealth
    const train = enrichQualificationsForCvPanel(qualifications, cvHealthReport.overallScore)
    return Math.max(fromHealth, train.potentialScore)
  }, [cvHealthReport.potentialScore, cvHealthReport.overallScore, showTrainingJourney, qualifications])

  const needsRouteTailoring =
    cvSource === 'saved' &&
    (cvHealthReport.planCvMatch === 'mismatch' || cvHealthReport.planCvMatch === 'partial_match')

  const careerReadiness = useMemo(() => {
    if (!isCareerMode && !showTrainingJourney) return null
    return buildCvCareerReadiness(
      cvData,
      cvHealthReport.overallScore,
      atsMatch,
      jobDescription.trim().length > 0,
      mission,
      {
        planReadinessScore: plan?.readinessScore,
        completedQualifications: completedCount,
        totalQualifications: totalCount,
        roadmapReadinessPercent,
        recentBoost,
      }
    )
  }, [
    isCareerMode,
    showTrainingJourney,
    cvData,
    cvHealthReport.overallScore,
    atsMatch,
    jobDescription,
    mission,
    plan?.readinessScore,
    completedCount,
    totalCount,
    roadmapReadinessPercent,
    recentBoost,
  ])

  const journeyNextStep = useMemo(() => {
    if (!isCareerMode) return null
    return getCvJourneyNextStep(
      cvHealthReport.overallScore,
      jobDescription.trim().length > 0,
      atsMatch,
      mission.appliedJobsCount
    )
  }, [
    isCareerMode,
    cvHealthReport.overallScore,
    jobDescription,
    atsMatch,
    mission.appliedJobsCount,
  ])

  const showCompletionPanel =
    isCareerMode &&
    !completionDismissed &&
    cvHealthReport.overallScore >= 55 &&
    journeyNextStep !== null

  // Compute JAZ context for CV Builder
  const jazContext = useMemo<CvBuilderContext>(() => {
    // Count words in summary (approximate)
    const summaryTextLength = cvData.summary.trim().split(/\s+/).filter(Boolean).length
    
    return {
      page: 'cv-builder',
      activeTab,
      atsScore: cvHealthReport.overallScore || null,
      summaryTextLength,
      experienceCount: cvData.experience.length,
      skillsCount: cvData.skills.length,
      hasJobDescription: jobDescription.trim().length > 0,
      template: selectedTemplate,
      careerMode: isCareerMode,
      targetRole: plan?.targetRole ?? null,
      pathLabel: plan?.pathLabel ?? null,
      careerReadinessScore: cvHealthReport.overallScore ?? null,
      suggestedSkills: plan?.suggestedSkills ?? [],
    }
  }, [
    activeTab,
    cvData.summary,
    cvData.experience.length,
    cvData.skills.length,
    jobDescription,
    selectedTemplate,
    cvHealthReport.overallScore,
    isCareerMode,
    plan,
  ])

  // Update JAZ context when it changes
  useEffect(() => {
    setContext(jazContext)
    return () => setContext(null) // Cleanup on unmount
  }, [jazContext, setContext])

  // Dev console only — never show plan/cv debug on the page
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !cvHydrated) return
    console.debug('[cvBuilder]', {
      activePlanId: plan?.planId || readinessCareerPlan.planId || null,
      activePlanTitle: plan?.planTitle || readinessCareerPlan.routeTitle || null,
      planSource: plan?.planSource || readinessCareerPlan.planSource || 'none',
      cvId: activeCvId,
      cvSource: cvSource === 'none' ? 'empty' : cvSource === 'guest_draft' ? 'guest' : 'saved',
      readinessScore: cvHealthReport.overallScore,
      planCvMatch: cvHealthReport.planCvMatch,
    })
  }, [
    cvHydrated,
    plan?.planId,
    plan?.planTitle,
    plan?.planSource,
    readinessCareerPlan.planId,
    readinessCareerPlan.routeTitle,
    readinessCareerPlan.planSource,
    activeCvId,
    cvSource,
    cvHealthReport.overallScore,
    cvHealthReport.planCvMatch,
  ])

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

  // Resolve active CV: saved account CV first (by cvId / primary), guest draft only when chosen / no saved
  useEffect(() => {
    if (typeof window === 'undefined' || !guest.authReady) return

    let cancelled = false

    const hydrate = async () => {
      setCvHydrated(false)

      if (guest.isGuest) {
        const draft = readGuestDraft<{ cvData?: CvData; selectedTemplate?: CvTemplateId }>('cv')
        if (!cancelled && draft?.cvData) {
          setCvData(prepareCvForEditor(draft.cvData))
          if (draft.selectedTemplate) setSelectedTemplate(draft.selectedTemplate)
          setCvSource('guest_draft')
          setActiveCvId(null)
          setCvLastUpdated(null)
          setCvLoadWarnings(['Editing guest draft.'])
        } else if (!cancelled) {
          setCvSource('none')
          setActiveCvId(null)
        }
        if (!cancelled) setCvHydrated(true)
        return
      }

      const cvIdFromUrl = searchParams.get('cvId')
      const resolved = await resolveActiveCv({ cvIdFromUrl })

      if (cancelled) return

      // Conflict: saved + guest — show modal once per session (unless URL forces a cvId)
      if (
        !cvIdFromUrl &&
        resolved.source === 'saved' &&
        hasGuestDraft('cv') &&
        !wasGuestPickerShownThisSession()
      ) {
        markGuestPickerShownThisSession()
        setDraftPickerOpen(true)
      }

      if (resolved.cv) {
        setCvData(prepareCvForEditor(resolved.cv))
        // Keep a local draft mirror so autosave/quals use the same key
        persistCvDraftFromData(prepareCvForEditor(resolved.cv))
      }

      setCvSource(resolved.source)
      setActiveCvId(resolved.activeCvId)
      setCvLastUpdated(resolved.lastUpdated)
      setCvLoadWarnings(resolved.warnings)
      if (resolved.activeCvId) setStoredActiveCvId(resolved.activeCvId)
      setCvHydrated(true)
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [searchParams, guest.authReady, guest.isGuest])

  // Prefill summary from localStorage on mount (after CV hydrates)
  useEffect(() => {
    if (typeof window === 'undefined' || prefillCheckedRef.current || !cvHydrated) return

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
      }
      prefillCheckedRef.current = true
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [cvHydrated])

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

  // Save draft to localStorage (debounced; guest or user-scoped)
  useEffect(() => {
    if (typeof window === 'undefined' || !guest.authReady) return
    const timeout = setTimeout(() => {
      try {
        if (guest.isGuest) {
          writeGuestDraft('cv', { cvData, selectedTemplate, savedAt: Date.now() })
          return
        }
        const draftKey = getUserKey(STORAGE_KEY)
        localStorage.setItem(draftKey, JSON.stringify(cvData))
      } catch (error) {
        console.error('Error saving draft:', error)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [cvData, selectedTemplate, guest.authReady, guest.isGuest])

  // Sync live CV when dashboard/training journey updates the shared draft
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onDraftUpdated = () => {
      try {
        const draftKey = getUserKey(STORAGE_KEY)
        const saved = localStorage.getItem(draftKey)
        if (!saved) return
        const parsed = JSON.parse(saved) as CvData
        setCvData((prev) => ({
          ...prev,
          certifications: parsed.certifications ?? prev.certifications,
          education: parsed.education ?? prev.education,
          skills: parsed.skills ?? prev.skills,
        }))
      } catch {
        // ignore invalid draft
      }
    }
    window.addEventListener('jobaz-cv-draft-updated', onDraftUpdated)
    return () => window.removeEventListener('jobaz-cv-draft-updated', onDraftUpdated)
  }, [])

  const updateCvData = (updates: Partial<CvData>) => {
    setCvData((prev) => ({ ...prev, ...updates }))
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAddQualificationToCv = useCallback(async (qual: CvTrainingQualification) => {
    if (cvSource === 'guest_draft') {
      const ok = window.confirm(
        'Save this draft to your account before adding qualifications?\n\nClick OK to save, then add the qualification to your saved CV.'
      )
      if (!ok) return
      try {
        const response = await fetch('/api/cv/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Main CV', data: cvData }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data?.ok) {
          showToast('error', 'Could not save draft. Sign in and try again.')
          return
        }
        if (data.cv?.id) {
          setStoredActiveCvId(data.cv.id)
          setActiveCvId(data.cv.id)
        }
        setCvSource('saved')
        clearGuestDraft('cv')
        setSessionDraftChoice('saved')
      } catch {
        showToast('error', 'Could not save draft. Try again.')
        return
      }
    }

    const beforeStrength = careerReadiness?.cvStrength ?? cvHealthReport.overallScore
    const merged = mergeQualificationIntoCvData(cvData, qual)
    setCvData(merged)
    persistCvDraftFromData(merged)

    // Persist to the active saved CV so Documents sees the same content
    if (guest.isLoggedIn || cvSource === 'saved') {
      try {
        const response = await fetch('/api/cv/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Main CV', data: merged }),
        })
        const data = await response.json().catch(() => ({}))
        if (response.ok && data?.cv?.id) {
          setStoredActiveCvId(data.cv.id)
          setActiveCvId(data.cv.id)
          setCvSource('saved')
          setCvLastUpdated(data.cv.updated_at || new Date().toISOString())
        }
      } catch {
        // Draft still updated locally
      }
    }

    const after = buildCvCareerReadiness(
      merged,
      cvHealthReport.overallScore,
      atsMatch,
      jobDescription.trim().length > 0,
      mission,
      {
        planReadinessScore: plan?.readinessScore,
        completedQualifications: completedCount,
        totalQualifications: totalCount,
        roadmapReadinessPercent,
      }
    )
    const delta = Math.max(1, after.cvStrength - beforeStrength)
    const boost = { label: qual.name, delta }
    saveRecentQualificationBoost(qual.slug, qual.name, delta)
    setRecentBoost(boost)
    setDismissedPromptSlug(qual.slug)
    setActiveTab('more')
    const planLabel =
      improveRoute || readinessCareerPlan.routeTitle || 'your current plan'
    showToast(
      'success',
      `${qual.name} added. Your CV still needs tailoring for ${planLabel}.`
    )
  }, [
    careerReadiness?.cvStrength,
    cvData,
    cvHealthReport.overallScore,
    atsMatch,
    jobDescription,
    mission,
    plan?.readinessScore,
    completedCount,
    totalCount,
    roadmapReadinessPercent,
    cvSource,
    guest.isLoggedIn,
    improveRoute,
    readinessCareerPlan.routeTitle,
  ])

  const handleCourseBooked = useCallback((interest: CourseInterestRecord) => {
    updateCourseInterestStatus(interest.title, 'booked')
    upsertCareerPlanItem({
      courseName: interest.title,
      courseSlug: interest.slug || slugifyCourseName(interest.title),
      courseId: interest.courseId,
      status: 'in_progress',
      source: 'manual',
      routeLabel: interest.route || undefined,
    })
    setDismissedPromptSlug(interest.slug)
    setCourseActionTick((n) => n + 1)
    showToast('success', `${interest.title} marked as booked / training in progress.`)
  }, [])

  const handleCourseCompleted = useCallback(
    (interest: CourseInterestRecord) => {
      updateCourseInterestStatus(interest.title, 'completed')
      upsertCareerPlanItem({
        courseName: interest.title,
        courseSlug: interest.slug || slugifyCourseName(interest.title),
        courseId: interest.courseId,
        status: 'completed',
        source: 'manual',
        routeLabel: interest.route || undefined,
      })
      const qual: CvTrainingQualification = {
        id: interest.courseId,
        slug: interest.slug || slugifyCourseName(interest.title),
        name: interest.title,
        status: 'completed',
        type: /sia|licence|license/i.test(interest.title) ? 'licence' : 'course',
      }
      setDismissedPromptSlug(interest.slug)
      setCourseActionTick((n) => n + 1)
      if (!isQualificationInCvData(cvData, qual.name)) {
        void handleAddQualificationToCv(qual)
      } else {
        showToast('success', `${interest.title} marked as completed.`)
      }
    },
    [cvData, handleAddQualificationToCv]
  )

  const handleCourseNotYet = useCallback((interest: CourseInterestRecord) => {
    // Keep as interest only — do not add certification / complete
    setDismissedPromptSlug(interest.slug)
    setCourseActionTick((n) => n + 1)
  }, [])

  const handleCourseDontAsk = useCallback((interest: CourseInterestRecord) => {
    dismissCourseInterest(interest.title)
    setDismissedPromptSlug(interest.slug)
    setCourseActionTick((n) => n + 1)
  }, [])

  const deepLinkHandledRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !cvHydrated || !qualificationsLoaded || deepLinkHandledRef.current)
      return
    const addName = searchParams.get('add')?.trim()
    if (!addName) return

    deepLinkHandledRef.current = true
    const qual =
      qualifications.find((q) => q.name.toLowerCase() === decodeURIComponent(addName).toLowerCase()) ??
      ({
        name: decodeURIComponent(addName),
        type: 'certification' as const,
        slug: addName,
        id: addName,
        status: 'completed' as const,
      } satisfies CvTrainingQualification)

    if (!isQualificationInCvData(cvData, qual.name)) {
      void handleAddQualificationToCv(qual)
    }

    const highlight = searchParams.get('highlight')
    if (highlight === 'education') setActiveTab('education')
    else if (highlight === 'skills') setActiveTab('skills')
    else if (highlight === 'certifications') setActiveTab('more')
  }, [cvHydrated, qualificationsLoaded, searchParams, cvData, qualifications, handleAddQualificationToCv])

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

  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set<string>())
  const [appliedIssueIds, setAppliedIssueIds] = useState<Set<string>>(new Set<string>())
  const [applyingIssueId, setApplyingIssueId] = useState<string | null>(null)
  const [errorByIssueId, setErrorByIssueId] = useState<Record<string, string>>({})
  const rescanAfterApplyRef = useRef(false)

  const handleGrammarCheck = async () => {
    setShowGrammar(true)
    setGrammarResult(null)
    setSelectedIssueIds(new Set<string>())
    setAppliedIssueIds(new Set<string>())
    setErrorByIssueId({})
    setGrammarLoading(true)
    try {
      const response = await fetch('/api/cv/grammar-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      })
      const data = await response.json() as GrammarResult
      setGrammarResult(data)
      // Auto-select all safe fixes (by issue id so multiple issues in same field are independent)
      if (data.ok && data.issues) {
        const safeIds = new Set<string>(
          data.issues
            .filter((issue: GrammarIssue) => issue.isSafeFix && typeof issue.fieldPath === 'string')
            .map((issue: GrammarIssue) => getIssueId(issue))
        )
        setSelectedIssueIds(safeIds)
      }
    } catch (error: any) {
      setGrammarResult({ ok: false, error: error?.message || 'Failed to check grammar' })
    } finally {
      setGrammarLoading(false)
    }
  }

  // After applying a fix, re-run grammar check once state has committed so the list stays in sync
  useEffect(() => {
    if (!rescanAfterApplyRef.current || !showGrammar) return
    rescanAfterApplyRef.current = false
    let cancelled = false
    setGrammarLoading(true)
    fetch('/api/cv/grammar-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvData }),
    })
      .then((res) => res.json() as Promise<GrammarResult>)
      .then((data) => {
        if (!cancelled) setGrammarResult(data)
      })
      .catch(() => {
        if (!cancelled) setGrammarResult((prev) => prev ? { ...prev, ok: false, error: 'Re-scan failed' } : null)
      })
      .finally(() => {
        if (!cancelled) setGrammarLoading(false)
      })
    return () => { cancelled = true }
  }, [cvData, showGrammar])

  // Replace only the first occurrence of the error span with the suggestion (preserves rest of text)
  const replaceFirstSpan = (text: string, original: string, suggestion: string): string => {
    if (!original) return text
    const idx = text.indexOf(original)
    if (idx === -1) return text
    return text.slice(0, idx) + suggestion + text.slice(idx + original.length)
  }

  // Only show issues that are not applied AND still need fixing (invalidate already-fixed)
  const visibleIssues = useMemo(() => {
    if (!grammarResult?.ok || !grammarResult.issues) return []
    return grammarResult.issues.filter((issue) => {
      if (appliedIssueIds.has(getIssueId(issue))) return false
      const current = getFieldValue(cvData, issue.fieldPath)
      const afterFix = replaceFirstSpan(current, issue.original, issue.suggestion)
      if (afterFix === current) return false // Already fixed or original not present
      return true
    })
  }, [grammarResult, appliedIssueIds, cvData])

  // Group visible issues by section
  const groupedIssues = useMemo(() => {
    const groups: Record<string, GrammarIssue[]> = {}
    visibleIssues.forEach((issue) => {
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
  }, [visibleIssues])

  // Compute updates for one fix applied to a given state (used for single apply and batch apply)
  const computeFixUpdates = (state: CvData, issue: GrammarIssue): Partial<CvData> => {
    const updates: Partial<CvData> = {}
    const fieldPath = issue.fieldPath
    const { original, suggestion } = issue
      
    // Personal Info
    if (fieldPath.startsWith('personalInfo.')) {
      const field = fieldPath.replace('personalInfo.', '') as keyof typeof state.personalInfo
      if (field && field in state.personalInfo) {
        const current = String(state.personalInfo[field as keyof typeof state.personalInfo] ?? '')
        const newValue = replaceFirstSpan(current, original, suggestion)
        updates.personalInfo = { ...state.personalInfo, [field]: newValue }
      }
    } 
    // Summary
    else if (fieldPath === 'summary') {
      const current = state.summary ?? ''
      updates.summary = replaceFirstSpan(current, original, suggestion)
    } 
    // Experience
    else if (fieldPath.startsWith('experience[')) {
      const expMatch = fieldPath.match(/experience\[(\d+)\]\.(\w+)(?:\[(\d+)\])?/)
      if (expMatch && state.experience[parseInt(expMatch[1], 10)]) {
        const expIdx = parseInt(expMatch[1], 10)
        const field = expMatch[2]
        const bulletIdx = expMatch[3] ? parseInt(expMatch[3], 10) : null
        const newExperience = [...state.experience]
          
          if (field === 'jobTitle') {
            const current = newExperience[expIdx].jobTitle ?? ''
            newExperience[expIdx] = { ...newExperience[expIdx], jobTitle: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'company') {
            const current = newExperience[expIdx].company ?? ''
            newExperience[expIdx] = { ...newExperience[expIdx], company: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'location') {
            const current = newExperience[expIdx].location ?? ''
            newExperience[expIdx] = { ...newExperience[expIdx], location: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'bullets' && bulletIdx !== null && newExperience[expIdx].bullets[bulletIdx]) {
            const newBullets = [...newExperience[expIdx].bullets]
            const current = newBullets[bulletIdx] ?? ''
            newBullets[bulletIdx] = replaceFirstSpan(current, original, suggestion)
            newExperience[expIdx] = { ...newExperience[expIdx], bullets: newBullets }
          }
          updates.experience = newExperience
        }
      } 
    // Education
    else if (fieldPath.startsWith('education[')) {
      const eduMatch = fieldPath.match(/education\[(\d+)\]\.(\w+)/)
      if (eduMatch && state.education[parseInt(eduMatch[1], 10)]) {
        const eduIdx = parseInt(eduMatch[1], 10)
        const field = eduMatch[2]
        const newEducation = [...state.education]
          
          if (field === 'degree') {
            const current = newEducation[eduIdx].degree ?? ''
            newEducation[eduIdx] = { ...newEducation[eduIdx], degree: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'school') {
            const current = newEducation[eduIdx].school ?? ''
            newEducation[eduIdx] = { ...newEducation[eduIdx], school: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'details') {
            const current = newEducation[eduIdx].details ?? ''
            newEducation[eduIdx] = { ...newEducation[eduIdx], details: replaceFirstSpan(current, original, suggestion) }
          }
          updates.education = newEducation
        }
      } 
    // Skills
    else if (fieldPath.startsWith('skills[')) {
      const skillMatch = fieldPath.match(/skills\[(\d+)\]/)
      if (skillMatch && state.skills[parseInt(skillMatch[1], 10)]) {
        const idx = parseInt(skillMatch[1], 10)
        const newSkills = [...state.skills]
          const current = newSkills[idx] ?? ''
          newSkills[idx] = replaceFirstSpan(current, original, suggestion)
          updates.skills = newSkills
        }
      } 
    // Projects
    else if (fieldPath.startsWith('projects[')) {
      const projMatch = fieldPath.match(/projects\[(\d+)\]\.(\w+)/)
      if (projMatch && state.projects && state.projects[parseInt(projMatch[1], 10)]) {
        const idx = parseInt(projMatch[1], 10)
        const field = projMatch[2]
        const newProjects = [...state.projects]
          
          if (field === 'name') {
            const current = newProjects[idx].name ?? ''
            newProjects[idx] = { ...newProjects[idx], name: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'description') {
            const current = newProjects[idx].description ?? ''
            newProjects[idx] = { ...newProjects[idx], description: replaceFirstSpan(current, original, suggestion) }
          }
          updates.projects = newProjects
        }
      } 
    // Certifications
    else if (fieldPath.startsWith('certifications[')) {
      const certMatch = fieldPath.match(/certifications\[(\d+)\]/)
      if (certMatch && state.certifications && state.certifications[parseInt(certMatch[1], 10)]) {
        const idx = parseInt(certMatch[1], 10)
        const newCertifications = [...state.certifications]
        const current = newCertifications[idx]
        const currentLabel = current != null ? certificationLabel(current) : ''
        const nextLabel = replaceFirstSpan(currentLabel, original, suggestion)
        const nextEntry: CvCertificationEntry =
          typeof current === 'string' || current == null
            ? nextLabel
            : { ...current, title: nextLabel }
        newCertifications[idx] = nextEntry
        updates.certifications = newCertifications
      }
    } 
    // Languages
    else if (fieldPath.startsWith('languages[')) {
      const langMatch = fieldPath.match(/languages\[(\d+)\]/)
      if (langMatch && state.languages && state.languages[parseInt(langMatch[1], 10)]) {
        const idx = parseInt(langMatch[1], 10)
        const newLanguages = [...state.languages]
          const current = newLanguages[idx] ?? ''
          newLanguages[idx] = replaceFirstSpan(current, original, suggestion)
          updates.languages = newLanguages
        }
      } 
    // Publications
    else if (fieldPath.startsWith('publications[')) {
      const pubMatch = fieldPath.match(/publications\[(\d+)\]\.(\w+)/)
      if (pubMatch && state.publications && state.publications[parseInt(pubMatch[1], 10)]) {
        const idx = parseInt(pubMatch[1], 10)
        const field = pubMatch[2]
        const newPublications = [...state.publications]
          
          if (field === 'title') {
            const current = newPublications[idx].title ?? ''
            newPublications[idx] = { ...newPublications[idx], title: replaceFirstSpan(current, original, suggestion) }
          } else if (field === 'notes') {
            const current = newPublications[idx].notes ?? ''
            newPublications[idx] = { ...newPublications[idx], notes: replaceFirstSpan(current, original, suggestion) }
          }
          updates.publications = newPublications
        }
      }
    
    return updates
  }

  // Apply a single fix: use latest CV state (functional update) so we never patch stale data
  const applySingleFix = (issue: GrammarIssue) => {
    const issueId = getIssueId(issue)
    setApplyingIssueId(issueId)
    setErrorByIssueId((prev) => {
      const next = { ...prev }
      delete next[issueId]
      return next
    })
    try {
      let didUpdate = false
      setCvData((prev) => {
        const updates = computeFixUpdates(prev, issue)
        if (Object.keys(updates).length > 0) {
          didUpdate = true
          return { ...prev, ...updates }
        }
        return prev
      })
      setAppliedIssueIds((prev) => new Set(prev).add(issueId))
      showToast('success', 'Applied fix. Review your CV to confirm.')
      rescanAfterApplyRef.current = true
    } catch (error) {
      console.error('Error applying fix:', error)
      setErrorByIssueId((prev) => ({ ...prev, [issueId]: 'Failed to apply. Please try again.' }))
      showToast('error', 'Failed to apply fix. Please try again.')
    } finally {
      setApplyingIssueId(null)
    }
  }

  // Apply all selected fixes: one state update, each fix uses previous result (per-issue target only)
  const applySelectedFixes = () => {
    if (!grammarResult?.ok || !grammarResult.issues) return
    const issuesToApply = grammarResult.issues.filter(
      (issue) => selectedIssueIds.has(getIssueId(issue)) && !appliedIssueIds.has(getIssueId(issue))
    )
    if (issuesToApply.length === 0) {
      showToast('error', 'No fixes selected.')
      return
    }
    setCvData((prev) => {
      let next = prev
      for (const issue of issuesToApply) {
        const updates = computeFixUpdates(next, issue)
        next = { ...next, ...updates }
      }
      return next
    })
    setAppliedIssueIds((prev) => {
      const next = new Set(prev)
      issuesToApply.forEach((issue) => next.add(getIssueId(issue)))
      return next
    })
    showToast('success', `Applied ${issuesToApply.length} fix${issuesToApply.length > 1 ? 'es' : ''}.`)
    rescanAfterApplyRef.current = true
  }

  const canApplySafeFixes = visibleIssues.some((issue) => issue.isSafeFix && selectedIssueIds.has(getIssueId(issue)))
  const selectedCount = visibleIssues.filter((issue) => selectedIssueIds.has(getIssueId(issue))).length

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (guest.promptForAuth('download')) return
    setLoading((prev) => ({ ...prev, export: true }))
    try {
      const name = cvData.personalInfo.fullName || 'CV'
      const date = new Date().toISOString().split('T')[0]
      const filename = `CV-${name.replace(/\s+/g, '-')}-${date}`

      if (format === 'pdf') {
        await exportToPDF('cv-preview', filename)
        showToast('success', 'PDF exported successfully!')
        logEvent('cv_downloaded', { format: 'pdf' })
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
        logEvent('cv_downloaded', { format: 'docx' })
      }

      const { emitAiSignal } = await import('@/lib/jobaz-ai/emitSignal')
      void emitAiSignal({
        type: 'cv_exported',
        source: 'cv-builder',
        impact: { readiness: 3, engagement: 4 },
        metadata: {
          dedupeId: `${format}-${date}`,
          template: selectedTemplate,
          action: 'exported',
          format,
        },
      })
    } catch (error: any) {
      console.error('Export error:', error)
      showToast('error', error.message || 'Export failed. Please try again.')
    } finally {
      setLoading((prev) => ({ ...prev, export: false }))
    }
  }

  const handleFindJobs = async () => {
    try {
      // Prefer plan stage search query when available
      if (planSuggestions?.jobSearchQuery) {
        router.push(
          `/job-finder?query=${encodeURIComponent(planSuggestions.jobSearchQuery)}`
        )
        return
      }

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

  const handleSaveCvToDashboard = async () => {
    if (guest.promptForAuth('save')) return
    try {
      if (typeof window === 'undefined') return

      // Prepare CV data for API
      const cvDataToSave = {
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

      let hadCvBeforeSave = false
      try {
        const checkRes = await fetch('/api/cv/get-latest')
        if (checkRes.ok) {
          const checkData = await checkRes.json()
          hadCvBeforeSave = Boolean(checkData?.hasCv)
        }
      } catch {
        // ignore — progression still runs on save
      }

      // Call API to upsert CV
      const response = await fetch('/api/cv/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Main CV',
          data: cvDataToSave,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save CV')
      }

      const result = await response.json()
      if (!result.ok || !result.cv) {
        throw new Error(result.error || 'Failed to save CV')
      }

      const cvId = result.cv?.id as string | undefined
      const cvCompleted = isCvCompletedForAi(cvData)
      const { emitAiSignal } = await import('@/lib/jobaz-ai/emitSignal')

      if (hadCvBeforeSave) {
        void emitAiSignal({
          type: 'cv_updated',
          source: 'cv-builder',
          impact: cvCompleted
            ? { readiness: 10, engagement: 4 }
            : undefined,
          metadata: {
            dedupeId: cvId,
            cv_id: cvId,
            template: selectedTemplate,
            action: 'updated',
            cvCompleted,
          },
        })
      } else {
        void emitAiSignal({
          type: 'cv_created',
          source: 'cv-builder',
          impact: { readiness: 15, engagement: 5 },
          metadata: {
            dedupeId: cvId,
            cv_id: cvId,
            template: selectedTemplate,
            action: 'created',
            cvCompleted,
          },
        })
      }

      // Re-fetch latest CV from API to ensure we have the updated version
      const refreshResponse = await fetch('/api/cv/get-latest')
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.ok && refreshData.hasCv && refreshData.cv) {
          // Update local state with the latest CV from API
          // This ensures we're always working with the saved version
          const savedCv = refreshData.cv || {}
          const updates: Partial<CvData> = {}
          if (savedCv.personalInfo) updates.personalInfo = savedCv.personalInfo
          if (savedCv.summary !== undefined) updates.summary = savedCv.summary
          if (savedCv.experience) updates.experience = savedCv.experience
          if (savedCv.education) updates.education = savedCv.education
          if (savedCv.skills) updates.skills = savedCv.skills
          if (savedCv.projects) updates.projects = savedCv.projects
          if (savedCv.languages) updates.languages = savedCv.languages
          if (savedCv.certifications) updates.certifications = savedCv.certifications
          if (savedCv.publications) updates.publications = savedCv.publications
          if (Object.keys(updates).length > 0) {
            updateCvData(updates)
          }
          if (refreshData.cvId) {
            setActiveCvId(refreshData.cvId)
            setStoredActiveCvId(refreshData.cvId)
            setCvSource('saved')
          }
          if (savedCv.template) {
            setSelectedTemplate(savedCv.template as CvTemplateId)
          }
        }
      }

      // Dispatch custom event to notify dashboard of CV save
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('jobaz-cv-saved'))
        markActionPlanTask(ACTION_PLAN_TASK.CV, 'done')
      }

      // Mark as saved (reset dirty state)
      initialCvDataRef.current = JSON.stringify(cvData)
      initialTemplateRef.current = selectedTemplate
      setIsDirty(false)

      // Show success toast
      showToast('success', 'CV saved to your dashboard!')
    } catch (error) {
      console.error('Error saving CV to dashboard:', error)
      showToast('error', error instanceof Error ? error.message : 'Failed to save CV. Please try again.')
    }
  }

  return (
    <PublicToolLayout
      title={isCareerMode ? 'Career Journey · Build Your CV' : 'CV Optimization Engine'}
      subtitle={
        isCareerMode && plan
          ? roleHeadline
          : 'Build your CV for your next UK role.'
      }
      guest={guest}
      compactHero
      secondaryBackLinks={
        jobId
          ? [
              {
                label: 'Back to Job Details',
                onClick: () => {
                  const modeParam = mode || 'tailorCv'
                  router.push(`/job-details/${jobId}?mode=${modeParam}&from=cvBuilder`)
                },
              },
            ]
          : []
      }
      footer={
        <>
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

          <GuestDraftPickerModal
            isOpen={draftPickerOpen}
            onClose={() => setDraftPickerOpen(false)}
            toolLabel="CV"
            onUseSaved={() => {
              setSessionDraftChoice('saved')
              void resolveActiveCv({ ignoreGuestDraft: true }).then((resolved) => {
                if (!resolved.cv) return
                const prepared = prepareCvForEditor(resolved.cv)
                setCvData(prepared)
                persistCvDraftFromData(prepared)
                setCvSource('saved')
                setActiveCvId(resolved.activeCvId)
                setCvLastUpdated(resolved.lastUpdated)
                setCvLoadWarnings(resolved.warnings)
                if (resolved.activeCvId) setStoredActiveCvId(resolved.activeCvId)
              })
            }}
            onUseGuest={() => {
              setSessionDraftChoice('guest')
              const draft = readGuestDraft<{ cvData?: CvData; selectedTemplate?: CvTemplateId }>('cv')
              if (!draft?.cvData) return
              setCvData(prepareCvForEditor(draft.cvData))
              if (draft.selectedTemplate) setSelectedTemplate(draft.selectedTemplate)
              setCvSource('guest_draft')
              setActiveCvId(null)
              setCvLastUpdated(null)
              setCvLoadWarnings(['Editing: Guest Draft — not your saved account CV until you save.'])
            }}
            onMergeLater={() => {
              setSessionDraftChoice('later')
            }}
          />
        </>
      }
    >
        {/* Compact route / status header */}
        {(mode === 'improve' || readinessCareerPlan.routeTitle || planSuggestions || isCareerMode || showTrainingJourney) && (
          <div className="mb-2.5 rounded-xl border border-violet-500/20 bg-violet-950/15 px-3 py-2">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-violet-100">
                    {(improveRoute ||
                      planSuggestions?.routeTitle ||
                      readinessCareerPlan.routeTitle) && (
                      <>
                        <span className="text-slate-400 font-normal">Route:</span>{' '}
                        {improveRoute ||
                          planSuggestions?.routeTitle ||
                          readinessCareerPlan.routeTitle}
                      </>
                    )}
                    {!improveRoute && !planSuggestions?.routeTitle && !readinessCareerPlan.routeTitle && isCareerMode && (
                      <span>Building your CV</span>
                    )}
                  </p>
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      cvSource === 'saved'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : cvSource === 'guest_draft'
                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
                          : 'border-slate-600/50 bg-slate-800/40 text-slate-400'
                    )}
                  >
                    {cvSource === 'saved'
                      ? 'Saved CV'
                      : cvSource === 'guest_draft'
                        ? 'Guest Draft'
                        : 'New CV'}
                  </span>
                  {!cvHydrated && (
                    <span className="text-[10px] text-slate-500">Loading…</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  <span className="text-slate-500">Target:</span>{' '}
                  {planSuggestions?.currentTarget ||
                    improveTargetRole ||
                    readinessCareerPlan.currentTarget ||
                    '—'}
                  {(planSuggestions?.nextUpgrade || readinessCareerPlan.nextUpgrade) && (
                    <>
                      <span className="text-slate-600 mx-1.5">·</span>
                      <span className="text-slate-500">Upgrade:</span>{' '}
                      {planSuggestions?.nextUpgrade || readinessCareerPlan.nextUpgrade}
                    </>
                  )}
                </p>
                {showTrainingJourney && qualificationsLoaded && qualifications.length > 0 && (
                  <p className="text-[10px] text-slate-500 truncate">
                    Training:{' '}
                    {qualifications
                      .map((q) => q.name?.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(', ')}
                  </p>
                )}
                {needsRouteTailoring && (
                  <p className="text-[10px] text-amber-200/90">
                    This CV was started for another route — you can update it for your current plan.
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {planSuggestions && (
                  <CvPlanStageSwitcher
                    activeStage={planSuggestions.activeStage}
                    recommendedStage={planSuggestions.recommendedStage}
                    stageLabel={planSuggestions.stageLabel}
                    showAfterWarning={planSuggestions.trainingStatus !== 'completed'}
                    workNowButtonLabel={planSuggestions.workNowButtonLabel}
                    afterTrainingButtonLabel={planSuggestions.afterTrainingButtonLabel}
                    afterTrainingWarning={planSuggestions.afterTrainingWarning}
                    onChange={setStageOverride}
                  />
                )}
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                  {(showTrainingJourney || qualificationReminder) && (
                    <Link
                      href="/dashboard#recommended-training"
                      className="text-[10px] font-medium text-violet-300/90 hover:text-violet-200 hover:underline"
                    >
                      View training in My Plan
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:underline"
                  >
                    View in My Plan
                  </Link>
                </div>
              </div>
            </div>

            {isCareerMode && (
              <div className="mt-1.5 pt-1.5 border-t border-violet-500/10">
                <CvBuilderJourneyHeader className="border-0 bg-transparent px-0 py-0" />
              </div>
            )}
            {showCompletionPanel && journeyNextStep && (
              <div className="mt-1.5">
                <CvBuilderCompletionPanel
                  cvScore={cvHealthReport.overallScore}
                  nextStep={journeyNextStep}
                  onDismiss={() => setCompletionDismissed(true)}
                  onScrollToTailor={() =>
                    jdPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Standalone source chip when no route header */}
        {!(mode === 'improve' || readinessCareerPlan.routeTitle || planSuggestions || isCareerMode || showTrainingJourney) && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                cvSource === 'saved'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : cvSource === 'guest_draft'
                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
                    : 'border-slate-600/50 bg-slate-800/40 text-slate-400'
              )}
            >
              {cvSource === 'saved'
                ? 'Editing: Saved CV'
                : cvSource === 'guest_draft'
                  ? 'Editing: Guest Draft'
                  : 'Editing: New CV'}
            </span>
            {!cvHydrated && (
              <span className="text-[11px] text-slate-500">Loading CV…</span>
            )}
          </div>
        )}

        {pendingCourseAction && (
          <CvCourseActionPrompt
            interest={pendingCourseAction}
            onBooked={() => handleCourseBooked(pendingCourseAction)}
            onCompleted={() => handleCourseCompleted(pendingCourseAction)}
            onNotYet={() => handleCourseNotYet(pendingCourseAction)}
            onDontAsk={() => handleCourseDontAsk(pendingCourseAction)}
          />
        )}
        {!pendingCourseAction && pendingQualificationPrompt && (
          <CvQualificationCompletionPrompt
            qualification={pendingQualificationPrompt}
            onAdd={() => handleAddQualificationToCv(pendingQualificationPrompt)}
            onDismiss={() => setDismissedPromptSlug(pendingQualificationPrompt.slug)}
            onNeverAsk={() => setDismissedPromptSlug(pendingQualificationPrompt.slug)}
          />
        )}

        {/* Two-column layout — preview starts early on desktop */}
        <section className="grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)] items-start">
          {/* LEFT: Editor & AI */}
          <div className="space-y-3 min-w-0">
            {/* Tabs */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/70 shadow-[0_12px_28px_rgba(15,23,42,0.75)] backdrop-blur overflow-hidden">
              <div className="flex border-b border-slate-700/60 gap-0.5 overflow-x-auto">
                {[
                  { id: 'personal' as Tab, label: 'Personal' },
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
                      'px-2.5 py-2 text-[11px] font-medium transition whitespace-nowrap relative',
                      activeTab === tab.id
                        ? 'text-violet-300 border-b-2 border-violet-500'
                        : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-3 md:p-3.5">
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
                      planSuggestions={planSuggestions}
                    />
                  </div>
                )}
                {activeTab === 'experience' && (
                  <div data-cv-section="experience" data-cv-tab="experience">
                    <ExperienceTab
                      experience={cvData.experience}
                      onUpdate={(experience) => updateCvData({ experience })}
                      planBulletSuggestions={planSuggestions?.experienceBullets}
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
                  const summaryText = cvData.summary || ''
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
                        targetRole={
                          planSuggestions?.currentTarget ||
                          cvData.experience?.[0]?.jobTitle ||
                          ''
                        }
                        summaryText={summaryText}
                        experiencePreview={experiencePreview}
                        onToast={showToast}
                        jobDescription={jobDescription}
                        planSkillSuggestions={planSuggestions?.skills}
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
                      planQualificationSuggestions={planSuggestions?.qualificationSuggestions}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* AI Optimization Mission */}
            <CvAiWorkflowStrip
              steps={cvHealthReport.workflowSteps}
              subtitle={plan ? getCareerWorkflowSubtitle(plan) : undefined}
              title={isCareerMode ? 'Improve your CV' : undefined}
            />

            <div ref={jdPanelRef}>
            <JobDescriptionPanel
              cvData={cvData}
              onCvDataUpdate={updateCvData}
              onLoadingChange={(loading) => setLoading((prev) => ({ ...prev, ai: loading }))}
              onJobDescriptionChange={setJobDescription}
              aiHints={careerAiHints}
              onFixGrammar={handleGrammarCheck}
              grammarLoading={grammarLoading}
            />
            </div>
          </div>

          {/* RIGHT: Readiness + toolbar + preview (sticky, no nested page scroll) */}
          <div className="space-y-2 min-w-0 lg:sticky lg:top-[calc(var(--jobaz-header-h,4.5rem)+0.75rem)] lg:self-start lg:max-w-full">
            <CvHealthPanel
              overallScore={cvHealthReport.overallScore}
              metrics={cvHealthReport.metrics}
              scoreDelta={scoreDelta}
              potentialScore={displayPotentialScore}
              missingItems={cvHealthReport.missingSections}
              statusLabel={cvHealthReport.statusLabel}
            />

            {/* Unified compact action toolbar */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/80 shadow-[0_8px_24px_rgba(15,23,42,0.55)] backdrop-blur px-2 py-1.5">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={handleFindJobs}
                  data-jaz-action="cv_find_jobs"
                  className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] font-medium rounded-md border border-slate-600/70 text-slate-200 bg-slate-900/50 hover:border-violet-400/50 hover:text-violet-100 transition shrink-0"
                >
                  Find jobs
                </button>
                <button
                  onClick={handleSaveCvToDashboard}
                  className={cn(
                    'inline-flex items-center justify-center h-7 px-2.5 text-[11px] font-medium rounded-md border transition shrink-0 gap-1 relative',
                    isDirty
                      ? 'bg-violet-900/80 border-violet-500/70 text-violet-100 shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                      : 'border-slate-600/70 text-slate-200 bg-slate-900/50 hover:border-violet-400/50'
                  )}
                >
                  {isDirty && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  )}
                  <Save className="w-3 h-3" />
                  {isDirty ? 'Save changes' : 'Save CV'}
                </button>

                <span className="hidden sm:inline w-px h-4 bg-slate-700/80 mx-0.5" />

                <span className="text-[10px] text-slate-500 font-medium shrink-0 px-0.5 hidden sm:inline">Template</span>
                <button
                  onClick={() => setSelectedTemplate('atsClassic')}
                  className={cn(
                    'inline-flex items-center justify-center h-7 px-2 text-[11px] font-medium rounded-md border transition shrink-0',
                    selectedTemplate === 'atsClassic'
                      ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                      : 'border-slate-700/60 text-slate-300 bg-slate-900/40 hover:border-slate-600/80'
                  )}
                >
                  ATS
                </button>
                <button
                  onClick={() => setSelectedTemplate('twoColumnPro')}
                  className={cn(
                    'inline-flex items-center justify-center h-7 px-2 text-[11px] font-medium rounded-md border transition shrink-0',
                    selectedTemplate === 'twoColumnPro'
                      ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                      : 'border-slate-700/60 text-slate-300 bg-slate-900/40 hover:border-slate-600/80'
                  )}
                >
                  2-Col
                </button>
                <button
                  onClick={() => setSelectedTemplate('customizeStyle')}
                  className={cn(
                    'inline-flex items-center justify-center h-7 px-2 text-[11px] font-medium rounded-md border transition shrink-0',
                    selectedTemplate === 'customizeStyle'
                      ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                      : 'border-slate-700/60 text-slate-300 bg-slate-900/40 hover:border-slate-600/80'
                  )}
                >
                  Style
                </button>

                <span className="hidden sm:inline w-px h-4 bg-slate-700/80 mx-0.5" />

                <button
                  onClick={handleGrammarCheck}
                  disabled={reviewLoading || grammarLoading}
                  className="inline-flex items-center justify-center h-7 px-2 text-[11px] font-semibold rounded-md bg-amber-900/25 border border-amber-500/50 text-amber-200 hover:border-amber-400/70 transition disabled:opacity-50 shrink-0 gap-1"
                >
                  <FileEdit className="w-3 h-3" />
                  Grammar
                </button>
                <button
                  onClick={handleCvCheck}
                  disabled={reviewLoading || grammarLoading}
                  className="inline-flex items-center justify-center h-7 px-2 text-[11px] font-semibold rounded-md bg-sky-900/25 border border-sky-500/60 text-sky-200 hover:border-sky-400/80 transition disabled:opacity-50 shrink-0 gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  CV Check
                </button>

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={loading.export}
                    className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] font-semibold text-white rounded-md bg-violet-600/90 border border-violet-400/50 hover:bg-violet-500 transition disabled:opacity-50 shrink-0 gap-1"
                  >
                    {loading.export ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('docx')}
                    disabled={loading.export}
                    className="inline-flex items-center justify-center h-7 px-2.5 text-[11px] font-semibold text-white rounded-md bg-violet-600/90 border border-violet-400/50 hover:bg-violet-500 transition disabled:opacity-50 shrink-0 gap-1"
                  >
                    {loading.export ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    DOCX
                  </button>
                </div>
              </div>
              {isDirty && (
                <p className="text-[10px] text-amber-400/90 mt-1 px-0.5">
                  Unsaved changes — save your CV when ready.
                </p>
              )}
            </div>

            {/* Customization Panel - shown only when customizeStyle is active */}
            {selectedTemplate === 'customizeStyle' && (
              <CvCustomizationPanel
                options={customizationOptions}
                onChange={setCustomizationOptions}
                isOpen={stylePanelOpen}
                onToggle={() => setStylePanelOpen(!stylePanelOpen)}
              />
            )}

            {/* A4 Preview — page scroll only; no nested layout scrollbar */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/70 shadow-[0_12px_28px_rgba(15,23,42,0.75)] backdrop-blur p-2 md:p-2.5 flex items-start justify-center">
              <div className="mx-auto aspect-[1/1.414] w-full max-w-[400px] xl:max-w-[440px] bg-white text-slate-900 shadow-lg overflow-hidden rounded-md">
                <div
                  id="cv-preview"
                  ref={previewRef}
                  className={cn('p-6 h-full', selectedTemplate === 'customizeStyle' && 'cv-customize-style')}
                  style={
                    selectedTemplate === 'customizeStyle'
                      ? {
                          '--cv-font-family':
                            customizationOptions.fontFamily === 'inter'
                              ? 'Inter, system-ui, sans-serif'
                              : customizationOptions.fontFamily === 'serif'
                              ? 'Georgia, serif'
                              : 'Monaco, monospace',
                          '--cv-font-size':
                            customizationOptions.fontSize === 'small'
                              ? '10.5px'
                              : customizationOptions.fontSize === 'medium'
                              ? '11.5px'
                              : '12.5px',
                          '--cv-line-height':
                            customizationOptions.lineSpacing === 'compact'
                              ? '1.4'
                              : customizationOptions.lineSpacing === 'normal'
                              ? '1.5'
                              : '1.7',
                          '--cv-heading-font-weight': customizationOptions.headingFontWeight === 'bold' ? '700' : '400',
                          '--cv-heading-underline': customizationOptions.headingUnderline ? 'underline' : 'none',
                          '--cv-section-spacing':
                            customizationOptions.sectionSpacing === 'tight'
                              ? '0.75rem'
                              : customizationOptions.sectionSpacing === 'normal'
                              ? '1rem'
                              : '1.5rem',
                        } as React.CSSProperties
                      : undefined
                  }
                >
                  {selectedTemplate === 'customizeStyle' && (
                    <style>{`
                      #cv-preview.cv-customize-style {
                        font-family: var(--cv-font-family) !important;
                      }
                      #cv-preview.cv-customize-style .cv-preview,
                      #cv-preview.cv-customize-style .ats-classic,
                      #cv-preview.cv-customize-style .two-column-pro {
                        font-family: var(--cv-font-family) !important;
                        font-size: var(--cv-font-size) !important;
                        line-height: var(--cv-line-height) !important;
                      }
                      /* Apply font family to name heading explicitly */
                      #cv-preview.cv-customize-style h1 {
                        font-family: var(--cv-font-family) !important;
                        text-decoration: none !important;
                        border-bottom: none !important;
                        font-weight: var(--cv-heading-font-weight) !important;
                      }
                      /* Only apply underline to section headings (h2), not the name (h1) */
                      #cv-preview.cv-customize-style h2 {
                        font-weight: var(--cv-heading-font-weight) !important;
                        text-decoration: var(--cv-heading-underline) !important;
                      }
                      #cv-preview.cv-customize-style h3 {
                        font-weight: var(--cv-heading-font-weight) !important;
                        text-decoration: var(--cv-heading-underline) !important;
                      }
                      #cv-preview.cv-customize-style section {
                        margin-bottom: var(--cv-section-spacing) !important;
                      }
                      #cv-preview.cv-customize-style p,
                      #cv-preview.cv-customize-style li,
                      #cv-preview.cv-customize-style div:not(.cv-preview):not(.ats-classic):not(.two-column-pro) {
                        line-height: var(--cv-line-height) !important;
                      }
                    `}</style>
                  )}
                  <CvPreview data={cvData} template={selectedTemplate === 'customizeStyle' ? 'atsClassic' : selectedTemplate} />
                </div>
              </div>
            </div>
          </div>
        </section>

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
                    disabled={grammarLoading || selectedCount === 0}
                    className="rounded-full border border-violet-500/60 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply safe fixes ({selectedCount})
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
                {/* Summary stats (from visible / unapplied issues only) */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                  <span className="text-xs text-slate-400">Total Issues</span>
                  <span className={cn('text-sm font-semibold', visibleIssues.length === 0 ? 'text-green-400' : 'text-yellow-300')}>
                    {visibleIssues.length === 0 ? 'No issues found' : `${visibleIssues.length} issue${visibleIssues.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                {visibleIssues.filter((i) => i.isSafeFix).length > 0 && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <span className="text-xs text-slate-400">Safe fixes available</span>
                    <span className="text-xs font-semibold text-green-400">{visibleIssues.filter((i) => i.isSafeFix).length}</span>
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
                        getIssueId={getIssueId}
                        selectedIssueIds={selectedIssueIds}
                        applyingIssueId={applyingIssueId}
                        errorByIssueId={errorByIssueId}
                        onToggleIssue={(issueId) => {
                          const newSelected = new Set<string>(selectedIssueIds)
                          if (newSelected.has(issueId)) {
                            newSelected.delete(issueId)
                          } else {
                            newSelected.add(issueId)
                          }
                          setSelectedIssueIds(newSelected)
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

    </PublicToolLayout>
  )
}

