import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type ExperienceAIMode = 'responsibilities' | 'achievements' | 'both'
type CareerDomain = 'tech' | 'hospitality' | 'production' | 'customer_service' | 'supervisor' | 'general'

function detectDomain(context: string): CareerDomain {
  const c = context.toLowerCase()

  // tech keywords
  if (/\b(web|developer|frontend|backend|software|react|javascript|typescript|html|css|programming|it|engineer)\b/.test(c)) {
    return 'tech'
  }

  // hospitality / kitchen
  if (/\b(kitchen|chef|cook|line cook|hospitality|restaurant|hotel|barista|food prep|housekeeping|waiter|server)\b/.test(c)) {
    return 'hospitality'
  }

  // warehouse / production / logistics
  if (/\b(warehouse|production|manufacturing|factory|operative|picker|packer|logistics|forklift)\b/.test(c)) {
    return 'production'
  }

  // customer service / retail
  if (/\b(customer service|cashier|retail|shop|store|call center|advisor|agent|sales assistant|customer support)\b/.test(c)) {
    return 'customer_service'
  }

  // supervisor / management
  if (/\b(supervisor|manager|team lead|shift lead|management|leadership)\b/.test(c)) {
    return 'supervisor'
  }

  return 'general'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { jobTitle, company, industry, userNotes, mode } = body

    if (!jobTitle || !jobTitle.trim()) {
      return NextResponse.json({ ok: false, error: 'Job title is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      // Return mock data based on mode
      const mockResponsibilities = [
        'Managed daily operations and coordinated team activities',
        'Developed and implemented strategic initiatives to improve efficiency',
        'Collaborated with cross-functional teams to deliver high-quality results',
      ]
      const mockAchievements = [
        'Increased productivity by 25% through process optimization',
        'Led a team of 5 members to successfully complete multiple projects',
        'Received recognition for outstanding performance and innovation',
      ]

      if (mode === 'responsibilities') {
        return NextResponse.json({
          ok: true,
          responsibilities: mockResponsibilities,
        })
      } else if (mode === 'achievements') {
        return NextResponse.json({
          ok: true,
          achievements: mockAchievements,
        })
      } else {
        return NextResponse.json({
          ok: true,
          responsibilities: mockResponsibilities,
          achievements: mockAchievements,
        })
      }
    }

    // Build contextText for domain detection
    const contextText = [
      jobTitle,
      company,
      industry,
      userNotes
    ].filter(Boolean).join(' ').toLowerCase()

    // Detect career domain
    const domain = detectDomain(contextText)

    // Build context for the prompt
    const contextParts: string[] = []
    contextParts.push(`Job Title: ${jobTitle.trim()}`)
    if (company?.trim()) {
      contextParts.push(`Company: ${company.trim()}`)
    }
    if (industry?.trim()) {
      contextParts.push(`Industry: ${industry.trim()}`)
    }
    if (userNotes?.trim()) {
      contextParts.push(`Additional Context: ${userNotes.trim()}`)
    }

    // Build domain-specific instructions
    const domainInstructions: Record<CareerDomain, string> = {
      tech: 'Focus on software / web / IT responsibilities and achievements. Include technical skills, development work, coding, system maintenance, and IT-related accomplishments.',
      hospitality: 'Focus on kitchen, restaurant, hotel, food prep, hygiene, customer experience, and hospitality teamwork. Include food safety, service quality, and hospitality-specific achievements.',
      production: 'Focus on warehouse, manufacturing, logistics, safety, machinery, process improvement. Include operational efficiency, safety compliance, and production-related accomplishments.',
      customer_service: 'Focus on communication, handling customers, retail or contact center work. Include customer satisfaction, problem resolution, and service-related achievements.',
      supervisor: 'Focus on leadership, scheduling, people management, training, performance, coaching. Include team development, operational oversight, and management-related achievements.',
      general: 'Return broad transferable responsibilities/achievements that could fit many roles, but still stay consistent with the job title given.',
    }

    const domainInstruction = domainInstructions[domain]
    const domainRestriction = domain !== 'general'
      ? `\n\nThe target career domain is: "${domain}".\n\nImportant:\n- Generate bullet points ONLY for this domain.\n- Do not mix responsibilities or achievements from other industries, even if the background mentions them.\n- ${domainInstruction}\n\nDO NOT mix multiple unrelated domains.\nKeep all responsibilities and achievements relevant only to the "${domain}" domain.`
      : `\n\nThe target career domain is: "${domain}".\n\n${domainInstruction}`

    // Build the prompt based on mode
    let systemPrompt = `You are an expert CV writer specializing in professional experience bullet points. Your task is to generate relevant, impactful bullet points for CV experience sections. Follow these strict rules:
- Write in neutral, no-pronoun resume style (no "I", "my", "he/she")
- Use action verbs at the start of each bullet point
- Focus on quantifiable achievements and measurable impact when possible
- Keep each bullet point concise (one line, typically 10-20 words)
- Make bullets specific and relevant to the job title
- Write in English only
- Return ONLY the bullet points, one per line, without any prefixes, labels, or numbering
- Do NOT include "- " or "• " at the start of each bullet
- Do NOT include section headers like "RESPONSIBILITIES:" or "ACHIEVEMENTS:" in the output${domainRestriction}`

    let userPrompt = `Generate professional CV bullet points for the following role:

${contextParts.join('\n')}

Detected career domain: ${domain}

Generate bullet points for the role: ${jobTitle.trim()} in the ${domain} domain.

`

    if (mode === 'responsibilities') {
      userPrompt += `Generate 4-6 responsibility bullet points that describe typical duties and tasks for this role. Focus on what the person did day-to-day, their key responsibilities, and the scope of their work.`
    } else if (mode === 'achievements') {
      userPrompt += `Generate 4-6 achievement bullet points that highlight accomplishments, results, and impact. Focus on quantifiable outcomes, improvements, recognitions, and successful projects.`
    } else {
      userPrompt += `Generate bullet points in two sections:
1. RESPONSIBILITIES: 4-6 bullet points describing typical duties and tasks
2. ACHIEVEMENTS: 4-6 bullet points highlighting accomplishments and quantifiable results

Format your response exactly as:
RESPONSIBILITIES:
[bullet point 1]
[bullet point 2]
...

ACHIEVEMENTS:
[bullet point 1]
[bullet point 2]
...`
    }

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
      max_tokens: 1000,
    })

    const result = completion.choices[0]?.message?.content || ''

    // Parse the response based on mode
    if (mode === 'responsibilities') {
      const bullets = result
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => {
          // Remove empty lines and lines that look like headers
          return (
            line.length > 0 &&
            !line.match(/^(RESPONSIBILITIES|ACHIEVEMENTS):?$/i) &&
            !line.startsWith('- ') &&
            !line.startsWith('• ')
          )
        })
        .slice(0, 6) // Limit to 6 bullets

      return NextResponse.json({
        ok: true,
        responsibilities: bullets,
      })
    } else if (mode === 'achievements') {
      const bullets = result
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => {
          return (
            line.length > 0 &&
            !line.match(/^(RESPONSIBILITIES|ACHIEVEMENTS):?$/i) &&
            !line.startsWith('- ') &&
            !line.startsWith('• ')
          )
        })
        .slice(0, 6) // Limit to 6 bullets

      return NextResponse.json({
        ok: true,
        achievements: bullets,
      })
    } else {
      // Parse both sections
      const responsibilitiesMatch = result.match(/RESPONSIBILITIES:\s*([\s\S]*?)(?=ACHIEVEMENTS:|$)/i)
      const achievementsMatch = result.match(/ACHIEVEMENTS:\s*([\s\S]*?)$/i)

      const parseBullets = (text: string) => {
        return text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => {
            return (
              line.length > 0 &&
              !line.match(/^(RESPONSIBILITIES|ACHIEVEMENTS):?$/i) &&
              !line.startsWith('- ') &&
              !line.startsWith('• ')
            )
          })
          .slice(0, 6) // Limit to 6 bullets per section
      }

      const responsibilities = responsibilitiesMatch
        ? parseBullets(responsibilitiesMatch[1])
        : []
      const achievements = achievementsMatch ? parseBullets(achievementsMatch[1]) : []

      // Fallback: if parsing failed, try to split the result in half
      if (responsibilities.length === 0 && achievements.length === 0) {
        const allBullets = parseBullets(result)
        const midPoint = Math.ceil(allBullets.length / 2)
        return NextResponse.json({
          ok: true,
          responsibilities: allBullets.slice(0, midPoint),
          achievements: allBullets.slice(midPoint),
        })
      }

      return NextResponse.json({
        ok: true,
        responsibilities,
        achievements,
      })
    }
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to generate bullet points. Please try again.')
    return NextResponse.json(body, { status })
  }
}

