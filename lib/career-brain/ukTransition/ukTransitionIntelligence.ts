/**

 * New to the UK — business-first final report.

 */



import type { CareerBrainState, CareerProfile } from '../types'

import { classifyUkTransitionProfile } from './ukTransitionClassification'

import {

  buildBarriers,

  buildBusinessPotential,

  buildCertifications,

  buildCourses,

  buildFastestRoute,

  buildLongTermPath,

  buildNextActions,

  buildQualificationPath,

  buildRecommendedJobs,

  buildTransitionSummary,

  buildWhatYouBring,

  buildWhyRecommended,

} from './ukTransitionOpportunities'

import {

  buildBestNextAction,

  buildTargetRole,

  buildUkPathSteps,

} from './ukTransitionPathSteps'

import { buildUkTransitionUnderstanding, isUkTransitionQuestioningComplete } from './ukTransitionUnderstanding'

import type {

  UkTransitionFinalReport,

  UkTransitionGrowthOutput,

  UkTransitionJobAZAction,

} from './ukTransitionTypes'



function buildJobAZActions(u: ReturnType<typeof buildUkTransitionUnderstanding>): UkTransitionJobAZAction[] {

  const actions: UkTransitionJobAZAction[] = [

    {

      action: 'create_profile',

      label: 'Create your JobAZ profile',

      why: 'Save this path and track courses, applications, and next steps in one place.',

      href: '/signup',

    },

    {

      action: 'build_cv',

      label: 'Build UK-format CV',

      why: 'Show UK employers what you bring — especially international experience and skills.',

    },

  ]



  if (u.profileType === 'degree') {

    actions.push({

      action: 'qualification_recognition',

      label: 'Qualification recognition guide',

      why: 'Understand ENIC/NARIC and professional body steps without confusing immigration advice.',

    })

  }



  if (u.routeId && u.routeId.startsWith('entry_')) {

    actions.push({

      action: 'courses',

      label: 'Short courses & licences',

      why: 'Browse fast certifications that match your recommended route.',

    })

  }



  if (u.profileType === 'business' || u.mainGoal === 'start_business') {

    actions.push({

      action: 'career_paths',

      label: 'Explore business & freelance paths',

      why: 'See practical routes for self-employment and small business in the UK.',

    })

  }



  actions.push({

    action: 'cv_review',

    label: 'CV review',

    why: 'Make sure your experience reads clearly to UK recruiters.',

  })



  actions.push({

    action: 'jobs',

    label: 'Job opportunities',

    why: `Roles aligned with ${u.routeLabel ?? 'your recommended route'}.`,

  })



  return actions.slice(0, 5)

}



export function buildUkTransitionFinalReport(state: CareerBrainState): UkTransitionFinalReport {

  const u = buildUkTransitionUnderstanding(state)

  const classified = classifyUkTransitionProfile(u)

  const ukPathSteps = buildUkPathSteps(u)

  const targetRole = buildTargetRole(u)

  const bestNextAction = buildBestNextAction(u, ukPathSteps)

  const whatYouBring = buildWhatYouBring(u)



  return {

    transitionSummary: buildTransitionSummary(u),

    whyRecommended: buildWhyRecommended(u),

    recommendedRouteLabel: u.routeLabel ?? classified.routeLabel,

    whatYouBring,

    currentBarriers: buildBarriers(u),

    ukPathSteps,

    targetRole,

    bestNextAction,

    recommendedCertifications: buildCertifications(u),

    recommendedCourses: buildCourses(u),

    recommendedJobs: buildRecommendedJobs(u),

    categoryLabel: classified.label,

    categoryExplanation: classified.explanation,

    pathLetter: classified.pathLetter,

    confidenceScore: u.confidence,

    transferableSkills: whatYouBring,

    fastestRouteIntoWork: buildFastestRoute(u),

    longTermCareerPath: buildLongTermPath(u),

    qualificationRecognitionPath: buildQualificationPath(u),

    businessPotential: buildBusinessPotential(u),

    recommendedNextActions: buildNextActions(u),

  }

}



export function buildUkTransitionGrowthOutput(state: CareerBrainState): UkTransitionGrowthOutput {

  const report = buildUkTransitionFinalReport(state)

  const summary = `${report.recommendedRouteLabel}. ${report.bestNextAction}`



  return {

    summary,

    confidence: report.confidenceScore,

    finalReport: report,

    recommendedJobAZActions: buildJobAZActions(buildUkTransitionUnderstanding(state)),

  }

}



export function buildUkTransitionIntelligence(

  profile: CareerProfile,

  state: CareerBrainState

): { growth: UkTransitionGrowthOutput; reasoning: string[] } | null {

  void profile

  if (!isUkTransitionQuestioningComplete(state)) return null



  const growth = buildUkTransitionGrowthOutput(state)

  return {

    growth,

    reasoning: [

      `${growth.finalReport.recommendedRouteLabel} (${growth.finalReport.pathLetter})`,

      growth.finalReport.whyRecommended,

    ],

  }

}



export function formatUkTransitionWhyThisPath(report: UkTransitionFinalReport): string {

  return [

    report.transitionSummary,

    '',

    'WHY THIS PATH',

    report.whyRecommended,

    '',

    'YOUR NEXT STEPS',

    ...report.ukPathSteps.map((s) => `Step ${s.step}: ${s.title} — ${s.description}`),

  ].join('\n')

}



export function mergeUkTransitionIntoOutput(

  output: import('../types').CareerBrainOutput,

  intelligence: NonNullable<ReturnType<typeof buildUkTransitionIntelligence>>

): import('../types').CareerBrainOutput {

  const { growth } = intelligence

  const report = growth.finalReport



  return {

    ...output,

    recommendedPaths: { workNow: [], buildNext: [], longTerm: [], backupIncome: [] },

    whyThisPath: formatUkTransitionWhyThisPath(report),

    personalizedSummary: growth.summary,

    careerLadderSummary: `${report.recommendedRouteLabel} — ${report.targetRole}`,

    employabilityScore: 0,

    pathConfidence: [],

    ukTransitionGrowth: growth,

    recommendedCourses: report.recommendedCourses,

    notRecommended: [],

    reasoning: [...output.reasoning, ...intelligence.reasoning],

    nextJobAZActions: growth.recommendedJobAZActions,

    practicalNextSteps: growth.recommendedJobAZActions,

    jobSearchKeywords: report.recommendedJobs.map((j) => j.title),

    missingSkills: report.recommendedCertifications.slice(0, 3),

    mainBarriers: report.currentBarriers.slice(0, 3),

  }

}


