import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  AI_MODEL_UNAVAILABLE_CODE,
  OPENAI_MODEL,
  openAIErrorResponse,
} from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface JazApiRequest {
  userMessage?: string
  mode: 'ask' | 'guide' | 'translate' | 'apply'
  language: 'EN' | 'AR' | 'FA' | 'KU' | 'ES' | 'PL'
  pathname?: string
}

export interface JazApiResponse {
  assistantMessage: string
  mode: string
  language: string
  pathname?: string
  pageContext?: string
}

// Language instruction mapping
function getLanguageInstruction(language: 'EN' | 'AR' | 'FA' | 'KU' | 'ES' | 'PL', mode: 'ask' | 'guide' | 'translate'): string {
  if (mode === 'translate') {
    // For translate mode, language is the target language
    const instructions: Record<string, string> = {
      EN: 'Translate or simplify the text into clear, professional English suitable for CVs, cover letters, and job applications.',
      AR: 'Translate the text into Arabic (Modern Standard, natural and professional).',
      FA: 'Translate the text into Farsi (natural and professional).',
      KU: 'Translate the text into Kurdish (Sorani, natural and professional).',
      ES: 'Translate the text into Spanish (natural and professional).',
      PL: 'Translate the text into Polish (natural and professional).',
    }
    return instructions[language] || instructions.EN
  }
  
  // For ask and guide modes, language is the response language
  const instructions: Record<string, string> = {
    EN: 'Answer in English.',
    AR: 'Answer in Arabic (Modern Standard, but friendly).',
    FA: 'Answer in Farsi.',
    KU: 'Answer in Kurdish (Sorani).',
    ES: 'Answer in Spanish.',
    PL: 'Answer in Polish.',
  }
  return instructions[language] || instructions.EN
}

// Page context instruction
function getPageContextInstruction(pageContext: 'dashboard' | 'cv' | 'cover' | 'job-details' | 'interview' | 'other'): string {
  const instructions: Record<string, string> = {
    dashboard: 'The user is currently on the Dashboard page. Help with job search strategy, next steps, and interpreting the dashboard.',
    cv: 'The user is currently on the CV Builder page. Help with CV content, summary, bullet points, and structure.',
    cover: 'The user is currently on the Cover Letter Builder page. Help with cover letter opening, body, and closing.',
    'job-details': 'The user is currently viewing a job details page. Help interpret the job description, required skills, and how to tailor the CV/cover.',
    interview: 'The user is currently on the Interview Coach page. Help with answering interview questions and STAR method.',
    other: 'The user is on a general page. Provide general career assistance.',
  }
  return instructions[pageContext] || instructions.other
}

// Mode instruction
function getModeInstruction(mode: 'ask' | 'guide' | 'translate', userMessage: string): string {
  if (mode === 'translate') {
    return 'Mode: TRANSLATE. Your job is to translate or simplify the user\'s text into the selected target language. If the target language is English, rewrite and simplify the text in clear English suitable for CVs, cover letters, and job applications. If the target language is not English, translate the text into that language in a natural and professional way. Do not add explanations or extra commentary unless the user explicitly asks for it. Return only the translated or simplified text.'
  }
  
  if (mode === 'guide') {
    return 'Mode: GUIDE. Always respond with clear, numbered step-by-step instructions tailored to the current page context. Format your response as structured steps, even if the user asks a specific question.'
  }
  
  // mode === 'ask'
  return 'Mode: ASK. Answer the user\'s question with helpful, practical advice. Tailor your response based on the current page context.'
}

// Get default user message for guide mode when userMessage is empty
function getDefaultUserMessageForMode(mode: 'ask' | 'guide' | 'translate', pageContext: string): string {
  if (mode === 'guide') {
    const defaults: Record<string, string> = {
      dashboard: 'Guide me through using the dashboard and what to do next.',
      cv: 'Guide me through building my CV step by step.',
      cover: 'Guide me through writing my cover letter step by step.',
      'job-details': 'Guide me on how to tailor my application for this job.',
      interview: 'Guide me on how to use the Interview Coach features.',
      other: 'Guide me through my job search journey.',
    }
    return defaults[pageContext] || defaults.other
  }
  
  if (mode === 'translate') {
    return 'Please translate this text.'
  }
  
  return 'How can I help you?'
}

// Build system prompt for JAZ persona
function getJazSystemPrompt(): string {
  return `You are JAZ, an AI Career Assistant inside JobAZ. You help users create and improve CVs and cover letters, understand job descriptions, find matching jobs, and prepare for interviews. You respond in the user's selected language. You adapt your guidance based on the current page (dashboard, CV builder, Cover builder, Job Details, Interview Coach). Be concise, friendly, and practical. When users struggle with English, explain things in simple terms and avoid jargon. Keep answers helpful and encouraging.`
}

