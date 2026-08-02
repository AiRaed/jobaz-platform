/**
 * JAZ Business Advisor — idea-driven dynamic question generation.
 * Questions are composed from the user's business idea, not a fixed questionnaire.
 */

import type { CareerBrainQuestion } from '../types'
import type { BusinessDirection, BusinessDiscoveryUnderstanding } from './businessDiscoveryTypes'
import { inferBusinessDirection } from './businessDiscoveryUnderstanding'

export type IdeaFacet =
  | 'experience'
  | 'clients'
  | 'equipment'
  | 'start_model'
  | 'regulatory'
  | 'technical'
  | 'product'
  | 'marketing'
  | 'audience'
  | 'team'
  | 'kitchen'
  | 'menu'
  | 'food_safety'
  | 'validation'

export type IdeaProfile = {
  idea: string
  tradeLabel: string
  direction: BusinessDirection
  facets: IdeaFacet[]
  isCafe: boolean
  isSaas: boolean
  needsPremises: boolean
  isService: boolean
  isRegulated: boolean
}

const DYN_PREFIX = 'biz_dyn_'

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false
): CareerBrainQuestion {
  return { id, text, type: multi ? 'multi' : 'single', options, allow_free_text: false }
}

function dynId(facet: IdeaFacet): string {
  return `${DYN_PREFIX}${facet}`
}

function answered(u: BusinessDiscoveryUnderstanding, facet: IdeaFacet): boolean {
  const id = dynId(facet)
  if (u.askedIds.includes(id) || u.specialized[id]) return true
  if (facet === 'experience' && u.experienceLevel) return true
  if (
    facet === 'clients' &&
    (u.hasNetwork === 'yes_customers' ||
      u.specialized.biz_barber_customers ||
      u.specialized.biz_cleaning_clients)
  ) {
    return true
  }
  if (facet === 'validation' && u.specialized.biz_demand_evidence) return true
  if (facet === 'equipment' && (u.specialized.biz_barber_equipment || u.specialized.biz_cleaning_transport || u.assets.length > 0)) {
    return true
  }
  if (
    facet === 'start_model' &&
    (u.specialized.biz_barber_model ||
      u.specialized.biz_barber_premises ||
      u.specialized.biz_food_premises ||
      u.specialized.biz_software_model)
  ) {
    return true
  }
  if (facet === 'regulatory' && (u.specialized.biz_food_licences || u.specialized.biz_dyn_regulatory)) return true
  // Map legacy bank answers to dynamic facets so we do not re-ask
  const legacyMap: Partial<Record<IdeaFacet, string[]>> = {
    experience: ['biz_experience_level', 'biz_barber_experience', 'biz_food_chef_experience'],
    clients: ['biz_barber_customers', 'biz_cleaning_clients', 'biz_network'],
    equipment: ['biz_barber_equipment', 'biz_cleaning_transport'],
    start_model: ['biz_barber_model', 'biz_food_premises', 'biz_software_model'],
    regulatory: ['biz_food_licences', 'biz_food_licences'],
    technical: ['biz_saas_technical'],
    product: ['biz_saas_mvp', 'biz_ecommerce_product'],
    marketing: ['biz_software_clients'],
    audience: ['biz_saas_validation', 'biz_ecommerce_validation'],
    team: ['biz_cleaning_team'],
    kitchen: ['biz_food_premises'],
    menu: ['biz_food_chef_experience'],
    food_safety: ['biz_food_licences'],
    validation: ['biz_demand_evidence'],
  }
  return (legacyMap[facet] ?? []).some((key) => Boolean(u.specialized[key]) || u.askedIds.includes(key))
}

function tradeLabelFromIdea(idea: string, direction: BusinessDirection): string {
  const lower = idea.toLowerCase()
  if (/barber|barbershop/.test(lower)) return 'barbering'
  if (/café|cafe|coffee/.test(lower)) return 'running a café'
  if (/clean/.test(lower)) return 'cleaning'
  if (/saas|software|app/.test(lower)) return 'this software business'
  if (/tutor/.test(lower)) return 'tutoring'
  if (/restaurant|food|catering/.test(lower)) return 'food service'
  if (direction === 'general') return 'this line of work'
  return idea.length > 40 ? `${idea.slice(0, 40)}…` : idea
}

