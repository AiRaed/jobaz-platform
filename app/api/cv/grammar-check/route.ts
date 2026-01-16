import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface CvData {
  personalInfo: {
    fullName: string
    email: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary: string
  experience: Array<{
    id: string
    jobTitle: string
    company: string
    location?: string
    startDate?: string
    endDate?: string
    isCurrent?: boolean
    bullets: string[]
  }>
  education: Array<{
    degree: string
    school: string
    year?: string
    details?: string
  }>
  skills: string[]
  projects?: Array<{
    name: string
    description: string
    url?: string
  }>
  languages?: string[]
  certifications?: string[]
  publications?: Array<{
    title: string
    authors?: string
    venueOrJournal?: string
    year?: string
    doiOrUrl?: string
    notes?: string
  }>
}

interface GrammarIssue {
  fieldPath: string
  original: string
  suggestion: string
  confidence: number
  isSafeFix: boolean
}

// Job title dictionary hints for edit-distance matching
const commonJobTitles = [
  'Animator', 'Designer', 'Developer', 'Assistant', 'Manager', 'Director',
  'Engineer', 'Analyst', 'Consultant', 'Specialist', 'Coordinator', 'Executive',
  'Administrator', 'Supervisor', 'Lead', 'Senior', 'Junior', 'Associate',
  'Architect', 'Programmer', 'Technician', 'Officer', 'Representative',
  'Accountant', 'Teacher', 'Nurse', 'Doctor', 'Lawyer', 'Writer', 'Editor'
]

// Simple edit distance (Levenshtein) for job title suggestions
function editDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }
  
  return dp[m][n]
}

// Check job title against dictionary
function suggestJobTitle(input: string): { suggestion: string; confidence: number } | null {
  if (!input || input.trim().length < 2) return null
  
  const normalized = input.trim()
  let bestMatch: string | null = null
  let minDistance = Infinity
  
  for (const title of commonJobTitles) {
    const distance = editDistance(normalized.toLowerCase(), title.toLowerCase())
    if (distance < minDistance && distance <= 2) { // Max 2 edits
      minDistance = distance
      bestMatch = title
    }
  }
  
  if (bestMatch && minDistance <= 2) {
    return {
      suggestion: bestMatch,
      confidence: minDistance === 0 ? 1.0 : minDistance === 1 ? 0.8 : 0.6
    }
  }
  
  return null
}

