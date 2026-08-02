import { aiProvider } from '@/lib/jobaz-ai/providers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { AdminAiDateRange } from './dateRange'
import { parseAdminAiDateRange } from './dateRange'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
} from './siteBrain'
import {
  getAdminReportCatalogueContext,
  getSupervisorSessions,
} from './metrics'
import type { AdminAiPriority, SupervisorSessionRow } from './types'

export type SupervisorReportMode =
  | 'review'
  | 'weak'
  | 'missing_courses'
  | 'risky'
  | 'route_mismatch'
  | 'stale_plan'

export type SupervisorReportResult = {
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
  siteBrain?: {
    version: number
    source: 'database' | 'defaults'
    updatedAt: string | null
    isActive: boolean
  }
}

const MODE_LABELS: Record<SupervisorReportMode, string> = {
  review: 'Review Last 20 Assistant Results',
  weak: 'Find Weak Recommendations',
  missing_courses: 'Find Missing Course Links',
  risky: 'Find Risky / Overpromising Text',
  route_mismatch: 'Find Route Mismatches',
  stale_plan: 'Find Stale Plan Context',
}

const ROUTE_RUBRIC = `Route-aware quality rubric (MUST follow):

Extra Income / Security:
- Matchday Steward is a WORK-NOW target role — NOT a published course. NEVER flag "no published course for Matchday Steward".
- Good result checks: work-now steward/event role present; SIA Door Supervisor as next upgrade training; CV action present; saved to My Plan.
- Optional add-ons: First Aid at Work, SIA CCTV — nice to have, not required for "good".
- Course logic: Needs improvement ONLY if hasSiaDoorSupervisorUpgrade=no (fields present and SIA missing). If nextUpgrade/recommendedCourse are empty/not wired → Needs data, NOT Needs improvement.

Work in Education + Engineering:
- Recommend engineering-related UK roles; IET/professional membership when appropriate.
- Do NOT list unrelated accounting/AAT certs.

Classifications (use qualityClassification field when provided):
- good — route logic satisfied (e.g. Matchday Steward work-now + SIA Door Supervisor upgrade)
- needs_data — nextUpgrade / recommendedCourse / CV action fields missing or not wired; do NOT treat as weak
- needs_improvement — data IS available and clearly shows no CV action, no next step, wrong route, or missing SIA upgrade
- risky — guarantees, fake providers, wrong Apply Now
- possible_test_old — historical/test/old sessions; group under "Historical/test data to clean or ignore"

Priority rules:
HIGH only if current (not historical/test) AND:
- active user flow broken, fake provider, wrong Apply Now, job/income guarantee, plan save failure, OR confirmed current plan/CV route mismatch
  (High = launch blocker, revenue blocker, safety/trust risk, or current user-flow problem)

MEDIUM: current sessions with needs_improvement only (important improvement or missing useful data)

LOW: old/test data, needs_data (fields not wired), monitoring gaps, historical incomplete sessions`

function modeFocus(mode: SupervisorReportMode): string {
  switch (mode) {
    case 'review':
      return 'Review the last ~20 Career Assistant sessions holistically. Apply route rubric. Separate historical/test data from current issues.'
    case 'weak':
      return 'Focus on qualityClassification=needs_improvement only (data available and clearly weak). Ignore needs_data and historical/test.'
    case 'missing_courses':
      return 'For Security/Extra Income: only sessions with hasSiaDoorSupervisorUpgrade=no. Ignore needs_data. NEVER flag missing Matchday Steward course.'
    case 'risky':
      return 'Focus on guaranteed jobs/income, invented prices/providers, and overconfident claims. If none evidenced, say so.'
    case 'route_mismatch':
      return 'Focus on CURRENT route/context mismatches only. Exclude isHistoricalOrTest sessions — put old Design Engineer data under Historical/test data, not High priority.'
    case 'stale_plan':
      return 'Focus on stale assessment/plan context in historical or old sessions. Current cross-page plan sync monitoring may be not wired yet.'
  }
}

