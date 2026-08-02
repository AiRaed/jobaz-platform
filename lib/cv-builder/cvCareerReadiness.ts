import type { CvData } from '@/app/cv-builder-v2/page'
import type { MissionProgress } from '@/hooks/useMissionProgress'
import { computeQualificationReadinessBoost } from './trainingQualifications'

export type CareerReadinessItem = {
  id: string
  label: string
  status: 'complete' | 'warning' | 'incomplete'
}

export type CvReadinessBoost = {
  label: string
  delta: number
}

export type CvCareerReadinessReport = {
  items: CareerReadinessItem[]
  overallPercent: number
  cvQualityScore: number
  atsMatch: number
  cvStrength: number
  interviewReadiness: number
  careerReadiness: number
  qualificationBoost: number
  recentBoost: CvReadinessBoost | null
}

function hasPersonalDetails(cv: CvData): boolean {
  const p = cv.personalInfo
  return Boolean(p.fullName?.trim() && p.email?.trim())
}

function hasExperience(cv: CvData): boolean {
  return cv.experience.some(
    (e) => e.jobTitle?.trim() || e.company?.trim() || e.bullets?.some((b) => b.trim())
  )
}

function hasEducation(cv: CvData): boolean {
  return cv.education.some((e) => e.degree?.trim() || e.school?.trim())
}

function skillsNeedWork(cv: CvData): boolean {
  return (cv.skills?.length ?? 0) < 5
}

export function buildCvCareerReadiness(
  cv: CvData,
  cvQualityScore: number,
  atsMatch: number,
  hasJobDescription: boolean,
  mission: Pick<MissionProgress, 'appliedJobsCount' | 'cvReady'>,
  options?: {
    planReadinessScore?: number
    completedQualifications?: number
    totalQualifications?: number
    roadmapReadinessPercent?: number
    recentBoost?: CvReadinessBoost | null
  }
): CvCareerReadinessReport {
  const completedQuals = options?.completedQualifications ?? 0
  const totalQuals = options?.totalQualifications ?? 0
  const qualificationBoost = computeQualificationReadinessBoost(completedQuals, totalQuals)

  const items: CareerReadinessItem[] = [
    {
      id: 'personal',
      label: 'Personal Details',
      status: hasPersonalDetails(cv) ? 'complete' : 'incomplete',
    },
    {
      id: 'experience',
      label: 'Experience',
      status: hasExperience(cv) ? 'complete' : 'incomplete',
    },
    {
      id: 'education',
      label: 'Education',
      status: hasEducation(cv) ? 'complete' : 'warning',
    },
    {
      id: 'skills',
      label: 'Skills need improvement',
      status: skillsNeedWork(cv) ? 'warning' : 'complete',
    },
    {
      id: 'tailor',
      label: 'CV needs tailoring',
      status: hasJobDescription && atsMatch >= 50 ? 'complete' : 'warning',
    },
    {
      id: 'interview',
      label: 'Interview not prepared',
      status: mission.appliedJobsCount > 0 ? 'warning' : 'incomplete',
    },
  ]

  const itemScore = items.reduce((sum, item) => {
    if (item.status === 'complete') return sum + 100
    if (item.status === 'warning') return sum + 55
    return sum + 15
  }, 0)

  const itemAvg = Math.round(itemScore / items.length)
  const cvStrength = Math.min(
    100,
    Math.round(cvQualityScore * 0.85 + qualificationBoost * 0.5 + (mission.cvReady ? 8 : 0))
  )

  const interviewReadiness = Math.min(
    100,
    Math.round(
      (mission.appliedJobsCount > 0 ? 35 : 15) +
        (cvStrength >= 60 ? 25 : 10) +
        qualificationBoost * 0.8 +
        (completedQuals > 0 ? 10 : 0)
    )
  )

  const baseCareerReadiness = Math.round(
    itemAvg * 0.35 +
      cvQualityScore * 0.3 +
      (options?.planReadinessScore ?? cvQualityScore) * 0.15 +
      (options?.roadmapReadinessPercent ?? cvQualityScore) * 0.2
  )

  const careerReadiness = Math.min(100, baseCareerReadiness + qualificationBoost)

  const overallPercent = Math.min(
    100,
    Math.round(cvStrength * 0.4 + interviewReadiness * 0.25 + careerReadiness * 0.35)
  )

  return {
    items,
    overallPercent,
    cvQualityScore,
    atsMatch,
    cvStrength,
    interviewReadiness,
    careerReadiness,
    qualificationBoost,
    recentBoost: options?.recentBoost ?? null,
  }
}

export type CvJourneyNextStep = {
  id: 'tailor' | 'find_jobs' | 'interview' | 'apply'
  title: string
  description: string
  href?: string
  action?: 'scroll-jd'
}

export function getCvJourneyNextStep(
  cvQualityScore: number,
  hasJobDescription: boolean,
  atsMatch: number,
  appliedJobsCount: number
): CvJourneyNextStep | null {
  if (cvQualityScore < 45) return null

  if (!hasJobDescription || atsMatch < 45) {
    return {
      id: 'tailor',
      title: 'Tailor your CV for a real job',
      description: 'Paste a job description below so JAZ can optimise your CV for that role.',
      action: 'scroll-jd',
    }
  }

  if (appliedJobsCount === 0) {
    return {
      id: 'find_jobs',
      title: 'Find matching jobs',
      description: 'Your CV is ready — search UK roles that match your career plan.',
      href: '/job-finder',
    }
  }

  return {
    id: 'interview',
    title: 'Interview preparation',
    description: 'Practice answers for roles you have saved or applied to.',
    href: '/interview-coach',
  }
}
