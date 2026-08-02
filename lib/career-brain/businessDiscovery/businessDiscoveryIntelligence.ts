/**
 * JAZ Business Discovery — UK startup advisor final report.
 */

import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from '../types'
import { buildBusinessDiscoveryUnderstanding } from './businessDiscoveryUnderstanding'
import {
  selectBusinessRecommendations,
  ukRequirementsForModel,
} from './businessDiscoveryOpportunities'
import { analyzeBusinessIdea } from './businessDiscoveryDynamicQuestions'
import type {
  BusinessDiscoveryFinalReport,
  BusinessDiscoveryGrowthOutput,
  BusinessDiscoveryUnderstanding,
  BusinessRoadmap,
  BusinessRiskAnalysis,
  BusinessRiskItem,
  BusinessRiskLevel,
  BusinessScoreBreakdownItem,
  BusinessVerdict,
  BusinessWeekPlan,
  StartupDifficulty,
} from './businessDiscoveryTypes'

function expLabel(level: string | null): string {
  const map: Record<string, string> = {
    none: 'No experience',
    some: 'Some experience',
    '1_3_years': '1–3 years experience',
    '3_plus_years': '3+ years experience',
    expert: 'Expert-level experience',
  }
  return level ? map[level] ?? level : 'Experience'
}

function dynVal(u: BusinessDiscoveryUnderstanding, facet: string): string {
  return String(u.specialized[`biz_dyn_${facet}`] ?? '')
}

function demandWeak(u: BusinessDiscoveryUnderstanding): boolean {
  return (
    u.specialized.biz_demand_evidence === 'assumption' ||
    dynVal(u, 'validation') === 'assumption' ||
    dynVal(u, 'audience') === 'none' ||
    u.specialized.biz_saas_validation === 'none' ||
    u.specialized.biz_ecommerce_validation === 'none'
  )
}

function hasPayingCustomers(u: BusinessDiscoveryUnderstanding): boolean {
  const dynClients = dynVal(u, 'clients')
  return (
    u.hasNetwork === 'yes_customers' ||
    dynClients === 'regular' ||
    dynClients === 'occasional' ||
    u.specialized.biz_barber_customers === 'regular' ||
    u.specialized.biz_barber_customers === 'occasional' ||
    u.specialized.biz_cleaning_clients === 'regular' ||
    u.specialized.biz_cleaning_clients === 'some' ||
    u.assets.includes('paying_clients') ||
    u.assets.includes('existing_customers') ||
    u.assets.includes('existing_users') ||
    u.assets.includes('existing_students') ||
    u.assets.includes('sales')
  )
}

function operationalReadinessScore(u: BusinessDiscoveryUnderstanding): number {
  let pts = 0
  const equip = dynVal(u, 'equipment') || String(u.specialized.biz_barber_equipment ?? '')
  if (equip === 'full' || equip === 'yes') pts += 8
  else if (equip === 'partial') pts += 4
  if (dynVal(u, 'product') === 'live' || dynVal(u, 'product') === 'mvp_ready') pts += 5
  if (dynVal(u, 'team') === 'solo' || dynVal(u, 'team') === 'partner') pts += 3
  if (u.timePerWeek === 'full_time' || u.timePerWeek === '20_40') pts += 4
  return Math.min(15, pts)
}

function regulatoryReadinessScore(u: BusinessDiscoveryUnderstanding): number {
  const reg = dynVal(u, 'regulatory') || String(u.specialized.biz_food_licences ?? '')
  const food = dynVal(u, 'food_safety')
  if (reg === 'ready' || food === 'certified') return 12
  if (reg === 'some' || food === 'trained') return 6
  if (reg === 'little' || food === 'basic') return 0
  const profile = analyzeBusinessIdea(u.businessIdea, u.industryField)
  return profile?.isRegulated ? -5 : 3
}

function assetScore(u: BusinessDiscoveryUnderstanding): number {
  if (!u.assets.length || u.assets.includes('none_yet')) return 0
  const count = u.assets.filter((a) => a !== 'none_yet').length
  return Math.min(15, count * 3)
}