const REPORT_FORMAT = `Output markdown with exactly this structure:

# AI Supervisor Report

## Overall verdict
Good / Needs attention / Critical issues
(Base on CURRENT sessions only — not historical/test noise.)

## Strong results
Sessions with qualityClassification=good or security route with work-now steward + SIA Door Supervisor upgrade.
Mention anonId and route. Matchday Steward as work-now target = good when upgrade is verified.

## Historical/test data to clean or ignore
Group isHistoricalOrTest=true OR qualityClassification=possible_test_old here.
Old Design Engineer sessions, test rows, incomplete historical data.
Do NOT list these under High priority.

## Sessions needing data
qualityClassification=needs_data.
Use this wording (or close): "These sessions appear incomplete from stored data. The supervisor cannot fully verify next upgrade or CV action yet."
Do NOT say they "lack specific next steps" as if that is a confirmed quality failure.
Do NOT treat needs_data as Needs improvement.

## Weak recommendations
needs_improvement sessions only (current, data available): no CV action, no next step, wrong route, missing SIA upgrade when fields are present, overly vague result.

## Route/context mismatches
Confirmed wrong-route / possible_mismatch on CURRENT sessions only (needs_improvement or risky).
Never escalate old/test Design Engineer here.

## Course recommendation issues
For Security/Extra Income: only flag missing SIA Door Supervisor when hasSiaDoorSupervisorUpgrade=no — NOT when fields are not_wired or needs_data.
NEVER flag missing course for Matchday Steward.
If not evidenced, say so.

## Safety / trust issues
risky only from evidence — guarantees, fake providers, invented prices.

## Recommended actions
### High priority
ONLY current-session critical issues (fake provider, guarantees, save failure, confirmed active route mismatch).
### Medium priority
Current needs_improvement only.
### Low priority
Wire missing fields / mark test data / clear old sessions / needs_data follow-up.

## Notes
Classifications used, what was measured vs not wired.
End with: Overall priority: High | Medium | Low`

function sessionForPrompt(r: SupervisorSessionRow) {
  return {
    anonId: r.anonId,
    date: r.date,
    goal: r.goal,
    route: r.route,
    currentTarget: r.currentTarget,
    nextUpgrade: r.nextUpgrade,
    status: r.status,
    qualityClassification: r.qualityClassification,
    priorityHint: r.priorityHint,
    isHistoricalOrTest: r.isHistoricalOrTest,
    isSecurityExtraIncomeRoute: r.isSecurityExtraIncomeRoute,
    hasWorkNowStewardRole:
      r.hasWorkNowStewardRole == null ? 'not_wired' : r.hasWorkNowStewardRole ? 'yes' : 'no',
    hasSiaDoorSupervisorUpgrade:
      r.hasSiaDoorSupervisorUpgrade == null
        ? 'not_wired'
        : r.hasSiaDoorSupervisorUpgrade
          ? 'yes'
          : 'no',
    savedPlan: r.savedPlan,
    recommendedCourse: r.recommendedCourse,
    publishedCourseUsed:
      r.publishedCourseUsed == null ? 'not_wired' : r.publishedCourseUsed ? 'yes' : 'no',
    applyClick: r.applyClick == null ? 'not_wired' : r.applyClick ? 'yes' : 'no',
    supervisorFlag: r.supervisorFlag,
    hasCvAction: r.hasCvAction == null ? 'not_wired' : r.hasCvAction ? 'yes' : 'no',
    workNowCount: r.workNowCount,
    source: r.source,
  }
}

