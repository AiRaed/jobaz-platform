/**
 * Live Career Intelligence — deterministic guidance signals from conversation state.
 * Powers the real-time sidebar without extra API calls.
 * Metrics are guidance indicators, not permanent judgments.
 */

export interface IntelligenceMetric {
  id: string
  label: string
  value: number
  display: string
  tone: 'violet' | 'cyan' | 'emerald' | 'amber' | 'blue' | 'rose'
  /** When true, show bar; when false, text-only guidance chip */
  showBar?: boolean
}

export interface LiveIntelligence {
  progress: number
  metrics: IntelligenceMetric[]
  detectedStrengths: string[]
  potentialPaths: string[]
  improvements: string[]
  emotionalNudge: string
  insightLine: string
  statusIndicators: { label: string; active: boolean; pulse?: boolean }[]
  nextSmartMove: { title: string; description: string; href: string }
  guidanceNote: string
}

const PATH_LABELS: Record<string, string> = {
  'warehouse-logistics': 'Warehouse & Logistics',
  warehouse_logistics: 'Warehouse & Logistics',
  cleaning: 'Cleaning & Facilities',
  'hospitality-front': 'Customer Service & Hospitality',
  hospitality_front: 'Customer Service & Hospitality',
  'care-support': 'Healthcare Assistant',
  care_support: 'Healthcare Assistant',
  'office-admin': 'Office & Admin Support',
  office_admin_support: 'Office & Admin Support',
  'driving-transport': 'Driving & Logistics',
  driving_transport: 'Driving & Logistics',
  'security-facilities': 'Security & Facilities',
  security_facilities: 'Security & Facilities',
  'construction-trades': 'Skilled Trades',
  construction_trades: 'Skilled Trades',
  'digital-ai-adjacent': 'IT & Digital Support',
  digital_ai_adjacent: 'IT & Digital Support',
  'maintenance-facilities': 'Maintenance & Facilities',
  maintenance_facilities: 'Maintenance & Facilities',
}

export const CAREER_PATH_PREVIEW = [
  {
    id: 'warehouse-logistics',
    title: 'Warehouse Path',
    salary: '£22k–£28k',
    demand: 'High demand',
    demandTone: 'emerald' as const,
    improvements: ['CV structure', 'Shift availability'],
    timeToReady: '2–4 weeks',
  },
  {
    id: 'hospitality-front',
    title: 'Customer Service Path',
    salary: '£21k–£26k',
    demand: 'Steady demand',
    demandTone: 'cyan' as const,
    improvements: ['Confidence in interviews', 'Customer-facing examples'],
    timeToReady: '3–6 weeks',
  },
  {
    id: 'driving-transport',
    title: 'Driving & Logistics',
    salary: '£24k–£32k',
    demand: 'Strong demand',
    demandTone: 'emerald' as const,
    improvements: ['Licence readiness', 'Route familiarity'],
    timeToReady: '4–8 weeks',
  },
  {
    id: 'care-support',
    title: 'Healthcare Assistant',
    salary: '£22k–£27k',
    demand: 'Growing sector',
    demandTone: 'violet' as const,
    improvements: ['DBS awareness', 'Care experience wording'],
    timeToReady: '4–8 weeks',
  },
  {
    id: 'digital-ai-adjacent',
    title: 'IT Support Path',
    salary: '£24k–£30k',
    demand: 'Rising demand',
    demandTone: 'blue' as const,
    improvements: ['Skills clarity', 'Beginner-friendly portfolio'],
    timeToReady: '6–12 weeks',
  },
  {
    id: 'construction-trades',
    title: 'Skilled Trades',
    salary: '£26k–£38k',
    demand: 'Skills shortage',
    demandTone: 'amber' as const,
    improvements: ['CSCS/training pathway', 'Hands-on examples'],
    timeToReady: '8–16 weeks',
  },
]

