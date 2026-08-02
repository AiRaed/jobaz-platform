import { computeCvScore } from '@/lib/cv-score'
import { calculateCvReadinessForPlan } from '@/lib/cv/calculateCvReadinessForPlan'
import { calculateMatchPercentage, extractCVKeywords } from '@/lib/job-matching'
import type { CvData } from '@/app/cv-builder-v2/page'
import type { CvAiButtonHint, CvHealthMetric, CvHealthReport, CvWorkflowStep } from './types'

const ACTION_VERBS = ['managed', 'led', 'delivered', 'achieved', 'improved', 'increased', 'reduced', 'built', 'created']
const MEASURABLE = [/\d+%/, /\d+\+/, /£\d/, /\$\d/, /\d+ (people|staff|team|clients)/i]

function estimateGrammarScore(cvData: CvData): { score: number; label: string } {
  const text = [
    cvData.summary,
    ...cvData.experience.flatMap((e) => e.bullets ?? []),
  ].join(' ')
  if (!text.trim()) return { score: 0, label: 'Needs work' }

  let score = 72
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 8)
  const doubleSpaces = (text.match(/  +/g) ?? []).length
  const allCapsWords = (text.match(/\b[A-Z]{4,}\b/g) ?? []).length

  if (doubleSpaces > 2) score -= 8
  if (allCapsWords > 3) score -= 6
  if (sentences.length < 2 && cvData.summary.length > 40) score -= 10
  if (text.length > 100 && !/[.!?]/.test(text.slice(-20))) score -= 5

  score = Math.max(0, Math.min(100, score))
  const label = score >= 80 ? 'Good' : score >= 55 ? 'Fair' : 'Needs work'
  return { score, label }
}

function estimateRecruiterImpact(cvData: CvData, cvScore: ReturnType<typeof computeCvScore>): {
  score: number
  label: string
} {
  let score = Math.round(cvScore.qualityScore * 0.6 + cvScore.completionScore * 0.4)
  const text = `${cvData.summary} ${cvData.experience.flatMap((e) => e.bullets).join(' ')}`
  if (MEASURABLE.some((p) => p.test(text))) score += 12
  if (ACTION_VERBS.some((v) => text.toLowerCase().includes(v))) score += 8
  if (cvData.experience.some((e) => (e.bullets ?? []).filter((b) => b.trim().length > 20).length >= 2)) score += 6
  score = Math.max(0, Math.min(100, score))
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Medium' : 'Low'
  return { score, label }
}

function detectMissingSections(cvData: CvData, fixes: string[]): string[] {
  const missing: string[] = []
  if (!cvData.summary.trim() || cvData.summary.trim().split(/\s+/).length < 20) missing.push('Summary depth')
  if (cvData.experience.length === 0) missing.push('Experience')
  if ((cvData.skills ?? []).length < 3) missing.push('Skills')
  if (!cvData.personalInfo?.email?.trim()) missing.push('Contact')
  if (!MEASURABLE.some((p) => p.test(cvData.summary))) missing.push('Metrics')
  if (!ACTION_VERBS.some((v) => cvData.summary.toLowerCase().includes(v))) missing.push('Leadership / impact verbs')
  for (const fix of fixes.slice(0, 2)) {
    const short = fix.length > 28 ? fix.slice(0, 28) + '…' : fix
    if (!missing.includes(short)) missing.push(short)
  }
  return [...new Set(missing)].slice(0, 5)
}

function buildWorkflow(cvData: CvData, jobDescription: string, overall: number, ats: number): CvWorkflowStep[] {
  const hasBasics =
    Boolean(cvData.personalInfo?.fullName?.trim()) &&
    cvData.summary.trim().length > 15 &&
    cvData.experience.length > 0

  const buildProgress = hasBasics ? 100 : Math.min(90, overall)
  const atsProgress = jobDescription.trim() ? Math.min(100, ats) : Math.min(100, Math.round(overall * 0.7))
  const impactProgress = Math.min(100, Math.round(overall * 0.85))
  const coverProgress = 0
  const interviewProgress = 0

  return [
    {
      id: 'build',
      label: 'Build CV',
      status: buildProgress >= 85 ? 'complete' : 'active',
      progress: buildProgress,
      hint: 'Core sections and contact details',
    },
    {
      id: 'ats',
      label: 'Optimize ATS',
      status: !jobDescription.trim() ? 'locked' : atsProgress >= 60 ? 'complete' : atsProgress >= 40 ? 'active' : 'recommended',
      progress: atsProgress,
      hint: jobDescription.trim() ? 'Match keywords to the job description' : 'Paste a job description to unlock',
    },
    {
      id: 'impact',
      label: 'Improve Impact',
      status: impactProgress >= 70 ? 'complete' : buildProgress >= 60 ? 'recommended' : 'locked',
      progress: impactProgress,
      hint: 'Add measurable achievements recruiters scan for',
    },
    {
      id: 'cover',
      label: 'Cover Letter',
      status: overall >= 65 ? 'recommended' : 'locked',
      progress: coverProgress,
      hint: 'Generate after CV match is strong',
    },
    {
      id: 'interview',
      label: 'Interview Prep',
      status: 'locked',
      progress: interviewProgress,
      hint: 'Unlock from job application flow',
    },
  ]
}