function computeBusinessPotentialScore(u: BusinessDiscoveryUnderstanding): {
  score: number
  breakdown: BusinessScoreBreakdownItem[]
} {
  const breakdown: BusinessScoreBreakdownItem[] = []

  const expMap: Record<string, number> = {
    none: 0,
    some: 10,
    '1_3_years': 15,
    '3_plus_years': 18,
    expert: 20,
  }
  const expPts = expMap[u.experienceLevel ?? ''] ?? 5
  breakdown.push({ label: 'Industry experience', points: expPts })

  const capMap: Record<string, number> = {
    none: 0,
    under_1k: 5,
    '1k_5k': 10,
    '5k_20k': 13,
    '20k_plus': 15,
  }
  breakdown.push({ label: 'Capital available', points: capMap[u.capital ?? ''] ?? 3 })

  const timeMap: Record<string, number> = {
    under_10: 5,
    '10_20': 10,
    '20_40': 13,
    full_time: 15,
  }
  breakdown.push({ label: 'Time commitment', points: timeMap[u.timePerWeek ?? ''] ?? 5 })

  breakdown.push({ label: 'Existing assets', points: assetScore(u) })
  breakdown.push({ label: 'Operational readiness', points: operationalReadinessScore(u) })
  breakdown.push({ label: 'Regulatory readiness', points: regulatoryReadinessScore(u) })

  let customerPts = 0
  if (hasPayingCustomers(u)) customerPts = 10
  else if (u.hasNetwork === 'yes_network' || u.assets.includes('industry_contacts')) customerPts = 3
  else if (u.hasNetwork === 'limited') customerPts = 0
  else customerPts = -10
  breakdown.push({ label: 'Customer access', points: customerPts })

  let networkPts = 0
  if (u.hasNetwork === 'yes_network' || u.assets.includes('industry_contacts')) networkPts = 8
  else if (u.hasNetwork === 'limited') networkPts = 2
  else if (u.hasNetwork === 'none') networkPts = -5
  breakdown.push({ label: 'Network', points: networkPts })

  let riskPts = 0
  if (demandWeak(u)) riskPts -= 8
  if (u.riskTolerance === 'low' && (u.capital === 'none' || u.capital === 'under_1k')) riskPts -= 5
  if (u.experienceLevel === 'none') riskPts -= 5
  if (u.specialized.biz_competition_awareness === 'little') riskPts -= 3
  breakdown.push({ label: 'Risk profile', points: riskPts })

  const raw = breakdown.reduce((sum, item) => sum + item.points, 0)
  const score = Math.max(15, Math.min(100, 40 + raw))
  return { score, breakdown }
}

function inferLongTermGoal(u: BusinessDiscoveryUnderstanding): string {
  const idea = u.businessIdea ?? u.industryField ?? 'Your business'
  if (u.direction === 'barber') {
    const model = String(
      u.specialized.biz_barber_model ?? u.specialized.biz_barber_premises ?? dynVal(u, 'start_model') ?? ''
    )
    if (model === 'own_shop' || /shop/i.test(idea)) return 'Own Barber Shop'
    if (/barber/i.test(idea)) return 'Own Barber Shop'
    return `Own ${idea}`
  }
  if (u.direction === 'cleaning') {
    if (/commercial/i.test(idea)) return 'Commercial Cleaning Company'
    return 'Established Cleaning Business'
  }
  if (u.direction === 'software') {
    const model = String(u.specialized.biz_software_model ?? '')
    if (model === 'saas' || /saas|app/i.test(idea)) return 'Scaled SaaS Product'
    if (model === 'agency') return 'Software Agency'
    return 'Sustainable Software Business'
  }
  if (u.direction === 'food') {
    const premises = String(u.specialized.biz_food_premises ?? dynVal(u, 'start_model') ?? '')
    if (premises === 'restaurant' || premises === 'full_cafe' || /restaurant/i.test(idea)) return 'Own Restaurant'
    if (premises === 'cafe' || premises === 'takeaway' || /cafe|café|coffee/i.test(idea)) return 'Own Café'
    return `Established ${idea}`
  }
  if (u.direction === 'tutoring') return 'Established Tutoring Business'
  if (u.direction === 'ecommerce') return 'Scalable E-commerce Brand'
  return idea
}

function evaluateIdeaViability(
  u: BusinessDiscoveryUnderstanding,
  potentialScore: number
): { verdict: BusinessVerdict; explanation: string } {
  const idea = u.businessIdea ?? u.industryField ?? 'this business idea'

  if (u.intent === 'unsure') {
    return {
      verdict: 'Weak Potential',
      explanation: `${idea} is not ready to pursue as a primary business yet — validate whether entrepreneurship fits your situation before committing capital.`,
    }
  }

  if (
    u.experienceLevel === 'none' &&
    (u.capital === 'none' || u.capital === 'under_1k') &&
    !hasPayingCustomers(u) &&
    demandWeak(u)
  ) {
    return {
      verdict: 'Weak Potential',
      explanation: `${idea} needs more experience, customer validation, or capital before launching — build evidence first rather than investing upfront.`,
    }
  }

  if (potentialScore >= 75) {
    return {
      verdict: 'Strong Potential',
      explanation: `${idea} shows strong viability based on your experience, assets, and market readiness — the idea itself can work with the right phased approach.`,
    }
  }
  if (potentialScore < 45) {
    return {
      verdict: 'Weak Potential',
      explanation: `${idea} has Weak Potential in its current form — significant gaps in experience, customers, or capital mean you should validate before committing major spend.`,
    }
  }
  return {
    verdict: 'Moderate Potential',
    explanation: `${idea} has Moderate Potential — the concept can work, but success depends on starting with the safest model and building evidence step by step.`,
  }
}

