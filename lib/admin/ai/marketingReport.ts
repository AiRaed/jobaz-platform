import { aiProvider } from '@/lib/jobaz-ai/providers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
} from './siteBrain'
import type { AdminAiPriority } from './types'

export type MarketingContentType =
  | 'Facebook Ad'
  | 'TikTok Script'
  | 'Email Campaign'
  | 'Landing Page Copy'
  | '5 Post Ideas'

export type MarketingReportResult = {
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

const ROUTE_KEYWORDS: Record<string, string[]> = {
  // Extra Income spans several practical UK start-now categories
  'Extra Income': [
    'extra income',
    'side',
    'part-time',
    'flexible',
    'gig',
    'steward',
    'security',
    'sia',
    'door supervisor',
    'security guard',
    'cctv',
    'first aid',
    'food safety',
    'food hygiene',
    'forklift',
    'warehouse',
    'logistics',
    'delivery',
    'courier',
    'taxi',
    'private hire',
    'hospitality',
    'care',
    'carer',
    'cleaning',
    'cleaner',
    'events',
    'event',
  ],
  Security: ['security', 'sia', 'door supervisor', 'cctv', 'security guard'],
  Care: ['care', 'health', 'social care', 'carer', 'support worker'],
  Construction: ['construction', 'cscs', 'site', 'builder'],
  Warehouse: ['warehouse', 'forklift', 'logistics', 'picking'],
  English: ['english', 'esol', 'language', 'ielts'],
  Digital: ['digital', 'it ', 'compTIA', 'coding', 'tech'],
  'Teaching Assistant': ['teaching assistant', 'ta ', 'tefl', 'classroom'],
  Other: [],
}

/** Practical route angles so the model does not fall into generic SaaS copy. */
const ROUTE_ANGLES: Record<string, string> = {
  'Extra Income': `Preferred Extra Income angles (use several):
- Need extra income in the UK?
- Find what you can start now.
- See which licence or short course can unlock better roles.
- Build a CV for that route.
- Apply with a clearer plan.
Name practical start-now work types when useful (stewarding, delivery, warehouse, care, security, hospitality, cleaning, events) — as route examples, not as guaranteed jobs.
If a published SIA course is in the catalogue context:
- You MAY say carefully: "If security is a good fit, your next step may be an SIA licence such as Door Supervisor."
- Only name a specific provider (e.g. Get Licensed) or "Apply Now" if that course is published AND has a live referral URL in the context.
- Do not claim guaranteed security work.
Avoid weak phrases like "flexible work options", "boost your income", "empower your career", "unlock your potential".`,

  Security: `Preferred Security angles:
- Want security work in the UK?
- See what SIA / door supervisor training may involve.
- Build a CV for security roles.
- Plan your next licence step with JobAZ.
Only name providers with live referral URLs from the catalogue context.`,

  Care: `Preferred Care angles:
- Looking into care or support work in the UK?
- See what training may help.
- Build a CV for care roles.
- Start with a clear plan, not guesswork.`,

  Construction: `Preferred Construction angles:
- Looking for construction / site work in the UK?
- See what CSCS or site tickets may help.
- Build a CV for construction roles.`,

  Warehouse: `Preferred Warehouse angles:
- Need warehouse / logistics work now?
- See if forklift or warehouse tickets help your next step.
- Build a CV for warehouse roles.`,

  English: `Preferred English angles:
- Improve English for UK work and study.
- Clear, practical next steps — not vague promises.
- Connect language goals to CV and jobs.`,

  Digital: `Preferred Digital angles:
- Want digital / IT skills for UK work?
- See practical course types (never invent CompTIA partners unless published).
- Build a CV for digital roles.`,

  'Teaching Assistant': `Preferred Teaching Assistant angles:
- Interested in classroom / TA work in the UK?
- See what training may help.
- Build a CV for education support roles.`,

  Other: `Use the selected route name clearly. Stay practical and UK-focused.`,
}

function audienceGuidance(audience: string): string {
  const a = audience.toLowerCase()
  if (a.includes('arabic')) {
    return `Audience is Arabic speakers in the UK.
- Write the main copy in clear, simple English (short sentences, everyday words).
- Speak directly to people looking for flexible work, extra income, or a clearer route into UK jobs.
- Optional: one short Arabic-style angle or bilingual hook idea in Audience note / Notes only (not required in the main ad body).
- Do not use slang that is hard for new arrivals.`
  }
  if (a.includes('new arrival')) {
    return `Audience is new arrivals to the UK. Keep English simple and practical. Emphasise start-now clarity, licences/training as next steps, and the JobAZ plan — never visa guarantees.`
  }
  if (a.includes('student')) {
    return `Audience is students. Emphasise flexible / part-time / next-step routes and CV readiness without promising income.`
  }
  if (a.includes('career chang')) {
    return `Audience is career changers. Emphasise clear route, training/licence steps, and CV rebuild.`
  }
  return `Speak directly to: ${audience}. Make the audience feel chosen — not generic "everyone".`
}

function formatOutputInstructions(contentType: MarketingContentType): string {
  const shared = `
Every output MUST include:
- A strong hook/headline that names the selected route theme (e.g. "extra income", "security", "care")
- Main copy that mentions JobAZ flow: Career Assistant → My Plan → Courses/Licences → CV → Jobs (natural wording OK)
- A clear CTA (prefer: Start your free career plan / Start with Career Assistant)
- Audience angle (who this is for)
- Compliance caution (admin-facing; not the ad body)
- Suggested image or video idea where relevant

Banned generic phrases: "flexible work options", "boost your income", "empower", "unlock your potential", "transform your career", "seamless experience".

Compliance caution default wording (use this when relevant courses exist):
"Only mention specific providers or offers when they are active in JobAZ. Do not guarantee jobs or income."
Never write "course/provider not confirmed yet" if the brief lists any relevant published courses.`

  switch (contentType) {
    case 'Facebook Ad':
      return `${shared}

Output markdown exactly:
# Facebook Ad

## Headline
(One line. Route-specific question or problem. Example style: "Need extra income in the UK?")

## Primary text
(3–6 short sentences. Practical. Name start-now route examples when relevant. Mention Career Assistant / My Plan / CV. Do NOT put "no published course" language here.)

## CTA
(Button-style. Example: "Start your free career plan")

## Audience note
(Who this ad is for — use the selected audience.)

## Compliance caution
(Admin only. ALWAYS use this wording style:
"Only mention specific providers or offers when they are active in JobAZ. Do not guarantee jobs or income."
Add provider names only if they appear in confirmed published courses with a live referral URL.
NEVER write "course/provider not confirmed yet" when at least one relevant published course is listed in the brief.)

## Suggested image/video idea
(One concrete creative idea for Facebook.)`

    case 'TikTok Script':
      return `${shared}

Output markdown exactly:
# TikTok Script

## Hook
(First 1–2 seconds — route-specific, spoken-style.)

## 15–30 second script
(Spoken lines. Practical. Mention JobAZ Career Assistant → plan → CV. No guarantees.)

## On-screen text
(3–6 short captions.)

## CTA
## Audience note
## Compliance caution
## Suggested image/video idea
(What to film / show on screen.)`

    case 'Email Campaign':
      return `${shared}

Output markdown exactly:
# Email Campaign

## Subject line
(Route-specific, not vague.)

## Preview text
## Email body
(Short paragraphs. Include JobAZ flow. Practical next step.)

## CTA
## Audience note
## Compliance caution
## Suggested image/video idea`

    case 'Landing Page Copy':
      return `${shared}

Output markdown exactly:
# Landing Page Copy

## Hero headline
(Route-specific.)

## Subheadline
(Audience + JobAZ clarity.)

## Benefits
(3–5 bullets: start-now routes, licence/training clarity, My Plan, CV, jobs — no guarantees.)

## CTA
## Audience note
## Trust/safety note
(User-facing trust; keep soft.)

## Compliance caution
(Admin-facing stricter rules.)

## Suggested image/video idea`

    case '5 Post Ideas':
      return `${shared}

Output markdown exactly:
# 5 Post Ideas

For each post 1–5:
## Post N
### Post title
### Angle
### Short copy
### CTA
### Audience note
### Compliance caution
### Suggested image/video idea

Vary angles (start-now work, licence next step, Career Assistant, My Plan, CV) — all route-specific.`
  }
}

function courseTypeHints(
  matched: Array<{ title: string; provider_name: string | null; referral_url: string | null }>
): string {
  if (!matched.length) {
    return `No matching published courses were found for this route in the catalogue pull.
In the PUBLIC ad copy: you may still mention course/licence TYPES in general (e.g. "SIA licence", "short course") without naming a provider.
Do NOT say "no course exists" or "we have no partners" inside Headline / Primary text / Script / Email body.
Compliance caution MUST still say:
"Only mention specific providers or offers when they are active in JobAZ. Do not guarantee jobs or income."
Do NOT use the phrase "course/provider not confirmed yet".`
  }

  const withReferral = matched.filter((c) => c.referral_url?.trim())
  const siaLike = matched.filter((c) =>
    /sia|door supervisor|security guard|cctv/i.test(
      `${c.title} ${c.provider_name || ''}`
    )
  )
  const lines = matched.slice(0, 10).map((c) => {
    const live = c.referral_url?.trim() ? 'live referral — may name provider / Apply Now' : 'published — course type only, no provider name'
    return `- ${c.title}${c.provider_name ? ` (${c.provider_name})` : ''} [${live}]`
  })

  return `Relevant published courses found for this route (${matched.length} match(es); ${withReferral.length} with live referral):
${lines.join('\n')}

IMPORTANT: Because published courses exist, Compliance caution must NOT say "course/provider not confirmed yet".
Use: "Only mention specific providers or offers when they are active in JobAZ. Do not guarantee jobs or income."

${
  siaLike.length
    ? `SIA / security matches available (${siaLike.length}). You MAY carefully say: "If security is a good fit, your next step may be an SIA licence such as Door Supervisor." Only name a provider or Apply Now if that row has a live referral URL.`
    : 'You may mention matching course types carefully.'
}

Never invent prices or discounts.`
}

async function loadCoursesForRoute(route: string): Promise<{
  matched: Array<{
    title: string
    provider_name: string | null
    referral_url: string | null
    category: string | null
  }>
  notes: string[]
}> {
  const notes: string[] = []
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    notes.push('Supabase not configured — no published courses loaded')
    return { matched: [], notes }
  }

  const { data, error } = await supabase
    .from('courses')
    .select('title, provider_name, referral_url, category, status')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) {
    notes.push(`courses: ${error.message}`)
    return { matched: [], notes }
  }

  const keywords = ROUTE_KEYWORDS[route] || [route.toLowerCase()]
  const rows = (data || []).map((c) => ({
    title: String((c as { title?: string }).title || ''),
    provider_name: (c as { provider_name?: string | null }).provider_name ?? null,
    referral_url: (c as { referral_url?: string | null }).referral_url ?? null,
    category: (c as { category?: string | null }).category ?? null,
  }))

  const matchesKeyword = (c: {
    title: string
    provider_name: string | null
    category: string | null
  }) => {
    if (!keywords.length) return false
    const hay = `${c.title} ${c.category || ''} ${c.provider_name || ''}`.toLowerCase()
    return keywords.some((k) => k.length > 2 && hay.includes(k.toLowerCase()))
  }

  const matched = rows.filter(matchesKeyword)

  // Dedupe by title+provider
  const seen = new Set<string>()
  const unique = matched.filter((c) => {
    const key = `${c.title.toLowerCase()}|${(c.provider_name || '').toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return Boolean(c.title.trim())
  })

  unique.sort((a, b) => {
    const ar = a.referral_url?.trim() ? 1 : 0
    const br = b.referral_url?.trim() ? 1 : 0
    if (br !== ar) return br - ar
    // Prefer SIA / security titles for Extra Income visibility
    const as = /sia|door supervisor|security/i.test(a.title) ? 1 : 0
    const bs = /sia|door supervisor|security/i.test(b.title) ? 1 : 0
    return bs - as
  })

  if (unique.length === 0) {
    notes.push(
      `No published course clearly matching route "${route}" in this catalogue pull. Compliance should still avoid inventing providers; use the standard active-provider wording.`
    )
  } else {
    notes.push(
      `Found ${unique.length} relevant published course(s) for "${route}". Do not say course/provider not confirmed.`
    )
  }

  return { matched: unique.slice(0, 15), notes }
}

export async function generateMarketingCopy(options: {
  route: string
  audience: string
  channel: string
  contentType: MarketingContentType | string
  createdBy?: string | null
}): Promise<MarketingReportResult> {
  const route = options.route || 'Extra Income'
  const audience = options.audience || 'general UK users'
  const channel = options.channel || 'Facebook'
  const contentType = (options.contentType || 'Facebook Ad') as MarketingContentType

  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      configured: false,
      title: `Marketing AI · ${contentType}`,
      markdown: '',
      priority: 'Medium',
      error: 'AI provider is not configured yet.',
    }
  }

  const [{ brain, source: brainSource }, courseCtx] = await Promise.all([
    getActiveSiteBrain(),
    loadCoursesForRoute(route),
  ])

  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  logSiteBrainLoaded('Marketing AI', siteBrainMeta)
  const formatBlock = formatOutputInstructions(contentType)
  const routeAngles = ROUTE_ANGLES[route] || ROUTE_ANGLES.Other
  const audienceBlock = audienceGuidance(audience)
  const courseHints = courseTypeHints(courseCtx.matched)

  const system = `You are JobAZ Marketing AI — an internal copywriter for a real UK careers product (not generic SaaS).
Follow Site Brain tone: clear, practical, supportive, UK-focused. Short sentences. Action-based. No hype.

Product funnel (weave into copy naturally):
Career Assistant → My Plan → Courses/Licences → CV → Jobs

Site Brain guidance for Marketing AI:
- Keep tone clear, practical, UK-focused.
- Market the route, not just random courses.
- Avoid job/income guarantees.
- Promote only real/published/approved provider offers if data confirms them.
- Otherwise say "recommended route" or "training type", not a fake provider.

Quality bar:
- The selected ROUTE must be obvious in the headline/hook and first sentence.
- The selected AUDIENCE must be reflected in wording and Audience note.
- Sound like a real UK Facebook/TikTok/email ad for people who need work clarity — not a startup landing page.
- Prefer concrete route examples over abstract "opportunities".

Hard safety rules:
- Do not guarantee jobs, income, visas, or outcomes.
- Do not invent course prices, discounts, or promotions.
- Do not invent affiliate approvals or official partnerships.
- Only name a provider if they appear in the confirmed published list with a live referral URL.
- If relevant published courses ARE listed in the brief: never say "course/provider not confirmed yet".
- Compliance caution preferred wording: "Only mention specific providers or offers when they are active in JobAZ. Do not guarantee jobs or income."
- Never invent metrics.

${formatBlock}`

  const user = `${brainBlock}

Marketing brief (MUST drive the copy):
- Route: ${route}
- Audience: ${audience}
- Channel: ${channel}
- Content type: ${contentType}

${routeAngles}

${audienceBlock}

${courseHints}

Catalogue notes:
${courseCtx.notes.join('\n') || 'None'}

Quality check before you finish:
1) Does the headline clearly fit "${route}"?
2) Would "${audience}" feel spoken to?
3) Does copy mention Career Assistant / My Plan / CV (or the funnel)?
4) Is it stronger than "flexible work options"?
5) Are guarantees and fake providers absent?

