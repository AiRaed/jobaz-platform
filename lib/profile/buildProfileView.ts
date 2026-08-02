import type { CvData } from '@/app/cv-builder-v2/page'
import { getStrongestArea, getWeakestArea } from '@/lib/jobaz-ai/profile/recommendations'
import type { AiUserProfile } from '@/lib/jobaz-ai/profile/types'
import { analyzeCvHealth } from '@/lib/cv-optimization'
import {
  analyzeAboutTone,
  analyzeExperienceRoles,
  buildCareerDnaTags,
  buildCareerFocusWithImpact,
  buildExpandedMetrics,
  buildProfileStrength,
  buildShortlistMessage,
  buildSkillsIntelligence,
  buildSuggestedCertifications,
} from './analyzeProfile'
import type {
  ProfileActivityItem,
  ProfileDocumentSummary,
  ProfileExtensions,
  ProfileViewModel,
  RecruiterImpression,
} from './types'
import { slugifyUsername } from './storage'

function buildRecruiterImpression(
  profile: AiUserProfile | null,
  cvData: CvData | null
): RecruiterImpression {
  const strongest = profile ? getStrongestArea(profile) : 'Professional presentation'
  const weakest = profile ? getWeakestArea(profile) : 'CV completeness'
  const health = cvData ? analyzeCvHealth(cvData) : null
  const confidence = profile?.readinessScore ?? health?.overallScore ?? 35

  const weaknesses: string[] = []
  if (health && health.atsMatch < 55) weaknesses.push('Weak ATS match')
  if (!hasMeasurable(cvData)) weaknesses.push('Missing achievements')
  if (!hasLeadershipEvidence(cvData)) weaknesses.push('No leadership evidence')
  weaknesses.push(weakest)
  if (weaknesses.length < 3 && health?.missingSections.length) {
    weaknesses.push(...health.missingSections.slice(0, 2))
  }

  const suggestions: string[] = []
  if (health && health.atsMatch < 55) suggestions.push('Tailor CV keywords to target roles')
  if (!hasMeasurable(cvData)) suggestions.push('Add numbers and outcomes to experience bullets')
  if (profile?.nextAction) suggestions.push(profile.nextAction)
  if (suggestions.length === 0) suggestions.push('Keep refining and applying to matched roles')

  return {
    strongestTraits: [
      'Professional presentation',
      strongest,
      'Communication',
      'Career direction',
      'Reliability',
    ].slice(0, 4),
    weaknesses: [...new Set(weaknesses)].slice(0, 4),
    confidence,
    confidenceLabel: confidence >= 70 ? 'Strong' : confidence >= 45 ? 'Moderate' : 'Developing',
    shortlistMessage: buildShortlistMessage(confidence),
    suggestions: suggestions.slice(0, 4),
  }
}

function hasMeasurable(cvData: CvData | null): boolean {
  if (!cvData) return false
  const text = `${cvData.summary} ${cvData.experience.flatMap((e) => e.bullets).join(' ')}`
  return /\d+%|\d+\+|£|\$/.test(text)
}

function hasLeadershipEvidence(cvData: CvData | null): boolean {
  if (!cvData) return false
  const text = cvData.experience.flatMap((e) => e.bullets).join(' ').toLowerCase()
  return /led|managed|supervised|mentored/.test(text)
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch {
    return 'Recently'
  }
}

function mapEventType(label: string): ProfileActivityItem['type'] {
  const lower = label.toLowerCase()
  if (lower.includes('interview')) return 'interview'
  if (lower.includes('assessment') || lower.includes('career path')) return 'assessment'
  if (lower.includes('cv') || lower.includes('writing')) return 'cv'
  if (lower.includes('job') || lower.includes('applied')) return 'application'
  if (lower.includes('profile')) return 'profile'
  return 'general'
}

function buildActivity(
  profile: AiUserProfile | null,
  hasCv: boolean,
  applicationsCount: number,
  aiTimeline: { id: string; label: string; createdAt: string }[] = []
): ProfileActivityItem[] {
  const items: ProfileActivityItem[] = []

  for (const event of aiTimeline.slice(0, 4)) {
    items.push({
      id: event.id,
      label: event.label,
      when: formatWhen(event.createdAt),
      type: mapEventType(event.label),
    })
  }

  if (profile?.assessmentCount && !items.some((i) => i.type === 'assessment')) {
    items.push({
      id: 'assessment',
      label: 'Completed AI career assessment',
      when: 'Recently',
      type: 'assessment',
    })
  }
  if (hasCv && !items.some((i) => i.type === 'cv')) {
    items.push({ id: 'cv', label: 'Updated CV profile', when: 'Recently', type: 'cv' })
  }
  if (applicationsCount > 0 && !items.some((i) => i.type === 'application')) {
    items.push({
      id: 'app',
      label: `Applied to ${applicationsCount} job${applicationsCount > 1 ? 's' : ''}`,
      when: 'This month',
      type: 'application',
    })
  }
  if (items.length === 0) {
    items.push({ id: 'profile', label: 'Building your professional identity', when: 'Now', type: 'profile' })
  }
  return items.slice(0, 6)
}

