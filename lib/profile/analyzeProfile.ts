import type { CvData, CvSectionExperience } from '@/app/cv-builder-v2/page'
import { computeCvScore } from '@/lib/cv-score'
import { analyzeCvHealth } from '@/lib/cv-optimization'
import type { AiUserProfile } from '@/lib/jobaz-ai/profile/types'
import type {
  AboutToneAnalysis,
  ExperienceRoleInsight,
  ProfileExtensions,
  ProfileMetric,
  ProfileStrength,
  ProfileStrengthStage,
  SkillsIntelligence,
  ToneSignal,
} from './types'

const ACTION_VERBS = ['led', 'managed', 'delivered', 'achieved', 'improved', 'built', 'created', 'increased']
const GENERIC_PHRASES = ['hard worker', 'team player', 'passionate', 'go-getter', 'dynamic']
const LEADERSHIP = ['led', 'managed', 'supervised', 'mentored', 'head of', 'director']
const TEAMWORK = ['team', 'collaborat', 'cross-functional', 'stakeholder']
const CUSTOMER = ['customer', 'client', 'service', 'support']
const MANAGEMENT = ['managed', 'budget', 'operations', 'strategy']
const PROBLEM = ['solved', 'resolved', 'optimiz', 'improved', 'reduced']

function stageFromPercent(p: number): ProfileStrengthStage {
  if (p >= 81) return 'Top Candidate'
  if (p >= 61) return 'Recruiter Ready'
  if (p >= 41) return 'Competitive'
  if (p >= 21) return 'Growing'
  return 'Beginner'
}

function nextStage(stage: ProfileStrengthStage): ProfileStrengthStage | null {
  const order: ProfileStrengthStage[] = [
    'Beginner',
    'Growing',
    'Competitive',
    'Recruiter Ready',
    'Top Candidate',
  ]
  const i = order.indexOf(stage)
  return i < order.length - 1 ? order[i + 1] : null
}

export function buildProfileStrength(
  extensions: ProfileExtensions,
  cvData: CvData | null,
  hasCoverLetter: boolean,
  aiProfile: AiUserProfile | null
): ProfileStrength {
  const checks: { id: string; label: string; done: boolean }[] = [
    { id: 'avatar', label: 'Profile photo', done: Boolean(extensions.avatarUrl) },
    { id: 'about', label: 'About Me', done: extensions.aboutMe.trim().split(/\s+/).length >= 25 },
    { id: 'headline', label: 'Professional headline', done: Boolean(extensions.careerDirection.trim() || cvData?.summary?.trim()) },
    { id: 'links', label: 'Professional links', done: Boolean(extensions.linkedinUrl || extensions.portfolioUrl || extensions.githubUrl) },
    { id: 'experience', label: 'Work experience', done: (cvData?.experience?.length ?? 0) > 0 },
    { id: 'achievements', label: 'Measurable achievements', done: hasMeasurableAchievements(cvData) },
    { id: 'education', label: 'Education', done: (cvData?.education?.length ?? 0) > 0 },
    { id: 'skills', label: 'Skills profile', done: (cvData?.skills?.length ?? 0) >= 4 },
    { id: 'cv', label: 'Active CV', done: Boolean(cvData?.summary?.trim()) },
    { id: 'cover', label: 'Cover letter', done: hasCoverLetter },
    { id: 'assessment', label: 'AI career assessment', done: (aiProfile?.assessmentCount ?? 0) > 0 },
  ]

  const completed = checks.filter((c) => c.done).map((c) => c.label)
  const missing = checks.filter((c) => !c.done).map((c) => c.label)
  const percentage = Math.round((completed.length / checks.length) * 100)
  const stage = stageFromPercent(percentage)
  const next = nextStage(stage)

  let recommendation = 'Complete your profile sections to unlock the next career stage.'
  if (missing.includes('Measurable achievements')) {
    recommendation = 'Add measurable achievements to unlock Recruiter Ready status.'
  } else if (missing.includes('Skills profile')) {
    recommendation = 'Add recruiter-relevant skills to strengthen your profile match.'
  } else if (missing.includes('About Me')) {
    recommendation = 'Write a compelling About Me — recruiters read this first.'
  } else if (next) {
    recommendation = `You're ${percentage}% complete — push toward ${next} status.`
  }

  return {
    percentage,
    stage,
    nextStage: next,
    completedSections: completed,
    missingSections: missing,
    recommendation,
    sectionsTotal: checks.length,
    sectionsComplete: completed.length,
  }
}

