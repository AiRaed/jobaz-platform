import { calculateMatchPercentage, extractCVKeywords, extractKeywordsFromText } from '@/lib/job-matching'
import type {
  ApplicationAnalysis,
  ApplicationAnalysisInput,
  ApplicationDimensions,
  RecruiterInsight,
  ScoreDelta,
  SkillGap,
  SmartNextStep,
  WorkflowStep,
} from './types'

const LEADERSHIP_TERMS = [
  'lead', 'leader', 'supervis', 'manage', 'management', 'team', 'coordinat', 'delegate',
]
const MEASURABLE_PATTERNS = [/\d+%/, /\d+\+/, /£\d/, /\$\d/, /\d+ (people|staff|team|clients|customers)/i]

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractJobKeywords(description: string, title: string): string[] {
  const text = `${title} ${stripHtml(description)}`.toLowerCase()
  const words = extractKeywordsFromText(text)
  const freq = new Map<string, number>()
  for (const w of words) {
    if (w.length < 3) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([w]) => w)
}

function scoreCvQuality(cvSummary: string, cvSkills: string[] = []): number {
  const summary = cvSummary.trim()
  if (!summary) return 0
  const words = summary.split(/\s+/).filter(Boolean).length
  let score = Math.min(45, Math.round(words * 0.9))
  if (cvSkills.length >= 3) score += 15
  if (cvSkills.length >= 6) score += 10
  if (MEASURABLE_PATTERNS.some((p) => p.test(summary))) score += 15
  if (LEADERSHIP_TERMS.some((t) => summary.toLowerCase().includes(t))) score += 15
  return Math.min(100, score)
}

function scoreCoverLetter(text: string, jobKeywords: string[]): number | null {
  const body = text.trim()
  if (!body) return null
  const words = body.split(/\s+/).filter(Boolean).length
  let score = Math.min(50, Math.round(words * 0.35))
  const lower = body.toLowerCase()
  const hits = jobKeywords.filter((k) => lower.includes(k)).length
  score += Math.min(35, hits * 5)
  if (body.length > 200) score += 15
  return Math.min(100, score)
}

function scoreInterviewReadiness(statuses: ApplicationAnalysisInput['statuses']): number {
  if (statuses.trainingStatus === 'available') return 85
  if (statuses.applicationStatus === 'submitted') return 35
  if (statuses.coverStatus === 'ready' && statuses.cvStatus === 'ready') return 20
  return 0
}

function compositeStrength(dimensions: ApplicationDimensions): number {
  const cover = dimensions.coverLetter ?? 0
  return Math.round(
    dimensions.cvQuality * 0.28 +
      dimensions.atsMatch * 0.38 +
      cover * 0.22 +
      dimensions.interviewReadiness * 0.12
  )
}

function inferHiringRisk(ats: number, weaknesses: string[]): RecruiterInsight['hiringRisk'] {
  if (ats >= 70 && weaknesses.length <= 1) return 'Low'
  if (ats >= 45 || weaknesses.length <= 2) return 'Medium'
  return 'High'
}

function buildSkillGaps(missingSkills: string[], missingKeywords: string[]): SkillGap[] {
  const items = [...new Set([...missingSkills.slice(0, 4), ...missingKeywords.slice(0, 3)])].slice(0, 4)
  return items.map((skill) => ({
    skill,
    learnHint: `Review ${skill} basics — a 5-minute overview helps you speak confidently in interviews.`,
    interviewTip: `Prepare one example showing how you've used ${skill} or a related responsibility.`,
    cvTip: `Add ${skill} naturally in your summary or a bullet with a measurable outcome.`,
  }))
}

function buildWorkflowSteps(input: ApplicationAnalysisInput, atsMatch: number): WorkflowStep[] {
  const { cvStatus, coverStatus, applicationStatus, trainingStatus } = input.statuses
  const cvComplete = cvStatus === 'ready' || input.cvSummary.trim().length > 40
  const coverComplete = coverStatus === 'ready' || input.coverLetterText.trim().length > 80
  const coverLocked = !cvComplete || atsMatch < 40

  return [
    {
      id: 'cv',
      label: 'CV tailored for role',
      status: cvComplete ? 'complete' : 'active',
      hint: cvComplete ? 'CV aligned to this job' : 'Tailor summary to match role keywords',
    },
    {
      id: 'cover',
      label: 'Application messaging',
      status: coverComplete ? 'complete' : coverLocked ? 'locked' : atsMatch < 55 ? 'recommended' : 'active',
      hint: coverLocked
        ? 'Improve CV match before cover letter'
        : coverComplete
          ? 'Cover letter ready'
          : 'Strengthen match score, then refine messaging',
    },
    {
      id: 'apply',
      label: 'Submit application',
      status: applicationStatus === 'submitted' ? 'complete' : cvComplete && coverComplete ? 'recommended' : 'locked',
      hint:
        applicationStatus === 'submitted'
          ? 'Application submitted'
          : cvComplete && coverComplete
            ? 'Ready to apply'
            : 'Complete CV and messaging first',
    },
    {
      id: 'interview',
      label: 'Interview training',
      status:
        trainingStatus === 'available'
          ? 'complete'
          : applicationStatus === 'submitted'
            ? 'recommended'
            : atsMatch < 50
              ? 'locked'
              : 'locked',
      hint:
        trainingStatus === 'available'
          ? 'Training available'
          : applicationStatus === 'submitted'
            ? 'Prepare for recruiter questions'
            : 'Unlock after stronger application match',
    },
  ]
}

