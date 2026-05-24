import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface GenerateRequest {
  applicantName: string
  recipientName?: string
  company?: string
  cityState?: string
  role?: string
  mode: 'Executive' | 'Creative' | 'Academic' | 'Technical' | 'Body Only'
  keywords: string
  industry?: string
  topSkills?: string
  experienceSnippet?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      applicantName,
      recipientName,
      company,
      cityState,
      role,
      mode = 'Executive',
      keywords,
      industry,
      topSkills,
      experienceSnippet,
    }: GenerateRequest = body

    console.log('[Cover Generate] payload:', body)

    if (!keywords || keywords.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Keywords are required' },
        { status: 400 }
      )
    }

    const isBodyOnlyMode = mode === 'Body Only'

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      {
        // Simple mock that respects body-only + brevity; capped at ~180 words
        const mock = `With a strong background in ${keywords}, I bring a track record of delivering measurable results in ${role || 'the role'}${company ? ` at ${company}` : ''}. I have led initiatives that improved quality, efficiency and stakeholder outcomes, working cross‑functionally and communicating clearly with technical and non‑technical teams.

I am motivated by ownership and high standards, and I adapt quickly to new domains. I am confident I can add value from day one by focusing on priorities, simplifying complex problems and following through.`
        return NextResponse.json({ ok: true, body: mock.trim(), letter: mock.trim() })
      }
    }

    const modeGuide: Record<string, string> = {
      Executive: 'professional and strategic tone, focus on leadership and business impact',
      Creative: 'dynamic and engaging tone, highlight creativity and innovation',
      Academic: 'formal scholarly tone, emphasize research and intellectual contributions',
      Technical: 'precise and technical tone, focus on technical expertise and problem-solving',
    }

    const location = cityState ? ` in ${cityState}` : ''

    // Handle Body Only mode
    if (isBodyOnlyMode) {
      const roleTitle = role || 'the position'
      const industryText = industry || 'the industry'
      const keywordsList = keywords.split(',').map(k => k.trim()).join(', ')
      const candidateHighlights = topSkills || experienceSnippet || keywordsList

      const systemPrompt = `You are a professional cover-letter writer. Output body-only text in UK English: no greeting, no sign-off, no name. Use 2–3 short paragraphs, natural and confident. Strictly maximum 180 words. Focus on achievements and role fit; avoid repetition or filler.
Prioritise specifics over buzzwords (e.g., "reduced load time by 28%"). If data lacks numbers, infer subtle, plausible qualitative impact without inventing unverifiable facts. No headings, placeholders, brackets, bullet points, or explanations.`

      const userPrompt = `Write only the cover-letter body tailored to the role below.

Rules:
- UK English
- 2–3 short paragraphs
- ≤ 180 words total
- No greeting, sign-off, names, headings, bullets, or placeholders
- Natural, confident tone; focus on achievements and fit; avoid repetition

Role & keywords: ${roleTitle}${company ? ` at ${company}` : ''} (${keywordsList})
My relevant experience (bullets or sentences):

${candidateHighlights}`

      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 260,
      })

      let body = (completion.choices[0]?.message?.content || '').trim()
      // Enforce body-only and word limit defensively
      body = body.replace(/^Dear\s+[^,]+,?\s*\n?/gim, '')
      body = body.replace(/\s*(Sincerely|Best regards|Regards|Respectfully|Thank you|Cordially|With appreciation),?\s*$/gim, '')
      const words = body.split(/\s+/).filter(Boolean)
      if (words.length > 180) {
        body = words.slice(0, 180).join(' ')
      }
      // Normalise to 2–3 paragraphs max
      const paras = body.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
      if (paras.length > 3) {
        body = paras.slice(0, 3).join('\n\n')
      }
      return NextResponse.json({ ok: true, body: body.trim(), letter: body.trim() })
    }

    const systemPrompt = `You are an expert cover-letter writer. Output BODY-ONLY text in UK English: no greeting, no sign-off, no name. Use a ${modeGuide[mode]} tone (${mode.toLowerCase()} style). Follow strictly:
1) 2–3 short paragraphs
2) Maximum 180 words total
3) Focus on achievements and fit for the role; avoid repetition and filler
4) Mention the company if provided; no headings, bullets, or placeholders`

    const userPrompt = `Write only the body of a cover letter tailored to ${role || 'the position'}${company ? ` at ${company}` : ''}${location}.

Key expertise areas to highlight: ${keywords}

Constraints:
- UK English; 2–3 short paragraphs; ≤ 180 words total
- No greeting, sign-off, names, headings, bullets, or placeholders
- Natural, confident tone; emphasise measurable impact and role fit
${company ? `\nCompany context: ${company}` : ''}
${role ? `\nPosition: ${role}` : ''}`

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 300,
    })

    let letter = (completion.choices[0]?.message?.content || '').trim()

    // Clean up excessive spacing and ensure body-only output
    let cleanedBody = letter
      .replace(/^Dear\s+[^,]+,?\s*\n?/gim, '')
      .replace(/\s*(Sincerely|Best regards|Regards|Respectfully|Thank you|Cordially|With appreciation),?\s*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Enforce 180-word cap and 2–3 paragraphs defensively
    const w = cleanedBody.split(/\s+/).filter(Boolean)
    if (w.length > 180) {
      cleanedBody = w.slice(0, 180).join(' ')
    }
    const ps = cleanedBody.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    if (ps.length > 3) {
      cleanedBody = ps.slice(0, 3).join('\n\n')
    }

    const response = { ok: true, letter: cleanedBody }
    console.log('[Cover Generate] response length:', cleanedBody.length)

    return NextResponse.json(response)
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to generate cover letter. Please try again.')
    return NextResponse.json(body, { status })
  }
}
