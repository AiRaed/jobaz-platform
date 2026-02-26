'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Trash2, Loader2, X, CheckCircle2, AlertCircle, BookOpen, Briefcase, Sparkles, Check, XCircle, RefreshCw, Mail, Copy, Save, Wand2, Upload, Info, Download, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseEmail } from '@/lib/email-parser'
import type { EmailPurpose, RecipientType, Tone } from '@/lib/email-templates'
import { exportProofreadingToDocx } from '@/lib/docx'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/components/ui/toast'
import { useJazContext } from '@/contexts/JazContextContext'

interface ProofreadingProject {
  id: string
  title: string
  category: string
  created_at: string
  updated_at: string
}

interface ProofreadingDocument {
  id: string
  project_id: string
  content: string
  word_count: number
  estimated_pages: number
  analysis: Record<string, any>
  created_at: string
  updated_at: string
}

interface ProofreadingIssue {
  id: string
  document_id: string
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'word_form' | 'tense' | 'tense_consistency' | 'repetition' | 'preposition' | 'academic_tone' | 'academic_objectivity' | 'academic_hedging' | 'academic_citation' | 'academic_logic' | 'structure' | 'academic_style' | 'methodology' | 'evidence' | 'research_quality' | 'agreement' | 'article' | 'uncountable' | 'research_grammar' | 'punctuation'
  severity: 'low' | 'moderate' | 'high'
  message: string
  original_text: string
  suggestion_text: string
  start_index: number
  end_index: number
  action?: 'replace' | 'delete' | 'insert'
  status: 'open' | 'applied' | 'rejected'
  created_at: string
  updated_at: string
}

type IssueFilter = 'all' | 'open' | 'applied' | 'rejected'
type TabType = 'proofreading' | 'email'

/** Feature flag: set NEXT_PUBLIC_ENABLE_LLM_PROOFREAD=true to show AI Proofread (LLM) in Writing Review. */
const ENABLE_LLM_PROOFREAD = typeof process.env.NEXT_PUBLIC_ENABLE_LLM_PROOFREAD === 'string' && process.env.NEXT_PUBLIC_ENABLE_LLM_PROOFREAD === 'true'

/** Feature flag: set NEXT_PUBLIC_ENABLE_PHD_MODE=true to show Academic Research / PhD in project creation and sidebar. Default false. */
const ENABLE_PHD_MODE = typeof process.env.NEXT_PUBLIC_ENABLE_PHD_MODE === 'string' && process.env.NEXT_PUBLIC_ENABLE_PHD_MODE === 'true'

/** Collapse 2+ consecutive spaces to one; never remove newlines or paragraph breaks. */
function collapseDoubleSpaces(text: string): string {
  return text.replace(/  +/g, ' ')
}

/**
 * Remove trailing dots that look like artifacts.
 * - Removes trailing lines that contain only whitespace and periods (e.g. "\n\n....." or "\n. . .").
 * - Replaces trailing multiple periods with a single period, including:
 *   "....." (consecutive) and ". . . . ." (periods with spaces between).
 */
function normalizeTrailingDots(text: string): string {
  if (!text.length) return text
  let out = text
  // Remove trailing lines that are only spaces and/or periods
  while (/[\r\n][\s.]*$/.test(out)) {
    out = out.replace(/[\r\n][\s.]*$/, '')
  }
  // Consecutive dots at end (e.g. "soon. .....")
  out = out.replace(/[\s.]*\.{2,}\s*$/, '.')
  // Periods with spaces between at end (e.g. "soon. . . . . .") — 2+ (period + optional space)
  out = out.replace(/(?:\.\s*){2,}\s*$/, '.')
  return out
}

/** Detect likely merged words (e.g. "aremany", "companyhase") after Apply All. */
function hasMergedTokens(text: string): boolean {
  if (!text.trim()) return false
  // Lowercase letter immediately followed by uppercase in the middle of a word (no space)
  if (/\b[a-z][A-Z]\w*/.test(text)) return true
  if (/\b\w+[a-z][A-Z]\w*/.test(text)) return true
  // Common merged patterns that indicate missing space
  const mergedPatterns = /\b(aremany|companyhase|companyhave|thereare|thereis|manyreasons|havea|hasa)\b/i
  return mergedPatterns.test(text)
}

/**
 * Fix broken spacing from single-char capitalization (e.g. "T here" → "There").
 * Only merges when single capital + space + lowercase forms a known word (whitelist).
 */
function fixBrokenCapitalizationSpacing(text: string): string {
  const mergeableWords = new Set(['there', 'their', 'this', 'that', 'the', 'these', 'those', 'and', 'are'])
  const brokenRegex = /\b([A-Z])\s+([a-z]{2,})\b/g
  return text.replace(brokenRegex, (_, cap, rest) => {
    const merged = (cap + rest).toLowerCase()
    if (mergeableWords.has(merged)) {
      return cap + rest
    }
    return cap + ' ' + rest
  })
}

interface EmailProject {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface EmailMessage {
  id: string
  project_id: string
  subject: string
  greeting: string
  body: string
  closing: string
  signature: string
  full_text: string
  source: 'generated' | 'pasted' | 'improved'
  meta: Record<string, any>
  created_at: string
  updated_at: string
}

interface EmailIssue {
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone' | 'structure' | 'professionalism'
  severity: 'low' | 'moderate' | 'high'
  message: string
  explanation?: string
  original_text: string
  suggestion_text: string
  startIndex: number
  endIndex: number
  status?: 'open' | 'applied' | 'rejected'
}

export default function ProofreadingPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('proofreading')
  