Write the ${contentType} now.`

  const contextUsed = {
    route,
    audience,
    channel,
    contentType,
    siteBrain: siteBrainMeta,
    matchedCourses: courseCtx.matched,
    notes: courseCtx.notes,
  }

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-marketing',
      temperature: 0.55,
      maxTokens: 2400,
    })

    let markdown = (completion.text || '').trim()
    if (!markdown) {
      return {
        ok: false,
        configured: true,
        title: `Marketing AI · ${contentType}`,
        markdown: '',
        priority: 'Medium',
        error: 'AI returned an empty response',
      }
    }

    if (!markdown.startsWith('# ')) {
      markdown = `# ${contentType}\n\n${markdown}`
    }

    const title = `Marketing AI · ${contentType}`
    const saved = await persistMarketingReport({
      title,
      input: contextUsed,
      markdown,
      priority: 'Medium',
      createdBy: options.createdBy || null,
    })

    return {
      ok: true,
      configured: true,
      title,
      markdown,
      priority: 'Medium',
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
      title: `Marketing AI · ${contentType}`,
      markdown: '',
      priority: 'Medium',
      error: e instanceof Error ? e.message : 'AI generation failed',
    }
  }
}

async function persistMarketingReport(params: {
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
      report_type: 'marketing',
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
          report_type: 'marketing',
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
