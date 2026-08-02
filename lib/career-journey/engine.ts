import type { UkCareerDirection, UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import type { CareerBrainOutput } from '@/lib/career-brain/types'
import { domainLabel } from '@/lib/career-brain/domains'
import type {
  CareerIntelligenceProfile,
  CareerJourneyState,
  CareerPathDirection,
  CareerPathTriad,
  JourneyNextAction,
  JourneySignalInput,
  SmartProfileSection,
} from './types'
import { JOURNEY_STATE_DESCRIPTIONS, JOURNEY_STATE_LABELS } from './types'

function mapDirections(
  dirs: UkCareerRuleResult['work_now']['directions'] | undefined
): CareerPathDirection[] {
  if (!dirs?.length) return []
  return dirs.map((d) => ({
    id: d.direction_id,
    title: d.direction_title,
    why: d.why ?? [],
    chips: d.chips,
  }))
}

export function deriveCareerJourneyState(signals: JourneySignalInput): CareerJourneyState {
  const {
    hasAssessment,
    readinessScore,
    cvQualityScore,
    hasBaseCv,
    applicationsCount,
    interviewConfidence,
    dominantGoal,
    weakestArea,
    engagementScore = 0,
    hasAcceptedOffer,
  } = signals

  if (hasAcceptedOffer) return 'working'

  if (!hasAssessment && readinessScore < 15) return 'exploring'

  if (hasAssessment && readinessScore < 25 && !hasBaseCv) return 'discovering'

  if (applicationsCount >= 1 && (interviewConfidence >= 45 || weakestArea === 'Interview practice')) {
    return 'interviewing'
  }

  if (applicationsCount >= 1) return 'applying'

  if (!hasBaseCv || cvQualityScore < 50 || weakestArea === 'CV quality' || dominantGoal === 'build_cv') {
    return 'building_cv'
  }

  if (
    readinessScore < 45 ||
    weakestArea === 'English confidence' ||
    interviewConfidence < 35 ||
    dominantGoal === 'improve_skills'
  ) {
    if (dominantGoal === 'improve_skills' || dominantGoal === 'understand_options') return 'upskilling'
    return 'preparing'
  }

  if (readinessScore >= 70 && applicationsCount >= 2 && engagementScore >= 25) {
    return 'growing'
  }

  if (readinessScore >= 50 && hasBaseCv) return 'job_ready'

  if (hasAssessment && readinessScore < 35) return 'discovering'

  return hasAssessment ? 'preparing' : 'exploring'
}

export function buildNextActions(
  state: CareerJourneyState,
  signals: JourneySignalInput
): JourneyNextAction[] {
  const actions: JourneyNextAction[] = []

  switch (state) {
    case 'exploring':
      actions.push({
        id: 'assess',
        title: 'Start your career journey',
        description: 'Talk to JAZ — adaptive questions that build your UK career intelligence profile.',
        href: '/uk-career-assistant',
        priority: 'primary',
        toolLabel: 'UK Career Assistant',
      })
      actions.push({
        id: 'paths',
        title: 'Browse career paths',
        description: 'See realistic UK routes while you decide.',
        href: '/build-your-path',
        priority: 'secondary',
      })
      break

    case 'discovering':
      actions.push({
        id: 'assistant',
        title: 'Continue with JAZ',
        description: 'Review your Work Now, Build Next, and long-term directions — practical, not permanent labels.',
        href: '/uk-career-assistant',
        priority: 'primary',
      })
      actions.push({
        id: 'paths',
        title: 'Explore matching paths',
        description: 'See courses, timelines, and UK pathways that fit your answers.',
        href: '/build-your-path',
        priority: 'secondary',
      })
      break

    case 'preparing':
      actions.push({
        id: 'writing',
        title: 'Build workplace confidence',
        description: 'Small daily practice improves applications and interviews.',
        href: '/writing-review',
        priority: 'primary',
        toolLabel: 'Writing Review',
      })
      actions.push({
        id: 'assistant',
        title: 'Refresh your career plan',
        description: 'Update goals and preferences with JAZ.',
        href: '/uk-career-assistant',
        priority: 'secondary',
      })
      break

    case 'building_cv':
      actions.push({
        id: 'cv',
        title: 'Build or improve your CV',
        description: 'A clear UK-style CV unlocks more interviews.',
        href: '/cv-builder-v2',
        priority: 'primary',
        toolLabel: 'CV Builder',
      })
      actions.push({
        id: 'review',
        title: 'Get CV feedback',
        description: 'Find gaps before you apply.',
        href: '/writing-review',
        priority: 'secondary',
      })
      break

    case 'job_ready':
      actions.push({
        id: 'jobs',
        title: 'Find matching jobs',
        description: 'Apply to roles that fit your Work Now directions.',
        href: '/job-finder',
        priority: 'primary',
        toolLabel: 'Job Finder',
      })
      actions.push({
        id: 'tailor',
        title: 'Tailor CV to a role',
        description: 'Increase match score for each application.',
        href: '/cv-builder-v2',
        priority: 'secondary',
      })
      break

    case 'applying':
      actions.push({
        id: 'track',
        title: 'Track applications',
        description: 'See saved and applied jobs in one place.',
        href: '/dashboard?tab=jobs',
        priority: 'primary',
      })
      actions.push({
        id: 'cover',
        title: 'Write a cover letter',
        description: 'Stand out for your top roles.',
        href: '/cover',
        priority: 'secondary',
      })
      break

    case 'interviewing':
      actions.push({
        id: 'coach',
        title: 'Practice interviews with JAZ',
        description: 'Build calm, structured answers for UK employers.',
        href: '/interview-coach',
        priority: 'primary',
        toolLabel: 'Interview Coach',
      })
      actions.push({
        id: 'jobs',
        title: 'Find more roles',
        description: 'Keep your pipeline full while you prepare.',
        href: '/job-finder',
        priority: 'secondary',
      })
      break

    case 'upskilling':
      actions.push({
        id: 'path',
        title: 'Explore Build Your Path',
        description: 'Courses, certifications, and realistic timelines.',
        href: '/build-your-path',
        priority: 'primary',
      })
      actions.push({
        id: 'assistant',
        title: 'Update career plan',
        description: 'Refresh your Build Next directions with JAZ.',
        href: '/uk-career-assistant',
        priority: 'secondary',
      })
      break

    case 'working':
      actions.push({
        id: 'growth',
        title: 'Plan your next step',
        description: 'While you work, map your Build Next and long-term growth.',
        href: '/build-your-path',
        priority: 'primary',
      })
      actions.push({
        id: 'feed',
        title: 'Share your journey',
        description: 'Connect with others on similar paths.',
        href: '/feed',
        priority: 'secondary',
      })
      break

    case 'growing':
      actions.push({
        id: 'feed',
        title: 'Join the career community',
        description: 'Share wins, ask questions, learn from others on similar paths.',
        href: '/feed',
        priority: 'primary',
      })
      actions.push({
        id: 'paths',
        title: 'Level up your path',
        description: 'Explore specialisation and long-term growth.',
        href: '/build-your-path',
        priority: 'secondary',
      })
      break
  }

  if (signals.hasAssessment && state !== 'exploring') {
    actions.push({
      id: 'profile',
      title: 'View smart profile',
      description: 'See strengths, gaps, and recommended first steps.',
      href: '/profile',
      priority: 'secondary',
    })
  }

  return actions.slice(0, 4)
}

function mapRoleToDirection(
  title: string,
  why: string,
  track: string,
  index: number,
  chips?: string[]
): CareerPathDirection {
  return {
    id: `cb_${track}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) || index}`,
    title,
    why: [why.replace(/\s*\(fallback\)\s*$/i, '').trim()],
    chips,
  }
}

function splitLegacyImproveLater(directions: UkCareerDirection[] | undefined): {
  buildNext: CareerPathDirection[]
  longTerm: CareerPathDirection[]
} {
  if (!directions?.length) return { buildNext: [], longTerm: [] }
  const buildNext: CareerPathDirection[] = []
  const longTerm: CareerPathDirection[] = []
  for (const d of directions) {
    const mapped = mapDirections([d])[0]
    if (d.direction_id.includes('long_term')) longTerm.push(mapped)
    else if (d.direction_id.includes('build_next')) buildNext.push(mapped)
    else buildNext.push(mapped)
  }
  return { buildNext, longTerm }
}

function triadFromCareerBrain(
  output: CareerBrainOutput,
  fallbackSummary?: string
): CareerPathTriad {
  const { workNow, buildNext, longTerm } = output.recommendedPaths
  const mapRoles = (
    roles: Array<{
      title: string
      why: string
      domain: string
      pathOrigin?: string
      confidence?: number
      stepType?: 'career_step' | 'training'
      recommendedTraining?: string[]
      expectedSalary?: string
      entryDifficulty?: 'Low' | 'Medium' | 'High'
    }>,
    track: string
  ) =>
    roles.map((r, i) => {
      const chips = [r.domain.replace(/_/g, ' ')]
      if (typeof r.confidence === 'number') chips.push(`Confidence: ${r.confidence}%`)
      if (r.stepType === 'training') chips.push('Training')
      if (r.expectedSalary) chips.push(`Salary: ${r.expectedSalary}`)
      if (r.entryDifficulty) chips.push(`Entry: ${r.entryDifficulty}`)
      if (r.pathOrigin === 'education') chips.push('Education')
      else if (r.pathOrigin === 'experience') chips.push('Experience')
      else if (r.pathOrigin === 'blended') chips.push('Blended')
      return {
        ...mapRoleToDirection(r.title, r.why, track, i, chips),
        recommendedTraining: r.recommendedTraining,
      }
    })

  return {
    workNow: mapRoles(workNow, 'work_now'),
    buildNext: mapRoles(buildNext, 'build_next'),
    longTerm: mapRoles(longTerm, 'long_term'),
    supportiveSummary: output.whyThisPath ?? output.personalizedSummary ?? fallbackSummary,
    ladderSummary: output.careerLadderSummary || undefined,
  }
}

export function buildPathTriadFromUkResult(
  result: UkCareerRuleResult & { career_brain?: CareerBrainOutput },
  supportiveSummary?: string
): CareerPathTriad {
  const brain = result.career_brain
  if (brain?.recommendedPaths?.workNow?.length || brain?.recommendedPaths?.buildNext?.length) {
    return triadFromCareerBrain(brain, supportiveSummary ?? result.summary)
  }

  if (brain?.growCareerGrowth?.promotionRoadmap) {
    const roadmap = brain.growCareerGrowth.promotionRoadmap
    const domain = brain.careerProfile.domain
    const mapTitle = (title: string, track: string, why: string) => ({
      id: `${track}-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      why: [why],
      chips: [domainLabel(domain)],
    })
    const workNowRoles = brain.recommendedPaths?.workNow?.length
      ? brain.recommendedPaths.workNow
      : [{ title: roadmap.workNow, why: brain.growCareerGrowth.currentPositionSummary }]
    const buildNextRoles = brain.recommendedPaths?.buildNext?.length
      ? brain.recommendedPaths.buildNext
      : [{ title: roadmap.buildNext, why: brain.growCareerGrowth.nextRealisticStep.reason }]
    const longTermRoles = brain.recommendedPaths?.longTerm?.length
      ? brain.recommendedPaths.longTerm
      : [{ title: roadmap.longTerm, why: brain.growCareerGrowth.longTermCareerDirection }]
    return {
      workNow: workNowRoles.slice(0, 3).map((r) => mapTitle(r.title, 'work-now', r.why)),
      buildNext: buildNextRoles.slice(0, 3).map((r) => mapTitle(r.title, 'build-next', r.why)),
      longTerm: longTermRoles.slice(0, 2).map((r) => mapTitle(r.title, 'long-term', r.why)),
      supportiveSummary:
        supportiveSummary ??
        brain.growCareerGrowth.finalReport?.careerReasoning ??
        brain.whyThisPath ??
        result.summary,
      ladderSummary: `${roadmap.workNow} → ${roadmap.buildNext} → ${roadmap.longTerm}`,
    }
  }

  const workNow = mapDirections(result.work_now?.directions)
  const legacy = splitLegacyImproveLater(result.improve_later?.directions)
  let { buildNext, longTerm } = legacy

  if (!longTerm.length && buildNext.length) {
    longTerm = buildNext.slice(0, 3).map((d) => ({
      ...d,
      id: `${d.id}-long`,
      why: ['Advanced career destination after experience, training, and UK work history.'],
    }))
  }

  const workLabel = workNow[0]?.title ?? 'entry-level roles'
  const buildLabel = buildNext[0]?.title ?? 'your longer-term direction'

  return {
    workNow,
    buildNext,
    longTerm,
    supportiveSummary:
      supportiveSummary ??
      (workNow.length
        ? `Based on your current situation, ${workLabel} and similar roles may be strong starting opportunities while you build toward ${buildLabel}.`
        : result.summary),
  }
}

function inferFromAnswers(answers: Record<string, unknown> | undefined): {
  situation: string
  workStyle: string
  confidence: string
  english: string
} {
  const a = answers ?? {}
  const situation =
    a.situation === 'need_job_quickly'
      ? 'Needs income soon — prioritising realistic quick-entry roles'
      : a.situation === 'no_uk_experience'
        ? 'New to the UK job market — building first local references'
        : a.experience === 'outside_uk'
          ? 'International experience — translating skills for UK employers'
          : a.stress_level === 'high' || a.burnout === 'yes'
            ? 'Managing pressure — steady, achievable steps recommended'
            : 'Actively shaping next career step in the UK'

  const workStyle =
    a.work_preference === 'flexible' || a.hours === 'flexible'
      ? 'Prefers flexible or shift-based work'
      : a.work_preference === 'office'
        ? 'Interested in structured workplace roles'
        : 'Open to practical hands-on roles'

  const confidence =
    a.confidence === 'low' || a.interview_confidence === 'low'
      ? 'Building confidence — small wins recommended'
      : a.confidence === 'high'
        ? 'Confident approaching applications'
        : 'Moderate confidence — practice will help'

  const english =
    a.english_level === 'basic' || a.language === 'basic'
      ? 'Basic — workplace English support recommended'
      : a.english_level === 'fluent' || a.language === 'fluent'
        ? 'Strong — ready for customer-facing roles'
        : 'Functional — improving for interviews and applications'

  return { situation, workStyle, confidence, english }
}

export function buildIntelligenceProfileFromUk(params: {
  result: UkCareerRuleResult
  answers?: Record<string, unknown>
  aiSummary?: string | null
  readinessScore?: number
}): CareerIntelligenceProfile {
  const { result, answers, aiSummary, readinessScore = 40 } = params
  const inferred = inferFromAnswers(answers)
  const pathTriad = buildPathTriadFromUkResult(result, aiSummary ?? undefined)

  const strengths: string[] = []
  if (pathTriad.workNow[0]?.why[0]) strengths.push(pathTriad.workNow[0].why[0])
  if (answers?.languages || answers?.multilingual) strengths.push('Multilingual background')
  if (answers?.experience === 'some' || answers?.experience === 'experienced') {
    strengths.push('Prior work experience to build on')
  }
  if (strengths.length === 0) strengths.push('Motivation to find a realistic UK path')

  const careerInterests = pathTriad.workNow.map((d) => d.title).slice(0, 4)
  const suggestedIndustries = [
    ...new Set(pathTriad.workNow.flatMap((d) => d.chips ?? []).filter(Boolean)),
  ].slice(0, 6)

  const transferableSkills = pathTriad.buildNext.flatMap((d) => d.chips ?? []).slice(0, 5)
  if (transferableSkills.length === 0) {
    transferableSkills.push('Reliability', 'Willingness to learn', 'Teamwork')
  }

  const recommendedFirstSteps: string[] = []
  if (typeof result.next_step === 'object' && result.next_step?.label) {
    recommendedFirstSteps.push(result.next_step.label)
  } else if (typeof result.next_step === 'string') {
    recommendedFirstSteps.push(result.next_step)
  }
  recommendedFirstSteps.push('Review Work Now options and pick one to explore this week')
  if (pathTriad.buildNext[0]) {
    recommendedFirstSteps.push(`Plan toward: ${pathTriad.buildNext[0].title} (3–6 months)`)
  }

  const sections: SmartProfileSection[] = [
    {
      id: 'situation',
      label: 'Current situation',
      value: inferred.situation,
      complete: true,
    },
    {
      id: 'english',
      label: 'English confidence',
      value: inferred.english,
      complete: inferred.english.includes('Strong'),
      improveHref: '/writing-review',
    },
    {
      id: 'cv',
      label: 'UK readiness',
      value: readinessScore >= 55 ? 'Growing profile — approaching job-ready' : 'Early-stage profile — CV and clarity first',
      complete: readinessScore >= 55,
      improveHref: '/cv-builder-v2',
    },
    {
      id: 'confidence',
      label: 'Confidence level',
      value: inferred.confidence,
      complete: !inferred.confidence.includes('Building'),
      improveHref: '/interview-coach',
    },
    {
      id: 'interests',
      label: 'Career interests',
      value: careerInterests.join(' · ') || 'Exploring options',
      complete: careerInterests.length > 0,
      improveHref: '/uk-career-assistant',
    },
    {
      id: 'workstyle',
      label: 'Work style',
      value: inferred.workStyle,
      complete: true,
    },
  ]

  return {
    generatedAt: new Date().toISOString(),
    currentSituation: inferred.situation,
    strengths,
    englishConfidence: inferred.english,
    careerInterests,
    transferableSkills,
    workStyle: inferred.workStyle,
    ukReadiness: readinessScore >= 55 ? 'Approaching job-ready' : 'Building foundation',
    confidenceLevel: inferred.confidence,
    suggestedIndustries: suggestedIndustries.length ? suggestedIndustries : careerInterests,
    recommendedFirstSteps: recommendedFirstSteps.slice(0, 5),
    sections,
    pathTriad,
    assessmentSummary: result.summary,
  }
}

export function buildJourneySnapshot(params: {
  signals: JourneySignalInput
  profile: CareerIntelligenceProfile | null
}): {
  state: CareerJourneyState
  stateLabel: string
  stateDescription: string
  nextActions: JourneyNextAction[]
} {
  const state = deriveCareerJourneyState(params.signals)
  return {
    state,
    stateLabel: JOURNEY_STATE_LABELS[state],
    stateDescription: JOURNEY_STATE_DESCRIPTIONS[state],
    nextActions: buildNextActions(state, params.signals),
  }
}