function buildSmartNextStep(
  input: ApplicationAnalysisInput,
  dimensions: ApplicationDimensions,
  missingKeywords: string[],
  missingSkills: string[]
): SmartNextStep {
  const { statuses } = input
  const roleReq = missingKeywords.slice(0, 4).map((k) => k.replace(/^\w/, (c) => c.toUpperCase()))
  const cvGaps = missingSkills.slice(0, 4).map((s) => `Missing evidence of ${s}`)

  if (!input.cvSummary.trim() || statuses.cvStatus === 'not-tailored') {
    return {
      title: 'Optimize CV for this role',
      description: 'Align your summary with what recruiters scan for in the first 6 seconds.',
      reason: 'Your CV is not yet tailored — ATS systems may filter you out before a human reads your application.',
      roleRequirements: roleReq.length ? roleReq : ['Role-specific keywords', 'Relevant experience', 'Clear achievements'],
      cvGaps: cvGaps.length ? cvGaps : ['No role-aligned summary', 'Weak keyword overlap'],
      ctaLabel: 'Improve Match Score',
      ctaType: 'optimize-cv',
    }
  }

  if (dimensions.atsMatch < 55) {
    const leadershipGap = LEADERSHIP_TERMS.some((t) =>
      `${input.job.description ?? ''} ${input.job.title}`.toLowerCase().includes(t)
    ) && !LEADERSHIP_TERMS.some((t) => input.cvSummary.toLowerCase().includes(t))

    return {
      title: leadershipGap
        ? 'Add leadership evidence before applying'
        : 'Increase your match score',
      description: leadershipGap
        ? 'This role signals supervision or coordination — your CV needs stronger management language.'
        : 'Close keyword and experience gaps recruiters expect for this posting.',
      reason: `ATS match is ${dimensions.atsMatch}% — below the typical shortlist threshold (~55–60%).`,
      roleRequirements: roleReq,
      cvGaps: cvGaps.length ? cvGaps : ['Weak keyword overlap', 'Missing measurable achievements'],
      ctaLabel: 'Improve Match Score',
      ctaType: 'improve-match',
    }
  }

  if (statuses.coverStatus === 'not-created' && !input.coverLetterText.trim()) {
    return {
      title: 'Strengthen application messaging',
      description: 'Your CV match is improving — refine how you present your fit for this company.',
      reason: `CV quality ${dimensions.cvQuality}% · ATS ${dimensions.atsMatch}% — messaging can push you over the shortlist line.`,
      roleRequirements: roleReq,
      cvGaps: cvGaps.slice(0, 2),
      ctaLabel: 'Increase Application Strength',
      ctaType: 'cover',
    }
  }

  if (statuses.applicationStatus === 'not-submitted') {
    return {
      title: 'You are ready to apply',
      description: 'Application strength is competitive — submit while your materials are aligned.',
      reason: `Composite strength ${compositeStrength(dimensions)}% with solid CV and messaging.`,
      roleRequirements: roleReq.slice(0, 3),
      cvGaps: [],
      ctaLabel: 'Apply for this job',
      ctaType: 'apply',
    }
  }

  return {
    title: 'Train for the interview',
    description: 'Application submitted — prepare answers recruiters will probe based on this JD.',
    reason: 'Convert your application strength into interview confidence.',
    roleRequirements: roleReq.slice(0, 3),
    cvGaps: [],
    ctaLabel: 'Start Interview Training',
    ctaType: 'interview',
  }
}

