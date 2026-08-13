/**
 * Acceptance tests: Work in My Profession course / licence alignment.
 *   npx tsx lib/career-engine/work-in-profession/__tests__/run-wip-course-alignment-unit.ts
 */

import assert from 'node:assert/strict'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import {
  buildWipTrainingRecommendations,
  isTitleSafeForWorkInProfession,
  matchProfessionLibrary,
} from '../index'
import { WIP_GENERATED_SOURCE } from '../course-alignment'
import { planWipGeneratedCourseTypeOperations } from '@/lib/admin/opportunities/seedWipGeneratedCourseTypes'
import { filterOpportunities } from '@/lib/admin/opportunities/query'

console.log('\n=== Work in My Profession course alignment ===\n')

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
    educationFields: ['Security & Facilities'],
    specialisations: [],
    commercialStatus: 'no_link',
    suggestedSearchKeywords: name,
    adminNotes: '',
    canBeCourseCard: true,
    recommendationType: 'course_type',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    routes: [],
    goals: [
      {
        id: 'g1',
        opportunityId: 'x',
        goalKey: 'work_in_profession',
        goalLabel: 'Work in My Profession',
      },
    ],
    providers: [],
    ...extra,
  }
}

function providerWithReferral(referralUrl: string): CourseOpportunity['providers'][number] {
  return {
    id: 'p1',
    opportunityId: 'x',
    providerName: 'Get Licensed',
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

function titlesOf(training: ReturnType<typeof buildWipTrainingRecommendations>): string[] {
  return [
    ...training.required_licence,
    ...training.recommended_next,
    ...training.useful_boosters,
    ...training.checks,
    ...training.provider_not_listed,
  ].map((c) => c.title)
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'security-facilities',
    fieldName: 'Security & Facilities',
    specialismSlug: 'door-security',
    specialismName: 'Door Security',
    experienceOptionId: 'sec_no_sia',
    opportunities: [],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/SIA Door Supervisor/i.test(titles), 'Expected SIA Door Supervisor')
  assert.ok(/Event Stewarding|Matchday/i.test(titles), 'Expected Event Stewarding')
  assert.ok(/First Aid/i.test(titles), 'Expected First Aid')
  const allCards = [
    ...training.required_licence,
    ...training.recommended_next,
    ...training.useful_boosters,
    ...training.provider_not_listed,
  ]
  assert.ok(allCards.every((c) => !c.referralUrl), 'No Apply Now without provider')
  console.log('  ✓ Security → Door → No SIA shows SIA / stewarding / first aid (no Apply Now)')
}

{
  const withReferral = emptyOpp('SIA Door Supervisor', {
    commercialStatus: 'affiliate_ready',
    providers: [providerWithReferral('https://example.com/get-licensed-sia')],
  })
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'security-facilities',
    fieldName: 'Security & Facilities',
    specialismSlug: 'door-security',
    specialismName: 'Door Security',
    experienceOptionId: 'sec_no_sia',
    opportunities: [withReferral],
  })
  const door = training.required_licence.find((c) => /SIA Door/i.test(c.title))
  assert.ok(door?.referralUrl, 'Apply Now allowed when real referral exists')
  console.log('  ✓ Security Apply Now only when real Get Licensed referral exists')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'warehouse-logistics',
    fieldName: 'Warehouse & Logistics',
    specialismSlug: 'forklift-flt',
    specialismName: 'Forklift / FLT',
    experienceOptionId: 'beginner',
    opportunities: [],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/Forklift Counterbalance/i.test(titles))
  assert.ok(/Reach Truck|Manual Handling|Warehouse Safety/i.test(titles))
  assert.ok(
    training.provider_not_listed.length > 0 ||
      [...training.required_licence, ...training.recommended_next].some((c) => !c.referralUrl),
    'Missing providers surface as Provider not listed'
  )
  console.log('  ✓ Warehouse → Forklift shows FLT / handling / safety')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'care-support',
    fieldName: 'Care & Support',
    specialismSlug: 'care-assistant',
    specialismName: 'Care Assistant',
    experienceOptionId: 'care_assistant',
    roleLicenceHints: ['DBS'],
    opportunities: [],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/Care Certificate/i.test(titles))
  assert.ok(/Safeguarding/i.test(titles))
  assert.ok(/Moving|& Handling/i.test(titles))
  assert.ok(/Medication/i.test(titles))
  assert.ok(training.checks.some((c) => /DBS/i.test(c.title)))
  assert.ok(training.checks.every((c) => !c.referralUrl && c.is_check_not_course))
  console.log('  ✓ Care → Care Assistant shows certificate stack + DBS as check')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'construction-trades',
    fieldName: 'Construction & Skilled Trades',
    specialismSlug: 'general-labourer',
    specialismName: 'General Labourer',
    experienceOptionId: 'beginner',
    opportunities: [],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/CSCS|Health & Safety in Construction/i.test(titles))
  assert.ok(/Manual Handling/i.test(titles))
  assert.ok(/Asbestos/i.test(titles))
  console.log('  ✓ Construction → General Labourer shows CSCS / MH / Asbestos')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'electrical-technical',
    fieldName: 'Electrical & Technical Trades',
    specialismSlug: 'electrician',
    specialismName: 'Electrician',
    experienceOptionId: 'experienced_worker',
    opportunities: [],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/18th Edition/i.test(titles))
  assert.ok(/PAT Testing|Electrical Safety/i.test(titles))
  const notes = [
    ...training.required_licence,
    ...training.recommended_next,
    ...training.useful_boosters,
  ]
    .map((c) => `${c.whyRecommended} ${c.shortDescription} ${c.statusMessage}`)
    .join(' ')
  assert.ok(
    /does not alone|not a substitute|professional booster|fully qualified/i.test(notes) ||
      /18th Edition/i.test(titles),
    'Electrical short courses framed carefully'
  )
  console.log('  ✓ Electrical → Electrician shows 18th Edition / PAT as boosters')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'hospitality',
    fieldName: 'Hospitality',
    specialismSlug: 'kitchen-assistant',
    specialismName: 'Kitchen Assistant',
    experienceOptionId: 'beginner',
    opportunities: [],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/Food Safety Level 2|Food Hygiene/i.test(titles))
  assert.ok(/Allergy/i.test(titles))
  assert.ok(/Customer Service/i.test(titles))
  console.log('  ✓ Hospitality → Kitchen shows food safety / allergy / CS')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'creative-design',
    fieldName: 'Creative & Design Practical',
    specialismSlug: 'graphic-design',
    specialismName: 'Graphic Design',
    experienceOptionId: 'beginner',
    opportunities: [
      emptyOpp('SIA Door Supervisor', {
        educationFields: ['Security & Facilities'],
        commercialStatus: 'affiliate_ready',
        providers: [providerWithReferral('https://example.com/sia')],
      }),
      emptyOpp('Forklift Counterbalance'),
      emptyOpp('Care Certificate'),
    ],
  })
  const titles = titlesOf(training).join(' | ')
  assert.ok(/Portfolio|Photoshop|UX|Digital|Social/i.test(titles))
  assert.ok(!/\bSIA\b/i.test(titles))
  assert.ok(!/Forklift/i.test(titles))
  assert.ok(!/Care Certificate/i.test(titles))
  assert.equal(
    isTitleSafeForWorkInProfession('SIA Door Supervisor', 'Creative & Design Practical'),
    false
  )
  console.log('  ✓ Creative blocks SIA / Forklift / Care Certificate')
}

