// ============================================
// Level 4 - Simulation Mode Evaluation API Route
// ============================================
// This API evaluates a complete Simulation Mode session where users answer
// 5 interview questions consecutively. It assesses overall performance,
// communication, confidence, and problem-solving across all answers.
// Uses defensive JSON parsing pattern with safe fallbacks similar to memory-eval.

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    // jobType can be a specific job title/description or a generic job category
    // (e.g., "Customer Service Advisor at Amazon" or "Customer Service")
    const { jobType, questions, answers } = await req.json()

    if (!jobType || jobType.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Job type is required' },
        { status: 400 }
      )
    }

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
        overallScore: 7,
        communicationScore: 7,
        confidenceScore: 7,
        problemSolvingScore: 7,
        strengths: ['Good structure', 'Relevant content', 'Clear articulation'],
        weaknesses: ['Could be more specific', 'Add more examples'],
        recommendations: ['Practice more examples', 'Be more specific with achievements'],
        summary: 'Your simulation performance demonstrates good communication skills. Continue practicing to improve consistency and specificity across all answers.',
      })
    }

    // Build prompt for Simulation Mode evaluation
    // The API evaluates how well the user performed across the entire interview simulation
    const questionsText = questions.map((q: string, idx: number) => `${idx + 1}. ${q}`).join('\n')
    const answersText = answers.map((a: string, idx: number) => `Question ${idx + 1} Answer: ${a}`).join('\n\n')

    let evaluationCompletion
    try {
      evaluationCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert HR interviewer evaluating a candidate's complete interview simulation performance. The job context is: "${jobType}". This may be a specific job title/description (e.g., "Customer Service Advisor at Amazon") or a generic job category (e.g., "Customer Service"). Tailor your evaluation appropriately - if it's specific, evaluate against that role's requirements; if it's generic, evaluate against that category's general expectations. Evaluate how well the candidate performed across all questions, considering overall performance, communication skills, confidence, and problem-solving abilities.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. You MUST respond with ONLY valid JSON. No text before or after the JSON. No markdown formatting. No code blocks. Only pure JSON.
2. You MUST use this EXACT structure with ALL fields present:
{
  "overallScore": number (0-10, overall performance across all questions),
  "communicationScore": number (0-10, clarity, articulation, and effectiveness of communication),
  "confidenceScore": number (0-10, confidence and self-assurance demonstrated),
  "problemSolvingScore": number (0-10, ability to analyze and solve problems, provide examples),
  "strengths": ["string", "string", ...] (array of strengths, minimum 2 items),
  "weaknesses": ["string", "string", ...] (array of areas to improve, minimum 2 items),
  "recommendations": ["string", "string", ...] (array of actionable recommendations, minimum 2 items),
  "summary": "string (2-3 sentence comprehensive summary of their overall interview performance)"
}

3. If the answers are unrelated to the questions or very poor quality, give low scores (1-3 out of 10) across all metrics.
4. If you cannot evaluate for ANY reason, you MUST still return valid JSON with this fallback structure:
{
  "overallScore": 0,
  "communicationScore": 0,
  "confidenceScore": 0,
  "problemSolvingScore": 0,
  "strengths": [],
  "weaknesses": ["Please try again with complete answers."],
  "recommendations": ["Ensure all questions are answered thoroughly."],
  "summary": "Unable to evaluate this response."
}

Remember: Your response must be parseable as valid JSON. No exceptions.`,
          },
          {
            role: 'user',
            content: `Evaluate the candidate's complete interview simulation performance for the following job context: "${jobType}". This may be a specific job title/description or a generic job category. Tailor your evaluation appropriately.

QUESTIONS:
${questionsText}

ANSWERS:
${answersText}

Evaluate their overall performance, communication skills, confidence, and problem-solving abilities across all answers. Consider consistency, clarity, completeness, relevance to the job context provided, and overall interview readiness.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })
    } catch (openaiError: unknown) {
      const { body, status } = openAIErrorResponse(
        openaiError,
        'Simulation evaluation failed.'
      )
      return NextResponse.json(body, { status })
    }

    const evaluationContent = evaluationCompletion.choices[0]?.message?.content

    // Safe fallback evaluation object with default values
    // This ensures we always return a valid response even if parsing/validation fails
    const createFallbackEvaluation = (): SimulationEvaluationResult => ({
      overallScore: 5,
      communicationScore: 5,
      confidenceScore: 5,
      problemSolvingScore: 5,
      summary: 'Unable to analyze this simulation session. Please try again with complete answers to all questions.',
      strengths: [],
      weaknesses: ['Ensure all questions are answered thoroughly', 'Try to maintain consistency across answers'],
      recommendations: ['Add more specific examples and details to your answers', 'Practice answering questions more concisely'],
    })

    // Check if content is missing - use fallback instead of throwing error
    if (!evaluationContent) {
      console.error('SIMULATION_EVAL_PARSE_ERROR', 'Missing content from OpenAI response')
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Wrapped JSON.parse in try/catch with safe fallback handling
    let evaluation
    try {
      evaluation = JSON.parse(evaluationContent)
    } catch (parseError: any) {
      console.error('SIMULATION_EVAL_PARSE_ERROR', 'JSON parse failed', {
        content: evaluationContent?.substring(0, 200), // Log first 200 chars for debugging
        error: parseError?.message,
      })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate required fields with fallback
    const requiredFields = ['overallScore', 'communicationScore', 'confidenceScore', 'problemSolvingScore', 'summary', 'strengths', 'weaknesses', 'recommendations']
    let hasValidFields = true
    for (const field of requiredFields) {
      if (!(field in evaluation)) {
        console.error('SIMULATION_EVAL_PARSE_ERROR', `Missing required field: ${field}`, { evaluation })
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
      typeof evaluation.overallScore !== 'number' ||
      typeof evaluation.communicationScore !== 'number' ||
      typeof evaluation.confidenceScore !== 'number' ||
      typeof evaluation.problemSolvingScore !== 'number' ||
      isNaN(evaluation.overallScore) ||
      isNaN(evaluation.communicationScore) ||
      isNaN(evaluation.confidenceScore) ||
      isNaN(evaluation.problemSolvingScore)
    ) {
      console.error('SIMULATION_EVAL_PARSE_ERROR', 'Invalid score types in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate string fields
    if (typeof evaluation.summary !== 'string') {
      console.error('SIMULATION_EVAL_PARSE_ERROR', 'Invalid summary type in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate array fields
    if (!Array.isArray(evaluation.strengths) || !Array.isArray(evaluation.weaknesses) || !Array.isArray(evaluation.recommendations)) {
      console.error('SIMULATION_EVAL_PARSE_ERROR', 'Invalid array types in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // All validations passed, clamp scores to 0-10 range and return success
    const result: SimulationEvaluationResult = {
      overallScore: Math.max(0, Math.min(10, evaluation.overallScore)),
      communicationScore: Math.max(0, Math.min(10, evaluation.communicationScore)),
      confidenceScore: Math.max(0, Math.min(10, evaluation.confidenceScore)),
      problemSolvingScore: Math.max(0, Math.min(10, evaluation.problemSolvingScore)),
      summary: evaluation.summary,
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [],
      recommendations: Array.isArray(evaluation.recommendations) ? evaluation.recommendations : [],
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (error: any) {
    console.error('SIMULATION_EVAL_OPENAI_ERROR', error)
    return NextResponse.json(
      { error: 'OPENAI_ERROR', message: 'Simulation evaluation failed.' },
      { status: 500 }
    )
  }
}

// Define the interface for TypeScript
interface SimulationEvaluationResult {
  overallScore: number
  communicationScore: number
  confidenceScore: number
  problemSolvingScore: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

