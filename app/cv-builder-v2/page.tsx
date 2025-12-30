'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Download, FileText, Sparkles, Loader2, Undo2, CheckCircle2, X, Briefcase, Save } from 'lucide-react'
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
import TemplatePicker from '@/components/cv-builder-v2/TemplatePicker'
import JobDescriptionPanel from '@/components/cv-builder-v2/JobDescriptionPanel'
import PageHeader from '@/components/PageHeader'
import { useJazContext } from '@/contexts/JazContextContext'
import type { CvBuilderContext } from '@/components/JazAssistant'
import { getUserScopedKeySync, getCurrentUserIdSync, initUserStorageCache } from '@/lib/user-storage'

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
}

type Tab = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'more'

const STORAGE_KEY = 'jobaz-cv-v2-draft'

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
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
  })

  // Compute JAZ context for CV Builder
  const jazContext = useMemo<CvBuilderContext>(() => {
    // Count words in summary (approximate)
    const summaryTextLength = cvData.summary.trim().split(/\s+/).filter(Boolean).length
    
    return {
      page: 'cv-builder',
      activeTab,
      atsScore: null, // Not available yet, can be added later
      summaryTextLength,
      experienceCount: cvData.experience.length,
      skillsCount: cvData.skills.length,
      hasJobDescription: jobDescription.trim().length > 0,
      template: selectedTemplate,
    }
  }, [activeTab, cvData.summary, cvData.experience.length, cvData.skills.length, jobDescription, selectedTemplate])

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
              setCvData({
                personalInfo: foundCv.personalInfo && typeof foundCv.personalInfo === 'object'
                  ? { ...defaultPersonalInfo, ...foundCv.personalInfo }
                  : defaultPersonalInfo,
                summary: foundCv.summary || '',
                experience: Array.isArray(foundCv.experience) ? foundCv.experience : [],
                education: Array.isArray(foundCv.education) ? foundCv.education : [],
                skills: Array.isArray(foundCv.skills) ? foundCv.skills : [],
                projects: Array.isArray(foundCv.projects) ? foundCv.projects : [],
                languages: Array.isArray(foundCv.languages) ? foundCv.languages : [],
                certifications: Array.isArray(foundCv.certifications) ? foundCv.certifications : [],
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
          setCvData({
            ...parsed,
            personalInfo: parsed.personalInfo && typeof parsed.personalInfo === 'object'
              ? { ...defaultPersonalInfo, ...parsed.personalInfo }
              : defaultPersonalInfo,
            experience: Array.isArray(parsed.experience) ? parsed.experience : [],
            education: Array.isArray(parsed.education) ? parsed.education : [],
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

        // Experience
        const experienceContent = cvData.experience.map((exp) => {
          const parts = [`${exp.jobTitle} at ${exp.company}`]
          if (exp.location) parts.push(exp.location)
          if (exp.startDate || exp.endDate) {
            const period = exp.isCurrent
              ? `${exp.startDate} - Present`
              : `${exp.startDate || ''} - ${exp.endDate || ''}`
            parts.push(period)
          }
          if (exp.bullets.length > 0) {
            parts.push('', ...exp.bullets)
          }
          return parts.join('\n')
        })
        if (experienceContent.length > 0) {
          sections.push({ title: 'Experience', content: experienceContent })
        }

        // Education
        const educationContent = cvData.education.map((edu) => {
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
          <button
            onClick={handleSaveCvToDashboard}
            className="rounded-full bg-slate-900/80 px-4 py-2 text-xs md:text-sm font-medium text-slate-100 border border-slate-600/70 hover:border-violet-400/60 hover:text-violet-100 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save this CV to Dashboard
          </button>
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
          <div className="space-y-6">
            {/* Template Picker */}
            <TemplatePicker selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} />

            {/* Export buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading.export}
                  className="flex-1 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.export ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download PDF
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  disabled={loading.export}
                  className="flex-1 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.export ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Download DOCX
                </button>
              </div>
            </div>

            {/* A4 Preview - Miniature PDF Preview */}
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-6 flex items-center justify-center min-h-[600px]">
              <div className="mx-auto aspect-[1/1.414] w-full max-w-[460px] bg-white text-slate-900 shadow-lg overflow-hidden rounded-md">
                <div
                  id="cv-preview"
                  ref={previewRef}
                  className="p-8 h-full overflow-y-auto"
                >
                  <CvPreview data={cvData} template={selectedTemplate} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

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