function hasMeasurableAchievements(cvData: CvData | null): boolean {
  if (!cvData) return false
  const text = `${cvData.summary} ${cvData.experience.flatMap((e) => e.bullets).join(' ')}`
  return /\d+%|\d+\+|£\d|\$\d|\d+ (people|staff|clients)/i.test(text)
}

export function analyzeAboutTone(text: string): AboutToneAnalysis {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      signals: [{ label: 'Empty — add your story', tone: 'weak' }],
      summary: 'Write your About Me to unlock AI tone analysis.',
    }
  }

  const words = trimmed.split(/\s+/).filter(Boolean)
  const lower = trimmed.toLowerCase()
  const signals: ToneSignal[] = []

  const hasAction = ACTION_VERBS.some((v) => lower.includes(v))
  const hasMetrics = /\d+%|\d+\+|£|\$/.test(trimmed)
  const genericCount = GENERIC_PHRASES.filter((p) => lower.includes(p)).length
  const firstPerson = (trimmed.match(/\bI\b/g) ?? []).length
  const passive = /\b(was|were|been)\b/gi.test(trimmed)

  signals.push({
    label: words.length >= 40 ? 'Professional length' : 'Too short for recruiters',
    tone: words.length >= 40 ? 'good' : 'weak',
  })
  signals.push({
    label: hasAction ? 'Strong action language' : 'Weak confidence',
    tone: hasAction ? 'good' : 'weak',
  })
  signals.push({
    label: hasMetrics ? 'Measurable impact' : 'Needs measurable impact',
    tone: hasMetrics ? 'good' : 'weak',
  })
  signals.push({
    label: genericCount === 0 ? 'Specific & authentic' : 'Too generic',
    tone: genericCount === 0 ? 'good' : 'weak',
  })
  signals.push({
    label: firstPerson >= 2 && !passive ? 'Strong communication' : 'Friendly but passive',
    tone: firstPerson >= 2 ? 'good' : 'neutral',
  })

  const goodCount = signals.filter((s) => s.tone === 'good').length
  const summary =
    goodCount >= 4
      ? 'Your tone reads professional and recruiter-friendly.'
      : goodCount >= 2
        ? 'Solid foundation — a few AI tweaks will sharpen your impact.'
        : 'Recruiters may skim past this — use AI to strengthen clarity and confidence.'

  return { signals: signals.slice(0, 6), summary }
}

function detectBadges(text: string): string[] {
  const lower = text.toLowerCase()
  const badges: string[] = []
  if (LEADERSHIP.some((k) => lower.includes(k))) badges.push('Leadership')
  if (TEAMWORK.some((k) => lower.includes(k))) badges.push('Teamwork')
  if (CUSTOMER.some((k) => lower.includes(k))) badges.push('Customer Service')
  if (MANAGEMENT.some((k) => lower.includes(k))) badges.push('Management')
  if (PROBLEM.some((k) => lower.includes(k))) badges.push('Problem Solving')
  return badges.slice(0, 4)
}

function roleImpact(exp: CvSectionExperience): number {
  const bullets = (exp.bullets ?? []).filter((b) => b.trim().length > 0)
  let score = 30
  if (bullets.length >= 2) score += 20
  if (bullets.some((b) => b.split(/\s+/).length >= 12)) score += 15
  const text = bullets.join(' ')
  if (/\d+%|\d+\+|£|\$/.test(text)) score += 25
  if (ACTION_VERBS.some((v) => text.toLowerCase().includes(v))) score += 10
  return Math.min(100, score)
}

