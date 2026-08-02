import type { CareerPath } from '@/lib/career-paths'
import type {
  PathIntelligence,
  PathMatch,
  QuickQuestion,
  UserPathProfile,
} from './types'

const RELATED: Record<string, string[]> = {
  'translator-interpreter': ['care-support', 'office-admin', 'teaching-support', 'hospitality-front'],
  electrician: ['construction-trades', 'maintenance-facilities', 'plumbing-handyman', 'self-employed-freelance'],
  'plumbing-handyman': ['maintenance-facilities', 'construction-trades', 'electrician', 'self-employed-freelance'],
  'driving-transport': ['warehouse-logistics', 'cleaner', 'security-facilities', 'self-employed-freelance'],
  'security-facilities': ['cleaner', 'maintenance-facilities', 'warehouse-logistics', 'driving-transport'],
  'care-support': ['teaching-support', 'translator-interpreter', 'hospitality-front', 'office-admin'],
  'office-admin': ['digital-ai-beginner', 'care-support', 'hospitality-front', 'teaching-support'],
  'digital-ai-beginner': ['office-admin', 'self-employed-freelance', 'warehouse-logistics', 'teaching-support'],
  'construction-trades': ['electrician', 'plumbing-handyman', 'maintenance-facilities', 'warehouse-logistics'],
  cleaner: ['hospitality-front', 'warehouse-logistics', 'care-support', 'security-facilities'],
  'warehouse-logistics': ['driving-transport', 'cleaner', 'security-facilities', 'construction-trades'],
  'hospitality-front': ['cleaner', 'care-support', 'warehouse-logistics', 'office-admin'],
  'teaching-support': ['care-support', 'office-admin', 'translator-interpreter', 'hospitality-front'],
  'maintenance-facilities': ['electrician', 'plumbing-handyman', 'construction-trades', 'security-facilities'],
  'self-employed-freelance': ['digital-ai-beginner', 'translator-interpreter', 'plumbing-handyman', 'office-admin'],
}

const SALARY: Record<string, PathIntelligence['salary']> = {
  'translator-interpreter': {
    starting: '£22k–26k',
    experienced: '£35k+',
    note: 'Freelance and remote opportunities available',
    levels: [
      { label: 'Entry', range: '£18k–24k' },
      { label: 'Mid', range: '£25k–32k' },
      { label: 'Advanced', range: '£35k–45k+' },
    ],
  },
  'warehouse-logistics': {
    starting: '£22k–25k',
    experienced: '£30k+',
    levels: [
      { label: 'Entry', range: '£21k–24k' },
      { label: 'Mid', range: '£25k–28k' },
      { label: 'Advanced', range: '£30k–35k' },
    ],
  },
  'care-support': {
    starting: '£21k–24k',
    experienced: '£28k+',
    note: 'Shift premiums and NHS roles can pay more',
    levels: [
      { label: 'Entry', range: '£20k–23k' },
      { label: 'Mid', range: '£24k–27k' },
      { label: 'Advanced', range: '£28k–32k' },
    ],
  },
  electrician: {
    starting: '£24k–28k (apprentice/trainee)',
    experienced: '£40k+',
    note: 'Self-employed electricians often earn more',
    levels: [
      { label: 'Trainee', range: '£20k–26k' },
      { label: 'Qualified', range: '£32k–40k' },
      { label: 'Experienced', range: '£45k–60k+' },
    ],
  },
}

const PEOPLE_LIKE_YOU: Record<string, string[]> = {
  'translator-interpreter': [
    'Volunteer translation for community groups',
    'NHS support and multilingual patient services',
    'Community interpreting (Level 3 route)',
    'Customer support roles using language skills',
  ],
  'warehouse-logistics': [
    'Warehouse operative (no experience)',
    'Picker/packer with agency work',
    'Delivery helper before full driving roles',
    'Night-shift logistics for faster hiring',
  ],
  'care-support': [
    'Care home support worker',
    'Home care assistant (employer training)',
    'Hospital porter or ward support',
    'Community support volunteer first',
  ],
  cleaner: [
    'Office or school cleaning (evenings)',
    'Hotel housekeeping starter roles',
    'Agency cleaning for flexible hours',
    'Domestic cleaning while building references',
  ],
  'office-admin': [
    'Reception or front desk assistant',
    'Data entry with basic IT skills',
    'Temporary admin via agencies',
    'Customer service before full admin',
  ],
}

