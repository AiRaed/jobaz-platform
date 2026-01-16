import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bullet, jobTitle } = body

    if (!bullet || !bullet.trim()) {
      return NextResponse.json({ ok: false, error: 'Bullet point is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY - returning original')
      return NextResponse.json({
        ok: true,
        improved: bullet,
      })
    }

    // Use AI to fix grammar and improve clarity
    const fixPrompt = `You are a professional CV editor. Fix ONLY grammar, spelling, and clarity issues in this experience bullet point.

Original Bullet:
"${bullet}"

${jobTitle ? `Job Title: ${jobTitle}` : ''}

CRITICAL RULES:
1. Fix grammar, spelling, punctuation, and sentence structure ONLY
2. Improve clarity and flow if needed
3. DO NOT change the factual content or meaning
4. DO NOT invent achievements, metrics, or responsibilities
5. DO NOT change what the person actually did
6. Keep the original responsibility and scope
7. Make it flow naturally for a CV bullet point
8. Ensure it starts with a strong action verb (if it doesn't already)
9. Keep it concise and professional

Return ONLY the improved bullet point text, nothing else. No quotes, no explanations, just the improved text.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV editor who fixes grammar and improves clarity without changing meaning. Return only the improved text.',
        },
        {
          role: 'user',
          content: fixPrompt,
        },
      ],
      temperature: 0.2, // Lower temperature for more conservative edits
      max_tokens: 200,
    })

    const improved = completion.choices[0]?.message?.content?.trim()
    
    if (!improved) {
      throw new Error('No response from AI')
    }

    // Clean up the response (remove quotes if present)
    let cleanedImproved = improved
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .trim()

    // If the AI returned multiple lines or explanations, take only the first line
    const lines = cleanedImproved.split('\n').filter(line => line.trim())
    if (lines.length > 0) {
      cleanedImproved = lines[0].trim()
    }

    return NextResponse.json({
      ok: true,
      improved: cleanedImproved,
    })

  } catch (error: any) {
    console.error('Bullet grammar fix error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fix bullet grammar' },
      { status: 500 }
    )
  }
}

