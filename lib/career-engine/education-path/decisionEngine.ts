import { careerHubPathHref } from '@/lib/career-hub/myPlan'
import { getSeedKnowledge } from './knowledge/seed'
import { resolveProfessionProfile, getLastRoadmapInsights } from './specialisationProfiles'
import { generateDynamicProfessionProfile } from './dynamic'
import { resolveSpecialisationLabel } from './educationSpecialisations'
import type {
  CourseEntry,
  CvImprovement,
  EducationFieldId,
  EducationFieldKnowledge,
  EducationPathAnswers,
  EducationPathResult,
  EnglishLevel,
  EssentialAction,
  JobEntry,
  QualificationLevel,
} from './types'
import {
  dedupeEssentialActions,
  dedupeCvImprovements,
  hasEssentialActionKey,
} from '@/lib/career-engine/shared/dedupeActions'

const SENIORITY_RANK: Record<NonNullable<JobEntry['seniority']>, number> = {
  graduate: 1,
  junior: 2,
  research: 3,
  mid: 4,
  senior: 5,
}

const MIN_RANK_BY_LEVEL: Record<QualificationLevel, number> = {
  bachelors: 1,
  masters: 2,
  phd: 3,
}

function jobFinderHref(keyword: string, location: string): string {
  const loc = location && location !== 'UK-wide' ? `&location=${encodeURIComponent(location)}` : ''
  return `/job-finder?query=${encodeURIComponent(keyword)}${loc}`
}

function courseHref(course: CourseEntry, knowledge: EducationFieldKnowledge): string {
  const pathId = course.pathId ?? knowledge.careerHubPathId
  return careerHubPathHref(pathId)
}

function normalizeKey(job: JobEntry): string {
  return job.searchKeyword.trim().toLowerCase()
}

function isJobAllowed(
  job: JobEntry,
  level: QualificationLevel,
  forbidden?: RegExp
): boolean {
  const text = `${job.title} ${job.searchKeyword}`.toLowerCase()
  if (forbidden?.test(text)) return false

  const minRank = MIN_RANK_BY_LEVEL[level]
  const jobRank = job.seniority ? SENIORITY_RANK[job.seniority] : 2
  return jobRank >= minRank
}

function dedupeJobs(jobs: JobEntry[]): JobEntry[] {
  const seen = new Set<string>()
  const out: JobEntry[] = []
  for (const job of jobs) {
    const key = normalizeKey(job)
    if (seen.has(key)) continue
    // Avoid near-duplicate titles (e.g. two "graduate engineer" variants)
    const titleStem = job.title.toLowerCase().replace(/graduate\s+/g, '').slice(0, 12)
    const stemKey = `stem:${titleStem}`
    if (seen.has(stemKey) && /graduate/i.test(job.title)) continue
    seen.add(key)
    seen.add(stemKey)
    out.push(job)
  }
  return out
}

function englishIsLow(level: EnglishLevel): boolean {
  return level === 'beginner' || level === 'basic'
}

function canUseBridgeRoles(answers: EducationPathAnswers): boolean {
  if (answers.qualification_level === 'phd') return false
  if (answers.qualification_level === 'masters' && answers.qualification_origin === 'uk' && !englishIsLow(answers.english_level)) {
    return false
  }
  return englishIsLow(answers.english_level) || answers.qualification_origin === 'outside_uk'
}

function pickJobs(knowledge: EducationFieldKnowledge, answers: EducationPathAnswers): JobEntry[] {
  const profile = resolveProfessionProfile(answers, knowledge)
  const level = answers.qualification_level
  const forbidden = profile?.forbiddenJobPatterns[level]

  let pool: JobEntry[] = []

  if (profile?.jobsByLevel[level]?.length) {
    pool = [...profile.jobsByLevel[level]]
  } else {
    const seniorities = level === 'bachelors' ? ['graduate', 'junior'] : level === 'masters' ? ['junior', 'mid'] : ['research', 'senior', 'mid']
    pool = [...knowledge.graduateJobs, ...knowledge.typicalJobs].filter(
      (j) => !j.seniority || seniorities.includes(j.seniority)
    )
  }

  pool = pool.filter((j) => isJobAllowed(j, level, forbidden))

  if (canUseBridgeRoles(answers) && pool.length < 4) {
    const bridge = [...knowledge.temporaryEntryRoles, ...knowledge.transferableRoles]
      .filter((j) => isJobAllowed(j, level, forbidden))
    pool.push(...bridge)
  }

  return dedupeJobs(pool).slice(0, 4)
}