const TIMELINE: Record<string, PathIntelligence['timeline']> = {
  'translator-interpreter': [
    { period: 'Week 1', milestone: 'Improve workplace English and research Level 3 routes' },
    { period: 'Month 1', milestone: 'Start introduction to interpreting course' },
    { period: 'Month 2', milestone: 'Complete Level 3 community interpreting training' },
    { period: 'Month 4', milestone: 'Begin applying for entry-level interpreting roles' },
    { period: 'Month 6', milestone: 'Build specialisation (health, legal, or business)' },
  ],
  'warehouse-logistics': [
    { period: 'Week 1', milestone: 'Create a simple CV and register with 2–3 agencies' },
    { period: 'Month 1', milestone: 'Apply daily and complete any free safety inductions' },
    { period: 'Month 2', milestone: 'Secure first warehouse or logistics role' },
    { period: 'Month 4', milestone: 'Gain forklift or team-leader experience if available' },
    { period: 'Month 6', milestone: 'Move toward supervisor or specialist logistics roles' },
  ],
}

const FEED: Record<string, PathIntelligence['feedOpportunities']> = {
  'translator-interpreter': [
    {
      id: 'f1',
      type: 'course',
      title: 'Free interpreting intro sessions in Manchester',
      location: 'Manchester',
      timeAgo: '2d ago',
    },
    {
      id: 'f2',
      type: 'event',
      title: 'NHS multilingual hiring open day',
      location: 'Leeds',
      timeAgo: '5d ago',
    },
    {
      id: 'f3',
      type: 'story',
      title: 'Ahmed started with volunteer translation — now NHS interpreter',
      timeAgo: '1w ago',
    },
    {
      id: 'f4',
      type: 'funding',
      title: 'Adult Skills Fund courses open for Level 3 interpreting',
      timeAgo: '3d ago',
    },
  ],
}

function defaultSalary(path: CareerPath): PathIntelligence['salary'] {
  return (
    SALARY[path.id] ?? {
      starting: '£21k–25k',
      experienced: '£28k–35k',
      note: 'Varies by region, employer, and experience',
      levels: [
        { label: 'Entry', range: '£20k–24k' },
        { label: 'Mid', range: '£25k–30k' },
        { label: 'Advanced', range: '£32k+' },
      ],
    }
  )
}

function defaultTimeline(path: CareerPath): PathIntelligence['timeline'] {
  if (TIMELINE[path.id]) return TIMELINE[path.id]
  const time = path.realityCheck.timeToReady
  return [
    { period: 'Week 1', milestone: 'Research requirements and check funding options' },
    { period: 'Month 1', milestone: `Start first short course or certificate (${path.requirements.shortCourses[0] ?? 'starter training'})` },
    { period: 'Month 2–3', milestone: 'Complete core training and build basic portfolio or references' },
    { period: 'Month 4', milestone: 'Begin applying for entry-level roles in this field' },
    { period: 'Month 6+', milestone: `Target job-ready status (${time})` },
  ]
}

function inferEnglishLevel(path: CareerPath): 'low' | 'medium' | 'high' {
  const lang = path.requirements.languageLevel?.toLowerCase() ?? ''
  if (lang.includes('native') || lang.includes('c1') || lang.includes('c2')) return 'high'
  if (lang.includes('b1') || lang.includes('b2') || lang.includes('functional')) return 'medium'
  if (lang.includes('basic') || lang.includes('esol')) return 'low'
  return 'medium'
}

function inferDifficulty(path: CareerPath): 'low' | 'medium' | 'high' {
  const certs = path.requirements.certificates.length + path.requirements.licences.length
  if (path.needsDegree === 'yes' || certs >= 3) return 'high'
  if (certs >= 1 || path.requirements.shortCourses.length >= 4) return 'medium'
  return 'low'
}

function inferFastStart(path: CareerPath): 'yes' | 'no' {
  const fastPaths = ['cleaner', 'warehouse-logistics', 'hospitality-front', 'security-facilities', 'driving-transport']
  return fastPaths.includes(path.id) ? 'yes' : 'no'
}

