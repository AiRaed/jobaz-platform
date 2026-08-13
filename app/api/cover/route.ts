import { NextResponse } from 'next/server'
import { aiProvider } from '@/lib/jobaz-ai/providers'
import { enforceAiUsageLimit } from '@/lib/ai-usage/guard'

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

    if (!aiProvider.isConfigured()) {
      console.warn('[AI MOCK] no AI provider configured')
      const mockContent = `Dear ${recipientName || 'Hiring Manager'},

I am writing to express my interest in the ${roleTitle} position${company ? ` at ${company}` : ''}.

With a strong background in ${keywords || 'the relevant field'}, I am confident that I would be a valuable addition to your team. My experience has equipped me with the skills necessary to excel in this role.

I am excited about the opportunity to contribute to your organization and would welcome the chance to discuss how my qualifications align with your needs.

Sincerely,
${fullName}
${[email, phone].filter(Boolean).join(' · ')}`
      return NextResponse.json({ ok: true, content: mockContent })
    }

    const usageGate = await enforceAiUsageLimit(req, 'cover_letter', 'generate-letter')
    if (!usageGate.allowed) return usageGate.response

    const lengthGuide = {
      Short: '2-3 concise paragraphs',
      Medium: '3-4 paragraphs',
      Long: '4-5 comprehensive paragraphs',
    }

    const toneGuide = {
      Professional: 'formal and respectful',
      Friendly: 'warm and approachable while maintaining professionalism',
    }

    const completion = await aiProvider.generateText({
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
      modelTier: 'quality',
      temperature: 0.7,
      maxTokens: 800,
      feature: 'cover',
    })

    const content = completion.text || ''

    const normalized = content
      .replace(/^Dear .+?,/m, `Dear ${recipientName || 'Hiring Manager'},`)
      .replace(/^(Sincerely|Best regards|Best regards|Regards|Yours truly),?\s*$/m, 
        `${tone === 'Professional' ? 'Sincerely' : 'Best regards'},`)

    const response = { ok: true, content: normalized }
    console.log('[Cover] response:', response)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to generate cover letter. Please try again.' },
      { status: 500 }
    )
  }
}