export function analyzeApplication(input: ApplicationAnalysisInput): ApplicationAnalysis {
  const cvKeywords = extractCVKeywords({
    summary: input.cvSummary,
    skills: input.cvSkills ?? [],
  })
  const jobKeywords = extractJobKeywords(input.job.description ?? '', input.job.title)
  const cvLower = `${input.cvSummary} ${input.coverLetterText}`.toLowerCase()

  const atsMatch =
    input.aiFitScore && input.aiFitScore > 0
      ? Math.round(input.aiFitScore * 0.55 + calculateMatchPercentage(cvKeywords, input.job.title, input.job.description) * 0.45)
      : calculateMatchPercentage(cvKeywords, input.job.title, input.job.description)

  const missingKeywords = jobKeywords.filter((k) => !cvLower.includes(k)).slice(0, 8)
  const aiMissing = input.aiMissingSkills ?? []
  const missingSkills = [...new Set([...aiMissing, ...missingKeywords.slice(0, 5)])].slice(0, 6)

  const dimensions: ApplicationDimensions = {
    cvQuality: scoreCvQuality(input.cvSummary, input.cvSkills),
    atsMatch,
    coverLetter: scoreCoverLetter(input.coverLetterText, jobKeywords),
    interviewReadiness: scoreInterviewReadiness(input.statuses),
  }

  const strengths: string[] = []
  const weaknesses: string[] = []

  if (dimensions.cvQuality >= 60) strengths.push('Solid CV summary with usable detail')
  else weaknesses.push('CV summary needs more role-specific depth')

  if (dimensions.atsMatch >= 55) strengths.push('Reasonable keyword overlap with job description')
  else weaknesses.push('Low ATS keyword match vs job description')

  if (dimensions.coverLetter !== null && dimensions.coverLetter >= 50) strengths.push('Cover messaging supports your application')
  else if (input.coverLetterText.trim()) weaknesses.push('Cover letter could better mirror role language')
  else weaknesses.push('No cover letter — optional but helps on competitive roles')

  if (MEASURABLE_PATTERNS.some((p) => p.test(input.cvSummary))) strengths.push('Includes measurable outcomes')
  else weaknesses.push('Lacks quantified achievements recruiters scan for')

  if (input.aiStrengths?.length) {
    for (const s of input.aiStrengths.slice(0, 2)) {
      if (!strengths.includes(s)) strengths.push(s)
    }
  }
  if (input.aiWeaknesses?.length) {
    for (const w of input.aiWeaknesses.slice(0, 3)) {
      if (!weaknesses.includes(w)) weaknesses.push(w)
    }
  }

  const applicationStrength = compositeStrength(dimensions)
  const hiringRisk = inferHiringRisk(dimensions.atsMatch, weaknesses)

  const recruiterInsight: RecruiterInsight = {
    applicationStrength,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 5),
    hiringRisk,
    missingKeywords,
    missingSkills,
    confidenceScore: Math.min(95, Math.round(40 + applicationStrength * 0.55)),
  }

  const scoreExplanation = {
    summary: `Your application strength is ${applicationStrength}% — driven mainly by ATS match (${dimensions.atsMatch}%) and CV quality (${dimensions.cvQuality}%).`,
    gaps: weaknesses.slice(0, 4),
    roleRequirements: jobKeywords.slice(0, 6).map((k) => k.replace(/^\w/, (c) => c.toUpperCase())),
    cvGaps: missingSkills.map((s) => `No clear evidence of ${s}`),
  }

  return {
    applicationStrength,
    dimensions,
    recruiterInsight,
    scoreExplanation,
    skillGaps: buildSkillGaps(missingSkills, missingKeywords),
    smartNextStep: buildSmartNextStep(input, dimensions, missingKeywords, missingSkills),
    workflowSteps: buildWorkflowSteps(input, dimensions.atsMatch),
  }
}

export function computeScoreDeltas(
  prev: ApplicationAnalysis | null,
  next: ApplicationAnalysis
): ScoreDelta[] {
  if (!prev) return []
  const deltas: ScoreDelta[] = []
  const d = next.dimensions
  const p = prev.dimensions

  const atsDelta = d.atsMatch - p.atsMatch
  if (atsDelta !== 0) deltas.push({ label: 'ATS Match', delta: atsDelta })

  const cvDelta = d.cvQuality - p.cvQuality
  if (cvDelta !== 0) deltas.push({ label: 'CV Quality', delta: cvDelta })

  if (d.coverLetter !== null && p.coverLetter !== null) {
    const cDelta = d.coverLetter - p.coverLetter
    if (cDelta !== 0) deltas.push({ label: 'Cover Strength', delta: cDelta })
  }

  const strengthDelta = next.applicationStrength - prev.applicationStrength
  if (strengthDelta !== 0 && deltas.length === 0) {
    deltas.push({ label: 'Application Strength', delta: strengthDelta })
  }

  return deltas.filter((x) => x.delta !== 0).slice(0, 3)
}