function buildRoadmap(
  u: BusinessDiscoveryUnderstanding,
  primaryTitle: string,
  growthPath: string[]
): BusinessRoadmap {
  const longTermGoal = inferLongTermGoal(u)
  const buildNext =
    growthPath.length >= 2
      ? growthPath[1]!
      : u.direction === 'barber'
        ? 'Build customer base'
        : 'Validate and grow revenue'

  return {
    workNow: primaryTitle,
    buildNext,
    longTermGoal,
  }
}

function buildAdvantages(u: BusinessDiscoveryUnderstanding): string[] {
  const advantages: string[] = []
  if (u.experienceLevel && u.experienceLevel !== 'none') {
    advantages.push(`Existing industry experience (${expLabel(u.experienceLevel)})`)
  }
  if (u.capital && u.capital !== 'none') {
    advantages.push('Realistic startup budget available')
  }
  if (u.timePerWeek && u.timePerWeek !== 'under_10') {
    advantages.push('Meaningful weekly time commitment')
  }
  if (hasPayingCustomers(u)) advantages.push('Existing paying customers or warm leads')
  else if (u.hasNetwork === 'yes_network' || u.assets.includes('industry_contacts')) {
    advantages.push('Useful industry network')
  }
  if (u.assets.includes('tools') || u.assets.includes('qualification') || u.assets.includes('equipment')) {
    advantages.push('Relevant tools, equipment, or qualifications in place')
  }
  if (u.specialized.biz_barber_uk_shop === 'yes_current' || u.specialized.biz_barber_uk_shop === 'yes_past') {
    advantages.push('UK barber shop work experience')
  }
  if (!advantages.length) advantages.push('Clear baseline — plan focuses on lowest-risk entry')
  return advantages.slice(0, 5)
}

function buildChallenges(u: BusinessDiscoveryUnderstanding): string[] {
  const challenges: string[] = []
  if (!hasPayingCustomers(u)) challenges.push('Limited customer base')
  if (u.experienceLevel === 'none') challenges.push('Limited direct industry experience')
  if (u.capital === 'none' || u.capital === 'under_1k') challenges.push('Tight startup budget')
  if (demandWeak(u)) challenges.push('Customer demand not yet validated')
  if (u.riskTolerance === 'low') challenges.push('Low appetite for financial risk')
  if (!challenges.length) challenges.push('Standard startup risks — cash flow and competition remain')
  return challenges.slice(0, 5)
}

function riskItem(score: number, reason: string): BusinessRiskItem {
  const level: BusinessRiskLevel = score >= 3 ? 'High' : score >= 2 ? 'Medium' : 'Low'
  return { level, reason }
}

function computeRiskAnalysis(u: BusinessDiscoveryUnderstanding): BusinessRiskAnalysis {
  let cashFlow = 0
  let cashReason = 'Available capital and time commitment support early trading.'
  if (u.capital === 'none' || u.capital === 'under_1k') {
    cashFlow += 2
    cashReason = 'Limited startup capital means any slow start could strain personal finances.'
  } else if (u.riskTolerance === 'low') {
    cashFlow += 1
    cashReason = 'Available capital exists but revenue may take time to build and losses are hard to absorb.'
  }

  let customer = 0
  let customerReason = 'Some customer evidence or network supports early sales.'
  if (!hasPayingCustomers(u)) {
    customer += 3
    customerReason = 'No existing customer base and no referral network — every client must be acquired from scratch.'
  } else if (u.hasNetwork === 'limited') {
    customer += 1
    customerReason = 'Limited network — some leads possible but consistent pipeline is not established.'
  }

  let competition = 0
  let competitionReason = 'Competition awareness supports realistic positioning.'
  if (u.specialized.biz_competition_awareness === 'little') {
    competition += 2
    competitionReason = 'Limited competitor research — pricing and positioning may be misjudged.'
  } else if (u.specialized.biz_competition_awareness === 'some') {
    competition += 1
    competitionReason = 'Strong local competition exists but demand is likely present in the market.'
  } else {
    competitionReason = 'Competition is manageable with clear differentiation and local focus.'
  }

  let regulatory = 0
  let regulatoryReason = 'Standard UK self-employment registration applies.'
  if (u.direction === 'food') {
    regulatory += 1
    regulatoryReason =
      u.specialized.biz_food_licences === 'little'
        ? 'Food businesses require council registration and hygiene compliance — research gaps add delay risk.'
        : 'Food business registration, hygiene rating, and insurance requirements apply.'
  } else if (u.direction === 'barber') {
    regulatory += 1
    regulatoryReason = 'Insurance, possible home-working rules, and chair-rental agreements must be in place.'
  } else if (u.direction === 'driver') {
    regulatory += 2
    regulatoryReason = 'Licensing, vehicle insurance, and council rules for private hire or courier work apply.'
  }

  return {
    cashFlowRisk: riskItem(cashFlow, cashReason),
    customerAcquisitionRisk: riskItem(customer, customerReason),
    competitionRisk: riskItem(competition, competitionReason),
    regulatoryRisk: riskItem(regulatory, regulatoryReason),
  }
}