const THINKING_MESSAGES = [
  'Understanding your situation…',
  'Comparing with UK market trends…',
  'Finding realistic career options…',
  'Mapping strengths to UK sectors…',
  'Building your career profile…',
  'Checking suitable opportunities…',
]

const EMOTIONAL_NUDGES = [
  'You already have transferable strengths.',
  "You're closer to employable than you think.",
  'Small improvements can unlock better opportunities.',
  'Every answer helps JAZ understand your real potential.',
  'There are realistic UK paths that fit your situation.',
  'Your background matters — we are mapping it carefully.',
]

function readinessLabel(value: number): string {
  if (value < 35) return 'Early-stage profile'
  if (value < 55) return 'Building readiness'
  if (value < 75) return 'Growing profile'
  return 'Strong readiness'
}

function englishLabel(value: number): string {
  if (value < 45) return 'Support recommended'
  if (value < 70) return 'Functional level'
  return 'Strong for UK roles'
}

function burnoutLabel(value: number): string {
  if (value >= 65) return 'Take steady steps'
  if (value >= 40) return 'Moderate pace OK'
  return 'Good energy for progress'
}

function answerVal(answers: Record<string, unknown>, key: string): unknown {
  return answers[key]
}

function includesAny(val: unknown, tokens: string[]): boolean {
  const s = String(val ?? '').toLowerCase()
  return tokens.some((t) => s.includes(t))
}

function pathLabel(path: string | null | undefined): string {
  if (!path) return 'Analysing…'
  return PATH_LABELS[path] ?? path.replace(/[-_]/g, ' ')
}

export function getThinkingMessage(
  lastQuestionId: string | null | undefined,
  phase: string | undefined,
  stepIndex: number
): string {
  const idx = (stepIndex + (lastQuestionId?.length ?? 0)) % THINKING_MESSAGES.length
  const base = THINKING_MESSAGES[idx]
  if (phase === 'RESULT' || phase === 'result') return 'Building your personalised career plan…'
  if (lastQuestionId === 'language') return 'Evaluating communication fit for UK roles…'
  if (lastQuestionId === 'transport') return 'Checking travel-compatible job options…'
  if (lastQuestionId === 'experience_field') return 'Mapping your experience to UK sectors…'
  return base
}

function resolveNextSmartMove(
  answers: Record<string, unknown>,
  asked: number,
  hasResult: boolean
): { title: string; description: string; href: string } {
  if (hasResult) {
    return {
      title: 'Build your first CV',
      description: 'Turn your plan into a UK-ready CV before applying.',
      href: '/cv-builder-v2',
    }
  }
  if (asked < 3) {
    return {
      title: 'Continue the conversation',
      description: 'A few more answers help JAZ map Work Now and Build Next paths.',
      href: '#chat',
    }
  }
  const lang = answerVal(answers, 'language')
  if (lang === 'basic' || lang === 'poor') {
    return {
      title: 'Explore beginner-friendly roles',
      description: 'Roles with lower English pressure while you build confidence.',
      href: '/build-your-path',
    }
  }
  if (answerVal(answers, 'situation') === 'need_job_quickly') {
    return {
      title: 'Focus on Work Now options',
      description: 'Fast-hiring roles that can bring income while you plan ahead.',
      href: '/job-finder',
    }
  }
  if (!answerVal(answers, 'experience_field') && asked > 4) {
    return {
      title: 'Complete your profile',
      description: 'Add experience details so recommendations stay realistic.',
      href: '#chat',
    }
  }
  return {
    title: 'Keep answering — JAZ is learning',
    description: 'Your next smart move will appear as we understand your situation.',
    href: '#chat',
  }
}