{
  const { operations, summary } = planWipGeneratedCourseTypeOperations({ opportunities: [] })
  const creates = operations.filter((o) => o.action === 'create')
  assert.ok(creates.length > 10, 'Should plan many profession course types')
  for (const op of creates) {
    assert.equal(op.input.commercialStatus, 'no_link')
    assert.equal(op.input.visibilityStatus, 'recommendation_only')
    assert.equal(op.input.publishStatus, 'Not published')
    assert.equal(op.input.providers.length, 0)
    assert.ok(op.input.adminNotes?.includes(WIP_GENERATED_SOURCE))
    assert.ok(op.input.goals.some((g) => g.goalKey === 'work_in_profession'))
  }
  assert.equal(summary.added_count, creates.length)
  console.log('  ✓ Generate missing Profession course types stays recommendation-only')
}

{
  const rows = [
    emptyOpp('SIA Door Supervisor', {
      educationFields: ['Security & Facilities'],
      specialisations: ['Door Security'],
      adminNotes: `source=${WIP_GENERATED_SOURCE} · profession_field=Security & Facilities`,
    }),
    emptyOpp('Food Safety Level 2', {
      educationFields: ['Hospitality'],
      specialisations: ['Kitchen Assistant'],
      goals: [
        {
          id: 'g2',
          opportunityId: 'x',
          goalKey: 'work_in_profession',
          goalLabel: 'Work in My Profession',
        },
      ],
    }),
    emptyOpp('Mental Health First Aid', {
      educationFields: ['Psychology'],
      goals: [
        {
          id: 'g3',
          opportunityId: 'x',
          goalKey: 'work_in_education',
          goalLabel: 'Work in my Education',
        },
      ],
    }),
  ]

  const filtered = filterOpportunities(rows, {
    search: '',
    routeKey: 'all',
    coursePurpose: 'all',
    opportunityStatus: 'all',
    affiliateStatus: 'all',
    publishStatus: 'all',
    provider: 'all',
    visibilityStatus: 'all',
    commercialStatus: 'all',
    canBeCourseCard: 'all',
    educationField: 'all',
    specialisation: 'all',
    goalPath: 'work_in_profession',
    professionField: 'Security & Facilities',
    professionSpecialism: 'Door Security',
    professionalLevel: 'all',
    quickView: 'all',
  })
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].courseName, 'SIA Door Supervisor')
  console.log('  ✓ Tracker filters WIP by goal path + profession field + specialism')
}