function growthPathForDirection(u: BusinessDiscoveryUnderstanding): string[] {
  if (u.direction === 'barber') {
    return ['Chair Rental', 'Build Client Base', 'Premium Services', 'Own Shop', 'Multiple Locations']
  }
  if (u.direction === 'cleaning') {
    return ['Solo Jobs', 'Regular Contracts', 'Small Team', 'Commercial Accounts', 'Regional Coverage']
  }
  if (u.direction === 'food') {
    return ['Home Catering / Pop-up', 'Proven Menu', 'Takeaway Unit', 'Full Restaurant', 'Second Location']
  }
  if (u.direction === 'software') {
    return ['Freelance Revenue', 'Niche Product MVP', 'Paying Subscribers', 'Small Team', 'Scaled SaaS']
  }
  if (u.direction === 'tutoring') {
    return ['First Students', 'Regular Weekly Slots', 'Group Sessions', 'Online Course', 'Tutoring Centre']
  }
  if (u.direction === 'ecommerce') {
    return ['Test Product', 'Repeat Sales', 'Own Brand', 'Multi-Channel', 'Wholesale / Scale']
  }
  return ['Validate Offer', 'First Paying Customers', 'Steady Revenue', 'Hire / Delegate', 'Scale Operations']
}

function avoidInitially(u: BusinessDiscoveryUnderstanding, primaryId: string): string | undefined {
  if (u.direction === 'barber' && primaryId !== 'barber_own_shop') return 'Opening a full shop immediately'
  if (u.direction === 'food' && !primaryId.includes('restaurant')) {
    return 'Signing a long restaurant lease before demand is proven'
  }
  if (u.direction === 'software' && primaryId !== 'software_saas') {
    return 'Building a full SaaS product before freelance revenue'
  }
  if (u.direction === 'ecommerce') return 'Large inventory orders before test sales'
  return undefined
}

function buildWeeklyPlan(u: BusinessDiscoveryUnderstanding, primaryId: string): BusinessWeekPlan[] {
  if (primaryId.includes('barber')) {
    return [
      { week: 'Week 1', actions: ['Research local chair rental or mobile barber rates', 'List kit gaps and get insurance quotes'] },
      { week: 'Week 2', actions: ['Create business Instagram and Google Business profile', 'Post 3–5 portfolio cuts or testimonials'] },
      { week: 'Week 3', actions: ['Acquire first 5 paying clients through referrals or local outreach', 'Set clear pricing and booking process'] },
      { week: 'Week 4', actions: ['Register as self-employed with HMRC when trading', 'Begin tracking revenue and weekly costs'] },
    ]
  }
  if (primaryId.includes('cleaning')) {
    return [
      { week: 'Week 1', actions: ['Price 3 local competitors and define your service area', 'Buy core supplies and get liability insurance quote'] },
      { week: 'Week 2', actions: ['Create simple booking page or WhatsApp business line', 'Distribute flyers or list on local directories'] },
      { week: 'Week 3', actions: ['Complete first 3 paid jobs and collect reviews', 'Offer one regular weekly slot to anchor income'] },
      { week: 'Week 4', actions: ['Register with HMRC', 'Track hours, mileage, and profit per job'] },
    ]
  }
  if (primaryId.includes('tutoring')) {
    return [
      { week: 'Week 1', actions: ['Define subjects, levels, and hourly rate', 'Register on 1–2 tutoring platforms or local parent groups'] },
      { week: 'Week 2', actions: ['Offer 2 free diagnostic sessions to build testimonials', 'Prepare lesson templates for your niche'] },
      { week: 'Week 3', actions: ['Book first 3–5 paying students', 'Set up online delivery tools if tutoring remotely'] },
      { week: 'Week 4', actions: ['Register self-employed with HMRC', 'Track student outcomes and referral sources'] },
    ]
  }
  if (primaryId.includes('software') || primaryId.includes('freelance')) {
    return [
      { week: 'Week 1', actions: ['Define one clear service offer and day rate', 'Update portfolio with 2 relevant case studies'] },
      { week: 'Week 2', actions: ['Contact 10 warm leads or post on LinkedIn/local networks', 'Join one niche community where buyers gather'] },
      { week: 'Week 3', actions: ['Close first paid contract or retainer', 'Document delivery process and scope boundaries'] },
      { week: 'Week 4', actions: ['Register with HMRC when invoicing', 'Invoice promptly and track pipeline'] },
    ]
  }
  if (primaryId.includes('food')) {
    return [
      { week: 'Week 1', actions: ['Research council food business registration for your area', 'Cost your menu and portion sizes'] },
      { week: 'Week 2', actions: ['Run a small paid tasting event or catering trial', 'Gather written feedback from 5+ customers'] },
      { week: 'Week 3', actions: ['Register food business with local council', 'Secure public liability insurance'] },
      { week: 'Week 4', actions: ['Take first paid catering orders', 'Track food cost % and delivery capacity'] },
    ]
  }
  const idea = u.businessIdea ?? 'your offer'
  return [
    { week: 'Week 1', actions: [`Validate demand for: ${idea}`, 'List startup costs and monthly break-even'] },
    { week: 'Week 2', actions: ['Reach out to 10 potential customers', 'Set up basic brand and payment method'] },
    { week: 'Week 3', actions: ['Secure first paying customer', 'Refine offer based on feedback'] },
    { week: 'Week 4', actions: ['Register with HMRC when trading', 'Review costs vs revenue weekly'] },
  ]
}