function buildEssentialActions(
  knowledge: EducationFieldKnowledge,
  answers: EducationPathAnswers
): EssentialAction[] {
  const profile = resolveProfessionProfile(answers, knowledge)
  const actions: EssentialAction[] = [...(profile?.essentialActions ?? knowledge.professionalRegistration)]

  if (answers.qualification_origin === 'outside_uk' && knowledge.qualificationRecognition.requiredForOutsideUk) {
    if (!hasEssentialActionKey(actions, 'uk_qualification_recognition')) {
      actions.unshift({
        id: 'qual_recognition',
        title: 'UK Qualification Recognition',
        description: knowledge.qualificationRecognition.summary,
        href: 'https://www.enic.org.uk/',
        priority: 'critical',
      })
    }
  }

  if (englishIsLow(answers.english_level)) {
    if (!hasEssentialActionKey(actions, 'improve_english')) {
      actions.push({
        id: 'improve_english',
        title: 'Improve English',
        description: `${knowledge.label} roles with client or team communication require stronger English for interviews.`,
        href: careerHubPathHref(knowledge.careerHubPathId),
        priority: 'critical',
      })
    }
  }

  return dedupeEssentialActions(actions).slice(0, 6)
}

function buildCourses(
  knowledge: EducationFieldKnowledge,
  answers: EducationPathAnswers
): CourseEntry[] {
  if (answers.open_to_courses !== 'yes') return []

  const profile = resolveProfessionProfile(answers, knowledge)
  const level = answers.qualification_level

  let courses: CourseEntry[] = profile?.coursesByLevel[level]?.length
    ? [...profile.coursesByLevel[level]]
    : [...knowledge.recommendedCourses, ...knowledge.professionalCertifications]

  // PhD: never surface entry-level beginner courses from generic seed
  if (level === 'phd') {
    courses = courses.filter(
      (c) => !/care certificate|food hygiene|level 2|entry/i.test(c.title)
    )
  }

  if (englishIsLow(answers.english_level) && knowledge.id !== 'education') {
    const hasEsol = courses.some((c) => /english|esol/i.test(c.title))
    if (!hasEsol) {
      courses.push({
        id: 'esol',
        title: 'English for Work (ESOL)',
        whyReasons: [
          'Improves interview confidence in UK workplaces.',
          `Required before most ${knowledge.label.toLowerCase()} client-facing roles.`,
        ],
        duration: '6–12 weeks',
        costLabel: 'Free',
        pathId: knowledge.careerHubPathId,
      })
    }
  }

  return courses.slice(0, 4)
}

function buildCvImprovements(
  knowledge: EducationFieldKnowledge,
  answers: EducationPathAnswers
): CvImprovement[] {
  const profile = resolveProfessionProfile(answers, knowledge)
  const items: CvImprovement[] = profile
    ? [...profile.cvImprovements]
    : [
        {
          id: `${knowledge.id}_cv`,
          title: `${knowledge.label} CV`,
          description: `UK-format CV highlighting your ${knowledge.label.toLowerCase()} degree and relevant skills: ${knowledge.essentialSkills.slice(0, 3).join(', ')}.`,
          href: '/cv-builder-v2',
          priority: 1,
        },
      ]

  if (answers.qualification_level === 'phd' && profile?.cvImprovementsPhd?.length) {
    for (const extra of profile.cvImprovementsPhd) {
      if (!items.some((i) => i.id === extra.id)) items.unshift(extra)
    }
  }

  if (answers.qualification_origin === 'outside_uk') {
    items.push({
      id: 'uk_enic',
      title: 'UK ENIC Statement on CV',
      description: `Add your UK ENIC evaluation so ${knowledge.label.toLowerCase()} employers understand your overseas qualification level.`,
      href: 'https://www.enic.org.uk/',
      priority: 90,
    })
  }

  return dedupeCvImprovements(items.sort((a, b) => a.priority - b.priority)).slice(0, 5)
}

