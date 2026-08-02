/**
 * Writing Review 2.0 — score, insights, strengths, and JobAZ next steps.
 */

import { getIssueTypeLabel } from './issueDisplay'
import type {
  AnalyzedIssue,
  DocumentInsight,
  IssueSeverity,
  JobAZRecommendedAction,
  ProofreadingAnalyzeMode,
  WritingReviewReport,
} from './types'

function severityWeight(severity: IssueSeverity): number {
  if (severity === 'high') return 4
  if (severity === 'moderate') return 2
  return 1
}

function detectDocumentKind(
  content: string,
  mode: ProofreadingAnalyzeMode,
  category?: string
): WritingReviewReport['documentKind'] {
  const lower = content.toLowerCase()
  if (/curriculum vitae|\bcv\b|work experience|professional summary|skills:/i.test(content)) return 'cv'
  if (/dear hiring|cover letter|application for the role|i am writing to apply/i.test(lower)) return 'cover_letter'
  if (
    mode !== 'general' ||
    category?.includes('academic') ||
    /\babstract\b|\bmethodology\b|\bliterature review\b|\bhypothesis\b/i.test(lower)
  ) {
    return 'academic'
  }
  if (/dear sir|dear madam|kind regards|business proposal|invoice/i.test(lower)) return 'business'
  return 'general'
}

function computeScore(issues: AnalyzedIssue[]): number {
  let deduction = 0
  for (const issue of issues) {
    if (issue.status === 'applied' || issue.status === 'rejected') continue
    deduction += severityWeight(issue.severity)
  }
  return Math.max(42, Math.min(100, 100 - deduction))
}

function computeEstimatedAfterFixes(score: number, issues: AnalyzedIssue[]): number {
  let gain = 0
  for (const issue of issues) {
    if (issue.status !== 'open') continue
    const fixable = Boolean(issue.suggestion_text?.trim()) || issue.action === 'delete'
    if (!fixable) continue
    gain += issue.severity === 'high' ? 3 : issue.severity === 'moderate' ? 2 : 1
  }
  return Math.min(100, score + gain)
}

function buildStrengths(content: string, issues: AnalyzedIssue[], mode: ProofreadingAnalyzeMode): string[] {
  const strengths: string[] = []
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const words = content.trim().split(/\s+/).filter(Boolean).length

  if (paragraphs.length >= 2) strengths.push('Clear structure with distinct paragraphs')
  if (words >= 80) strengths.push('Sufficient depth for meaningful review')
  if (!issues.some((i) => i.type === 'spelling' && i.status !== 'applied')) {
    strengths.push('No spelling issues detected')
  }
  if (!issues.some((i) => i.type === 'grammar' && i.severity === 'high' && i.status !== 'applied')) {
    strengths.push('No critical grammar errors detected')
  }
  if (mode !== 'general' && !issues.some((i) => i.type.startsWith('academic_tone'))) {
    strengths.push('Appropriate academic tone')
  }
  if (mode === 'general' && !issues.some((i) => i.type === 'clarity' && i.severity === 'high')) {
    strengths.push('Readable professional communication')
  }
  if (strengths.length === 0) strengths.push('Good starting point — apply suggestions to strengthen further')
  return strengths.slice(0, 5)
}

function buildAreasToImprove(issues: AnalyzedIssue[]): string[] {
  const open = issues.filter((i) => i.status !== 'applied' && i.status !== 'rejected')
  const counts: Record<string, number> = {}
  for (const issue of open) {
    const label = getIssueTypeLabel(issue.type)
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label]) => label)
}

function buildDocumentInsights(
  content: string,
  issues: AnalyzedIssue[],
  mode: ProofreadingAnalyzeMode
): DocumentInsight[] {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const avgWords = sentences.length ? words / sentences.length : words
  const open = issues.filter((i) => i.status !== 'applied' && i.status !== 'rejected')

  const grammarIssues = open.filter((i) =>
    ['grammar', 'agreement', 'article', 'research_grammar', 'punctuation'].includes(i.type)
  ).length
  const clarityIssues = open.filter((i) =>
    ['clarity', 'structure', 'methodology', 'evidence'].includes(i.type)
  ).length
  const academicIssues = open.filter((i) => i.type.startsWith('academic')).length

  const readingEase = Math.max(35, Math.min(95, 100 - Math.max(0, avgWords - 18) * 2 - clarityIssues * 3))
  const professionalTone = Math.max(
    40,
    Math.min(98, 100 - open.filter((i) => i.type === 'style').length * 4 - grammarIssues * 2)
  )
  const academicReadiness =
    mode === 'general'
      ? Math.max(50, Math.min(90, professionalTone - 5))
      : Math.max(40, Math.min(98, 100 - academicIssues * 4 - clarityIssues * 2))
  const grammarAccuracy = Math.max(45, Math.min(100, 100 - grammarIssues * 5))
  const vocabularyStrength = Math.max(
    50,
    Math.min(
      95,
      100 -
        open.filter((i) => ['word_form', 'academic_style', 'academic_tone'].includes(i.type)).length * 4
    )
  )
  const structureQuality = Math.max(
    45,
    Math.min(95, 100 - open.filter((i) => ['structure', 'repetition', 'clarity'].includes(i.type)).length * 3)
  )

  return [
    { id: 'reading_ease', label: 'Reading Ease', score: Math.round(readingEase) },
    { id: 'professional_tone', label: 'Professional Tone', score: Math.round(professionalTone) },
    { id: 'academic_readiness', label: 'Academic Readiness', score: Math.round(academicReadiness) },
    { id: 'grammar_accuracy', label: 'Grammar Accuracy', score: Math.round(grammarAccuracy) },
    { id: 'vocabulary', label: 'Vocabulary Strength', score: Math.round(vocabularyStrength) },
    { id: 'structure', label: 'Structure Quality', score: Math.round(structureQuality) },
  ]
}