export function deriveLiveIntelligence(
  state: {
    answers?: Record<string, unknown>
    phase?: string
    path?: string | null
    step_index?: number
    asked_question_ids?: string[]
    career_brain_result?: {
      employabilityScore?: number
      growCareerGrowth?: {
        promotionReadinessScore?: number
        jazConfidence?: number
        employabilityScore?: number
      }
    }
    career_profile?: {
      aiInsights?: {
        employabilityScore?: number
        strongestAreas?: string[]
        biggestRisks?: string[]
        recommendedSectors?: string[]
        recommendedPaths?: string[]
        urgencyLevel?: string
      }
      memorySnippets?: string[]
      profileCompleteness?: number
      ukReadiness?: { englishLevel?: string | null }
    }
  },
  resultDirections?: Array<{ direction_id: string; direction_title: string }>,
  hasResult = false
): LiveIntelligence {
  const answers = state.answers ?? {}
  const cp = state.career_profile
  const asked = state.asked_question_ids?.length ?? Object.keys(answers).length
  const progress = cp?.profileCompleteness
    ? Math.min(100, cp.profileCompleteness)
    : Math.min(100, Math.round((asked / 12) * 100))

  let englishConfidence = 55
  const lang = answerVal(answers, 'language')
  const cpLang = cp?.ukReadiness?.englishLevel
  if (lang === 'fluent' || lang === 'confident' || cpLang === 'fluent') englishConfidence = 88
  else if (lang === 'good' || cpLang === 'comfortable') englishConfidence = 72
  else if (lang === 'basic' || lang === 'poor' || cpLang === 'basic' || cpLang === 'functional') {
    englishConfidence = cpLang === 'functional' ? 52 : 42
  }

  const growGrowth = state.career_brain_result?.growCareerGrowth
  let careerReadiness = growGrowth?.promotionReadinessScore
    ? Math.min(100, growGrowth.promotionReadinessScore)
    : growGrowth?.jazConfidence
      ? Math.min(100, growGrowth.jazConfidence)
      : state.career_brain_result?.employabilityScore
        ? Math.min(100, state.career_brain_result.employabilityScore)
        : cp?.aiInsights?.employabilityScore
          ? Math.min(100, cp.aiInsights.employabilityScore)
          : answerVal(answers, 'cb_user_goal') === 'grow_career' && answerVal(answers, 'jaz_job_title')
            ? 58
            : 35 + asked * 5
  if (
    !growGrowth?.promotionReadinessScore &&
    !growGrowth?.jazConfidence &&
    !state.career_brain_result?.employabilityScore &&
    !cp?.aiInsights?.employabilityScore
  ) {
    if (answerVal(answers, 'experience_field')) careerReadiness += 12
    if (answerVal(answers, 'education_level')) careerReadiness += 8
    careerReadiness = Math.min(92, careerReadiness)
  }

  let recruiterPotential = 40 + asked * 4
  if (answerVal(answers, 'strengths') || answerVal(answers, 'transferable_strengths')) {
    recruiterPotential += 15
  }
  if (answerVal(answers, 'people_comfort') === 'comfortable') recruiterPotential += 8
  recruiterPotential = Math.min(90, recruiterPotential)

  const ukJobMatch = Math.min(95, 30 + asked * 6 + (state.path ? 15 : 0))

  let interviewConfidence = 30 + asked * 3
  if (answerVal(answers, 'people_comfort') === 'comfortable') interviewConfidence += 20
  if (lang === 'fluent' || lang === 'good') interviewConfidence += 15
  interviewConfidence = Math.min(90, interviewConfidence)

  let stabilityPotential = 45 + asked * 3
  if (answerVal(answers, 'training_openness') === 'yes_short') stabilityPotential += 12
  if (includesAny(answerVal(answers, 'experience_field'), ['admin', 'office', 'care'])) {
    stabilityPotential += 10
  }
  stabilityPotential = Math.min(92, stabilityPotential)

  let learningSpeed = 50 + asked * 2
  if (answerVal(answers, 'training_openness') === 'yes_short') learningSpeed += 18
  if (answerVal(answers, 'education_level')) learningSpeed += 8
  learningSpeed = Math.min(95, learningSpeed)

  let burnoutRisk = 25
  if (answerVal(answers, 'stress_level') === 'high' || answerVal(answers, 'burnout') === 'yes') {
    burnoutRisk = 72
  } else if (answerVal(answers, 'situation') === 'need_job_quickly') {
    burnoutRisk = 48
  }

  let communicationStrength = englishConfidence
  if (answerVal(answers, 'people_comfort') === 'comfortable') communicationStrength += 12
  communicationStrength = Math.min(95, communicationStrength)

  const workReadiness = Math.round((careerReadiness + ukJobMatch + recruiterPotential) / 3)

  const detectedStrengths: string[] = cp?.aiInsights?.strongestAreas?.length
    ? [...cp.aiInsights.strongestAreas]
    : []
  if (answerVal(answers, 'people_comfort') === 'comfortable') {
    detectedStrengths.push('Customer communication potential')
  }
  if (includesAny(answerVal(answers, 'experience_field'), ['warehouse', 'logistics', 'driving'])) {
    detectedStrengths.push('Practical hands-on experience')
  }
  if (includesAny(answerVal(answers, 'strengths'), ['reliable', 'team', 'hard'])) {
    detectedStrengths.push('Reliability & teamwork signals')
  }
  if (answerVal(answers, 'training_openness') === 'yes_short') {
    detectedStrengths.push('Open to short training pathways')
  }
  if (answerVal(answers, 'language') === 'basic') {
    detectedStrengths.push('Beginner-friendly role compatibility')
  }
  if (includesAny(answerVal(answers, 'experience_field'), ['office', 'admin'])) {
    detectedStrengths.push('Office & admin pathway potential')
  }
  if (detectedStrengths.length === 0 && asked > 0) {
    detectedStrengths.push('Motivation to find the right fit')
  }

  const improvements: string[] = cp?.aiInsights?.biggestRisks?.length
    ? cp.aiInsights.biggestRisks.map((r) => `Address: ${r}`)
    : []
  if (lang === 'basic' || lang === 'poor') improvements.push('Workplace English support')
  if (!answerVal(answers, 'experience_field') && asked > 3) improvements.push('Clearer CV structure')
  if (answerVal(answers, 'people_comfort') === 'avoid') improvements.push('Low customer-pressure roles')
  if (answerVal(answers, 'training_openness') === 'no') improvements.push('Entry routes without long courses')
  if (burnoutRisk >= 65) improvements.push('Steady pace — avoid overload')
  if (improvements.length === 0) improvements.push('Interview presentation polish')

  const potentialPaths: string[] = []
  const growCareer = (state.career_brain_result as { growCareerGrowth?: { promotionRoadmap?: { workNow?: string; buildNext?: string; longTerm?: string } } } | undefined)?.growCareerGrowth
  if (growCareer?.promotionRoadmap) {
    potentialPaths.push(
      growCareer.promotionRoadmap.workNow ?? '',
      growCareer.promotionRoadmap.buildNext ?? '',
      growCareer.promotionRoadmap.longTerm ?? ''
    )
  } else if (resultDirections?.length) {
    resultDirections.slice(0, 4).forEach((d) => potentialPaths.push(d.direction_title))
  } else if (answerVal(answers, 'cb_user_goal') === 'grow_career' && answerVal(answers, 'jaz_job_title')) {
    potentialPaths.push(String(answerVal(answers, 'jaz_job_title')))
    if (answerVal(answers, 'jaz_edu_progression')) {
      potentialPaths.push(String(answerVal(answers, 'jaz_edu_progression')).replace(/_/g, ' '))
    }
  } else if (state.path) {
    potentialPaths.push(pathLabel(state.path))
  } else {
    const exp = String(answerVal(answers, 'experience_field') ?? answerVal(answers, 'jaz_job_title') ?? '')
    if (includesAny(exp, ['warehouse', 'logistics'])) potentialPaths.push('Warehouse & Logistics')
    if (includesAny(exp, ['hospitality', 'retail', 'customer'])) potentialPaths.push('Customer Service')
    if (includesAny(exp, ['care', 'health', 'nurse', 'teach'])) potentialPaths.push('Healthcare / Education')
    if (includesAny(exp, ['office', 'admin'])) potentialPaths.push('Administration')
    if (answerVal(answers, 'driving_interest') === 'yes') potentialPaths.push('Driving & Logistics')
    if (potentialPaths.length === 0 && answerVal(answers, 'cb_user_goal') !== 'grow_career') {
      potentialPaths.push('Warehouse & Logistics', 'Customer Support', 'Hospitality')
    }
  }

  const metrics: IntelligenceMetric[] = [
    {
      id: 'readiness',
      label: 'Career readiness',
      value: careerReadiness,
      display: readinessLabel(careerReadiness),
      tone: 'amber',
    },
    {
      id: 'uk_match',
      label: 'UK job match',
      value: ukJobMatch,
      display: readinessLabel(ukJobMatch),
      tone: 'emerald',
    },
    {
      id: 'english',
      label: 'English confidence',
      value: englishConfidence,
      display: englishLabel(englishConfidence),
      tone: 'blue',
    },
    {
      id: 'interview',
      label: 'Interview confidence',
      value: interviewConfidence,
      display: readinessLabel(interviewConfidence),
      tone: 'violet',
    },
    {
      id: 'recruiter',
      label: 'Recruiter potential',
      value: recruiterPotential,
      display: readinessLabel(recruiterPotential),
      tone: 'cyan',
    },
    {
      id: 'stability',
      label: 'Stability potential',
      value: stabilityPotential,
      display: readinessLabel(stabilityPotential),
      tone: 'emerald',
    },
    {
      id: 'learning',
      label: 'Learning speed',
      value: learningSpeed,
      display: readinessLabel(learningSpeed),
      tone: 'blue',
    },
    {
      id: 'communication',
      label: 'Communication strength',
      value: communicationStrength,
      display: englishLabel(communicationStrength),
      tone: 'violet',
    },
    {
      id: 'work_ready',
      label: 'Work readiness',
      value: workReadiness,
      display: readinessLabel(workReadiness),
      tone: 'cyan',
    },
    {
      id: 'burnout',
      label: 'Burnout risk',
      value: burnoutRisk,
      display: burnoutLabel(burnoutRisk),
      tone: burnoutRisk >= 55 ? 'rose' : 'emerald',
    },
  ]

  const phase = state.phase ?? 'CLASSIFY'
  const nudgeIdx = asked % EMOTIONAL_NUDGES.length

  let insightLine = 'Learning your situation…'
  if (asked >= 2) insightLine = 'Building a clearer picture of your UK options…'
  if (asked >= 5) insightLine = `Detected: ${detectedStrengths.slice(0, 2).join(' · ')}`
  if (asked >= 8 || hasResult) {
    insightLine = `Possible pathways: ${potentialPaths.slice(0, 3).join(' · ')}`
  }

  return {
    progress,
    metrics,
    detectedStrengths: detectedStrengths.slice(0, 4),
    potentialPaths: potentialPaths.slice(0, 4),
    improvements: improvements.slice(0, 3),
    emotionalNudge: EMOTIONAL_NUDGES[nudgeIdx],
    insightLine,
    statusIndicators: [
      { label: 'Career Intelligence Active', active: true, pulse: true },
      { label: 'Learning Your Situation', active: asked > 0, pulse: asked > 0 && asked < 10 },
      { label: 'UK Market Analysis Ready', active: asked >= 3 || phase === 'PATH' || phase === 'RESULT' },
    ],
    nextSmartMove: resolveNextSmartMove(answers, asked, hasResult),
    guidanceNote: 'These insights improve as we learn more about you. They guide — they do not define you.',
  }
}
