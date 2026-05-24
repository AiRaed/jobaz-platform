import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Formatting instruction for AI Preview output
const FORMATTING_INSTRUCTION = `CRITICAL FORMATTING REQUIREMENTS FOR OUTPUT:
- Rewrite using the same bullet structure as the input text if bullets are present
- Ensure the entire output is visually aligned and consistently indented
- Each bullet point must start with "• " (bullet character + one space) if using bullets
- Wrapped lines must align exactly under the first letter of the sentence, not under the bullet
- Keep line spacing balanced and readable
- DO NOT add headers like "Revised Content", "Enhanced Content", "Certainly", or any introductory phrases
- Output only the formatted content directly, without any preface or explanation
- Maintain professional tone while focusing on clean alignment and formatting`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { letter, mode, text, tone, length, role, company, applicantName, keywords, jobTitle, jobDescription } = body

    console.log('[Cover Rewrite] payload:', body)

    // Special handling for tailor mode - text is optional (can generate from scratch)
    const isTailorMode = mode === 'tailor_cover_from_job'
    
    // Accept both 'letter' and 'text' for backward compatibility
    const letterText = letter || text

    if (!isTailorMode && (!letterText || letterText.trim().length === 0)) {
      return NextResponse.json({ ok: false, error: 'Text is required' }, { status: 400 })
    }
    
    if (isTailorMode && !jobTitle && !company) {
      return NextResponse.json({ ok: false, error: 'Job title or company is required for tailor mode' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        body: `[MOCK ${mode || tone || 'Professional'}] Rewritten cover letter:\n\n${letterText}`,
        letter: `[MOCK ${mode || tone || 'Professional'}] Rewritten cover letter:\n\n${letterText}`,
      })
    }

    const modeGuide: Record<string, string> = {
      'Enhance': 'improve clarity, impact, and professionalism while maintaining the original meaning',
      'Executive Tone': 'transform to executive-level strategic language with focus on leadership and business impact',
      'Creative Portfolio': 'adapt for creative industries with dynamic language and emphasis on creativity and innovation',
      'Academic Formal': 'convert to scholarly formal tone with emphasis on research, publications, and intellectual contributions',
      'Improve': 'refine and improve the cover letter body to be clearer, tighter, and better tailored to the role. Output must be exactly ONE single paragraph (3-5 sentences, maximum 180 words). Be concise and avoid unnecessary repetition. Do NOT use bullets, lists, headings, bold markers, or section labels. Do NOT include the candidate\'s full name inside the body. Tailor to the role and company if context is available. Replace vague claims with concrete, job-relevant achievements. Avoid clichés. Keep ATS-friendly wording. Return plain text only - no markdown, no formatting, no prefatory phrases like "Improved version:" or "Enhanced content:".',
      'Body Only': `Rewrite the following cover letter body only in professional, concise English (2–3 short paragraphs, maximum 180 words). Be concise and avoid unnecessary repetition.
Do NOT include any greeting, closing, signature, names, headings, markdown, bullets, or placeholders.
Return plain text only. Keep all real details; do not fabricate.`,
      'tailor_cover_from_job': 'generate or rewrite a professional cover letter body specifically tailored to the provided job. Use a clear, concise, polite tone and focus on why the candidate is a strong fit. Output must be 2–3 short paragraphs, maximum 180 words. Be concise and avoid unnecessary repetition. Do NOT include any greeting, closing, signature, names, headings, markdown, bullets, or placeholders. Return plain text only.',
    }

    const lengthGuide: Record<string, string> = {
      Short: '2-3 concise paragraphs',
      Medium: '3-4 paragraphs',
      Long: '4-5 comprehensive paragraphs',
    }

    const toneGuide: Record<string, string> = {
      Professional: 'formal and respectful',
      Friendly: 'warm and approachable while maintaining professionalism',
    }

    const rewriteMode = mode || tone || 'Enhance'
    const instruction = mode ? modeGuide[mode] : (toneGuide[tone || 'Professional'] || toneGuide['Professional'])

    // Special handling for "Improve", "Body Only", and "tailor_cover_from_job" modes - extract body only
    const isImproveMode = mode === 'Improve'
    const isBodyOnlyMode = mode === 'Body Only'
    
    // For ALL rewrite modes (Enhance, Executive Tone, Creative Portfolio, Academic Formal, Improve, Body Only, tailor_cover_from_job),
    // extract body from cover letter (remove greeting and signature)
    // This ensures we only work on the main paragraph content
    // For tailor mode, if letterText is empty, we'll generate from scratch
    let bodyText = letterText || ''
    if (bodyText) {
      // Remove greeting lines (e.g., "Dear Hiring Manager," or "Dear Hiring Committee,")
      bodyText = bodyText
        .replace(/^(Dear|Hello|Hi|Greetings).*?,\s*/gim, '')
        // Remove closing lines (e.g., "Sincerely," or signature lines with applicant name)
        .replace(/\s*(Sincerely|Best regards|Regards|Thank you|Thank you very much|Cordially|With appreciation),?\s*.*$/gim, '')
        .trim()
    }

    // Build job description/keywords context
    const jobSnippet = role ? (company ? `${role} at ${company}` : role) : (company || '')
    const jobKeywords = keywords || ''

    const systemPrompt = isImproveMode || isBodyOnlyMode || isTailorMode
      ? `You are a professional cover-letter writer. Produce body-only text (no greeting or sign-off). Write in clear, confident, professional English with a focus on clarity, professionalism, and relevance (no fluff). Maximum 180 words total. Be concise and avoid unnecessary repetition.
Prioritize specifics over buzzwords: convert duties into impact + metrics (e.g., "reduced load time by 28%"). If the user/job data lacks numbers, infer reasonable qualitative impact without inventing unverifiable facts.
Never include headings, placeholders, brackets, or explanations. No "Dear…", "Sincerely," names, or contact details. Plain paragraphs only.`
      : `You are an expert cover letter writer. Rewrite the following cover letter body text to ${instruction}. 
Do NOT include any greeting lines (e.g., "Dear Hiring Manager," or "Dear Hiring Committee,").
Do NOT include any closing lines (e.g., "Sincerely," or signature with applicant name).
Return ONLY the main paragraph content of the letter. Write in English only.\n\n${FORMATTING_INSTRUCTION}`

    const userPrompt = isTailorMode
      ? `You are an expert cover letter writer. ${bodyText ? 'Rewrite' : 'Generate'} a professional cover letter body tailored for the job below.

Job Title: ${jobTitle || 'Not provided'}
Company: ${company || 'Not provided'}
${jobDescription ? `Job Description: ${jobDescription.substring(0, 1500)}` : 'Job Description: Not provided'}

${bodyText ? `Current cover letter body to improve:\n${bodyText}\n\n` : ''}Requirements:
- Write 2–3 short paragraphs, maximum 180 words total
- Use a clear, concise, polite tone
- Focus on why the candidate is a strong fit for this specific job
- Reference specific job requirements and company if provided
- Be professional and avoid clichés
- Do NOT include greeting, closing, signature, names, headings, bullets, or placeholders
- Return plain text only

${bodyText ? 'Rewrite and improve the existing cover letter body to better match this job.' : 'Generate a new cover letter body from scratch tailored to this job.'}`
      : isImproveMode || isBodyOnlyMode
      ? `Improve the following cover-letter body only to be stronger and more specific for this role.

Maximum 180 words total, 2–3 concise paragraphs. Be professional, clear, and avoid repetition.

Focus on clarity, professionalism, and relevance. Tie my skills and achievements to the job requirements below.

Prefer outcomes and numbers; if not provided, use concrete, non-generic results (e.g., "cut review time from days to hours").

Keep my authentic voice; remove clichés and filler.

No greeting/sign-off/headings/placeholders; plain text only.
My body text:

${bodyText}

Job description/key needs (if any):

${jobSnippet}${jobKeywords ? `\n${jobKeywords}` : ''}`
      : `Rewrite this cover letter body text. Return ONLY the main paragraph content (no greeting, no closing, no signature).\n\n${FORMATTING_INSTRUCTION}\n\nBody text to rewrite:\n${bodyText}`

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
      temperature: 0.7,
      max_tokens: (isImproveMode || isBodyOnlyMode || isTailorMode) ? 250 : 1000,
    })

    const content = completion.choices[0]?.message?.content || ''

    return NextResponse.json({ ok: true, body: content, letter: content })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to rewrite cover letter. Please try again.')
    return NextResponse.json(body, { status })
  }
}

