import { aiProvider } from '@/lib/jobaz-ai/providers'
import type { AdminAiDateRange } from './dateRange'
import { parseAdminAiDateRange } from './dateRange'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
} from './siteBrain'
import {
  getAdminAiMetrics,
  getAdminReportCatalogueContext,
  getAffiliateProviderSummary,
  getSupervisorSessions,
  getTechnicalChecks,
} from './metrics'
import type { AdminAiPriority } from './types'

export type ManagerReportResult = {
  ok: boolean
  configured: boolean
  title: string
  markdown: string
  priority: AdminAiPriority
  reportId?: string
  persistError?: string
  error?: string
  contextUsed?: Record<string, unknown>
  createdAt?: string
  siteBrain?: {
    version: number
    source: 'database' | 'defaults'
    updatedAt: string | null
    isActive: boolean
  }
}

const MANAGER_FORMAT = `Output markdown with exactly this structure:

# AI Manager Report

## What happened
Short summary based only on available metrics.

## Why it matters
Explain the business meaning for JobAZ.

## Top opportunities
For each item use:
- Opportunity:
- Why:
- Suggested action:

## Problems / risks
For each item use:
- Problem:
- Severity: High | Medium | Low
- Suggested fix:

## Recommended actions
### High priority
Numbered list.
### Medium priority
Numbered list.
### Low priority
Numbered list.

## Notes
List missing data, empty sources, and anything marked "not wired yet" (monitoring missing — not necessarily a failure).

Priority language:
- High = launch blocker, revenue blocker, safety/trust risk, or current user-flow problem
- Medium = important improvement or missing useful data
- Low = monitoring, old/test data, or future improvement
Do not mark old/test/historical data as High unless it affects the current flow.

Rules:
- Never invent revenue, sales, affiliate approvals, providers, or click counts.
- Never guarantee jobs or success.
- Never expose private user PII (emails, names, phone numbers).
- If a metric is missing, say "not wired yet".
- Follow Site Brain must-not-do and admin priorities.
- End Notes with a line: Overall priority: Medium
  (use High only if there are clear high-severity technical/business risks in the provided data; use Low only if the period is quiet with no material issues).`

function extractPriority(markdown: string): AdminAiPriority {
  const overall = markdown.match(/overall\s*priority\s*[:\-]\s*(high|medium|low)\b/i)
  const severityHigh = (markdown.match(/Severity:\s*High/gi) || []).length
  if (overall) {
    const v = overall[1].toLowerCase()
    if (v === 'high') return 'High'
    if (v === 'low') return 'Low'
    return 'Medium'
  }
  if (severityHigh >= 2) return 'High'
  return 'Medium'
}

function sanitizeContextForStorage(ctx: Record<string, unknown>): Record<string, unknown> {
  // Keep compact; never store full user answers blobs beyond what's already public admin summary
  return JSON.parse(JSON.stringify(ctx))
}

