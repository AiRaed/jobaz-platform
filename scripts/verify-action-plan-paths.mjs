import { buildCareerActionPlan } from '../lib/career-journey/buildActionPlan.ts'

const scenarios = [
  {
    name: 'Start New Career',
    brain: {
      careerChangeTransition: {
        targetRole: 'Marketing Coordinator',
        transitionReadinessScore: 62,
        estimatedTimeline: '8–16 weeks',
      },
      recommendedPaths: {
        workNow: [{ title: 'Marketing Assistant', why: 'Entry route' }],
      },
      recommendedCourses: ['Digital Marketing Fundamentals'],
    },
  },
  {
    name: 'Grow Career',
    brain: {
      growCareerGrowth: {
        promotionReadinessScore: 71,
        nextRealisticStep: { label: 'Senior Engineer', timeline: '3–9 months' },
        finalReport: { careerReasoning: 'Strong technical base with leadership potential.' },
      },
      recommendedPaths: {
        workNow: [{ title: 'Senior Mechanical Engineer', why: 'Natural promotion path' }],
      },
    },
  },
  {
    name: 'Side Income',
    brain: {
      sideIncomeGrowth: { confidence: 68, summary: 'Flexible evening/weekend options.' },
      recommendedPaths: {
        workNow: [{ title: 'Freelance Writer', why: 'Matches writing skills' }],
      },
    },
  },
  {
    name: 'Start Business',
    brain: {
      businessDiscoveryGrowth: {
        finalReport: {
          businessPotentialScore: 74,
          verdictExplanation: 'E-commerce model fits your capital and time constraints.',
          mostRealisticModel: { title: 'Online shop', revenuePotential: '£1k–£3k/month' },
          businessIdeaLabel: 'Online shop',
          roadmap: { longTermGoal: 'Profitable e-commerce brand' },
        },
      },
    },
  },
]

let passed = 0

for (const s of scenarios) {
  const plan = buildCareerActionPlan({
    result: {
      summary: s.name,
      work_now: { directions: [{ direction_id: 'test', direction_title: 'Test role', why: 'test' }] },
      improve_later: { directions: [] },
      avoid: [],
      career_brain: s.brain,
    },
    brain: s.brain,
    isGuest: false,
  })

  const workNow = plan.tiers.find((t) => t.id === 'work_now')
  const longTerm = plan.tiers.find((t) => t.id === 'long_term')
  const ok = Boolean(plan.headline) && plan.missions.length === 4 && (longTerm?.timeline?.length ?? 0) >= 1

  if (ok) passed += 1

  console.log(`\n=== ${s.name} ${ok ? 'PASS' : 'FAIL'} ===`)
  console.log('Headline:', plan.headline)
  console.log('Work Now items:', workNow?.jobs?.length ?? workNow?.items?.length ?? 0)
  console.log('Timeline steps:', longTerm?.timeline?.length ?? 0)
  console.log('Missions:', plan.missions.map((m) => m.label).join(' | '))
}

console.log(`\n${passed}/${scenarios.length} scenarios passed`)
process.exit(passed === scenarios.length ? 0 : 1)
