import type {
  AssessmentAnswers,
  CareerAssessmentScores,
  CareerPathType,
} from '../../types'

export type { CareerPathType }

export type ToolCatalogKey =
  | 'jobFinder'
  | 'cvBuilder'
  | 'buildYourPath'
  | 'interviewCoach'
  | 'writingReview'
  | 'ukCareerAssistant'

export interface PathProfile {
  id: CareerPathType
  recommendedPath: string
  suggestedJobs: string[]
  toolKeys: ToolCatalogKey[]
  buildSummary: (answers: AssessmentAnswers, scores: CareerAssessmentScores) => string
  buildNextSteps: (answers: AssessmentAnswers, scores: CareerAssessmentScores) => string[]
}

export const PATH_PROFILES: Record<CareerPathType, PathProfile> = {
  quick_entry: {
    id: 'quick_entry',
    recommendedPath: 'Quick Entry UK Job Path',
    suggestedJobs: [
      'Warehouse Operative',
      'Kitchen Assistant',
      'Cleaner',
      'Delivery Helper',
    ],
    toolKeys: ['cvBuilder', 'jobFinder', 'writingReview'],
    buildSummary: (answers, scores) => {
      if (
        answers.situation === 'need_job_quickly' &&
        scores.englishScore < 40 &&
        answers.experience === 'none'
      ) {
        return 'Based on your answers, your fastest realistic path in the UK may be entry-level roles that do not require advanced English or UK experience. JobAZ recommends focusing first on a simple CV, communication confidence, and rapid applications.'
      }
      if (scores.cvReadinessScore < 35) {
        return 'You need income soon, and the good news is that many UK employers hire for reliability and availability before they expect a polished CV. A short, honest one-page CV and steady applications can open doors faster than waiting for everything to feel perfect.'
      }
      return 'Your situation points toward roles with straightforward hiring and clear day-one tasks. That is often the smartest way to start earning in the UK while you build local references and confidence.'
    },
    buildNextSteps: (answers, scores) => {
      const steps = [
        'Build a simple UK-style CV with contact details, availability, and 3–4 honest skill bullets.',
        'Apply to high-volume entry-level roles marked “immediate start” or “no experience”.',
        'Use Job Finder daily and save searches near your postcode.',
      ]
      if (scores.englishScore < 50) {
        steps.push('Improve spoken English confidence with 10 minutes of practice on common workplace phrases.')
      }
      steps.push('Practice interview basics: why you are reliable, available, and ready to learn.')
      return steps.slice(0, 5)
    },
  },

  uk_transition: {
    id: 'uk_transition',
    recommendedPath: 'UK Transition Path',
    suggestedJobs: [
      'Warehouse Operative',
      'Picker/Packer',
      'Production Operative',
      'Kitchen Porter',
    ],
    toolKeys: ['cvBuilder', 'jobFinder', 'writingReview', 'ukCareerAssistant'],
    buildSummary: (answers, scores) => {
      if (answers.experience === 'outside_uk') {
        return 'Your experience from abroad is valuable, but UK employers often need help seeing how it translates. Your biggest opportunity right now is presenting your skills in UK terms — clear dates, simple role titles, and proof that you are ready to start.'
      }
      if (answers.situation === 'no_uk_experience') {
        return 'Starting without UK references can feel discouraging, yet operational and hospitality sectors regularly hire people who are new to the local market. A focused CV and consistent applications matter more than a long UK work history at this stage.'
      }
      return 'You are building your UK career story from a strong foundation of transferable skills. Roles that value reliability, pace, and teamwork can give you local experience while you plan your next move.'
    },
    buildNextSteps: (answers) => {
      const steps = [
        'Rewrite your CV summary to bridge your previous work → UK-ready roles (use UK spelling and date formats).',
        'Highlight transferable skills: teamwork, safety awareness, reliability, and pace.',
        'Filter Job Finder for “immediate start”, agency roles, and employers that mention training.',
        'Register with 1–2 local agencies that hire warehouse or operations staff.',
        'Follow up politely 3–4 days after applying if you have not heard back.',
      ]
      if (answers.cv === 'no') {
        steps[0] = 'Create a one-page UK CV today — name, contact, right-to-work note if applicable, and your strongest transferable tasks.'
      }
      return steps
    },
  },

  career_upgrade: {
    id: 'career_upgrade',
    recommendedPath: 'Career Upgrade Path',
    suggestedJobs: [
      'Team Leader / Supervisor',
      'Senior Administrator',
      'Specialist Coordinator',
      'Customer Service Team Lead',
    ],
    toolKeys: ['cvBuilder', 'jobFinder', 'interviewCoach', 'ukCareerAssistant'],
    buildSummary: (answers, scores) => {
      if (scores.experienceScore >= 75) {
        return 'Your answers suggest that you already have useful experience, but your biggest opportunity may be improving how you present yourself to UK employers — clearer impact on your CV and more selective applications.'
      }
      return 'You are not starting from zero; you are ready to move into roles that better match your capability. Focus on quality applications, measurable achievements, and employers where your background clearly fits.'
    },
    buildNextSteps: () => [
      'Add 3 CV bullet points with numbers (volume handled, time saved, quality, sales, or team size).',
      'Target roles where your last job maps clearly to the employer’s needs — avoid 20 generic applications.',
      'Refresh your profile headline so it matches the level you are aiming for.',
      'Prepare two STAR stories about leadership, problem-solving, or going beyond expectations.',
      'Use Interview Coach before your next screening call.',
    ],
  },

  skills_development: {
    id: 'skills_development',
    recommendedPath: 'Skills Development Path',
    suggestedJobs: [
      'Trainee IT Support',
      'Junior Administrator',
      'Customer Service Advisor',
      'Apprentice / Trainee roles',
    ],
    toolKeys: ['buildYourPath', 'cvBuilder', 'ukCareerAssistant', 'jobFinder'],
    buildSummary: (answers) => {
      if (answers.helpNext === 'improve_skills') {
        return 'You are thinking long-term, which is smart. The fastest progress usually comes from pairing a realistic starter role with one focused skill — not from waiting until you feel “fully qualified”.'
      }
      return 'Your next chapter will grow faster if you combine learning with real UK exposure. Employers notice candidates who are already moving — even in a junior or trainee capacity.'
    },
    buildNextSteps: () => [
      'Pick one target sector and list 5 skills that appear repeatedly in UK job ads.',
      'Complete one short, free course aligned to that sector this week.',
      'Rewrite your CV summary to connect past experience → your new direction.',
      'Apply to 3 “junior”, “trainee”, or “entry” roles — not only senior titles.',
      'Explore Build Your Path for realistic UK routes into your target field.',
    ],
  },

  interview_preparation: {
    id: 'interview_preparation',
    recommendedPath: 'Interview Preparation Path',
    suggestedJobs: [
      'Customer Service Representative',
      'Reception / Front Desk',
      'Sales Support Assistant',
      'Retail Team Member',
    ],
    toolKeys: ['interviewCoach', 'cvBuilder', 'jobFinder', 'writingReview'],
    buildSummary: (answers, scores) => {
      if (scores.cvReadinessScore >= 60) {
        return 'You are closer to interviews than you might think — your CV foundation is there. What will make the difference now is structured practice, employer research, and calm, clear answers when opportunity appears.'
      }
      return 'Applications are only half the journey; interviews are where many strong candidates stumble. A little focused preparation can turn your existing experience into answers that UK employers trust.'
    },
    buildNextSteps: () => [
      'Draft three STAR stories: teamwork, reliability, and handling a difficult situation.',
      'Run one timed mock interview this week using Interview Coach.',
      'Research the top employers you have applied to and note their values in one line each.',
      'Prepare three thoughtful questions to ask the interviewer about the role.',
      'Confirm logistics the day before: time, location, dress code, and who you are meeting.',
    ],
  },

  career_change: {
    id: 'career_change',
    recommendedPath: 'Career Change Path',
    suggestedJobs: [
      'Junior Administrator',
      'Customer Service Advisor',
      'Trainee Coordinator',
      'Operations Support Assistant',
    ],
    toolKeys: ['ukCareerAssistant', 'buildYourPath', 'cvBuilder', 'interviewCoach'],
    buildSummary: (answers, scores) => {
      if (scores.confidenceScore < 45) {
        return 'Changing direction takes courage, especially when English or UK experience feels like a barrier. A bridge role — something accessible now — can fund your transition while you build credibility in a new field.'
      }
      return 'A career change in the UK works best as a story, not a leap. Employers respond when you show transferable strengths, a clear reason for the move, and evidence that you are already learning toward the new path.'
    },
    buildNextSteps: () => [
      'Write a three-sentence “career change story” for your CV summary and interviews.',
      'Identify 5 UK job ads in your target field and highlight repeated skills.',
      'Apply to bridge roles that use transferable skills while you upskill.',
      'Use UK Career Assistant to compare realistic routes before committing to one sector.',
      'Practise explaining your change in plain English — focus on motivation and fit, not excuses.',
    ],
  },
}