function parseRevenueBands(primaryId: string, u: BusinessDiscoveryUnderstanding): {
  first3Months: string
  months6to12: string
  longerTerm: string
} {
  if (primaryId.includes('barber')) {
    return { first3Months: '£500–£2,500', months6to12: '£1,500–£3,500/month', longerTerm: '£2,000–£4,500/month' }
  }
  if (primaryId.includes('cleaning')) {
    return { first3Months: '£500–£2,000', months6to12: '£1,200–£2,800/month', longerTerm: '£1,200–£3,500/month' }
  }
  if (primaryId.includes('tutoring')) {
    return { first3Months: '£500–£2,000', months6to12: '£1,200–£3,000/month', longerTerm: '£1,500–£4,000/month' }
  }
  if (primaryId.includes('software') || primaryId.includes('freelance')) {
    return { first3Months: '£1,000–£3,000', months6to12: '£2,000–£5,000/month', longerTerm: '£2,000–£6,000/month' }
  }
  if (primaryId.includes('food')) {
    return { first3Months: '£500–£2,500', months6to12: '£1,500–£4,000/month', longerTerm: '£2,000–£8,000/month' }
  }
  if (u.timePerWeek === 'under_10') {
    return { first3Months: '£200–£800', months6to12: '£500–£1,500/month', longerTerm: '£800–£2,500/month' }
  }
  return { first3Months: '£500–£2,500', months6to12: '£1,000–£3,000/month', longerTerm: '£1,500–£4,500/month' }
}

function buildWhyThisVerdict(
  u: BusinessDiscoveryUnderstanding,
  verdict: BusinessVerdict,
  score: number,
  breakdown: BusinessScoreBreakdownItem[]
): string {
  const positives = breakdown.filter((b) => b.points > 0).map((b) => `${b.label.toLowerCase()} (+${b.points})`)
  const negatives = breakdown.filter((b) => b.points < 0).map((b) => `${b.label.toLowerCase()} (${b.points})`)
  const idea = u.businessIdea ?? u.industryField ?? 'this idea'

  if (verdict === 'Strong Potential') {
    return `${idea} scores ${score}/100 because ${positives.slice(0, 3).join(', ')}. Your profile supports a phased UK launch — start small, prove revenue, then scale toward your long-term goal.`
  }
  if (verdict === 'Weak Potential') {
    return `${idea} scores ${score}/100. Gaps: ${negatives.join(', ') || 'limited evidence across experience, customers, and capital'}. Do not abandon the idea — validate demand cheaply before major investment.`
  }
  return `${idea} scores ${score}/100 with mixed signals (${positives.slice(0, 2).join(', ')}${negatives.length ? `; concerns: ${negatives.join(', ')}` : ''}). A safer starting model reduces risk while you build proof.`
}

function buildStartupDifficulty(u: BusinessDiscoveryUnderstanding, primaryId: string): {
  level: StartupDifficulty
  explanation: string
} {
  let points = 0
  if (u.experienceLevel === 'none') points += 2
  if (u.capital === 'none' || u.capital === 'under_1k') points += 1
  if (primaryId.includes('own') || primaryId.includes('shop') || primaryId.includes('restaurant')) points += 2
  if (u.direction === 'food' || u.direction === 'driver') points += 1
  if (hasPayingCustomers(u)) points -= 2
  if (u.experienceLevel === '3_plus_years' || u.experienceLevel === 'expert') points -= 1

  if (points <= 0) {
    return { level: 'Low', explanation: 'Your experience and chosen starting model keep early startup complexity manageable.' }
  }
  if (points >= 3) {
    return { level: 'High', explanation: 'Premises, regulation, or experience gaps make this a demanding UK startup — phase your launch carefully.' }
  }
  return { level: 'Moderate', explanation: 'Typical UK small-business difficulty — achievable with the recommended starting model and steady validation.' }
}

