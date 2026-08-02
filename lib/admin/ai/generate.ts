import { aiProvider } from '@/lib/jobaz-ai/providers'
import type { AdminAiReportType, AdminAiPriority } from './types'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
  type SiteBrainLoadMeta,
} from './siteBrain'
import {
  getAdminAiMetrics,
  getAdminReportCatalogueContext,
  getAffiliateProviderSummary,
  getSupervisorSessions,
  getTechnicalChecks,
} from './metrics'

export type GenerateAdminAiInput = {
  reportType: AdminAiReportType
  prompt?: string
  input?: Record<string, unknown>
}

export type GenerateAdminAiResult = {
  ok: boolean
  title: string
  markdown: string
  priority: AdminAiPriority
  configured: boolean
  error?: string
  contextUsed?: Record<string, unknown>
  siteBrain?: SiteBrainLoadMeta
}

function extractPriority(markdown: string): AdminAiPriority {
  const m = markdown.match(/\bpriority\s*[:\-]\s*(high|medium|low)\b/i)
  if (!m) return 'Medium'
  const v = m[1].toLowerCase()
  if (v === 'high') return 'High'
  if (v === 'low') return 'Low'
  return 'Medium'
}

const STANDARD_SECTIONS = `Output markdown with these exact headings:
## What happened
## Why it matters
## Opportunities
## Problems
## Recommended actions
## Priority: High | Medium | Low

In Recommended actions, use a short numbered list of concrete admin tasks.
Never invent metrics, providers, or click counts. If a data source is missing or empty, say so.`

async function runModel(system: string, user: string): Promise<GenerateAdminAiResult> {
  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      title: 'AI provider not configured',
      markdown: '',
      priority: 'Medium',
      configured: false,
      error: 'AI provider is not configured yet.',
    }
  }

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-report',
      temperature: 0.35,
      maxTokens: 2400,
    })

    const markdown = (completion.text || '').trim()
    if (!markdown) {
      return {
        ok: false,
        title: 'Empty AI response',
        markdown: '',
        priority: 'Medium',
        configured: true,
        error: 'AI returned an empty response',
      }
    }

    return {
      ok: true,
      title: 'Admin AI report',
      markdown,
      priority: extractPriority(markdown),
      configured: true,
    }
  } catch (e) {
    return {
      ok: false,
      title: 'AI generation failed',
      markdown: '',
      priority: 'Medium',
      configured: true,
      error: e instanceof Error ? e.message : 'AI generation failed',
    }
  }
}

const BASE_SYSTEM = `You are JobAZ Admin AI — an internal management assistant for the site owner.
You generate reports and suggestions only. The human admin makes final decisions.
Never invent real user metrics. Prefer empty/unknown over fabricated numbers.
Do not guarantee jobs. Do not invent affiliate providers or referral URLs.
Follow the active Site Brain rules.`

