import { useState } from 'react'
import { Sparkles, Loader2, Target, FileText, AlertCircle } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'
import { getAiApiErrorMessage, handleAiClientError } from '@/lib/ai-client-errors'

interface JobDescriptionPanelProps {
  cvData: CvData
  onCvDataUpdate: (updates: Partial<CvData>) => void
  onLoadingChange: (loading: boolean) => void
  onJobDescriptionChange?: (jobDescription: string) => void
}

export default function JobDescriptionPanel({
  cvData,
  onCvDataUpdate,
  onLoadingChange,
  onJobDescriptionChange,
}: JobDescriptionPanelProps) {
  const [jobDescription, setJobDescription] = useState('')
  
  // Notify parent of job description changes
  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value)
    onJobDescriptionChange?.(value)
  }
  const [loading, setLoading] = useState<string | null>(null)
  const [jdAnalysis, setJdAnalysis] = useState<{
    keySkills: string[]
    keywords: string[]
    jobLevel: string
  } | null>(null)
  const [aiServiceError, setAiServiceError] = useState<string>('')

  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first')
      return
    }

    setLoading('analyze')
    onLoadingChange(true)

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze',
          jobDescription,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.ok && data.analysis) {
        setJdAnalysis(data.analysis)
      } else {
        const err = new Error(
          getAiApiErrorMessage(data, 'Failed to analyze job description')
        ) as Error & { code?: string }
        err.code = data.code
        throw err
      }
    } catch (error: unknown) {
      console.error('JD analysis error:', error)
      handleAiClientError(error, setAiServiceError, (msg) =>
        alert(msg || 'Failed to analyze job description. Please try again.')
      )
    } finally {
      setLoading(null)
      onLoadingChange(false)
    }
  }

  const handleTailorSummary = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first')
      return
    }
    if (!cvData.summary.trim()) {
      alert('Please add a summary first')
      return
    }

    setLoading('summary')
    onLoadingChange(true)

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summary',
          jobDescription,
          currentSummary: cvData.summary,
          personalInfo: cvData.personalInfo,
          skills: cvData.skills,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.ok && data.tailoredSummary) {
        onCvDataUpdate({ summary: data.tailoredSummary })
      } else {
        const err = new Error(getAiApiErrorMessage(data, 'Failed to tailor summary')) as Error & {
          code?: string
        }
        err.code = data.code
        throw err
      }
    } catch (error: unknown) {
      console.error('Tailor summary error:', error)
      handleAiClientError(error, setAiServiceError, (msg) =>
        alert(msg || 'Failed to tailor summary. Please try again.')
      )
    } finally {
      setLoading(null)
      onLoadingChange(false)
    }
  }

  const handleTailorExperience = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first')
      return
    }
    if (cvData.experience.length === 0) {
      alert('Please add experience entries first')
      return
    }

    setLoading('experience')
    onLoadingChange(true)

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'experience',
          jobDescription,
          experience: cvData.experience,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.ok && data.tailoredExperience) {
        // Validate that tailoredExperience is an array
        if (Array.isArray(data.tailoredExperience) && data.tailoredExperience.length > 0) {
          onCvDataUpdate({ experience: data.tailoredExperience })
        } else {
          throw new Error('Invalid experience data received from server')
        }
      } else {
        const err = new Error(getAiApiErrorMessage(data, 'Failed to tailor experience')) as Error & {
          code?: string
        }
        err.code = data.code
        throw err
      }
    } catch (error: unknown) {
      console.error('Tailor experience error:', error)
      handleAiClientError(error, setAiServiceError, (msg) =>
        alert(msg || 'Failed to tailor experience. Please try again.')
      )
    } finally {
      setLoading(null)
      onLoadingChange(false)
    }
  }

  const handleSuggestSkills = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first')
      return
    }

    setLoading('skills')
    onLoadingChange(true)

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'skills',
          jobDescription,
          currentSkills: cvData.skills,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.ok && data.suggestedSkills) {
        // Validate that suggestedSkills is an array
        if (Array.isArray(data.suggestedSkills) && data.suggestedSkills.length > 0) {
          // Show suggestions in a confirm dialog
          const message = `Suggested skills to add:\n\n${data.suggestedSkills.join('\n')}\n\nWould you like to add these to your skills list?`
          if (confirm(message)) {
            const newSkills = [...new Set([...cvData.skills, ...data.suggestedSkills])]
            onCvDataUpdate({ skills: newSkills })
          }
        } else {
          alert('No new skills suggested. Your current skills may already cover the job requirements.')
        }
      } else {
        const err = new Error(getAiApiErrorMessage(data, 'Failed to suggest skills')) as Error & {
          code?: string
        }
        err.code = data.code
        throw err
      }
    } catch (error: unknown) {
      console.error('Suggest skills error:', error)
      handleAiClientError(error, setAiServiceError, (msg) =>
        alert(msg || 'Failed to suggest skills. Please try again.')
      )
    } finally {
      setLoading(null)
      onLoadingChange(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-slate-300">Job Description & AI Tailoring</h3>
      </div>

      <div className="space-y-4">
        {aiServiceError && (
          <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-300">{aiServiceError}</span>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => handleJobDescriptionChange(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y text-sm"
            placeholder="Paste the job description here so we can tailor your CV to this role..."
          />
          <p className="mt-1 text-xs text-slate-500">Paste the job description to enable AI tailoring features</p>
        </div>

        {/* JD Analysis Results */}
        {jdAnalysis && (
          <div className="p-3 bg-violet-600/10 border border-violet-500/30 rounded-lg">
            <h4 className="text-xs font-semibold text-violet-300 mb-2">Analysis Results</h4>
            {jdAnalysis.jobLevel && (
              <div className="mb-2">
                <span className="text-xs text-slate-400">Job Level: </span>
                <span className="text-xs text-slate-200 font-medium">{jdAnalysis.jobLevel}</span>
              </div>
            )}
            {jdAnalysis.keySkills.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-slate-400">Key Skills: </span>
                <span className="text-xs text-slate-200">{jdAnalysis.keySkills.join(', ')}</span>
              </div>
            )}
            {jdAnalysis.keywords.length > 0 && (
              <div>
                <span className="text-xs text-slate-400">Keywords: </span>
                <span className="text-xs text-slate-200">{jdAnalysis.keywords.slice(0, 10).join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* AI Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAnalyzeJD}
            disabled={loading !== null || !jobDescription.trim()}
            data-jaz-action="cv_analyze_jd"
            className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading === 'analyze' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
            Analyze JD
          </button>
          <button
            onClick={handleTailorSummary}
            disabled={loading !== null || !jobDescription.trim() || !cvData.summary.trim()}
            data-jaz-action="cv_tailor_summary"
            className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading === 'summary' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Tailor Summary
          </button>
          <button
            onClick={handleTailorExperience}
            disabled={loading !== null || !jobDescription.trim() || cvData.experience.length === 0}
            data-jaz-action="cv_tailor_experience"
            className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading === 'experience' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Target className="w-3 h-3" />
            )}
            Tailor Experience
          </button>
          <button
            onClick={handleSuggestSkills}
            disabled={loading !== null || !jobDescription.trim()}
            data-jaz-action="cv_suggest_skills"
            className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {loading === 'skills' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Suggest Skills
          </button>
        </div>
      </div>
    </div>
  )
}

