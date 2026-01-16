import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type BulletQualityStatus = 'excellent' | 'good' | 'needs-improvement'
type FeedbackItem = { type: 'success' | 'warning' | 'error'; text: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bullet, jobTitle } = body

    if (!bullet || !bullet.trim()) {
      return NextResponse.json({ ok: false, error: 'Bullet point is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY - using basic analysis')
      // Fallback to basic analysis
      const wordCount = bullet.trim().split(/\s+/).length
      return NextResponse.json({
        ok: true,
        status: wordCount > 15 ? 'good' : 'needs-improvement',
        feedback: wordCount > 15 
          ? [{ type: 'success', text: 'Good length and structure' }]
          : [{ type: 'warning', text: 'Consider adding more detail about the outcome' }],
      })
    }

    // Use AI to analyze the bullet quality
    const analysisPrompt = `You are a professional CV expert specialized in experience bullet points. Analyze this CV bullet point and provide structured, constructive feedback.

Bullet Point:
"${bullet}"

${jobTitle ? `Job Title: ${jobTitle}` : ''}

Provide analysis in JSON format:
{
  "status": "excellent" | "good" | "needs-improvement",
  "feedback": [
    { "type": "success" | "warning" | "error", "text": "specific feedback point" }
  ]
}

Evaluation criteria:
1. Clarity - Is it clear what was done and why?
2. Grammar & spelling - Any errors?
3. Action-oriented language - Does it start with a strong action verb?
4. Result-focused - Does it show impact, outcome, or value?

Guidelines:
- If the bullet is clear and well-written with no issues, return empty feedback array
- Maximum 3 feedback items
- Be constructive and supportive (designed for non-native English speakers)
- Do NOT suggest inventing achievements or metrics if they're not there
- Do NOT be judgmental
- Focus on what can be improved without changing the factual content

Examples of feedback:
- "Starts with a strong action verb"
- "Consider adding the outcome or result of this action"
- "Could be more specific about your role or responsibility"
- "Grammar: Consider rephrasing for clarity"
- "Too task-focused - what was the impact?"

Return ONLY valid JSON, no other text.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive CV quality analyzer. Return only valid JSON responses. Be constructive and professional.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    })

    const result = completion.choices[0]?.message?.content?.trim()
    
    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let analysis
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        analysis = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result)
      return NextResponse.json({
        ok: true,
        status: 'good',
        feedback: [{ type: 'success', text: 'Bullet analyzed' }],
      })
    }

    // If feedback is empty, it means the bullet is excellent
    if (!analysis.feedback || analysis.feedback.length === 0) {
      return NextResponse.json({
        ok: true,
        status: 'excellent',
        feedback: [],
      })
    }

    return NextResponse.json({
      ok: true,
      status: analysis.status || 'good',
      feedback: analysis.feedback?.slice(0, 3) || [],
    })

  } catch (error: any) {
    console.error('Bullet quality check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check bullet quality' },
      { status: 500 }
    )
  }
}

