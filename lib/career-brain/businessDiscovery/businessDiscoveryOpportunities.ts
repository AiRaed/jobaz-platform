/**
 * JAZ Business Discovery — evidence-gated UK business model evaluation.
 */

import type {
  BusinessDiscoveryUnderstanding,
  BusinessModelRecommendation,
} from './businessDiscoveryTypes'

type Evaluated = BusinessModelRecommendation & { supported: boolean; rejectReason?: string }

function capOk(u: BusinessDiscoveryUnderstanding, min: string): boolean {
  const order = ['none', 'under_1k', '1k_5k', '5k_20k', '20k_plus']
  if (!u.capital) return false
  return order.indexOf(u.capital) >= order.indexOf(min)
}

function expOk(u: BusinessDiscoveryUnderstanding, min: string): boolean {
  const order = ['none', 'some', '1_3_years', '3_plus_years', 'expert']
  if (!u.experienceLevel) return false
  return order.indexOf(u.experienceLevel) >= order.indexOf(min)
}

function demandWeak(u: BusinessDiscoveryUnderstanding): boolean {
  return u.specialized.biz_demand_evidence === 'assumption'
}

function barberModel(u: BusinessDiscoveryUnderstanding): string | null {
  const raw = u.specialized.biz_barber_model ?? u.specialized.biz_barber_premises
  return raw ? String(raw) : null
}

export function buildFallbackBusinessModel(u: BusinessDiscoveryUnderstanding): BusinessModelRecommendation {
  const idea = u.businessIdea ?? u.industryField ?? 'your venture'

  if (u.direction === 'barber') {
    const model = barberModel(u)
    if (model === 'own_shop') {
      return {
        id: 'barber_own_shop',
        title: 'Own shop — phased opening',
        why: 'You are aiming for own premises — start by building a client base through chair rental or mobile work before signing a lease.',
        startupCost: '£20,000+',
        timeToRevenue: '3–9 months after premises secured',
        revenuePotential: '£2,000–£4,500/month once established',
        confidence: 'Moderate',
        type: 'primary',
      }
    }
    if (model === 'mobile' || model === 'home_based' || model === 'home_mobile') {
      return {
        id: 'barber_mobile',
        title: 'Mobile Barber',
        why: 'Mobile or home-based barbering keeps startup costs low while you build regular clients.',
        startupCost: '£1,000–£3,000',
        timeToRevenue: '2–6 weeks with local marketing',
        revenuePotential: '£500–£2,500/month early; £2,000–£4,500/month at 12 months',
        confidence: 'Moderate',
        type: 'primary',
      }
    }
    return {
      id: 'barber_chair_rental',
      title: 'Chair Rental Barber',
      why: 'Chair rental is the most common low-risk UK barber entry — you trade without premises risk.',
      startupCost: '£500–£2,000',
      timeToRevenue: '4–8 weeks after chair secured',
      revenuePotential: '£500–£2,500 in first 3 months; £2,000–£4,500/month at 12 months',
      confidence: 'Moderate',
      type: 'primary',
    }
  }

  if (u.direction === 'cleaning') {
    return {
      id: 'cleaning_solo',
      title: 'Solo cleaning business',
      why: 'A solo domestic/commercial cleaning route fits limited capital and lets you validate demand locally.',
      startupCost: '£500–£2,500',
      timeToRevenue: '2–6 weeks',
      revenuePotential: '£500–£2,000 in first 3 months; £1,200–£3,500/month at 12 months',
      confidence: 'Moderate',
      type: 'primary',
    }
  }

  if (u.direction === 'food') {
    const premises = String(u.specialized.biz_food_premises ?? '')
    if (premises === 'restaurant' || premises === 'cafe') {
      return {
        id: 'food_pop_up_first',
        title: 'Pop-up / catering first — defer full premises',
        why: 'Restaurant premises are high risk without proven demand — validate with catering or pop-up first.',
        startupCost: '£2,000–£8,000',
        timeToRevenue: '6–12 weeks',
        revenuePotential: '£500–£2,500 in first 3 months',
        confidence: 'Moderate',
        type: 'primary',
      }
    }
    return {
      id: 'food_home_catering',
      title: 'Home-based catering / meal prep',
      why: 'Registered home catering is the lowest-cost UK food business entry before committing to premises.',
      startupCost: '£1,000–£5,000',
      timeToRevenue: '4–10 weeks',
      revenuePotential: '£500–£2,500 in first 3 months',
      confidence: 'Moderate',
      type: 'primary',
    }
  }

  if (u.direction === 'software') {
    return {
      id: 'software_freelance',
      title: 'Freelance development / consulting',
      why: 'Freelance contracts generate revenue faster than building a product — typical UK path before SaaS.',
      startupCost: '£0–£300',
      timeToRevenue: '4–10 weeks',
      revenuePotential: '£1,000–£4,000/month with steady clients',
      confidence: 'Moderate',
      type: 'primary',
    }
  }

  if (u.direction === 'tutoring') {
    const delivery = String(u.specialized.biz_tutoring_delivery ?? 'online')
    return {
      id: 'tutoring_solo',
      title: delivery === 'in_person' ? 'In-person private tutoring' : 'Online private tutoring',
      why: 'Solo tutoring needs minimal startup capital — register self-employed when you start charging.',
      startupCost: '£100–£500',
      timeToRevenue: '2–4 weeks',
      revenuePotential: '£500–£2,000 in first 3 months; £1,500–£4,000/month at 12 months',
      confidence: 'Moderate',
      type: 'primary',
    }
  }

  if (u.direction === 'ecommerce') {
    return {
      id: 'ecommerce_lean',
      title: 'Lean e-commerce test — small stock batch',
      why: 'Test one product with a small batch before scaling inventory or ad spend.',
      startupCost: '£500–£2,000',
      timeToRevenue: '4–8 weeks',
      revenuePotential: '£500–£2,500 in first 3 months — highly variable',
      confidence: 'Moderate',
      type: 'primary',
    }
  }

  return {
    id: 'lean_start',
    title: `Lean start — ${idea}`,
    why: 'Based on your answers, starting small with minimal fixed costs is the most realistic UK entry point.',
    startupCost: u.capital === 'none' || u.capital === 'under_1k' ? '£100–£1,000' : '£1,000–£5,000',
    timeToRevenue: '4–8 weeks with focused outreach',
    revenuePotential: '£500–£2,500 in first 3 months depending on sales effort',
    confidence: 'Moderate',
    type: 'primary',
  }
}

