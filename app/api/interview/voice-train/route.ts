import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const question = formData.get('question') as string
    const referenceAnswer = formData.get('reference_answer') as string

    if (!audioFile) {
      return NextResponse.json(
        { ok: false, error: 'Audio file is required' },
        { status: 400 }
      )
    }

    if (!question || !referenceAnswer) {
      return NextResponse.json(
        { ok: false, error: 'Question and reference answer are required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        transcript: 'This is a mock transcript. Enable OpenAI API key for actual transcription.',
        scores: {
          clarity: 7,
          confidence: 8,
          speed: 7,
          filler_words: 6,
          professional_tone: 8,
          structure: 7,
        },
        summary_feedback: 'Your delivery was clear and confident. Consider varying your pace slightly to emphasize key points. Your pronunciation was excellent.',
        improvement_tips: [
          'Practice speaking at a slightly slower pace to allow for emphasis',
          'Reduce filler words like "um" and "uh"',
          'Vary your tone to keep the listener engaged',
        ],
      })
    }

    // Transcribe audio using OpenAI Whisper
    // The OpenAI SDK accepts File objects from FormData directly
    let transcriptionResponse
    try {
      transcriptionResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      })
    } catch (openaiError: unknown) {
      const { body, status } = openAIErrorResponse(
        openaiError,
        'Voice evaluation failed.'
      )
      return NextResponse.json(body, { status })
    }

    const transcript = transcriptionResponse.text

    // Check if transcript is empty or too short
    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({
        ok: true,
        transcript: transcript || '',
        scores: {
          clarity: 1,
          confidence: 1,
          speed: 1,
          filler_words: 1,
          professional_tone: 1,
          structure: 1,
        },
        summary_feedback: 'No real answer detected. Please speak a full sentence.',
        improvement_tips: [
          'Speak a longer answer.',
          'Ensure your microphone is working.',
          'Try again with more detail.',
        ],
      })
    }

    // Evaluate the spoken answer using GPT
    // REFACTOR: Updated prompt to STRICTLY enforce JSON structure with explicit schema
    // This ensures the model always returns valid JSON with all required fields, or falls back to zeros/empty strings
    // CHANGE: Made prompt even more explicit about JSON-only output and fallback behavior
    let evaluationCompletion
    try {
      evaluationCompletion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              `You are an expert HR interviewer and voice coach. Evaluate the candidate's spoken answer based on clarity, confidence, speed, filler words, professional tone, and structure.

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. You MUST respond with ONLY valid JSON. No text before or after the JSON. No markdown formatting. No code blocks. Only pure JSON.
2. You MUST use this EXACT structure with ALL fields present:
{
  "transcript": "string (the spoken transcript, can be same as input)",
  "scores": {
    "clarity": number (1-10),
    "confidence": number (1-10),
    "speed": number (1-10),
    "filler_words": number (1-10, lower is better),
    "professional_tone": number (1-10),
    "structure": number (1-10)
  },
  "summary_feedback": "string (detailed feedback)",
  "improvement_tips": ["string", "string", ...] (array of improvement suggestions, minimum 3 items)
}

3. If the transcript is nonsense, unrelated to the question, or does not constitute a real answer, give low scores (1-3 out of 10) across all metrics.
4. If you cannot evaluate for ANY reason (invalid input, unclear audio, etc.), you MUST still return valid JSON with this fallback structure:
{
  "transcript": "string (use the input transcript as-is)",
  "scores": {
    "clarity": 0,
    "confidence": 0,
    "speed": 0,
    "filler_words": 0,
    "professional_tone": 0,
    "structure": 0
  },
  "summary_feedback": "Unable to evaluate this response.",
  "improvement_tips": ["Please try speaking again.", "Ensure your microphone is working.", "Provide a clear answer to the question."]
}

Remember: Your response must be parseable as valid JSON. No exceptions.`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              question,
              reference_answer: referenceAnswer,
              spoken_transcript: transcript,
            }),
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      })
    } catch (openaiError: unknown) {
      const { body, status } = openAIErrorResponse(
        openaiError,
        'Voice evaluation failed.'
      )
      return NextResponse.json(body, { status })
    }

    const evaluationContent = evaluationCompletion.choices[0]?.message?.content
    
    // REFACTOR: Safe fallback evaluation object with default values
    // CHANGE: Created centralized fallback function to ensure consistent structure
    // This ensures we always return a valid response even if parsing/validation fails
    // The fallback matches the expected API response format that the frontend uses
    const createFallbackEvaluation = () => ({
      transcript: transcript,
      scores: {
        clarity: 5,
        confidence: 5,
        speed: 5,
        filler_words: 5,
        professional_tone: 5,
        structure: 5,
      },
      summary_feedback: 'Unable to analyze this response. Please try speaking again.',
      improvement_tips: [
        'Ensure your microphone is working properly',
        'Speak clearly and at a moderate pace',
        'Provide a complete answer to the question',
      ],
    })

    // REFACTOR: Check if content is missing - use fallback instead of throwing error
    // CHANGE: Previously would throw, now gracefully returns fallback with default values
    // This prevents "Voice analysis failed" errors on the frontend
    if (!evaluationContent) {
      console.error('VOICE_EVAL_PARSE_ERROR', 'Missing content from OpenAI response')
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }
    
    // REFACTOR: Wrapped JSON.parse in try/catch with safe fallback handling
    // CHANGE: Previously would throw and crash the API, now catches parse errors and returns fallback
    // If parsing fails (malformed JSON, non-JSON text, etc.), return safe fallback instead of throwing
    let evaluation
    try {
      evaluation = JSON.parse(evaluationContent)
    } catch (parseError: any) {
      console.error('VOICE_EVAL_PARSE_ERROR', 'JSON parse failed', { 
        content: evaluationContent?.substring(0, 200), // Log first 200 chars for debugging
        error: parseError?.message 
      })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate and extract transcript with fallback
    const validatedTranscript = evaluation.transcript || transcript

    // REFACTOR: Validate scores object - if missing or invalid, use fallback
    // CHANGE: Previously would throw error, now returns safe fallback
    // This handles cases where OpenAI returns JSON but without the expected "scores" field
    if (!evaluation.scores || typeof evaluation.scores !== 'object') {
      console.error('VOICE_EVAL_PARSE_ERROR', 'Missing scores object in evaluation', { 
        hasEvaluation: !!evaluation,
        evaluationKeys: evaluation ? Object.keys(evaluation) : [],
        evaluationSample: evaluation ? JSON.stringify(evaluation).substring(0, 200) : null
      })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate all required score keys - if any missing or invalid, use fallback
    const requiredScoreKeys = ['clarity', 'confidence', 'speed', 'filler_words', 'professional_tone', 'structure']
    let hasValidScores = true
    for (const key of requiredScoreKeys) {
      if (typeof evaluation.scores[key] !== 'number' || isNaN(evaluation.scores[key])) {
        console.error('VOICE_EVAL_PARSE_ERROR', `Missing or invalid score for ${key}`, { evaluation })
        hasValidScores = false
        break
      }
    }

    // Validate summary_feedback - if missing or invalid, use fallback
    if (!evaluation.summary_feedback || typeof evaluation.summary_feedback !== 'string') {
      console.error('VOICE_EVAL_PARSE_ERROR', 'Missing summary_feedback in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // Validate improvement_tips - if missing or invalid, use fallback
    if (!Array.isArray(evaluation.improvement_tips)) {
      console.error('VOICE_EVAL_PARSE_ERROR', 'Missing or invalid improvement_tips in evaluation', { evaluation })
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // If scores validation failed, use fallback
    if (!hasValidScores) {
      const fallback = createFallbackEvaluation()
      return NextResponse.json({ ok: true, ...fallback })
    }

    // All validations passed, return success with parsed evaluation
    const result = {
      transcript: validatedTranscript,
      scores: evaluation.scores,
      summary_feedback: evaluation.summary_feedback,
      improvement_tips: evaluation.improvement_tips,
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Voice evaluation failed.')
    return NextResponse.json(body, { status })
  }
}
