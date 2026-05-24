import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'
import { normalizeSummaryParagraph, stripPlaceholders } from '@/lib/normalize'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { keywords, personal, summaryMd, experience, education, skills, layout, lang = 'en' } = body

    console.log('[Generate] payload:', body)

    if (!keywords || keywords.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Keywords are required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      // Extract role from keywords if possible
      const roleMatch = keywords.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Engineer|Developer|Designer|Manager|Analyst|Specialist|Consultant)/i)
      const role = roleMatch ? roleMatch[0] : 'Professional'
      const mockContent = `${role} with expertise in ${keywords.split(',').slice(0, 3).join(', ')}. Delivers high-quality solutions and measurable results through strong technical foundation and problem-solving abilities. Collaborative approach with focus on continuous improvement and best practices.`
      console.log('[AI] result', { ok: true, summary: mockContent })
      return NextResponse.json({ ok: true, summary: mockContent })
    }

    // Extract information from input (excluding names)
    const experienceInfo = experience && experience.length > 0 
      ? experience.map((exp: any) => ({
          role: exp.role,
          company: exp.company,
          duration: exp.duration,
          description: exp.description
        }))
      : []
    
    const educationInfo = education && education.length > 0
      ? education.map((edu: any) => ({
          degree: edu.degree,
          school: edu.school,
          year: edu.year
        }))
      : []

    const prompt = `Generate a CV SUMMARY paragraph from the given keywords/text.

Input:
Keywords/Text: ${keywords}
${experienceInfo.length > 0 ? `Experience: ${JSON.stringify(experienceInfo)}` : ''}
${educationInfo.length > 0 ? `Education: ${JSON.stringify(educationInfo)}` : ''}
${skills && skills.length > 0 ? `Skills: ${skills.join(', ')}` : ''}

STRICT RULES:
- Do NOT include the candidate's name or any honorifics (no "Mr.", "Ms.", "Dr.", no names at all).
- Write in neutral, no-pronoun resume style (no "I", "my", "he/she"). Start with the role or value statement.
- Single paragraph only. No bullets, headings, or labels. 60–100 words max.
- Keep ATS-friendly skills/keywords from the input. Do not invent employers, dates, or claims you don't see in the data.
- If a company or degree appears in the input, you may reference it, but NEVER prepend the name of the person.
- Professional, concise, and specific; avoid fluff (e.g., "hard worker", "go-getter").

OUTPUT FORMAT:
A single polished paragraph. Return only the paragraph text, nothing else. Write in ${lang}.`

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert CV writer. Generate CV summary paragraphs following strict rules: no names or honorifics, neutral no-pronoun style, single paragraph format (60-100 words), ATS-friendly keywords, factual claims only, professional and concise. Start with role or value statement, never use pronouns like "I" or "my".',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    let generatedSummary = completion.choices[0]?.message?.content || ''
    
    // Normalize: strip prefaces and ensure single paragraph format
    generatedSummary = stripPlaceholders(generatedSummary)
    generatedSummary = normalizeSummaryParagraph(generatedSummary)
    
    const response = { ok: true, summary: generatedSummary, content: generatedSummary }
    console.log('[Generate] result:', response)

    return NextResponse.json(response)
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to generate CV. Please try again.')
    return NextResponse.json(body, { status })
  }
}
