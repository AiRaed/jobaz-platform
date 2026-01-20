'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Plus, FileText, Trash2, Loader2, X, CheckCircle2, AlertCircle, BookOpen, Briefcase, Sparkles, Check, XCircle, RefreshCw, Mail, Copy, Save, Wand2, Upload, Info, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/PageHeader'
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
  type: 'grammar' | 'spelling' | 'style' | 'clarity' | 'academic_tone' | 'academic_objectivity' | 'academic_hedging' | 'academic_citation' | 'academic_logic' | 'structure' | 'academic_style' | 'methodology' | 'evidence' | 'research_quality'
  severity: 'low' | 'moderate' | 'high'
  message: string
  original_text: string
  suggestion_text: string
  start_index: number
  end_index: number
  status: 'open' | 'applied' | 'rejected'
  created_at: string
  updated_at: string
}

type IssueFilter = 'all' | 'open' | 'applied' | 'rejected'
type TabType = 'proofreading' | 'email'

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
          setActiveProjectId(data.projects[0].id)
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
          const documentContent = data.document.content || ''
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

  const saveDocument = async (docId?: string) => {
    const documentId = docId || activeDocumentId
    if (!documentId || !activeProjectId) return

    try {
      setIsSaving(true)
      // Combine all pages content for saving
      const combinedContent = pages.map(p => p.content).join('\n\n--- Page Break ---\n\n')
      
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
      const res = await fetch('/api/proofreading/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          category: newProjectCategory,
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
    // Get active page content only
    const activePageContent = pages[activePageIndex]?.content || ''
    const activePageId = pages[activePageIndex]?.id
    if (!activeProjectId || !activePageContent.trim() || isAnalyzing) return

    try {
      setIsAnalyzing(true)
      setError(null)

      // Ensure document exists before running analysis (use combined content for document creation)
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

      // Run analysis only on active page content
      const res = await fetch('/api/proofreading/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: docId,
          content: activePageContent, // Only analyze active page
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

  const applyIssue = async (issue: ProofreadingIssue) => {
    if (!activeDocumentId || !currentDocument) return

    try {
      // Apply fix to active page content only
      const activePageContent = pages[activePageIndex]?.content || ''
      const before = activePageContent.substring(0, issue.start_index)
      const after = activePageContent.substring(issue.end_index)
      const newContent = before + (issue.suggestion_text || '') + after

      // Update active page content
      setPages(prev => {
        const updated = [...prev]
        if (updated[activePageIndex]) {
          updated[activePageIndex] = { ...updated[activePageIndex], content: newContent }
        }
        return updated
      })
      setContent(newContent)
      
      // Update issue status
      const res = await fetch(`/api/proofreading/issues/${issue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'applied',
        }),
      })

      if (res.ok) {
        // Reload issues to ensure consistency with server
        if (activeDocumentId) {
          const activePageId = pages[activePageIndex]?.id
          if (activePageId) {
            await loadIssues(activeDocumentId, issueFilter, activePageId)
          }
        }
        // Save updated content
        await saveDocument()
      }
    } catch (err) {
      console.error('Failed to apply issue:', err)
    }
  }

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

  // Sync scroll between textarea and overlay
  const handleScroll = useCallback(() => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  const issueCounts = useMemo(() => {
    return {
      all: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      applied: issues.filter(i => i.status === 'applied').length,
      rejected: issues.filter(i => i.status === 'rejected').length,
    }
  }, [issues])

  const activePageContent = pages[activePageIndex]?.content || ''
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
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50">
      <PageHeader 
        title={activeTab === 'proofreading' ? 'Writing Review Workspace' : 'Email Builder'} 
        horizontalLayout={true}
        disclaimer={activeTab === 'proofreading' ? "Note: This tool supports writing improvement and review, not final authorship. Always follow your academic or professional guidelines and seek human review when required." : undefined}
      />
      
      {/* Tab Navigation */}
      <div className="max-w-[1920px] mx-auto px-4 pt-4">
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
      
      <div className="max-w-[1920px] mx-auto px-4 pb-6">
        {activeTab === 'proofreading' ? (
          <div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
            {/* LEFT COLUMN: Project List */}
          <div className="col-span-3 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800/60 overflow-hidden">
            <div className="p-4 border-b border-slate-800/60">
              <h2 className="text-lg font-semibold text-slate-50 mb-3">Projects</h2>
              
              {/* New Project Button - Always Visible */}
              <button
                onClick={() => setShowNewProjectForm(!showNewProjectForm)}
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
              {projects.map((project) => (
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
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No projects yet. Create one to get started.
                </div>
              )}
            </div>
          </div>

          {/* CENTER COLUMN: Document Editor */}
          <div className="col-span-6 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800/60 overflow-hidden min-h-0">
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

            {/* Editor Area - Always show when project is selected */}
            {activeProjectId ? (
              <div className="flex-1 min-h-0 flex flex-col">
                {isLoadingDocument ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                ) : (
                  <div className="flex-1 relative min-h-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Highlight Overlay - Always render to maintain layout */}
                    <div
                      ref={overlayRef}
                      className="pf-overlay absolute inset-0 p-6 md:p-8 bg-white pointer-events-none overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: highlightedMarkup || '' }}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        color: '#111827',
                        wordBreak: 'break-word',
                      }}
                    />
                    {/* Textarea - Above overlay, transparent text with text-shadow for visibility */}
                    <textarea
                      ref={textareaRef}
                      value={activePageContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onScroll={handleScroll}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text')
                        handleContentChange(activePageContent + pastedText)
                      }}
                      placeholder="Enter your text here... (Document will be created automatically)"
                      className="pf-textarea absolute inset-0 w-full h-full p-6 md:p-8 bg-transparent resize-none outline-none text-sm md:text-base leading-relaxed overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words placeholder:text-gray-400"
                      style={{ 
                        caretColor: '#111827',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        color: 'transparent',
                        textShadow: '0 0 0 #111827', // Show black text via shadow while keeping text transparent for overlay
                        wordBreak: 'break-word',
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
          <div className="col-span-3 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800/60 overflow-hidden">
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-violet-300 capitalize">{issue.type}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            issue.severity === 'high' ? "bg-red-900/50 text-red-300" :
                            issue.severity === 'moderate' ? "bg-yellow-900/50 text-yellow-300" :
                            "bg-blue-900/50 text-blue-300"
                          )}>
                            {issue.severity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mb-1">{issue.message}</div>
                        <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-1 rounded mb-1">
                          {issue.original_text || activePageContent.substring(issue.start_index, issue.end_index)}
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
                          onClick={() => applyIssue(issue)}
                          className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Apply
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
      <div className="col-span-3 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800/60 overflow-hidden">
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
      <div className="col-span-6 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800/60 overflow-hidden">
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
      <div className="col-span-3 flex flex-col bg-slate-900/80 rounded-xl border border-slate-800/60 overflow-hidden">
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-violet-300 capitalize">{issue.type}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          issue.severity === 'high' ? "bg-red-900/50 text-red-300" :
                          issue.severity === 'moderate' ? "bg-yellow-900/50 text-yellow-300" :
                          "bg-blue-900/50 text-blue-300"
                        )}>
                          {issue.severity}
                        </span>
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
                        onClick={() => {
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
                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition flex items-center justify-center gap-1"
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