function estimateAiHints(cvData: CvData, jobDescription: string, ats: number): CvAiButtonHint[] {
  const summaryWords = cvData.summary.trim().split(/\s+/).filter(Boolean).length
  const weakBullets = cvData.experience.flatMap((e) => e.bullets ?? []).filter((b) => b.trim().split(/\s+/).length < 8).length

  return [
    {
      id: 'analyze',
      label: 'Analyze JD',
      impactLabel: '+ATS insight',
      estimatedDelta: jobDescription.trim() ? 6 : 0,
    },
    {
      id: 'summary',
      label: 'Improve Summary',
      impactLabel: `+${Math.min(18, summaryWords < 25 ? 14 : 8)} clarity`,
      estimatedDelta: summaryWords < 25 ? 12 : 8,
    },
    {
      id: 'experience',
      label: 'Tailor Experience',
      impactLabel: `+${Math.min(22, 10 + weakBullets * 3)} ATS match`,
      estimatedDelta: Math.min(18, 8 + weakBullets * 2),
    },
    {
      id: 'skills',
      label: 'Suggest Skills',
      impactLabel: `+${Math.min(12, Math.max(5, 12 - (cvData.skills?.length ?? 0)))} recruiter match`,
      estimatedDelta: Math.min(9, Math.max(4, 10 - (cvData.skills?.length ?? 0))),
    },
    {
      id: 'grammar',
      label: 'Fix Grammar',
      impactLabel: '+5 readability',
      estimatedDelta: 5,
    },
  ]
}

function toneFromScore(score: number): CvHealthMetric['tone'] {
  if (score >= 70) return 'good'
  if (score >= 45) return 'medium'
  return 'low'
}

export function analyzeCvHealth(
  cvData: CvData,
  jobDescription = '',
  careerPlan?: {
    targetRole?: string | null
    routeTitle?: string | null
    focusKeywords?: string[] | null
    currentTarget?: string | null
    nextUpgrade?: string | null
    pathId?: string | null
  } | null
): CvHealthReport {
  const cvScore = computeCvScore(cvData)
  // Shared plan-aware readiness (Documents + Builder)
  const readiness = calculateCvReadinessForPlan(cvData, careerPlan ?? null)
  const overallScore = readiness.score
  const grammar = estimateGrammarScore(cvData)
  const impact = estimateRecruiterImpact(cvData, cvScore)

  let atsMatch = 0
  if (jobDescription.trim()) {
    const keywords = extractCVKeywords({
      summary: cvData.summary,
      skills: cvData.skills,
      experience: cvData.experience,
    })
    atsMatch = calculateMatchPercentage(keywords, '', jobDescription)
  } else {
    // Soft ATS estimate from real readiness — do not floor at a fake 55%
    atsMatch = Math.min(40, Math.round(overallScore * 0.65))
  }

  const missingSections =
    readiness.missing.length > 0
      ? readiness.missing.slice(0, 5)
      : detectMissingSections(cvData, cvScore.fixes)

  const aiHints = estimateAiHints(cvData, jobDescription, atsMatch)
  // Potential: current + conservative lift from incomplete AI improvements
  const hintLift = aiHints.reduce((sum, h) => sum + Math.max(0, h.estimatedDelta), 0)
  const missingLift = Math.min(18, missingSections.length * 4)
  const potentialScore = Math.min(
    100,
    Math.max(overallScore, overallScore + Math.round(hintLift * 0.35 + missingLift * 0.5))
  )

  const metrics: CvHealthMetric[] = [
    {
      id: 'score',
      label: 'CV Readiness',
      value: overallScore,
      display: `${overallScore}`,
      tone: toneFromScore(overallScore),
      tooltip: 'Shared JobAZ CV readiness from your real CV sections (same as Documents).',
      progress: overallScore,
    },
    {
      id: 'ats',
      label: 'ATS Match',
      value: atsMatch,
      display: `${atsMatch}%`,
      tone: toneFromScore(atsMatch),
      tooltip: jobDescription.trim()
        ? 'Keyword overlap between your CV and the pasted job description.'
        : 'Paste a job description for live ATS matching.',
      progress: atsMatch,
    },
    {
      id: 'grammar',
      label: 'Grammar',
      value: grammar.score,
      display: grammar.label,
      tone: toneFromScore(grammar.score),
      tooltip: 'Readability and basic grammar signals across summary and bullets.',
      progress: grammar.score,
    },
    {
      id: 'impact',
      label: 'Recruiter Impact',
      value: impact.score,
      display: impact.label,
      tone: toneFromScore(impact.score),
      tooltip: 'How strongly your CV signals achievements, action verbs, and measurable results.',
      progress: impact.score,
    },
  ]

  return {
    overallScore,
    metrics,
    workflowSteps: buildWorkflow(cvData, jobDescription, overallScore, atsMatch),
    aiHints,
    missingSections,
    cvScore,
    atsMatch,
    potentialScore,
    statusLabel: readiness.statusLabel || 'CV Readiness',
    planCvMatch: readiness.planCvMatch || 'none',
    suggestedNextStep: readiness.suggestedNextStep || '',
  }
}
