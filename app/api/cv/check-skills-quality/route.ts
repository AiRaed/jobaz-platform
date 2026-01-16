import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type SkillsQualityRating = 'excellent' | 'good' | 'needs-improvement'

interface SkillsQualityFeedback {
  rating: SkillsQualityRating
  issues?: string[]
  missingSkills?: string[]
  strengths?: string[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { skills, targetRole, jobDescription, summaryText, experiencePreview } = body

    if (!skills || skills.length === 0) {
      return NextResponse.json({ ok: false, error: 'Skills list is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY - using basic analysis')
      // Fallback to basic analysis
      return NextResponse.json({
        ok: true,
        feedback: {
          rating: 'good',
          strengths: ['Good variety of skills'],
          missingSkills: ['Consider adding more specific technical skills'],
        },
      })
    }

    // Build context for AI evaluation
    let contextInfo = ''
    if (targetRole) {
      contextInfo += `Target Job Role: ${targetRole}\n`
    }
    if (summaryText) {
      contextInfo += `Professional Summary: ${summaryText}\n`
    }
    if (experiencePreview) {
      contextInfo += `Experience Preview: ${experiencePreview}\n`
    }
    if (jobDescription) {
      contextInfo += `\nJob Description:\n${jobDescription}\n`
    }

    // Create evaluation prompt
    const evaluationPrompt = `You are an ATS-aware CV assistant evaluating skills for a job seeker.

${contextInfo ? `Context:\n${contextInfo}\n` : ''}
Current Skills List (${skills.length} skills):
${skills.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

Your task:
1. Identify skills that are too generic or weak (e.g. "hard worker", "team player", "fast learner")
2. Identify skills that are unclear, duplicated, or poorly phrased
3. Check alignment with the job role${jobDescription ? ' and job description' : ''} (use Job Title if available, otherwise general employability)
4. Detect important missing skills that are commonly expected for this role
5. Highlight strengths where the skill list is already strong and ATS-friendly

Rules:
- Do NOT rewrite or auto-edit the skills
- Do NOT apply changes automatically
- Only provide clear, actionable feedback
- Keep feedback concise and easy to understand
- Use bullet points with clear labels

Provide your analysis in JSON format:
{
  "rating": "excellent" | "good" | "needs-improvement",
  "issues": ["issue 1", "issue 2", ...],
  "missingSkills": ["skill 1", "skill 2", ...],
  "strengths": ["strength 1", "strength 2", ...]
}

Evaluation criteria:
- Rating "excellent": Highly relevant, ATS-friendly, well-balanced mix of hard and soft skills, aligned with role
- Rating "good": Generally strong but has minor issues or missing important skills
- Rating "needs-improvement": Too generic, unclear, poor alignment with role, or missing critical skills

Provide 2-4 items for each category (issues, missingSkills, strengths). Be specific and actionable.
Tone: Supportive, professional, and practical. Avoid judgmental language.

Return ONLY valid JSON, no other text.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an ATS-aware CV expert who evaluates skills lists. Return only valid JSON responses.',
        },
        {
          role: 'user',
          content: evaluationPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })

    const result = completion.choices[0]?.message?.content?.trim()
    
    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let feedback: SkillsQualityFeedback
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0])
      } else {
        feedback = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result)
      // Fallback to basic feedback
      return NextResponse.json({
        ok: true,
        feedback: {
          rating: 'good',
          strengths: ['Skills list analyzed'],
          issues: ['Consider reviewing for improvements'],
        },
      })
    }

    // Ensure arrays exist and limit items
    feedback.issues = feedback.issues?.slice(0, 4) || []
    feedback.missingSkills = feedback.missingSkills?.slice(0, 4) || []
    feedback.strengths = feedback.strengths?.slice(0, 4) || []

    return NextResponse.json({
      ok: true,
      feedback,
    })

  } catch (error: any) {
    console.error('Skills quality check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check skills quality' },
      { status: 500 }
    )
  }
}

