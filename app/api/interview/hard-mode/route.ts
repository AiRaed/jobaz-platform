import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { question, userAnswer, targetAnswer } = await req.json()

    if (!question || !userAnswer || !targetAnswer) {
      return NextResponse.json(
        { ok: false, error: 'Question, userAnswer, and targetAnswer are required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        convertedText: userAnswer,
        accuracy: 7,
        memoryRetention: 7,
        logic: 7,
        stability: 7,
        tone: 8,
        completeness: 7,
        examplesClarity: 6,
        structure: 7,
        summaryFeedback: 'Your spoken answer demonstrates good recall of your written response. The key points were present, though some details were omitted compared to your written version. Practice speaking from memory to improve retention and flow.',
        improvementTips: [
          'Work on recalling key examples and details without relying on written notes',
          'Practice maintaining logical flow when speaking from memory',
          'Include specific examples and metrics to strengthen your answer',
          'Focus on speaking with consistent tone and confidence',
        ],
      })
    }

    // Evaluate the spoken answer compared to the written target answer using GPT
    const evaluationCompletion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert HR interviewer evaluating a candidate\'s memory retention and ability to articulate answers from memory (audio-only interview). Compare the user\'s spoken answer (converted from audio) to their best written answer (target). Evaluate how well they retained and articulated their prepared response from memory. Respond in strict JSON format only.',
        },
        {
          role: 'user',
          content: `Compare the candidate's spoken answer (from memory) to their best written answer (target). Evaluate their memory retention and articulation.

Question: ${question}

Target Answer (Best Written): ${targetAnswer}

User's Spoken Answer (from memory): ${userAnswer}

Evaluate and return a JSON object with these exact fields (all scores 0-10):
{
  "convertedText": "${userAnswer}",
  "accuracy": number (0-10) - How accurately does the spoken answer match the content and meaning of the written answer?,
  "memoryRetention": number (0-10) - How well did they remember key points, examples, and details from their written answer?,
  "logic": number (0-10) - Is the spoken answer logically structured and coherent?,
  "stability": number (0-10) - How consistent and stable was their delivery? (no major hesitations, corrections, or breakdowns),
  "tone": number (0-10) - How professional and appropriate was their tone?,
  "completeness": number (0-10) - How complete was their answer compared to the written version? (did they cover all main points?),
  "examplesClarity": number (0-10) - Were examples and specific details clear and well-articulated?,
  "structure": number (0-10) - Was the spoken answer well-structured with a clear beginning, middle, and end?,
  "summaryFeedback": "string" - A comprehensive 2-3 sentence summary of their performance,
  "improvementTips": ["string", "string", ...] - Array of specific, actionable improvement tips (3-5 tips)
}

Respond only with valid JSON, no additional text.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const evaluationContent = evaluationCompletion.choices[0]?.message?.content || '{}'
    
    let evaluation
    try {
      evaluation = JSON.parse(evaluationContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      const jsonMatch = evaluationContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || evaluationContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('Failed to parse evaluation response')
      }
    }

    // Ensure all required fields are present with safe defaults
    const result = {
      convertedText: evaluation.convertedText || userAnswer,
      accuracy: typeof evaluation.accuracy === 'number' ? Math.max(0, Math.min(10, evaluation.accuracy)) : 7,
      memoryRetention: typeof evaluation.memoryRetention === 'number' ? Math.max(0, Math.min(10, evaluation.memoryRetention)) : 7,
      logic: typeof evaluation.logic === 'number' ? Math.max(0, Math.min(10, evaluation.logic)) : 7,
      stability: typeof evaluation.stability === 'number' ? Math.max(0, Math.min(10, evaluation.stability)) : 7,
      tone: typeof evaluation.tone === 'number' ? Math.max(0, Math.min(10, evaluation.tone)) : 7,
      completeness: typeof evaluation.completeness === 'number' ? Math.max(0, Math.min(10, evaluation.completeness)) : 7,
      examplesClarity: typeof evaluation.examplesClarity === 'number' ? Math.max(0, Math.min(10, evaluation.examplesClarity)) : 7,
      structure: typeof evaluation.structure === 'number' ? Math.max(0, Math.min(10, evaluation.structure)) : 7,
      summaryFeedback: evaluation.summaryFeedback || 'Your answer shows good understanding. Continue practicing to improve memory retention and articulation.',
      improvementTips: Array.isArray(evaluation.improvementTips) && evaluation.improvementTips.length > 0
        ? evaluation.improvementTips
        : [
            'Practice recalling your written answers from memory',
            'Focus on maintaining logical flow when speaking without notes',
            'Include specific examples and details in your spoken responses',
          ],
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to process hard mode evaluation')
    return NextResponse.json(body, { status })
  }
}

