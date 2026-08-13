import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getOpenAiModel } from '@/lib/openai-model'
import { mapPathnameToApiContext, type JazApiPageContext } from '@/lib/jaz/pageRegistry'
import { enforceAiUsageLimit } from '@/lib/ai-usage/guard'

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
function getPageContextInstruction(pageContext: JazApiPageContext): string {
  const instructions: Record<JazApiPageContext, string> = {
    landing:
      'The user is on the JobAZ landing page. Explain the platform (AI career assessment, UK jobs, courses). Encourage starting the free Career Assessment. Keep answers short and action-oriented.',
    dashboard:
      'The user is on the Dashboard. Explain their career progress, readiness, and next steps from their plan. Reference Career Brain recommendations when relevant — never invent new recommendations.',
    'career-plan':
      'The user is viewing their Career Brain plan. Explain recommendations, readiness score, missing qualifications, courses, and progression. Career Brain decides; you explain why each step matters. Never invent recommendations.',
    cv: 'The user is on the CV Builder. Guide section by section. Explain why each section matters to UK recruiters.',
    cover: 'The user is on the Cover Letter Builder. Guide opening, body, and closing.',
    'job-details':
      'The user is viewing a job. Explain match reasons, salary, required skills, and CV improvements for this role.',
    'job-finder':
      'The user is searching UK jobs. Explain matches, salary, skills, and how jobs connect to their career plan.',
    interview:
      'The user is on Interview Coach. Coach before practice. Explain questions and STAR structure.',
    courses:
      'The user is browsing courses. Explain why courses are recommended, career impact, and roadmap fit. Do not invent course recommendations.',
    other: 'Provide general UK career assistance. Be concise and action-oriented.',
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
function getDefaultUserMessageForMode(mode: 'ask' | 'guide' | 'translate', pageContext: JazApiPageContext): string {
  if (mode === 'guide') {
    const defaults: Partial<Record<JazApiPageContext, string>> = {
      dashboard: 'What should I do next in my career plan?',
      cv: 'Guide me through the CV section I am working on.',
      cover: 'Guide me through my cover letter step by step.',
      'job-details': 'Guide me on preparing my application for this job.',
      interview: 'Coach me before I start practising interview answers.',
      'job-finder': 'Help me find jobs that match my career plan.',
      'career-plan': 'Explain my career plan and what I should do next.',
      landing: 'Explain JobAZ and how to get started.',
      courses: 'Explain why these courses matter for my career.',
    }
    return defaults[pageContext] ?? 'What should I do next in my UK career journey?'
  }
  
  if (mode === 'translate') {
    return 'Please translate this text.'
  }
  
  return 'How can I help you?'
}

// Build system prompt for JAZ persona
function getJazSystemPrompt(): string {
  return `You are JAZ, the user's personal AI career companion inside JobAZ — a UK career platform combining AI guidance, jobs, and training.

Your role: EXPLAIN, GUIDE, RECOMMEND (only from Career Brain data), ANSWER questions, and help the user complete every step of their career plan.
Career Brain always decides the plan. You never invent recommendations, courses, jobs, or readiness scores.

Personality: friendly, professional, encouraging. Keep answers SHORT (2–4 sentences unless the user asks for detail). Always action-oriented.

Adapt automatically to the current page. The user sees one unified assistant — never mention tabs or modes.`
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

    const pathname = body.pathname || ''
    const pageContext = mapPathnameToApiContext(pathname)

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

    const usageGate = await enforceAiUsageLimit(req, 'jaz_assistant', `jaz-${body.mode}`)
    if (!usageGate.allowed) return usageGate.response

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
      model: getOpenAiModel(),
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
  } catch (error: any) {
    console.error('JAZ API Error:', error)
    
    // Return user-friendly error message
    const errorMessage = error.message || 'Failed to process your request'
    return NextResponse.json(
      { 
        error: 'Internal server error',
        assistantMessage: 'Sorry, I encountered an error processing your request. Please try again in a moment.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
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

