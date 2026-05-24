import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface CoverLetterRequest {
  fullName: string
  email?: string
  phone?: string
  recipientName?: string
  company?: string
  roleTitle: string
  keywords?: string
  tone: 'Professional' | 'Friendly'
  length: 'Short' | 'Medium' | 'Long'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      fullName,
      email,
      phone,
      recipientName,
      company,
      roleTitle,
      keywords,
      tone = 'Professional',
      length = 'Medium',
    }: CoverLetterRequest = body

    console.log('[Cover] payload:', body)

    if (!fullName || !roleTitle) {
      return NextResponse.json(
        { ok: false, error: 'Full name and role title are required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      const mockContent = `Dear ${recipientName || 'Hiring Manager'},

I am writing to express my interest in the ${roleTitle} position${company ? ` at ${company}` : ''}.

With a strong background in ${keywords || 'the relevant field'}, I am confident that I would be a valuable addition to your team. My experience has equipped me with the skills necessary to excel in this role.

I am excited about the opportunity to contribute to your organization and would welcome the chance to discuss how my qualifications align with your needs.

Sincerely,
${fullName}
${[email, phone].filter(Boolean).join(' · ')}`
      return NextResponse.json({ ok: true, content: mockContent })
    }

    const lengthGuide = {
      Short: '2-3 concise paragraphs',
      Medium: '3-4 paragraphs',
      Long: '4-5 comprehensive paragraphs',
    }

    const toneGuide = {
      Professional: 'formal and respectful',
      Friendly: 'warm and approachable while maintaining professionalism',
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert cover letter writer. Write professional cover letters in English only. Follow these strict rules:
1. Begin with exactly ONE greeting: "Dear ${recipientName || 'Hiring Manager'},"
2. Write ${lengthGuide[length]} addressing the role and company
3. Use a ${toneGuide[tone]} tone
4. End with exactly ONE signature: "${tone === 'Professional' ? 'Sincerely' : 'Best regards'},"
5. Never include placeholders or duplicate greetings/signatures
6. English only`,
        },
        {
          role: 'user',
          content: `Write a ${length.toLowerCase()} cover letter in ${tone.toLowerCase()} tone for:
- Candidate: ${fullName}${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}
- Position: ${roleTitle}${company ? ` at ${company}` : ''}${keywords ? `\n- Keywords: ${keywords}` : ''}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const content = completion.choices[0]?.message?.content || ''

    // Ensure proper greeting and signature
    const normalized = content
      .replace(/^Dear .+?,/m, `Dear ${recipientName || 'Hiring Manager'},`)
      .replace(/^(Sincerely|Best regards|Best regards|Regards|Yours truly),?\s*$/m, 
        `${tone === 'Professional' ? 'Sincerely' : 'Best regards'},`)

    const response = { ok: true, content: normalized }
    console.log('[Cover] response:', response)

    return NextResponse.json(response)
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to generate cover letter. Please try again.')
    return NextResponse.json(body, { status })
  }
}
