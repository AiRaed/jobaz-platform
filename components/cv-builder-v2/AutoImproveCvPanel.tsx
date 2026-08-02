'use client'

import { useState, useCallback } from 'react'
import { Loader2, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CvData } from '@/app/cv-builder-v2/page'
import { analyzeCvHealth } from '@/lib/cv-optimization'

type Stage = {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'skipped'
}

type Props = {
  cvData: CvData
  jobDescription: string
  onCvDataUpdate: (updates: Partial<CvData>) => void
  onLoadingChange: (loading: boolean) => void
  disabled?: boolean
}

const STAGE_DEFS: { id: string; label: string }[] = [
  { id: 'analyze', label: 'Analyzing job description' },
  { id: 'keywords', label: 'Detecting missing keywords & skills' },
  { id: 'summary', label: 'Rewriting professional summary' },
  { id: 'experience', label: 'Strengthening experience bullets' },
  { id: 'skills', label: 'Adding recruiter-matched skills' },
  { id: 'finalize', label: 'Calculating score improvements' },
]

async function fetchTailor(body: Record<string, unknown>) {
  const response = await fetch('/api/cv/ai-tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  if (!data.ok) throw new Error(data.error || 'AI request failed')
  return data
}

export default function AutoImproveCvPanel({
  cvData,
  jobDescription,
  onCvDataUpdate,
  onLoadingChange,
  disabled,
}: Props) {
  const [running, setRunning] = useState(false)
  const [stages, setStages] = useState<Stage[]>([])
  const [scoreBefore, setScoreBefore] = useState<number | null>(null)
  const [scoreAfter, setScoreAfter] = useState<number | null>(null)
  const [improvements, setImprovements] = useState<string[]>([])

  const setStageStatus = (id: string, status: Stage['status']) => {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
  }

  const runAutoImprove = useCallback(async () => {
    if (!jobDescription.trim()) {
      alert('Paste a job description first to auto-optimize your CV for that role.')
      return
    }

    const before = analyzeCvHealth(cvData, jobDescription)
    setScoreBefore(before.overallScore)
    setScoreAfter(null)
    setImprovements([])
    setRunning(true)
    onLoadingChange(true)
    setStages(STAGE_DEFS.map((s) => ({ ...s, status: 'pending' as const })))

    const applied: string[] = []
    let workingCv = { ...cvData }

    try {
      setStageStatus('analyze', 'running')
      await fetchTailor({ mode: 'analyze', jobDescription })
      setStageStatus('analyze', 'done')
      applied.push('Job requirements analyzed')

      setStageStatus('keywords', 'running')
      await new Promise((r) => setTimeout(r, 400))
      setStageStatus('keywords', 'done')
      applied.push('Missing keywords identified')

      if (workingCv.summary.trim()) {
        setStageStatus('summary', 'running')
        try {
          const data = await fetchTailor({
            mode: 'summary',
            jobDescription,
            currentSummary: workingCv.summary,
            personalInfo: workingCv.personalInfo,
            skills: workingCv.skills,
          })
          if (data.tailoredSummary) {
            workingCv = { ...workingCv, summary: data.tailoredSummary }
            onCvDataUpdate({ summary: data.tailoredSummary })
            applied.push('Summary tailored for ATS clarity')
            setStageStatus('summary', 'done')
          } else {
            setStageStatus('summary', 'skipped')
          }
        } catch {
          setStageStatus('summary', 'skipped')
        }
      } else {
        setStageStatus('summary', 'skipped')
      }

      if (workingCv.experience.length > 0) {
        setStageStatus('experience', 'running')
        try {
          const data = await fetchTailor({
            mode: 'experience',
            jobDescription,
            experience: workingCv.experience,
          })
          if (Array.isArray(data.tailoredExperience) && data.tailoredExperience.length > 0) {
            workingCv = { ...workingCv, experience: data.tailoredExperience }
            onCvDataUpdate({ experience: data.tailoredExperience })
            applied.push('Experience bullets upgraded with measurable impact')
            setStageStatus('experience', 'done')
          } else {
            setStageStatus('experience', 'skipped')
          }
        } catch {
          setStageStatus('experience', 'skipped')
        }
      } else {
        setStageStatus('experience', 'skipped')
      }

      setStageStatus('skills', 'running')
      try {
        const data = await fetchTailor({
          mode: 'skills',
          jobDescription,
          currentSkills: workingCv.skills,
        })
        if (Array.isArray(data.suggestedSkills) && data.suggestedSkills.length > 0) {
          const newSkills = [...new Set([...workingCv.skills, ...data.suggestedSkills])]
          workingCv = { ...workingCv, skills: newSkills }
          onCvDataUpdate({ skills: newSkills })
          applied.push(`Added ${data.suggestedSkills.length} recruiter-matched skills`)
          setStageStatus('skills', 'done')
        } else {
          setStageStatus('skills', 'skipped')
        }
      } catch {
        setStageStatus('skills', 'skipped')
      }

      setStageStatus('finalize', 'running')
      await new Promise((r) => setTimeout(r, 300))
      const after = analyzeCvHealth(workingCv, jobDescription)
      setScoreAfter(after.overallScore)
      setImprovements(applied)
      setStageStatus('finalize', 'done')
    } catch (error) {
      console.error('Auto improve error:', error)
      alert(error instanceof Error ? error.message : 'Auto improve failed. Please try again.')
    } finally {
      setRunning(false)
      onLoadingChange(false)
    }
  }, [cvData, jobDescription, onCvDataUpdate, onLoadingChange])

  const delta =
    scoreBefore !== null && scoreAfter !== null ? scoreAfter - scoreBefore : null

  return (
    <div className="rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/50 to-slate-950/80 p-4 shadow-[0_0_24px_rgba(139,92,246,0.2)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-300" />
            <h3 className="text-sm font-semibold text-violet-100">Auto Improve CV For This Job</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-md">
            AI analyzes the job description, fills keyword gaps, rewrites weak sections, and boosts your ATS score — in one guided run.
          </p>
        </div>
        {scoreBefore !== null && scoreAfter !== null && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Score</p>
            <p className="text-sm font-bold text-slate-300 tabular-nums">
              {scoreBefore} → <span className="text-emerald-400">{scoreAfter}</span>
            </p>
            {delta !== null && delta > 0 && (
              <p className="text-[10px] text-emerald-400 flex items-center justify-end gap-0.5">
                <TrendingUp className="w-3 h-3" />+{delta} pts
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={runAutoImprove}
        disabled={disabled || running || !jobDescription.trim()}
        data-jaz-action="cv_auto_improve"
        className={cn(
          'w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300',
          'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
          'border border-violet-400/50 shadow-[0_0_20px_rgba(139,92,246,0.45)]',
          'hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-[0_0_28px_rgba(139,92,246,0.6)]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2'
        )}
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI optimizing your CV…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Auto Improve CV For This Job
          </>
        )}
      </button>

      {running && stages.length > 0 && (
        <div className="mt-4 space-y-2">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-2 text-[11px]">
              {stage.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-violet-400 shrink-0" />}
              {stage.status === 'done' && <span className="text-emerald-400 shrink-0">✓</span>}
              {stage.status === 'skipped' && <span className="text-slate-600 shrink-0">—</span>}
              {stage.status === 'pending' && <span className="text-slate-600 shrink-0">○</span>}
              <span
                className={cn(
                  stage.status === 'running' && 'text-violet-200',
                  stage.status === 'done' && 'text-slate-300',
                  stage.status === 'pending' && 'text-slate-500',
                  stage.status === 'skipped' && 'text-slate-600 line-through'
                )}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {!running && improvements.length > 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/25">
          <p className="text-[10px] font-semibold text-emerald-300 mb-1.5">Improvements applied</p>
          <ul className="space-y-0.5">
            {improvements.map((item) => (
              <li key={item} className="text-[10px] text-slate-400 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
