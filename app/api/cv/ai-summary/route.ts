import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type CareerDomain = 'tech' | 'design' | '3d_animation' | 'hospitality' | 'production' | 'customer_service' | 'supervisor' | 'general'

function detectDomain(context: string): CareerDomain {
  const c = context.toLowerCase()

  // 3D animation / motion / CG - check this FIRST before design to avoid conflicts
  if (/\b(3d animator|3d animation|cgi|maya|blender|cinema 4d|3ds max|rigging|character animation|motion graphics|vfx|visual effects|unity|unreal|houdini|zbrush|substance painter|3d modeling|3d artist)\b/.test(c)) {
    return '3d_animation'
  }

  // design / graphic design
  if (/\b(graphic design|graphic designer|branding|typography|layout design|digital printing|visual communication|adobe creative suite|illustrator|photoshop|indesign|print design|logo design)\b/.test(c)) {
    return 'design'
  }

  // tech / dev / security
  if (/\b(web developer|frontend|backend|software engineer|programmer|javascript|react|html|css|it|typescript|node|python|java|developer|engineer|security|cybersecurity|information security|network security|security analyst|security engineer|penetration testing|ethical hacking|security specialist)\b/.test(c)) {
    return 'tech'
  }

  // hospitality / kitchen
  if (/\b(kitchen|chef|cook|hospitality|restaurant|barista|food prep|hotel|housekeeping|waiter|server)\b/.test(c)) {
    return 'hospitality'
  }

  // warehouse / production / logistics
  if (/\b(warehouse|production|manufacturing|factory|operative|logistics|picker|packer|forklift)\b/.test(c)) {
    return 'production'
  }

  // customer service / retail
  if (/\b(customer service|cashier|retail|shop|store|call center|advisor|agent|sales assistant|support)\b/.test(c)) {
    return 'customer_service'
  }

  // supervisor / manager
  if (/\b(supervisor|manager|team lead|shift lead|management|leadership)\b/.test(c)) {
    return 'supervisor'
  }

  return 'general'
}

// Extract keywords from instruction text
function extractKeywords(instruction: string): string {
  // Try to extract keywords from patterns like "using the following keywords: ..."
  const keywordMatch = instruction.match(/keywords?[:\s]+([^\.]+)/i)
  if (keywordMatch) {
    return keywordMatch[1].trim()
  }
  // If no explicit pattern, return the instruction itself (it might be the keywords)
  return instruction.trim()
}

