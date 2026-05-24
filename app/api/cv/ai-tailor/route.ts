import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { mode, jobDescription, currentSummary, experience, currentSkills, personalInfo } = body

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json({ ok: false, error: 'Job description is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        analysis: mode === 'analyze' ? { keySkills: ['Mock Skill 1', 'Mock Skill 2'], keywords: ['keyword1', 'keyword2'], jobLevel: 'Mid-level' } : null,
        tailoredSummary: mode === 'summary' ? `[MOCK TAILORED] ${currentSummary}` : null,
        tailoredExperience: mode === 'experience' ? experience : null,
        suggestedSkills: mode === 'skills' ? ['Mock Skill 1', 'Mock Skill 2', 'Mock Skill 3'] : null,
      })
    }

    switch (mode) {
      case 'analyze': {
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing job descriptions. Extract key information and return it in a structured format.',
            },
            {
              role: 'user',
              content: `Analyze this job description and extract:
1. Key skills required (5-10 most important)
2. Important keywords (10-15 ATS-relevant terms)
3. Job level (e.g., "Entry-level", "Mid-level", "Senior", "Executive")

Return your response as JSON with this structure:
{
  "keySkills": ["skill1", "skill2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "jobLevel": "Mid-level"
}

Job description:
${jobDescription}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        })

        const result = completion.choices[0]?.message?.content || '{}'
        let analysis
        try {
          // Try to extract JSON from the response (in case it's wrapped in markdown)
          const jsonMatch = result.match(/\{[\s\S]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : result
          analysis = JSON.parse(jsonStr)
          
          // Ensure required fields exist
          if (!analysis.keySkills) analysis.keySkills = []
          if (!analysis.keywords) analysis.keywords = []
          if (!analysis.jobLevel) analysis.jobLevel = 'Not specified'
          
          // Ensure arrays
          if (!Array.isArray(analysis.keySkills)) analysis.keySkills = []
          if (!Array.isArray(analysis.keywords)) analysis.keywords = []
        } catch {
          // Fallback parsing
          analysis = {
            keySkills: [],
            keywords: [],
            jobLevel: 'Not specified',
          }
        }

        return NextResponse.json({ ok: true, analysis })
      }

      case 'summary': {
        if (!currentSummary) {
          return NextResponse.json({ ok: false, error: 'Current summary is required' }, { status: 400 })
        }

        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an expert CV writer. Tailor CV summaries to match job descriptions while following strict rules:
- Do NOT include the candidate's name or honorifics
- Write in neutral, no-pronoun resume style (no "I", "my")
- Emphasize skills and experiences that match the job requirements
- Keep it professional, concise (60-100 words), and ATS-friendly
- Return ONLY the tailored summary text, no explanations`,
            },
            {
              role: 'user',
              content: `Tailor this CV summary to match the job description below. Emphasize relevant skills and experiences.

Current summary:
${currentSummary}

Job description:
${jobDescription}

${currentSkills && currentSkills.length > 0 ? `Current skills: ${currentSkills.join(', ')}` : ''}

Return only the tailored summary text.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        })

        const tailoredSummary = completion.choices[0]?.message?.content || currentSummary

        return NextResponse.json({
          ok: true,
          tailoredSummary: tailoredSummary.trim(),
        })
      }

      case 'experience': {
        if (!experience || experience.length === 0) {
          return NextResponse.json({ ok: false, error: 'Experience is required' }, { status: 400 })
        }

        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an expert at tailoring CV experience sections to job descriptions. Reorder and enhance experience entries to emphasize relevance to the job. Return the tailored experience array as JSON. Each experience entry must have: id, jobTitle, company, and bullets array. Preserve all other fields like location, startDate, endDate, isCurrent.`,
            },
            {
              role: 'user',
              content: `Tailor this experience section to match the job description. Reorder experiences by relevance and enhance bullet points to emphasize matching skills and achievements.

Current experience:
${JSON.stringify(experience, null, 2)}

Job description:
${jobDescription}

Return the tailored experience array as JSON with the same structure. Keep all original data (id, jobTitle, company, location, startDate, endDate, isCurrent) but reorder entries by relevance and enhance bullets to match the job. Each entry must have a bullets array.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })

        const result = completion.choices[0]?.message?.content || '[]'
        let tailoredExperience
        try {
          // Try to extract JSON from the response (in case it's wrapped in markdown)
          const jsonMatch = result.match(/\[[\s\S]*\]/) || result.match(/\{[\s\S]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : result
          tailoredExperience = JSON.parse(jsonStr)
          
          // Validate structure
          if (!Array.isArray(tailoredExperience)) {
            throw new Error('Response is not an array')
          }
          
          // Ensure each entry has required fields
          tailoredExperience = tailoredExperience.map((exp: any, index: number) => {
            const original = experience[index] || experience[0]
            return {
              ...original,
              ...exp,
              id: exp.id || original.id || `exp-${index}`,
              jobTitle: exp.jobTitle || exp.title || original.jobTitle || original.title || '',
              company: exp.company || original.company || '',
              bullets: Array.isArray(exp.bullets) ? exp.bullets : (exp.bullets ? [exp.bullets] : original.bullets || []),
            }
          })
        } catch (parseError) {
          console.error('Failed to parse experience response:', parseError)
          // Return original experience if parsing fails
          tailoredExperience = experience
        }

        return NextResponse.json({
          ok: true,
          tailoredExperience,
        })
      }

      case 'skills': {
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at identifying skills from job descriptions. Extract 5-10 key skills that should be added to a CV.',
            },
            {
              role: 'user',
              content: `Based on this job description, suggest 5-10 skills that should be added to a CV. Return them as a JSON array of strings.

${currentSkills && currentSkills.length > 0 ? `Current skills (don't suggest duplicates): ${currentSkills.join(', ')}\n\n` : ''}Job description:
${jobDescription}

Return only a JSON array like: ["skill1", "skill2", ...]`,
            },
          ],
          temperature: 0.5,
          max_tokens: 200,
        })

        const result = completion.choices[0]?.message?.content || '[]'
        let suggestedSkills: string[] = []
        try {
          // Try to extract JSON array from the response (in case it's wrapped in markdown)
          const jsonMatch = result.match(/\[[\s\S]*\]/)
          const jsonStr = jsonMatch ? jsonMatch[0] : result
          const parsed = JSON.parse(jsonStr)
          
          // Ensure it's an array
          if (!Array.isArray(parsed)) {
            suggestedSkills = []
          } else {
            // Filter out duplicates and normalize
            suggestedSkills = parsed
              .map((skill: any) => String(skill).trim())
              .filter((skill: string) => skill.length > 0)
            
            if (currentSkills && currentSkills.length > 0) {
              const currentSkillsLower = currentSkills.map((s: string) => s.toLowerCase().trim())
              suggestedSkills = suggestedSkills.filter(
                (skill: string) => !currentSkillsLower.includes(skill.toLowerCase().trim())
              )
            }
          }
        } catch (parseError) {
          console.error('Failed to parse skills response:', parseError)
          suggestedSkills = []
        }

        return NextResponse.json({
          ok: true,
          suggestedSkills: suggestedSkills.slice(0, 10), // Limit to 10
        })
      }

      default:
        return NextResponse.json({ ok: false, error: 'Invalid mode' }, { status: 400 })
    }
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to tailor CV. Please try again.')
    return NextResponse.json(body, { status })
  }
}