function injectLocation(href: string, location: string): string {
  if (!href.includes('/job-finder') || href.includes('location=')) return href
  const sep = href.includes('?') ? '&' : '?'
  const loc = location && location !== 'UK-wide' ? `${sep}location=${encodeURIComponent(location)}` : ''
  return `${href}${loc}`
}

function buildMissions(
  knowledge: EducationFieldKnowledge,
  answers: EducationPathAnswers,
  jobs: JobEntry[],
  courses: CourseEntry[]
): EducationPathResult['missions'] {
  const profile = resolveProfessionProfile(answers, knowledge)
  const location = answers.preferred_location || 'UK-wide'
  const level = answers.qualification_level

  if (profile?.missionsByLevel[level]?.length) {
    return profile.missionsByLevel[level].map((m) => ({
      ...m,
      href: injectLocation(m.href, location),
    }))
  }

  const topJob = jobs[0]
  const topCourse = courses[0]
  return [
    { id: 'cv', label: `Build ${knowledge.label} CV`, href: '/cv-builder-v2', target: 1 },
    {
      id: 'apply',
      label: 'Apply to 5 Jobs',
      href: topJob ? jobFinderHref(topJob.searchKeyword, location) : jobFinderHref(knowledge.label, location),
      target: 5,
    },
    {
      id: 'save',
      label: 'Save 3 Jobs',
      href: topJob ? jobFinderHref(topJob.searchKeyword, location) : jobFinderHref(knowledge.label, location),
      target: 3,
    },
    {
      id: 'training',
      label: topCourse ? `Start ${topCourse.title}` : `Explore ${knowledge.label} Training`,
      href: topCourse ? courseHref(topCourse, knowledge) : careerHubPathHref(knowledge.careerHubPathId),
      target: 1,
    },
  ]
}

function getTimeline(
  knowledge: EducationFieldKnowledge,
  answers: EducationPathAnswers,
  level: QualificationLevel
): string[] {
  const profile = resolveProfessionProfile(answers, knowledge)
  if (profile?.timelineByLevel[level]?.length) return profile.timelineByLevel[level]
  return knowledge.careerProgression
}

function formatGoal(role: string): string {
  const trimmed = role.trim()
  if (trimmed.startsWith('BUILD:')) {
    return `Build a ${trimmed.slice(6).trim()} in the UK`
  }
  if (/^Become a |^Build a /i.test(trimmed)) {
    return / in the UK$/i.test(trimmed) ? trimmed : `${trimmed} in the UK`
  }
  if (/ in the UK$/i.test(trimmed)) {
    return `Become a ${trimmed}`
  }
  return `Become a ${trimmed} in the UK`
}

function getGoal(
  knowledge: EducationFieldKnowledge,
  answers: EducationPathAnswers,
  level: QualificationLevel
): string {
  const profile = resolveProfessionProfile(answers, knowledge)
  const role = profile?.goalByLevel[level] ?? knowledge.goalRole
  return formatGoal(role)
}

function englishScore(level: EnglishLevel): number {
  const map: Record<EnglishLevel, number> = {
    beginner: 25,
    basic: 40,
    intermediate: 60,
    good: 80,
    fluent: 95,
  }
  return map[level]
}

function interviewReadiness(level: EnglishLevel): EducationPathResult['careerReadiness']['interviewReadiness'] {
  if (englishIsLow(level)) return 'low'
  if (level === 'intermediate') return 'medium'
  return 'high'
}

