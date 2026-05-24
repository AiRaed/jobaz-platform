import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type SkillsAIMode = 'hard' | 'soft' | 'both'
type CareerDomain = 'tech' | 'hospitality' | 'production' | 'customer_service' | 'supervisor' | 'general'

function detectDomain(context: string): CareerDomain {
  // tech keywords
  if (context.match(/\b(web|developer|react|javascript|frontend|software|html|css|programming|it)\b/)) {
    return 'tech'
  }

  // hospitality / kitchen keywords
  if (context.match(/\b(kitchen|chef|cook|hospitality|food prep|restaurant|housekeeping)\b/)) {
    return 'hospitality'
  }

  // warehouse / production / logistics
  if (context.match(/\b(warehouse|production|manufacturing|logistics|operative|factory)\b/)) {
    return 'production'
  }

  // customer service / retail
  if (context.match(/\b(customer service|cashier|retail|shop|store|sales assistant)\b/)) {
    return 'customer_service'
  }

  // supervisor / leadership
  if (context.match(/\b(supervisor|manager|leadership|team lead|shift lead)\b/)) {
    return 'supervisor'
  }

  // fallback
  return 'general'
}

function getMockSkillsForDomain(domain: CareerDomain, mode: SkillsAIMode): string[] {
  const domainSkills: Record<CareerDomain, { hard: string[]; soft: string[] }> = {
    tech: {
      hard: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Git', 'HTML', 'CSS', 'APIs'],
      soft: ['Problem Solving', 'Code Review', 'Agile Methodology', 'Technical Communication'],
    },
    hospitality: {
      hard: ['Food Hygiene', 'Food Prep', 'Menu Knowledge', 'Kitchen Equipment'],
      soft: ['Teamwork', 'Communication', 'Time Management', 'Customer Service', 'Attention to Detail'],
    },
    production: {
      hard: ['Warehouse Operations', 'Picking & Packing', 'Machinery Operation', 'Safety Protocols'],
      soft: ['Efficiency', 'Attention to Detail', 'Teamwork', 'Process Optimization'],
    },
    customer_service: {
      hard: ['POS Systems', 'CRM Software', 'Payment Processing'],
      soft: ['Communication', 'Empathy', 'Dispute Resolution', 'Fast-Paced Environment', 'Active Listening'],
    },
    supervisor: {
      hard: ['Scheduling Software', 'Performance Management', 'Training Programs'],
      soft: ['Leadership', 'People Management', 'Delegation', 'Conflict Resolution', 'Team Building'],
    },
    general: {
      hard: ['Microsoft Office', 'Data Entry', 'Basic Computer Skills'],
      soft: ['Communication', 'Time Management', 'Problem Solving', 'Adaptability', 'Teamwork'],
    },
  }

  const skills = domainSkills[domain]
  if (mode === 'hard') {
    return skills.hard
  } else if (mode === 'soft') {
    return skills.soft
  } else {
    return [...skills.hard.slice(0, 3), ...skills.soft.slice(0, 2)]
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, targetRole, summaryText, experiencePreview, userNotes } = body

    // Check if we have at least some context
    if (!targetRole?.trim() && !summaryText?.trim() && !experiencePreview?.trim() && !userNotes?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Please provide at least a target role, summary, experience, or additional context' },
        { status: 400 }
      )
    }

    // Build contextText for domain detection (lowercased combined string)
    const contextTextParts: string[] = []
    if (targetRole?.trim()) contextTextParts.push(targetRole.trim())
    if (summaryText?.trim()) contextTextParts.push(summaryText.trim())
    if (experiencePreview?.trim()) contextTextParts.push(experiencePreview.trim())
    if (userNotes?.trim()) contextTextParts.push(userNotes.trim())
    
    const contextText = contextTextParts.join(' ').toLowerCase()

    // Detect career domain
    const domain = detectDomain(contextText)

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      // Return mock data based on mode and domain
      const mockSkills = getMockSkillsForDomain(domain, mode)
      return NextResponse.json({
        ok: true,
        skills: mockSkills,
      })
    }

    // Build context for the prompt
    const contextParts: string[] = []
    if (targetRole?.trim()) {
      contextParts.push(`Target Role/Job Title: ${targetRole.trim()}`)
    }
    if (summaryText?.trim()) {
      contextParts.push(`Professional Summary: ${summaryText.trim()}`)
    }
    if (experiencePreview?.trim()) {
      contextParts.push(`Experience: ${experiencePreview.trim()}`)
    }
    if (userNotes?.trim()) {
      contextParts.push(`Additional Context: ${userNotes.trim()}`)
    }

    const context = contextParts.join('\n\n')

    // Build domain-specific instruction
    const domainInstructions: Record<CareerDomain, string> = {
      tech: 'Return ONLY coding, software, and frontend skills (e.g., React, JavaScript, APIs, Git, HTML, CSS, TypeScript, Node.js). Do NOT include skills from other domains.',
      hospitality: 'Return ONLY food prep, customer service, teamwork, hygiene, and hospitality soft skills. Do NOT include technical programming or warehouse skills.',
      production: 'Return ONLY warehouse, picking, machinery, safety, and process optimization skills. Do NOT include coding or hospitality skills.',
      customer_service: 'Return ONLY communication, POS systems, dispute handling, empathy, and fast-paced environment skills. Do NOT include technical programming or production skills.',
      supervisor: 'Return ONLY leadership, people management, training, scheduling, and delegation skills. Do NOT include domain-specific technical skills unless they are management-related.',
      general: 'Return broad transferable skills that apply across industries. Focus on soft skills and general competencies.',
    }

    // Build the prompt based on mode
    let skillTypeInstruction = ''
    if (mode === 'hard') {
      skillTypeInstruction = 'Focus on technical, job-specific, and measurable skills (e.g., programming languages, software tools, certifications, technical competencies).'
    } else if (mode === 'soft') {
      skillTypeInstruction = 'Focus on interpersonal, behavioral, and transferable skills (e.g., communication, leadership, problem-solving, teamwork, adaptability).'
    } else {
      skillTypeInstruction = 'Provide a balanced mix of both hard skills (technical, job-specific) and soft skills (interpersonal, behavioral).'
    }

    const domainInstruction = domainInstructions[domain]
    const domainRestriction = domain !== 'general' 
      ? `\n\nCRITICAL: Based on the detected target domain "${domain}", ${domainInstruction}\n\nDO NOT mix multiple career domains. Return skills ONLY from the selected domain "${domain}".`
      : ''

    const systemPrompt = `You are an expert CV writer specializing in skill identification and recommendation. Your task is to suggest relevant skills for a CV based on the user's role, background, and context.

Follow these strict rules:
- Return ONLY a plain list of skill names, one per line
- Do NOT include bullets, numbering, dashes, or any prefixes
- Do NOT include section headers or labels
- Each skill should be a concise, professional skill name (typically 1-3 words)
- Suggest 8-15 relevant skills based on the context
- Make skills specific and industry-appropriate
- Avoid generic or overly vague skills
- Write in English only
- ${skillTypeInstruction}${domainRestriction}`

    const userPrompt = `Based on the following information, suggest relevant skills for a CV:

${context}

Detected career domain: ${domain}

Please suggest ${mode === 'hard' ? 'hard/technical' : mode === 'soft' ? 'soft/interpersonal' : 'a balanced mix of hard and soft'} skills that would be appropriate for this role and background.${domainRestriction}`

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const result = completion.choices[0]?.message?.content || ''

    // Parse the response - split by newlines and clean up
    const skills = result
      .split('\n')
      .map((line) => {
        // Remove bullets, numbering, dashes, and other prefixes
        return line
          .replace(/^[-•*]\s*/, '') // Remove bullet points
          .replace(/^\d+[.)]\s*/, '') // Remove numbering
          .replace(/^[a-z][.)]\s*/, '') // Remove letter numbering
          .trim()
      })
      .filter((line) => {
        // Remove empty lines and lines that look like headers
        return (
          line.length > 0 &&
          !line.match(/^(HARD|SOFT|SKILLS|TECHNICAL|INTERPERSONAL):?$/i) &&
          line.length < 50 // Reasonable skill name length
        )
      })
      .slice(0, 15) // Limit to 15 skills

    if (skills.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No skills were generated. Please try again with more context.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      skills,
    })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to generate skills. Please try again.')
    return NextResponse.json(body, { status })
  }
}