function buildFinancialRequirements(u: BusinessDiscoveryUnderstanding, startupCost: string): string[] {
  const reqs = [`Startup capital: ${startupCost}`]
  if (u.capital === 'none' || u.capital === 'under_1k') {
    reqs.push('Personal savings buffer for 2–3 months of lean trading')
  }
  reqs.push('Register with HMRC when you start trading (self-employed or Ltd)')
  if (u.incomeExpectation === '4k_plus' || u.incomeExpectation === '2k_4k') {
    reqs.push(`Target income ${u.incomeExpectation.replace(/_/g, ' ')} — plan monthly break-even early`)
  }
  return reqs
}

function buildOperationalRequirements(u: BusinessDiscoveryUnderstanding, primaryTitle: string): string[] {
  const reqs = [`Deliver ${primaryTitle} with ${u.timePerWeek?.replace(/_/g, ' ') ?? 'consistent'} weekly commitment`]
  const equip = dynVal(u, 'equipment')
  if (equip === 'none' || equip === 'partial') reqs.push('Acquire essential equipment before taking paid work')
  if (dynVal(u, 'team') === 'hire_later') reqs.push('Start solo — document processes before hiring')
  if (dynVal(u, 'marketing') === 'no_plan') reqs.push('Define one clear customer acquisition channel')
  if (u.direction === 'food' && dynVal(u, 'kitchen') === 'need') reqs.push('Secure registered kitchen access before trading')
  return reqs
}

function buildFastestValidationPath(u: BusinessDiscoveryUnderstanding, primaryId: string): string {
  if (!hasPayingCustomers(u)) {
    return 'Land one paying customer with the smallest viable offer — no premises, no large stock orders.'
  }
  if (demandWeak(u)) {
    return 'Run a 2-week validation sprint: 10 customer conversations or a simple landing page with a clear call to action.'
  }
  if (primaryId.includes('saas') || u.direction === 'software') {
    return 'Ship a narrow MVP to 3–5 pilot users and charge a reduced introductory price.'
  }
  if (u.direction === 'barber') {
    return 'Offer paid cuts to 5 new clients via referrals before signing any chair rental contract.'
  }
  if (u.direction === 'food' || analyzeBusinessIdea(u.businessIdea, u.industryField)?.isCafe) {
    return 'Run a paid pop-up or tasting event before committing to café premises.'
  }
  return 'Repeat what already earned money — narrow the offer and test pricing with real buyers.'
}

function build90DayPlan(u: BusinessDiscoveryUnderstanding, primaryId: string, weeks30: BusinessWeekPlan[]): string[] {
  const month1 = weeks30.flatMap((w) => w.actions)
  const month2: string[] = []
  const month3: string[] = []

  if (primaryId.includes('barber')) {
    month2.push('Secure chair rental or establish mobile route with 10+ regular clients')
    month2.push('Track weekly revenue, costs, and rebooking rate')
    month3.push('Introduce premium services or packages')
    month3.push('Evaluate whether own-shop savings target is realistic')
  } else if (primaryId.includes('cleaning')) {
    month2.push('Convert 2–3 one-off jobs into weekly contracts')
    month2.push('Collect written testimonials and referrals')
    month3.push('Raise prices or add commercial accounts if capacity allows')
  } else if (primaryId.includes('software') || primaryId.includes('freelance')) {
    month2.push('Close second client or retainer for recurring revenue')
    month2.push('Productise one repeatable service package')
    month3.push('Evaluate MVP scope if moving toward SaaS')
  } else if (primaryId.includes('food')) {
    month2.push('Complete 10+ paid catering orders with consistent margins')
    month2.push('Refine menu based on bestsellers')
    month3.push('Assess pop-up vs takeaway unit based on demand data')
  } else {
    month2.push('Reach monthly break-even on lean operating costs')
    month2.push('Document what marketing channel brought paying customers')
    month3.push('Decide whether to scale hours, prices, or offer range')
  }

  return [
    `Days 1–30: ${month1.slice(0, 2).join('; ')}`,
    `Days 31–60: ${month2.join('; ')}`,
    `Days 61–90: ${month3.join('; ')}`,
  ]
}

