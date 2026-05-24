import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { OPENAI_MODEL, openAIErrorResponse } from '@/lib/openai-model'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

/**
 * Clean cover letter variant to remove greetings, closings, markdown, and section titles
 * Returns only the main body text in a clean, continuous format
 */
function cleanCoverLetterVariant(text: string): string {
  if (!text || text.trim().length === 0) {
    return ''
  }

  let cleaned = text

  // Step 1: Remove markdown formatting (**, *, #, etc.)
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
    .replace(/__(.*?)__/g, '$1') // Remove __underline__
    .replace(/_(.*?)_/g, '$1') // Remove _underline_
    .replace(/~~(.*?)~~/g, '$1') // Remove ~~strikethrough~~
    .replace(/`(.*?)`/g, '$1') // Remove `code`
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [link](url) - keep text only
    .replace(/^#{1,6}\s+/gm, '') // Remove # headings
    .trim()

  // Step 2: Remove section titles and labels (Variant A, ### Variant A, **Greeting:**, etc.)
  cleaned = cleaned
    .replace(/^(?:Variant\s+[ABC]|###?\s+Variant\s+[ABC]|\*\*Variant\s+[ABC]\*\*|Variant\s+[ABC]\s*\(|\(Variant\s+[ABC]\))[:：\s]*\s*/gim, '') // Remove "Variant A:", "### Variant A:", "**Variant A**", "Variant A (", "(Variant A)", etc.
    .replace(/^[ABC][:：\)]\s*/gim, '') // Remove "A:", "B:", "C:", "A)", "B)", "C)" at start of lines
    .replace(/^\([ABC]\)\s*/gim, '') // Remove "(A)", "(B)", "(C)" at start of lines
    .replace(/\*\*Greeting:\*\*\s*/gi, '') // Remove **Greeting:**
    .replace(/Greeting:\s*/gi, '') // Remove Greeting:
    .replace(/\*\*Body:\*\*\s*/gi, '') // Remove **Body:**
    .replace(/Body:\s*/gi, '') // Remove Body:
    .replace(/\*\*Closing:\*\*\s*/gi, '') // Remove **Closing:**
    .replace(/Closing:\s*/gi, '') // Remove Closing:
    .trim()

  // Step 3: Remove greetings at the start (comprehensive list)
  // Remove common greeting patterns
  cleaned = cleaned
    .replace(/^(?:Dear|Hello|Hi|Greetings|Good\s+(?:morning|afternoon|evening))\s+(?:Hiring\s+(?:Manager|Committee|Team|Department)|Recruiter|Recruitment\s+Team|Sir|Madam|Mr\.|Mrs\.|Ms\.|Dr\.)[:,]?\s*/gim, '')
    .replace(/^(?:Dear|Hello|Hi|Greetings|Good\s+(?:morning|afternoon|evening))\s+[A-Z][a-zA-Z\s]+,?\s*/gm, '') // Remove "Dear [Name],"
    .replace(/^To\s+Whom\s+It\s+May\s+Concern[:,]?\s*/gim, '')
    .replace(/^To\s+the\s+Hiring\s+(?:Manager|Committee|Team|Department)[:,]?\s*/gim, '')
    .replace(/^(?:Respected|Esteemed)\s+[A-Z][a-zA-Z\s]+,?\s*/gm, '')
    .trim()

  // Step 3a: Remove "Dear Hiring Manager," anywhere in the text (all occurrences)
  // Match "Dear Hiring Manager," with optional comma/colon and following whitespace
  cleaned = cleaned
    .replace(/Dear\s+Hiring\s+Manager[,:]?\s*/gi, '')
    .trim()

  // Step 4: Remove closing phrases (comprehensive list - check both end of text and end of lines)
  // First remove from end of entire text
  cleaned = cleaned
    .replace(/\s*(?:Sincerely|Sincerely\s+yours|Yours\s+sincerely|Best\s+regards|Kind\s+regards|Warm\s+regards|Regards|Respectfully|Respectfully\s+yours|Thank\s+you|Thank\s+you\s+for\s+your\s+consideration|Cordially|With\s+appreciation|Appreciatively|Yours\s+truly|Truly\s+yours|Best\s+wishes|Looking\s+forward|Yours\s+faithfully|Faithfully\s+yours)[:,]?\s*$/gim, '')
    .replace(/\s*(?:Your\s+(?:sincerely|truly|faithfully)|With\s+best\s+wishes|Warmest\s+regards|Best|Take\s+care|Cheers)[:,]?\s*$/gim, '')
    .trim()

  // Remove signature lines and placeholders
  cleaned = cleaned
    .replace(/\s*(?:Your\s+Name|\[Your\s+Name\]|\[Name\]|\[Your Name\]|Name|Signature)[:,]?\s*$/gim, '')
    .replace(/\s*Sincerely\s+(?:,\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s*$/gm, '') // Remove "Sincerely, John Doe"
    .replace(/\s*[A-Z][a-z]+\s+[A-Z][a-z]+\s*$/gm, (match) => {
      // Remove if it looks like a name at the end (First Last format)
      const words = match.trim().split(/\s+/)
      if (words.length === 2 && words[0][0] === words[0][0].toUpperCase() && words[1][0] === words[1][0].toUpperCase()) {
        return ''
      }
      return match
    })
    .trim()

  // Also remove closing phrases that appear on their own lines (not just at the end)
  cleaned = cleaned
    .split('\n')
    .filter(line => {
      const trimmedLine = line.trim()
      // Remove lines that are only closing phrases
      const isClosing = /^(?:Sincerely|Best\s+regards|Kind\s+regards|Warm\s+regards|Regards|Respectfully|Thank\s+you|Cordially|Yours\s+truly|Your\s+Name|\[Your\s+Name\]|\[Name\])[:,]?\s*$/i.test(trimmedLine)
      return !isClosing
    })
    .join('\n')
    .trim()

  // Step 4a: Remove "Sincerely," anywhere in the text (all occurrences)
  // Match "Sincerely," or "Sincerely:" (with optional comma/colon and following whitespace)
  // Use word boundary to avoid matching "sincerely" inside other words like "insincerely"
  cleaned = cleaned
    .replace(/\bSincerely[,:]?\s*/gi, '')
    .trim()

  // Step 5: Remove leading/trailing empty lines and normalize spacing
  const lines = cleaned.split('\n')
  let startIndex = 0
  let endIndex = lines.length - 1

  // Remove leading empty lines
  while (startIndex < lines.length && lines[startIndex].trim().length === 0) {
    startIndex++
  }

  // Remove trailing empty lines
  while (endIndex >= startIndex && lines[endIndex].trim().length === 0) {
    endIndex--
  }

  cleaned = lines.slice(startIndex, endIndex + 1).join('\n')

  // Step 6: Normalize multiple newlines to double max, but keep paragraph breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()

  return cleaned
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { text, keywords, mode, fullName, email, phone, recipientName, company, role, roleTitle, tone } = body

    console.log('[Cover Compare] payload:', body)

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[AI MOCK] no OPENAI_API_KEY')
      return NextResponse.json({
        ok: true,
        variants: [
          { id: 'A' as const, letter: 'Cover letter content. This demonstrates the main body text without any greetings or closings.' },
          { id: 'B' as const, letter: 'Cover letter content. This shows another approach to presenting the main body text in a clean format.' },
          { id: 'C' as const, letter: 'Cover letter content. This represents a balanced perspective on the main body content without formatting elements.' },
        ],
      })
    }

    // Build role/keywords context for prompt
    const position = role || roleTitle
    const roleKeywords = position ? `${position}${keywords ? ` (${keywords})` : ''}` : (keywords || 'a position')
    const sourceBody = text || ''

    const userPromptText = sourceBody
      ? `Create three alternative body-only versions of the cover letter, all tailored to the role below.

Each maximum 180 words total. Be concise, professional, and clear. Avoid unnecessary repetition.

Styles: First) concise & results-driven, Second) narrative & collaborative impact, Third) technical depth & problem-solving.

Focus on clarity, professionalism, and relevance. Prioritize specific achievements and measurable outcomes (use plausible qualitative impact when numbers are missing).

No greeting/sign-off/headings/placeholders/labels; plain text only. Do not include any labels like "Variant A", "A:", "(A)", etc.
Return as three blocks separated by:
---
Source/body (if any):

${sourceBody}

Role/keywords: ${roleKeywords}`
      : `Create three alternative body-only versions of the cover letter, all tailored to the role below.

Each maximum 180 words total. Be concise, professional, and clear. Avoid unnecessary repetition.

Styles: First) concise & results-driven, Second) narrative & collaborative impact, Third) technical depth & problem-solving.

Focus on clarity, professionalism, and relevance. Prioritize specific achievements and measurable outcomes (use plausible qualitative impact when numbers are missing).

No greeting/sign-off/headings/placeholders/labels; plain text only. Do not include any labels like "Variant A", "A:", "(A)", etc.
Return as three blocks separated by:
---
Role/keywords: ${roleKeywords}`

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional cover-letter writer. Produce body-only text (no greeting or sign-off). Write in clear, confident, professional English with a focus on clarity, professionalism, and relevance (no fluff). Maximum 180 words total per variant. Be concise and avoid unnecessary repetition.
Prioritize specifics over buzzwords: convert duties into impact + metrics (e.g., "reduced load time by 28%"). If the user/job data lacks numbers, infer reasonable qualitative impact without inventing unverifiable facts.
Never include headings, placeholders, brackets, or explanations. No "Dear…", "Sincerely," names, or contact details. Plain paragraphs only.

Generate three distinctly different cover letter BODY TEXTS ONLY:

- First variant: Concise & results-driven
- Second variant: Narrative & collaborative impact
- Third variant: Technical depth & problem-solving

Each should be maximum 180 words total. Return clean, continuous body text only. Do not include any labels like "Variant A", "A:", "(A)", etc. Separate each variant with "---". English only.`,
        },
        {
          role: 'user',
          content: userPromptText,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    })

    const result = completion.choices[0]?.message?.content || ''

    // Parse the three variants (handle multiple possible formats)
    // First try parsing by "---" separator
    const parts = result.split(/^---+$/m).map(p => p.trim()).filter(p => p.length > 0)
    
    let rawA = ''
    let rawB = ''
    let rawC = ''
    
    if (parts.length >= 3) {
      // If we have 3+ parts separated by "---", use them
      rawA = parts[0]
      rawB = parts[1]
      rawC = parts[2]
    } else {
      // Fall back to label-based parsing (try to catch any remaining A/B/C labels, but cleaned function will remove them)
      const aMatch = result.match(/(?:^|\n)(?:Variant\s+)?[A1]:?\s*(.*?)(?=(?:^|\n)(?:Variant\s+)?[BC2]:|^---+|$)/is)
      const bMatch = result.match(/(?:^|\n)(?:Variant\s+)?[B2]:?\s*(.*?)(?=(?:^|\n)(?:Variant\s+)?[C3]:|^---+|$)/is)
      const cMatch = result.match(/(?:^|\n)(?:Variant\s+)?[C3]:?\s*(.*?)$/is)
      
      rawA = aMatch?.[1]?.trim() || parts[0] || result.substring(0, result.length / 3)
      rawB = bMatch?.[1]?.trim() || parts[1] || result.substring(result.length / 3, (2 * result.length) / 3)
      rawC = cMatch?.[1]?.trim() || parts[2] || result.substring((2 * result.length) / 3)
    }

    // Clean each variant to remove any remaining greetings, closings, markdown, etc.
    const cleanedA = cleanCoverLetterVariant(rawA)
    const cleanedB = cleanCoverLetterVariant(rawB)
    const cleanedC = cleanCoverLetterVariant(rawC)

    const variants = [
      {
        id: 'A' as const,
        letter: cleanedA,
        content: cleanedA,
      },
      {
        id: 'B' as const,
        letter: cleanedB,
        content: cleanedB,
      },
      {
        id: 'C' as const,
        letter: cleanedC,
        content: cleanedC,
      },
    ]

    return NextResponse.json({ ok: true, variants })
  } catch (error: unknown) {
    const { body, status } = openAIErrorResponse(error, 'Failed to compare cover letters. Please try again.')
    return NextResponse.json(body, { status })
  }
}

