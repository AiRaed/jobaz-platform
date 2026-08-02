import { aiProvider } from '@/lib/jobaz-ai/providers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
} from './siteBrain'
import {
  getAdminReportCatalogueContext,
  getSupervisorSessions,
  getTechnicalChecks,
} from './metrics'
import {
  runSiteHealthCheck,
  summarizeSiteHealthForPrompt,
} from './siteHealth'
import type { AdminAiPriority, SiteHealthSnapshot, TechnicalCheck } from './types'

export type TechnicalReportMode =
  | 'full'
  | 'referral'
  | 'course_quality'
  | 'ai_errors'
  | 'tracking'
  | 'ai'
  | 'cv'
  | 'jobs'
  | 'interview'

export type TechnicalReportResult = {
  ok: boolean
  configured: boolean
  title: string
  markdown: string
  priority: AdminAiPriority
  reportId?: string
  persistError?: string
  error?: string
  createdAt?: string
  contextUsed?: Record<string, unknown>
  health?: SiteHealthSnapshot
  siteBrain?: {
    version: number
    source: 'database' | 'defaults'
    updatedAt: string | null
    isActive: boolean
  }
}

const MODE_LABELS: Record<TechnicalReportMode, string> = {
  full: 'Generate Technical Report',
  referral: 'Check Courses & Referrals',
  course_quality: 'Check Course Data Quality',
  ai_errors: 'Check AI Services',
  tracking: 'Check Tracking Events',
  ai: 'Check AI Services',
  cv: 'Check CV/Documents',
  jobs: 'Check Jobs APIs',
  interview: 'Check Interview Voice',
}

function modeToHealthScope(mode: TechnicalReportMode): string {
  switch (mode) {
    case 'referral':
    case 'course_quality':
      return 'courses'
    case 'ai_errors':
    case 'ai':
      return 'ai'
    case 'tracking':
      return 'tracking'
    case 'cv':
      return 'cv'
    case 'jobs':
      return 'jobs'
    case 'interview':
      return 'interview'
    default:
      return 'all'
  }
}

function modeFocus(mode: TechnicalReportMode): string {
  switch (mode) {
    case 'full':
      return 'Produce a full JobAZ Technical Health Report across all modules.'
    case 'referral':
    case 'course_quality':
      return 'Focus on courses, referral URLs, Apply Now tracking, and revenue blockers. Do NOT confuse empty provider_name on a course row with Affiliate Scout route-level provider gaps.'
    case 'ai_errors':
    case 'ai':
      return 'Focus on AI / API configuration and endpoint presence. If monitoring is not wired, say so — do not invent error counts.'
    case 'tracking':
      return 'Focus on tracking/events gaps. If tracking is not wired, say "not wired yet".'
    case 'cv':
      return 'Focus on CV load/upsert, shared readiness helper, plan-aware scoring, and PDF/DOCX export wiring.'
    case 'jobs':
      return 'Focus on jobs search config, API keys present/missing, saved/applied jobs APIs.'
    case 'interview':
      return 'Focus on Interview Coach, voice recording code, ElevenLabs config, audio cache.'
  }
}

const REPORT_FORMAT = `Output markdown with exactly this structure:

# JobAZ Technical Health Report

## Overall status
Healthy / Needs attention / Launch blocker risk
(Choose one based only on real checks. Prefer "Needs attention" when many items are not wired yet but no hard failures.)

## Launch blockers
Only issues that stop core user flow:
- homepage
- assistant
- save plan
- dashboard
- CV builder
- Apply Now
- auth
If none from real data, say so. Do not invent blockers. List "not wired yet" monitoring gaps separately under Monitoring gaps — not as blockers.

## AI/API risks
OpenAI, ElevenLabs, jobs APIs, email provider (later). Present/missing/not wired only — never invent outages.

## User flow risks
Assistant → My Plan → Courses → CV → Jobs.

## Revenue blockers
Referral links, Apply Now tracking, provider status on course records.
Use real missing referral URL counts when available.
Do not claim "no missing providers" in the Affiliate Scout sense.

## Data/save risks
Supabase, saved CV, saved plans, guest/localStorage conflicts.
If localStorage conflict checks are not wired, say "not wired yet".

## Monitoring gaps
Not-wired checks and missing logs. Be explicit.

## Recommended actions
### High priority
Numbered list of concrete admin tasks from real findings.
### Medium priority
Numbered list.
### Low priority
Numbered list.

## Notes
Summarise what was measured vs not wired.
Clarify: Technical Reports = course-record data quality + site health; Affiliate Scout = priority routes missing a live provider/referral course.
If published course records without provider count is 0, write:
"No published courses without provider were detected by current checks."
Then: "Route-level provider gaps are handled in Affiliate Scout."
NEVER write "confirmed no missing providers".
End with: Overall priority: High | Medium | Low`