export interface PathProfileMatch {
  pathType: CareerPathType
  weight: number
}

/**
 * Scores each path profile against answers + derived scores.
 * Highest weight wins; ties favour earlier priority in PATH_PRIORITY.
 */
export function rankPathProfiles(
  answers: AssessmentAnswers,
  scores: CareerAssessmentScores
): PathProfileMatch[] {
  const matches: PathProfileMatch[] = []

  const quickEntryWeight =
    scores.urgencyScore * 0.35 +
    (100 - scores.englishScore) * 0.2 +
    (100 - scores.experienceScore) * 0.15 +
    (100 - scores.cvReadinessScore) * 0.2 +
    (answers.situation === 'need_job_quickly' ? 25 : 0) +
    (answers.situation === 'limited_english' ? 15 : 0)

  const ukTransitionWeight =
    (answers.situation === 'no_uk_experience' ? 40 : 0) +
    (answers.experience === 'outside_uk' ? 45 : 0) +
    scores.urgencyScore * 0.15 +
    (100 - scores.cvReadinessScore) * 0.1

  const careerUpgradeWeight =
    (answers.situation === 'better_job' ? 40 : 0) +
    scores.experienceScore * 0.35 +
    scores.cvReadinessScore * 0.15 +
    scores.confidenceScore * 0.2

  const skillsDevWeight =
    (answers.helpNext === 'improve_skills' ? 45 : 0) +
    (answers.situation === 'change_career' ? 20 : 0) +
    scores.directionScore * 0.25

  const interviewPrepWeight =
    (answers.helpNext === 'interviews' ? 50 : 0) +
    scores.cvReadinessScore * 0.2 +
    scores.directionScore * 0.15 +
    (answers.helpNext === 'find_jobs' && scores.cvReadinessScore >= 55 ? 20 : 0)

  const careerChangeWeight =
    (answers.situation === 'change_career' ? 50 : 0) +
    (answers.helpNext === 'understand_options' ? 25 : 0) +
    scores.directionScore * 0.15

  matches.push({ pathType: 'quick_entry', weight: quickEntryWeight })
  matches.push({ pathType: 'uk_transition', weight: ukTransitionWeight })
  matches.push({ pathType: 'career_upgrade', weight: careerUpgradeWeight })
  matches.push({ pathType: 'skills_development', weight: skillsDevWeight })
  matches.push({ pathType: 'interview_preparation', weight: interviewPrepWeight })
  matches.push({ pathType: 'career_change', weight: careerChangeWeight })

  const PATH_PRIORITY: CareerPathType[] = [
    'quick_entry',
    'uk_transition',
    'interview_preparation',
    'career_change',
    'skills_development',
    'career_upgrade',
  ]

  return matches.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight
    return PATH_PRIORITY.indexOf(a.pathType) - PATH_PRIORITY.indexOf(b.pathType)
  })
}

export function selectPathProfile(
  answers: AssessmentAnswers,
  scores: CareerAssessmentScores
): PathProfile {
  const ranked = rankPathProfiles(answers, scores)
  const winner = ranked[0]?.pathType ?? 'quick_entry'
  return PATH_PROFILES[winner]
}
