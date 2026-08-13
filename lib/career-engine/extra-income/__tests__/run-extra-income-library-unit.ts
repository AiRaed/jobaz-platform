/**
 * Acceptance tests: Looking for Extra Income library MVP.
 *   npx tsx lib/career-engine/extra-income/__tests__/run-extra-income-library-unit.ts
 */

import assert from 'node:assert/strict'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import {
  buildExtraIncomeLibraryResult,
  getExtraIncomeOption,
  isCourseTitleAllowedForOption,
  listExtraIncomeOptions,
} from '../library'

console.log('\n=== Looking for Extra Income library MVP ===\n')

function emptyOpp(
  name: string,
  extra: Partial<CourseOpportunity> = {}
): CourseOpportunity {
  return {
    id: `id-${name}`,
    courseName: name,
    shortLabel: '',
    coursePurpose: 'Licence',
    priority: 80,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'Medium',
    notes: '',
    nextAction: '',
    publishedCourseId: null,
    visibilityStatus: 'recommendation_only',
    educationFields: [],
    specialisations: [],
    commercialStatus: 'no_link',
    suggestedSearchKeywords: name,
    adminNotes: '',
    canBeCourseCard: true,
    recommendationType: 'course_type',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    routes: [],
    goals: [],
    providers: [],
    ...extra,
  }
}

function providerWithReferral(referralUrl: string): CourseOpportunity['providers'][number] {
  return {
    id: 'p1',
    opportunityId: 'x',
    providerName: 'Partner',
    providerStatus: 'Ready',
    affiliateStatus: 'Has affiliate',
    officialUrl: '',
    referralUrl,
    dashboardUrl: '',
    commissionType: 'CPA',
    commissionValue: '',
    publicOfferLabel: '',
    trackingMethod: 'URL',
    notes: '',
    isPreferred: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }
}

function allCourseTitles(result: NonNullable<ReturnType<typeof buildExtraIncomeLibraryResult>>): string {
  return [...result.courses_primary, ...result.courses_boosters].map((c) => c.title).join(' | ')
}

{
  const result = buildExtraIncomeLibraryResult({
    category_id: 'start_without_licence',
    option_id: 'retail-weekend-assistant',
  })
  assert.ok(result, 'Retail result exists')
  assert.equal(result!.layout, 'jobs_first')
  assert.ok(result!.jobs.length > 0, 'Jobs listed')
  assert.ok(/Retail/i.test(result!.jobs.join(' ')), 'Retail jobs present')
  assert.equal(result!.courses_primary.length, 0, 'No primary courses for no-licence')
  assert.ok(
    /No formal licence usually needed/i.test(result!.important_note || ''),
    'No-licence note when appropriate'
  )
  console.log('  ✓ Start without licence → Retail Weekend Assistant → jobs first')
}

{
  const step2 = listExtraIncomeOptions('quick_shifts_short_training')
  assert.ok(step2.every((o) => !/Food Safety Level 2|Manual Handling|^COSHH$|^First Aid$/i.test(o.option_title)))
  assert.ok(step2.some((o) => /Kitchen|Warehouse|Cleaning|Event|Retail|Care/i.test(o.option_title)))

  const result = buildExtraIncomeLibraryResult({
    category_id: 'quick_shifts_short_training',
    option_id: 'kitchen-food-shifts',
  })
  assert.ok(result)
  assert.equal(result!.layout, 'training_first')
  assert.equal(result!.option_type_label, 'Shift work route')
  assert.equal(
    result!.option_display_title,
    'Shift work route: Kitchen / Food Assistant Shifts'
  )
  assert.ok(
    result!.courses_primary.some((c) => /Food Safety|Food Hygiene|Allergy/i.test(c.title)),
    'Food Safety training first'
  )
  const jobs = result!.jobs.join(' ')
  assert.ok(/Kitchen Assistant|Kitchen Porter|Catering|Food Retail/i.test(jobs))
  console.log('  ✓ Quick shifts → Kitchen work route → training first then jobs')
}

{
  const step2 = listExtraIncomeOptions('licence_based')
  assert.ok(step2.every((o) => !/^SIA Door Supervisor$|^CSCS Green Card$/i.test(o.option_title)))
  assert.ok(step2.some((o) => /Security|Forklift|Taxi|HGV|Care|Construction/i.test(o.option_title)))

  const result = buildExtraIncomeLibraryResult({
    category_id: 'licence_based',
    option_id: 'security-shifts',
  })
  assert.ok(result)
  assert.equal(result!.layout, 'licence_first')
  assert.equal(result!.option_type_label, 'Licence-based work route')
  assert.ok(result!.needs_licence)
  assert.ok(
    result!.courses_primary.some((c) => /SIA Door Supervisor/i.test(c.title)),
    'SIA licence first'
  )
  const jobs = result!.jobs.join(' ')
  assert.ok(/Door Supervisor|Retail Security|Venue Security|Event Security/i.test(jobs))
  const blob = `${result!.important_note || ''} ${result!.warning_note || ''} ${result!.result_framing}`
  assert.ok(/cannot legally|not an immediate|licence/i.test(blob), 'Honest licence warning')
  console.log('  ✓ Licence → Security Shifts → licence first, honest warning')
}