function computeReadiness(
  answers: EducationPathAnswers,
  actions: EssentialAction[],
  knowledge: EducationFieldKnowledge
): EducationPathResult['careerReadiness'] {
  const missing: string[] = []
  const addMissing = (label: string) => {
    if (!missing.includes(label)) missing.push(label)
  }

  if (
    answers.qualification_origin === 'outside_uk' &&
    knowledge.qualificationRecognition.requiredForOutsideUk &&
    !hasEssentialActionKey(actions, 'uk_qualification_recognition')
  ) {
    addMissing('UK Qualification Recognition')
  }
  if (englishIsLow(answers.english_level)) {
    addMissing('English Level')
  } else if (answers.english_level === 'intermediate') {
    addMissing('Interview English confidence')
  }

  const missingByActionId: Record<string, string> = {
    engc: 'Professional Membership',
    imeche: 'Professional Membership',
    ice: 'Professional Membership',
    acca: 'Professional Body (ACCA)',
    cima: 'Professional Body (CIMA)',
    icaew: 'Professional Body (ICAEW)',
    qts: 'QTS Registration',
    dbs: 'Enhanced DBS',
    trn: 'Teacher Reference Number (TRN)',
    nmc: 'Professional Registration',
    hcpc: 'HCPC Registration',
    research_profile: 'Research Profile',
    github: 'GitHub Portfolio',
    portfolio: 'Project Portfolio',
    cloud_cert: 'Cloud Certification',
    graduate_scheme: 'Graduate Scheme Applications',
  }

  for (const action of actions.filter((a) => a.priority === 'critical')) {
    const label = missingByActionId[action.id] ?? action.title
    if (action.id !== 'qual_recognition' && action.id !== 'improve_english') {
      addMissing(label)
    }
  }

  if (answers.open_to_courses === 'no' && resolveProfessionProfile(answers, knowledge)) {
    addMissing('Professional development courses')
  }

  let score = 38
  score += englishScore(answers.english_level) * 0.28
  if (answers.qualification_origin === 'uk') {
    score += 14
  } else {
    score -= 10
  }
  if (answers.open_to_courses === 'yes') score += 6
  if (answers.qualification_level === 'masters') score += 4
  if (answers.qualification_level === 'phd') score += 6
  score -= missing.length * 5

  if (englishIsLow(answers.english_level)) {
    score = Math.min(score, 44)
  }
  if (answers.qualification_origin === 'outside_uk' && englishIsLow(answers.english_level)) {
    score = Math.min(score, 36)
  }
  if (
    answers.qualification_origin === 'uk' &&
    (answers.english_level === 'good' || answers.english_level === 'fluent') &&
    missing.length <= 2
  ) {
    score = Math.max(score, 58)
  }

  score = Math.max(15, Math.min(88, Math.round(score)))

  const specLabel = resolveSpecialisationLabel(
    answers.education_field,
    answers.education_specialisation,
    answers.education_specialisation_other
  )

  const summary =
    missing.length === 0
      ? `Strong ${specLabel} readiness — prioritise applications and profession-specific actions.`
      : missing.length <= 2
        ? `Good potential — address the gaps below to unlock more ${specLabel} roles in the UK.`
        : `Build foundations first — your ${specLabel} background needs these steps before higher-level roles.`

  return {
    score,
    interviewReadiness: interviewReadiness(answers.english_level),
    summary,
    missing: missing.slice(0, 5),
  }
}

export function buildEducationPathResult(
  answers: EducationPathAnswers,
  knowledge?: EducationFieldKnowledge
): EducationPathResult {
  const kb = knowledge ?? getSeedKnowledge(answers.education_field as EducationFieldId)
  const location = answers.preferred_location || 'UK-wide'
  const specialisationLabel = resolveSpecialisationLabel(
    answers.education_field,
    answers.education_specialisation,
    answers.education_specialisation_other
  )

  // Prime profile resolution (hand-authored full profiles or dynamic generator)
  resolveProfessionProfile(answers, kb)
  if (!getLastRoadmapInsights()) {
    generateDynamicProfessionProfile(answers, kb)
  }

  const jobs = pickJobs(kb, answers)
  const essentialActions = buildEssentialActions(kb, answers)
  const courses = buildCourses(kb, answers)
  const careerInsights = getLastRoadmapInsights() ?? undefined

  return {
    pathId: 'work_in_education',
    field: kb.id,
    fieldLabel: kb.label,
    specialisation: answers.education_specialisation,
    specialisationLabel,
    answers,
    goal: getGoal(kb, answers, answers.qualification_level),
    workNow: jobs.map((j) => ({
      ...j,
      href: jobFinderHref(j.searchKeyword, location),
    })),
    essentialActions,
    recommendedCourses: courses.map((c) => ({
      ...c,
      href: courseHref(c, kb),
    })),
    cvImprovements: buildCvImprovements(kb, answers),
    careerTimeline: getTimeline(kb, answers, answers.qualification_level),
    missions: buildMissions(kb, answers, jobs, courses),
    careerReadiness: computeReadiness(answers, essentialActions, kb),
    careerInsights,
    location,
  }
}

export function loadKnowledgeForField(fieldId: EducationFieldId): EducationFieldKnowledge {
  return getSeedKnowledge(fieldId)
}
