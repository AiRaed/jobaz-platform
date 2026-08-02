/**
 * Additional Academic Standard / Research detectors for Writing Review 2.0.
 */

type RawIssue = {
  type: string
  severity: 'low' | 'moderate' | 'high'
  message: string
  original_text: string
  suggestion_text: string
  startIndex: number
  endIndex: number
}

type EnhancementOpts = {
  isAcademicStandard: boolean
  isAcademicResearch: boolean
}

export function runAcademicEnhancementDetectors(
  text: string,
  opts: EnhancementOpts
): RawIssue[] {
  if (!opts.isAcademicStandard && !opts.isAcademicResearch) return []

  const issues: RawIssue[] = []
  const severity = opts.isAcademicResearch ? 'high' : 'moderate'

  const replacements: Array<{
    pattern: RegExp
    suggestion: string
    type: string
    message: string
  }> = [
    {
      pattern: /\bmany people think\b/gi,
      suggestion: 'Research indicates',
      type: 'academic_tone',
      message: 'Use evidence-based phrasing instead of informal opinion language.',
    },
    {
      pattern: /\bmany people believe\b/gi,
      suggestion: 'Several studies suggest',
      type: 'academic_tone',
      message: 'Academic writing should reference research rather than general opinion.',
    },
    {
      pattern: /\ba lot of\b/gi,
      suggestion: 'Numerous',
      type: 'academic_style',
      message: 'Replace informal quantifiers with formal academic vocabulary.',
    },
    {
      pattern: /\bkind of\b/gi,
      suggestion: 'somewhat',
      type: 'academic_tone',
      message: 'Avoid informal hedging — use precise academic language.',
    },
    {
      pattern: /\bsort of\b/gi,
      suggestion: 'somewhat',
      type: 'academic_tone',
      message: 'Avoid informal hedging — use precise academic language.',
    },
    {
      pattern: /\bI think\b/gi,
      suggestion: 'It appears that',
      type: 'academic_objectivity',
      message: 'Reduce first-person opinion; use objective academic phrasing.',
    },
    {
      pattern: /\bwe think\b/gi,
      suggestion: 'the findings suggest',
      type: 'academic_objectivity',
      message: 'Replace subjective claims with evidence-led language.',
    },
    {
      pattern: /\bprove that\b/gi,
      suggestion: 'suggest that',
      type: 'academic_hedging',
      message: 'Academic claims rarely "prove" — use cautious, evidence-based wording.',
    },
    {
      pattern: /\bproves that\b/gi,
      suggestion: 'suggests that',
      type: 'academic_hedging',
      message: 'Avoid absolute proof language unless evidence fully supports it.',
    },
    {
      pattern: /\bvery good\b/gi,
      suggestion: 'notable',
      type: 'academic_tone',
      message: 'Replace vague evaluative language with specific academic descriptors.',
    },
    {
      pattern: /\bbig problem\b/gi,
      suggestion: 'significant challenge',
      type: 'academic_style',
      message: 'Use formal vocabulary appropriate for academic writing.',
    },
    {
      pattern: /\bget\b/gi,
      suggestion: 'obtain',
      type: 'academic_style',
      message: 'Prefer formal verbs in academic writing.',
    },
  ]

  for (const rule of replacements) {
    let match: RegExpExecArray | null
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags)
    while ((match = pattern.exec(text)) !== null) {
      const original = match[0]
      const suggestion =
        original[0] === original[0].toUpperCase()
          ? rule.suggestion.charAt(0).toUpperCase() + rule.suggestion.slice(1)
          : rule.suggestion
      issues.push({
        type: rule.type,
        severity,
        message: rule.message,
        original_text: original,
        suggestion_text: suggestion,
        startIndex: match.index,
        endIndex: match.index + original.length,
      })
    }
  }

  const weakEvidence = [
    { pattern: /\beveryone knows\b/gi, message: 'Avoid unsupported generalisations in academic writing.' },
    { pattern: /\bobviously\b/gi, message: 'Claims should be supported — avoid assuming reader agreement.' },
    { pattern: /\bwithout doubt\b/gi, message: 'Use hedging language when evidence is interpretive.' },
  ]

  for (const rule of weakEvidence) {
    let match: RegExpExecArray | null
    while ((match = rule.pattern.exec(text)) !== null) {
      issues.push({
        type: 'evidence',
        severity: 'moderate',
        message: rule.message,
        original_text: match[0],
        suggestion_text: '',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return issues
}
