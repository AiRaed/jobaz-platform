import { aiProvider } from '@/lib/jobaz-ai/providers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { AdminAiDateRange } from './dateRange'
import { parseAdminAiDateRange, rangeStartIso } from './dateRange'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
} from './siteBrain'
import { getAffiliateProviderSummary } from './metrics'
import { AFFILIATE_PRIORITY_ROUTES, type AdminAiPriority } from './types'
import { getAffiliateRouteDefaultPriority, ADMIN_AI_PRIORITY_GUIDE } from './priorityGuide'

export type AffiliateScoutMode =
  | 'suggest'
  | 'tasks'
  | 'missing'
  | 'prioritise'

export type AffiliateScoutResult = {
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

const MODE_LABELS: Record<AffiliateScoutMode, string> = {
  suggest: 'Suggest Affiliate Programmes',
  tasks: 'Create Affiliate Tasks',
  missing: 'Find Missing Providers by Route',
  prioritise: 'Prioritise Providers',
}

async function loadAffiliateContext(range: AdminAiDateRange) {
  const notes: string[] = []
  const summary = await getAffiliateProviderSummary()
  const supabase = getAdminCoursesSupabase()

  let providers: Array<{
    name: string
    affiliate_status: string | null
    account_status: string | null
  }> = []
  let publishedCourses: Array<{
    title: string
    provider_name: string | null
    referral_url: string | null
    category: string | null
  }> = []
  let opportunities: Array<{
    course_name: string
    opportunity_status: string | null
    publish_status: string | null
    providers: Array<{
      provider_name: string
      affiliate_status: string | null
      referral_url: string | null
    }>
  }> = []
  let recentClicks: Array<{
    course_id: string | null
    provider_name: string | null
    clicked_at: string | null
  }> = []

  if (!supabase) {
    notes.push('Supabase service role not configured — limited context')
    return { summary, providers, publishedCourses, opportunities, recentClicks, notes }
  }

  const [providersRes, coursesRes, oppsRes, clickRes] = await Promise.all([
    supabase
      .from('providers')
      .select('name, affiliate_status, account_status')
      .limit(80),
    supabase
      .from('courses')
      .select('title, provider_name, referral_url, category, status')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(80),
    supabase
      .from('course_opportunities')
      .select('id, course_name, opportunity_status, publish_status')
      .order('updated_at', { ascending: false })
      .limit(40),
    (() => {
      let q = supabase
        .from('course_clicks')
        .select('course_id, provider_name, clicked_at')
        .order('clicked_at', { ascending: false })
        .limit(40)
      const start = rangeStartIso(range)
      if (start) q = q.gte('clicked_at', start)
      return q
    })(),
  ])

  if (providersRes.error) notes.push(`providers: ${providersRes.error.message}`)
  else {
    providers = (providersRes.data || []).map((p) => ({
      name: String((p as { name?: string }).name || ''),
      affiliate_status: (p as { affiliate_status?: string | null }).affiliate_status ?? null,
      account_status: (p as { account_status?: string | null }).account_status ?? null,
    }))
  }

  if (coursesRes.error) notes.push(`courses: ${coursesRes.error.message}`)
  else {
    publishedCourses = (coursesRes.data || []).map((c) => ({
      title: String((c as { title?: string }).title || ''),
      provider_name: (c as { provider_name?: string | null }).provider_name ?? null,
      referral_url: (c as { referral_url?: string | null }).referral_url ?? null,
      category: (c as { category?: string | null }).category ?? null,
    }))
  }

  if (oppsRes.error) {
    notes.push(`course_opportunities: ${oppsRes.error.message}`)
  } else {
    const oppRows = oppsRes.data || []
    const ids = oppRows.map((o) => String((o as { id: string }).id))
    let providerRows: Array<Record<string, unknown>> = []
    if (ids.length) {
      const pr = await supabase
        .from('course_opportunity_providers')
        .select('opportunity_id, provider_name, affiliate_status, referral_url')
        .in('opportunity_id', ids)
      if (!pr.error) providerRows = (pr.data || []) as Array<Record<string, unknown>>
    }

    opportunities = oppRows.map((o) => {
      const id = String((o as { id: string }).id)
      const linked = providerRows.filter((p) => String(p.opportunity_id) === id)
      return {
        course_name: String((o as { course_name?: string }).course_name || ''),
        opportunity_status:
          (o as { opportunity_status?: string | null }).opportunity_status ?? null,
        publish_status: (o as { publish_status?: string | null }).publish_status ?? null,
        providers: linked.map((p) => ({
          provider_name: String(p.provider_name || ''),
          affiliate_status: (p.affiliate_status as string | null) ?? null,
          referral_url: (p.referral_url as string | null) ?? null,
        })),
      }
    })
  }

  if (clickRes.error) {
    notes.push(`course_clicks: ${clickRes.error.message} (not wired yet or unavailable)`)
  } else {
    recentClicks = (clickRes.data || []).map((c) => ({
      course_id: (c as { course_id?: string | null }).course_id ?? null,
      provider_name: (c as { provider_name?: string | null }).provider_name ?? null,
      clicked_at: (c as { clicked_at?: string | null }).clicked_at ?? null,
    }))
  }

  return { summary, providers, publishedCourses, opportunities, recentClicks, notes, range }
}

function modeFocus(mode: AffiliateScoutMode): string {
  switch (mode) {
    case 'suggest':
      return 'Focus on suggesting affiliate programme TYPES and search targets for missing routes. Emphasise Suggested affiliate targets and Priority gaps.'
    case 'tasks':
      return 'Focus on producing a strong numbered Actions to create list that the admin can save as tasks. Emphasise concrete next steps.'
    case 'missing':
      return 'Focus on Find Missing Providers by Route — detail every priority route gap with keywords and next actions.'
    case 'prioritise':
      return 'Focus on Prioritise Providers — rank gaps High/Medium/Low using Site Brain admin priorities and coverage data.'
  }
}

const REPORT_FORMAT = `Output markdown with exactly this structure:

# Affiliate Scout Report

## Current provider coverage
Summarise active/pending providers and published partner courses from the data provided.
If a field is missing, say "not wired yet".

## Priority gaps
For each missing or weak route, use this block:

### Route: <route name>
- Missing course/provider type:
- Why it matters:
- Suggested search keywords:
- Priority: High | Medium | Low
- Suggested next action:

Cover these priority routes when relevant/missing (use suggestedPriority from data when present):
${AFFILIATE_PRIORITY_ROUTES.map(
  (r) => `- ${r} (default ${getAffiliateRouteDefaultPriority(r)})`
).join('\n')}

## Suggested affiliate targets
List provider TYPES / search targets — not fake partnerships.
Examples of the style to use:
- CSCS training providers with affiliate/referral programmes
- Forklift training providers
- First Aid / Food Safety e-learning providers
- Care training providers
- TEFL / Teaching Assistant course providers
- IT / CompTIA course marketplaces

Only name a specific company if it already appears in the database context as a provider/course/opportunity.
Otherwise describe as a search target (e.g. "search: UK CSCS affiliate programme").

## Actions to create
Numbered list of actionable admin tasks (8 max). Examples of style:
1. Apply to CSCS training affiliate programme (High)
2. Find Forklift training provider with referral option (High)
3. Verify Get Licensed SIA referral tracking (Medium)
4. Add Food Safety provider to course opportunities (Medium)
5. Check UKPDA care course links (Low)

Put (High)/(Medium)/(Low) at the end of each action line when possible.

## Notes
Data gaps, not-wired sources, and research needed.`

export async function generateAffiliateScoutReport(options: {
  mode?: AffiliateScoutMode | string
  range?: AdminAiDateRange | string
  createdBy?: string | null
}): Promise<AffiliateScoutResult> {
  const mode = (['suggest', 'tasks', 'missing', 'prioritise'].includes(String(options.mode))
    ? options.mode
    : 'suggest') as AffiliateScoutMode
  const range = parseAdminAiDateRange(
    typeof options.range === 'string' ? options.range : options.range || '7d'
  )

  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      configured: false,
      title: 'Affiliate Scout Report',
      markdown: '',
      priority: 'Medium',
      error: 'AI provider is not configured yet.',
    }
  }

  const [{ brain, source: brainSource }, ctx] = await Promise.all([
    getActiveSiteBrain(),
    loadAffiliateContext(range),
  ])

  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  logSiteBrainLoaded('Affiliate Scout', siteBrainMeta)
  const title = `Affiliate Scout · ${MODE_LABELS[mode]}`

  const system = `You are JobAZ Affiliate Scout — an internal research assistant for the site owner.
You find affiliate/provider gaps and suggest research actions. The human admin decides.

Follow Site Brain affiliate rules and admin priorities.
Tone: clear, practical, UK-focused.

Site Brain guidance for Affiliate Scout:
- Prioritise high-intent UK routes: SIA/Security, CSCS/Construction, Care, First Aid/Food Safety, Forklift/Warehouse, TEFL/Teaching Assistant, Digital/IT, AAT/Bookkeeping.
- Classify priorities:
  High = launch/revenue blocker or priority route gap
  Medium = useful but not immediate
  Low = future or monitoring
- Do not invent providers as approved.

Hard rules:
- Do NOT invent approved partnerships.
- Do NOT say JobAZ is partnered with a provider unless affiliate_status/account_status is clearly active/approved in the data.
- Do NOT invent commission rates, approval status, or revenue.
- You MAY suggest search keywords and provider TYPES.
- You MAY say "look for affiliate programme" / "search target".
- You MAY name a provider only if it already appears in the database context (providers, published courses, opportunities).
- If demand/click data is missing, say "not wired yet" or "needs manual research".
- Priority logic (default — do NOT mark every missing route High):
  High = CSCS/Construction, First Aid/Food Safety, Forklift/Warehouse gaps (or missing referral URL on an opportunity that blocks revenue).
  Medium = TEFL/Teaching Assistant, IT/CompTIA/Digital, AAT/Bookkeeping gaps.
  Low / Check = verify existing active providers (e.g. Get Licensed for SIA, UKPDA for Care) — not automatic High.
  Raise priority only if real click/demand data supports it; if demand is not wired yet, say so.
  Shared meaning: High = ${ADMIN_AI_PRIORITY_GUIDE.High}. Medium = ${ADMIN_AI_PRIORITY_GUIDE.Medium}. Low = ${ADMIN_AI_PRIORITY_GUIDE.Low}.
  Never escalate old/test/historical noise to High.

${REPORT_FORMAT}`

  const user = `${brainBlock}

Mode: ${MODE_LABELS[mode]}
${modeFocus(mode)}

Date range for clicks (if available): ${range}

Priority routes from Site Brain / catalogue:
${AFFILIATE_PRIORITY_ROUTES.join(', ')}

Provider summary:
${JSON.stringify(ctx.summary, null, 2)}

Providers sample:
${JSON.stringify(ctx.providers.slice(0, 40), null, 2)}

Published courses sample:
${JSON.stringify(ctx.publishedCourses.slice(0, 40), null, 2)}

Course opportunities tracker sample:
${JSON.stringify(ctx.opportunities.slice(0, 30), null, 2)}

Recent course clicks (${range}):
${JSON.stringify(ctx.recentClicks.slice(0, 30), null, 2)}

Context notes:
${ctx.notes.join('\n') || 'None'}

Write the Affiliate Scout Report now.`

  const contextUsed = {
    mode,
    range,
    siteBrain: siteBrainMeta,
    summary: ctx.summary,
    providerCount: ctx.providers.length,
    publishedCourseCount: ctx.publishedCourses.length,
    opportunityCount: ctx.opportunities.length,
    clickCount: ctx.recentClicks.length,
    notes: ctx.notes,
  }

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-affiliate-scout',
      temperature: 0.35,
      maxTokens: 2800,
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
      markdown = `# Affiliate Scout Report\n\n${markdown}`
    }

    const highGaps = (markdown.match(/Priority:\s*High/gi) || []).length
    const priority: AdminAiPriority = highGaps >= 3 ? 'High' : 'Medium'

    const saved = await persistAffiliateScoutReport({
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

async function persistAffiliateScoutReport(params: {
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
      report_type: 'affiliate_scout',
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
          report_type: 'affiliate_scout',
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