function buildBestNextAction(
  u: BusinessDiscoveryUnderstanding,
  primaryId: string,
  primaryTitle: string
): string {
  if (u.direction === 'barber' && primaryId.includes('chair')) {
    return 'Contact 5 local chair-rental barber shops this week.'
  }
  if (u.direction === 'barber' && primaryId.includes('mobile')) {
    return 'Book your first 3 paying mobile clients through referrals or local social media this week.'
  }
  if (!hasPayingCustomers(u)) {
    return 'Get your first paying customer before investing in premises or major equipment.'
  }
  if (u.direction === 'software' && (primaryId.includes('saas') || u.specialized.biz_saas_validation === 'none')) {
    return 'Validate demand with 20 potential customers through interviews or a landing page.'
  }
  if (u.direction === 'ecommerce' && demandWeak(u)) {
    return 'Run a small test batch sale before ordering bulk inventory.'
  }
  if (u.direction === 'cleaning') {
    return 'Price 3 competitors in your area and book your first paid domestic job within 14 days.'
  }
  if (u.direction === 'software') {
    return 'Launch a landing page and collect 50 emails from your target niche.'
  }
  if (u.direction === 'food') {
    return 'Run one paid catering trial for 5+ customers before signing any premises lease.'
  }
  return `Take the single highest-impact step toward ${primaryTitle}: validate one paying customer within 14 days.`
}

export function buildBusinessDiscoveryFinalReport(state: CareerBrainState): BusinessDiscoveryFinalReport {
  const u = buildBusinessDiscoveryUnderstanding(state)
  const { primary, alternatives } = selectBusinessRecommendations(u)
  const primaryModel = primary

  const { score: potentialScore, breakdown: scoreBreakdown } = computeBusinessPotentialScore(u)
  const ideaLabel = u.businessIdea ?? u.industryField ?? 'Your business idea'
  const { verdict: ideaViability, explanation: ideaViabilityExplanation } = evaluateIdeaViability(u, potentialScore)

  const advantages = buildAdvantages(u)
  const challenges = buildChallenges(u)
  const riskAnalysis = computeRiskAnalysis(u)
  const growthPath = growthPathForDirection(u)
  const roadmap = buildRoadmap(u, primaryModel.title, growthPath)
  const avoid = avoidInitially(u, primaryModel.id)
  const first30DaysWeeks = buildWeeklyPlan(u, primaryModel.id)
  const revenue = parseRevenueBands(primaryModel.id, u)
  const bestNextAction = buildBestNextAction(u, primaryModel.id, primaryModel.title)
  const whyThisVerdict = buildWhyThisVerdict(u, ideaViability, potentialScore, scoreBreakdown)
  const { level: startupDifficulty, explanation: startupDifficultyExplanation } = buildStartupDifficulty(
    u,
    primaryModel.id
  )
  const financialRequirements = buildFinancialRequirements(u, primaryModel.startupCost)
  const operationalRequirements = buildOperationalRequirements(u, primaryModel.title)
  const fastestValidationPath = buildFastestValidationPath(u, primaryModel.id)
  const first90DaysPlan = build90DayPlan(u, primaryModel.id, first30DaysWeeks)

  const majorRisks = [...challenges]
  if (avoid) majorRisks.push(`Avoid initially: ${avoid}`)

  const opportunitySummary = [
    `Business idea: ${ideaLabel}.`,
    `Idea viability: ${ideaViability}.`,
    `Safest starting model: ${primaryModel.title}.`,
    `Long-term goal: ${roadmap.longTermGoal}.`,
  ].join(' ')

  const first30DaysPlan = first30DaysWeeks.flatMap((w) => w.actions)

  const notBusiness =
    primaryModel.id === 'freelance_first' ||
    primaryModel.id === 'side_income_first' ||
    primaryModel.id === 'experience_first' ||
    primaryModel.id === 'defer_business'
      ? primaryModel.why
      : undefined

  return {
    businessIdeaLabel: ideaLabel,
    ideaViability,
    ideaViabilityExplanation,
    businessVerdict: ideaViability,
    verdictExplanation: ideaViabilityExplanation,
    whyThisVerdict,
    businessPotentialScore: potentialScore,
    scoreBreakdown,
    startupDifficulty,
    startupDifficultyExplanation,
    financialRequirements,
    operationalRequirements,
    fastestValidationPath,
    opportunitySummary,
    existingAdvantages: advantages,
    majorRisks,
    advantages,
    challenges,
    mostRealisticModel: primaryModel,
    alternativeModels: alternatives,
    avoidInitially: avoid,
    roadmap,
    estimatedStartupCost: primaryModel.startupCost,
    estimatedTimeToFirstRevenue: primaryModel.timeToRevenue,
    ukRequirements: ukRequirementsForModel(u, primaryModel.id),
    revenuePotential: revenue,
    first30DaysPlan,
    first30DaysWeeks,
    first90DaysPlan,
    growthPath,
    riskAnalysis,
    bestNextAction,
    confidenceScore: potentialScore,
    confidenceExplanation: `Business Potential Score ${potentialScore}/100 based on your answers.`,
    notBusinessRecommendation: notBusiness,
  }
}