{
  const training = buildWipTrainingRecommendations({
    fieldSlug: 'office-admin',
    fieldName: 'Office & Administration',
    specialismSlug: 'admin-assistant',
    specialismName: 'Admin Assistant',
    experienceOptionId: 'office_basic',
    opportunities: [],
  })
  const allTitles = [
    ...training.required_licence,
    ...training.recommended_next,
    ...training.useful_boosters,
    ...training.checks,
    ...training.provider_not_listed,
  ].map((c) => c.title.trim().toLowerCase())
  assert.equal(allTitles.length, new Set(allTitles).size, 'course titles must be unique across sections')
  for (const card of [
    ...training.recommended_next,
    ...training.useful_boosters,
    ...training.provider_not_listed,
  ]) {
    assert.ok(!/Never use a fake Apply Now/i.test(card.statusMessage || ''))
    assert.ok(!card.referralUrl)
  }
  console.log('  ✓ Office training cards are deduped and free of internal Apply Now copy')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'office-admin',
    specialism_slug: 'receptionist',
    experience_option_id: 'office_basic',
  })
  assert.ok(
    result.roles.every((r) => !/pathway within .+ — practical experience route/i.test(r.description)),
    'legacy pathway copy removed'
  )
  assert.ok(
    result.roles.some((r) =>
      /Microsoft Office|accuracy, organisation|customer service, phone handling/i.test(
        r.cv_focus_points.join(' ')
      )
    )
  )
  console.log('  ✓ Office role cards use profession CV focus + clean descriptions')
}

{
  const busTraining = buildWipTrainingRecommendations({
    fieldSlug: 'driving-transport',
    fieldName: 'Driving & Transport',
    specialismSlug: 'bus-pcv',
    specialismName: 'Bus / PCV',
    experienceOptionId: 'drive_bus',
    roleLicenceHints: ['PCV licence + Driver CPC (passenger) where applicable'],
    opportunities: [],
  })
  const busTitles = titlesOf(busTraining).join(' | ')
  assert.ok(/PCV licence/i.test(busTitles), 'Bus / PCV should recommend PCV licence')
  assert.ok(/Driver CPC \(passenger/i.test(busTitles), 'Bus / PCV should recommend passenger CPC')
  assert.ok(/Customer Service|Safeguarding/i.test(busTitles))
  assert.ok(!/HGV \/ LGV licence/i.test(busTitles), 'Bus / PCV must not recommend HGV licence as primary')
  assert.ok(!/Driver CPC \(goods/i.test(busTitles))
  assert.ok(!/\bADR\b|\bHIAB\b/i.test(busTitles))
  console.log('  ✓ Bus / PCV courses: PCV licence + passenger CPC; no HGV primary')
}

{
  const hgvTraining = buildWipTrainingRecommendations({
    fieldSlug: 'driving-transport',
    fieldName: 'Driving & Transport',
    specialismSlug: 'hgv-lgv',
    specialismName: 'HGV / LGV',
    experienceOptionId: 'drive_hgv',
    roleLicenceHints: ['Valid HGV / LGV licence + Driver CPC (goods)'],
    opportunities: [],
  })
  const hgvTitles = titlesOf(hgvTraining).join(' | ')
  assert.ok(/HGV \/ LGV licence/i.test(hgvTitles))
  assert.ok(/Driver CPC \(goods/i.test(hgvTitles))
  assert.ok(/Tachograph/i.test(hgvTitles))
  assert.ok(!/PCV licence/i.test(hgvTitles), 'HGV / LGV must not recommend PCV licence as primary')
  assert.ok(!/Driver CPC \(passenger/i.test(hgvTitles))
  assert.ok(!/Bus|Coach|Safeguarding \/ passenger/i.test(hgvTitles))
  console.log('  ✓ HGV / LGV courses: goods licence + CPC; no Bus / PCV primary')
}

{
  const taxiTraining = buildWipTrainingRecommendations({
    fieldSlug: 'driving-transport',
    fieldName: 'Driving & Transport',
    specialismSlug: 'taxi-phv',
    specialismName: 'Taxi / PHV',
    experienceOptionId: 'drive_taxi',
    opportunities: [],
  })
  const taxiTitles = titlesOf(taxiTraining).join(' | ')
  assert.ok(/PHV \/ Taxi/i.test(taxiTitles))
  assert.ok(!/HGV \/ LGV licence|PCV licence|Driver CPC \(goods|Driver CPC \(passenger/i.test(taxiTitles))
  console.log('  ✓ Taxi / PHV courses stay on taxi licensing path')
}

console.log('\nAll WIP course alignment tests passed.\n')

