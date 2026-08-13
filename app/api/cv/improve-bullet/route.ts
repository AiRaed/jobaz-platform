import { NextResponse } from 'next/server'
import { aiProvider } from '@/lib/jobaz-ai/providers'
import { enforceAiUsageLimit } from '@/lib/ai-usage/guard'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bullet, jobTitle, isCurrent } = body

    if (!bullet || !bullet.trim()) {
      return NextResponse.json({ ok: false, error: 'Bullet point is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!aiProvider.isConfigured()) {
      console.warn('[AI MOCK] no OPENAI_API_KEY - returning mock improvement')
      // Return a mock improvement
      return NextResponse.json({
        ok: true,
        improved: `Improved version: ${bullet}`,
      })
    }

    const usageGate = await enforceAiUsageLimit(req, 'cv_builder', 'cv_improve_bullet')
    if (!usageGate.allowed) return usageGate.response

    // Determine tense based on whether role is current
    const tense = isCurrent ? 'present tense' : 'past tense'

    // Create the improvement prompt
    const prompt = `You are a professional CV writing assistant.

Improve the following experience bullet point to make it:
- Clear and professional
- Action-oriented (start with a strong verb)
- Specific to the role and tools mentioned
- Suitable for ATS systems
- Concise (1 sentence only)
- Without exaggeration or false claims

IMPORTANT RULES:
- Do NOT invent achievements, metrics, or responsibilities.
- Only improve wording, clarity, and structure.
- Keep the original meaning and tools.
- Use ${tense} unless the role is current.
${jobTitle ? `- This is for a ${jobTitle} role` : ''}

Original bullet:
"${bullet}"

Return ONLY the improved bullet point text.
Do NOT include explanations, headings, or extra formatting.`

    const completion = await aiProvider.generateText({
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV writing expert. Improve bullet points while preserving their original meaning and facts. Return only the improved text without any explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      modelTier: 'default',
      temperature: 0.5,
      maxTokens: 150,
      feature: 'cv/improve-bullet',
    })

    const improved = completion.text?.trim()

    if (!improved) {
      throw new Error('No improvement generated')
    }

    // Clean up any quotes or extra formatting
    const cleanedImproved = improved
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .replace(/^\s*-\s*/, '') // Remove leading bullet points
      .trim()

    return NextResponse.json({
      ok: true,
      improved: cleanedImproved,
    })

  } catch (error: any) {
    console.error('Bullet improvement error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to improve bullet point' },
      { status: 500 }
    )
  }
}

