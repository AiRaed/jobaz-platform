import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { context } = body

    if (!context || !context.trim()) {
      return NextResponse.json({ ok: false, error: 'Context is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      // Mock response: try to extract a simple role from context
      const contextLower = context.toLowerCase()
      if (contextLower.includes('developer') || contextLower.includes('programming') || contextLower.includes('html') || contextLower.includes('css')) {
        return NextResponse.json({ ok: true, role: 'software developer' })
      }
      if (contextLower.includes('designer') || contextLower.includes('graphic')) {
        return NextResponse.json({ ok: true, role: 'graphic designer' })
      }
      if (contextLower.includes('manager') || contextLower.includes('management')) {
        return NextResponse.json({ ok: true, role: 'project manager' })
      }
      return NextResponse.json({ ok: true, role: 'professional' })
    }

    // Build system prompt with domain detection hints
    const systemPrompt = `You are an expert career advisor specializing in job title extraction from CV content.

Your task is to analyze the user's CV summary, skills, and most recent job experience to determine the SINGLE most accurate and relevant job title for job searching.

Rules:
- Return ONLY the job title, no explanation, no punctuation, no additional text
- Use common, searchable job titles (e.g., "software developer", "graphic designer", "project manager")
- Consider domain hints from skills:
  * HTML/CSS/JavaScript/React → prefer tech roles (e.g., "frontend developer", "web developer")
  * Food safety/certifications → prefer hospitality roles (e.g., "food service manager", "chef")
  * Logistics/warehouse → prefer warehouse roles (e.g., "warehouse associate", "logistics coordinator")
- Prioritize the most recent experience if it's clearly stated
- If the user is changing careers, prioritize skills and summary over old experience
- Keep job titles concise (2-4 words maximum)
- Use lowercase for consistency

Examples:
- Input: "Summary: Experienced in web development. Skills: HTML, CSS, JavaScript. LatestExperience: Frontend Developer"
  Output: frontend developer

- Input: "Summary: Food service professional. Skills: Food safety, HACCP. LatestExperience: Restaurant Manager"
  Output: restaurant manager

- Input: "Summary: Career transition to software engineering. Skills: Python, React, Node.js. LatestExperience: Sales Associate"
  Output: software engineer`

    const userPrompt = `Based on the following CV content, determine the single most accurate job title for job searching:

${context}

Return ONLY the job title, nothing else.`

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
      temperature: 0.3,
      max_tokens: 50,
    })

    const role = completion.choices[0]?.message?.content?.trim() || ''

    if (!role) {
      return NextResponse.json({ ok: false, error: 'Failed to extract role' }, { status: 500 })
    }

    // Clean up the role (remove any punctuation, extra whitespace)
    const cleanRole = role.replace(/[.,;:!?]/g, '').trim().toLowerCase()

    return NextResponse.json({
      ok: true,
      role: cleanRole,
    })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to extract role. Please try again.')
    return NextResponse.json(body, { status })
  }
}