// Check if field should be skipped (emails, URLs)
function shouldSkipField(fieldPath: string, value: string): boolean {
  if (!value) return true
  
  // Skip email fields
  if (fieldPath.includes('email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return true
  }
  
  // Skip URL fields
  if (fieldPath.includes('url') || fieldPath.includes('website') || fieldPath.includes('linkedin') || 
      fieldPath.includes('doiOrUrl') || /^https?:\/\//i.test(value)) {
    return true
  }
  
  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cvData } = body

    if (!cvData) {
      return NextResponse.json({ ok: false, error: 'CV data is required' }, { status: 400 })
    }

    const data = cvData as CvData
    const issues: GrammarIssue[] = []

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[Grammar Check] No OPENAI_API_KEY - using heuristic fallback')
      // Fallback to basic heuristic checks
      return NextResponse.json({
        ok: true,
        issues: [],
        summary: { issueCount: 0, safeCount: 0 }
      })
    }

    // Build a structured text representation of the CV for AI analysis
    const cvText = []
    
    // Personal Info (skip email/URLs)
    if (data.personalInfo?.fullName && !shouldSkipField('personalInfo.fullName', data.personalInfo.fullName)) {
      cvText.push(`Full Name: ${data.personalInfo.fullName}`)
    }
    if (data.personalInfo?.location && !shouldSkipField('personalInfo.location', data.personalInfo.location)) {
      cvText.push(`Location: ${data.personalInfo.location}`)
    }
    
    // Summary
    if (data.summary) {
      cvText.push(`Summary: ${data.summary}`)
    }
    
    // Experience
    data.experience?.forEach((exp, idx) => {
      if (exp.jobTitle && !shouldSkipField(`experience[${idx}].jobTitle`, exp.jobTitle)) {
        cvText.push(`Experience ${idx + 1} - Job Title: ${exp.jobTitle}`)
      }
      if (exp.company && !shouldSkipField(`experience[${idx}].company`, exp.company)) {
        cvText.push(`Experience ${idx + 1} - Company: ${exp.company}`)
      }
      if (exp.location && !shouldSkipField(`experience[${idx}].location`, exp.location)) {
        cvText.push(`Experience ${idx + 1} - Location: ${exp.location}`)
      }
      exp.bullets?.forEach((bullet, bulletIdx) => {
        if (bullet) {
          cvText.push(`Experience ${idx + 1} - Bullet ${bulletIdx + 1}: ${bullet}`)
        }
      })
    })
    
    // Education
    data.education?.forEach((edu, idx) => {
      if (edu.degree && !shouldSkipField(`education[${idx}].degree`, edu.degree)) {
        cvText.push(`Education ${idx + 1} - Degree: ${edu.degree}`)
      }
      if (edu.school && !shouldSkipField(`education[${idx}].school`, edu.school)) {
        cvText.push(`Education ${idx + 1} - School: ${edu.school}`)
      }
      if (edu.details && !shouldSkipField(`education[${idx}].details`, edu.details)) {
        cvText.push(`Education ${idx + 1} - Details: ${edu.details}`)
      }
    })
    
    // Skills (light check)
    if (data.skills && data.skills.length > 0) {
      cvText.push(`Skills: ${data.skills.join(', ')}`)
    }
    
    // Projects
    data.projects?.forEach((proj, idx) => {
      if (proj.name && !shouldSkipField(`projects[${idx}].name`, proj.name)) {
        cvText.push(`Project ${idx + 1} - Name: ${proj.name}`)
      }
      if (proj.description && !shouldSkipField(`projects[${idx}].description`, proj.description)) {
        cvText.push(`Project ${idx + 1} - Description: ${proj.description}`)
      }
    })
    
    // Certifications
    data.certifications?.forEach((cert, idx) => {
      if (cert && !shouldSkipField(`certifications[${idx}]`, cert)) {
        cvText.push(`Certification ${idx + 1}: ${cert}`)
      }
    })
    
    // Languages
    data.languages?.forEach((lang, idx) => {
      if (lang && !shouldSkipField(`languages[${idx}]`, lang)) {
        cvText.push(`Language ${idx + 1}: ${lang}`)
      }
    })
    
    // Publications
    data.publications?.forEach((pub, idx) => {
      if (pub.title && !shouldSkipField(`publications[${idx}].title`, pub.title)) {
        cvText.push(`Publication ${idx + 1} - Title: ${pub.title}`)
      }
      if (pub.notes && !shouldSkipField(`publications[${idx}].notes`, pub.notes)) {
        cvText.push(`Publication ${idx + 1} - Notes: ${pub.notes}`)
      }
    })

    const cvTextContent = cvText.join('\n')

    if (!cvTextContent.trim()) {
      return NextResponse.json({
        ok: true,
        issues: [],
        summary: { issueCount: 0, safeCount: 0 }
      })
    }

    // Use OpenAI to check grammar and spelling
    const prompt = `You are a professional CV grammar and spelling checker. Analyze the following CV content and identify ALL grammar, spelling, capitalization, and punctuation errors.

CV Content:
${cvTextContent}

For EACH error found, provide:
1. fieldPath: The exact field path matching the CV structure:
   - "summary" for summary field
   - "personalInfo.fullName", "personalInfo.location" for personal info
   - "experience[0].jobTitle", "experience[0].company", "experience[0].location" for experience fields
   - "experience[0].bullets[0]", "experience[0].bullets[1]" for experience bullet points
   - "education[0].degree", "education[0].school", "education[0].details" for education
   - "skills[0]", "skills[1]" for skills array
   - "projects[0].name", "projects[0].description" for projects
   - "certifications[0]", "languages[0]" for certifications/languages
   - "publications[0].title", "publications[0].notes" for publications
2. original: The original text with the error (exact text from the field)
3. suggestion: The corrected text (the fixed version to apply)
4. confidence: A number between 0.0 and 1.0 indicating how confident you are (1.0 = very confident, 0.5 = uncertain)
5. isSafeFix: true if this is a safe fix (clear spelling mistake, capitalization, spacing, punctuation) OR false if risky (may alter meaning, proper nouns, technical terms)

CRITICAL RULES:
- NEVER suggest changes to emails or URLs
- For proper nouns (company names, locations): only mark as safe if it's clearly a common typo (e.g., "enimator" -> "Animator" for job title)
- For job titles: be more lenient with suggestions (common titles like Animator, Designer, Developer)
- For skills: be very conservative (technical terms should not be changed)
- Capitalization errors (e.g., "i" -> "I") are always safe
- Double spaces, punctuation errors are safe
- Changes that might alter meaning are risky (isSafeFix: false)

Return ONLY a valid JSON array of issues in this exact format:
[
  {
    "fieldPath": "experience[0].jobTitle",
    "original": "enimator",
    "suggestion": "Animator",
    "confidence": 0.9,
    "isSafeFix": true
  },
  {
    "fieldPath": "summary",
    "original": "i work hard",
    "suggestion": "I work hard",
    "confidence": 1.0,
    "isSafeFix": true
  }
]

If no errors are found, return an empty array []. Return ONLY the JSON array, no other text.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV grammar and spelling checker. Return only valid JSON arrays of issues.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content?.trim()
    
    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response
    let aiIssues: GrammarIssue[] = []
    try {
      // Try to extract JSON array from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        aiIssues = JSON.parse(jsonMatch[0])
      } else {
        aiIssues = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result)
      // Fallback: return empty issues
      aiIssues = []
    }

    // Enhance job title suggestions with dictionary matching
    data.experience?.forEach((exp, idx) => {
      if (exp.jobTitle && !shouldSkipField(`experience[${idx}].jobTitle`, exp.jobTitle)) {
        const dictSuggestion = suggestJobTitle(exp.jobTitle)
        if (dictSuggestion) {
          // Check if AI already found this issue
          const existingIssue = aiIssues.find(
            issue => issue.fieldPath === `experience[${idx}].jobTitle`
          )
          if (!existingIssue && dictSuggestion.confidence >= 0.6) {
            aiIssues.push({
              fieldPath: `experience[${idx}].jobTitle`,
              original: exp.jobTitle,
              suggestion: dictSuggestion.suggestion,
              confidence: dictSuggestion.confidence,
              isSafeFix: dictSuggestion.confidence >= 0.8
            })
          }
        }
      }
    })

    // Count safe fixes
    const safeCount = aiIssues.filter(issue => issue.isSafeFix).length

    return NextResponse.json({
      ok: true,
      issues: aiIssues,
      summary: {
        issueCount: aiIssues.length,
        safeCount
      }
    })
  } catch (error: any) {
    console.error('Grammar check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check grammar' },
      { status: 500 }
    )
  }
}

