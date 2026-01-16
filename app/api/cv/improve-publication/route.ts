import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

type QualityRating = 'Strong' | 'Good' | 'Needs Improvement'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, authors, venueOrJournal, year, doiOrUrl, notes, mode, action } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ ok: false, error: 'Title is required' }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY - using basic analysis')
      // Fallback to basic analysis
      return NextResponse.json({
        ok: true,
        qualityRating: 'Good',
        issues: ['Consider adding more detail to notes'],
        improved: {
          title: title.trim(),
          notes: notes?.trim() || '',
        },
      })
    }

    const isAcademic = mode === 'academic'

    let prompt = ''
    if (action === 'check') {
      prompt = `You are a professional CV and academic publication expert. Analyze the following publication entry and provide quality feedback.

Publication:
Title: ${title}
${authors ? `Authors: ${authors}` : ''}
${venueOrJournal ? `Venue/Journal: ${venueOrJournal}` : ''}
${year ? `Year: ${year}` : ''}
${doiOrUrl ? `DOI/URL: ${doiOrUrl}` : ''}
${notes ? `Notes: ${notes}` : ''}

Provide analysis in JSON format:
{
  "qualityRating": "Strong" | "Good" | "Needs Improvement",
  "issues": ["issue1", "issue2", ...]
}

Evaluation criteria:
1. Title clarity and professionalism
2. Completeness (authors, venue, year if relevant)
3. Notes/description quality and clarity
4. Grammar and spelling
5. Academic formatting (if academic style)

Return ONLY valid JSON, no other text. Maximum 3 issues.`

    } else if (action === 'improve') {
      prompt = `You are a professional CV and academic publication expert. Improve the following publication entry to be clearer and more professional. ${isAcademic ? 'Use academic formatting style.' : 'Use professional CV style.'}

IMPORTANT CONSTRAINTS:
- Do NOT invent, fabricate, or add any information that was not provided
- Do NOT add authors, venues, years, DOIs, or citations if they were not provided
- Only rewrite/clean/format what the user provided
- If a field was left empty, keep it empty in your response
- Preserve all factual information exactly as provided
- Only improve clarity, grammar, and formatting

Publication:
Title: ${title}
${authors ? `Authors: ${authors}` : ''}
${venueOrJournal ? `Venue/Journal: ${venueOrJournal}` : ''}
${year ? `Year: ${year}` : ''}
${doiOrUrl ? `DOI/URL: ${doiOrUrl}` : ''}
${notes ? `Notes: ${notes}` : ''}

Provide improved version in JSON format:
{
  "qualityRating": "Strong" | "Good" | "Needs Improvement",
  "issues": ["issue1", "issue2", ...],
  "improved": {
    "title": "improved title (only if needed, otherwise keep original)",
    "notes": "improved notes (only if provided, otherwise empty string)"
  }
}

Return ONLY valid JSON, no other text. Maximum 3 issues.`

    } else if (action === 'grammar') {
      prompt = `You are a professional CV and academic publication expert. Fix ONLY grammar and spelling errors in the following publication entry. Do NOT rewrite, rephrase, or change the meaning. Preserve the original tone, style, and content. Only correct grammatical mistakes, spelling errors, and punctuation issues.

IMPORTANT CONSTRAINTS:
- Do NOT invent, fabricate, or add any information
- Do NOT change the structure or meaning
- Only fix grammar and spelling
- Preserve all factual information exactly as provided

Publication:
Title: ${title}
${authors ? `Authors: ${authors}` : ''}
${venueOrJournal ? `Venue/Journal: ${venueOrJournal}` : ''}
${year ? `Year: ${year}` : ''}
${doiOrUrl ? `DOI/URL: ${doiOrUrl}` : ''}
${notes ? `Notes: ${notes}` : ''}

Provide corrected version in JSON format:
{
  "qualityRating": "Strong" | "Good" | "Needs Improvement",
  "issues": ["issue1", "issue2", ...],
  "improved": {
    "title": "grammar-corrected title",
    "notes": "grammar-corrected notes (only if provided, otherwise empty string)"
  }
}

Return ONLY valid JSON, no other text. Maximum 3 issues.`

    } else {
      return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV and academic publication expert. Return only valid JSON responses. Never invent or fabricate information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const result = completion.choices[0]?.message?.content?.trim()
    
    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let analysis
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        analysis = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result)
      // Fallback to basic response
      return NextResponse.json({
        ok: true,
        qualityRating: 'Good',
        issues: ['Unable to analyze publication'],
        improved: {
          title: title.trim(),
          notes: notes?.trim() || '',
        },
      })
    }

    // Ensure we don't return empty or fabricated data
    const improved = {
      title: analysis.improved?.title?.trim() || title.trim(),
      notes: analysis.improved?.notes?.trim() || notes?.trim() || '',
    }

    return NextResponse.json({
      ok: true,
      qualityRating: analysis.qualityRating || 'Good',
      issues: (analysis.issues || []).slice(0, 3),
      improved,
    })

  } catch (error: any) {
    console.error('Publication improvement error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to process publication' },
      { status: 500 }
    )
  }
}

