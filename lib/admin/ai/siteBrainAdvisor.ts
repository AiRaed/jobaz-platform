import { aiProvider } from '@/lib/jobaz-ai/providers'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  buildActiveSiteBrainContextBlock,
  getActiveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
} from './siteBrain'
import type { AdminAiPriority } from './types'

export type SiteBrainAdvisorMode =
  | 'ask'
  | 'launch_priorities'
  | 'business_risks'
  | 'dev_tasks'
  | 'user_scenario'

export type SiteBrainAdvisorResult = {
  ok: boolean
  configured: boolean
  title: string
  markdown: string
  priority: AdminAiPriority
  reportId?: string
  persistError?: string
  error?: string
  createdAt?: string
  mode: SiteBrainAdvisorMode
  siteBrain?: {
    version: number
    source: 'database' | 'defaults'
    updatedAt: string | null
    isActive: boolean
  }
}

const MODE_LABELS: Record<SiteBrainAdvisorMode, string> = {
  ask: 'Ask Site Brain',
  launch_priorities: 'Suggest Launch Priorities',
  business_risks: 'Review Business Risks',
  dev_tasks: 'Suggest Next Development Tasks',
  user_scenario: 'Test User Scenario',
}

const DEFAULT_SCENARIO =
  'User wants extra income, is interested in security/events, has no UK security experience, can work evenings and weekends.'

const REPORT_FORMAT = `Output markdown with exactly this structure:

# Site Brain Advisor

## Summary
Short practical answer for a solo founder.

## Why it matters
Why this matters for launch / revenue / user journey.

## Recommended actions
### High priority
Numbered list of concrete things to review, fix or test.
### Medium priority
Numbered list.
### Low priority
Numbered list.

## Priority
Overall: High | Medium | Low
(High = launch blocker, revenue blocker, safety/trust, or current user-flow problem.
Medium = important improvement.
Low = monitoring / later.)

## Can wait
What can safely wait until after soft launch.

## Suggested admin tasks
Numbered list of short task titles the founder can save to Admin Tasks.
Prefer the same items as High/Medium recommended actions when useful.

## Notes
Separate known facts (from Site Brain) from suggestions.
If metrics/providers/revenue/clicks are not in Site Brain, do not invent them.`

function modeInstruction(mode: SiteBrainAdvisorMode, question: string, scenario: string): string {
  switch (mode) {
    case 'launch_priorities':
      return `Action: Suggest Launch Priorities.
Based on the active Site Brain and current launch stage, suggest the top launch priorities.
Focus only on launch blockers, revenue blockers, user journey clarity and practical next actions.
Do not suggest big new features.`
    case 'business_risks':
      return `Action: Review Business Risks.
Review the current known risks and explain which ones matter most before soft launch.
Separate high, medium and low priority.`
    case 'dev_tasks':
      return `Action: Suggest Next Development Tasks.
Suggest the next development tasks for JobAZ based on the Site Brain.
Keep them practical for a solo founder.
Mark each task as Launch blocker, Should do before launch, or Can wait.`
    case 'user_scenario':
      return `Action: Strategic scenario test using Site Brain rules only.
This is NOT a live Career Assistant test and does not call Career Assistant code.
Scenario:
${scenario || DEFAULT_SCENARIO}

Answer with:
- expected route
- work-now roles
- next upgrade training
- CV focus
- course recommendation behaviour
- what must not be shown
- whether the current Site Brain rules are enough
Still use the required markdown sections above.`
    case 'ask':
    default:
      return `Action: Ask Site Brain.
Founder question:
${question || 'What should I improve before launch?'}

Answer the question using Site Brain as strategic memory.`
  }
}

function extractPriority(markdown: string): AdminAiPriority {
  const overall = markdown.match(
    /(?:overall\s*)?priority\s*[:\-]\s*(high|medium|low)\b/i
  )
  if (overall) {
    const v = overall[1].toLowerCase()
    if (v === 'high') return 'High'
    if (v === 'low') return 'Low'
  }
  return 'Medium'
}