export function analyzeBusinessIdea(idea: string | null, field: string | null): IdeaProfile | null {
  if (!idea && !field) return null
  const text = (idea ?? field ?? '').trim()
  if (!text) return null

  const lower = text.toLowerCase()
  const direction = inferBusinessDirection(idea, field)
  const isCafe = /café|cafe|coffee shop|coffee house|espresso bar/.test(lower)
  const isSaas = /saas|software|app|platform|b2b tool/.test(lower)
  const needsPremises = /shop|store|salon|restaurant|café|cafe|premises|barber shop/.test(lower)
  const isService =
    /barber|clean|tutor|consult|coach|groom|repair|care|delivery|driver|trade|plumb|electric/.test(lower) ||
    ['barber', 'cleaning', 'tutoring', 'consultancy', 'care', 'driver', 'trades'].includes(direction)
  const isRegulated =
    /food|cafe|café|restaurant|catering|childcare|care|taxi|phv|barber|beauty/.test(lower) ||
    ['food', 'care', 'barber', 'driver'].includes(direction)

  const facets: IdeaFacet[] = ['experience', 'clients', 'validation']

  if (isService || direction !== 'software') facets.push('equipment')
  if (needsPremises || isCafe) facets.push('start_model')
  if (isRegulated) facets.push('regulatory')
  if (isSaas || direction === 'software') {
    facets.push('technical', 'product', 'marketing', 'audience')
  }
  if (/clean|agency|team|staff/.test(lower) || direction === 'cleaning') facets.push('team')
  if (isCafe) facets.push('kitchen', 'menu', 'food_safety')
  if (direction === 'ecommerce' || /sell|shop|resell|product/.test(lower)) {
    facets.push('product', 'marketing', 'audience')
  }

  return {
    idea: text,
    tradeLabel: tradeLabelFromIdea(text, direction),
    direction,
    facets: [...new Set(facets)],
    isCafe,
    isSaas,
    needsPremises,
    isService,
    isRegulated,
  }
}

function buildQuestion(profile: IdeaProfile, facet: IdeaFacet): CareerBrainQuestion {
  const { idea, tradeLabel, isCafe } = profile
  const intro = `For your "${idea}" idea:`

  switch (facet) {
    case 'experience':
      return q(
        dynId('experience'),
        `${intro} how much relevant industry experience do you have?`,
        [
          { value: 'none', label: 'None — new to this industry' },
          { value: 'some', label: 'Some — informal or hobby experience' },
          { value: '1_3_years', label: '1–3 years paid experience' },
          { value: '3_plus_years', label: '3+ years solid experience' },
          { value: 'expert', label: 'Expert / senior professional' },
        ]
      )
    case 'clients':
      return q(
        dynId('clients'),
        `${intro} do you already have paying customers or firm enquiries?`,
        [
          { value: 'regular', label: 'Yes — regular paying clients' },
          { value: 'occasional', label: 'Some occasional paid work' },
          { value: 'enquiries', label: 'Enquiries but no paid jobs yet' },
          { value: 'friends_family', label: 'Friends and family only' },
          { value: 'none', label: 'None yet' },
        ]
      )
    case 'equipment':
      return q(
        dynId('equipment'),
        `${intro} what equipment or tools do you already have for ${tradeLabel}?`,
        [
          { value: 'full', label: 'Everything needed to start' },
          { value: 'partial', label: 'Some equipment — gaps remain' },
          { value: 'none', label: 'Need to acquire equipment' },
        ]
      )
    case 'start_model':
      if (profile.direction === 'barber' || /barber/.test(idea.toLowerCase())) {
        return q(dynId('start_model'), `${intro} how would you realistically start?`, [
          { value: 'chair_rental', label: 'Rent a chair in an existing shop' },
          { value: 'mobile', label: 'Mobile service' },
          { value: 'home_based', label: 'Home-based (where legal)' },
          { value: 'own_shop', label: 'Own shop premises' },
          { value: 'unsure', label: 'Not sure yet' },
        ])
      }
      if (isCafe) {
        return q(dynId('start_model'), `${intro} what is your realistic starting setup?`, [
          { value: 'home_catering', label: 'Home catering / pop-up drinks first' },
          { value: 'pop_up', label: 'Pop-up / market stall' },
          { value: 'takeaway', label: 'Takeaway unit' },
          { value: 'full_cafe', label: 'Full café premises' },
          { value: 'unsure', label: 'Not sure yet' },
        ])
      }
      return q(dynId('start_model'), `${intro} what is the smallest realistic way to start?`, [
        { value: 'mobile', label: 'Mobile / no premises first' },
        { value: 'home_based', label: 'Home-based or online first' },
        { value: 'shared', label: 'Shared / rented space' },
        { value: 'own_premises', label: 'Own premises immediately' },
        { value: 'unsure', label: 'Not sure yet' },
      ])
    case 'regulatory':
      return q(
        dynId('regulatory'),
        `${intro} how prepared are you for UK regulatory requirements?`,
        [
          { value: 'ready', label: 'Researched registrations, insurance, and licences' },
          { value: 'some', label: 'Some research done' },
          { value: 'little', label: 'Little research so far' },
        ]
      )
    case 'technical':
      return q(dynId('technical'), `${intro} can you build the product yourself?`, [
        { value: 'yes_full', label: 'Yes — I can build the full MVP' },
        { value: 'partial', label: 'Partially — need help with some parts' },
        { value: 'no', label: 'No — need a technical co-founder or contractor' },
      ])
    case 'product':
      return q(dynId('product'), `${intro} what is the status of your product or offer?`, [
        { value: 'live', label: 'Live product or service already' },
        { value: 'mvp_ready', label: 'MVP built or nearly ready' },
        { value: 'building', label: 'Still building' },
        { value: 'idea_only', label: 'Idea stage only' },
      ])
    case 'marketing':
      return q(dynId('marketing'), `${intro} how will you reach your first paying customers?`, [
        { value: 'existing_network', label: 'Existing contacts or referrals' },
        { value: 'outbound', label: 'LinkedIn / outreach / platforms' },
        { value: 'content', label: 'Content / social / community' },
        { value: 'no_plan', label: 'No clear plan yet' },
      ])
    case 'audience':
      return q(dynId('audience'), `${intro} do you have an audience or validated demand?`, [
        { value: 'paying', label: 'Paying users or signed pilots' },
        { value: 'waitlist', label: 'Waitlist or strong enquiries' },
        { value: 'interviews', label: 'Customer interviews only' },
        { value: 'none', label: 'Not validated yet' },
      ])
    case 'team':
      return q(dynId('team'), `${intro} how will you deliver the work initially?`, [
        { value: 'solo', label: 'Solo — I do all work myself' },
        { value: 'partner', label: 'With one partner' },
        { value: 'hire_later', label: 'Start solo, hire later' },
        { value: 'team_ready', label: 'Small team already available' },
      ])
    case 'kitchen':
      return q(dynId('kitchen'), `${intro} do you have access to a suitable kitchen?`, [
        { value: 'commercial', label: 'Yes — commercial or registered kitchen' },
        { value: 'home', label: 'Home kitchen (council registration possible)' },
        { value: 'need', label: 'Need to find kitchen access' },
        { value: 'unsure', label: 'Not sure yet' },
      ])
    case 'menu':
      return q(dynId('menu'), `${intro} how ready is your menu or product range?`, [
        { value: 'tested', label: 'Tested with customers — recipes finalised' },
        { value: 'draft', label: 'Draft menu — needs testing' },
        { value: 'ideas', label: 'Ideas only — not tested' },
      ])
    case 'food_safety':
      return q(dynId('food_safety'), `${intro} what is your food safety knowledge?`, [
        { value: 'certified', label: 'Food hygiene certificate held' },
        { value: 'trained', label: 'Trained but not certified' },
        { value: 'basic', label: 'Basic awareness only' },
        { value: 'none', label: 'Need to learn UK requirements' },
      ])
    case 'validation':
      return q(dynId('validation'), `${intro} what evidence shows customers want this?`, [
        { value: 'paying_already', label: 'Already have paying customers' },
        { value: 'preorders', label: 'Pre-orders or strong enquiries' },
        { value: 'research', label: 'Market research only' },
        { value: 'assumption', label: 'Assumption — not validated yet' },
      ])
    default:
      return q(dynId('validation'), `${intro} what evidence shows customers want this?`, [
        { value: 'research', label: 'Market research only' },
        { value: 'assumption', label: 'Assumption — not validated yet' },
      ])
  }
}

