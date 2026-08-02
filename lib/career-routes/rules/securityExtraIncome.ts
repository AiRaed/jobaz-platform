import type { CareerRouteStageRule, TrainingMentionStatus } from '../types'
import { incompleteTrainingPhrase, trainedClaim } from '../trust'

/** Fully implemented model route — Security extra income. */
export const securityExtraIncomeRoute: CareerRouteStageRule = {
  route_id: 'security_extra_income',
  route_title: 'Security extra income',
  user_goal: 'extra_income',
  implementation: 'full',
  matchRoute: (routeTitle, currentTarget) => {
    const blob = `${routeTitle} ${currentTarget ?? ''}`.toLowerCase()
    return /security/.test(blob) || /matchday|steward|door\s*supervisor|event\s*security/.test(blob)
  },
  work_now_roles: ['Matchday Steward', 'Event Steward', 'Delivery Driver', 'Uber Eats / Deliveroo Rider'],
  training_upgrades: [
    { title: 'SIA Door Supervisor', match: /sia\s*door|door\s*supervisor/i, primary: true },
  ],
  after_training_roles: ['Door Supervisor', 'Security Guard', 'Event Security', 'Security Officer'],
  optional_addons: ['First Aid at Work', 'CCTV Licence (SIA)'],
  recommended_courses: [
    { title: 'SIA Door Supervisor Course', match: /sia\s*door|door\s*supervisor/i, affiliateExpected: true },
    { title: 'First Aid at Work', match: /first\s*aid/i, affiliateExpected: false },
    { title: 'CCTV Licence (SIA)', match: /cctv/i, affiliateExpected: false },
  ],
  cv_stages: {
    work_now: {
      id: 'work_now',
      buttonLabel: 'Work Now CV',
      stageLabel: 'CV stage: Work Now',
      targetRole: 'Matchday Steward',
      jobSearchTerms: ['Matchday Steward', 'Event Steward'],
      primaryJobQuery: 'Matchday Steward',
    },
    after_training: {
      id: 'after_training',
      buttonLabel: 'After SIA CV',
      stageLabel: 'CV stage: After SIA',
      targetRole: 'Door Supervisor',
      jobSearchTerms: ['Door Supervisor', 'Security Officer', 'Event Security'],
      primaryJobQuery: 'Door Supervisor',
      requiresCompletedUpgrade: true,
      warning:
        'Use this version only if you have completed or hold the SIA Door Supervisor qualification.',
    },
    general: {
      id: 'general',
      buttonLabel: 'General CV',
      stageLabel: 'CV stage: General Security',
      targetRole: 'Security / Events',
      jobSearchTerms: ['Event Security', 'Security Steward'],
      primaryJobQuery: 'Event Security',
    },
  },
  summary_templates: [
    {
      id: 'work_now',
      buttonLabel: 'Write Work Now Summary',
      helperText: 'For Matchday Steward / Event Steward roles before SIA.',
      buildSummary: ({ trainingStatus, primaryTrainingTitle }) => {
        const trainingBit = incompleteTrainingPhrase(primaryTrainingTitle, trainingStatus)
        return `Reliable and motivated candidate looking for Matchday Steward and event support roles in the UK. Strong focus on punctuality, communication, customer service and following instructions in busy public environments. Available for flexible shifts and ready to build experience in events and security while ${trainingBit}.`
      },
    },
    {
      id: 'after_training',
      buttonLabel: 'Write After Training Summary',
      helperText: 'For Door Supervisor / Security Officer roles after you complete SIA.',
      requiresCompletedUpgrade: true,
      warning:
        'Use this version only if you have completed or hold the SIA Door Supervisor qualification.',
      buildSummary: ({ trainingStatus, primaryTrainingTitle }) => {
        const trained = trainedClaim(primaryTrainingTitle, trainingStatus)
        if (trained) {
          return `${trained} candidate seeking door supervisor, event security and security officer roles in the UK. Brings a strong focus on safety, customer service, conflict awareness, professionalism and reliability. Ready to work in licensed venues, events and public-facing security environments.`
        }
        return `Motivated candidate preparing for door supervisor, event security and security officer roles in the UK. Focuses on safety, customer service, conflict awareness, professionalism and reliability in licensed venues, events and public-facing security environments.`
      },
    },
    {
      id: 'general',
      buttonLabel: 'Write General Security Summary',
      helperText: 'For flexible security and event support roles.',
      buildSummary: ({ trainingStatus, primaryTrainingTitle }) => {
        const trained = trainedClaim(primaryTrainingTitle, trainingStatus)
        if (trained) {
          return `Practical and reliable ${trained} candidate interested in security, events and public-facing roles. Offers good communication, calm attitude, flexibility and a professional approach. Looking to build a long-term path in the UK security sector through stewarding experience, licensed security work and strong CV readiness.`
        }
        return `Practical and reliable candidate interested in security, events and public-facing roles. Offers good communication, calm attitude, flexibility and willingness to learn. Looking to build a long-term path in the UK security sector through stewarding experience, relevant training and improved CV readiness.`
      },
    },
  ],
  skills: [
    'Customer service',
    'Communication',
    'Reliability',
    'Timekeeping',
    'Teamwork',
    'Following instructions',
    'Public safety awareness',
    'Conflict awareness',
    'Crowd awareness',
    'Flexible availability',
  ],
  experience_bullets: [
    'Supported customers or members of the public in busy environments.',
    'Stayed calm and professional while dealing with people face to face.',
    'Followed instructions, procedures and safety expectations during shifts.',
    'Worked reliably across flexible hours, evenings or weekends.',
    'Communicated clearly with colleagues, customers and supervisors.',
  ],
  qualifications: [
    { label: 'SIA Door Supervisor', mode: 'completed_only', match: /sia\s*door|door\s*supervisor/i },
    {
      label: 'SIA Door Supervisor training in progress',
      mode: 'in_progress_ok',
      match: /sia\s*door|door\s*supervisor/i,
    },
    { label: 'First Aid at Work', mode: 'completed_only', match: /first\s*aid/i },
    { label: 'CCTV Licence (SIA)', mode: 'completed_only', match: /cctv/i },
  ],
  weekly_plan_steps: ({ workNowRole, primaryTrainingTitle, optionalAddon }) =>
    [
      'Improve simple security/events CV',
      `Compare/book a ${primaryTrainingTitle} course`,
      `Apply to 3 ${workNowRole} roles`,
      'Save 2 security/event jobs',
      optionalAddon ? `Optional: Compare ${optionalAddon}` : null,
    ].filter(Boolean) as string[],
  trust_rules: {
    neverClaimCompletedUnlessConfirmed: true,
    incompletePhrases: ['working_towards', 'interested_in', 'planning_to_complete', 'building_experience'],
  },
  analytics: {
    route_id: 'security_extra_income',
    route_key: 'security_extra_income',
  },
}

/** @deprecated Prefer primaryTrainingTitle from resolve */
export function securityPrimaryTrainingMatch(): RegExp {
  return /sia\s*door|door\s*supervisor/i
}

export type { TrainingMentionStatus }
