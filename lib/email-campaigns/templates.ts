import type { AudienceRules, CampaignType } from './types'

const SITE = 'https://jobaz.co.uk'
const FOOTER = `
---
You are receiving this because you opted in to JobAZ career updates or saved a career plan with email reminders enabled.

Manage email preferences: ${SITE}/email-preferences
Unsubscribe: ${SITE}/email-preferences?unsubscribe=1

JobAZ — UK career platform
Contact: support@jobaz.co.uk
`.trim()

export function buildCampaignDraft(
  type: CampaignType,
  rules: AudienceRules = {}
): { subject: string; body: string } {
  const route = rules.target_route?.trim() || 'your career route'
  const role = rules.target_role?.trim() || 'your target role'
  const location = rules.location?.trim() || 'your area'
  const source = rules.source_title?.trim() || ''

  switch (type) {
    case 'plan_reminder':
      return {
        subject: 'Your JobAZ career plan is still waiting',
        body: [
          'Hi,',
          '',
          'Your JobAZ career plan is ready when you are.',
          `A short next step on ${route} can keep your momentum going — open My Plan and continue where you left off.`,
          '',
          `Continue your plan: ${SITE}/dashboard`,
          '',
          'No pressure — just a practical reminder.',
          '',
          FOOTER,
        ].join('\n'),
      }
    case 'course_alert':
      return {
        subject: 'A course that may fit your career plan',
        body: [
          'Hi,',
          '',
          source
            ? `We listed a training option that may relate to ${route}: “${source}”.`
            : `We found a training option that may relate to ${route}.`,
          'This is a suggestion based on your JobAZ plan signals — not a guarantee of a job or outcome.',
          '',
          `View course: ${SITE}/career-hub`,
          '',
          FOOTER,
        ].join('\n'),
      }
    case 'job_alert':
      return {
        subject: 'New jobs that may match your JobAZ profile',
        body: [
          'Hi,',
          '',
          `Here are new roles that may relate to ${role}${location ? ` in ${location}` : ''}.`,
          'Use them as a starting point — JobAZ does not guarantee interviews or offers.',
          '',
          `View jobs: ${SITE}/job-finder`,
          '',
          FOOTER,
        ].join('\n'),
      }
    case 'local_opportunity_alert':
      return {
        subject: 'New local work opportunity near you',
        body: [
          'Hi,',
          '',
          source
            ? `A local work opportunity was listed that may suit flexible / short-term work near ${location}: “${source}”.`
            : `A local work opportunity near ${location} may suit flexible or short-term work.`,
          'Always check details carefully before arranging anything.',
          '',
          `View opportunity: ${SITE}/opportunities`,
          '',
          FOOTER,
        ].join('\n'),
      }
    case 'career_tip':
      return {
        subject: 'One simple step for your career plan this week',
        body: [
          'Hi,',
          '',
          `This week, take one small step on ${route} — update your CV target role, or browse one relevant course.`,
          'Small consistent actions beat big vague goals.',
          '',
          `Open JobAZ: ${SITE}`,
          '',
          FOOTER,
        ].join('\n'),
      }
    case 'product_update':
    default:
      return {
        subject: 'A quick update from JobAZ',
        body: [
          'Hi,',
          '',
          rules.user_intent?.trim() ||
            'We have a short update about JobAZ tools that may help your UK career journey.',
          '',
          `Open JobAZ: ${SITE}`,
          '',
          FOOTER,
        ].join('\n'),
      }
  }
}