function defaultRealityMetrics(path: CareerPath): PathIntelligence['realityMetrics'] {
  const english = inferEnglishLevel(path)
  const difficulty = inferDifficulty(path)
  const fast = inferFastStart(path)
  const flexible = ['driving-transport', 'hospitality-front', 'cleaner', 'self-employed-freelance', 'translator-interpreter'].includes(path.id)
  const stress = ['care-support', 'translator-interpreter', 'security-facilities', 'hospitality-front'].includes(path.id) ? 'medium' : 'low'

  return [
    { id: 'difficulty', label: 'Difficulty', level: difficulty, display: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
    { id: 'english', label: 'English required', level: english, display: english === 'high' ? 'High' : english === 'medium' ? 'Medium' : 'Basic+' },
    { id: 'fast', label: 'Fast to start', level: fast, display: fast === 'yes' ? 'Yes' : 'No' },
    { id: 'flex', label: 'Flexible hours', level: flexible ? 'medium' : 'low', display: flexible ? 'Medium–High' : 'Low–Medium' },
    { id: 'stress', label: 'Stress level', level: stress, display: stress.charAt(0).toUpperCase() + stress.slice(1) },
  ]
}

function defaultPeopleLikeYou(path: CareerPath): string[] {
  if (PEOPLE_LIKE_YOU[path.id]) return PEOPLE_LIKE_YOU[path.id]
  return [
    `Entry-level ${path.title.toLowerCase()} roles`,
    'Agency or temp work to build UK references',
    'Volunteer or part-time while training',
    'Related support roles in the same sector',
  ]
}

function defaultFeed(path: CareerPath): PathIntelligence['feedOpportunities'] {
  return (
    FEED[path.id] ?? [
      {
        id: 'gen1',
        type: 'funding',
        title: `Adult Skills Fund courses for ${path.title}`,
        timeAgo: 'This week',
      },
      {
        id: 'gen2',
        type: 'story',
        title: `Community member landed first ${path.title.toLowerCase()} role after 3 months`,
        timeAgo: '4d ago',
      },
      {
        id: 'gen3',
        type: 'course',
        title: 'National Careers Service — find courses near you',
        location: 'UK-wide',
        timeAgo: 'Updated daily',
      },
    ]
  )
}

function defaultGuideInsights(path: CareerPath, profile: UserPathProfile): PathIntelligence['guideInsights'] {
  const insights: PathIntelligence['guideInsights'] = []

  if (profile.multilingual && path.id === 'translator-interpreter') {
    insights.push({ text: 'Strong multilingual potential for this path' })
  }
  if (profile.communicationSkills || profile.multilingual) {
    insights.push({ text: 'Good fit for communication-based roles' })
  }
  if (!profile.hasUkCertification && path.requirements.certificates.length > 0) {
    insights.push({ text: `You may need ${path.requirements.certificates[0]}` })
  }
  if (path.requirements.languageLevel) {
    insights.push({ text: `Language expectation: ${path.requirements.languageLevel}` })
  }
  if (insights.length === 0) {
    insights.push({ text: `No degree required — practical training path` })
    insights.push({ text: `Typical readiness: ${path.realityCheck.timeToReady}` })
  }
  return insights.slice(0, 4)
}

function defaultQuickQuestions(path: CareerPath): QuickQuestion[] {
  const english = inferEnglishLevel(path)
  const fast = inferFastStart(path)
  const salary = defaultSalary(path)

  return [
    {
      question: 'Is this beginner friendly?',
      answer:
        path.needsDegree === 'no'
          ? `Yes — this path does not require a university degree. Most people start with ${path.requirements.shortCourses[0] ?? 'short courses'} and build up.`
          : 'It can be, but check degree requirements carefully for your target role.',
    },
    {
      question: 'What salary can I expect?',
      answer: `Entry-level roles often start around ${salary.starting}. With experience, ${salary.experienced} is realistic in many UK regions.`,
    },
    {
      question: 'Can I start without experience?',
      answer:
        fast === 'yes'
          ? 'Many employers hire without prior UK experience — reliability and availability matter most at the start.'
          : 'Some experience or training is usually expected, but starter courses and apprenticeships exist for newcomers.',
    },
    {
      question: 'Is English important?',
      answer:
        english === 'high'
          ? `Yes — ${path.requirements.languageLevel ?? 'strong English is important for this path'}.`
          : english === 'medium'
            ? 'Functional workplace English helps. Many employers accept B1/B2 level if you are willing to improve.'
            : 'Basic English can be enough to start, but improving workplace English will open more opportunities.',
    },
    {
      question: 'What jobs can this lead to?',
      answer: `This path can lead to ${path.title} roles and related positions in the same sector. Typical time to become job-ready: ${path.realityCheck.timeToReady}.`,
    },
  ]
}

export function getPathIntelligence(path: CareerPath, profile: UserPathProfile): PathIntelligence {
  return {
    salary: defaultSalary(path),
    timeline: defaultTimeline(path),
    relatedPathIds: RELATED[path.id] ?? CAREER_PATH_IDS.filter((id) => id !== path.id).slice(0, 4),
    peopleLikeYouStarts: defaultPeopleLikeYou(path),
    realityMetrics: defaultRealityMetrics(path),
    feedOpportunities: defaultFeed(path),
    guideInsights: defaultGuideInsights(path, profile),
    quickQuestions: defaultQuickQuestions(path),
  }
}

const CAREER_PATH_IDS = [
  'translator-interpreter', 'electrician', 'plumbing-handyman', 'driving-transport',
  'security-facilities', 'care-support', 'office-admin', 'digital-ai-beginner',
  'construction-trades', 'cleaner', 'warehouse-logistics', 'hospitality-front',
  'teaching-support', 'maintenance-facilities', 'self-employed-freelance',
]

export function computePathMatch(path: CareerPath, profile: UserPathProfile): PathMatch {
  let score = 62
  const signals: PathMatch['signals'] = []

  if (profile.hasAssessment) score += 8

  if (profile.multilingual) {
    score += path.id === 'translator-interpreter' ? 18 : 6
    signals.push({ type: 'positive', text: 'Multilingual background' })
  }

  if (profile.communicationSkills || profile.multilingual) {
    score += 5
    signals.push({ type: 'positive', text: 'Communication skills' })
  }

  if (profile.strongEnglish) {
    score += 4
    signals.push({ type: 'positive', text: 'Workplace English foundation' })
  } else if (inferEnglishLevel(path) === 'high') {
    score -= 6
    signals.push({ type: 'warning', text: 'Needs stronger English confidence' })
  }

  if (profile.hasUkCertification) {
    score += 10
    signals.push({ type: 'positive', text: 'Relevant UK certification progress' })
  } else if (path.requirements.certificates.length > 0) {
    score -= 4
    signals.push({ type: 'warning', text: 'No UK certification yet' })
  }

  if (profile.newcomer && inferFastStart(path) === 'yes') {
    score += 5
    signals.push({ type: 'positive', text: 'Fast-entry path for newcomers' })
  }

  if (path.needsDegree === 'no') {
    signals.push({ type: 'positive', text: 'No university degree required' })
  }

  if (signals.length < 3) {
    signals.push({ type: 'neutral', text: `Typical readiness: ${path.realityCheck.timeToReady}` })
  }

  const clamped = Math.min(96, Math.max(48, score))
  const readinessRange = path.realityCheck.timeToReady.replace(/\(.*\)/, '').trim() || '4–8 months'

  return {
    score: clamped,
    signals: signals.slice(0, 5),
    readinessRange,
    hasPersonalization: profile.hasAssessment || profile.isLoggedIn,
  }
}

export function answerGuideQuestion(path: CareerPath, question: string, intelligence: PathIntelligence): string {
  const q = question.toLowerCase().trim()
  const match = intelligence.quickQuestions.find(
    (item) => item.question.toLowerCase() === q || q.includes(item.question.toLowerCase().slice(0, 12))
  )
  if (match) return match.answer

  if (q.includes('salary') || q.includes('pay') || q.includes('earn')) {
    return `Starting roles often pay ${intelligence.salary.starting}. Experienced workers can reach ${intelligence.salary.experienced}. ${intelligence.salary.note ?? ''}`.trim()
  }
  if (q.includes('english')) {
    return path.requirements.languageLevel
      ? `For ${path.title}, employers typically expect: ${path.requirements.languageLevel}. Improving workplace English always helps applications and interviews.`
      : 'Workplace English matters for most UK roles. Even basic improvement in applications and interviews makes a big difference.'
  }
  if (q.includes('beginner') || q.includes('experience')) {
    return intelligence.quickQuestions.find((x) => x.question.includes('beginner'))?.answer ?? intelligence.quickQuestions[2].answer
  }

  return `For ${path.title}: ${path.description} Typical time to job-ready is ${path.realityCheck.timeToReady}. Ask one of the suggested questions for a detailed answer.`
}

export const TRACKED_PATHS_KEY = 'jobaz_tracked_paths_v1'

export function getTrackedPathIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TRACKED_PATHS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function trackPathLocally(pathId: string): void {
  if (typeof window === 'undefined') return
  const existing = getTrackedPathIds()
  if (existing.includes(pathId)) return
  localStorage.setItem(TRACKED_PATHS_KEY, JSON.stringify([pathId, ...existing]))
}

export function inferCourseMeta(course: CareerPath['courses'][0]): {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  format: 'Online' | 'In-person' | 'Mixed'
  beginnerFriendly: boolean
  official: boolean
} {
  const type = course.type.toLowerCase()
  const duration = course.duration.toLowerCase()
  const difficulty: 'Beginner' | 'Intermediate' | 'Advanced' =
    type.includes('introduction') || type.includes('starter') || type.includes('short')
      ? 'Beginner'
      : type.includes('level 3') || type.includes('diploma') || type.includes('nvq')
        ? 'Advanced'
        : 'Intermediate'
  const format: 'Online' | 'In-person' | 'Mixed' =
    type.includes('online') || course.funding.toLowerCase().includes('online') ? 'Online' : 'In-person'
  const beginnerFriendly = difficulty === 'Beginner' || type.includes('introduction')
  const official =
    course.sourceType === 'GOV.UK' ||
    course.sourceType === 'National Careers Service' ||
    course.sourceType === 'Professional Body' ||
    type.includes('college') ||
    type.includes('level')

  return { difficulty, format, beginnerFriendly, official }
}
