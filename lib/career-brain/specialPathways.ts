/**
 * Self-employed, small business, and new-to-UK pathway overlays.
 */

import type { CareerBrainState, CareerPathRole, CareerProfile, SpecialPathwayPlan } from './types'
import { isNewToUkUser } from './rightToWork'
import { getEntrySituation } from './entryClassification'

export function detectSpecialPathway(state?: CareerBrainState): SpecialPathwayPlan['type'] | null {
  const situation = getEntrySituation(state ?? { answers: {} })
  if (situation === 'self_employed') return 'self_employed'
  if (situation === 'small_business') return 'small_business'
  if (state && isNewToUkUser(state)) return 'new_to_uk'
  return null
}

export function buildSpecialPathwayPlan(
  profile: CareerProfile,
  workNow: CareerPathRole[],
  buildNext: CareerPathRole[],
  longTerm: CareerPathRole[],
  state?: CareerBrainState
): SpecialPathwayPlan | null {
  const type = detectSpecialPathway(state)
  if (!type) return null

  if (type === 'self_employed') {
    return {
      type,
      headline: 'Self-employed / Freelancer pathway',
      workNowLabel: 'Immediate income actions',
      buildNextLabel: 'Growth plan',
      longTermLabel: 'Long-term business roadmap',
      workNowActions: [
        'Invoice outstanding work and chase payments this week',
        'List 3 services you can sell immediately on Gumtree, Facebook, or local networks',
        'Register for Self Assessment if not already registered with HMRC',
        ...(workNow.slice(0, 2).map((r) => `Bridge income via ${r.title} while building clients`)),
      ],
      buildNextActions: [
        'Build a simple portfolio or service page',
        'Set up a business bank account and basic bookkeeping',
        ...buildNext.slice(0, 2).map((r) => r.title),
      ],
      longTermActions: [
        'Move from gig work to repeat clients and contracts',
        'Consider VAT registration and hiring support as revenue grows',
        ...longTerm.slice(0, 2).map((r) => `Professional direction: ${r.title}`),
      ],
    }
  }

  if (type === 'small_business') {
    return {
      type,
      headline: 'Small business owner pathway',
      workNowLabel: 'Survival actions',
      buildNextLabel: 'Growth actions',
      longTermLabel: 'Scale actions',
      workNowActions: [
        'Review cash flow and cut non-essential costs this month',
        'Contact existing customers for repeat orders or referrals',
        'Ensure HMRC/tax and any licences are up to date',
      ],
      buildNextActions: [
        'Improve local marketing — Google Business Profile, social posts, flyers',
        'Document your best-selling offer and standard pricing',
        ...buildNext.slice(0, 2).map((r) => r.title),
      ],
      longTermActions: [
        'Hire part-time help or outsource admin as revenue allows',
        'Explore new customer channels and partnerships',
        ...longTerm.slice(0, 2).map((r) => `Leadership direction: ${r.title}`),
      ],
    }
  }

  const intl = profile.constraints.includes('uk-transition') || profile.constraints.includes('international-experience')
  return {
    type: 'new_to_uk',
    headline: 'New to the UK pathway',
    workNowLabel: 'Work Now',
    buildNextLabel: intl ? 'Build UK transition' : 'Build UK foundations',
    longTermLabel: 'Long-Term UK Career Path',
    workNowActions: workNow.slice(0, 4).map((r) => r.title),
    buildNextActions: intl
      ? [
          'UK-ready CV — UK format, clear dates, and transferable skills up front',
          'Check qualification recognition (NARIC / regulated professions) where relevant',
          'Understand UK workplace expectations — references, right to work, and interview style',
          'Target bridging roles for your first UK experience',
          ...buildNext.slice(0, 2).map((r) => r.title),
        ]
      : [
          'UK job search basics — CV, cover letter, and common entry-level platforms',
          'Entry-level roles and volunteering to build local references',
          'Local support programmes — Jobcentre Plus, councils, and migrant/community groups',
          ...buildNext.slice(0, 2).map((r) => r.title),
        ],
    longTermActions: longTerm.slice(0, 4).map((r) => r.title),
    notes: [
      intl
        ? 'International experience and qualifications are valuable — UK employers still want local references and clear workplace English.'
        : 'Focus on entry-level UK work, training where you are open to it, and building local work history.',
      profile.englishLevel === 'basic' || profile.englishLevel === 'intermediate'
        ? 'Improving workplace English will unlock more roles over 6–18 months.'
        : 'Your English level supports broader career options as UK experience grows.',
    ],
  }
}
