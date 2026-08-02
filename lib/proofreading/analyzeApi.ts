/**
 * Client helper for POST /api/proofreading/analyze — consistent error handling.
 */

import type {
  ProofreadingAnalyzeMode,
  WritingReviewReport,
  AnalyzedIssue,
} from './types'

export type { ProofreadingAnalyzeMode, WritingReviewReport, AnalyzedIssue }

export type ProofreadingAnalyzeRequest = {
  documentId: string
  content: string
  mode: ProofreadingAnalyzeMode
  options?: Record<string, unknown>
  section?: string
  projectCategory?: string
}

export type ProofreadingAnalyzeSuccess = {
  ok: true
  issues: AnalyzedIssue[]
  review?: WritingReviewReport
  metadata?: Record<string, unknown>
  summary?: string
}

export type ProofreadingAnalyzeFailure = {
  ok: false
  error: string
  networkError?: boolean
  status?: number
}

export type ProofreadingAnalyzeResult = ProofreadingAnalyzeSuccess | ProofreadingAnalyzeFailure

const ANALYSIS_FAILED = 'Analysis failed. Please try again.'

export async function postProofreadingAnalyze(
  body: ProofreadingAnalyzeRequest
): Promise<ProofreadingAnalyzeResult> {
  try {
    const res = await fetch('/api/proofreading/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    let data: Record<string, unknown> = {}
    try {
      data = (await res.json()) as Record<string, unknown>
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Proofreading] Analyze response was not valid JSON', res.status)
      }
      return { ok: false, error: ANALYSIS_FAILED, status: res.status }
    }

    if (!res.ok || data.ok === false) {
      const message =
        (typeof data.error === 'string' && data.error) ||
        (typeof data.message === 'string' && data.message) ||
        ANALYSIS_FAILED
      if (process.env.NODE_ENV === 'development') {
        console.error('[Proofreading] Analyze API error:', res.status, message, data.code)
      }
      return { ok: false, error: message, status: res.status }
    }

    return {
      ok: true,
      issues: Array.isArray(data.issues) ? (data.issues as AnalyzedIssue[]) : [],
      review: data.review as WritingReviewReport | undefined,
      metadata: (data.metadata as Record<string, unknown>) ?? undefined,
      summary: typeof data.summary === 'string' ? data.summary : undefined,
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Proofreading] Analyze network error:', err)
    }
    return { ok: false, error: ANALYSIS_FAILED, networkError: true }
  }
}