  // Proofreading state
  const [projects, setProjects] = useState<ProofreadingProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [currentDocument, setCurrentDocument] = useState<ProofreadingDocument | null>(null)
  // NOTE: Issues are treated as "active page issues" in the UI.
  // We keep a per-page cache in memory to support multi-page documents without DB changes.
  const [issues, setIssues] = useState<ProofreadingIssue[]>([])
  const [pageIssues, setPageIssues] = useState<Record<string, ProofreadingIssue[]>>({})
  // When a page becomes empty, we "clear analysis" and keep it cleared until Run Analysis is clicked again.
  const [clearedPages, setClearedPages] = useState<Record<string, boolean>>({})
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all')
  // Multi-page support: pages stored in React state only
  const [pages, setPages] = useState<Array<{ id: string; content: string }>>([{ id: '1', content: '' }])
  const [activePageIndex, setActivePageIndex] = useState(0)
  const [content, setContent] = useState('') // Keep for backward compatibility, will be derived from pages
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectCategory, setNewProjectCategory] = useState('general')
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [showImportTooltip, setShowImportTooltip] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [applyingIssueId, setApplyingIssueId] = useState<string | null>(null)
  const [isApplyingAll, setIsApplyingAll] = useState(false)
  const [isAutoFixRunning, setIsAutoFixRunning] = useState(false)
  const [autoFixPass, setAutoFixPass] = useState(0)
  const [autoFixRemaining, setAutoFixRemaining] = useState<number | null>(null)
  // AI (LLM) proofread: full-text correction + improvement, no partial patching
  const [aiProofreadResult, setAiProofreadResult] = useState<{
    corrected_text: string
    improved_text: string
    issues: Array<{ type: string; original: string; correction: string; explanation: string }>
    confidence_score: number
  } | null>(null)
  const [aiProofreadOriginal, setAiProofreadOriginal] = useState<string>('')
  const [aiProofreadLoading, setAiProofreadLoading] = useState(false)

  const router = useRouter()
  const { addToast } = useToast()
  const { setContext } = useJazContext()
  
  // Email Builder state
  const [emailProjects, setEmailProjects] = useState<EmailProject[]>([])
  const [activeEmailProjectId, setActiveEmailProjectId] = useState<string | null>(null)
  const [currentEmailMessage, setCurrentEmailMessage] = useState<EmailMessage | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailGreeting, setEmailGreeting] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailClosing, setEmailClosing] = useState('')
  const [emailSignature, setEmailSignature] = useState('')
  const [emailIssues, setEmailIssues] = useState<EmailIssue[]>([])
  const [emailIssueFilter, setEmailIssueFilter] = useState<IssueFilter>('all')
  const [isEmailMode, setIsEmailMode] = useState<'paste' | 'generate' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzingEmail, setIsAnalyzingEmail] = useState(false)
  const [newEmailProjectTitle, setNewEmailProjectTitle] = useState('')
  const [showNewEmailProjectForm, setShowNewEmailProjectForm] = useState(false)

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastDocumentIdRef = useRef<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importTooltipTimeoutRef = useRef<NodeJS.Timeout>()
  const latestEditorContentRef = useRef<string>('')

  // Helper function to check if a project is academic type
  const isAcademicProject = useCallback((projectId: string | null): boolean => {
    if (!projectId) return false
    const project = projects.find(p => p.id === projectId)
    if (!project) return false
    const category = project.category
    return category === 'Academic' || 
           category === 'Academic Research' || 
           category === 'academic_standard' || 
           category === 'academic_research_phd'
  }, [projects])

  const isPhdProject = useCallback((category: string): boolean => {
    return category === 'academic_research_phd' || category === 'Academic Research'
  }, [])

  const projectsToShow = useMemo(() => {
    return ENABLE_PHD_MODE ? projects : projects.filter(p => !isPhdProject(p.category))
  }, [projects, ENABLE_PHD_MODE, isPhdProject])

  // When PhD mode is hidden, switch away from any active PhD project
  useEffect(() => {
    if (ENABLE_PHD_MODE || !activeProjectId) return
    const active = projects.find(p => p.id === activeProjectId)
    if (active && isPhdProject(active.category)) {
      const firstVisible = projectsToShow[0]
      setActiveProjectId(firstVisible?.id ?? null)
    }
  }, [ENABLE_PHD_MODE, activeProjectId, projects, projectsToShow, isPhdProject])

  // Writing Review → General mode only (not Academic / Academic Research)
  const isGeneralMode = useCallback((): boolean => {
    if (!activeProjectId) return false
    return !isAcademicProject(activeProjectId)
  }, [activeProjectId, isAcademicProject])

  /** Current analysis mode for Apply / Apply All: same as Run Analysis. */
  const getAnalysisMode = useCallback((): 'general' | 'academic' | 'academic_research' => {
    if (!activeProjectId) return 'general'
    const project = projects.find(p => p.id === activeProjectId)
    const slug = project?.category || ''
    if (slug === 'academic_research_phd' || slug === 'Academic Research') return 'academic_research'
    if (slug === 'academic_standard' || slug === 'Academic') return 'academic'
    return 'general'
  }, [activeProjectId, projects])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (importTooltipTimeoutRef.current) {
        clearTimeout(importTooltipTimeoutRef.current)
      }
    }
  }, [])

  // Load projects on mount
  useEffect(() => {
    if (activeTab === 'proofreading') {
      loadProjects()
    } else if (activeTab === 'email') {
      loadEmailProjects()
    }
  }, [activeTab])

  // Load document when project changes
  useEffect(() => {
    if (activeProjectId) {
      loadDocument(activeProjectId)
    } else {
      setCurrentDocument(null)
      setActiveDocumentId(null)
      setPages([{ id: '1', content: '' }])
      setActivePageIndex(0)
      setContent('')
      setIssues([])
      setPageIssues({})
      setClearedPages({})
      lastDocumentIdRef.current = null
    }
  }, [activeProjectId])

  // Sync content state with active page (for backward compatibility)
  useEffect(() => {
    if (pages[activePageIndex]) {
      setContent(pages[activePageIndex].content)
    }
  }, [pages, activePageIndex])

  // Keep ref in sync so Run Analysis always sees the latest editor text (no stale closure)
  useEffect(() => {
    latestEditorContentRef.current = pages[activePageIndex]?.content ?? ''
  }, [pages, activePageIndex])

  // Load issues when document changes
  useEffect(() => {
    // Issues are page-scoped in UI; don't reload when the active page is "cleared".
    const activePageId = pages[activePageIndex]?.id
    const isCleared = activePageId ? !!clearedPages[activePageId] : false
    if (activeDocumentId && activePageId && !isCleared) {
      loadIssues(activeDocumentId, issueFilter, activePageId)
      return
    }
    // If no document or page is cleared/unknown, show empty analysis UI.
    setIssues([])
  }, [activeDocumentId, issueFilter])

  // When switching pages, hydrate issues for that page (unless it's been cleared).
  useEffect(() => {
    const activePageId = pages[activePageIndex]?.id
    if (!activeDocumentId || !activePageId) return
    if (clearedPages[activePageId]) return
    // If we already have cached issues for this page, don't fetch.
    if (pageIssues[activePageId]) return
    loadIssues(activeDocumentId, issueFilter, activePageId)
  }, [pages, activePageIndex, activeDocumentId, issueFilter, clearedPages, pageIssues])

  // Keep `issues` in sync with the active page's cached issues
  useEffect(() => {
    const activePageId = pages[activePageIndex]?.id
    if (!activePageId) {
      setIssues([])
      return
    }
    // If this page was cleared due to empty content, keep UI empty until Run Analysis succeeds.
    if (clearedPages[activePageId]) {
      setIssues([])
      return
    }
    setIssues(pageIssues[activePageId] || [])
  }, [pages, activePageIndex, pageIssues, clearedPages])

  const clearActivePageAnalysis = useCallback(() => {
    const activePageId = pages[activePageIndex]?.id
    if (!activePageId) return
    setClearedPages(prev => ({ ...prev, [activePageId]: true }))
    setPageIssues(prev => ({ ...prev, [activePageId]: [] }))
    setIssues([])
    setIssueFilter('all')
  }, [pages, activePageIndex])

  // Watch active page content: if it becomes empty, clear analysis + UI for that page
  useEffect(() => {
    const activePageContent = pages[activePageIndex]?.content || ''
    if (activePageContent.trim().length === 0) {
      clearActivePageAnalysis()
    }
  }, [pages, activePageIndex, clearActivePageAnalysis])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/proofreading/projects')
      const data = await res.json()
      if (data.ok) {
        setProjects(data.projects)
        if (data.projects.length > 0 && !activeProjectId) {
          const firstVisible = ENABLE_PHD_MODE
            ? data.projects[0]
            : data.projects.find((p: ProofreadingProject) => !(p.category === 'academic_research_phd' || p.category === 'Academic Research'))
          if (firstVisible) setActiveProjectId(firstVisible.id)
        }
      } else {
        setError(data.error || 'Failed to load projects')
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err)
      setError(err.message || 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocument = async (projectId: string) => {
    try {
      setIsLoadingDocument(true)
      setError(null)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Proofreading] Loading document for project:', projectId)
      }
      
      // Fetch latest document (ORDER BY updated_at DESC LIMIT 1)
      const res = await fetch(`/api/proofreading/documents?project_id=${projectId}`)
      const data = await res.json()
      
      if (data.ok) {
        if (data.document) {
          // Document exists, load it
          if (process.env.NODE_ENV === 'development') {
            console.log('[Proofreading] Document loaded:', data.document.id, 'Content length:', data.document.content?.length || 0)
          }
          setCurrentDocument(data.document)
          setActiveDocumentId(data.document.id)
          const documentContent = fixBrokenCapitalizationSpacing(normalizeTrailingDots(data.document.content || ''))
          // Initialize pages with document content on first page
          setPages([{ id: '1', content: documentContent }])
          setActivePageIndex(0)
          setContent(documentContent)
          lastDocumentIdRef.current = data.document.id
        } else {
          // No document exists, but don't auto-create - let user type first
          // This allows immediate typing without waiting for creation
          if (process.env.NODE_ENV === 'development') {
            console.log('[Proofreading] No document found, will create on first keystroke')
          }
          setCurrentDocument(null)
          setActiveDocumentId(null)
          setPages([{ id: '1', content: '' }])
          setActivePageIndex(0)
          setContent('')
          lastDocumentIdRef.current = null
        }
      } else {
        setError(data.error || 'Failed to load document')
      }
    } catch (err: any) {
      console.error('Failed to load document:', err)
      setError(err.message || 'Failed to load document')
    } finally {
      setIsLoadingDocument(false)
    }
  }

  const ensureDocumentExists = useCallback(async (projectId: string, currentContent: string): Promise<string | null> => {
    // If document already exists, return its ID
    if (activeDocumentId && currentDocument?.project_id === projectId) {
      return activeDocumentId
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Proofreading] Creating document for project:', projectId)
      }

      const createRes = await fetch('/api/proofreading/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          content: currentContent || '',
        }),
      })
      const createData = await createRes.json()
      if (createData.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Proofreading] Document created:', createData.document.id)
        }
        setCurrentDocument(createData.document)
        setActiveDocumentId(createData.document.id)
        lastDocumentIdRef.current = createData.document.id
        return createData.document.id
      } else {
        setError(createData.error || 'Failed to create document')
        return null
      }
    } catch (err: any) {
      console.error('Failed to create document:', err)
      setError(err.message || 'Failed to create document')
      return null
    }
  }, [activeDocumentId, currentDocument])

  const loadIssues = async (documentId: string, filter: IssueFilter, pageId: string) => {
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter}`
      const res = await fetch(`/api/proofreading/issues?document_id=${documentId}${statusParam}`)
      const data = await res.json()
      if (data.ok) {
        // If user cleared analysis for this page (empty content), don't hydrate UI from DB.
        if (clearedPages[pageId]) {
          setIssues([])
          return
        }
        const nextIssues = data.issues || []
        setPageIssues(prev => ({ ...prev, [pageId]: nextIssues }))
        setIssues(nextIssues)
      }
    } catch (err) {
      console.error('Failed to load issues:', err)
    }
  }

  const scheduleAutoSave = useCallback(async () => {
    if (!activeProjectId) return

    // Combine all pages content for saving
    const combinedContent = pages.map(p => p.content).join('\n\n--- Page Break ---\n\n')

    // Ensure document exists before saving
    let docId = activeDocumentId
    if (!docId) {
      docId = await ensureDocumentExists(activeProjectId, combinedContent)
      if (!docId) return
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    const docIdToSave = docId
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await saveDocument(docIdToSave!)
    }, 1200) // 1200ms debounce
  }, [activeProjectId, activeDocumentId, pages, ensureDocumentExists])

  const saveDocument = async (docId?: string, contentOverride?: string) => {
    const documentId = docId || activeDocumentId
    if (!documentId || !activeProjectId) return

    try {
      setIsSaving(true)
      const combinedContent =
        contentOverride !== undefined
          ? contentOverride
          : pages.map(p => p.content).join('\n\n--- Page Break ---\n\n')
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Proofreading] Saving document:', documentId, 'Content length:', combinedContent.length)
      }

      const res = await fetch(`/api/proofreading/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: combinedContent,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Proofreading] Document saved successfully')
        }
        setCurrentDocument(data.document)
        if (!activeDocumentId) {
          setActiveDocumentId(data.document.id)
          lastDocumentIdRef.current = data.document.id
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Proofreading] Save failed:', data.error)
        }
      }
    } catch (err) {
      console.error('Failed to save document:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = async (newContent: string) => {
    latestEditorContentRef.current = newContent
    // Always allow content changes when a project is selected
    if (activeProjectId) {
      // Calculate combined content with updated active page
      const updatedPages = [...pages]
      if (updatedPages[activePageIndex]) {
        updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], content: newContent }
      }
      const combinedContent = updatedPages.map(p => p.content).join('\n\n--- Page Break ---\n\n')
      
      // Update active page content
      setPages(updatedPages)
      setContent(newContent)

      // If active page is empty, clear analysis UI + don't rehydrate until Run Analysis
      if (newContent.trim().length === 0) {
        clearActivePageAnalysis()
      }
      
      // If no document exists yet, create it on first keystroke
      if (!activeDocumentId && newContent.trim().length > 0) {
        const docId = await ensureDocumentExists(activeProjectId, combinedContent)
        if (docId) {
          scheduleAutoSave()
        }
      } else if (activeDocumentId) {
        scheduleAutoSave()
      }
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !activeProjectId) {
      return
    }

    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    // Validate file type
    if (fileExtension !== 'docx' && fileExtension !== 'pdf') {
      setError('Unsupported file format. Please upload a .docx or .pdf file.')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      setIsImporting(true)
      setError(null)

      // Create FormData and upload file
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/proofreading/import', {
        method: 'POST',
        body: formData,
      })

      // Verify content-type before parsing JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please try again.')
      }

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to import file')
      }

      // Handle DOCX multi-page import
      if (fileExtension === 'docx' && data.pages && Array.isArray(data.pages)) {
        // Convert pages array to the format expected by the editor
        const importedPages = data.pages.map((page: { title?: string; content: string }, index: number) => ({
          id: String(Date.now() + index), // Generate unique IDs
          content: page.content || '',
        }))

        if (importedPages.length === 0) {
          throw new Error('No content found in DOCX file')
        }

        // Replace current pages with imported pages
        setPages(importedPages)
        setActivePageIndex(0) // Set active page to Page 1
        
        // Update content state for backward compatibility
        setContent(importedPages[0]?.content || '')

        // Trigger autosave by combining all pages
        const combinedContent = importedPages.map((p: { title?: string; content: string }) => p.content).join('\n\n--- Page Break ---\n\n')
        if (activeProjectId) {
          // Ensure document exists and save
          const docId = await ensureDocumentExists(activeProjectId, combinedContent)
          if (docId) {
            await saveDocument(docId)
          }
        }
      } else if (data.text && typeof data.text === 'string') {
        // PDF or backward compatibility - put everything in Page 1
        await handleContentChange(data.text)
      } else {
        throw new Error('Invalid response from server')
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('Failed to import file:', err)
      setError(err.message || 'Failed to import file. Please try again.')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsImporting(false)
    }
  }

  const handleExportDocx = async () => {
    if (!activeProjectId || pages.length === 0) {
      return
    }

    // Check if there's at least one page with content
    const hasContent = pages.some(page => page.content.trim().length > 0)
    if (!hasContent) {
      setError('No content to export. Please add content to at least one page.')
      return
    }

    try {
      setIsExporting(true)
      setError(null)

      const projectTitle = projects.find(p => p.id === activeProjectId)?.title || 'untitled'
      await exportProofreadingToDocx(pages, projectTitle)
    } catch (err: any) {
      console.error('Failed to export DOCX:', err)
      setError(err.message || 'Failed to export document. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Page management functions
  const addPage = () => {
    const newPageId = String(Date.now())
    setPages(prev => [...prev, { id: newPageId, content: '' }])
    setActivePageIndex(pages.length)
  }

  const removePage = (pageIndex: number) => {
    if (pages.length <= 1) return // Don't allow removing the last page
    
    setPages(prev => {
      const filtered = prev.filter((_, idx) => idx !== pageIndex)
      
      // Adjust active page index if needed
      if (activePageIndex >= prev.length - 1) {
        setActivePageIndex(Math.max(0, prev.length - 2))
      } else if (activePageIndex > pageIndex) {
        setActivePageIndex(activePageIndex - 1)
      }
      
      return filtered
    })
  }

  const switchPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setActivePageIndex(pageIndex)
    }
  }

  const handleProjectChange = (projectId: string) => {
    // Only wipe content if switching to a different project
    if (projectId !== activeProjectId) {
      setActiveProjectId(projectId)
      // Content will be loaded in useEffect
    }
  }

  const createProject = async () => {
    if (!newProjectTitle.trim()) return

    try {
      const categoryToUse = (newProjectCategory === 'academic_research_phd' && !ENABLE_PHD_MODE) ? 'general' : newProjectCategory
      const res = await fetch('/api/proofreading/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          category: categoryToUse,
        }),
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setProjects([...projects, data.project])
        setActiveProjectId(data.project.id)
        setNewProjectTitle('')
        setNewProjectCategory('general')
        setShowNewProjectForm(false)
        setError(null)
      } else {
        // Show error message from API
        const errorMsg = data.message || data.error || 'Failed to create project'
        setError(errorMsg)
        console.error('Create project failed:', data)
      }
    } catch (err: any) {
      console.error('Failed to create project:', err)
      setError(err?.message || 'Failed to create project. Please try again.')
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/proofreading/projects/${projectId}`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (res.ok && data.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
        if (activeProjectId === projectId) {
          setActiveProjectId(null)
        }
        setIsDeleteDialogOpen(false)
        setSelectedProjectId(null)
      } else {
        // Show error toast
        const errorMsg = data.error || data.message || 'Failed to delete project'
        addToast({
          title: 'Delete failed',
          description: errorMsg,
          variant: 'error',
        })
      }
    } catch (err: any) {
      console.error('Failed to delete project:', err)
      addToast({
        title: 'Delete failed',
        description: err?.message || 'Failed to delete project. Please try again.',
        variant: 'error',
      })
    }
  }

  // ============================================================================
  // EMAIL BUILDER FUNCTIONS
  // ============================================================================

  const loadEmailProjects = async () => {
    try {
      setError(null)
      const res = await fetch('/api/email/projects')
      const data = await res.json()
      if (data.ok) {
        setEmailProjects(data.projects || [])
        if (data.projects && data.projects.length > 0 && !activeEmailProjectId) {
          setActiveEmailProjectId(data.projects[0].id)
        }
      } else {
        setError(data.error || 'Failed to load email projects')
      }
    } catch (err: any) {
      console.error('Failed to load email projects:', err)
      setError(err.message || 'Failed to load email projects')
    }
  }

  const createEmailProject = async () => {
    if (!newEmailProjectTitle.trim()) return

    try {
      const res = await fetch('/api/email/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEmailProjectTitle.trim(),
          purpose: 'job_application', // Default purpose
          tone: 'Professional', // Default tone
          recipient_type: 'Manager', // Default recipient type
        }),
      })
      const data = await res.json()
      if (data.ok) {
        await loadEmailProjects()
        setActiveEmailProjectId(data.project.id)
        setNewEmailProjectTitle('')
        setShowNewEmailProjectForm(false)
        setError(null)
      } else {
        setError(data.message || data.error || 'Failed to create email project')
        console.error('Create email project failed:', data)
      }
    } catch (err: any) {
      console.error('Failed to create email project:', err)
      setError(err.message || 'Failed to create email project')
    }
  }

  const deleteEmailProject = async (projectId: string) => {
    if (!confirm('Delete this email project and all its messages?')) return

    try {
      const res = await fetch(`/api/email/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setEmailProjects(emailProjects.filter(p => p.id !== projectId))
        if (activeEmailProjectId === projectId) {
          setActiveEmailProjectId(null)
          setCurrentEmailMessage(null)
          setEmailSubject('')
          setEmailGreeting('')
          setEmailBody('')
          setEmailClosing('')
          setEmailSignature('')
        }
      }
    } catch (err) {
      console.error('Failed to delete email project:', err)
    }
  }

  const loadEmailMessage = async (projectId: string) => {
    try {
      setError(null)
      const res = await fetch(`/api/email/messages?project_id=${projectId}`)
      const data = await res.json()
      if (data.ok && data.message) {
        setCurrentEmailMessage(data.message)
        setEmailSubject(data.message.subject || '')
        setEmailGreeting(data.message.greeting || '')
        setEmailBody(data.message.body || '')
        setEmailClosing(data.message.closing || '')
        setEmailSignature(data.message.signature || '')
      } else {
        // No message yet, reset fields
        setCurrentEmailMessage(null)
        setEmailSubject('')
        setEmailGreeting('')
        setEmailBody('')
        setEmailClosing('')
        setEmailSignature('')
      }
    } catch (err: any) {
      console.error('Failed to load email message:', err)
      setError(err.message || 'Failed to load email message')
    }
  }

  // Load email message when project changes
  useEffect(() => {
    if (activeTab === 'email' && activeEmailProjectId) {
      loadEmailMessage(activeEmailProjectId)
    }
  }, [activeTab, activeEmailProjectId])

  const saveEmailMessage = async () => {
    if (!activeEmailProjectId) return

    try {
      const fullText = [
        emailSubject || '',
        '',
        emailGreeting || '',
        emailBody || '',
        emailClosing || '',
        emailSignature || '',
      ].filter(Boolean).join('\n\n')

      const res = await fetch('/api/email/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeEmailProjectId,
          subject: emailSubject,
          greeting: emailGreeting,
          body: emailBody,
          closing: emailClosing,
          signature: emailSignature,
          source: currentEmailMessage?.source || 'pasted',
          meta: currentEmailMessage?.meta || {},
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setCurrentEmailMessage(data.message)
        setError(null)
      } else {
        setError(data.error || 'Failed to save email')
      }
    } catch (err: any) {
      console.error('Failed to save email:', err)
      setError(err.message || 'Failed to save email')
    }
  }

  const generateEmailFromWizard = async (wizardData: any) => {
    try {
      setIsGenerating(true)
      setError(null)
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wizardData),
      })
      const data = await res.json()
      if (data.ok && data.email) {
        setEmailSubject(data.email.subject || '')
        setEmailGreeting(data.email.greeting || '')
        setEmailBody(data.email.body || '')
        setEmailClosing(data.email.closing || '')
        setEmailSignature(data.email.signature || '')
        
        // Auto-save generated email
        if (activeEmailProjectId) {
          setTimeout(() => {
            saveEmailMessage()
          }, 500)
        }
      } else {
        setError(data.error || 'Failed to generate email')
      }
    } catch (err: any) {
      console.error('Failed to generate email:', err)
      setError(err.message || 'Failed to generate email')
    } finally {
      setIsGenerating(false)
    }
  }

  const analyzeEmail = async () => {
    if (!activeEmailProjectId || !emailBody.trim()) return

    try {
      setIsAnalyzingEmail(true)
      setError(null)
      const fullText = [
        emailSubject || '',
        '',
        emailGreeting || '',
        emailBody || '',
        emailClosing || '',
        emailSignature || '',
      ].filter(Boolean).join('\n\n')

      // Get project context for professional analysis
      const activeProject = emailProjects.find((p: any) => p.id === activeEmailProjectId)
      const projectContext = activeProject ? {
        recipient_type: (activeProject as any).recipient_type || 'Manager',
        purpose: (activeProject as any).purpose || 'general',
        tone: (activeProject as any).tone || 'Professional',
      } : {
        recipient_type: 'Manager',
        purpose: 'general',
        tone: 'Professional',
      }

      const res = await fetch('/api/email/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: currentEmailMessage?.id,
          fullText,
          context: projectContext,
          options: {
            spelling: true,
            grammar: true,
            style: true,
            tone: true,
            structure: true,
            professionalism: true,
            clarity: true,
          },
        }),
      })
      const data = await res.json()
      if (data.ok) {
        // Ensure all issues have status 'open' by default
        const issuesWithStatus = (data.issues || []).map((issue: EmailIssue) => ({
          ...issue,
          status: (issue.status || 'open') as 'open' | 'applied' | 'rejected',
        }))
        setEmailIssues(issuesWithStatus)
      } else {
        setError(data.message || data.error || 'Failed to analyze email')
      }
    } catch (err: any) {
      console.error('Failed to analyze email:', err)
      setError(err.message || 'Failed to analyze email')
    } finally {
      setIsAnalyzingEmail(false)
    }
  }

  const copyEmailToClipboard = async () => {
    const fullEmail = [
      `Subject: ${emailSubject || ''}`,
      '',
      emailGreeting || '',
      emailBody || '',
      emailClosing || '',
      emailSignature || '',
    ].filter(Boolean).join('\n\n')

    try {
      await navigator.clipboard.writeText(fullEmail)
      setError(null)
      // Could show a toast here
    } catch (err) {
      console.error('Failed to copy email:', err)
      setError('Failed to copy email to clipboard')
    }
  }

  const runAnalysis = async () => {
    let textToAnalyze = latestEditorContentRef.current ?? pages[activePageIndex]?.content ?? ''
    const activePageId = pages[activePageIndex]?.id
    if (!activeProjectId || !textToAnalyze.trim() || isAnalyzing) return

    // Normalize trailing dots and fix broken capitalization spacing before analysis
    let cleaned = normalizeTrailingDots(textToAnalyze)
    cleaned = fixBrokenCapitalizationSpacing(cleaned)
    if (cleaned !== textToAnalyze) {
      textToAnalyze = cleaned
      latestEditorContentRef.current = cleaned
      setPages((prev) => {
        const updated = [...prev]
        if (updated[activePageIndex]) {
          updated[activePageIndex] = { ...updated[activePageIndex], content: cleaned }
        }
        return updated
      })
      setContent(cleaned)
    }

    try {
      setIsAnalyzing(true)
      setError(null)

      let docId = activeDocumentId
      if (!docId && activeProjectId) {
        const combinedContent = pages.map(p => p.content).join('\n\n--- Page Break ---\n\n')
        docId = await ensureDocumentExists(activeProjectId, combinedContent)
        if (!docId) {
          setError('Could not create document. Please retry.')
          setIsAnalyzing(false)
          return
        }
      }

      if (!docId) {
        setError('Document is required for analysis')
        setIsAnalyzing(false)
        return
      }

      // Determine mode based on project category (use slugs)
      const activeProject = projects.find(p => p.id === activeProjectId)
      let mode = 'general'
      const categorySlug = activeProject?.category || ''
      
      // Map category slugs to analysis modes
      if (categorySlug === 'academic_research_phd' || categorySlug === 'Academic Research') {
        mode = 'academic_research'
      } else if (categorySlug === 'academic_standard' || categorySlug === 'Academic') {
        mode = 'academic'
      } else {
        mode = 'general'
      }

      // Analyze current editor text only (single source of truth)
      const res = await fetch('/api/proofreading/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          content: textToAnalyze,
          mode,
          options: {
            spelling: true,
            grammar: true,
            style: true,
            clarity: true,
          },
        }),
      })

      const data = await res.json()
      if (data.ok) {
        // Upsert issues into database
        const issuesRes = await fetch('/api/proofreading/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            document_id: docId,
            issues: data.issues,
          }),
        })

        const issuesData = await issuesRes.json()
        if (issuesData.ok) {
          const nextIssues = issuesData.issues || []
          // Mark this page as "not cleared" since user explicitly ran analysis.
          if (activePageId) {
            setClearedPages(prev => ({ ...prev, [activePageId]: false }))
            setPageIssues(prev => ({ ...prev, [activePageId]: nextIssues }))
          }
          setIssues(nextIssues)
          
          // Update document analysis
          await fetch(`/api/proofreading/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysis: {
                summary: {
                  totalIssues: data.issues.length,
                  byType: data.issues.reduce((acc: any, issue: any) => {
                    acc[issue.type] = (acc[issue.type] || 0) + 1
                    return acc
                  }, {}),
                },
              },
            }),
          })
        }
      } else {
        setError(data.error || 'Failed to analyze text')
      }
    } catch (err: any) {
      console.error('Failed to run analysis:', err)
      setError(err.message || 'Failed to run analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * Re-run analysis on given content and replace issues list.
   * Uses current project mode (general / academic / academic_research) when mode not provided.
   * Returns the number of issues returned by the analyzer (for safety checks).
   */
  const runAnalysisWithContent = useCallback(
    async (pageContent: string, mode?: 'general' | 'academic' | 'academic_research'): Promise<number> => {
      const docId = activeDocumentId
      const activePageId = pages[activePageIndex]?.id
      if (!docId || !activePageId) return 0

      const analysisMode = mode ?? getAnalysisMode()
      const options =
        analysisMode === 'general'
          ? { spelling: true, grammar: true, style: true, clarity: true }
          : analysisMode === 'academic_research'
            ? { grammar: true, style: true, clarity: true, section: undefined as string | undefined }
            : { grammar: true, style: true, clarity: true }

      try {
        setIsAnalyzing(true)
        setError(null)
        const res = await fetch('/api/proofreading/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: docId,
            content: pageContent,
            mode: analysisMode,
            options,
          }),
        })
        const data = await res.json()
        if (!data.ok) {
          setError(data.error || data.message || 'Re-analysis failed')
          return 0
        }
        const issueCount = Array.isArray(data.issues) ? data.issues.length : 0
        const issuesRes = await fetch('/api/proofreading/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_id: docId, issues: data.issues }),
        })
        const issuesData = await issuesRes.json()
        if (issuesData.ok) {
          const nextIssues = issuesData.issues || []
          setClearedPages(prev => ({ ...prev, [activePageId]: false }))
          setPageIssues(prev => ({ ...prev, [activePageId]: nextIssues }))
          setIssues(nextIssues)
        }
        return issueCount
      } catch (err: any) {
        console.error('Re-analysis after apply failed:', err)
        setError(err.message || 'Re-analysis failed')
        return 0
      } finally {
        setIsAnalyzing(false)
      }
    },
    [activeDocumentId, activePageIndex, pages, getAnalysisMode]
  )

  const applyIssue = async (issue: ProofreadingIssue) => {
    if (!activeDocumentId || !currentDocument) return

    const originalText = issue.original_text ?? ''
    const suggestion = (issue.suggestion_text ?? '').trim()
    const isDelete = issue.action === 'delete' || issue.type === 'repetition'
    // Tip-only (e.g. clarity with no replacement): no-op; Apply is already disabled in UI
    if (!isDelete && !suggestion) return

    const activePageContent = pages[activePageIndex]?.content ?? ''
    const activePageId = pages[activePageIndex]?.id
    const start = issue.start_index ?? (issue as any).startIndex ?? 0
    const end = issue.end_index ?? (issue as any).endIndex ?? start
    const mode = getAnalysisMode()

    try {
      const textLen = activePageContent.length
      const startClamp = Math.max(0, Math.min(start, textLen))
      const endClamp = Math.max(startClamp, Math.min(end, textLen))
      const currentSlice = activePageContent.substring(startClamp, endClamp)

      if (currentSlice !== originalText) {
        addToast?.({ title: 'Text changed', description: 'Re-analyzing to refresh offsets.', variant: 'default' })
        await runAnalysisWithContent(activePageContent, mode)
        return
      }

      setApplyingIssueId(issue.id)
      // Same apply engine for General and Academic: slice-only, word-boundary preservation
      let replacement = isDelete ? '' : (issue.suggestion_text ?? '').trim()
      if (replacement) {
        const charBefore = startClamp > 0 ? activePageContent[startClamp - 1] : ' '
        const charAfter = endClamp < activePageContent.length ? activePageContent[endClamp] : ' '
        if (/[a-zA-Z]/.test(charBefore) && /[a-zA-Z]/.test(replacement[0])) replacement = ' ' + replacement
        if (/[a-zA-Z]/.test(replacement[replacement.length - 1]) && /[a-zA-Z]/.test(charAfter)) replacement = replacement + ' '
      }
      const before = activePageContent.substring(0, startClamp)
      const after = activePageContent.substring(endClamp)
      let newContent = before + replacement + after
      newContent = collapseDoubleSpaces(newContent)
      newContent = normalizeTrailingDots(newContent)
      newContent = fixBrokenCapitalizationSpacing(newContent)

      setPages(prev => {
        const updated = [...prev]
        if (updated[activePageIndex]) {
          updated[activePageIndex] = { ...updated[activePageIndex], content: newContent }
        }
        return updated
      })
      setContent(newContent)

      const combinedContent = pages
        .map((p, i) => (i === activePageIndex ? newContent : p.content))
        .join('\n\n--- Page Break ---\n\n')
      await saveDocument(activeDocumentId, combinedContent)

      const res = await fetch(`/api/proofreading/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      })
      if (!res.ok) {
        addToast?.({ title: 'Apply failed', description: 'Could not mark issue as applied.', variant: 'error' })
        return
      }

      setIssues(prev => prev.filter(i => i.id !== issue.id))
      if (activePageId) {
        setPageIssues(prev => ({
          ...prev,
          [activePageId]: (prev[activePageId] || []).filter(i => i.id !== issue.id),
        }))
      }
      addToast?.({ title: 'Applied', description: 'Re-analyzing…', variant: 'success' })
      await runAnalysisWithContent(newContent, mode)
    } catch (err: any) {
      console.error('Failed to apply issue:', err)
      addToast?.({ title: 'Apply failed', description: err.message || 'Failed to apply.', variant: 'error' })
    } finally {
      setApplyingIssueId(null)
    }
  }

  const MAX_APPLY_ALL_PASSES = 5

  /**
   * Apply All (General and Academic): offset-safe loop.
   * 1) Analyze CURRENT editor text with current project mode (single source of truth).
   * 2) Sort issues by startIndex DESC (bottom-to-top).
   * 3) Apply each fix to the CURRENT text string; verify currentText.slice(start,end) === originalText before apply.
   *    On mismatch: re-locate originalText in a window around start; if found exactly once, use that position; else skip.
   * 4) Slice-only: newText = currentText.slice(0,start) + replacement + currentText.slice(end). No global/regex replace.
   * 5) After each pass, update editor state; after all passes, re-run analysis in same mode. If General and 0 issues but merged tokens, re-analyze.
   */
  const applyAllIssues = async () => {
    if (!activeDocumentId || !currentDocument) return
    const activePageId = pages[activePageIndex]?.id
    if (!activePageId) return

    const mode = getAnalysisMode()
    const options =
      mode === 'general'
        ? { spelling: true, grammar: true, style: true, clarity: true }
        : mode === 'academic_research'
          ? { grammar: true, style: true, clarity: true, section: undefined as string | undefined }
          : { grammar: true, style: true, clarity: true }

    let content = pages[activePageIndex]?.content ?? ''
    if (!content.trim()) {
      addToast?.({ title: 'No content', description: 'Add text to proofread.', variant: 'default' })
      return
    }

    try {
      setIsApplyingAll(true)
      setError(null)

      for (let pass = 1; pass <= MAX_APPLY_ALL_PASSES; pass++) {
        const res = await fetch('/api/proofreading/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: activeDocumentId,
            content,
            mode,
            options,
          }),
        })
        const data = await res.json()
        if (!data.ok) {
          setError(data.error || data.message || 'Analysis failed')
          break
        }
        const issuesList: Array<{ id?: string; startIndex?: number; endIndex?: number; start_index?: number; end_index?: number; original_text?: string; suggestion_text?: string; type?: string; action?: string }> = data.issues || []

        if (issuesList.length === 0) {
          addToast?.({ title: 'Apply All complete', description: 'No issues remaining.', variant: 'success' })
          break
        }

        const sorted = [...issuesList].sort((a, b) => (b.startIndex ?? b.start_index ?? 0) - (a.startIndex ?? a.start_index ?? 0))
        let currentText = content
        let appliedCount = 0
        const SEARCH_WINDOW = 80

        for (const issue of sorted) {
          const originalText = issue.original_text ?? ''
          if (!originalText) continue
          const isDelete = issue.action === 'delete' || issue.type === 'repetition'
          const hasReplacement = isDelete || (issue.suggestion_text ?? '').trim()
          if (!hasReplacement) continue
          const expectedStart = issue.startIndex ?? issue.start_index ?? 0
          const expectedEnd = issue.endIndex ?? issue.end_index ?? expectedStart
          const textLen = currentText.length
          let start = Math.max(0, Math.min(expectedStart, textLen))
          let end = Math.max(start, Math.min(expectedEnd, textLen))
          let slice = currentText.substring(start, end)

          if (slice !== originalText) {
            const windowStart = Math.max(0, expectedStart - SEARCH_WINDOW)
            const windowEnd = Math.min(textLen, expectedStart + SEARCH_WINDOW + originalText.length)
            const candidates: number[] = []
            let pos = currentText.indexOf(originalText, windowStart)
            while (pos !== -1 && pos + originalText.length <= windowEnd) {
              candidates.push(pos)
              pos = currentText.indexOf(originalText, pos + 1)
            }
            if (candidates.length === 0) continue
            const closest = candidates.reduce((best, idx) =>
              Math.abs(idx - expectedStart) < Math.abs(best - expectedStart) ? idx : best
            )
            const tie = candidates.filter(idx => Math.abs(idx - expectedStart) === Math.abs(closest - expectedStart))
            if (tie.length > 1) continue
            start = closest
            end = closest + originalText.length
            slice = currentText.substring(start, end)
            if (slice !== originalText) continue
          }

          let replacement = isDelete ? '' : (issue.suggestion_text ?? '')
          if (replacement) {
            const charBefore = start > 0 ? currentText[start - 1] : ' '
            const charAfter = end < textLen ? currentText[end] : ' '
            const needSpaceBefore = /[a-zA-Z]/.test(charBefore) && /[a-zA-Z]/.test(replacement[0])
            const needSpaceAfter = /[a-zA-Z]/.test(replacement[replacement.length - 1]) && /[a-zA-Z]/.test(charAfter)
            if (needSpaceBefore) replacement = ' ' + replacement
            if (needSpaceAfter) replacement = replacement + ' '
          }
          currentText = currentText.substring(0, start) + replacement + currentText.substring(end)
          appliedCount++
        }

        if (appliedCount === 0) {
          addToast?.({ title: 'Apply All', description: 'No more fixes could be applied (positions may be stale). Run analysis again if needed.', variant: 'default' })
          break
        }

        content = collapseDoubleSpaces(currentText)
        content = normalizeTrailingDots(content)
        content = fixBrokenCapitalizationSpacing(content)
        setPages((prev) => {
          const updated = [...prev]
          if (updated[activePageIndex]) {
            updated[activePageIndex] = { ...updated[activePageIndex], content }
          }
          return updated
        })
        setContent(content)

        const combinedContent = pages
          .map((p, i) => (i === activePageIndex ? content : p.content))
          .join('\n\n--- Page Break ---\n\n')
        await saveDocument(activeDocumentId, combinedContent)
      }

      const issueCount = await runAnalysisWithContent(content, mode)
      if (mode === 'general' && issueCount === 0 && content.trim().length > 0 && hasMergedTokens(content)) {
        setError('Possible merged words detected (e.g. missing spaces). Run Analysis again to refresh issues.')
        await runAnalysisWithContent(content, mode)
      }
    } catch (err: any) {
      console.error('Apply All failed:', err)
      addToast?.({ title: 'Apply All failed', description: err.message || 'Failed to apply all.', variant: 'error' })
    } finally {
      setIsApplyingAll(false)
    }
  }

  const MAX_AUTO_FIX_PASSES = 5

  /**
   * Auto-Fix (Iterative): run analysis → apply safe fixes in descending order → re-analyze → repeat
   * until no issues, max passes, or no fixes applied. Grammarly-like proofreading loop.
   */
  const runAutoFixLoop = async () => {
    if (!isGeneralMode() || !activeDocumentId || !currentDocument) return
    const activePageId = pages[activePageIndex]?.id
    if (!activePageId) return

    let content = pages[activePageIndex]?.content ?? ''
    if (!content.trim()) {
      addToast?.({ title: 'No content', description: 'Add text to proofread.', variant: 'default' })
      return
    }

    setIsAutoFixRunning(true)
    setError(null)

    try {
      for (let pass = 1; pass <= MAX_AUTO_FIX_PASSES; pass++) {
        setAutoFixPass(pass)
        const res = await fetch('/api/proofreading/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: activeDocumentId,
            content,
            mode: 'general',
            options: { spelling: true, grammar: true, style: true, clarity: true },
          }),
        })
        const data = await res.json()
        if (!data.ok) {
          setError(data.error || data.message || 'Analysis failed')
          break
        }
        const issuesList: Array<{ startIndex: number; endIndex: number; original_text?: string; suggestion_text?: string; type?: string; action?: string }> = data.issues || []
        setAutoFixRemaining(issuesList.length)

        if (issuesList.length === 0) {
          addToast?.({ title: 'Auto-Fix complete', description: 'No issues remaining.', variant: 'success' })
          break
        }

        const sorted = [...issuesList].sort((a, b) => (b.startIndex ?? 0) - (a.startIndex ?? 0))
        let newContent = content
        let appliedCount = 0

        for (const issue of sorted) {
          const start = issue.startIndex ?? 0
          const end = issue.endIndex ?? start
          const originalText = issue.original_text ?? ''
          const textLen = newContent.length
          const startClamp = Math.max(0, Math.min(start, textLen))
          const endClamp = Math.max(startClamp, Math.min(end, textLen))
          const slice = newContent.substring(startClamp, endClamp)
          if (slice !== originalText) continue
          const isDelete = issue.action === 'delete' || issue.type === 'repetition'
          let replacement = isDelete ? '' : (issue.suggestion_text ?? '')
          if (replacement) {
            const charBefore = startClamp > 0 ? newContent[startClamp - 1] : ' '
            const charAfter = endClamp < textLen ? newContent[endClamp] : ' '
            const needSpaceBefore = /[a-zA-Z]/.test(charBefore) && /[a-zA-Z]/.test(replacement[0])
            const needSpaceAfter = /[a-zA-Z]/.test(replacement[replacement.length - 1]) && /[a-zA-Z]/.test(charAfter)
            if (needSpaceBefore) replacement = ' ' + replacement
            if (needSpaceAfter) replacement = replacement + ' '
          }
          newContent = newContent.substring(0, startClamp) + replacement + newContent.substring(endClamp)
          appliedCount++
        }

        if (appliedCount === 0) break

        content = collapseDoubleSpaces(newContent)
        content = normalizeTrailingDots(content)
        content = fixBrokenCapitalizationSpacing(content)
        setPages((prev) => {
          const updated = [...prev]
          if (updated[activePageIndex]) {
            updated[activePageIndex] = { ...updated[activePageIndex], content }
          }
          return updated
        })
        setContent(content)

        const combinedContent = pages
          .map((p, i) => (i === activePageIndex ? content : p.content))
          .join('\n\n--- Page Break ---\n\n')
        await saveDocument(activeDocumentId, combinedContent)
      }

      await runAnalysisWithContent(content)
    } catch (err: any) {
      console.error('Auto-Fix loop failed:', err)
      addToast?.({ title: 'Auto-Fix failed', description: err.message || 'Something went wrong.', variant: 'error' })
    } finally {
      setIsAutoFixRunning(false)
      setAutoFixPass(0)
      setAutoFixRemaining(null)
    }
  }

  /** AI (LLM) proofread: full-text only. No-op when feature flag is off. */
  const runAiProofread = useCallback(async () => {
    if (!ENABLE_LLM_PROOFREAD) return
    const editorText = (latestEditorContentRef.current ?? pages[activePageIndex]?.content ?? '').trim()
    if (!editorText || !isGeneralMode()) return
    if (process.env.NODE_ENV === 'development') {
      console.log('LLM INPUT length:', editorText.length, 'preview:', editorText.slice(0, 150))
    }
    setAiProofreadLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/proofreading/ai-proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editorText }),
      })
      const responseText = await res.text()
      if (process.env.NODE_ENV === 'development') {
        console.log('LLM RAW RESPONSE status:', res.status, 'length:', responseText.length, 'preview:', responseText.slice(0, 300))
      }
      let data: { ok?: boolean; error?: string; corrected_text?: string; improved_text?: string; issues?: unknown[]; confidence_score?: number; raw_preview?: string }
      try {
        data = JSON.parse(responseText) as typeof data
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : 'Invalid JSON'
        setError(`Response parse error: ${msg}`)
        addToast?.({ title: 'AI Proofread failed', description: `Could not parse response: ${msg}`, variant: 'error' })
        return
      }
      if (!data.ok) {
        const errMsg = data.error || 'AI proofread failed'
        setError(errMsg)
        if (data.raw_preview) {
          if (process.env.NODE_ENV === 'development') console.log('LLM RAW RESPONSE (error preview):', data.raw_preview)
        }
        addToast?.({ title: 'AI Proofread failed', description: errMsg, variant: 'error' })
        return
      }
      setAiProofreadOriginal(editorText)
      type AiIssue = { type: string; original: string; correction: string; explanation: string }
      setAiProofreadResult({
        corrected_text: data.corrected_text ?? editorText,
        improved_text: data.improved_text ?? data.corrected_text ?? editorText,
        issues: (Array.isArray(data.issues) ? data.issues : []) as AiIssue[],
        confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : 0,
      })
      addToast?.({ title: 'AI Proofread complete', description: `Confidence: ${data.confidence_score ?? 0}%`, variant: 'success' })
    } catch (err: any) {
      setError(err.message || 'AI proofread failed')
      addToast?.({ title: 'AI Proofread failed', description: err.message || 'Try again.', variant: 'error' })
    } finally {
      setAiProofreadLoading(false)
    }
  }, [activePageIndex, pages, isGeneralMode, addToast])

  /** Replace editor content with AI result (full text only; no partial patches). */
  const applyAiProofreadVersion = useCallback(
    (version: 'corrected_text' | 'improved_text') => {
      if (!aiProofreadResult) return
      const newContent = aiProofreadResult[version] ?? ''
      setPages((prev) => {
        const updated = [...prev]
        if (updated[activePageIndex]) {
          updated[activePageIndex] = { ...updated[activePageIndex], content: newContent }
        }
        return updated
      })
      setContent(newContent)
      latestEditorContentRef.current = newContent
      setAiProofreadResult(null)
      setAiProofreadOriginal('')
      if (activeDocumentId) {
        const combined = pages
          .map((p, i) => (i === activePageIndex ? newContent : p.content))
          .join('\n\n--- Page Break ---\n\n')
        saveDocument(activeDocumentId, combined)
      }
      addToast?.({ title: 'Text updated', description: version === 'improved_text' ? 'Replaced with improved version.' : 'Replaced with corrected version.', variant: 'success' })
    },
    [aiProofreadResult, activePageIndex, pages, activeDocumentId, addToast]
  )

  const rejectIssue = async (issue: ProofreadingIssue) => {
    try {
      const res = await fetch(`/api/proofreading/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
        }),
      })

      if (res.ok && activeDocumentId) {
        // Reload issues to ensure consistency with server
        const activePageId = pages[activePageIndex]?.id
        if (activePageId) {
          await loadIssues(activeDocumentId, issueFilter, activePageId)
        }
      }
    } catch (err) {
      console.error('Failed to reject issue:', err)
    }
  }

  const filteredIssues = useMemo(() => {
    if (issueFilter === 'all') return issues
    return issues.filter(issue => issue.status === issueFilter)
  }, [issues, issueFilter])

  // Build highlighted markup from text and issues
  // Validates and clamps ranges to prevent text corruption
  const buildHighlightedMarkup = useCallback((text: string, issuesToHighlight: ProofreadingIssue[]): string => {
    if (!text) {
      return ''
    }

    // If no issues, return escaped text only
    if (!issuesToHighlight || issuesToHighlight.length === 0) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const textLength = text.length

    // Only highlight open issues (applied/rejected should not show highlights)
    const validIssues = issuesToHighlight
      .filter(issue => {
        // Only show highlights for open issues
        if (issue.status !== 'open') {
          return false
        }
        if (
          issue.start_index == null ||
          issue.end_index == null ||
          typeof issue.start_index !== 'number' ||
          typeof issue.end_index !== 'number'
        ) {
          return false
        }
        // Clamp to valid range
        const start = Math.max(0, Math.min(issue.start_index, textLength))
        const end = Math.max(start, Math.min(issue.end_index, textLength))
        return end > start
      })
      .map(issue => ({
        ...issue,
        start_index: Math.max(0, Math.min(issue.start_index, textLength)),
        end_index: Math.max(issue.start_index, Math.min(issue.end_index, textLength)),
      }))

    if (validIssues.length === 0) {
      // No valid issues, return escaped text
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    // Sort by start_index ascending, then end_index descending (longest first for same start)
    validIssues.sort((a, b) => {
      if (a.start_index !== b.start_index) {
        return a.start_index - b.start_index
      }
      return b.end_index - a.end_index
    })

    // Remove overlapping issues (keep first, skip overlapping ones)
    const nonOverlapping: ProofreadingIssue[] = []
    for (const issue of validIssues) {
      const overlaps = nonOverlapping.some(existing => {
        return (
          (issue.start_index >= existing.start_index && issue.start_index < existing.end_index) ||
          (issue.end_index > existing.start_index && issue.end_index <= existing.end_index) ||
          (issue.start_index <= existing.start_index && issue.end_index >= existing.end_index)
        )
      })
      if (!overlaps) {
        nonOverlapping.push(issue)
      }
    }

    // Build segments - ensure we cover the entire text exactly once
    const segments: Array<{ text: string; issue?: ProofreadingIssue }> = []
    let lastIndex = 0

    for (const issue of nonOverlapping) {
      // Clamp issue range to current text bounds
      const issueStart = Math.max(lastIndex, Math.min(issue.start_index, textLength))
      const issueEnd = Math.max(issueStart, Math.min(issue.end_index, textLength))

      // Add text before this issue
      if (issueStart > lastIndex) {
        const beforeText = text.substring(lastIndex, issueStart)
        segments.push({ text: beforeText })
      }

      // Add highlighted issue text
      if (issueEnd > issueStart) {
        const issueText = text.substring(issueStart, issueEnd)
        segments.push({
          text: issueText,
          issue,
        })
      }

      lastIndex = Math.max(lastIndex, issueEnd)
    }

    // Add remaining text after last issue
    if (lastIndex < textLength) {
      const remainingText = text.substring(lastIndex)
      segments.push({ text: remainingText })
    }

    // Convert segments to HTML - escape text and wrap issues in mark tags
    return segments
      .map(segment => {
        // Escape HTML entities
        const escaped = segment.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')

        if (segment.issue) {
          const typeClass = `pf-mark--${segment.issue.type}`
          return `<mark class="pf-mark ${typeClass}">${escaped}</mark>`
        }
        return escaped
      })
      .join('')
  }, [])

  // Show highlights for filtered issues (respects filter tab) - only for active page
  const highlightedMarkup = useMemo(() => {
    const activePageContent = pages[activePageIndex]?.content || ''
    return buildHighlightedMarkup(activePageContent, filteredIssues)
  }, [pages, activePageIndex, filteredIssues, buildHighlightedMarkup])

  // Sync scroll: wrapper (overlayRef) is the ONLY scroll container
  // Both overlay and textarea are absolute inside wrapper, so they move together
  const handleScroll = useCallback(() => {
    // No sync needed - wrapper scrolls, both layers move together since they're absolute
    // This callback is kept for potential future use
  }, [])
  
  // Single source of truth for editor text (General mode). Always use this for Run Analysis and Apply.
  // Never analyze cached/DB content or a different state — only pages[activePageIndex].content.
  const activePageContent = pages[activePageIndex]?.content || ''
  const editorText = activePageContent
  
  // Ensure textarea and overlay heights match content for proper scrolling
  // CRITICAL: Wrapper is the scroll container. Both layers must match content height.
  useEffect(() => {
    if (textareaRef.current && overlayRef.current) {
      const textarea = textareaRef.current
      const wrapper = overlayRef.current
      
      // Reset height to calculate actual scrollHeight
      textarea.style.height = 'auto'
      const contentHeight = Math.max(textarea.scrollHeight, 200) // Min 200px
      
      // Set textarea height to match content (wrapper will scroll this)
      textarea.style.height = `${contentHeight}px`
      
      // Ensure overlay div also matches height for alignment
      const overlayDiv = wrapper.querySelector('.pf-overlay') as HTMLElement
      if (overlayDiv) {
        overlayDiv.style.minHeight = `${contentHeight}px`
      }
    }
  }, [activePageContent, highlightedMarkup, pages, activePageIndex])

  const issueCounts = useMemo(() => {
    return {
      all: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      applied: issues.filter(i => i.status === 'applied').length,
      rejected: issues.filter(i => i.status === 'rejected').length,
    }
  }, [issues])

  const canRunAnalysis = activeProjectId && (activeDocumentId || activePageContent.trim().length > 0) && activePageContent.trim().length > 0 && !isAnalyzing

  // Compute JAZ context for Proofreading Workspace
  const jazContext = useMemo(() => {
    if (activeTab === 'proofreading') {
      const hasContent = activePageContent.trim().length > 0
      const openIssues = issues.filter(i => i.status === 'open')
      const hasIssues = issues.length > 0
      
      return {
        page: 'proofreading-workspace' as const,
        activeTab: 'proofreading' as const,
        hasProject: !!activeProjectId,
        hasContent,
        hasIssues,
        openIssuesCount: openIssues.length,
        isAcademicProject: isAcademicProject(activeProjectId),
        hasPages: pages.length > 1,
      }
    } else {
      // Email Builder tab
      // For emailFieldsComplete, we'll check if mode is generate and if key fields exist
      // Since wizardData is in EmailBuilderContent, we'll approximate by checking if mode is set
      const emailBodyEmpty = !emailBody.trim()
      const emailDraftExists = !!(emailSubject || emailBody || emailGreeting || emailClosing || emailSignature)
      const emailIsProofread = emailIssues.length > 0 && emailIssues.every(i => i.status !== 'open')
      // For generate mode, we'll assume fields are incomplete if body is empty (user hasn't generated yet)
      const emailFieldsComplete = isEmailMode === 'generate' ? emailDraftExists : true
      
      return {
        page: 'proofreading-workspace' as const,
        activeTab: 'email' as const,
        hasEmailProject: !!activeEmailProjectId,
        emailMode: isEmailMode,
        emailBodyEmpty,
        emailFieldsComplete,
        emailDraftExists,
        emailIsProofread,
      }
    }
  }, [
    activeTab,
    activeProjectId,
    activePageContent,
    issues,
    pages.length,
    isAcademicProject,
    activeEmailProjectId,
    isEmailMode,
    emailBody,
    emailSubject,
    emailGreeting,
    emailClosing,
    emailSignature,
    emailIssues,
  ])

  // Update JAZ context when it changes
  useEffect(() => {
    setContext(jazContext)
    return () => setContext(null) // Cleanup on unmount
  }, [jazContext, setContext])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows - match CV Builder */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header: vertical order to match CV Builder (Back → Title → BETA → Note top-right) */}
        <header className="mb-2 pb-2 border-b border-slate-800/60" data-no-translate>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              Back to Dashboard
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 m-0 leading-tight">
                {activeTab === 'proofreading' ? 'Writing Review Workspace' : 'Email Builder'}
              </h1>
              {activeTab === 'proofreading' && (
                <p className="text-xs text-slate-400/90 leading-tight m-0 sm:text-right max-w-md">
                  This tool supports writing improvement and review, not final authorship. Follow your guidelines and seek human review when required.
                </p>
              )}
            </div>
            {activeTab === 'proofreading' && (
              <div className="flex justify-center pt-1">
                <span className="inline-block text-[11px] md:text-xs text-red-400/80 leading-tight py-1 px-2 rounded border border-red-500/25 bg-red-950/10" title="Writing Review is currently in BETA. This feature is under active development.">
                  Writing Review is currently in BETA
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mt-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('proofreading')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                activeTab === 'proofreading'
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              Writing Review
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                activeTab === 'email'
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              Email Builder
            </button>
          </div>
        </div>

        <div className="pb-4">
        {activeTab === 'proofreading' ? (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)] md:h-[calc(100vh-11rem)]">
            {/* LEFT COLUMN: Project List */}
          <div className="col-span-3 flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/70 overflow-hidden">
            <div className="p-4 border-b border-slate-800/60">
              <h2 className="text-lg font-semibold text-slate-50 mb-3">Projects</h2>
              
              {/* New Project Button - Always Visible */}
              <button
                onClick={() => {
                  if (!showNewProjectForm && !ENABLE_PHD_MODE) setNewProjectCategory('general')
                  setShowNewProjectForm(!showNewProjectForm)
                }}
                data-jaz-action="pr_new_project"
                className="w-full px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 rounded-lg text-violet-300 text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>

              {/* Collapsible Create Form - Shown inline above list */}
              {showNewProjectForm && (
                <div className="mt-3 space-y-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Project title"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createProject()
                      if (e.key === 'Escape') setShowNewProjectForm(false)
                    }}
                  />
                  
                  {/* Segmented Category Buttons */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setNewProjectCategory('general')}
                        className={cn(
                          "h-9 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150",
                          newProjectCategory === 'general'
                            ? "bg-violet-600/60 border border-violet-300/20 text-white"
                            : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                        )}
                      >
                        General
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProjectCategory('academic_standard')}
                        className={cn(
                          "h-9 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150",
                          newProjectCategory === 'academic_standard'
                            ? "bg-violet-600/60 border border-violet-300/20 text-white"
                            : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                        )}
                      >
                        Academic – Standard
                      </button>
                      {ENABLE_PHD_MODE && (
                        <button
                          type="button"
                          onClick={() => setNewProjectCategory('academic_research_phd')}
                          className={cn(
                            "h-9 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150",
                            newProjectCategory === 'academic_research_phd'
                              ? "bg-violet-600/60 border border-violet-300/20 text-white"
                              : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                          )}
                        >
                          Academic – Research / PhD
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 px-1">
                      Choose a category to set the analysis rules.
                    </p>
                  </div>

                  {error && showNewProjectForm && (
                    <div className="text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded p-2">
                      {error}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={createProject}
                      className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowNewProjectForm(false)}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {projectsToShow.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectChange(project.id)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition",
                    activeProjectId === project.id
                      ? "bg-violet-600/30 border border-violet-600/50"
                      : "bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {project.category === 'CV' && <Briefcase className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                        {project.category === 'Academic' && <BookOpen className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                        {project.category === 'Academic Research' && <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                        {project.category === 'General' && <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                        <span className="text-sm font-medium text-slate-50 truncate">{project.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{project.category}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProjectId(project.id)
                        setIsDeleteDialogOpen(true)
                      }}
                      className="p-1 hover:bg-slate-700 rounded transition"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </button>
              ))}
              
              {projectsToShow.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No projects yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* CENTER COLUMN: Document Editor */}
          <div className="col-span-6 flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/70 overflow-hidden min-h-0">
            <div className="p-4 border-b border-slate-800/60 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-50">
                  {projects.find(p => p.id === activeProjectId)?.title || 'No project selected'}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Hidden file input for import */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pdf"
                    onChange={handleImportFile}
                    className="hidden"
                    disabled={isImporting || !activeProjectId}
                  />
                  {/* Import button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting || !activeProjectId}
                    data-jaz-action="pr_import_file"
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                      isImporting || !activeProjectId
                        ? "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400"
                        : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 text-violet-300"
                    )}
                    title="Import DOCX or PDF file"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Import (.docx, .txt)
                      </>
                    )}
                  </button>
                  {/* Download button */}
                  <button
                    onClick={handleExportDocx}
                    disabled={isExporting || !activeProjectId || !pages.some(page => page.content.trim().length > 0)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                      isExporting || !activeProjectId || !pages.some(page => page.content.trim().length > 0)
                        ? "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400"
                        : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 text-violet-300"
                    )}
                    title="Download document as Word file"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        Download (.docx)
                      </>
                    )}
                  </button>
                  {/* Info icon with tooltip for academic projects */}
                  {isAcademicProject(activeProjectId) && (
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => {
                          if (importTooltipTimeoutRef.current) {
                            clearTimeout(importTooltipTimeoutRef.current)
                          }
                          setShowImportTooltip(true)
                        }}
                        onMouseLeave={() => {
                          importTooltipTimeoutRef.current = setTimeout(() => {
                            setShowImportTooltip(false)
                          }, 100)
                        }}
                        onFocus={() => setShowImportTooltip(true)}
                        onBlur={() => {
                          importTooltipTimeoutRef.current = setTimeout(() => {
                            setShowImportTooltip(false)
                          }, 100)
                        }}
                        className="p-1 text-slate-400 hover:text-violet-300 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        aria-label="Import information"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      {showImportTooltip && (
                        <div
                          className="absolute right-0 top-full mt-2 z-50 w-64 p-3 bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl text-xs text-slate-300"
                          onMouseEnter={() => {
                            if (importTooltipTimeoutRef.current) {
                              clearTimeout(importTooltipTimeoutRef.current)
                            }
                            setShowImportTooltip(true)
                          }}
                          onMouseLeave={() => {
                            importTooltipTimeoutRef.current = setTimeout(() => {
                              setShowImportTooltip(false)
                            }, 100)
                          }}
                        >
                          <div className="font-medium text-violet-300 mb-1.5">Import Documents</div>
                          <div className="text-slate-400 leading-relaxed">
                            Import DOCX or PDF files to get started. The document content will be loaded into the editor for writing review and analysis.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isSaving && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                    </div>
                  )}
                  {error && (
                    <button
                      onClick={() => {
                        setError(null)
                        if (activeProjectId) loadDocument(activeProjectId)
                      }}
                      className="p-1 hover:bg-slate-700 rounded transition"
                      title="Retry"
                    >
                      <RefreshCw className="w-4 h-4 text-yellow-400" />
                    </button>
                  )}
                </div>
              </div>
              
              {activeProjectId && isLoadingDocument && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="ml-2 text-xs text-slate-400">Loading document...</span>
                </div>
              )}
              
              {error && (
                <div className="mt-2 p-2 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-300">
                  {error}
                  <button
                    onClick={() => {
                      setError(null)
                      if (activeProjectId) loadDocument(activeProjectId)
                    }}
                    className="ml-2 underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Editor Area - or AI Proofread side-by-side when result is present (only if LLM feature enabled) */}
            {activeProjectId ? (
              <div className="flex-1 min-h-0 flex flex-col">
                {ENABLE_LLM_PROOFREAD && aiProofreadResult ? (
                  /* AI Proofread: Original | Corrected | Improved — full-text replace only */
                  <div className="flex-1 flex flex-col min-h-0 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">AI Proofread — Compare and replace</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Confidence: {aiProofreadResult.confidence_score}%</span>
                        <button
                          onClick={() => { setAiProofreadResult(null); setAiProofreadOriginal('') }}
                          className="px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300"
                        >
                          Back to edit
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
                      <div className="flex flex-col rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">Original</div>
                        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-200 whitespace-pre-wrap break-words">{aiProofreadOriginal}</div>
                      </div>
                      <div className="flex flex-col rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-emerald-400">Corrected</div>
                        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-200 whitespace-pre-wrap break-words">{aiProofreadResult.corrected_text}</div>
                        <div className="p-3 border-t border-slate-700">
                          <button
                            onClick={() => applyAiProofreadVersion('corrected_text')}
                            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Replace with Corrected
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-violet-400">Improved</div>
                        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-200 whitespace-pre-wrap break-words">{aiProofreadResult.improved_text}</div>
                        <div className="p-3 border-t border-slate-700">
                          <button
                            onClick={() => applyAiProofreadVersion('improved_text')}
                            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            Replace with Improved
                          </button>
                        </div>
                      </div>
                    </div>
                    {aiProofreadResult.issues.length > 0 && (
                      <details className="mt-4 rounded-lg border border-slate-700 bg-slate-800/40 overflow-hidden">
                        <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-slate-300 hover:bg-slate-800/60">
                          Issues ({aiProofreadResult.issues.length})
                        </summary>
                        <div className="max-h-48 overflow-y-auto p-4 space-y-2">
                          {aiProofreadResult.issues.map((item, idx) => (
                            <div key={idx} className="text-xs border-b border-slate-700/60 pb-2 last:border-0">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">{item.type}</span>
                              <span className="text-slate-400 mx-1">—</span>
                              <span className="text-red-300/90 line-through">{item.original}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span className="text-emerald-300/90">{item.correction}</span>
                              {item.explanation && <p className="text-slate-500 mt-1">{item.explanation}</p>}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : isLoadingDocument ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                ) : (
                  /* Single scroll container: wrapper handles all scrolling */
                  <div 
                    ref={overlayRef}
                    className="flex-1 relative min-h-0 bg-white rounded-lg border border-gray-200 overflow-y-auto overflow-x-hidden"
                    onScroll={handleScroll}
                  >
                    {/* Highlight Overlay - Absolute, no scroll, matches textarea content height */}
                    <div
                      className="pf-overlay absolute top-0 left-0 right-0 p-6 md:p-8 bg-white pointer-events-none whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: highlightedMarkup || '' }}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        letterSpacing: 'inherit',
                        color: '#111827',
                        wordBreak: 'break-word',
                        width: '100%',
                      }}
                    />
                    {/* Textarea - Absolute, no scroll, height matches content, wrapper handles scrolling */}
                    <textarea
                      ref={textareaRef}
                      value={activePageContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text')
                        handleContentChange(activePageContent + pastedText)
                      }}
                      placeholder="Enter your text here... (Document will be created automatically)"
                      className="pf-textarea absolute top-0 left-0 right-0 w-full p-6 md:p-8 bg-transparent resize-none outline-none text-sm md:text-base leading-relaxed overflow-hidden whitespace-pre-wrap break-words placeholder:text-gray-400"
                      style={{ 
                        caretColor: '#111827',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        letterSpacing: 'inherit',
                        color: 'transparent',
                        textShadow: '0 0 0 #111827', // Show black text via shadow while keeping text transparent for overlay
                        wordBreak: 'break-word',
                        minHeight: '100%',
                      }}
                    />
                  </div>
                )}
                
                {/* Page Selector UI - Under the editor */}
                <div className="p-3 border-t border-slate-800/60 bg-slate-900/40 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium">Pages:</span>
                    {pages.map((page, idx) => (
                      <button
                        key={page.id}
                        onClick={() => switchPage(idx)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5",
                          activePageIndex === idx
                            ? "bg-violet-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        )}
                      >
                        Page {idx + 1}
                        {pages.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removePage(idx)
                            }}
                            className="ml-1 hover:bg-slate-600/50 rounded p-0.5 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </button>
                    ))}
                    <button
                      onClick={addPage}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 text-violet-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Page
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm min-h-[200px]">
                Select a project to start editing
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Analysis Panel */}
          <div className="col-span-3 flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/70 overflow-hidden">
            <div className="p-4 border-b border-slate-800/60 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-50 mb-3">Analysis</h3>
              
              {/* Run Analysis Button */}
              <div className="mb-3">
                <button
                  onClick={runAnalysis}
                  disabled={!canRunAnalysis}
                  data-jaz-action="pr_run_analysis"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2",
                    canRunAnalysis
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400"
                  )}
                  title={!canRunAnalysis ? (activePageContent.trim().length === 0 ? "Type to analyze" : "Type or import text first") : undefined}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run Analysis
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-1.5 text-center">
                  {activePageContent.trim().length === 0 ? 'Type to analyze.' : 'Run analysis to detect issues.'}
                </p>
              </div>

              {/* Auto-Fix (Iterative) — General only; Apply All — General + Academic (Strict for PhD) */}
              {(isGeneralMode() || isAcademicProject(activeProjectId)) && (
                <div className="mb-3 space-y-2">
                  {isGeneralMode() && (
                    <button
                      onClick={runAutoFixLoop}
                      disabled={isAnalyzing || isApplyingAll || isAutoFixRunning || !(pages[activePageIndex]?.content?.trim())}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2",
                        !isAnalyzing && !isApplyingAll && !isAutoFixRunning && pages[activePageIndex]?.content?.trim()
                          ? "bg-emerald-600/90 hover:bg-emerald-600 text-white"
                          : "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400"
                      )}
                    >
                      {isAutoFixRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Pass {autoFixPass}/{MAX_AUTO_FIX_PASSES}
                          {autoFixRemaining != null && ` · ${autoFixRemaining} left`}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Auto-Fix (Iterative)
                        </>
                      )}
                    </button>
                  )}
                  {issueCounts.open > 0 && !isAutoFixRunning && (
                    <button
                      onClick={applyAllIssues}
                      disabled={isAnalyzing || isApplyingAll}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2",
                        !isAnalyzing && !isApplyingAll
                          ? "bg-green-600/90 hover:bg-green-600 text-white"
                          : "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400"
                      )}
                      title={getAnalysisMode() === 'academic_research' ? 'Apply all safe corrections, then re-run full validation' : undefined}
                    >
                      {isApplyingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Applying all…
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {getAnalysisMode() === 'academic_research' ? `Apply All (Strict) (${issueCounts.open})` : `Apply All (${issueCounts.open})`}
                        </>
                      )}
                    </button>
                  )}
                  {ENABLE_LLM_PROOFREAD && isGeneralMode() && (
                    <button
                      onClick={runAiProofread}
                      disabled={aiProofreadLoading || !(pages[activePageIndex]?.content?.trim())}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2",
                        !aiProofreadLoading && pages[activePageIndex]?.content?.trim()
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400"
                      )}
                      title="AI-powered proofreading: correct + improve full text (no partial patches)"
                    >
                      {aiProofreadLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI Proofreading…
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          AI Proofread (LLM)
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {/* Issue Filter Tabs */}
              <div className="flex gap-1" data-jaz-action="pr_issues_panel">
                {(['all', 'open', 'applied', 'rejected'] as IssueFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setIssueFilter(filter)}
                    data-jaz-action={filter === 'open' ? 'pr_filter_open' : undefined}
                    className={cn(
                      "flex-1 px-2 py-1 rounded text-xs font-medium transition capitalize",
                      issueFilter === filter
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {filter} ({issueCounts[filter]})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {issueFilter === 'all' ? 'No issues found' : `No ${issueFilter} issues`}
                </div>
              ) : (
                filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      issue.status === 'applied'
                        ? "bg-green-900/20 border-green-700/50"
                        : issue.status === 'rejected'
                        ? "bg-slate-800/60 border-slate-700/50"
                        : "bg-slate-800/60 border-slate-700/60"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={cn(
                              "inline-block w-2 h-2 rounded-full flex-shrink-0",
                              issue.type === 'spelling' && "bg-red-400",
                              issue.type === 'grammar' && "bg-blue-400",
                              issue.type === 'research_grammar' && "bg-blue-400",
                              issue.type === 'style' && "bg-amber-400",
                              issue.type === 'clarity' && "bg-emerald-400",
                              issue.type === 'word_form' && "bg-cyan-400",
                              issue.type === 'tense' && "bg-orange-400",
                              issue.type === 'tense_consistency' && "bg-violet-400",
                              issue.type === 'repetition' && "bg-rose-400",
                              issue.type === 'structure' && "bg-pink-400",
                              issue.type === 'methodology' && "bg-pink-400",
                              issue.type === 'preposition' && "bg-teal-400",
                              issue.type === 'agreement' && "bg-emerald-500",
                              issue.type === 'article' && "bg-amber-400",
                              issue.type === 'uncountable' && "bg-cyan-400",
                              issue.type === 'academic_hedging' && "bg-orange-400",
                              issue.type === 'academic_citation' && "bg-yellow-400",
                              issue.type === 'academic_tone' && "bg-violet-400",
                              issue.type === 'academic_objectivity' && "bg-violet-400",
                              issue.type === 'academic_style' && "bg-amber-400",
                              issue.type === 'academic_logic' && "bg-pink-400",
                              issue.type === 'punctuation' && "bg-teal-400",
                              !['spelling','grammar','research_grammar','style','clarity','word_form','tense','tense_consistency','repetition','structure','methodology','preposition','agreement','article','uncountable','academic_hedging','academic_citation','academic_tone','academic_objectivity','academic_style','academic_logic','punctuation'].includes(issue.type) && "bg-violet-400"
                            )}
                            title={issue.type}
                          />
                          <span className="text-xs font-semibold text-violet-300 capitalize">{issue.type.replace(/_/g, ' ')}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            issue.severity === 'high' ? "bg-red-900/50 text-red-300" :
                            issue.severity === 'moderate' ? "bg-yellow-900/50 text-yellow-300" :
                            "bg-blue-900/50 text-blue-300"
                          )}>
                            {issue.severity}
                          </span>
                          {(!issue.suggestion_text || !issue.suggestion_text.trim()) && issue.type !== 'repetition' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300">Tip</span>
                          )}
                          {issue.type === 'repetition' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300">Delete</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 mb-1">{issue.message}</div>
                        <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-1 rounded mb-1">
                          {issue.original_text || activePageContent.substring(issue.start_index, issue.end_index)}
                        </div>
                        {issue.suggestion_text ? (
                          <div className="text-xs text-green-400 font-mono bg-slate-900/50 p-1 rounded">
                            → {issue.suggestion_text}
                          </div>
                        ) : issue.type === 'repetition' ? (
                          <div className="text-xs text-slate-400 italic">Apply to remove duplicate sentence.</div>
                        ) : null}
                      </div>
                    </div>
                    
                    {issue.status === 'open' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => applyIssue(issue)}
                          disabled={
                            isApplyingAll ||
                            isAutoFixRunning ||
                            applyingIssueId !== null ||
                            !(issue.suggestion_text?.trim() || issue.type === 'repetition' || issue.action === 'delete')
                          }
                          className={cn(
                            "flex-1 px-2 py-1 rounded text-xs font-medium transition flex items-center justify-center gap-1",
                            (issue.suggestion_text?.trim() || issue.type === 'repetition' || issue.action === 'delete') && !applyingIssueId && !isApplyingAll && !isAutoFixRunning
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-slate-600 cursor-not-allowed opacity-60"
                          )}
                        >
                          {applyingIssueId === issue.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Applying…
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              Apply
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => rejectIssue(issue)}
                          className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {issue.status === 'applied' && (
                      <div className="text-xs text-green-400 flex items-center gap-1 mt-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Applied
                      </div>
                    )}
                    
                    {issue.status === 'rejected' && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        ) : (
          <EmailBuilderContent
            emailProjects={emailProjects}
            activeEmailProjectId={activeEmailProjectId}
            setActiveEmailProjectId={setActiveEmailProjectId}
            currentEmailMessage={currentEmailMessage}
            emailSubject={emailSubject}
            setEmailSubject={setEmailSubject}
            emailGreeting={emailGreeting}
            setEmailGreeting={setEmailGreeting}
            emailBody={emailBody}
            setEmailBody={setEmailBody}
            emailClosing={emailClosing}
            setEmailClosing={setEmailClosing}
            emailSignature={emailSignature}
            setEmailSignature={setEmailSignature}
            emailIssues={emailIssues}
            setEmailIssues={setEmailIssues}
            emailIssueFilter={emailIssueFilter}
            setEmailIssueFilter={setEmailIssueFilter}
            isEmailMode={isEmailMode}
            setIsEmailMode={setIsEmailMode}
            isGenerating={isGenerating}
            isAnalyzingEmail={isAnalyzingEmail}
            newEmailProjectTitle={newEmailProjectTitle}
            setNewEmailProjectTitle={setNewEmailProjectTitle}
            showNewEmailProjectForm={showNewEmailProjectForm}
            setShowNewEmailProjectForm={setShowNewEmailProjectForm}
            error={error}
            createEmailProject={createEmailProject}
            deleteEmailProject={deleteEmailProject}
            saveEmailMessage={saveEmailMessage}
            generateEmailFromWizard={generateEmailFromWizard}
            analyzeEmail={analyzeEmail}
            copyEmailToClipboard={copyEmailToClipboard}
          />
        )}
        </div>

        {/* Delete Project Confirmation Dialog */}
        <ConfirmModal
        isOpen={isDeleteDialogOpen}
        title="Delete project?"
        message="This will permanently delete this project and all its documents. This action cannot be undone."
        onConfirm={() => {
          if (selectedProjectId) {
            deleteProject(selectedProjectId)
          }
        }}
        onCancel={() => {
          setIsDeleteDialogOpen(false)
          setSelectedProjectId(null)
        }}
        variant="danger"
        confirmText="Delete"
      />
      </main>
    </div>
  )
}

// Email Builder Content Component
function EmailBuilderContent({
  emailProjects,
  activeEmailProjectId,
  setActiveEmailProjectId,
  currentEmailMessage,
  emailSubject,
  setEmailSubject,
  emailGreeting,
  setEmailGreeting,
  emailBody,
  setEmailBody,
  emailClosing,
  setEmailClosing,
  emailSignature,
  setEmailSignature,
  emailIssues,
  setEmailIssues,
  emailIssueFilter,
  setEmailIssueFilter,
  isEmailMode,
  setIsEmailMode,
  isGenerating,
  isAnalyzingEmail,
  newEmailProjectTitle,
  setNewEmailProjectTitle,
  showNewEmailProjectForm,
  setShowNewEmailProjectForm,
  error,
  createEmailProject,
  deleteEmailProject,
  saveEmailMessage,
  generateEmailFromWizard,
  analyzeEmail,
  copyEmailToClipboard,
}: any) {
  const [wizardData, setWizardData] = useState({
    recipient_type: 'Manager' as RecipientType,
    tone: 'Professional' as Tone,
    purpose: 'job_application' as EmailPurpose,
    sender_name: '',
    sender_role: '',
    sender_phone: '',
    position_name: '',
    company_name: '',
  })
  const [pastedEmail, setPastedEmail] = useState('')
  const [showWizard, setShowWizard] = useState(false)

  const handlePasteEmail = () => {
    if (!pastedEmail.trim()) return
    const parsed = parseEmail(pastedEmail)
    setEmailSubject(parsed.subject)
    setEmailGreeting(parsed.greeting)
    setEmailBody(parsed.body)
    setEmailClosing(parsed.closing)
    setEmailSignature(parsed.signature)
    setPastedEmail('')
    setIsEmailMode(null)
  }

  const handleGenerate = () => {
    generateEmailFromWizard(wizardData)
    setShowWizard(false)
  }

  const filteredEmailIssues = useMemo(() => {
    if (emailIssueFilter === 'all') return emailIssues
    return emailIssues.filter((issue: EmailIssue) => issue.status === emailIssueFilter)
  }, [emailIssues, emailIssueFilter])

  const emailIssueCounts = useMemo(() => {
    return {
      all: emailIssues.length,
      open: emailIssues.filter((i: EmailIssue) => i.status === 'open').length,
      applied: emailIssues.filter((i: EmailIssue) => i.status === 'applied').length,
      rejected: emailIssues.filter((i: EmailIssue) => i.status === 'rejected').length,
    }
  }, [emailIssues])

  const fullEmailPreview = useMemo(() => {
    return [
      emailSubject ? `Subject: ${emailSubject}` : '',
      '',
      emailGreeting || '',
      emailBody || '',
      emailClosing || '',
      emailSignature || '',
    ].filter(Boolean).join('\n\n')
  }, [emailSubject, emailGreeting, emailBody, emailClosing, emailSignature])

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
      {/* LEFT COLUMN: Email Projects */}
      <div className="col-span-3 flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/70 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <h2 className="text-lg font-semibold text-slate-50 mb-3">Email Projects</h2>
          
          {showNewEmailProjectForm ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newEmailProjectTitle}
                onChange={(e) => setNewEmailProjectTitle(e.target.value)}
                placeholder="Project title"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createEmailProject()
                  if (e.key === 'Escape') setShowNewEmailProjectForm(false)
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={createEmailProject}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewEmailProjectForm(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewEmailProjectForm(true)}
              data-jaz-action="email_new_project"
              className="w-full px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 rounded-lg text-violet-300 text-sm font-medium transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {emailProjects.map((project: EmailProject) => (
            <button
              key={project.id}
              onClick={() => setActiveEmailProjectId(project.id)}
              className={cn(
                "w-full p-3 rounded-lg text-left transition",
                activeEmailProjectId === project.id
                  ? "bg-violet-600/30 border border-violet-600/50"
                  : "bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-50 truncate">{project.title}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteEmailProject(project.id)
                  }}
                  className="p-1 hover:bg-slate-700 rounded transition"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </button>
          ))}
          
          {emailProjects.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No projects yet. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN: Email Editor */}
      <div className="col-span-6 flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/70 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-50">
              {emailProjects.find((p: EmailProject) => p.id === activeEmailProjectId)?.title || 'No project selected'}
            </h3>
            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-700/50 rounded p-1.5">
                {error}
              </div>
            )}
          </div>

          {!activeEmailProjectId ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Select or create a project to start
            </div>
          ) : isEmailMode === 'paste' ? (
            <div className="space-y-2">
              <textarea
                value={pastedEmail}
                onChange={(e) => setPastedEmail(e.target.value)}
                placeholder="Paste your email here..."
                className="w-full h-40 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePasteEmail}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition"
                >
                  Parse Email
                </button>
                <button
                  onClick={() => {
                    setIsEmailMode(null)
                    setPastedEmail('')
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : showWizard ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Recipient Type</label>
                  <select
                    value={wizardData.recipient_type}
                    onChange={(e) => setWizardData({...wizardData, recipient_type: e.target.value as RecipientType})}
                    data-jaz-action="email_recipient"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  >
                    <option value="Manager">Manager</option>
                    <option value="HR">HR</option>
                    <option value="Client">Client</option>
                    <option value="University">University</option>
                    <option value="Landlord">Landlord</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tone</label>
                  <select
                    value={wizardData.tone}
                    onChange={(e) => setWizardData({...wizardData, tone: e.target.value as Tone})}
                    data-jaz-action="email_tone"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  >
                    <option value="Formal">Formal</option>
                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Firm">Firm</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Purpose</label>
                <select
                  value={wizardData.purpose}
                  onChange={(e) => setWizardData({...wizardData, purpose: e.target.value as EmailPurpose})}
                  data-jaz-action="email_purpose"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                >
                  <option value="job_application">Job Application</option>
                  <option value="follow_up_interview">Follow Up - Interview</option>
                  <option value="thank_you_interview">Thank You - Interview</option>
                  <option value="resignation">Resignation</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="vacation_request">Vacation Request</option>
                  <option value="meeting_request">Meeting Request</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="apology">Apology</option>
                  <option value="introduction">Introduction</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Your Name</label>
                  <input
                    type="text"
                    value={wizardData.sender_name}
                    onChange={(e) => setWizardData({...wizardData, sender_name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Your Role (optional)</label>
                  <input
                    type="text"
                    value={wizardData.sender_role}
                    onChange={(e) => setWizardData({...wizardData, sender_role: e.target.value})}
                    placeholder="Software Engineer"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  />
                </div>
              </div>
              {(wizardData.purpose === 'job_application' || wizardData.purpose === 'follow_up_interview') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Position Name</label>
                    <input
                      type="text"
                      value={wizardData.position_name}
                      onChange={(e) => setWizardData({...wizardData, position_name: e.target.value})}
                      placeholder="Software Engineer"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                    <input
                      type="text"
                      value={wizardData.company_name}
                      onChange={(e) => setWizardData({...wizardData, company_name: e.target.value})}
                      placeholder="Acme Corp"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowWizard(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setIsEmailMode('paste')}
                  className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition"
                >
                  I already wrote it
                </button>
                <button
                  onClick={() => setShowWizard(true)}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Greeting</label>
                  <input
                    type="text"
                    value={emailGreeting}
                    onChange={(e) => setEmailGreeting(e.target.value)}
                    placeholder="Dear..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Body</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body..."
                    data-jaz-action="email_body"
                    className="w-full h-40 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Closing</label>
                  <input
                    type="text"
                    value={emailClosing}
                    onChange={(e) => setEmailClosing(e.target.value)}
                    placeholder="Best regards"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Signature</label>
                  <textarea
                    value={emailSignature}
                    onChange={(e) => setEmailSignature(e.target.value)}
                    placeholder="Your name and contact info"
                    className="w-full h-20 p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <label className="text-xs text-slate-400 mb-1 block">Full Email Preview</label>
                <div className="p-3 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-50 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {fullEmailPreview || 'Email preview will appear here...'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Actions & Analysis */}
      <div className="col-span-3 flex flex-col rounded-2xl border border-slate-700/60 bg-slate-950/70 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <h3 className="text-lg font-semibold text-slate-50 mb-3">Actions</h3>
          
          <div className="space-y-2">
            <button
              onClick={saveEmailMessage}
              disabled={!activeEmailProjectId}
              data-jaz-action="email_save"
              className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Email
            </button>
            <button
              onClick={copyEmailToClipboard}
              disabled={!fullEmailPreview}
              data-jaz-action="email_copy"
              className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-4 h-4" />
              Copy Full Email
            </button>
            <button
              onClick={analyzeEmail}
              disabled={!activeEmailProjectId || !emailBody.trim() || isAnalyzingEmail}
              data-jaz-action="email_proofread"
              className="w-full px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 rounded-lg text-violet-300 text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Review & Improve
                </>
              )}
            </button>
          </div>
        </div>

        {/* Issues Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/60">
            <h3 className="text-lg font-semibold text-slate-50 mb-3">Analysis</h3>
            
            <div className="flex gap-1">
              {(['all', 'open', 'applied', 'rejected'] as IssueFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEmailIssueFilter(filter)}
                  className={cn(
                    "flex-1 px-2 py-1 rounded text-xs font-medium transition capitalize",
                    emailIssueFilter === filter
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {filter} ({emailIssueCounts[filter]})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredEmailIssues.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                {emailIssueFilter === 'all' ? 'No issues found' : `No ${emailIssueFilter} issues`}
              </div>
            ) : (
              filteredEmailIssues.map((issue: EmailIssue, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border",
                    issue.status === 'applied'
                      ? "bg-green-900/20 border-green-700/50"
                      : issue.status === 'rejected'
                      ? "bg-slate-800/60 border-slate-700/50"
                      : "bg-slate-800/60 border-slate-700/60"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-violet-300 capitalize">{issue.type}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          issue.severity === 'high' ? "bg-red-900/50 text-red-300" :
                          issue.severity === 'moderate' ? "bg-yellow-900/50 text-yellow-300" :
                          "bg-blue-900/50 text-blue-300"
                        )}>
                          {issue.severity}
                        </span>
                        {(!issue.suggestion_text || !issue.suggestion_text.trim()) && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300">Tip</span>
                        )}
                      </div>
                        <div className="text-xs text-slate-300 mb-1">{issue.message}</div>
                        {issue.explanation && (
                          <div className="text-xs text-slate-400 italic mb-1.5">
                            {issue.explanation}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-1 rounded mb-1">
                          {issue.original_text}
                        </div>
                      {issue.suggestion_text && (
                        <div className="text-xs text-green-400 font-mono bg-slate-900/50 p-1 rounded">
                          → {issue.suggestion_text}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {issue.status === 'open' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={!issue.suggestion_text || !issue.suggestion_text.trim()}
                        onClick={() => {
                          if (!issue.suggestion_text?.trim()) return
                          // Apply issue fix - issues are indexed in the fullText
                          const currentFullText = [
                            emailSubject || '',
                            '',
                            emailGreeting || '',
                            emailBody || '',
                            emailClosing || '',
                            emailSignature || '',
                          ].filter(Boolean).join('\n\n')
                          
                          if (issue.startIndex >= 0 && issue.endIndex > issue.startIndex && issue.startIndex < currentFullText.length) {
                            const before = currentFullText.substring(0, issue.startIndex)
                            const after = currentFullText.substring(Math.min(issue.endIndex, currentFullText.length))
                            const newFullText = before + issue.suggestion_text + after
                            
                            // Re-parse the fixed email
                            const parsed = parseEmail(newFullText)
                            setEmailSubject(parsed.subject || emailSubject)
                            setEmailGreeting(parsed.greeting || emailGreeting)
                            setEmailBody(parsed.body || emailBody)
                            setEmailClosing(parsed.closing || emailClosing)
                            setEmailSignature(parsed.signature || emailSignature)
                          }
                          
                          // Update issue status
                          const updatedIssues = emailIssues.map((issue: EmailIssue, index: number) => 
                            index === idx ? {...issue, status: 'applied'} : issue
                          )
                          setEmailIssues(updatedIssues)
                        }}
                        className={cn(
                          "flex-1 px-2 py-1 rounded text-xs font-medium transition flex items-center justify-center gap-1",
                          issue.suggestion_text?.trim()
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-slate-600 cursor-not-allowed opacity-60"
                        )}
                      >
                        <Check className="w-3 h-3" />
                        Apply
                      </button>
                      <button
                        onClick={() => {
                          const updatedIssues = emailIssues.map((issue: EmailIssue, index: number) => 
                            index === idx ? {...issue, status: 'rejected'} : issue
                          )
                          setEmailIssues(updatedIssues)
                        }}
                        className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

