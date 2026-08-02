/**
 * JAZ Side Income — evidence-gated opportunity catalogue (UK).
 */

import type { SideIncomeOpportunity, SideIncomeUnderstanding } from './sideIncomeTypes'

type OppCandidate = Omit<SideIncomeOpportunity, 'confidence'> & {
  supported: boolean
  evidence: string
}

function scheduleOk(u: SideIncomeUnderstanding, ...allowed: string[]): boolean {
  if (!u.schedule) return false
  return allowed.includes(u.schedule) || u.schedule === 'flexible'
}

function hoursOk(u: SideIncomeUnderstanding, min: '5_10' | '10_20' = '5_10'): boolean {
  if (!u.hoursPerWeek) return false
  const order = ['under_5', '5_10', '10_20', '20_plus']
  return order.indexOf(u.hoursPerWeek) >= order.indexOf(min)
}

function peopleOk(u: SideIncomeUnderstanding): boolean {
  const p = u.workStyle.peopleVsIndependent
  return p === 'people' || p === 'mix'
}

function avoidPeople(u: SideIncomeUnderstanding): boolean {
  return u.workStyle.peopleVsIndependent === 'avoid_people'
}

function deskPreferred(u: SideIncomeUnderstanding): boolean {
  const w = u.workStyle.physicalVsDesk
  return w === 'desk' || w === 'avoid_physical'
}

function physicalOk(u: SideIncomeUnderstanding): boolean {
  const w = u.workStyle.physicalVsDesk
  return w === 'physical' || w === 'light_physical'
}

function homeOk(u: SideIncomeUnderstanding): boolean {
  const loc = u.workStyle.homeVsOutside
  return loc === 'home' || loc === 'mix' || u.schedule === 'online_anytime'
}