function roleAts(exp: CvSectionExperience): number {
  const bullets = (exp.bullets ?? []).filter(Boolean)
  if (bullets.length === 0) return 25
  const avgLen = bullets.reduce((s, b) => s + b.split(/\s+/).length, 0) / bullets.length
  return Math.min(100, Math.round(40 + avgLen * 3 + bullets.length * 8))
}

export function analyzeExperienceRoles(experience: CvSectionExperience[]): ExperienceRoleInsight[] {
  return experience.map((exp) => {
    const text = `${exp.jobTitle} ${exp.company} ${(exp.bullets ?? []).join(' ')}`
    const badges = detectBadges(text)
    const detectedStrengths: string[] = []
    if (badges.includes('Leadership')) detectedStrengths.push('Leadership signals detected')
    if (/\d+%|\d+\+/.test(text)) detectedStrengths.push('Quantified results')
    if ((exp.bullets ?? []).length >= 3) detectedStrengths.push('Rich achievement detail')
    if (detectedStrengths.length === 0) detectedStrengths.push('Add measurable bullets to stand out')

    return {
      id: exp.id,
      atsStrength: roleAts(exp),
      recruiterImpact: roleImpact(exp),
      badges,
      detectedStrengths,
    }
  })
}

export function buildSkillsIntelligence(cvData: CvData | null, profile: AiUserProfile | null): SkillsIntelligence {
  const skills = cvData?.skills ?? []
  const existing = new Set(skills.map((s) => s.toLowerCase()))
  const demanded = ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Customer Service']
  const missing = demanded.filter((s) => !existing.has(s.toLowerCase()))
  const scanFirst = skills.slice(0, Math.min(4, skills.length))
  const health = cvData ? analyzeCvHealth(cvData) : null

  const suggestions: string[] = []
  if (!skills.some((s) => /leadership|manage|lead/i.test(s))) suggestions.push('Add leadership')
  if (!existing.has('communication')) suggestions.push('Add communication')
  if (!hasMeasurableAchievements(cvData)) suggestions.push('Add measurable achievements')
  if (!skills.some((s) => /customer|client/i.test(s))) suggestions.push('Add customer-facing experience')

  const roleRelevance = skills.slice(0, 8).map((skill, i) => ({
    skill,
    relevance: Math.max(55, 95 - i * 5),
  }))

  return {
    verified: skills.slice(0, 6),
    missing: missing.slice(0, 5),
    recruiterDemanded: demanded.filter((s) => existing.has(s.toLowerCase())).concat(missing.slice(0, 2)),
    scanFirst,
    atsKeywordStrength: health?.atsMatch ?? Math.min(60, skills.length * 8),
    suggestions,
    roleRelevance,
  }
}

