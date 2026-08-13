import { NextResponse } from 'next/server'
import { aiProvider } from '@/lib/jobaz-ai/providers'
import { enforceAiUsageLimit } from '@/lib/ai-usage/guard'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { context } = body

    if (!context || !context.trim()) {
      return NextResponse.json({ ok: false, error: 'Context is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!aiProvider.isConfigured()) {
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

    const usageGate = await enforceAiUsageLimit(req, 'cv_builder', 'extract-role')
    if (!usageGate.allowed) return usageGate.response

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

    const completion = await aiProvider.generateText({
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
      modelTier: 'default',
      temperature: 0.3,
      maxTokens: 50,
      feature: 'cv/extract-role',
    })

    const role = completion.text?.trim() || ''

    if (!role) {
      return NextResponse.json({ ok: false, error: 'Failed to extract role' }, { status: 500 })
    }

    // Clean up the role (remove any punctuation, extra whitespace)
    const cleanRole = role.replace(/[.,;:!?]/g, '').trim().toLowerCase()

    return NextResponse.json({
      ok: true,
      role: cleanRole,
    })
  } catch (error: any) {
    console.error('Error extracting role:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to extract role. Please try again.' },
      { status: 500 }
    )
  }
}

