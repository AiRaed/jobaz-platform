'use client'

import { useState, useEffect } from 'react'
import { Loader2, ChevronDown, ChevronUp, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { CvData } from '@/app/cv-builder-v2/page'

interface CvReviewCardProps {
  cvData: CvData
}

interface ReviewResult {
  ok: boolean
  score?: number
  level?: 'Strong' | 'Good' | 'Needs Improvement'
  topFixes?: string[]
  notes?: string[]
  error?: string
}

interface GrammarResult {
  ok: boolean
  issuesCount?: number
  issues?: Array<{
    field: string
    snippet: string
    suggestion: string
  }>
  error?: string
}

export default function CvReviewCard({ cvData }: CvReviewCardProps) {
  const [reviewLoading, setReviewLoading] = useState(false)
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null)
  const [showReviewDetails, setShowReviewDetails] = useState(false)
  const [showGrammarDetails, setShowGrammarDetails] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [cvReviewTimestamp, setCvReviewTimestamp] = useState<Date | null>(null)
  const [grammarTimestamp, setGrammarTimestamp] = useState<Date | null>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const handleCvCheck = async () => {
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
      setCvReviewTimestamp(new Date())
      if (data.ok) {
        setShowReviewDetails(true)
      }
    } catch (error: any) {
      setReviewResult({ ok: false, error: error.message || 'Failed to check CV' })
      setCvReviewTimestamp(new Date())
    } finally {
      setReviewLoading(false)
    }
  }

  const handleGrammarCheck = async () => {
    setGrammarLoading(true)
    setGrammarResult(null)
    try {
      const response = await fetch('/api/cv/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      })
      const data = await response.json()
      setGrammarResult(data)
      setGrammarTimestamp(new Date())
      if (data.ok && data.issuesCount > 0) {
        setShowGrammarDetails(true)
      }
    } catch (error: any) {
      setGrammarResult({ ok: false, error: error.message || 'Failed to check grammar' })
      setGrammarTimestamp(new Date())
    } finally {
      setGrammarLoading(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  if (isAuthenticated === false) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">AI CV Review</h3>
        <p className="text-xs text-slate-400">Please sign in to use CV review features.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">AI CV Review</h3>
      
      {/* Hint text */}
      {!reviewResult && !grammarResult && (
        <p className="text-xs text-slate-400 mb-4">Run a CV check to get your score and top fixes.</p>
      )}
      
      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleCvCheck}
          disabled={reviewLoading || grammarLoading}
          className={cn(
            'flex-1 min-w-[140px] px-3 py-1.5 text-xs font-medium rounded border transition',
            'border-violet-500/60 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5'
          )}
        >
          {reviewLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : null}
          CV Check (AI)
        </button>
        <button
          onClick={handleGrammarCheck}
          disabled={reviewLoading || grammarLoading}
          className={cn(
            'flex-1 min-w-[140px] px-3 py-1.5 text-xs font-medium rounded border transition',
            'border-slate-600/60 text-slate-300 bg-slate-800/40 hover:bg-slate-700/40',
            'disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5'
          )}
        >
          {grammarLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : null}
          Grammar & Spelling
        </button>
      </div>

      {/* CV Check Results */}
      {reviewResult && (
        <div className="mb-4 pb-4 border-b border-slate-700/60">
          {reviewResult.ok && reviewResult.score !== undefined ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Score:</span>
                <span className={cn(
                  'text-sm font-semibold',
                  reviewResult.score >= 80 ? 'text-green-400' : reviewResult.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {reviewResult.score}/100
                </span>
              </div>
              {reviewResult.level && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Level:</span>
                  <span className={cn(
                    'text-xs font-medium',
                    reviewResult.level === 'Strong' ? 'text-green-400' : reviewResult.level === 'Good' ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {reviewResult.level}
                  </span>
                </div>
              )}
              {reviewResult.topFixes && reviewResult.topFixes.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Top Fixes:</div>
                  <ul className="space-y-1.5 pl-4">
                    {reviewResult.topFixes.slice(0, 5).map((fix, idx) => (
                      <li key={idx} className="text-xs text-slate-300 list-disc">{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
              {reviewResult.notes && reviewResult.notes.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowReviewDetails(!showReviewDetails)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition mb-2"
                  >
                    Issues Found ({reviewResult.notes.length})
                    {showReviewDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showReviewDetails && (
                    <ul className="space-y-1.5 pl-4">
                      {reviewResult.notes.map((note, idx) => (
                        <li key={idx} className="text-xs text-slate-300 list-disc">{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {cvReviewTimestamp && (
                <div className="text-xs text-slate-500 mt-2">
                  Last checked: {formatTimeAgo(cvReviewTimestamp)}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-red-400">
                <X className="w-3 h-3" />
                <span>{reviewResult.error || 'Check failed'}</span>
              </div>
              {cvReviewTimestamp && (
                <div className="text-xs text-slate-500">
                  Last checked: {formatTimeAgo(cvReviewTimestamp)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grammar Results */}
      {grammarResult && (
        <div>
          {grammarResult.ok && grammarResult.issuesCount !== undefined ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Grammar & Spelling:</span>
                <span className={cn(
                  'text-sm font-semibold',
                  grammarResult.issuesCount === 0 ? 'text-green-400' : 'text-yellow-400'
                )}>
                  {grammarResult.issuesCount === 0 ? 'No issues found' : `${grammarResult.issuesCount} issue${grammarResult.issuesCount > 1 ? 's' : ''} detected`}
                </span>
              </div>
              {grammarResult.issuesCount > 0 && grammarResult.issues && grammarResult.issues.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowGrammarDetails(!showGrammarDetails)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition mb-2"
                  >
                    View Issues ({grammarResult.issues.length})
                    {showGrammarDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showGrammarDetails && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {grammarResult.issues.map((issue, idx) => (
                        <div key={idx} className="p-2 rounded border border-slate-700/60 bg-slate-900/40">
                          <div className="text-xs font-medium text-slate-300 mb-1">{issue.field}</div>
                          <div className="text-xs text-slate-400 mb-1">"{issue.snippet}"</div>
                          <div className="text-xs text-violet-300">→ {issue.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {grammarResult.issuesCount === 0 && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>No issues found</span>
                </div>
              )}
              {grammarTimestamp && (
                <div className="text-xs text-slate-500 mt-2">
                  Last checked: {formatTimeAgo(grammarTimestamp)}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-red-400">
                <X className="w-3 h-3" />
                <span>{grammarResult.error || 'Check failed'}</span>
              </div>
              {grammarTimestamp && (
                <div className="text-xs text-slate-500">
                  Last checked: {formatTimeAgo(grammarTimestamp)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

