// ============================================
// Memory Mode Evaluation API Route
// ============================================
// This API evaluates a complete Memory Mode session where users answer
// multiple interview questions consecutively. It assesses memory retention,
// clarity, and confidence across all answers, providing a comprehensive
// evaluation report with scores, summary, strengths, weaknesses, and missed points.
// Uses defensive JSON parsing pattern with safe fallbacks similar to voice evaluation.

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { questions, answers } = await req.json()

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Questions array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Answers array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (questions.length !== answers.length) {
      return NextResponse.json(
        { ok: false, error: 'Questions and answers arrays must have the same length' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        memoryScore: 7,
        clarityScore: 7,
        confidenceScore: 7,
        summary: 'Your answers demonstrate good memory retention and clarity. Continue practicing to improve consistency across all questions.',
        strengths: ['Good structure', 'Relevant content', 'Clear articulation'],
        weaknesses: ['Could be more specific', 'Add more examples'],
        missedPoints: ['Some key details were omitted'],
      })
    }

    // Build prompt for Memory Mode evaluation
    // The API evaluates how well the user remembered and articulated key ideas across all answers
    const questionsText = questions.map((q: string, idx: number) => `${idx + 1}. ${q}`).join('\n')
    const answersText = answers.map((a: string, idx: number) => `Question ${idx + 1} Answer: ${a}`).join('\n\n')

    let evaluationCompletion
    try {
      evaluationCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert HR interviewer evaluating a candidate's memory retention and ability to articulate key ideas across multiple interview questions. Evaluate how well the candidate remembered and consistently articulated their prepared answers throughout the session.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. You MUST respond with ONLY valid JSON. No text before or after the JSON. No markdown formatting. No code blocks. Only pure JSON.
2. You MUST use this EXACT structure with ALL fields present:
{
  "memoryScore": number (0-10, how well they retained and recalled key points across all answers),
  "clarityScore": number (0-10, how clear and understandable their answers were),
  "confidenceScore": number (0-10, how confident and consistent their delivery was),
  "summary": "string (2-3 sentence comprehensive summary of their overall performance)",
  "strengths": ["string", "string", ...] (array of strengths, minimum 2 items),
  "weaknesses": ["string", "string", ...] (array of areas to improve, minimum 2 items),
  "missedPoints": ["string", "string", ...] (array of key points that were missed or could be added, minimum 1 item)
}

3. If the answers are unrelated to the questions, give low scores (1-3 out of 10) across all metrics.
4. If you cannot evaluate for ANY reason, you MUST still return valid JSON with this fallback structure:
{
  "memoryScore": 0,
  "clarityScore": 0,
  "confidenceScore": 0,
  "summary": "Unable to evaluate this response.",
  "strengths": [],
  "weaknesses": ["Please try again with complete answers."],
  "missedPoints": ["Ensure all questions are answered thoroughly."]
}

Remember: Your response must be parseable as valid JSON. No exceptions.`,
          },
          {
            role: 'user',
            content: `Evaluate the candidate's memory retention and articulation across these interview questions and answers:

QUESTIONS:
${questionsText}

ANSWERS:
${answersText}

Evaluate how well they remembered and articulated key ideas across all answers. Consider consistency, clarity, completeness, and confidence.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })
    } catch (openaiError: unknown) {
      const { body, status } = openAIErrorResponse(
        openaiError,
        'Memory evaluation failed.'
      )
      return NextResponse.json(body, { status })
    }

    const evaluationContent = evaluationCompletion.choices[0]?.message?.content

    // Safe fallback evaluation object with default values
    // This ensures we always return a valid response even if parsing/validation fails
    const createFallbackEvaluation = (): MemoryEvaluationResult => ({
      memoryScore: 5,
      clarityScore: 5,
      confidenceScore: 5,
      summary: 'Unable to analyze this session. Please try again with complete answers to all questions.',
      strengths: [],
      weaknesses: ['Ensure all questions are answered thoroughly', 'Try to maintain consistency across answers'],
      missedPoints: ['Add more specific examples and details to your answers'],
    })

    // Check if content is missing - use fallback instead of throwing error
    if (!evaluationContent) {
      console.error('MEMORY_EVAL_PARSE_ERROR', 'Missing content from OpenAI response')
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Wrapped JSON.parse in try/catch with safe fallback handling
    let evaluation
    try {
      evaluation = JSON.parse(evaluationContent)
    } catch (parseError: any) {
      console.error('MEMORY_EVAL_PARSE_ERROR', 'JSON parse failed', {
        content: evaluationContent?.substring(0, 200), // Log first 200 chars for debugging
        error: parseError?.message,
      })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate required fields with fallback
    const requiredFields = ['memoryScore', 'clarityScore', 'confidenceScore', 'summary', 'strengths', 'weaknesses', 'missedPoints']
    let hasValidFields = true
    for (const field of requiredFields) {
      if (!(field in evaluation)) {
        console.error('MEMORY_EVAL_PARSE_ERROR', `Missing required field: ${field}`, { evaluation })
        hasValidFields = false
        break
      }
    }

    if (!hasValidFields) {
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate score fields are numbers
    if (
      typeof evaluation.memoryScore !== 'number' ||
      typeof evaluation.clarityScore !== 'number' ||
      typeof evaluation.confidenceScore !== 'number' ||
      isNaN(evaluation.memoryScore) ||
      isNaN(evaluation.clarityScore) ||
      isNaN(evaluation.confidenceScore)
    ) {
      console.error('MEMORY_EVAL_PARSE_ERROR', 'Invalid score types in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate string fields
    if (typeof evaluation.summary !== 'string') {
      console.error('MEMORY_EVAL_PARSE_ERROR', 'Invalid summary type in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate array fields
    if (!Array.isArray(evaluation.strengths) || !Array.isArray(evaluation.weaknesses) || !Array.isArray(evaluation.missedPoints)) {
      console.error('MEMORY_EVAL_PARSE_ERROR', 'Invalid array types in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // All validations passed, clamp scores to 0-10 range and return success
    const result: MemoryEvaluationResult = {
      memoryScore: Math.max(0, Math.min(10, evaluation.memoryScore)),
      clarityScore: Math.max(0, Math.min(10, evaluation.clarityScore)),
      confidenceScore: Math.max(0, Math.min(10, evaluation.confidenceScore)),
      summary: evaluation.summary,
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [],
      missedPoints: Array.isArray(evaluation.missedPoints) ? evaluation.missedPoints : [],
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error('MEMORY_EVAL_OPENAI_ERROR', error)
    return NextResponse.json(
      { error: 'OPENAI_ERROR', message: 'Memory evaluation failed.' },
      { status: 500 }
    )
  }
}

// Define the interface for TypeScript
interface MemoryEvaluationResult {
  memoryScore: number
  clarityScore: number
  confidenceScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  missedPoints: string[]
}