export async function generateManagerReport(options: {
  range?: AdminAiDateRange | string
  createdBy?: string | null
}): Promise<ManagerReportResult> {
  const range = parseAdminAiDateRange(
    typeof options.range === 'string' ? options.range : options.range || '7d'
  )

  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      configured: false,
      title: 'AI Manager Report',
      markdown: '',
      priority: 'Medium',
      error: 'AI provider is not configured yet.',
    }
  }

  const [{ brain, source: brainSource }, metrics, sessions, catalogue, affiliate, technical] =
    await Promise.all([
      getActiveSiteBrain(),
      getAdminAiMetrics({ range, includeTest: false }),
      getSupervisorSessions({
        range,
        completeOnly: true,
        includeTest: false,
        limit: 20,
      }),
      getAdminReportCatalogueContext(),
      getAffiliateProviderSummary(),
      getTechnicalChecks(),
    ])

  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  logSiteBrainLoaded('AI Manager', siteBrainMeta)

  // Strip potential PII-heavy answer blobs from session rows for the prompt
  const sessionSummaries = sessions.rows.map((r) => ({
    date: r.date,
    status: r.status,
    source: r.source,
    goal: r.goal,
    route: r.route,
    savedPlan: r.savedPlan,
    recommendedCourse: r.recommendedCourse,
    applyClick: r.applyClick,
  }))

  const contextUsed = {
    range,
    siteBrain: siteBrainMeta,
    metrics,
    sessions: {
      available: sessions.available,
      count: sessionSummaries.length,
      rows: sessionSummaries,
      message: sessions.message,
    },
    catalogue: {
      available: catalogue.available,
      publishedCourseCount: catalogue.publishedCourses.length,
      opportunityCount: catalogue.opportunities.length,
      providerCount: catalogue.providers.length,
      recentClickCount: catalogue.recentClicks.length,
      publishedCoursesSample: catalogue.publishedCourses.slice(0, 15),
      notes: catalogue.notes,
    },
    affiliate,
    technical,
  }

  const system = `You are JobAZ Admin AI Manager — an internal business/admin analyst for the site owner.
You write concise management reports. The human admin makes final decisions.
Use only the metrics and context provided. Prefer "not wired yet" over invented numbers.
Do not invent revenue, confirmed sales, affiliate approvals, or providers.
Do not expose private user data.

Site Brain guidance for AI Manager:
- Focus on the current launch stage from Site Brain.
- Avoid suggesting big new features before launch unless they solve a launch blocker.
- Prioritise launch blockers, revenue blockers, user journey clarity and practical next actions.
- If data is missing, say so — never invent numbers.

${MANAGER_FORMAT}`

  const user = `${brainBlock}

Date range: ${range}

Metrics cards (use labels/values as given; unavailable = not wired yet):
${JSON.stringify(metrics, null, 2)}

Recent complete assistant sessions (no PII):
${JSON.stringify(sessionSummaries, null, 2)}

Published courses / opportunities / providers / clicks summary:
${JSON.stringify(contextUsed.catalogue, null, 2)}

Affiliate / provider gaps:
${JSON.stringify(affiliate, null, 2)}

Technical warnings:
${JSON.stringify(technical, null, 2)}

Write the AI Manager Report now.`

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-manager-report',
      temperature: 0.3,
      maxTokens: 2800,
    })

    let markdown = (completion.text || '').trim()
    if (!markdown) {
      return {
        ok: false,
        configured: true,
        title: 'AI Manager Report',
        markdown: '',
        priority: 'Medium',
        error: 'AI returned an empty response',
      }
    }

    if (!markdown.startsWith('# ')) {
      markdown = `# AI Manager Report\n\n${markdown}`
    }

    const priority = extractPriority(markdown)

    const saved = await persistManagerReport({
      title: 'AI Manager Report',
      input: sanitizeContextForStorage(contextUsed),
      markdown,
      priority,
      createdBy: options.createdBy || null,
    })

    return {
      ok: true,
      configured: true,
      title: 'AI Manager Report',
      markdown,
      priority,
      reportId: saved.id,
      persistError: saved.error,
      contextUsed,
      createdAt: new Date().toISOString(),
      siteBrain: siteBrainMeta,
    }
  } catch (e) {
    return {
      ok: false,
      configured: true,
      title: 'AI Manager Report',
      markdown: '',
      priority: 'Medium',
      error: e instanceof Error ? e.message : 'AI generation failed',
    }
  }
}

export async function persistManagerReport(params: {
  title: string
  input: Record<string, unknown>
  markdown: string
  priority: AdminAiPriority
  createdBy?: string | null
}): Promise<{ id?: string; error?: string }> {
  const { getAdminCoursesSupabase } = await import('@/lib/admin/courses/supabaseServer')
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data, error } = await supabase
    .from('admin_ai_reports')
    .insert({
      report_type: 'manager',
      title: params.title,
      input_json: params.input,
      output_markdown: params.markdown,
      priority: params.priority,
      status: 'generated',
      created_by: params.createdBy || null,
    })
    .select('id, created_at')
    .maybeSingle()

  if (error) {
    // Fallback if 'generated' status not migrated yet
    if (/status|check/i.test(error.message)) {
      const retry = await supabase
        .from('admin_ai_reports')
        .insert({
          report_type: 'manager',
          title: params.title,
          input_json: params.input,
          output_markdown: params.markdown,
          priority: params.priority,
          status: 'draft',
          created_by: params.createdBy || null,
        })
        .select('id')
        .maybeSingle()
      if (retry.error) return { error: retry.error.message }
      return { id: retry.data?.id }
    }
    return { error: error.message }
  }

  return { id: data?.id }
}

export async function getLatestManagerReport(): Promise<{
  ok: boolean
  report?: {
    id: string
    title: string
    markdown: string
    priority: AdminAiPriority
    createdAt: string
    status: string
  } | null
  error?: string
}> {
  const { getAdminCoursesSupabase } = await import('@/lib/admin/courses/supabaseServer')
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' }
  }

  const { data, error } = await supabase
    .from('admin_ai_reports')
    .select('id, title, output_markdown, priority, created_at, status')
    .eq('report_type', 'manager')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { ok: false, error: error.message }
  }
  if (!data) return { ok: true, report: null }

  return {
    ok: true,
    report: {
      id: data.id,
      title: data.title || 'AI Manager Report',
      markdown: data.output_markdown || '',
      priority: (data.priority as AdminAiPriority) || 'Medium',
      createdAt: data.created_at,
      status: data.status || 'generated',
    },
  }
}
