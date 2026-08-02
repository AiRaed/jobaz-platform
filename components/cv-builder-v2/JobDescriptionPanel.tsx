import { useState } from 'react'
import { Sparkles, Loader2, Target, FileText, FileEdit } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'
import type { CvAiButtonHint } from '@/lib/cv-optimization'
import AutoImproveCvPanel from '@/components/cv-builder-v2/AutoImproveCvPanel'

interface JobDescriptionPanelProps {
  cvData: CvData
  onCvDataUpdate: (updates: Partial<CvData>) => void
  onLoadingChange: (loading: boolean) => void
  onJobDescriptionChange?: (jobDescription: string) => void
  aiHints?: CvAiButtonHint[]
  onFixGrammar?: () => void
  grammarLoading?: boolean
}

function hintFor(id: CvAiButtonHint['id'], hints?: CvAiButtonHint[]) {
  return hints?.find((h) => h.id === id)
}

function SmartButton({
  onClick,
  disabled,
  loading,
  icon: Icon,
  hint,
  action,
  fallbackLabel,
}: {
  onClick: () => void
  disabled: boolean
  loading: boolean
  icon: typeof Sparkles
  hint?: CvAiButtonHint
  action: string
  fallbackLabel: string
}) {
  const label = hint?.label ?? fallbackLabel
  const impact = hint?.impactLabel

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-jaz-action={action}
      title={impact ? `${label} — estimated ${impact}` : label}
      className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 min-h-[52px]"
    >
      <span className="flex items-center gap-1.5">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {label}
      </span>
      {impact && !loading && (
        <span className="text-[9px] text-emerald-400/90 font-normal text-center leading-tight line-clamp-2 max-w-[140px]">
          {impact}
        </span>
      )}
    </button>
  )
}

export default function JobDescriptionPanel({
  cvData,
  onCvDataUpdate,
  onLoadingChange,
  onJobDescriptionChange,
  aiHints,
  onFixGrammar,
  grammarLoading,
}: JobDescriptionPanelProps) {
  const [jobDescription, setJobDescription] = useState('')

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

  const setBusy = (key: string | null) => {
    setLoading(key)
    onLoadingChange(key !== null)
  }

  const handleAnalyzeJD = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first')
      return
    }

    setBusy('analyze')

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'analyze', jobDescription }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (data.ok && data.analysis) {
        setJdAnalysis(data.analysis)
      } else {
        throw new Error(data.error || 'Failed to analyze job description')
      }
    } catch (error: unknown) {
      console.error('JD analysis error:', error)
      alert(error instanceof Error ? error.message : 'Failed to analyze job description. Please try again.')
    } finally {
      setBusy(null)
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

    setBusy('summary')

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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (data.ok && data.tailoredSummary) {
        onCvDataUpdate({ summary: data.tailoredSummary })
      } else {
        throw new Error(data.error || 'Failed to tailor summary')
      }
    } catch (error: unknown) {
      console.error('Tailor summary error:', error)
      alert(error instanceof Error ? error.message : 'Failed to tailor summary. Please try again.')
    } finally {
      setBusy(null)
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

    setBusy('experience')

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'experience', jobDescription, experience: cvData.experience }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (data.ok && data.tailoredExperience) {
        if (Array.isArray(data.tailoredExperience) && data.tailoredExperience.length > 0) {
          onCvDataUpdate({ experience: data.tailoredExperience })
        } else {
          throw new Error('Invalid experience data received from server')
        }
      } else {
        throw new Error(data.error || 'Failed to tailor experience')
      }
    } catch (error: unknown) {
      console.error('Tailor experience error:', error)
      alert(error instanceof Error ? error.message : 'Failed to tailor experience. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const handleSuggestSkills = async () => {
    if (!jobDescription.trim()) {
      alert('Please paste a job description first')
      return
    }

    setBusy('skills')

    try {
      const response = await fetch('/api/cv/ai-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'skills', jobDescription, currentSkills: cvData.skills }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      if (data.ok && data.suggestedSkills) {
        if (Array.isArray(data.suggestedSkills) && data.suggestedSkills.length > 0) {
          const message = `Suggested skills to add:\n\n${data.suggestedSkills.join('\n')}\n\nWould you like to add these to your skills list?`
          if (confirm(message)) {
            const newSkills = [...new Set([...cvData.skills, ...data.suggestedSkills])]
            onCvDataUpdate({ skills: newSkills })
          }
        } else {
          alert('No new skills suggested. Your current skills may already cover the job requirements.')
        }
      } else {
        throw new Error(data.error || 'Failed to suggest skills')
      }
    } catch (error: unknown) {
      console.error('Suggest skills error:', error)
      alert(error instanceof Error ? error.message : 'Failed to suggest skills. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const isBusy = loading !== null || Boolean(grammarLoading)

  return (
    <div className="space-y-3">
      <AutoImproveCvPanel
        cvData={cvData}
        jobDescription={jobDescription}
        onCvDataUpdate={onCvDataUpdate}
        onLoadingChange={onLoadingChange}
        disabled={isBusy}
      />

      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">Job Description & AI Tailoring</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => handleJobDescriptionChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y text-sm"
              placeholder="Paste the job description here so we can tailor your CV to this role..."
            />
            <p className="mt-1 text-xs text-slate-500">
              Paste a job description to unlock ATS optimization and smart AI actions
            </p>
          </div>

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

          <div className="grid grid-cols-2 gap-2">
            <SmartButton
              onClick={handleAnalyzeJD}
              disabled={isBusy || !jobDescription.trim()}
              loading={loading === 'analyze'}
              icon={FileText}
              hint={hintFor('analyze', aiHints)}
              action="cv_analyze_jd"
              fallbackLabel="Analyze JD"
            />
            <SmartButton
              onClick={handleTailorSummary}
              disabled={isBusy || !jobDescription.trim() || !cvData.summary.trim()}
              loading={loading === 'summary'}
              icon={Sparkles}
              hint={hintFor('summary', aiHints)}
              action="cv_tailor_summary"
              fallbackLabel="Improve Summary"
            />
            <SmartButton
              onClick={handleTailorExperience}
              disabled={isBusy || !jobDescription.trim() || cvData.experience.length === 0}
              loading={loading === 'experience'}
              icon={Target}
              hint={hintFor('experience', aiHints)}
              action="cv_tailor_experience"
              fallbackLabel="Tailor Experience"
            />
            <SmartButton
              onClick={handleSuggestSkills}
              disabled={isBusy || !jobDescription.trim()}
              loading={loading === 'skills'}
              icon={Sparkles}
              hint={hintFor('skills', aiHints)}
              action="cv_suggest_skills"
              fallbackLabel="Suggest Skills"
            />
            {onFixGrammar && (
              <SmartButton
                onClick={onFixGrammar}
                disabled={isBusy}
                loading={Boolean(grammarLoading)}
                icon={FileEdit}
                hint={hintFor('grammar', aiHints)}
                action="cv_fix_grammar"
                fallbackLabel="Fix Grammar"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
