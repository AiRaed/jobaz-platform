/**
 * JAZ Business Discovery tests.
 * Run: npx tsx lib/career-brain/businessDiscovery/businessDiscoveryEngine.tests.ts
 */

import {
  pickNextBusinessDiscoveryQuestion,
  buildBusinessDiscoveryIntelligence,
  isBusinessDiscoveryQuestioningComplete,
} from './businessDiscoveryEngine'
import { pickNextDynamicBusinessQuestion } from './businessDiscoveryDynamicQuestions'
import type { CareerBrainState, CareerProfile } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function stateWith(answers: Record<string, unknown>): CareerBrainState {
  return {
    answers: { cb_user_goal: 'start_business', ...answers },
    career_brain_asked: Object.keys(answers).filter((k) => k.startsWith('biz_')),
  }
}

const profile = {
  domain: 'admin_business',
  constraints: [],
  transferableSkills: [],
} as unknown as CareerProfile

function runTests() {
  const first = pickNextBusinessDiscoveryQuestion(stateWith({}))
  assert(first.question?.id === 'biz_intent', `First question should be intent, got ${first.question?.id}`)

  const afterIdea = stateWith({ biz_intent: 'has_idea', biz_idea: 'Open a café in Bristol' })
  const cafePick = pickNextBusinessDiscoveryQuestion(afterIdea)
  const dynCafe = pickNextDynamicBusinessQuestion(cafePick.understanding)
  assert(
    !!dynCafe?.question.id.startsWith('biz_dyn_'),
    `Café idea should trigger dynamic question, got ${dynCafe?.question.id}`
  )
  assert(
    /café|cafe|coffee|kitchen|menu|food/i.test(dynCafe?.question.text ?? ''),
    `Dynamic café question should be industry-specific: ${dynCafe?.question.text}`
  )

  const barber = stateWith({
    biz_intent: 'has_idea',
    biz_idea: 'Open a barber shop in Manchester',
    biz_experience_level: '1_3_years',
    biz_dyn_regulatory: 'some',
    biz_skills: ['trade_craft', 'sales'],
    biz_capital: '1k_5k',
    biz_time: '20_40',
    biz_income_expectation: '2k_4k',
    biz_risk_tolerance: 'medium',
    biz_network: 'limited',
    biz_assets: ['tools'],
    biz_barber_experience: 'shop_exp',
    biz_barber_model: 'chair_rental',
    biz_barber_customers: 'occasional',
    biz_barber_obstacle: 'customers',
    biz_barber_equipment: 'yes',
    biz_barber_start_small: 'yes',
    biz_barber_uk_shop: 'yes_past',
    biz_barber_assets: ['tools', 'qualification', 'portfolio'],
    biz_demand_evidence: 'research',
    biz_competition_awareness: 'some',
    biz_first_revenue_timeline: '3_months',
  })

  assert(isBusinessDiscoveryQuestioningComplete(barber), 'Barber profile should complete')
  const intel = buildBusinessDiscoveryIntelligence(profile, barber)
  assert(intel !== null, 'Barber intelligence should build')
  const report = intel!.growth.finalReport
  assert(!!report.mostRealisticModel?.title, 'Must always recommend a business model')
  assert(!/insufficient evidence/i.test(report.verdictExplanation), 'Must not return insufficient evidence')
  assert(
    ['Strong Potential', 'Moderate Potential', 'Weak Potential'].includes(report.businessVerdict),
    'Must have verdict'
  )
  assert(!!report.whyThisVerdict, 'Must explain verdict')
  assert(report.first90DaysPlan.length >= 3, 'Must have 90-day plan')
  assert(!!report.fastestValidationPath, 'Must have validation path')
  assert(report.businessPotentialScore >= 15 && report.businessPotentialScore <= 100, 'Must have potential score')
  assert(report.scoreBreakdown.length >= 5, 'Must have score breakdown')
  assert(!!report.roadmap.longTermGoal, 'Must preserve long-term goal')
  assert(/own barber shop/i.test(report.roadmap.longTermGoal), 'Long-term goal must preserve user dream')
  assert(!!report.bestNextAction, 'Must have best next action')
  assert(!!report.riskAnalysis.cashFlowRisk.reason, 'Risks must include reasons')
  assert(report.first30DaysWeeks.length >= 4, 'Must have weekly 30-day plan')
  assert(report.growthPath.length >= 3, 'Must have growth path')
  const text = `${report.mostRealisticModel.title} ${intel!.growth.summary}`
  assert(/barber|chair rental/i.test(text), `Expected barber model: ${text}`)
  assert(!/saas|fantasy/i.test(text), 'Should not suggest unrelated models')

  const noExp = stateWith({
    biz_intent: 'has_idea',
    biz_idea: 'Restaurant',
    biz_experience_level: 'none',
    biz_skills: ['none_yet'],
    biz_capital: 'none',
    biz_time: 'under_10',
    biz_income_expectation: '1k_2k',
    biz_risk_tolerance: 'low',
    biz_network: 'none',
    biz_assets: ['none'],
    biz_demand_evidence: 'assumption',
    biz_competition_awareness: 'little',
    biz_first_revenue_timeline: '1_month',
  })

  const noIntel = buildBusinessDiscoveryIntelligence(profile, noExp)
  if (noIntel) {
    const primary = noIntel.growth.finalReport.mostRealisticModel?.id ?? ''
    assert(
      /experience_first|freelance|side_income|defer/.test(primary) ||
        Boolean(noIntel.growth.finalReport.notBusinessRecommendation),
      `No-experience restaurant should not jump to own restaurant: ${primary}`
    )
  }

  const developer = stateWith({
    biz_intent: 'has_idea',
    biz_idea: 'SaaS for small accountants',
    biz_experience_level: '3_plus_years',
    biz_skills: ['technical', 'marketing'],
    biz_capital: '1k_5k',
    biz_time: '10_20',
    biz_income_expectation: '4k_plus',
    biz_risk_tolerance: 'medium',
    biz_network: 'yes_network',
    biz_assets: ['computer', 'website'],
    biz_software_model: 'saas',
    biz_software_clients: 'niche',
    biz_demand_evidence: 'research',
    biz_competition_awareness: 'researched',
    biz_first_revenue_timeline: '6_months',
  })

  const devIntel = buildBusinessDiscoveryIntelligence(profile, developer)
  assert(devIntel !== null, 'Developer intelligence')
  const devText = devIntel!.recommendations.map((r) => r.title).join(' ')
  assert(/freelance|software|saas|consulting/i.test(devText), `Expected software paths: ${devText}`)

  console.log('✓ JAZ Business Discovery engine tests passed')
}

runTests()
