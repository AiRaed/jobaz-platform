import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const PROOFREAD_SYSTEM = `You are a professional English proofreader. Your task:

1. Identify ALL errors in the text: grammar, spelling, subject-verb agreement, articles (a/an/the), tense, collocation, word form, punctuation, and repetition. Do not skip any error.
2. Correct every error to produce corrected_text. Preserve the author's meaning and tone.
3. Produce improved_text: same corrections plus clearer, more natural phrasing and flow.
4. List EVERY change in the issues array: one entry per error/correction. If there are 10 errors, issues must have 10 items. type must be one of: grammar, spelling, clarity, style, repetition. Include original phrase, correction, and a short explanation.
5. Set confidence_score 0-100 based on how confident you are in your analysis (only 90+ if the text had no or very few errors).

Return ONLY valid JSON. No markdown, no code fences, no extra text. Use this exact structure:
{"corrected_text":"...","improved_text":"...","issues":[{"type":"grammar","original":"...","correction":"...","explanation":"..."}],"confidence_score":0-100}

Rules:
- corrected_text: full text with every error fixed.
- improved_text: full text with errors fixed AND clarity/flow improved.
- issues: array of ALL changes; never return an empty array when the input contains errors.
- confidence_score: integer 0-100; high only when the text was already correct.
- Output valid JSON only. No trailing commas. Escape quotes inside strings.`

const MAX_INPUT_CHARS = 12000
const MAX_OUTPUT_TOKENS = 4096

const ENABLE_LLM_PROOFREAD = process.env.NEXT_PUBLIC_ENABLE_LLM_PROOFREAD === 'true'

export async function POST(req: NextRequest) {
  try {
    if (!ENABLE_LLM_PROOFREAD) {
      return NextResponse.json(
        { ok: false, error: 'AI Proofread (LLM) is temporarily disabled.' },
        { status: 503 }
      )
    }

    const cookieStore = cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore
          }
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const raw = (body.content ?? body.text ?? '').trim()
    if (!raw) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Proofreading AI] LLM INPUT: (empty - rejected)')
      }
      return NextResponse.json(
        { ok: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    const content = raw.length > MAX_INPUT_CHARS ? raw.slice(0, MAX_INPUT_CHARS) + '\n\n[...truncated]' : raw
    if (process.env.NODE_ENV === 'development') {
      console.log('[Proofreading AI] LLM INPUT length:', content.length, 'first 200 chars:', content.slice(0, 200))
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: 'OpenAI API key not configured. AI Proofread is unavailable.',
        },
        { status: 503 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROOFREAD_SYSTEM },
        { role: 'user', content: `Proofread and improve the following text. Identify ALL grammar, spelling, agreement, tense, article, collocation, and repetition errors. List every change in the issues array. Return only the JSON object.\n\n${content}` },
      ],
      temperature: 0.3,
      max_tokens: MAX_OUTPUT_TOKENS,
    })

    const rawContent = completion.choices[0]?.message?.content?.trim() ?? ''
    if (process.env.NODE_ENV === 'development') {
      console.log('[Proofreading AI] LLM RAW RESPONSE length:', rawContent.length, 'preview:', rawContent.slice(0, 300))
    }

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0]! : rawContent

    let parsed: {
      corrected_text?: string
      improved_text?: string
      issues?: Array<{ type?: string; original?: string; correction?: string; explanation?: string }>
      confidence_score?: number
    }
    try {
      parsed = JSON.parse(jsonStr) as typeof parsed
    } catch (parseErr) {
      const errMsg = parseErr instanceof Error ? parseErr.message : 'Invalid JSON'
      if (process.env.NODE_ENV === 'development') {
        console.error('[Proofreading AI] JSON parse error:', errMsg, 'raw:', rawContent.slice(0, 500))
      }
      return NextResponse.json(
        {
          ok: false,
          error: `AI returned invalid JSON: ${errMsg}. Please try again.`,
          raw_preview: rawContent.slice(0, 500),
        },
        { status: 502 }
      )
    }

    const corrected_text = typeof parsed.corrected_text === 'string' ? parsed.corrected_text : content
    const improved_text = typeof parsed.improved_text === 'string' ? parsed.improved_text : corrected_text
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues
          .filter((i) => i && (i.original != null || i.correction != null))
          .map((i) => ({
            type: ['grammar', 'spelling', 'clarity', 'style', 'repetition'].includes(String(i.type ?? '').toLowerCase())
              ? String(i.type).toLowerCase()
              : 'grammar',
            original: String(i.original ?? ''),
            correction: String(i.correction ?? ''),
            explanation: String(i.explanation ?? ''),
          }))
      : []
    const confidence_score = typeof parsed.confidence_score === 'number'
      ? Math.min(100, Math.max(0, Math.round(parsed.confidence_score)))
      : 50

    return NextResponse.json({
      ok: true,
      corrected_text,
      improved_text,
      issues,
      confidence_score,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI proofread failed'
    console.error('[Proofreading AI]', err)
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}