export async function POST(request: NextRequest) {
  try {
    const body: JazApiRequest = await request.json()

    // Validate required fields
    if (!body.mode || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, language' },
        { status: 400 }
      )
    }

    // Validate mode
    const validModes = ['ask', 'guide', 'translate', 'apply']
    if (!validModes.includes(body.mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      )
    }

    // Apply mode is handled by a different endpoint
    if (body.mode === 'apply') {
      return NextResponse.json(
        { error: 'Apply mode is handled by /api/apply-assistant endpoint' },
        { status: 400 }
      )
    }

    // Validate language
    const validLanguages = ['EN', 'AR', 'FA', 'KU', 'ES', 'PL']
    if (!validLanguages.includes(body.language)) {
      return NextResponse.json(
        { error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` },
        { status: 400 }
      )
    }

    // Classify page context based on pathname
    const pathname = body.pathname || ''
    let pageContext: 'dashboard' | 'cv' | 'cover' | 'job-details' | 'interview' | 'other'

    if (pathname.startsWith('/dashboard')) {
      pageContext = 'dashboard'
    } else if (pathname.startsWith('/cv-builder-v2')) {
      pageContext = 'cv'
    } else if (pathname.startsWith('/cover')) {
      pageContext = 'cover'
    } else if (pathname.startsWith('/job-details')) {
      pageContext = 'job-details'
    } else if (pathname.startsWith('/interview-coach')) {
      pageContext = 'interview'
    } else {
      pageContext = 'other'
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[JAZ] No OPENAI_API_KEY configured, returning fallback response')
      // Return a helpful fallback message
      let fallbackMessage = ''
      if (body.mode === 'translate') {
        fallbackMessage = 'Translation feature requires OpenAI API key configuration. Please contact support.'
      } else if (body.mode === 'guide') {
        fallbackMessage = 'I can guide you, but AI features require API configuration. For now, please use the manual guides available on this page.'
      } else {
        fallbackMessage = 'I\'m here to help! However, AI features require API configuration. Please contact support or check your settings.'
      }
      
      return NextResponse.json({
        assistantMessage: fallbackMessage,
        mode: body.mode,
        language: body.language,
        pathname: body.pathname,
        pageContext,
      })
    }

    // Prepare user message - use default if empty (especially for guide mode)
    // For translate mode, userMessage is required (frontend should prevent empty, but validate here too)
    let userMessage = body.userMessage?.trim() || ''
    
    if (body.mode === 'translate') {
      if (!userMessage) {
        return NextResponse.json(
          { error: 'Text to translate is required for translate mode' },
          { status: 400 }
        )
      }
    } else {
      // For ask and guide modes, use default if empty
      userMessage = userMessage || getDefaultUserMessageForMode(body.mode, pageContext)
    }

    // Build messages array for OpenAI
    const messages: Array<{ role: 'system' | 'user'; content: string }> = []
    
    if (body.mode === 'translate') {
      // For translate mode: focus on translation, use generic context
      messages.push(
        { role: 'system', content: getJazSystemPrompt() },
        { role: 'system', content: getLanguageInstruction(body.language, body.mode) },
        { role: 'system', content: 'The user is working on job-related content (CV, cover letter, job description, or interview question).' },
        { role: 'system', content: getModeInstruction(body.mode, userMessage) },
        { role: 'user', content: userMessage }
      )
    } else {
      // For ask and guide modes: use full context
      messages.push(
        { role: 'system', content: getJazSystemPrompt() },
        { role: 'system', content: getLanguageInstruction(body.language, body.mode) },
        { role: 'system', content: getPageContextInstruction(pageContext) },
        { role: 'system', content: getModeInstruction(body.mode, userMessage) },
        { role: 'user', content: userMessage }
      )
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.'

    const response: JazApiResponse = {
      assistantMessage,
      mode: body.mode,
      language: body.language,
      pathname: body.pathname,
      pageContext,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(
      error,
      'Failed to process your request'
    )
    const payload = body as {
      error: string
      code?: string
    }
    return NextResponse.json(
      {
        error:
          payload.code === AI_MODEL_UNAVAILABLE_CODE
            ? payload.error
            : 'Internal server error',
        code: payload.code,
        assistantMessage:
          payload.code === AI_MODEL_UNAVAILABLE_CODE
            ? payload.error
            : 'Sorry, I encountered an error processing your request. Please try again in a moment.',
        details:
          process.env.NODE_ENV === 'development' &&
          payload.code !== AI_MODEL_UNAVAILABLE_CODE
            ? payload.error
            : undefined,
      },
      { status }
    )
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'JAZ Assistant API',
    version: '1.0.0',
  })
}

