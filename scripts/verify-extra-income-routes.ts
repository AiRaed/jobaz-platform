/**
 * Acceptance checks for route-first Extra Income career reasoning.
 */
import { buildExtraIncomeResult } from '../lib/career-engine/extra-income/decisionEngine'
import { mapCareerCoachResultToPlan } from '../lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { isSiaDoorTitle } from '../lib/dashboard/careerOs/myPlanDisplayFilter'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

function runCase(
  name: string,
  skills: string,
  expect: {
    siaPrimary?: boolean
    trainingIncludes?: RegExp
    trainingExcludesSia?: boolean
    firstAidNotPrimary?: boolean
    focusIncludes?: RegExp
    upgradeIncludes?: RegExp
  }
) {
  const result = buildExtraIncomeResult({
    side_profile: 'employed_full',
    side_hours: '10_20',
    side_schedule: 'evenings_weekends',
    side_income_goal: '500_1000',
    side_skills: skills,
  })
  const plan = mapCareerCoachResultToPlan(result)
  assert(plan, `${name}: plan missing`)
  const training = plan!.training_next?.title ?? ''
  const upgrade = plan!.route_summary.next_upgrade_role ?? ''
  const focus = plan!.route_summary.current_target_role ?? ''
  const routeTitle = plan!.route_summary.route_title ?? ''

  if (expect.siaPrimary) {
    assert(
      isSiaDoorTitle(training) || /door\s*supervisor/i.test(upgrade),
      `${name}: expected SIA/Door next (got ${training} / ${upgrade})`
    )
  }
  if (expect.trainingExcludesSia) {
    assert(!isSiaDoorTitle(training), `${name}: SIA must not be primary training (${training})`)
    assert(
      !/door\s*supervisor/i.test(upgrade),
      `${name}: Door Supervisor must not be next upgrade (${upgrade})`
    )
  }
  if (expect.firstAidNotPrimary) {
    assert(!/first\s*aid/i.test(training), `${name}: First Aid must not be primary (${training})`)
  }
  if (expect.trainingIncludes) {
    assert(
      expect.trainingIncludes.test(training),
      `${name}: expected training ${expect.trainingIncludes} (got ${training})`
    )
  }
  if (expect.focusIncludes) {
    assert(expect.focusIncludes.test(focus), `${name}: expected focus ${expect.focusIncludes} (got ${focus})`)
  }
  if (expect.upgradeIncludes) {
    assert(
      expect.upgradeIncludes.test(upgrade),
      `${name}: expected upgrade ${expect.upgradeIncludes} (got ${upgrade})`
    )
  }

  console.log(`OK ${name}`)
  console.log(`  route: ${routeTitle}`)
  console.log(`  focus: ${focus}`)
  console.log(`  upgrade: ${upgrade}`)
  console.log(`  training: ${training} (${plan!.training_next?.type})`)
}

runCase('Security', 'security', {
  siaPrimary: true,
  focusIncludes: /steward|event/i,
})

runCase('Retail', 'retail,customer_service', {
  trainingExcludesSia: true,
  firstAidNotPrimary: true,
  trainingIncludes: /customer\s*service|retail|food/i,
  focusIncludes: /retail|sales|customer|stock/i,
})

runCase('Customer Service', 'customer_service', {
  trainingExcludesSia: true,
  firstAidNotPrimary: true,
  trainingIncludes: /customer\s*service|microsoft|office|digital|remote/i,
})

runCase('Languages', 'languages', {
  trainingExcludesSia: true,
  firstAidNotPrimary: true,
  trainingIncludes: /english|customer\s*service|microsoft|office|digital|translation/i,
})

runCase('IT / Tech', 'tech', {
  trainingExcludesSia: true,
  firstAidNotPrimary: true,
  trainingIncludes: /microsoft|digital|office|comptia|it\s*support/i,
})

runCase('Care', 'care', {
  trainingExcludesSia: true,
  firstAidNotPrimary: true,
  trainingIncludes: /care\s*certificate|safeguarding|moving|handling/i,
})

runCase('Warehouse', 'warehouse', {
  trainingExcludesSia: true,
  trainingIncludes: /forklift|manual\s*handling|warehouse/i,
})

runCase('General', 'general', {
  trainingExcludesSia: true,
  firstAidNotPrimary: true,
})

console.log('All route-first Extra Income acceptance checks passed')