{
  const result = buildExtraIncomeLibraryResult({
    category_id: 'licence_based',
    option_id: 'forklift-flt-warehouse',
  })
  assert.ok(result)
  assert.equal(result!.layout, 'licence_first')
  assert.ok(
    result!.courses_primary.some((c) => /Forklift|FLT|Reach/i.test(c.title)),
    'Forklift training first'
  )
  const jobs = result!.jobs.join(' ')
  assert.ok(/Forklift Driver|FLT|Goods In/i.test(jobs))
  console.log('  ✓ Licence → Forklift work route → training first then FLT roles')
}

{
  const result = buildExtraIncomeLibraryResult({
    category_id: 'online_from_home',
    option_id: 'language-interpreting',
  })
  assert.ok(result)
  assert.equal(result!.layout, 'online_first')
  assert.ok(result!.jobs.length > 0)
  assert.equal(result!.courses_primary.length, 0, 'No primary course push for online')
  console.log('  ✓ Online → Language Support → options first, training as booster only')
}

{
  const withReferral = emptyOpp('Food Safety Level 2', {
    commercialStatus: 'affiliate_ready',
    providers: [providerWithReferral('https://example.com/food-safety')],
  })
  const result = buildExtraIncomeLibraryResult({
    category_id: 'quick_shifts_short_training',
    option_id: 'kitchen-food-shifts',
    opportunities: [withReferral],
  })
  assert.ok(result)
  const applyCards = [...result!.courses_primary, ...result!.courses_boosters].filter((c) =>
    c.referralUrl?.trim()
  )
  assert.ok(applyCards.length >= 1, 'Referral present → Apply Now eligible')
  assert.ok(
    applyCards.every((c) => c.referralUrl?.startsWith('http')),
    'Only real referral URLs'
  )

  const noProvider = buildExtraIncomeLibraryResult({
    category_id: 'licence_based',
    option_id: 'security-shifts',
    opportunities: [],
  })
  assert.ok(noProvider)
  assert.ok(
    [...noProvider!.courses_primary, ...noProvider!.courses_boosters].every(
      (c) => !c.referralUrl?.trim()
    ),
    'No fake Apply Now without provider'
  )
  console.log('  ✓ Apply Now only with real published provider/referral')
}

{
  const retail = getExtraIncomeOption('retail-weekend-assistant')!
  assert.equal(isCourseTitleAllowedForOption('SIA Door Supervisor', retail), false)
  assert.equal(isCourseTitleAllowedForOption('Forklift Counterbalance', retail), false)
  assert.equal(isCourseTitleAllowedForOption('Care Certificate', retail), false)

  const kitchen = getExtraIncomeOption('kitchen-food-shifts')!
  assert.equal(isCourseTitleAllowedForOption('SIA Door Supervisor', kitchen), false)
  assert.equal(isCourseTitleAllowedForOption('Food Safety Level 2', kitchen), true)

  const security = getExtraIncomeOption('security-shifts')!
  assert.equal(isCourseTitleAllowedForOption('SIA Door Supervisor', security), true)
  assert.equal(isCourseTitleAllowedForOption('Forklift Counterbalance', security), false)

  const care = buildExtraIncomeLibraryResult({
    category_id: 'quick_shifts_short_training',
    option_id: 'care-support-shifts',
  })
  assert.ok(care!.courses_primary.some((c) => c.is_check_not_course && /DBS/i.test(c.title)))

  const retailResult = buildExtraIncomeLibraryResult({
    category_id: 'start_without_licence',
    option_id: 'retail-weekend-assistant',
    opportunities: [
      emptyOpp('SIA Door Supervisor'),
      emptyOpp('Forklift Counterbalance'),
      emptyOpp('Care Certificate'),
    ],
  })
  const titles = allCourseTitles(retailResult!)
  assert.ok(!/SIA|Forklift|Care Certificate/i.test(titles), 'No contamination on retail')
  console.log('  ✓ No unrelated SIA/Forklift/Care outside relevant options; DBS is a check')
}

console.log('\nAll Extra Income library acceptance checks passed.\n')