export async function generateAdminAiReport(
  input: GenerateAdminAiInput
): Promise<GenerateAdminAiResult> {
  const { brain, source: brainSource } = await getActiveSiteBrain()
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const catalogue = await getAdminReportCatalogueContext()

  const withMeta = (
    result: GenerateAdminAiResult,
    toolLabel: string,
    extra?: Record<string, unknown>
  ): GenerateAdminAiResult => {
    logSiteBrainLoaded(toolLabel, siteBrainMeta)
    return {
      ...result,
      siteBrain: siteBrainMeta,
      contextUsed: { ...result.contextUsed, ...extra, siteBrain: siteBrainMeta },
    }
  }

  switch (input.reportType) {
    case 'manager': {
      const metrics = await getAdminAiMetrics()
      const result = await runModel(
        `${BASE_SYSTEM}

Site Brain guidance for AI Manager:
- Focus on current launch stage; avoid big new features before launch.
- Prioritise launch blockers, revenue blockers, user journey clarity and practical next actions.
- Mention missing data instead of inventing numbers.

${STANDARD_SECTIONS}`,
        `${brainBlock}\n\nMetrics snapshot:\n${JSON.stringify(metrics, null, 2)}\n\nCatalogue / funnel context:\n${JSON.stringify(catalogue, null, 2)}\n\nExtra notes:\n${input.prompt || 'None'}`
      )
      return withMeta(
        { ...result, title: 'AI Manager Report' },
        'AI Manager',
        { metrics, catalogue }
      )
    }

    case 'marketing': {
      const route = String(input.input?.route || 'Extra Income')
      const audience = String(input.input?.audience || 'general UK users')
      const channel = String(input.input?.channel || 'Facebook')
      const format = String(input.input?.format || 'Facebook Ad')
      const result = await runModel(
        `${BASE_SYSTEM}

Create marketing copy for JobAZ, then also include the standard decision sections.

Site Brain guidance for Marketing AI:
- Keep tone clear, practical, UK-focused.
- Market the route, not just random courses.
- Avoid job/income guarantees.
- Promote only real/published/approved provider offers if data confirms them.
- Otherwise say "recommended route" or "training type", not a fake provider.

Output:
## Headline
## Main copy
## CTA
## Notes
## Compliance caution
## What happened
## Why it matters
## Opportunities
## Problems
## Recommended actions
## Priority: High | Medium | Low

Compliance: no job guarantees, no fake provider claims, UK-appropriate tone.
If published courses exist for the route, you may mention course types — never invent live partners.`,
        `${brainBlock}\n\nRoute: ${route}\nAudience: ${audience}\nChannel: ${channel}\nFormat: ${format}\n\nPublished courses / providers sample:\n${JSON.stringify(catalogue, null, 2)}\n\nExtra: ${input.prompt || ''}`
      )
      return withMeta(
        { ...result, title: `Marketing AI · ${format}` },
        'Marketing AI',
        { route, audience, channel, format, catalogue }
      )
    }

    case 'supervisor': {
      const sessions = await getSupervisorSessions({ limit: 20, range: '7d' })
      const mode = String(input.input?.mode || 'review')
      const result = await runModel(
        `${BASE_SYSTEM}

You supervise Career Assistant quality.
Check: goal match, published courses when relevant, no fake providers, length, CV action, next step.

Site Brain guidance for AI Supervisor:
- Judge against JobAZ route logic; My Plan is the journey centre.
- Flag fake providers, fake Apply Now, unavailable courses shown as live.
- Separate old/test data from current flow; avoid marking everything High.

${STANDARD_SECTIONS}

Also include short subsections under Problems for: Weak recommendations, Missing course links, Risky / overpromising text.`,
        `${brainBlock}\n\nMode: ${mode}\nSessions available: ${sessions.available}\nMessage: ${sessions.message || ''}\nRecent sessions:\n${JSON.stringify(sessions.rows, null, 2)}\n\nPublished courses sample:\n${JSON.stringify(catalogue.publishedCourses.slice(0, 20), null, 2)}\n\nExtra: ${input.prompt || ''}`
      )
      return withMeta(
        { ...result, title: 'AI Supervisor Report' },
        'AI Supervisor',
        { sessions, catalogue }
      )
    }

    case 'affiliate': {
      const summary = await getAffiliateProviderSummary()
      const mode = String(input.input?.mode || 'suggest')
      const result = await runModel(
        `${BASE_SYSTEM}

Help decide which affiliate programmes/providers to add next.
Priority routes: SIA/Security, CSCS/Construction, First Aid/Food Safety, Care, Forklift/Warehouse, TEFL/Teaching Assistant, IT/Digital, AAT/Bookkeeping.

Site Brain guidance for Affiliate Scout:
- High = launch/revenue blocker or priority route gap; Medium = useful but not immediate; Low = future/monitoring.
- Do not invent providers as approved.

${STANDARD_SECTIONS}

Under Opportunities, list route gaps with: missing course/provider, search keywords, suggested next action.`,
        `${brainBlock}\n\nMode: ${mode}\nProvider summary:\n${JSON.stringify(summary, null, 2)}\n\nCatalogue context:\n${JSON.stringify(catalogue, null, 2)}\n\nExtra: ${input.prompt || ''}`
      )
      return withMeta(
        { ...result, title: 'Affiliate Scout Report' },
        'Affiliate Scout',
        { summary, catalogue }
      )
    }

    case 'technical': {
      const checks = await getTechnicalChecks()
      const mode = String(input.input?.mode || 'full')
      const result = await runModel(
        `${BASE_SYSTEM}

Produce a technical / funnel health report.

Site Brain guidance for Technical Reports:
- Focus on launch blockers first.
- Separate actual errors from "not wired yet".
- Cover AI, CV/Documents, Jobs, Interview Voice, Courses/Affiliate, Supabase, Tracking, Auth, Deployment.
- Do not claim a tool is connected unless checks confirm it.

${STANDARD_SECTIONS}

Under Problems, list each issue with severity, affected page/table, and suggested fix.`,
        `${brainBlock}\n\nMode: ${mode}\nTechnical checks:\n${JSON.stringify(checks, null, 2)}\n\nCatalogue context:\n${JSON.stringify(catalogue, null, 2)}\n\nExtra: ${input.prompt || ''}`
      )
      return withMeta(
        { ...result, title: 'Technical Report' },
        'Technical Reports',
        { checks, catalogue }
      )
    }

    case 'site_brain_test': {
      const scenario = String(
        input.input?.scenario ||
          input.prompt ||
          'A new arrival wants extra income security work in the UK.'
      )
      const result = await runModel(
        `${BASE_SYSTEM}\n\n${STANDARD_SECTIONS}`,
        `${brainBlock}\n\nScenario:\n${scenario}`
      )
      return withMeta(
        { ...result, title: 'Site Brain scenario test' },
        'Site Brain Assistant',
        { scenario }
      )
    }

    default:
      return {
        ok: false,
        title: 'Unknown report type',
        markdown: '',
        priority: 'Medium',
        configured: true,
        error: 'Unknown report type',
        siteBrain: siteBrainMeta,
      }
  }
}

export async function persistAdminAiReport(params: {
  reportType: AdminAiReportType
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
      report_type: params.reportType,
      title: params.title,
      input_json: params.input,
      output_markdown: params.markdown,
      priority: params.priority,
      status: 'draft',
      created_by: params.createdBy || null,
    })
    .select('id')
    .maybeSingle()

  if (error) return { error: error.message }
  return { id: data?.id }
}