async function loadSampleIssues(): Promise<{
  missingReferralSamples: Array<{ title: string; provider_name: string | null }>
  missingProviderSamples: Array<{ title: string; category: string | null }>
  notes: string[]
}> {
  const notes: string[] = []
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { missingReferralSamples: [], missingProviderSamples: [], notes: ['Supabase not configured'] }
  }

  const [refRes, provRes] = await Promise.all([
    supabase
      .from('courses')
      .select('title, provider_name, referral_url, status')
      .eq('status', 'published')
      .or('referral_url.is.null,referral_url.eq.')
      .limit(12),
    supabase
      .from('courses')
      .select('title, category, provider_name, status')
      .eq('status', 'published')
      .or('provider_name.is.null,provider_name.eq.')
      .limit(12),
  ])

  if (refRes.error) notes.push(`missing referral sample: ${refRes.error.message}`)
  if (provRes.error) notes.push(`missing provider sample: ${provRes.error.message}`)

  return {
    missingReferralSamples: (refRes.data || []).map((c) => ({
      title: String((c as { title?: string }).title || ''),
      provider_name: (c as { provider_name?: string | null }).provider_name ?? null,
    })),
    missingProviderSamples: (provRes.data || []).map((c) => ({
      title: String((c as { title?: string }).title || ''),
      category: (c as { category?: string | null }).category ?? null,
    })),
    notes,
  }
}

function extractPriority(
  markdown: string,
  checks: TechnicalCheck[],
  health?: SiteHealthSnapshot
): AdminAiPriority {
  const overall = markdown.match(/overall\s*priority\s*[:\-]\s*(high|medium|low)\b/i)
  if (overall) {
    const v = overall[1].toLowerCase()
    if (v === 'high') return 'High'
    if (v === 'low') return 'Low'
    return 'Medium'
  }
  if (health?.overallStatus === 'error') return 'High'
  const missingRef = checks.find((c) => c.id === 'missing_referral')
  const missingProv = checks.find((c) => c.id === 'missing_provider')
  if (
    (missingRef?.available && (missingRef.count || 0) > 0) ||
    (missingProv?.available && (missingProv.count || 0) > 0)
  ) {
    return 'High'
  }
  if (health?.overallStatus === 'warning') return 'Medium'
  return 'Medium'
}

