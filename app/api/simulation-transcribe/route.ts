import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { enforceAiUsageLimit } from '@/lib/ai-usage/guard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { ok: false, error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        transcript: 'This is a mock transcript. Enable OpenAI API key for actual transcription.',
      })
    }

    const usageGate = await enforceAiUsageLimit(req, 'interview_coach', 'simulation-transcribe')
    if (!usageGate.allowed) return usageGate.response

    // Transcribe audio using OpenAI Whisper
    let transcriptionResponse
    try {
      transcriptionResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      })
    } catch (openaiError: any) {
      console.error('WHISPER_TRANSCRIBE_ERROR', openaiError)
      return NextResponse.json(
        { ok: false, error: 'Transcription failed.' },
        { status: 500 }
      )
    }

    const transcript = transcriptionResponse.text || ''

    return NextResponse.json({
      ok: true,
      transcript: transcript,
    })
  } catch (error: any) {
    console.error('Simulation transcribe error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to transcribe audio.' },
      { status: 500 }
    )
  }
}

