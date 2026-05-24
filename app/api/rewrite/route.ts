import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Formatting instruction for AI Preview output
const FORMATTING_INSTRUCTION = `CRITICAL FORMATTING REQUIREMENTS FOR OUTPUT:
- Rewrite using the same bullet structure as the input text
- Ensure the entire output is visually aligned and consistently indented
- Each bullet point must start with "• " (bullet character + one space)
- Wrapped lines must align exactly under the first letter of the sentence, not under the bullet
- Keep line spacing balanced and readable
- DO NOT add headers like "Revised Content", "Enhanced Content", "Certainly", or any introductory phrases
- Output only the formatted content directly, without any preface or explanation
- Maintain professional tone suitable for UI/UX or front-end developer CVs
- Focus on clean alignment, proper spacing, and professional wording
- Do not change the overall meaning—only correct spacing, structure, and wording`

const modeInstructions = {
  enhance: {
    prompt: 'Polish and professionalize the following bullet points. Keep them concise, impactful, and written in strong, natural English suitable for UI/UX or front-end developer CVs. Avoid repetition and make each line action-oriented. Focus on clarity, tighten verbs, and ensure the content is ATS-friendly. Maintain proper spacing, structure, and professional wording without changing the overall meaning.',
    system: 'You are a senior career writer specializing in enhancing CV content for UI/UX and front-end developers. Polish and professionalize bullet points to be concise, impactful, action-oriented, and written in strong, natural English. Keep it professional and suitable for technical design roles—focus on design systems, user experience, responsive design, accessibility, and technical implementation. Correct spacing, structure, and wording while preserving the overall meaning. Eliminate repetition while maintaining the core message. Write in English only.',
  },
  executive: {
    prompt: 'Rewrite this content in an executive tone suitable for C-level professionals and senior executives. Use powerful, confident language. Focus on strategic impact, scale, and measurable results. Emphasize leadership and board-level language.',
    system: 'You are an executive resume writer specializing in C-level and senior executive CVs. Write in English only, using executive-level language.',
  },
  creative: {
    prompt: 'Rewrite this content for a UI/UX or front-end developer portfolio. Use dynamic, engaging language that showcases design thinking, technical innovation, and user-centered solutions while maintaining professionalism. Focus on design systems, user experience, and technical implementation. Keep it professional with proper spacing, structure, and wording suitable for design roles.',
    system: 'You are a creative resume writer specializing in portfolios for UI/UX and front-end developers. Write in English only, balancing creativity with professionalism. Emphasize design systems, user experience, responsive design, accessibility, and technical skills while maintaining proper structure and spacing.',
  },
  academic: {
    prompt: 'Rewrite this content in a formal academic tone. Use precise, scholarly language, technical terminology, and formal structure suitable for academic positions, research roles, and teaching positions. Maintain neutrality and objectivity.',
    system: 'You are an academic resume writer specializing in CVs for researchers, academics, and educators. Write in English only, using formal academic language.',
  },
  quantify: {
    prompt: 'Add measurable metrics and achievements to this work experience description. Add specific numbers, percentages, timeframes, or ranges where logical and realistic. Use neutral language if exact numbers are not available (e.g., "significant", "multiple", "over X years"). Do not fabricate obvious numbers. Focus on impact and results.',
    system: 'You are an expert at quantifying career achievements. Add realistic metrics to experience descriptions. Write in English only, using neutral phrasing when exact numbers are unavailable.',
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { content: contentParam, text, mode } = body
    const content = contentParam || text

    console.log('[Rewrite] payload:', body)

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Content is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      const mockContent = `[MOCK ${mode}] Rewritten content:\n\n${content}`
      return NextResponse.json({ ok: true, content: mockContent })
    }

    const instruction = modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions.enhance

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `${instruction.system}\n\n${FORMATTING_INSTRUCTION}`,
        },
        {
          role: 'user',
          content: `${instruction.prompt}\n\n${FORMATTING_INSTRUCTION}\n\nOriginal content:\n${content}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const rewrittenContent = completion.choices[0]?.message?.content || ''
    const response = { ok: true, content: rewrittenContent }
    console.log('[Rewrite] response:', response)

    return NextResponse.json(response)
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to rewrite content. Please try again.')
    return NextResponse.json(body, { status })
  }
}