function extractPriority(markdown: string, sessions: SupervisorSessionRow[]): AdminAiPriority {
  const overall = markdown.match(/overall\s*priority\s*[:\-]\s*(high|medium|low)\b/i)
  if (overall) {
    const v = overall[1].toLowerCase()
    if (v === 'high') {
      const currentHigh = sessions.some(
        (s) =>
          !s.isHistoricalOrTest &&
          (s.qualityClassification === 'risky' || s.priorityHint === 'high')
      )
      return currentHigh ? 'High' : 'Medium'
    }
    if (v === 'low') return 'Low'
    return 'Medium'
  }

  const currentIssues = sessions.filter((s) => !s.isHistoricalOrTest)
  if (currentIssues.some((s) => s.qualityClassification === 'risky')) {
    return 'High'
  }
  if (currentIssues.some((s) => s.qualityClassification === 'needs_improvement')) {
    return 'Medium'
  }
  // needs_data and possible_test_old are low — do not escalate
  if (
    sessions.every(
      (s) =>
        s.isHistoricalOrTest ||
        s.qualityClassification === 'good' ||
        s.qualityClassification === 'needs_data' ||
        s.qualityClassification === 'possible_test_old'
    )
  ) {
    return 'Low'
  }
  return 'Medium'
}

export async function generateSupervisorReport(options: {
  mode?: SupervisorReportMode | string
  range?: AdminAiDateRange | string
  createdBy?: string | null
}): Promise<SupervisorReportResult> {
  const mode = (
    [
      'review',
      'weak',
      'missing_courses',
      'risky',
      'route_mismatch',
      'stale_plan',
    ].includes(String(options.mode))
      ? options.mode
      : 'review'
  ) as SupervisorReportMode

  const range = parseAdminAiDateRange(
    typeof options.range === 'string' ? options.range : options.range || '7d'
  )

  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      configured: false,
      title: 'AI Supervisor Report',
      markdown: '',
      priority: 'Medium',
      error: 'AI provider is not configured yet.',
    }
  }

  const [{ brain, source: brainSource }, sessions, catalogue] = await Promise.all([
    getActiveSiteBrain(),
    getSupervisorSessions({
      range,
      limit: 20,
      completeOnly: false,
      includeTest: false,
      includeOld: mode === 'stale_plan' || mode === 'review',
      problemOnly: false,
    }),
    getAdminReportCatalogueContext(),
  ])

  let focusSessions = sessions.rows
  if (mode === 'route_mismatch' || mode === 'stale_plan') {
    const flagged = sessions.rows.filter(
      (r) =>
        !r.isHistoricalOrTest &&
        (r.qualityClassification === 'needs_improvement' ||
          r.qualityClassification === 'risky' ||
          r.status === 'possible_mismatch')
    )
    const historical = sessions.rows.filter((r) => r.isHistoricalOrTest)
    focusSessions =
      mode === 'stale_plan' && historical.length > 0
        ? historical
        : flagged.length > 0
          ? flagged
          : sessions.rows
  } else if (mode === 'weak') {
    const weakish = sessions.rows.filter(
      (r) => !r.isHistoricalOrTest && r.qualityClassification === 'needs_improvement'
    )
    focusSessions = weakish.length > 0 ? weakish : sessions.rows
  } else if (mode === 'missing_courses') {
    const missing = sessions.rows.filter((r) => {
      if (r.isHistoricalOrTest) return false
      if (r.qualityClassification === 'needs_data') return false
      if (r.isSecurityExtraIncomeRoute) {
        return r.hasSiaDoorSupervisorUpgrade === false
      }
      return r.qualityClassification === 'needs_improvement'
    })
    focusSessions = missing.length > 0 ? missing : sessions.rows
  }

  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  logSiteBrainLoaded('AI Supervisor', siteBrainMeta)
  const title = `AI Supervisor Report · ${MODE_LABELS[mode]}`

  const mismatchCount = sessions.rows.filter(
    (r) =>
      !r.isHistoricalOrTest &&
      (r.qualityClassification === 'needs_improvement' || r.status === 'possible_mismatch')
  ).length
  const historicalCount = sessions.rows.filter((r) => r.isHistoricalOrTest).length
  const goodCount = sessions.rows.filter((r) => r.qualityClassification === 'good').length
  const needsDataCount = sessions.rows.filter((r) => r.qualityClassification === 'needs_data').length
  const incompleteCount = sessions.rows.filter((r) => r.status === 'incomplete').length
  const completeCount = sessions.rows.filter((r) => r.status === 'complete').length

  const system = `You are JobAZ AI Supervisor — an internal quality reviewer for Career Assistant results.
You help the site owner spot weak advice, route/context mismatches, course gaps, and trust risks.
The human admin decides what to fix. Admin AI suggests only.

Follow Site Brain must-not-do and admin priorities.
Tone: clear, practical, UK-focused. No hype.

Site Brain guidance for AI Supervisor:
- Judge assistant outputs against JobAZ route logic from Site Brain.
- Recognise My Plan as the centre of the user journey.
- Flag fake providers, fake Apply Now, and unavailable courses shown as live.
- Separate old/test data from the current flow.
- Avoid marking everything as high priority.

${ROUTE_RUBRIC}

Hard rules:
- Do NOT invent session data, mismatches, or safety violations.
- Use only anonymised anonId / dates — never emails, names, or raw PII.
- If a field is "not_wired" or qualityClassification=needs_data, say the supervisor cannot fully verify — do NOT call it a weak recommendation.
- NEVER flag "no published course for Matchday Steward" — it is a work-now role.
- Put old/test/Design Engineer historical sessions under "Historical/test data to clean or ignore" with Low priority — never High.
- For needs_data sessions prefer: "These sessions appear incomplete from stored data. The supervisor cannot fully verify next upgrade or CV action yet."

${REPORT_FORMAT}`

  const user = `${brainBlock}

Mode: ${MODE_LABELS[mode]}
${modeFocus(mode)}

Date range: ${range}
Sessions available: ${sessions.available}
Session message: ${sessions.message || 'none'}
Counts in sample: complete=${completeCount}, incomplete=${incompleteCount}, good=${goodCount}, needs_data=${needsDataCount}, current_weak=${mismatchCount}, historical_or_test=${historicalCount}, total=${sessions.rows.length}

Pre-computed qualityClassification and priorityHint per session are authoritative hints — use them unless contradicted by evidence.

Focus sessions (anonymised):
${JSON.stringify(focusSessions.map(sessionForPrompt), null, 2)}

Full recent sample (anonymised, max 20):
${JSON.stringify(sessions.rows.map(sessionForPrompt), null, 2)}

Published courses sample (for "should have recommended" judgement — do not invent partners):
${JSON.stringify(catalogue.publishedCourses.slice(0, 30), null, 2)}

Course opportunities sample:
${JSON.stringify(catalogue.opportunities.slice(0, 20), null, 2)}

Catalogue notes:
${JSON.stringify(catalogue.notes, null, 2)}

Monitoring notes:
- applyClick is not wired at session level unless explicitly yes/no.
- Cross-page plan sync (Dashboard / Documents / CV Builder) is not fully server-monitored — say not wired yet unless supervisorFlag evidences a content mismatch inside the assessment result itself.

Write the AI Supervisor Report now.`

  const contextUsed = {
    mode,
    range,
    siteBrain: siteBrainMeta,
    sessionCount: sessions.rows.length,
    mismatchCount,
    needsDataCount,
    incompleteCount,
    sessions: sessions.rows.map(sessionForPrompt),
    catalogueNotes: catalogue.notes,
  }

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-supervisor',
      temperature: 0.3,
      maxTokens: 3200,
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
      }
    }

    if (!markdown.startsWith('# ')) {
      markdown = `# AI Supervisor Report\n\n${markdown}`
    }

    const priority = extractPriority(markdown, sessions.rows)
    const saved = await persistSupervisorReport({
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
    }
  }
}

async function persistSupervisorReport(params: {
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
      report_type: 'supervisor',
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
          report_type: 'supervisor',
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