export function evaluateBusinessModels(u: BusinessDiscoveryUnderstanding): Evaluated[] {
  const out: Evaluated[] = []
  const idea = u.businessIdea ?? u.industryField ?? 'your field'

  // Freelance first — often better than business
  const freelanceFirst =
    (u.skills.includes('technical') || u.skills.includes('marketing') || u.direction === 'software') &&
    expOk(u, '1_3_years') &&
    (u.capital === 'none' || u.capital === 'under_1k')
  out.push({
    id: 'freelance_first',
    title: 'Freelance / self-employed services (before full business)',
    why: freelanceFirst
      ? `You have ${u.experienceLevel?.replace(/_/g, ' ')} experience and limited capital — UK advisers often start with freelance contracts before hiring or premises.`
      : '',
    startupCost: '£0–£500 (registration, insurance, tools you may already have)',
    timeToRevenue: '2–8 weeks with outreach',
    revenuePotential: '£1,000–£4,000/month depending on clients',
    confidence: freelanceFirst ? 'High' : 'Lower',
    type: freelanceFirst ? 'primary' : 'rejected',
    supported: freelanceFirst,
    rejectReason: 'Insufficient skills/experience or capital available for service model',
  })

  const sideIncomeFirst =
    u.timePerWeek === 'under_10' &&
    u.riskTolerance === 'low' &&
    !expOk(u, '3_plus_years')
  out.push({
    id: 'side_income_first',
    title: 'Side income first — defer formal business',
    why: sideIncomeFirst
      ? `Under 10 hours/week and low risk tolerance — building side income validates demand before company setup.`
      : '',
    startupCost: 'Minimal',
    timeToRevenue: '1–4 weeks',
    revenuePotential: '£200–£800/month initially',
    confidence: 'Moderate',
    type: sideIncomeFirst ? 'alternative' : 'rejected',
    supported: sideIncomeFirst,
    rejectReason: 'Enough time/commitment for direct business start',
  })

  const gainExpFirst =
    u.experienceLevel === 'none' &&
    u.direction !== 'general' &&
    u.intent === 'has_idea'
  out.push({
    id: 'experience_first',
    title: 'Gain paid experience before starting this business',
    why: gainExpFirst
      ? `No direct experience in ${idea} — working in the industry 6–12 months reduces failure risk.`
      : '',
    startupCost: 'N/A — employment or apprenticeship',
    timeToRevenue: '6–12 months before safe launch',
    revenuePotential: 'Salary while learning; business later',
    confidence: gainExpFirst ? 'High' : 'Lower',
    type: gainExpFirst ? 'alternative' : 'rejected',
    supported: gainExpFirst,
    rejectReason: 'Already has field experience',
  })

  // Barber
  if (u.direction === 'barber') {
    const model = barberModel(u)
    const hasCustomers =
      u.specialized.biz_barber_customers === 'regular' ||
      u.specialized.biz_barber_customers === 'occasional' ||
      u.hasNetwork === 'yes_customers'
    const chairRental =
      (model === 'chair_rental' || model === 'unsure' || u.specialized.biz_barber_start_small === 'yes') &&
      (u.specialized.biz_barber_experience === 'qualified' ||
        u.specialized.biz_barber_experience === 'shop_exp' ||
        expOk(u, 'some'))
    out.push({
      id: 'barber_chair_rental',
      title: 'Chair Rental Barber',
      why: chairRental
        ? 'Chair rental matches your experience, budget, and willingness to start small — typical UK barber entry.'
        : '',
      startupCost: '£500–£2,000',
      timeToRevenue: '4–8 weeks after chair secured',
      revenuePotential: '£500–£2,500 in first 3 months; £2,000–£4,500/month at 12 months',
      confidence: chairRental && hasCustomers ? 'High' : chairRental ? 'Moderate' : 'Lower',
      type: 'primary',
      supported: chairRental || model === 'chair_rental' || u.specialized.biz_barber_start_small === 'yes',
      rejectReason: 'Own-shop-only ambition without phased start',
    })

    const mobile =
      model === 'mobile' ||
      model === 'home_based' ||
      model === 'home_mobile' ||
      (u.capital === 'under_1k' && u.specialized.biz_barber_start_small !== 'no')
    out.push({
      id: 'barber_mobile',
      title: 'Mobile Barber',
      why: mobile
        ? 'Mobile barbering keeps premises cost down while you build a regular client route.'
        : '',
      startupCost: '£1,000–£3,000',
      timeToRevenue: '2–6 weeks',
      revenuePotential: '£500–£2,500 in first 3 months; £2,000–£4,500/month at 12 months',
      confidence: mobile && hasCustomers ? 'High' : 'Moderate',
      type: 'alternative',
      supported: mobile,
      rejectReason: 'Prefer fixed premises model',
    })

    const ownShop =
      model === 'own_shop' &&
      (capOk(u, '5k_20k') || capOk(u, '20k_plus')) &&
      u.specialized.biz_barber_start_small === 'no'
    out.push({
      id: 'barber_own_shop',
      title: 'Own shop premises',
      why: ownShop ? 'You have capital and want own premises — high risk without proven customer base.' : '',
      startupCost: '£20,000+',
      timeToRevenue: '3–9 months',
      revenuePotential: '£4,000–£12,000/month if location works',
      confidence: ownShop ? 'Moderate' : 'Lower',
      type: ownShop ? 'alternative' : 'rejected',
      supported: ownShop,
      rejectReason: 'Insufficient capital or better to start smaller first',
    })
  }

  // Cleaning
  if (u.direction === 'cleaning') {
    const soloCleaning =
      (u.specialized.biz_cleaning_transport === 'yes_full' || u.specialized.biz_cleaning_transport === 'partial') &&
      (expOk(u, 'some') || u.skills.includes('operations'))
    out.push({
      id: 'cleaning_solo',
      title: 'Solo domestic/commercial cleaning business',
      why: soloCleaning
        ? `Transport/equipment status and ${u.specialized.biz_cleaning_type ?? 'cleaning'} focus support a lean UK startup.`
        : '',
      startupCost: '£500–£2,500 (supplies, insurance, marketing)',
      timeToRevenue: '2–6 weeks with local marketing',
      revenuePotential: '£1,200–£3,500/month solo',
      confidence: soloCleaning ? 'High' : 'Moderate',
      type: 'primary',
      supported: soloCleaning,
      rejectReason: 'Missing transport, equipment, or experience',
    })
  }

  // Software
  if (u.direction === 'software') {
    const freelanceDev =
      (u.specialized.biz_software_model === 'freelance' || u.capital === 'none' || u.capital === 'under_1k') &&
      u.skills.includes('technical') &&
      expOk(u, '1_3_years')
    out.push({
      id: 'software_freelance',
      title: 'Software freelance / niche consulting',
      why: freelanceDev
        ? `Technical skills and ${u.specialized.biz_software_clients ?? 'client'} acquisition path — realistic before SaaS.`
        : '',
      startupCost: '£0–£300 (Companies House optional, insurance, portfolio)',
      timeToRevenue: '4–10 weeks',
      revenuePotential: '£2,000–£6,000/month with steady clients',
      confidence: freelanceDev ? 'High' : 'Moderate',
      type: 'primary',
      supported: freelanceDev,
      rejectReason: 'Insufficient technical experience or client plan',
    })

    const saas =
      u.specialized.biz_software_model === 'saas' &&
      expOk(u, '3_plus_years') &&
      capOk(u, '1k_5k') &&
      u.specialized.biz_software_clients !== 'no_plan' &&
      !demandWeak(u)
    out.push({
      id: 'software_saas',
      title: 'Bootstrapped SaaS (niche B2B)',
      why: saas
        ? 'Experience, some capital, and client/demand evidence support a niche SaaS — not a mass-market app.'
        : '',
      startupCost: '£2,000–£15,000 (hosting, tools, marketing, runway)',
      timeToRevenue: '6–18 months to meaningful MRR',
      revenuePotential: '£500–£5,000 MRR in year 1 if niche fits',
      confidence: saas ? 'Moderate' : 'Lower',
      type: saas ? 'alternative' : 'rejected',
      supported: saas,
      rejectReason: 'SaaS needs experience, capital, and validated demand',
    })
  }

  // Driver
  if (u.direction === 'driver') {
    const courier =
      (u.specialized.biz_driver_setup === 'courier' || u.specialized.biz_driver_licence === 'courier_bike') &&
      u.assets.includes('vehicle')
    out.push({
      id: 'driver_courier',
      title: 'Courier / same-day delivery sole trader',
      why: courier ? 'Vehicle and courier setup fit lower-regulation UK delivery work.' : '',
      startupCost: '£1,000–£4,000 (vehicle costs, insurance, branding)',
      timeToRevenue: '2–4 weeks',
      revenuePotential: '£1,500–£3,500/month variable',
      confidence: courier ? 'Moderate' : 'Lower',
      type: 'primary',
      supported: courier,
      rejectReason: 'Vehicle/licence not ready',
    })

    const phv =
      u.specialized.biz_driver_licence === 'phv_ready' &&
      (u.specialized.biz_driver_setup === 'private_hire' || u.direction === 'driver')
    out.push({
      id: 'driver_phv',
      title: 'Private hire / airport transfers',
      why: phv ? 'PHV-ready status supports licensed private hire — council rules apply.' : '',
      startupCost: '£3,000–£10,000 (licence, vehicle, insurance)',
      timeToRevenue: '4–8 weeks after licensing',
      revenuePotential: '£2,000–£5,000/month net (highly variable)',
      confidence: phv ? 'High' : 'Lower',
      type: 'primary',
      supported: phv,
      rejectReason: 'PHV licence or vehicle not ready',
    })
  }

  // Tutoring
  if (u.direction === 'tutoring') {
    const online =
      u.specialized.biz_tutoring_delivery === 'online' || u.specialized.biz_tutoring_delivery === 'hybrid'
    out.push({
      id: 'tutoring_online',
      title: 'Online private tutoring',
      why: online
        ? 'Online delivery scales without travel costs — register self-employed when charging.'
        : '',
      startupCost: '£100–£500',
      timeToRevenue: '2–4 weeks',
      revenuePotential: '£500–£2,000 in first 3 months; £1,500–£4,000/month at 12 months',
      confidence: online ? 'High' : 'Moderate',
      type: 'primary',
      supported: online || u.specialized.biz_tutoring_delivery === 'unsure',
      rejectReason: 'Prefer in-person only',
    })
    const inPerson = u.specialized.biz_tutoring_delivery === 'in_person' || u.specialized.biz_tutoring_delivery === 'hybrid'
    out.push({
      id: 'tutoring_in_person',
      title: 'In-person private tutoring',
      why: inPerson ? 'Local in-person tutoring suits GCSE/A-Level demand in your area.' : '',
      startupCost: '£200–£800',
      timeToRevenue: '2–6 weeks',
      revenuePotential: '£800–£3,000/month with 5–10 students',
      confidence: 'Moderate',
      type: 'alternative',
      supported: inPerson,
      rejectReason: 'Online-only delivery preferred',
    })
  }

  // Food — caution
  if (u.direction === 'food') {
    const foodSupported =
      expOk(u, '1_3_years') &&
      capOk(u, '5k_20k') &&
      !demandWeak(u) &&
      u.riskTolerance !== 'low'
    out.push({
      id: 'food_catering',
      title: 'Catering / home food business (regulated)',
      why: foodSupported
        ? 'Experience and capital support regulated food business — council hygiene registration required.'
        : '',
      startupCost: '£5,000–£25,000+',
      timeToRevenue: '2–4 months',
      revenuePotential: '£2,000–£8,000/month if demand proven',
      confidence: foodSupported ? 'Moderate' : 'Lower',
      type: 'primary',
      supported: foodSupported,
      rejectReason: 'Food businesses need experience, capital, and demand proof',
    })
  }

  // Ecommerce
  if (u.direction === 'ecommerce' || (u.skills.includes('marketing') && capOk(u, '1k_5k'))) {
    const ecommerce =
      capOk(u, '1k_5k') &&
      u.hasNetwork !== 'none' &&
      !demandWeak(u) &&
      u.riskTolerance !== 'low'
    out.push({
      id: 'ecommerce_niche',
      title: 'Niche e-commerce / reselling (validated product)',
      why: ecommerce
        ? 'Capital and some network support tested resale — not speculative trending products.'
        : '',
      startupCost: '£1,000–£5,000 (stock, ads, tools)',
      timeToRevenue: '4–12 weeks',
      revenuePotential: 'Highly variable — £500–£3,000/month early',
      confidence: ecommerce ? 'Moderate' : 'Lower',
      type: 'alternative',
      supported: ecommerce,
      rejectReason: 'Needs capital, demand validation, and risk tolerance',
    })
  }

  // General consultancy
  if (u.direction === 'consultancy' || (expOk(u, '3_plus_years') && u.skills.includes('people'))) {
    const consult =
      expOk(u, '3_plus_years') &&
      (u.hasNetwork === 'yes_customers' || u.hasNetwork === 'yes_network')
    out.push({
      id: 'consultancy_solo',
      title: 'Solo consultancy in your field',
      why: consult
        ? `${u.experienceLevel?.replace(/_/g, ' ')} experience and network support B2B consulting before hiring staff.`
        : '',
      startupCost: '£200–£1,000',
      timeToRevenue: '4–12 weeks',
      revenuePotential: '£2,000–£8,000/month with 2–4 clients',
      confidence: consult ? 'High' : 'Moderate',
      type: 'primary',
      supported: consult,
      rejectReason: 'Needs senior experience and network',
    })
  }

  // Unsure about business
  if (u.intent === 'unsure') {
    out.push({
      id: 'defer_business',
      title: 'Defer business — validate with employment or freelance first',
      why: 'You indicated business may not be right yet — validating income through freelance or side work is lower risk.',
      startupCost: 'Minimal',
      timeToRevenue: '2–6 weeks',
      revenuePotential: 'Depends on path chosen',
      confidence: 'High',
      type: 'primary',
      supported: true,
    })
  }

  return out
}