export function buildBusinessDiscoveryIntelligence(
  profile: CareerProfile,
  state: CareerBrainState
): {
  growth: BusinessDiscoveryGrowthOutput
  recommendations: CareerBrainRecommendation[]
  reasoning: string[]
} {
  const report = buildBusinessDiscoveryFinalReport(state)
  const domain = profile.domain ?? 'admin_business'

  const recs: CareerBrainRecommendation[] = [
    {
      title: report.mostRealisticModel.title,
      why: report.mostRealisticModel.why,
      track: 'work_now',
      field_tag: 'business_discovery',
      domain,
      source: 'fallback',
    },
  ]
  report.alternativeModels.forEach((alt, i) => {
    recs.push({
      title: alt.title,
      why: alt.why,
      track: i === 0 ? 'build_next' : 'long_term',
      field_tag: 'business_discovery',
      domain,
      source: 'fallback',
    })
  })

  const growth: BusinessDiscoveryGrowthOutput = {
    summary: report.opportunitySummary,
    confidence: report.businessPotentialScore,
    finalReport: report,
    recommendedJobAZActions: [
      { action: 'BUILD_YOUR_PATH', label: 'Build your 30-day business action plan', href: '/build-your-path' },
    ],
  }

  return {
    growth,
    recommendations: recs,
    reasoning: [
      'JAZ UK Business Advisor — evaluates your idea and recommends the safest start.',
      `Idea: ${report.businessIdeaLabel} — ${report.ideaViability}.`,
      `Start with: ${report.mostRealisticModel.title}. Goal: ${report.roadmap.longTermGoal}.`,
      `Best next action: ${report.bestNextAction}`,
    ],
  }
}

export function formatBusinessDiscoveryWhyThisPath(report: BusinessDiscoveryFinalReport): string {
  return [
    'Business Verdict',
    `${report.businessVerdict} — ${report.verdictExplanation}`,
    '',
    'Why This Verdict',
    report.whyThisVerdict,
    '',
    'Business Idea',
    report.businessIdeaLabel,
    `Idea viability: ${report.ideaViability}`,
    '',
    'Business Potential Score',
    `${report.businessPotentialScore} / 100`,
    ...report.scoreBreakdown.map((b) => `${b.label}: ${b.points >= 0 ? '+' : ''}${b.points}`),
    '',
    'Startup Difficulty',
    `${report.startupDifficulty} — ${report.startupDifficultyExplanation}`,
    '',
    'Fastest Validation Path',
    report.fastestValidationPath,
    '',
    'Safest Starting Model',
    report.mostRealisticModel.title,
    report.avoidInitially ? `Avoid initially: ${report.avoidInitially}` : '',
    '',
    'Long-Term Roadmap',
    `Work Now: ${report.roadmap.workNow}`,
    `Build Next: ${report.roadmap.buildNext}`,
    `Long-Term Goal: ${report.roadmap.longTermGoal}`,
    '',
    'First 90 Day Plan',
    ...report.first90DaysPlan,
    '',
    'Best Next Action',
    report.bestNextAction,
    '',
    'Financial Requirements',
    ...report.financialRequirements.map((r) => `• ${r}`),
    '',
    'Operational Requirements',
    ...report.operationalRequirements.map((r) => `• ${r}`),
    '',
    'Risk Analysis',
    `Cash flow (${report.riskAnalysis.cashFlowRisk.level}): ${report.riskAnalysis.cashFlowRisk.reason}`,
    `Customer acquisition (${report.riskAnalysis.customerAcquisitionRisk.level}): ${report.riskAnalysis.customerAcquisitionRisk.reason}`,
    `Competition (${report.riskAnalysis.competitionRisk.level}): ${report.riskAnalysis.competitionRisk.reason}`,
    `Regulatory (${report.riskAnalysis.regulatoryRisk.level}): ${report.riskAnalysis.regulatoryRisk.reason}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function mergeBusinessDiscoveryIntoOutput(
  output: import('../types').CareerBrainOutput,
  intelligence: NonNullable<ReturnType<typeof buildBusinessDiscoveryIntelligence>>
): import('../types').CareerBrainOutput {
  const { growth } = intelligence
  const report = growth.finalReport

  return {
    ...output,
    recommendedPaths: { workNow: [], buildNext: [], longTerm: [], backupIncome: [] },
    whyThisPath: formatBusinessDiscoveryWhyThisPath(report),
    personalizedSummary: growth.summary,
    careerLadderSummary: 'UK Business Advisor — startup plan',
    employabilityScore: 0,
    pathConfidence: [],
    businessDiscoveryGrowth: growth,
    notRecommended: [],
    reasoning: [...output.reasoning, ...intelligence.reasoning],
    nextJobAZActions: growth.recommendedJobAZActions,
    practicalNextSteps: growth.recommendedJobAZActions,
    jobSearchKeywords: [],
  }
}
