import { NextRequest, NextResponse } from 'next/server'
import { aiProvider } from '@/lib/jobaz-ai/providers'
import { enforceAiUsageLimit } from '@/lib/ai-usage/guard'

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json()

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Answers array is required' },
        { status: 400 }
      )
    }

    // Filter out empty answers
    const validAnswers = answers.filter((ans: string) => ans && ans.trim().length > 0)
    
    if (validAnswers.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'At least one valid answer is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!aiProvider.isConfigured()) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        clarity: 7,
        confidence: 7,
        speed: 7,
        tone: 7,
        structure: 7,
        completeness: 7,
        examples: 7,
        overall: 7,
      })
    }

    const usageGate = await enforceAiUsageLimit(req, 'interview_coach', 'evaluate-interview')
    if (!usageGate.allowed) return usageGate.response

    // Combine all answers for evaluation
    const allAnswersText = validAnswers.join('\n\n---\n\n')

    const completion = await aiProvider.generateText({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR interviewer and career coach. Evaluate the candidate\'s complete interview performance across all answers. Respond in JSON only with the exact structure specified.',
        },
        {
          role: 'user',
          content: `Evaluate this complete interview performance based on all answers provided. Assess the candidate's overall performance across multiple dimensions. Respond in JSON only with this EXACT structure:

{
  "clarity": number (0-10, overall clarity and understandability across all answers),
  "confidence": number (0-10, confidence level demonstrated in responses),
  "speed": number (0-10, pacing and delivery speed - optimal is moderate, not too fast or slow),
  "tone": number (0-10, professional tone and appropriate voice modulation),
  "structure": number (0-10, how well-structured answers are, including STAR method usage),
  "completeness": number (0-10, how complete and thorough the answers are),
  "examples": number (0-10, quality and impact of examples provided across all answers),
  "overall": number (0-10, overall interview performance score)
}

All Candidate's Answers:
${allAnswersText}

Provide a comprehensive evaluation of the candidate's interview performance. Consider consistency across answers, overall communication quality, and professional presentation.`,
        },
      ],
      modelTier: 'quality',
      temperature: 0.7,
      maxTokens: 1000,
      feature: 'interview/evaluate-interview',
    })

    const content = completion.text || '{}'
    
    let evaluation
    try {
      evaluation = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback to extracting JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('Failed to parse evaluation response')
      }
    }

    // Validate and return structured response
    const clarity = typeof evaluation.clarity === 'number' ? Math.max(0, Math.min(10, evaluation.clarity)) : 7
    const confidence = typeof evaluation.confidence === 'number' ? Math.max(0, Math.min(10, evaluation.confidence)) : 7
    const speed = typeof evaluation.speed === 'number' ? Math.max(0, Math.min(10, evaluation.speed)) : 7
    const tone = typeof evaluation.tone === 'number' ? Math.max(0, Math.min(10, evaluation.tone)) : 7
    const structure = typeof evaluation.structure === 'number' ? Math.max(0, Math.min(10, evaluation.structure)) : 7
    const completeness = typeof evaluation.completeness === 'number' ? Math.max(0, Math.min(10, evaluation.completeness)) : 7
    const examples = typeof evaluation.examples === 'number' ? Math.max(0, Math.min(10, evaluation.examples)) : 7
    const overall = typeof evaluation.overall === 'number' ? Math.max(0, Math.min(10, evaluation.overall)) : 7
    
    return NextResponse.json({
      ok: true,
      clarity,
      confidence,
      speed,
      tone,
      structure,
      completeness,
      examples,
      overall,
    })
  } catch (error: any) {
    console.error('AI Interview Evaluation error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to evaluate interview' },
      { status: 500 }
    )
  }
}