export function selectBusinessRecommendations(u: BusinessDiscoveryUnderstanding): {
  primary: BusinessModelRecommendation
  alternatives: BusinessModelRecommendation[]
  rejected: Array<{ title: string; reason: string }>
} {
  const evaluated = evaluateBusinessModels(u)
  const supported = evaluated.filter((e) => e.supported)
  const rejected = evaluated
    .filter((e) => !e.supported && e.type === 'rejected')
    .map((e) => ({ title: e.title, reason: e.rejectReason ?? 'Not supported by your evidence' }))

  const order = { High: 3, Moderate: 2, Lower: 1 }
  supported.sort((a, b) => order[b.confidence] - order[a.confidence])

  let primary = supported.find((s) => s.type === 'primary') ?? supported[0] ?? null
  if (!primary) {
    primary = { ...buildFallbackBusinessModel(u), supported: true, rejectReason: undefined }
  }
  const alternatives = supported.filter((s) => s.id !== primary?.id).slice(0, 3)

  const strip = (e: Evaluated): BusinessModelRecommendation => ({
    id: e.id,
    title: e.title,
    why: e.why,
    startupCost: e.startupCost,
    timeToRevenue: e.timeToRevenue,
    revenuePotential: e.revenuePotential,
    confidence: e.confidence,
    type: e.type,
  })

  return {
    primary: strip(primary as Evaluated),
    alternatives: alternatives.map(strip),
    rejected: rejected.slice(0, 5),
  }
}

