import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type QualityStatus = 'strong' | 'good' | 'needs-improvement'
type FeedbackItem = { type: 'success' | 'warning' | 'error'; text: string }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { summary, latestRole } = body

    if (!summary || !summary.trim()) {
      return NextResponse.json({ ok: false, error: 'Summary is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY - using basic analysis')
      // Fallback to basic analysis
      return NextResponse.json({
        ok: true,
        status: 'good',
        feedback: [
          { type: 'success', text: 'Good length' },
          { type: 'warning', text: 'Consider adding more specific achievements' },
        ],
        hasGrammarIssues: false,
      })
    }

    // Use AI to analyze the summary quality
    const analysisPrompt = `You are a professional CV expert. Analyze the following CV summary and provide structured feedback.

CV Summary:
"${summary}"

${latestRole ? `Latest Role: ${latestRole}` : ''}

Provide a detailed analysis in JSON format with these fields:
{
  "status": "strong" | "good" | "needs-improvement",
  "feedback": [
    { "type": "success" | "warning" | "error", "text": "specific feedback point" }
  ],
  "hasGrammarIssues": boolean
}

Evaluation criteria:
1. Grammar and spelling (check for errors)
2. Length (ideal: 60-100 words, current: ${summary.trim().split(/\s+/).length} words)
3. Impact strength (use of action verbs, achievements, quantifiable results)
4. Clarity (clear, concise, professional tone)
5. Role relevance (if latest role is provided, is it mentioned or relevant?)

Provide exactly 3 feedback items maximum. Be constructive and specific.
Return ONLY valid JSON, no other text.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV quality analyzer. Return only valid JSON responses.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const result = completion.choices[0]?.message?.content?.trim()
    
    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let analysis
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        analysis = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result)
      // Fallback to basic analysis
      return NextResponse.json({
        ok: true,
        status: 'good',
        feedback: [
          { type: 'success', text: 'Summary analyzed' },
          { type: 'warning', text: 'Consider reviewing for improvements' },
        ],
        hasGrammarIssues: false,
      })
    }

    return NextResponse.json({
      ok: true,
      status: analysis.status || 'good',
      feedback: analysis.feedback?.slice(0, 3) || [],
      hasGrammarIssues: analysis.hasGrammarIssues || false,
    })

  } catch (error: any) {
    console.error('Quality check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check summary quality' },
      { status: 500 }
    )
  }
}