function careerLevelLabel(profile: AiUserProfile | null): string {
  if (profile?.careerStage) return profile.careerStage
  if ((profile?.readinessScore ?? 0) >= 70) return 'Job Ready'
  if ((profile?.readinessScore ?? 0) >= 45) return 'Prepared'
  if ((profile?.readinessScore ?? 0) >= 25) return 'Active'
  return 'Beginner'
}

export function buildProfileView(input: {
  displayName: string
  email: string
  extensions: ProfileExtensions
  cvData: CvData | null
  aiProfile: AiUserProfile | null
  interviewConfidence: number
  applicationsCount: number
  hasCoverLetter: boolean
  aiTimeline?: { id: string; label: string; createdAt: string }[]
}): ProfileViewModel {
  const { cvData, aiProfile, extensions, displayName } = input
  const hasCv = Boolean(cvData?.personalInfo?.fullName?.trim() || cvData?.summary?.trim())
  const location = cvData?.personalInfo?.location?.trim() || 'United Kingdom'
  const careerDirection =
    extensions.careerDirection.trim() ||
    cvData?.experience?.[0]?.jobTitle ||
    aiProfile?.dominantGoal?.replace(/_/g, ' ') ||
    'Career professional'

  const username = extensions.username.trim() || slugifyUsername(displayName)
  const mergedExt = { ...extensions, username }
  const aboutText = extensions.aboutMe.trim() || cvData?.summary?.trim() || ''

  return {
    displayName,
    email: input.email,
    location,
    careerDirection: careerDirection.charAt(0).toUpperCase() + careerDirection.slice(1),
    careerLevel: careerLevelLabel(aiProfile),
    availabilityStatus: extensions.availabilityStatus,
    avatarUrl: extensions.avatarUrl,
    extensions: mergedExt,
    cvData,
    aiProfile,
    metrics: buildExpandedMetrics(cvData, aiProfile, input.interviewConfidence),
    profileStrength: buildProfileStrength(mergedExt, cvData, input.hasCoverLetter, aiProfile),
    aboutTone: analyzeAboutTone(aboutText),
    experienceInsights: analyzeExperienceRoles(cvData?.experience ?? []),
    skillsIntelligence: buildSkillsIntelligence(cvData, aiProfile),
    careerDna: buildCareerDnaTags(aiProfile, cvData),
    recruiterImpression: buildRecruiterImpression(aiProfile, cvData),
    careerFocus: buildCareerFocusWithImpact(aiProfile),
    suggestedCertifications: buildSuggestedCertifications(aiProfile),
    documents: [
      {
        id: 'active-cv',
        label: 'Active CV',
        description: hasCv ? 'Live CV powering your identity' : 'Create your CV',
        href: '/cv-builder-v2',
      },
      {
        id: 'saved-cvs',
        label: 'Saved CVs',
        description: hasCv ? '1 active version' : 'No saved versions',
        href: '/cv-builder-v2',
        count: hasCv ? 1 : 0,
      },
      {
        id: 'cover',
        label: 'Cover Letters',
        description: input.hasCoverLetter ? 'Ready to send' : 'Generate tailored letter',
        href: '/cover',
      },
      {
        id: 'interview',
        label: 'Interview Reports',
        description: 'Practice feedback & scores',
        href: '/interview-coach',
      },
      {
        id: 'assessment',
        label: 'AI Assessments',
        description:
          (aiProfile?.assessmentCount ?? 0) > 0
            ? `${aiProfile?.assessmentCount} completed`
            : 'Discover your career path',
        href: '/uk-career-assistant',
        count: aiProfile?.assessmentCount ?? 0,
      },
    ],
    activity: buildActivity(aiProfile, hasCv, input.applicationsCount, input.aiTimeline),
    hasCv,
    isRecruiterVisible: extensions.visibility === 'recruiter' || extensions.visibility === 'public',
  }
}