function buildJobAZActions(
  kind: WritingReviewReport['documentKind'],
  mode: ProofreadingAnalyzeMode
): Pick<
  WritingReviewReport,
  'recommendedActions' | 'recommendedTools' | 'recommendedCareerResources' | 'nextJobAZStep'
> {
  const cv: JobAZRecommendedAction = {
    id: 'cv_builder',
    label: 'Use CV Builder',
    href: '/cv-builder-v2',
    why: 'Turn polished writing into a UK-format CV employers understand.',
    icon: 'cv',
  }
  const interview: JobAZRecommendedAction = {
    id: 'interview_coach',
    label: 'Practice Interview Answers',
    href: '/interview-coach',
    why: 'Strong writing helps — rehearse how you will say it in interviews.',
    icon: 'interview',
  }
  const career: JobAZRecommendedAction = {
    id: 'career_path',
    label: 'Explore Career Paths',
    href: '/ai-career-path',
    why: 'Align your writing goals with realistic UK career routes.',
    icon: 'career',
  }
  const translate: JobAZRecommendedAction = {
    id: 'translate',
    label: 'Translate Content',
    href: '/proofreading',
    why: 'Ensure certificates and CV sections read clearly in English.',
    icon: 'translate',
  }
  const jobs: JobAZRecommendedAction = {
    id: 'jobs',
    label: 'Find Job Opportunities',
    href: '/job-finder',
    why: 'Apply your improved application materials to real roles.',
    icon: 'jobs',
  }

  if (kind === 'cv') {
    return {
      recommendedActions: [cv, jobs],
      recommendedTools: [cv, translate],
      recommendedCareerResources: [career, jobs],
      nextJobAZStep: cv,
    }
  }
  if (kind === 'cover_letter') {
    return {
      recommendedActions: [interview, jobs, cv],
      recommendedTools: [cv, interview],
      recommendedCareerResources: [career, jobs],
      nextJobAZStep: interview,
    }
  }
  if (kind === 'academic' || mode !== 'general') {
    return {
      recommendedActions: [translate, career],
      recommendedTools: [translate],
      recommendedCareerResources: [career],
      nextJobAZStep: translate,
    }
  }
  return {
    recommendedActions: [cv, interview, career],
    recommendedTools: [cv, translate],
    recommendedCareerResources: [career, jobs],
    nextJobAZStep: cv,
  }
}

export function buildWritingReviewReport(
  content: string,
  issues: AnalyzedIssue[],
  mode: ProofreadingAnalyzeMode,
  projectCategory?: string
): WritingReviewReport {
  const open = issues.filter((i) => i.status !== 'applied' && i.status !== 'rejected')
  const critical = open.filter((i) => i.severity === 'high').length
  const important = open.filter((i) => i.severity === 'moderate').length
  const minor = open.filter((i) => i.severity === 'low').length
  const score = computeScore(issues)
  const estimatedScoreAfterFixes = computeEstimatedAfterFixes(score, issues)
  const documentKind = detectDocumentKind(content, mode, projectCategory)

  const scoreLabel =
    mode === 'general'
      ? 'Writing Score'
      : mode === 'academic_research'
        ? 'Academic Research Score'
        : 'Academic Score'

  const jobaz = buildJobAZActions(documentKind, mode)

  return {
    scoreLabel,
    score,
    estimatedScoreAfterFixes,
    strengths: buildStrengths(content, issues, mode),
    areasToImprove: buildAreasToImprove(issues),
    issueCounts: {
      total: issues.length,
      critical,
      important,
      minor,
      open: open.length,
      applied: issues.filter((i) => i.status === 'applied').length,
    },
    documentInsights: buildDocumentInsights(content, issues, mode),
    ...jobaz,
    documentKind,
  }
}