// Extract generic transferable skills from CV context (soft skills, communication, teamwork, etc.)
function extractGenericSkills(skills: string[] | undefined, latestRole: string | undefined, experiencePreview: string | undefined): string {
  const genericSkillPatterns = [
    /\b(communication|teamwork|collaboration|leadership|problem.?solving|attention to detail|reliability|punctuality|adaptability|flexibility|time management|organization|work ethic|dedication|professionalism|initiative|critical thinking|analytical|multitasking|customer.?focused|results.?oriented)\b/gi
  ]
  
  const text = [
    ...(skills || []),
    latestRole || '',
    experiencePreview || ''
  ].join(' ').toLowerCase()
  
  const foundSkills: string[] = []
  genericSkillPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      foundSkills.push(...matches.map(m => m.trim()))
    }
  })
  
  // Remove duplicates and return
  return [...new Set(foundSkills)].join(', ')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { summary, personalInfo, skills, instruction, latestRole, experiencePreview } = body

    // Check if this is a keyword-based generation (instruction contains "keywords" and summary is empty/not provided)
    const isKeywordGeneration = instruction?.toLowerCase().includes('keywords') && (!summary || !summary.trim())

    if (!isKeywordGeneration && (!summary || !summary.trim())) {
      return NextResponse.json({ ok: false, error: 'Summary is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        summary: isKeywordGeneration ? `[MOCK] ${instruction}` : `[MOCK] ${instruction}\n\n${summary}`,
      })
    }

    // Extract keywords if this is keyword generation
    let keywords = ''
    if (isKeywordGeneration) {
      keywords = extractKeywords(instruction)
    }

    // For keyword generation, detect domain from keyword FIRST, then compare with CV context
    let domain: CareerDomain = 'general'
    let useCvContext = false
    
    if (isKeywordGeneration && keywords) {
      // Step 1: Detect domain from keyword FIRST
      const keywordDomain = detectDomain(keywords.toLowerCase())
      
      // Step 2: Build CV context separately (summary + skills + latestRole + experiencePreview)
      const cvContextParts: string[] = []
      if (summary?.trim()) cvContextParts.push(summary.trim())
      if (skills && skills.length > 0) {
        cvContextParts.push(skills.slice(0, 5).join(', '))
      }
      if (latestRole?.trim()) cvContextParts.push(latestRole.trim())
      if (experiencePreview?.trim()) cvContextParts.push(experiencePreview.trim())
      
      const cvContext = cvContextParts.join(' ').toLowerCase()
      const cvDomain = detectDomain(cvContext)
      
      // Step 3: Decide how much to trust existing CV context
      if (keywordDomain === 'general' && cvDomain !== 'general') {
        // No clear domain in keyword, but CV has one → we can lean on CV domain
        domain = cvDomain
        useCvContext = true
      } else if (keywordDomain === cvDomain) {
        // Same domain → we can safely use both keyword + CV context
        domain = keywordDomain
        useCvContext = true
      } else {
        // Different domains (career change) → prioritize keyword domain,
        // and use CV context only for generic transferable soft skills
        domain = keywordDomain
        useCvContext = false
      }
    } else {
      // For non-keyword generation, use the original combined approach
      const contextTextParts: string[] = []
      if (keywords) contextTextParts.push(keywords)
      if (latestRole?.trim()) contextTextParts.push(latestRole.trim())
      if (summary?.trim()) contextTextParts.push(summary.trim())
      if (skills && skills.length > 0) {
        contextTextParts.push(skills.slice(0, 5).join(', '))
      }
      if (experiencePreview?.trim()) contextTextParts.push(experiencePreview.trim())
      
      const contextText = contextTextParts.join(' ').toLowerCase()
      domain = detectDomain(contextText)
      useCvContext = true // For non-keyword generation, always use CV context
    }

    // Build domain-specific instructions
    const domainInstructions: Record<CareerDomain, string> = {
      '3d_animation': 'Focus on 3D animation, CGI, motion graphics, character animation, rigging, rendering, game / film pipelines, and tools like Maya, Blender, Cinema 4D, 3ds Max, Unity, Unreal, After Effects. Do NOT talk about branding, print design, or generic graphic design unless explicitly requested.',
      design: 'Focus on graphic design, branding, typography, layout, visual communication, Adobe Creative Suite, print and digital design, logo design, etc. Do NOT talk about 3D animation tools or software development.',
      tech: 'Focus on software/web development, coding languages, frameworks, problem-solving, technical skills, system architecture, etc.',
      hospitality: 'Focus on food prep, customer experience, hygiene, teamwork in hospitality, kitchen operations, service quality, etc.',
      production: 'Focus on operations, manufacturing, warehouse, logistics, safety protocols, process optimization, etc.',
      customer_service: 'Focus on communication, customer care, empathy, resolving issues, retail operations, support systems, etc.',
      supervisor: 'Focus on leadership, scheduling, training, performance management, team coordination, delegation, etc.',
      general: 'Write a broad but still coherent summary based on the given keywords.',
    }

    const domainInstruction = domainInstructions[domain]
    
    // Build domain restriction message - always emphasize keyword role is the master for keyword generation
    let domainRestriction = ''
    if (isKeywordGeneration) {
      domainRestriction = domain !== 'general'
        ? `\n\nThe user's target role is EXACTLY: "${keywords}".\n\nThe detected target domain is: "${domain}".\n\nImportant rules:\n- The summary MUST clearly match this target role and domain.\n- If the existing CV background is in a different domain, treat that as previous experience and only reuse generic transferable strengths (teamwork, communication, reliability, etc.), not domain-specific jargon.\n- Do NOT keep talking about the old domain (e.g., graphic design) if the keyword points to a new domain (e.g., security).\n- When context is very limited or empty (new CV), rely entirely on the keyword and standard expectations for that role.\n- Always align the summary with the role described by the keyword string, even if previous CV content suggests a different role.\n- ${domainInstruction}`
        : `\n\nThe user's target role is EXACTLY: "${keywords}".\n\nThe detected target domain is: "${domain}".\n\nImportant rules:\n- The summary MUST clearly match this target role.\n- If the existing CV background is in a different domain, treat that as previous experience and only reuse generic transferable strengths (teamwork, communication, reliability, etc.), not domain-specific jargon.\n- When context is very limited or empty (new CV), rely entirely on the keyword and standard expectations for that role.\n- ${domainInstruction}`
    } else {
      // For non-keyword generation, use the original domain restriction
      domainRestriction = domain !== 'general'
        ? `\n\nThe target career domain is: "${domain}".\n\nImportant:\n- The summary MUST clearly match this domain.\n- Do not drift into other domains even if other background information mentions them.\n- Use the provided keywords as the main hint for role, and adapt tone/skills accordingly.\n- ${domainInstruction}\n\nDO NOT mix unrelated domains.\nKeep the entire summary consistent with the "${domain}" domain.`
        : `\n\nThe target career domain is: "${domain}".\n\n${domainInstruction}`
    }

    const systemPrompt = `You are an expert CV writer specializing in professional summaries. Your task is to improve CV summaries while following these strict rules:
- Do NOT include the candidate's name or any honorifics (no "Mr.", "Ms.", "Dr.")
- Write in neutral, no-pronoun resume style (no "I", "my", "he/she")
- Keep it professional, concise, and ATS-friendly
- Maintain the core message and key achievements
- Write in English only
- Return ONLY the improved summary text, no explanations or labels
- Single paragraph only. No bullets, headings, or labels. 60–100 words max (unless instructed otherwise).
- Plain text only.${domainRestriction}`

    let userPrompt = ''
    if (isKeywordGeneration) {
      // Build context based on useCvContext flag
      const contextParts: string[] = []
      
      // Always include the keyword explicitly
      contextParts.push(`Target role keywords: "${keywords}".`)
      
      if (useCvContext) {
        // Same domain or keyword is general → include CV context
        const cvContextParts: string[] = []
        if (summary?.trim()) cvContextParts.push(summary.trim())
        if (skills && skills.length > 0) {
          cvContextParts.push(`Skills: ${skills.slice(0, 5).join(', ')}`)
        }
        if (latestRole?.trim()) cvContextParts.push(`Latest role: ${latestRole.trim()}`)
        if (experiencePreview?.trim()) cvContextParts.push(`Experience: ${experiencePreview.trim()}`)
        
        if (cvContextParts.length > 0) {
          contextParts.push(`CV background (same domain): "${cvContextParts.join(' ')}"`)
        }
      } else {
        // Different domains (career change) → only include generic transferable skills
        const genericSkills = extractGenericSkills(skills, latestRole, experiencePreview)
        if (genericSkills) {
          contextParts.push(`Generic transferable strengths: ${genericSkills}`)
        }
        contextParts.push(`Note: The user is changing careers. The previous CV background may be in another domain. Use only generic transferable strengths (e.g., communication, teamwork, attention to detail), and focus the summary on the NEW target role based on the keywords. Do NOT describe old job domains.`)
      }
      
      // Check if CV is new/empty
      const isNewCv = !summary?.trim() && (!skills || skills.length === 0) && !latestRole?.trim() && !experiencePreview?.trim()
      
      if (isNewCv) {
        contextParts.push(`Note: This is a new CV with very little background information. Write a generic but strong professional summary for someone aiming for this role, focusing on typical strengths and responsibilities for that role.`)
      }
      
      userPrompt = `${instruction}

${contextParts.join('\n\n')}

Generate a professional CV summary that clearly matches the target role and domain.${domainRestriction}

Return only the generated summary text.`
    } else {
      // For existing summary improvements, use domain as a hint but don't change the role
      const domainHint = domain !== 'general'
        ? `\n\nNote: The detected career domain is "${domain}". Use this as a hint for appropriate terminology and wording, but do NOT change the high-level role or drift into a different domain. Maintain consistency with the existing summary's domain.`
        : ''
      
      // Build context for non-keyword generation
      const context = []
      if (personalInfo?.fullName) {
        context.push(`Name: ${personalInfo.fullName}`)
      }
      if (skills && skills.length > 0) {
        context.push(`Skills: ${skills.join(', ')}`)
      }
      
      userPrompt = `${instruction}

${context.length > 0 ? `Context:\n${context.join('\n')}\n\n` : ''}Current summary:
${summary}${domainHint}

Return only the improved summary text.`
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
      max_tokens: 300,
    })

    const improvedSummary = completion.choices[0]?.message?.content || (isKeywordGeneration ? '' : summary)

    return NextResponse.json({
      ok: true,
      summary: improvedSummary.trim(),
    })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to improve summary. Please try again.')
    return NextResponse.json(body, { status })
  }
}