export function ukRequirementsForModel(
  u: BusinessDiscoveryUnderstanding,
  modelId: string | undefined
): string[] {
  const reqs = ['Register as self-employed with HMRC when you start trading (or Ltd if appropriate)']
  if (!modelId) return reqs

  if (modelId.includes('barber') || modelId.includes('cleaning') || modelId.includes('food')) {
    reqs.push('Public liability insurance (typically required by clients and landlords)')
  }
  if (modelId.includes('barber')) {
    reqs.push('NVQ Level 2/3 barbering qualification expected by most chair rental shops')
    reqs.push('Local council planning if working from home')
  }
  if (modelId.includes('cleaning')) {
    reqs.push('DBS check often requested for domestic cleaning in homes with vulnerable residents')
  }
  if (modelId.includes('food')) {
    reqs.push('Food business registration with local council')
    reqs.push('Food hygiene rating / HACCP compliance')
  }
  if (modelId.includes('driver_phv')) {
    reqs.push('Private hire driver licence from local council')
    reqs.push('PHV vehicle licence and suitable insurance')
  }
  if (modelId.includes('software') || modelId.includes('consultancy') || modelId.includes('freelance')) {
    reqs.push('Professional indemnity insurance if advising or building for clients')
    reqs.push('ICO registration if processing personal data')
  }
  if (modelId.includes('care')) {
    reqs.push('DBS and relevant care registrations')
  }
  return [...new Set(reqs)]
}
