import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface ApplyAssistantRequest {
  job: {
    title: string
    company: string
    description: string
    requirements?: string
  }
  cv: {
    summary: string
    experience: Array<{
      title?: string
      company?: string
      duration?: string
      description?: string
    }>
    skills: string[]
  }
  language: string
}

interface ApplyAssistantResponse {
  jobAnalysis: {
    requiredSkills: string[]
    requiredExperience: string[]
    responsibilities: string[]
    sector: string
    keywords: string[]
    seniorityLevel: string
  }
  comparison: {
    matchingSkills: string[]
    missingSkills: string[]
    strengths: string[]
    risks: string[]
  }
  fitScore: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  improvedSummary: string
  coverLetter: string
  actionPlan: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplyAssistantRequest = await request.json()

    if (!body.job || !body.cv) {
      return NextResponse.json(
        { error: 'Missing required fields: job, cv' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Prepare CV text for analysis
    const cvText = `
Summary: ${body.cv.summary || 'None'}

Experience:
${body.cv.experience.map((exp, i) => 
  `${i + 1}. ${exp.title || 'N/A'} at ${exp.company || 'N/A'}\n   ${exp.description || 'No description'}`
).join('\n\n')}

Skills: ${body.cv.skills.join(', ') || 'None listed'}
`.trim()

    // Step 1: Job Analysis
    const jobAnalysisPrompt = `Analyze this job posting and extract the following information in JSON format:
{
  "requiredSkills": ["skill1", "skill2", ...],
  "requiredExperience": ["experience1", "experience2", ...],
  "responsibilities": ["responsibility1", "responsibility2", ...],
  "sector": "industry/sector",
  "keywords": ["keyword1", "keyword2", ...],
  "seniorityLevel": "junior/mid/senior/executive"
}

Job Title: ${body.job.title}
Company: ${body.job.company}
Description: ${body.job.description}
${body.job.requirements ? `Requirements: ${body.job.requirements}` : ''}

Return ONLY valid JSON, no additional text.`

    const jobAnalysisResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: jobAnalysisPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const jobAnalysis = JSON.parse(jobAnalysisResponse.choices[0]?.message?.content || '{}')

    // Step 2: CV Comparison
    const comparisonPrompt = `Compare the user's CV with the job requirements and provide JSON analysis:
{
  "matchingSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "strengths": ["strength1", "strength2", ...],
  "risks": ["risk1", "risk2", ...]
}

Job Requirements:
${JSON.stringify(jobAnalysis, null, 2)}

User's CV:
${cvText}

Return ONLY valid JSON, no additional text.`

    const comparisonResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: comparisonPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const comparison = JSON.parse(comparisonResponse.choices[0]?.message?.content || '{}')

    // Step 3: Calculate Fit Score (0-100)
    const skillsMatch = (comparison.matchingSkills?.length || 0) / (jobAnalysis.requiredSkills?.length || 1)
    const missingSkillsPenalty = (comparison.missingSkills?.length || 0) * 0.1
    const experienceMatch = comparison.strengths?.length > 0 ? 0.3 : 0.1
    const baseScore = Math.round((skillsMatch * 0.5 + experienceMatch * 0.5) * 100)
    const finalScore = Math.max(0, Math.min(100, baseScore - Math.round(missingSkillsPenalty * 10)))

    // Step 4: Generate Fit Score Details
    const fitScorePrompt = `Based on this job analysis, provide strengths and weaknesses in JSON format:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"]
}

Job: ${body.job.title} at ${body.job.company}
Matching Skills: ${comparison.matchingSkills?.join(', ') || 'None'}
Missing Skills: ${comparison.missingSkills?.join(', ') || 'None'}
Strengths: ${comparison.strengths?.join(', ') || 'None'}
Risks: ${comparison.risks?.join(', ') || 'None'}

Return ONLY valid JSON, no additional text.`

    const fitScoreResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: fitScorePrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const fitScoreDetails = JSON.parse(fitScoreResponse.choices[0]?.message?.content || '{}')

    const fitScore = {
      score: finalScore,
      strengths: fitScoreDetails.strengths || [],
      weaknesses: fitScoreDetails.weaknesses || [],
    }

    // Step 5: Generate Improved CV Summary
    const improvedSummaryPrompt = `Rewrite the user's CV summary to be tailored specifically for this job. Keep it professional, concise (2-3 sentences), and highlight the most relevant experience and skills.

Original Summary: ${body.cv.summary || 'None'}

Job Title: ${body.job.title}
Company: ${body.job.company}
Required Skills: ${jobAnalysis.requiredSkills?.join(', ') || 'Not specified'}
Key Responsibilities: ${jobAnalysis.responsibilities?.slice(0, 3).join(', ') || 'Not specified'}

User's Relevant Experience:
${body.cv.experience.slice(0, 3).map(exp => `- ${exp.title || 'Position'} at ${exp.company || 'Company'}: ${exp.description || 'No description'}`).join('\n')}

User's Skills: ${body.cv.skills.join(', ')}

Return ONLY the improved summary text, no labels or explanations.`

    const improvedSummaryResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: improvedSummaryPrompt }],
      temperature: 0.7,
      max_tokens: 200,
    })

    const improvedSummary = improvedSummaryResponse.choices[0]?.message?.content?.trim() || ''

    // Step 6: Generate Cover Letter
    const coverLetterPrompt = `Write a professional cover letter tailored to this specific job. Include:
1. Opening paragraph addressing the company and position
2. Body paragraph highlighting top 3 strengths relevant to the role
3. Why the candidate is a good fit
4. Closing paragraph with call to action

Job Title: ${body.job.title}
Company: ${body.job.company}
Job Description: ${body.job.description}

Candidate's Top Strengths: ${comparison.strengths?.slice(0, 3).join(', ') || 'Relevant experience and skills'}
Candidate's Experience: ${body.cv.experience.slice(0, 2).map(exp => `${exp.title || 'Position'} at ${exp.company || 'Company'}`).join(', ')}
Candidate's Skills: ${body.cv.skills.slice(0, 5).join(', ')}

Write a complete cover letter with greeting and closing. Keep it professional and concise (3-4 paragraphs, approximately 200-250 words).`

    const coverLetterResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: coverLetterPrompt }],
      temperature: 0.7,
      max_tokens: 400,
    })

    const coverLetter = coverLetterResponse.choices[0]?.message?.content?.trim() || ''

    // Step 7: Generate Action Plan (concise, max 6 bullets, grouped by CV, Cover, Interview, Apply)
    const actionPlanPrompt = `Create a concise action plan for applying to this job. Maximum 6 bullets, grouped by category:
- CV: Tailor CV summary to match job requirements
- Cover: Generate tailored cover letter
- Interview: Practice interview questions
- Apply: Submit application

Job: ${body.job.title} at ${body.job.company}
Missing Skills: ${comparison.missingSkills?.join(', ') || 'None'}
Areas to Improve: ${fitScore.weaknesses?.slice(0, 3).join(', ') || 'None'}

Format as numbered bullets (1. 2. 3. etc.). Be concise and actionable. Maximum 6 bullets total.`

    const actionPlanResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: actionPlanPrompt }],
      temperature: 0.7,
      max_tokens: 300,
    })

    const actionPlan = actionPlanResponse.choices[0]?.message?.content?.trim() || ''

    const response: ApplyAssistantResponse = {
      jobAnalysis,
      comparison,
      fitScore,
      improvedSummary,
      coverLetter,
      actionPlan,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(
      error,
      'Failed to process apply assistant request'
    )
    return NextResponse.json(body, { status })
  }
}

