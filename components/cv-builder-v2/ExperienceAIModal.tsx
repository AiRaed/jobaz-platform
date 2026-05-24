'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { getAiApiErrorMessage } from '@/lib/ai-client-errors'

export type ExperienceAIMode = 'responsibilities' | 'achievements' | 'both'

interface ExperienceAIModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (result: { responsibilities?: string[]; achievements?: string[] }) => void
  jobTitle: string
  company?: string
  industry?: string
}

export default function ExperienceAIModal({
  isOpen,
  onClose,
  onApply,
  jobTitle,
  company,
  industry,
}: ExperienceAIModalProps) {
  const [mode, setMode] = useState<ExperienceAIMode>('both')
  const [userNotes, setUserNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      setError('Job title is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cv/experience-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobTitle.trim(),
          company: company?.trim() || undefined,
          industry: industry?.trim() || undefined,
          userNotes: userNotes.trim() || undefined,
          mode,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        const err = new Error(getAiApiErrorMessage(data, 'AI request failed')) as Error & {
          code?: string
        }
        err.code = data.code
        throw err
      }

      // Apply the result and close modal
      onApply({
        responsibilities: data.responsibilities,
        achievements: data.achievements,
      })
      
      // Reset form
      setUserNotes('')
      setMode('both')
      setError(null)
      onClose()
    } catch (err: any) {
      console.error('AI generation error:', err)
      setError(err.message || 'AI request failed, please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setUserNotes('')
    setError(null)
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-950/95 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Let AI help with your bullet points
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Based on your job title, I'll suggest responsibilities and achievements.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              What would you like to generate?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-800/50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="both"
                  checked={mode === 'both'}
                  onChange={(e) => setMode(e.target.value as ExperienceAIMode)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 focus:ring-violet-500"
                  disabled={loading}
                />
                <span className="text-sm text-slate-200">Both</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-800/50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="responsibilities"
                  checked={mode === 'responsibilities'}
                  onChange={(e) => setMode(e.target.value as ExperienceAIMode)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 focus:ring-violet-500"
                  disabled={loading}
                />
                <span className="text-sm text-slate-200">Responsibilities</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-800/50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="achievements"
                  checked={mode === 'achievements'}
                  onChange={(e) => setMode(e.target.value as ExperienceAIMode)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 focus:ring-violet-500"
                  disabled={loading}
                />
                <span className="text-sm text-slate-200">Achievements</span>
              </label>
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Tell me briefly what you did in this job (optional)
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g., I worked in a busy kitchen, helping with food prep and cleaning..."
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm min-h-[80px] resize-y"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="space-y-2">
            <button
              onClick={handleGenerate}
              disabled={loading || !jobTitle.trim()}
              className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              You can edit or remove any bullet points after they're added.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

