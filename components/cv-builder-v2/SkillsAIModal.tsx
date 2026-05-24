'use client'

import { useState, useEffect } from 'react'
import { getAiApiErrorMessage } from '@/lib/ai-client-errors'
import { createPortal } from 'react-dom'
import { X, Sparkles, Loader2 } from 'lucide-react'

export type SkillsAIMode = 'hard' | 'soft' | 'both'

interface SkillsAIModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (skills: string[]) => void
  targetRole?: string
  summaryText?: string
  experiencePreview?: string
}

export default function SkillsAIModal({
  isOpen,
  onClose,
  onApply,
  targetRole,
  summaryText,
  experiencePreview,
}: SkillsAIModalProps) {
  // All hooks FIRST, unconditionally:
  const [mode, setMode] = useState<SkillsAIMode>('both')
  const [userNotes, setUserNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle escape key - must be before early return
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        setUserNotes('')
        setError(null)
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, loading, onClose])

  // After ALL hooks, we can conditionally render:
  if (!isOpen || !mounted) return null

  const handleGenerate = async () => {
    // Check if we have at least some context
    if (!targetRole?.trim() && !summaryText?.trim() && !experiencePreview?.trim() && !userNotes.trim()) {
      setError('Please provide at least a target role, summary, experience, or additional context')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/cv/skills-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          targetRole: targetRole?.trim() || undefined,
          summaryText: summaryText?.trim() || undefined,
          experiencePreview: experiencePreview?.trim() || undefined,
          userNotes: userNotes.trim() || undefined,
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
      if (data.skills && Array.isArray(data.skills)) {
        onApply(data.skills)
      }
      
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

  const modalContent = (
    <div 
      className="
        fixed inset-0 
        bg-black/50 
        backdrop-blur-sm 
        z-[100] 
        flex items-center justify-center
      "
      onClick={handleClose}
    >
      <div 
        className="
          w-full 
          max-w-[480px] 
          bg-slate-900 
          border border-slate-700/60 
          rounded-2xl 
          p-6 
          shadow-[0_0_25px_rgba(139,92,246,0.4)]
          max-h-[80vh] 
          overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Generate skills with AI
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
            Based on your role, summary, and experience, I'll suggest relevant skills.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Skill Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-800/50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="both"
                  checked={mode === 'both'}
                  onChange={(e) => setMode(e.target.value as SkillsAIMode)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 focus:ring-violet-500"
                  disabled={loading}
                />
                <span className="text-sm text-slate-200">Both (Hard & Soft)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-800/50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="hard"
                  checked={mode === 'hard'}
                  onChange={(e) => setMode(e.target.value as SkillsAIMode)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 focus:ring-violet-500"
                  disabled={loading}
                />
                <span className="text-sm text-slate-200">Hard Skills Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-800/50 transition">
                <input
                  type="radio"
                  name="mode"
                  value="soft"
                  checked={mode === 'soft'}
                  onChange={(e) => setMode(e.target.value as SkillsAIMode)}
                  className="w-4 h-4 text-violet-600 bg-slate-800 border-slate-600 focus:ring-violet-500"
                  disabled={loading}
                />
                <span className="text-sm text-slate-200">Soft Skills Only</span>
              </label>
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Additional Context (optional)
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g., I specialize in frontend development with React and TypeScript..."
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
        </div>

        {/* Footer - Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || (!targetRole?.trim() && !summaryText?.trim() && !experiencePreview?.trim() && !userNotes.trim())}
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white border border-violet-400/70 shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:bg-violet-500 hover:border-violet-300 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate skills with AI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

