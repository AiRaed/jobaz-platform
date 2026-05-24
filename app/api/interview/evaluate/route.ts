import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { userAnswer, jobTitle, company, question } = await req.json()

    if (!userAnswer || userAnswer.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Answer is required' },
        { status: 400 }
      )
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        score: 7,
        clarity: 7,
        relevance: 7,
        structure: 7,
        professionalTone: 7,
        examplesImpact: 7,
        strengths: ['Good structure', 'Relevant content'],
        weaknesses: ['Could be more specific', 'Add more examples'],
        tips: ['Add quantifiable achievements to strengthen your answer.', 'Include more specific examples to demonstrate your experience.'],
        improvedSample: 'This is a mock improved answer. Your actual answer shows promise, but could benefit from more specific examples and quantifiable achievements.',
        whyBetter: [
          'Uses the STAR method more effectively with clear Situation, Task, Action, and Result structure',
          'Includes quantifiable achievements and specific metrics to demonstrate impact',
          'Better tailored to the specific job role and company context',
          'More concise and focused, eliminating unnecessary details',
          'Demonstrates stronger professional tone and confidence'
        ],
        // Backward compatibility
        overallScore: 7,
        perCategory: {
          Clarity: 7,
          Relevance: 7,
          Structure: 7,
          ProfessionalTone: 7,
          Conciseness: 7,
        },
        improvements: ['Add quantifiable achievements', 'Include more specific examples'],
        improvedSampleAnswer: 'This is a mock improved answer. Your actual answer shows promise, but could benefit from more specific examples and quantifiable achievements.',
        shortTip: 'Focus on adding specific examples and quantifiable results to strengthen your answer.',
      })
    }

    // Build context-aware prompt
    const jobContext = jobTitle || company 
      ? `Job Context: ${jobTitle ? `Position: ${jobTitle}` : ''}${jobTitle && company ? ' at ' : ''}${company ? `Company: ${company}` : ''}`
      : ''
    
    const questionContext = question ? `Interview Question: ${question}` : ''

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR interviewer and career coach. Evaluate the candidate\'s written answer with detailed, structured feedback. Respond in JSON only with the exact structure specified.',
        },
        {
          role: 'user',
          content: `Evaluate this interview answer based on real interview standards (STAR method, clarity, relevance, impact). Respond in JSON only with this EXACT structure:

{
  "score": number (0-10, overall score),
  "clarity": number (0-10, how clear and understandable the answer is),
  "relevance": number (0-10, how relevant the answer is to the question),
  "structure": number (0-10, how well-structured the answer is, including STAR method usage),
  "professionalTone": number (0-10, professional tone and language),
  "examplesImpact": number (0-10, quality and impact of examples provided),
  "strengths": ["string", "string", ...] (array of strengths),
  "weaknesses": ["string", "string", ...] (array of weaknesses),
          "tips": ["string", "string", ...] (array of 1-3 short coaching tips),
          "improvedSample": "string (improved version of the user's answer - must be a concise single paragraph of 110-140 words, clear, professional, and tailored to the specific job and company)",
          "whyBetter": ["string", "string", ...] (array of 3-5 bullet points explaining why the improvedSample is better than the original answer)
}

${jobContext ? jobContext + '\n\n' : ''}${questionContext ? questionContext + '\n\n' : ''}Candidate's Answer to Evaluate:

${userAnswer}

Provide detailed, actionable feedback tailored to the specific role and question. Evaluate based on real interview standards including STAR method, clarity, relevance, and impact.

IMPORTANT: 
- For the "improvedSample" field, provide a concise, single-paragraph answer of 110-140 words. It must be clear, professional, and tailored to the specific job and company mentioned in the context.
- For the "whyBetter" field, provide 3-5 concise bullet points (each as a string in the array) explaining specific improvements made in the improvedSample compared to the original answer. Focus on concrete improvements like better structure, clearer examples, more relevant details, etc.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content || '{}'
    
    let evaluation
    try {
      evaluation = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback to extracting JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('Failed to parse evaluation response')
      }
    }

    // Validate and return structured response (new format)
    const score = typeof evaluation.score === 'number' ? evaluation.score : (evaluation.overallScore || 7)
    const clarity = typeof evaluation.clarity === 'number' ? evaluation.clarity : (evaluation.perCategory?.Clarity || 7)
    const relevance = typeof evaluation.relevance === 'number' ? evaluation.relevance : (evaluation.perCategory?.Relevance || 7)
    const structure = typeof evaluation.structure === 'number' ? evaluation.structure : (evaluation.perCategory?.Structure || 7)
    const professionalTone = typeof evaluation.professionalTone === 'number' ? evaluation.professionalTone : (evaluation.perCategory?.ProfessionalTone || 7)
    const examplesImpact = typeof evaluation.examplesImpact === 'number' ? evaluation.examplesImpact : (evaluation.perCategory?.ExamplesImpact || evaluation.perCategory?.Conciseness || 7)
    
    return NextResponse.json({
      ok: true,
      // New format
      score,
      clarity,
      relevance,
      structure,
      professionalTone,
      examplesImpact,
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      weaknesses: Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [],
      tips: Array.isArray(evaluation.tips) ? evaluation.tips : (evaluation.improvements ? evaluation.improvements : []),
      improvedSample: evaluation.improvedSample || evaluation.improvedSampleAnswer || evaluation.improved_answer || '',
      whyBetter: Array.isArray(evaluation.whyBetter) ? evaluation.whyBetter : [],
      // Backward compatibility
      overallScore: score,
      perCategory: {
        Clarity: clarity,
        Relevance: relevance,
        Structure: structure,
        ProfessionalTone: professionalTone,
        Conciseness: examplesImpact, // Map examplesImpact to Conciseness for backward compat
      },
      improvements: Array.isArray(evaluation.tips) ? evaluation.tips : (Array.isArray(evaluation.improvements) ? evaluation.improvements : []),
      improvedSampleAnswer: evaluation.improvedSample || evaluation.improvedSampleAnswer || evaluation.improved_answer || '',
      shortTip: Array.isArray(evaluation.tips) && evaluation.tips.length > 0 ? evaluation.tips[0] : (evaluation.shortTip || 'Focus on clarity and providing specific examples.'),
    })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to evaluate answer')
    return NextResponse.json(body, { status })
  }
}

