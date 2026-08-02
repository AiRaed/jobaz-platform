/**
 * Acceptance checks for JAZ Career Engine (rules/fallback path — no Ollama required).
 * Run: npx tsx scripts/verify-jaz-career-engine.ts
 */

import { buildFallbackBrainReasoning } from '../lib/jaz-career-engine/fallbackPlan'
import { applySafetyToReasoning, routeAllowsSia } from '../lib/jaz-career-engine/safetyRules'
import { buildJazAnalyseInputFromAnswers } from '../lib/jaz-career-engine/buildInputFromAnswers'
import { OLLAMA_ONLY_FEATURES, getTierFallbackChain, lookupFeatureTier } from '../lib/jobaz-ai/providers/featureModelMap'

type Case = {
  name: string
  skills: string[]
  answers?: Record<string, unknown>
  expect: {
    categoryIncludes?: RegExp
    workNowIncludes?: RegExp
    nextUpgradeIncludes?: RegExp
    noSia?: boolean
    allowSia?: boolean
    courseIncludes?: RegExp
  }
}

const cases: Case[] = [
  {
    name: 'Security extra income',
    skills: ['security'],
    expect: {
      categoryIncludes: /security/i,
      workNowIncludes: /steward|event|security/i,
      nextUpgradeIncludes: /sia|door/i,
      allowSia: true,
    },
  },
  {
    name: 'Online tutoring / languages',
    skills: ['languages'],
    expect: {
      categoryIncludes: /language|teach/i,
      workNowIncludes: /tutor|invigilat|customer|bilingual|study/i,
      courseIncludes: /tefl|english|safeguard|teaching|office|microsoft/i,
      noSia: true,
    },
  },
  {
    name: 'Accounting / admin finance',
    skills: ['administration'],
    answers: { interest: 'accounts assistant finance excel' },
    expect: {
      categoryIncludes: /admin|office/i,
      courseIncludes: /office|excel|customer|admin|digital/i,
      noSia: true,
    },
  },
  {
    name: 'Retail / customer service',
    skills: ['retail'],
    expect: {
      workNowIncludes: /retail|customer|sales/i,
      courseIncludes: /customer|retail/i,
      noSia: true,
    },
  },
  {
    name: 'Care route',
    skills: ['care'],
    expect: {
      workNowIncludes: /care|support/i,
      courseIncludes: /care|safeguard|handling|first\s*aid|medication/i,
      noSia: true,
    },
  },
  {
    name: 'Warehouse route',
    skills: ['warehouse'],
    expect: {
      workNowIncludes: /warehouse/i,
      courseIncludes: /manual|forklift|warehouse|handling/i,
      noSia: true,
    },
  },
  {
    name: 'Admin / office',
    skills: ['administration'],
    expect: {
      workNowIncludes: /admin|reception|customer|office|virtual|digital/i,
      courseIncludes: /office|excel|admin|customer|digital/i,
      noSia: true,
    },
  },
]

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function runCase(c: Case) {
  const input = buildJazAnalyseInputFromAnswers({
    goal: 'extra_income',
    answers: { side_skills: c.skills, ...(c.answers || {}) },
  })
  input.skills = c.skills

  const raw = buildFallbackBrainReasoning(input)
  const { reasoning, notes } = applySafetyToReasoning(raw)

  if (c.expect.categoryIncludes) {
    assert(
      c.expect.categoryIncludes.test(reasoning.route_category) ||
        c.expect.categoryIncludes.test(reasoning.route_title),
      `${c.name}: bad category ${reasoning.route_category}`
    )
  }
  if (c.expect.workNowIncludes) {
    assert(
      reasoning.work_now_roles.some((r) => c.expect.workNowIncludes!.test(r.title)),
      `${c.name}: work_now missing expected roles: ${reasoning.work_now_roles.map((r) => r.title).join(', ')}`
    )
  }
  if (c.expect.nextUpgradeIncludes) {
    assert(
      c.expect.nextUpgradeIncludes.test(reasoning.next_upgrade),
      `${c.name}: next_upgrade=${reasoning.next_upgrade}`
    )
  }
  if (c.expect.courseIncludes) {
    assert(
      reasoning.recommended_course_types.some((t) => c.expect.courseIncludes!.test(t.title)),
      `${c.name}: courses=${reasoning.recommended_course_types.map((t) => t.title).join(', ')}`
    )
  }
  if (c.expect.noSia) {
    assert(
      !reasoning.recommended_course_types.some((t) => /sia|door\s*supervisor/i.test(t.title)),
      `${c.name}: SIA in course types`
    )
    assert(!/sia|door\s*supervisor/i.test(reasoning.next_upgrade), `${c.name}: SIA next_upgrade`)
  }
  if (c.expect.allowSia) {
    assert(
      routeAllowsSia(reasoning.route_category, reasoning.route_title, reasoning.current_focus),
      `${c.name}: should allow SIA`
    )
  }

  void notes
  console.log(`✓ ${c.name} → ${reasoning.route_title} | next: ${reasoning.next_upgrade}`)
}

function verifyOpenAiExcluded() {
  for (const f of [
    'jaz-career-analyse',
    'uk-career-assistant',
    'career-brain-extract',
    'career-brain-recommend',
  ]) {
    assert(OLLAMA_ONLY_FEATURES.has(f), `${f} not in OLLAMA_ONLY_FEATURES`)
    assert(lookupFeatureTier(f) === 'local', `${f} tier should be local`)
    const chain = getTierFallbackChain('local', f)
    assert(chain.length === 1 && chain[0] === 'local', `${f} fallback chain must be local-only`)
  }
  console.log('✓ OpenAI excluded for Career Assistant / JAZ features')
}

async function main() {
  verifyOpenAiExcluded()
  for (const c of cases) runCase(c)
  console.log('\nAll JAZ Career Engine acceptance checks passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