export function evaluateSideIncomeOpportunities(u: SideIncomeUnderstanding): OppCandidate[] {
  const out: OppCandidate[] = []

  const drivingGig =
    u.hasCar &&
    u.hasDrivingLicence &&
    scheduleOk(u, 'evenings', 'weekends', 'flexible', 'weekdays_day') &&
    !deskPreferred(u)
  out.push({
    id: 'private_hire',
    title: 'Private hire / airport transfers (evenings & weekends)',
    why: drivingGig
      ? `You reported a car, driving licence, and ${u.schedule?.replace(/_/g, ' ')} availability — realistic for flexible driving income in the UK.`
      : '',
    incomeRange: '£12–£20/hour typical (before costs)',
    category: 'flexible',
    supported: drivingGig,
    evidence: drivingGig ? 'car + licence + schedule' : 'missing car, licence, or suitable hours',
  })

  const delivery =
    (u.hasCar || u.assets.includes('smartphone')) &&
    scheduleOk(u, 'evenings', 'weekends', 'flexible') &&
    (physicalOk(u) || u.skills.includes('driving'))
  out.push({
    id: 'delivery_courier',
    title: 'Delivery / courier work (apps or local contracts)',
    why: delivery
      ? `You have ${u.hasCar ? 'a vehicle' : 'a smartphone for gig apps'} and ${u.schedule?.replace(/_/g, ' ')} availability.`
      : '',
    incomeRange: '£10–£16/hour typical (variable)',
    category: 'fastest',
    supported: delivery,
    evidence: delivery ? 'transport + flexible schedule' : 'no vehicle/phone or unsuitable schedule',
  })

  const uber = drivingGig && peopleOk(u) && !avoidPeople(u)
  out.push({
    id: 'uber_rideshare',
    title: 'Uber / rideshare driving',
    why: uber
      ? `Car, licence, and people-facing comfort align with rideshare platforms in UK cities.`
      : '',
    incomeRange: '£12–£18/hour net typical (highly variable)',
    category: 'fastest',
    supported: uber,
    evidence: uber ? 'car + licence + people comfort' : 'not supported by your answers',
  })

  const freelanceDesign =
    u.hasComputer &&
    u.hasHomeWorkspace &&
    homeOk(u) &&
    (u.skills.includes('design') || u.skills.includes('tech') || u.skills.includes('writing')) &&
    hoursOk(u, '5_10')
  out.push({
    id: 'freelance_services',
    title: 'Freelance design / web / writing services',
    why: freelanceDesign
      ? `You reported ${u.skills.filter((s) => ['design', 'tech', 'writing'].includes(s)).join(', ')} skills, a computer, and home workspace.`
      : '',
    incomeRange: '£15–£45/hour depending on skill and client',
    category: 'highest_potential',
    supported: freelanceDesign,
    evidence: freelanceDesign ? 'skills + computer + home workspace' : 'missing specialist skills or setup',
  })

  const contentCreation =
    freelanceDesign &&
    (u.skills.includes('design') || u.skills.includes('writing')) &&
    u.riskTolerance !== 'low' &&
    u.incomeTimeline !== 'this_week'
  out.push({
    id: 'content_creation',
    title: 'Content creation (social/video for brands)',
    why: contentCreation
      ? `Creative skills and home setup support content work — best when you can wait 1–3 months for traction.`
      : '',
    incomeRange: '£0–£500/month early; higher with clients',
    category: 'highest_potential',
    supported: contentCreation,
    evidence: contentCreation ? 'creative skills + patience' : 'needs creative skills and longer timeline',
  })

  const tutoring =
    u.teachingExperience &&
    peopleOk(u) &&
    !avoidPeople(u) &&
    (homeOk(u) || scheduleOk(u, 'evenings', 'weekends', 'online_anytime'))
  out.push({
    id: 'tutoring',
    title: 'Private tutoring / online education support',
    why: tutoring
      ? `You reported teaching/tutoring background and comfort working with people ${homeOk(u) ? 'from home' : 'on evenings/weekends'}.`
      : '',
    incomeRange: '£20–£40/hour for private tutoring (UK average)',
    category: 'highest_potential',
    supported: tutoring,
    evidence: tutoring ? 'teaching experience + people comfort' : 'no teaching background or people preference mismatch',
  })

  const security =
    physicalOk(u) &&
    scheduleOk(u, 'evenings', 'weekends', 'flexible') &&
    !deskPreferred(u) &&
    u.riskTolerance !== 'high'
  out.push({
    id: 'security_sia',
    title: 'Security work (SIA licence required)',
    why: security
      ? `Evening/weekend availability and comfort with physical on-site work suit licensed security roles after SIA training.`
      : '',
    incomeRange: '£11–£14/hour after SIA licence',
    category: 'fastest',
    supported: security,
    evidence: security ? 'physical + evening availability' : 'prefers desk or lacks suitable hours',
  })

  const retailHosp =
    peopleOk(u) &&
    !avoidPeople(u) &&
    scheduleOk(u, 'evenings', 'weekends', 'flexible') &&
    (u.skills.includes('customer_service') || u.skills.includes('none_specialist'))
  out.push({
    id: 'retail_hospitality_pt',
    title: 'Part-time retail / hospitality shifts',
    why: retailHosp
      ? `Customer service comfort and ${u.schedule?.replace(/_/g, ' ')} availability fit UK part-time shift work.`
      : '',
    incomeRange: '£10.42–£12/hour (UK NMW+) plus tips in hospitality',
    category: 'fastest',
    supported: retailHosp,
    evidence: retailHosp ? 'people skills + shift availability' : 'not aligned with preferences',
  })

  const careWeekend =
    (u.skills.includes('care') || /care|nurse|support/i.test(u.mainField ?? '')) &&
    scheduleOk(u, 'weekends', 'evenings', 'flexible') &&
    peopleOk(u)
  out.push({
    id: 'care_weekend',
    title: 'Weekend care / support work',
    why: careWeekend
      ? `Care background and weekend availability align with bank/casual care roles in the UK.`
      : '',
    incomeRange: '£11–£14/hour typical',
    category: 'flexible',
    supported: careWeekend,
    evidence: careWeekend ? 'care skills + weekend hours' : 'no care background',
  })

  const reselling =
    u.hasCapital &&
    u.hasComputer &&
    (u.riskTolerance === 'medium' || u.riskTolerance === 'high') &&
    u.incomeTimeline !== 'this_week'
  out.push({
    id: 'reselling_ecommerce',
    title: 'Reselling / small e-commerce',
    why: reselling
      ? `You reported capital to invest and comfort with medium risk — viable for resale or niche e-commerce, not instant income.`
      : '',
    incomeRange: 'Highly variable — £100–£1,000+/month after learning',
    category: 'highest_potential',
    supported: reselling,
    evidence: reselling ? 'capital + risk tolerance' : 'no capital or needs immediate income',
  })

  const consulting =
    Boolean(u.professionalField) &&
    hoursOk(u, '5_10') &&
    (u.riskTolerance === 'medium' || u.riskTolerance === 'high') &&
    u.incomeTimeline !== 'this_week'
  out.push({
    id: 'consulting',
    title: 'Freelance consulting in your professional field',
    why: consulting
      ? `You specified "${u.professionalField}" as a billable service with enough weekly hours for client work.`
      : '',
    incomeRange: '£30–£80+/hour depending on field',
    category: 'highest_potential',
    supported: consulting,
    evidence: consulting ? 'professional service + hours' : 'no clear professional service stated',
  })

  const adminRemote =
    u.hasComputer &&
    homeOk(u) &&
    (u.skills.includes('admin') || u.skills.includes('writing')) &&
    deskPreferred(u) &&
    hoursOk(u, '5_10')
  out.push({
    id: 'remote_admin',
    title: 'Remote admin / virtual assistant work',
    why: adminRemote
      ? `Admin skills, computer, and preference for desk-based home work support VA and data-entry side roles.`
      : '',
    incomeRange: '£10–£18/hour for VA roles',
    category: 'flexible',
    supported: adminRemote,
    evidence: adminRemote ? 'admin + home computer' : 'missing admin skills or home setup',
  })

  return out
}

export function rankOpportunities(u: SideIncomeUnderstanding): SideIncomeOpportunity[] {
  const evaluated = evaluateSideIncomeOpportunities(u).filter((o) => o.supported)
  const conf = (o: OppCandidate): 'High' | 'Moderate' | 'Lower' => {
    if (u.confidence >= 80 && o.evidence.split('+').length >= 2) return 'High'
    if (u.confidence >= 65) return 'Moderate'
    return 'Lower'
  }
  return evaluated.map((o) => ({
    id: o.id,
    title: o.title,
    why: o.why,
    incomeRange: o.incomeRange,
    category: o.category,
    confidence: conf(o),
  }))
}

export function pickBestByCategory(
  opportunities: SideIncomeOpportunity[],
  category: SideIncomeOpportunity['category']
): SideIncomeOpportunity | null {
  const pool = opportunities.filter((o) => o.category === category)
  if (!pool.length) return null
  const order = { High: 3, Moderate: 2, Lower: 1 }
  pool.sort((a, b) => order[b.confidence] - order[a.confidence])
  return pool[0]!
}