async function persistAdvisorReport(params: {
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
      report_type: 'site_brain_advisor',
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
    if (/status|check|generated/i.test(error.message)) {
      const retry = await supabase
        .from('admin_ai_reports')
        .insert({
          report_type: 'site_brain_advisor',
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

export async function generateSiteBrainAdvisor(options: {
  mode?: SiteBrainAdvisorMode | string
  question?: string
  scenario?: string
  createdBy?: string | null
}): Promise<SiteBrainAdvisorResult> {
  const mode = (
    ['ask', 'launch_priorities', 'business_risks', 'dev_tasks', 'user_scenario'].includes(
      String(options.mode)
    )
      ? options.mode
      : 'ask'
  ) as SiteBrainAdvisorMode

  const title = `Site Brain Advisor · ${MODE_LABELS[mode]}`

  if (!aiProvider.isConfigured()) {
    return {
      ok: false,
      configured: false,
      title,
      markdown: '',
      priority: 'Medium',
      mode,
      error: 'AI provider is not configured yet.',
    }
  }

  const { brain, source: brainSource, message: brainMessage } = await getActiveSiteBrain()
  const siteBrainMeta = toSiteBrainLoadMeta(brain, brainSource)
  logSiteBrainLoaded('Site Brain Assistant', siteBrainMeta)
  const brainBlock = buildActiveSiteBrainContextBlock(brain, brainSource)
  const question = String(options.question || '').trim()
  const scenario = String(options.scenario || DEFAULT_SCENARIO).trim()

  if (mode === 'ask' && !question) {
    return {
      ok: false,
      configured: true,
      title,
      markdown: '',
      priority: 'Medium',
      mode,
      error: 'Enter a question in Ask Site Brain.',
      siteBrain: siteBrainMeta,
    }
  }

  const system = `You are the JobAZ Site Brain Assistant — a practical product/business/technical advisor for a solo founder.
You use Site Brain as strategic AI memory. You do not control the site automatically.
You suggest what the founder should review, fix or test. The founder decides.

Act like a small support team: product advisor, business advisor, technical checker, marketing strategist, affiliate helper, launch prioritisation assistant.

Hard rules:
- Do NOT invent metrics, clicks, users, revenue, providers, partnerships or course prices.
- Separate known facts from Site Brain vs your suggestions.
- Do not suggest big new features before launch unless they solve a launch blocker.
- Do not claim Career Assistant or live user tools were executed.
- For user_scenario mode: strategic Site Brain rules test only — not a live Career Assistant run.
- Keep answers practical, prioritised, UK-focused, honest, no hype.
- Admin AI suggests; founder decides.

${REPORT_FORMAT}`

  const user = `${brainBlock}

${brainMessage ? `Site Brain note: ${brainMessage}` : ''}

${modeInstruction(mode, question, scenario)}

Write the Site Brain Advisor response now.`

  const contextUsed = {
    mode,
    question: mode === 'ask' ? question : null,
    scenario: mode === 'user_scenario' ? scenario : null,
    siteBrain: siteBrainMeta,
  }

  try {
    const completion = await aiProvider.generateText({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      modelTier: 'quality',
      feature: 'admin/ai-site-brain-advisor',
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
        mode,
        error: 'AI returned an empty response',
      }
    }

    if (!markdown.startsWith('# ')) {
      markdown = `# Site Brain Advisor\n\n${markdown}`
    }

    const priority = extractPriority(markdown)
    const saved = await persistAdvisorReport({
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
      mode,
      siteBrain: siteBrainMeta,
    }
  } catch (e) {
    return {
      ok: false,
      configured: true,
      title,
      markdown: '',
      priority: 'Medium',
      mode,
      error: e instanceof Error ? e.message : 'AI generation failed',
      siteBrain: siteBrainMeta,
    }
  }
}

export { DEFAULT_SCENARIO, MODE_LABELS }