const FACET_PRIORITY: Record<IdeaFacet, number> = {
  experience: 99,
  clients: 98,
  equipment: 97,
  start_model: 96,
  kitchen: 95,
  menu: 94,
  food_safety: 93,
  technical: 92,
  product: 91,
  marketing: 90,
  audience: 89,
  team: 88,
  regulatory: 87,
  validation: 86,
}

export function getOpenIdeaFacets(u: BusinessDiscoveryUnderstanding): IdeaFacet[] {
  const profile = analyzeBusinessIdea(u.businessIdea, u.industryField)
  if (!profile) return []
  return profile.facets.filter((f) => !answered(u, f))
}

export function pickNextDynamicBusinessQuestion(
  u: BusinessDiscoveryUnderstanding
): { question: CareerBrainQuestion; facet: IdeaFacet; reason: string } | null {
  if (!u.businessIdea && !u.industryField) return null
  if (u.intent !== 'has_idea' && u.intent !== 'already_running' && u.intent !== 'no_idea') return null

  const profile = analyzeBusinessIdea(u.businessIdea, u.industryField)
  if (!profile) return null

  const open = getOpenIdeaFacets(u)
  if (!open.length) return null

  open.sort((a, b) => FACET_PRIORITY[b] - FACET_PRIORITY[a])
  const facet = open[0]!
  return {
    question: buildQuestion(profile, facet),
    facet,
    reason: `JAZ Business Advisor — need ${facet.replace(/_/g, ' ')} evidence for "${profile.idea}"`,
  }
}

export function countAnsweredIdeaFacets(u: BusinessDiscoveryUnderstanding): number {
  const profile = analyzeBusinessIdea(u.businessIdea, u.industryField)
  if (!profile) return 0
  return profile.facets.filter((f) => answered(u, f)).length
}

export function isIdeaEvidenceComplete(u: BusinessDiscoveryUnderstanding): boolean {
  const profile = analyzeBusinessIdea(u.businessIdea, u.industryField)
  if (!profile) return false
  const required = profile.facets.filter((f) => f !== 'validation' || u.intent === 'has_idea')
  const answeredCount = required.filter((f) => answered(u, f)).length
  const minRequired = Math.min(required.length, Math.max(4, required.length - 1))
  return answeredCount >= minRequired
}
