import { NextRequest, NextResponse } from 'next/server'

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
  message: string
  suggestion?: string
  corrected?: string
}

// Common grammar/spelling patterns to check (heuristic-based)
function applyHeuristicFixes(text: string): { fixed: string; messages: Array<{ message: string; suggestion?: string }> } {
  if (!text || text.trim().length === 0) return { fixed: text, messages: [] }

  let fixed = text
  const messages: Array<{ message: string; suggestion?: string }> = []

  // 1) lowercase "i" as a standalone word -> "I"
  if (/\bi\b/.test(fixed)) {
    fixed = fixed.replace(/\bi\b/g, 'I')
    messages.push({ message: 'Capitalize the pronoun "I".', suggestion: 'Use "I" instead of "i".' })
  }

  // 2) collapse multiple spaces
  if (/\s{2,}/.test(fixed)) {
    fixed = fixed.replace(/\s{2,}/g, ' ')
    messages.push({ message: 'Remove extra spaces.', suggestion: 'Collapse multiple spaces to a single space.' })
  }

  // 3) common typos
  const commonTypos: Record<string, string> = {
    'teh': 'the',
    'adn': 'and',
    'taht': 'that',
    'recieve': 'receive',
    'seperate': 'separate',
    'existant': 'existent',
    'occured': 'occurred',
  }

  Object.entries(commonTypos).forEach(([typo, correct]) => {
    const re = new RegExp(`\\b${typo}\\b`, 'gi')
    if (re.test(fixed)) {
      fixed = fixed.replace(re, correct)
      messages.push({ message: `Fix common typo "${typo}".`, suggestion: `Use "${correct}" instead of "${typo}".` })
    }
  })

  return { fixed, messages }
}

function fixField(fieldPath: string, value: string | undefined, issues: GrammarIssue[]): string | undefined {
  if (typeof value !== 'string') return value
  const { fixed, messages } = applyHeuristicFixes(value)
  if (messages.length > 0) {
    for (const m of messages) {
      issues.push({
        fieldPath,
        message: m.message,
        suggestion: m.suggestion,
        corrected: fixed,
      })
    }
  }
  return fixed
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

    // Produce fixed CV data by applying heuristic fixes per field.
    const fixedData: CvData = {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        fullName: fixField('personalInfo.fullName', data.personalInfo?.fullName, issues) || data.personalInfo?.fullName || '',
        email: data.personalInfo?.email || '',
        phone: fixField('personalInfo.phone', data.personalInfo?.phone, issues),
        location: fixField('personalInfo.location', data.personalInfo?.location, issues),
        linkedin: fixField('personalInfo.linkedin', data.personalInfo?.linkedin, issues),
        website: fixField('personalInfo.website', data.personalInfo?.website, issues),
      },
      summary: fixField('summary', data.summary, issues) || data.summary,
      experience: (data.experience || []).map((exp, expIdx) => ({
        ...exp,
        jobTitle: fixField(`experience[${expIdx}].jobTitle`, exp.jobTitle, issues) || exp.jobTitle,
        company: fixField(`experience[${expIdx}].company`, exp.company, issues) || exp.company,
        location: fixField(`experience[${expIdx}].location`, exp.location, issues),
        bullets: (exp.bullets || []).map((b, bulletIdx) => fixField(`experience[${expIdx}].bullets[${bulletIdx}]`, b, issues) || b),
      })),
      education: (data.education || []).map((edu, eduIdx) => ({
        ...edu,
        degree: fixField(`education[${eduIdx}].degree`, edu.degree, issues) || edu.degree,
        school: fixField(`education[${eduIdx}].school`, edu.school, issues) || edu.school,
        year: edu.year,
        details: fixField(`education[${eduIdx}].details`, edu.details, issues),
      })),
      projects: (data.projects || []).map((p, pIdx) => ({
        ...p,
        name: fixField(`projects[${pIdx}].name`, p.name, issues) || p.name,
        description: fixField(`projects[${pIdx}].description`, p.description, issues) || p.description,
      })),
      publications: (data.publications || []).map((p, pIdx) => ({
        ...p,
        title: fixField(`publications[${pIdx}].title`, p.title, issues) || p.title,
        notes: fixField(`publications[${pIdx}].notes`, p.notes, issues),
      })),
    }

    return NextResponse.json({
      ok: true,
      originalText: data,
      fixedText: fixedData,
      issuesCount: issues.length,
      issues,
    })
  } catch (error: any) {
    console.error('Grammar check error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to check grammar' },
      { status: 500 }
    )
  }
}