export function buildExpandedMetrics(
  cvData: CvData | null,
  profile: AiUserProfile | null,
  interviewConfidence: number
): ProfileMetric[] {
  const cvScore = cvData ? computeCvScore(cvData).score : 0
  const health = cvData ? analyzeCvHealth(cvData) : null
  const careerScore = profile?.readinessScore ?? Math.round((cvScore + interviewConfidence) / 2)
  const aboutWords = (cvData?.summary ?? '').split(/\s+/).filter(Boolean).length
  const commStrength = Math.min(100, Math.round(35 + aboutWords * 0.8 + (health?.metrics.find((m) => m.id === 'grammar')?.progress ?? 0) * 0.3))
  const recruiterTrust = Math.round(careerScore * 0.5 + cvScore * 0.3 + interviewConfidence * 0.2)

  return [
    {
      id: 'career',
      label: 'Career Score',
      value: careerScore,
      tone: 'violet',
      tooltip: 'Overall AI career readiness from your journey and CV.',
      improveHint: 'Complete AI assessment and strengthen your CV.',
    },
    {
      id: 'cv',
      label: 'CV Quality',
      value: cvScore,
      tone: 'emerald',
      tooltip: 'Structure, completeness, and recruiter scanability.',
      improveHint: 'Add experience bullets with measurable results.',
    },
    {
      id: 'ats',
      label: 'ATS Match',
      value: health?.atsMatch ?? Math.round(cvScore * 0.65),
      tone: 'blue',
      tooltip: 'Keyword strength for applicant tracking systems.',
      improveHint: 'Tailor CV to target job descriptions.',
    },
    {
      id: 'interview',
      label: 'Interview Confidence',
      value: interviewConfidence,
      tone: 'cyan',
      tooltip: 'Practice and application activity signal.',
      improveHint: 'Use Interview Coach to build confidence.',
    },
    {
      id: 'communication',
      label: 'Communication Strength',
      value: commStrength,
      tone: 'amber',
      tooltip: 'Clarity and professionalism in your written profile.',
      improveHint: 'Rewrite About Me with confident, clear language.',
    },
    {
      id: 'trust',
      label: 'Recruiter Trust',
      value: recruiterTrust,
      tone: 'rose',
      tooltip: 'How trustworthy and complete you appear to recruiters.',
      improveHint: 'Complete profile sections and add verifiable links.',
    },
  ]
}

export function buildSuggestedCertifications(profile: AiUserProfile | null): { name: string; reason: string }[] {
  const goal = profile?.dominantGoal ?? 'find_jobs'
  const base = [
    { name: 'Customer Service Excellence', reason: 'Boosts recruiter confidence for client-facing roles' },
    { name: 'Leadership Basics', reason: 'Signals management potential on your profile' },
    { name: 'Google IT Support', reason: 'Adds credible technical foundation' },
  ]
  if (goal === 'interviews' || goal === 'prepare_interviews') {
    return [{ name: 'Interview Skills Certificate', reason: 'Pairs with your interview prep focus' }, ...base.slice(0, 2)]
  }
  return base
}

export function buildCareerFocusWithImpact(profile: AiUserProfile | null): { label: string; impact: string }[] {
  const items: { label: string; impact: string }[] = []
  if (profile?.weeklyFocus) items.push({ label: profile.weeklyFocus, impact: '+8 readiness' })
  if (profile?.nextAction) items.push({ label: profile.nextAction, impact: '+12 career score' })
  const defaults = [
    { label: 'Improve ATS score', impact: '+15 ATS match' },
    { label: 'Practice interview confidence', impact: '+10 interview score' },
    { label: 'Apply to 5 matched jobs', impact: '+8 engagement' },
    { label: 'Build stronger CV wording', impact: '+12 CV quality' },
  ]
  for (const d of defaults) {
    if (items.length >= 4) break
    if (!items.some((i) => i.label === d.label)) items.push(d)
  }
  return items.slice(0, 4)
}

export function buildShortlistMessage(confidence: number): string {
  if (confidence >= 75) return 'Recruiters are likely to shortlist this profile for relevant roles.'
  if (confidence >= 55) return 'Recruiters are moderately likely to shortlist this profile.'
  if (confidence >= 35) return 'Recruiters may pass — strengthen achievements and ATS match.'
  return 'Profile needs significant improvement before recruiter shortlisting.'
}

export function buildCareerDnaTags(profile: AiUserProfile | null, cvData: CvData | null): string[] {
  const tags = new Set<string>()
  if (profile?.strongestArea) tags.add(profile.strongestArea)
  if (profile?.experienceLevel === 'entry') tags.add('Fast Learner')
  if ((profile?.readinessScore ?? 0) >= 60) tags.add('Reliable')
  if (cvData?.skills && cvData.skills.length >= 5) tags.add('Analytical')
  if (cvData?.experience?.some((e) => (e.bullets ?? []).length >= 2)) tags.add('Detail Oriented')
  for (const t of ['Creative Thinker', 'Leadership Potential', 'Team Player']) {
    if (tags.size >= 6) break
    tags.add(t)
  }
  return [...tags].slice(0, 6)
}