export async function generateTechnicalReport(options: {
  mode?: TechnicalReportMode | string
  createdBy?: string | null
}): Promise<TechnicalReportResult> {
  const allowed: TechnicalReportMode[] = [
    'full',
    'referral',
    'course_quality',
    'ai_errors',
    'tracking',
    'ai',
    'cv',
    'jobs',
    'interview',
  ]
  const mode = (
    allowed.includes(options.mode as TechnicalReportMode) ? options.mode : 'full'
  ) as TechnicalReportMode

  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      configured: false,
      title: 'JobAZ Technical Health Report',
      markdown: '',
      priority: 'Medium',
      error: 'AI provider is not configured yet.',
    }
  }

  const healthScope = modeToHealthScope(mode)
  const [{ brain, source: brainSource }, checks, catalogue, sessions, samples, health] =
    await Promise.all([
      getActiveSiteBrain(),
      getTechnicalChecks(),
      getAdminReportCatalogueContext(),
      getSupervisorSessions({ range: '7d', completeOnly: false, includeTest: false, limit: 15 }),
      loadSampleIssues(),
      runSiteHealthCheck(healthScope),
    ])

  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  logSiteBrainLoaded('Technical Reports', siteBrainMeta)
  const title = `JobAZ Technical Health Report · ${MODE_LABELS[mode]}`
  const healthSummary = summarizeSiteHealthForPrompt(health)

  const system = `You are JobAZ Technical Health / Site Intelligence AI — an internal launch-readiness analyst.
Cover all launch-critical modules: AI, Interview/Voice, CV/Documents, Career Assistant, Jobs, Courses/Affiliate, Auth, Supabase, Tracking, Deployment.
The human admin decides what to fix.

Follow Site Brain must-not-do and admin priorities.
Tone: clear, practical, UK-focused. No hype.

Site Brain guidance for Technical Reports:
- Focus on launch blockers first.
- Separate actual errors from "not wired yet".
- Cover broad site health: AI services, CV/Documents, Jobs APIs, Interview Voice, Courses/Affiliate, Supabase DB, Tracking, Auth, Deployment.
- Avoid claiming a tool is connected unless code/checks confirm it.

Hard rules:
- Do NOT invent errors, outages, or failure counts.
- If a check status is "not_wired", say "not wired yet" — do not invent numbers or failures.
- Only claim a concrete issue when status is warning/error or a measured count supports it.
- Never expose API keys or secret values — only present/missing.
- Do not delete data or propose destructive changes to user-facing pages.
- Prefer actionable admin tasks.
- Terminology:
  * "Published course records without provider" = empty provider_name on a published course row.
  * "Missing provider by route" = Affiliate Scout only.
  * Never say "confirmed no missing providers".
  * If provider_name check count is 0, say: "No published courses without provider were detected by current checks." and "Route-level provider gaps are handled in Affiliate Scout."

${REPORT_FORMAT}`

  const user = `${brainBlock}

Mode: ${MODE_LABELS[mode]}
${modeFocus(mode)}

=== Site Health Snapshot (primary source of truth) ===
${healthSummary}

=== Legacy technical counts (course-focused) ===
${JSON.stringify(checks, null, 2)}

Sample published course records missing referral URL:
${JSON.stringify(samples.missingReferralSamples, null, 2)}

Sample published course records without provider_name:
${JSON.stringify(samples.missingProviderSamples, null, 2)}

Catalogue context:
${JSON.stringify({ available: catalogue.available, notes: catalogue.notes, publishedCount: catalogue.publishedCourses.length, clickCount: catalogue.recentClicks.length }, null, 2)}

Recent assistant sessions (quality context only; no PII):
available=${sessions.available}, count=${sessions.rows.length}
${JSON.stringify(
  sessions.rows.slice(0, 10).map((r) => ({
    status: r.status,
    route: r.route,
    goal: r.goal,
    savedPlan: r.savedPlan,
    recommendedCourse: r.recommendedCourse,
  })),
  null,
  2
)}

Sample load notes:
${samples.notes.join('\n') || 'None'}

Write the JobAZ Technical Health Report now.`

  const contextUsed = {
    mode,
    siteBrain: siteBrainMeta,
    checks,
    health,
    samples,
    catalogueNotes: catalogue.notes,
    sessionCount: sessions.rows.length,
  }

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-technical-report',
      temperature: 0.3,
      maxTokens: 3500,
    })

    let markdown = (completion.text || '').trim()
    if (!markdown) {
      return {
        ok: false,
        configured: true,
        title,
        markdown: '',
        priority: 'Medium',
        error: 'AI returned an empty response',
        health,
      }
    }

    if (!markdown.startsWith('# ')) {
      markdown = `# JobAZ Technical Health Report\n\n${markdown}`
    }

    const priority = extractPriority(markdown, checks, health)
    const saved = await persistTechnicalReport({
      title,
      input: contextUsed,
      markdown,
      priority,
      createdBy: options.createdBy || null,
    })

    return {
      ok: true,
      configured: true,
      title,
      markdown,
      priority,
      reportId: saved.id,
      persistError: saved.error,
      createdAt: new Date().toISOString(),
      contextUsed,
      health,
      siteBrain: siteBrainMeta,
    }
  } catch (e) {
    return {
      ok: false,
      configured: true,
      title,
      markdown: '',
      priority: 'Medium',
      error: e instanceof Error ? e.message : 'AI generation failed',
      health,
    }
  }
}

async function persistTechnicalReport(params: {
  title: string
  input: Record<string, unknown>
  markdown: string
  priority: AdminAiPriority
  createdBy?: string | null
}): Promise<{ id?: string; error?: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data, error } = await supabase
    .from('admin_ai_reports')
    .insert({
      report_type: 'technical',
      title: params.title,
      input_json: params.input,
      output_markdown: params.markdown,
      priority: params.priority,
      status: 'generated',
      created_by: params.createdBy || null,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    if (/status|check/i.test(error.message)) {
      const retry = await supabase
        .from('admin_ai_reports')
        .insert({
          report_type: 'technical',
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
