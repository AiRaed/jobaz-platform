/**
 * Acceptance tests: Start New Career library MVP (training-first).
 *   npx tsx lib/career-engine/start-new-career/library/__tests__/run-snc-library-unit.ts
 */

import assert from 'node:assert/strict'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import { buildStartNewCareerLibraryResult, listSncRoutesForWorkType } from '../index'

console.log('\n=== Start New Career library MVP ===\n')

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

function entryTitles(result: NonNullable<ReturnType<typeof buildStartNewCareerLibraryResult>>) {
  return result.entry_courses.map((c) => c.title).join(' | ')
}

function upgradeTitles(result: NonNullable<ReturnType<typeof buildStartNewCareerLibraryResult>>) {
  return result.upgrade_courses.map((c) => c.title).join(' | ')
}

function firstJobs(result: NonNullable<ReturnType<typeof buildStartNewCareerLibraryResult>>) {
  return result.first_jobs.map((r) => r.role_title).join(' | ')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'security_licensed',
    route_id: 'sia-door-supervisor-route',
  })
  assert.ok(result)
  assert.equal(result!.result_source, 'profession_library_start_new_career')
  assert.ok(/SIA Door Supervisor/i.test(entryTitles(result!)), 'SIA first')
  assert.ok(/Door Supervisor|Retail Security|Venue Security/i.test(firstJobs(result!)))
  assert.ok(/CCTV|Fire Marshal|Conflict/i.test(upgradeTitles(result!)))
  assert.ok(
    result!.entry_courses.every((c) => !c.referralUrl),
    'No fake Apply Now'
  )
  assert.ok(result!.safety_note, 'Licence safety note')
  console.log('  ✓ Security → SIA Door Supervisor → training first, honest licence note')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'driving_warehouse_logistics',
    route_id: 'forklift-driver-route',
  })
  assert.ok(result)
  assert.ok(/Forklift Counterbalance|Reach|Manual Handling/i.test(entryTitles(result!)))
  assert.ok(/Forklift|FLT|Goods/i.test(firstJobs(result!)))
  assert.ok(/Stock|Supervisor|Health/i.test(upgradeTitles(result!)))
  assert.ok(!/SIA/i.test(entryTitles(result!) + upgradeTitles(result!)), 'No unrelated SIA')
  console.log('  ✓ Warehouse → Forklift → FLT training first, no SIA')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'office_admin_cs',
    route_id: 'admin-assistant',
  })
  assert.ok(result)
  assert.ok(/Microsoft Office|Excel|Admin Skills/i.test(entryTitles(result!)))
  assert.ok(/Admin|Office|Reception|Data Entry/i.test(firstJobs(result!)))
  assert.ok(/Customer Service|Business Communication|Bookkeeping/i.test(upgradeTitles(result!)))
  console.log('  ✓ Office → Admin Assistant → Office/Excel first')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'care_support_education',
    route_id: 'care-assistant',
  })
  assert.ok(result)
  assert.ok(/Care Certificate|Safeguarding|Moving/i.test(entryTitles(result!)))
  assert.ok(/Care Assistant|Support Worker|Home Care/i.test(firstJobs(result!)))
  assert.ok(/Medication|Dementia|First Aid/i.test(upgradeTitles(result!)))
  console.log('  ✓ Care → Care Assistant → Care Certificate first')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'practical_hands_on',
    route_id: 'construction-labourer',
  })
  assert.ok(result)
  assert.ok(/CSCS|Manual Handling|Asbestos/i.test(entryTitles(result!)))
  assert.ok(/Labourer|Site|Construction|Operative/i.test(firstJobs(result!)))
  assert.ok(/Working at Height|First Aid/i.test(upgradeTitles(result!)))
  console.log('  ✓ Practical → Construction Labourer → CSCS first')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'digital_it_creative',
    route_id: 'it-support-assistant',
  })
  assert.ok(result)
  assert.ok(/IT Support Basics|Microsoft Office|Digital Skills/i.test(entryTitles(result!)))
  assert.ok(/IT Support|Helpdesk|Help Desk/i.test(firstJobs(result!)))
  assert.ok(/CompTIA|Cyber|Cloud/i.test(upgradeTitles(result!)))
  console.log('  ✓ Digital → IT Support → basics first')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'hospitality_retail_local',
    route_id: 'kitchen-assistant',
  })
  assert.ok(result)
  assert.ok(/Food Safety|Allergy/i.test(entryTitles(result!)))
  assert.ok(/Kitchen|Catering|Porter/i.test(firstJobs(result!)))
  assert.ok(/Customer Service|First Aid|Fire Marshal/i.test(upgradeTitles(result!)))
  console.log('  ✓ Hospitality → Kitchen Assistant → Food Safety first')
}

{
  const withReferral = emptyOpp('SIA Door Supervisor', {
    commercialStatus: 'affiliate_ready',
    providers: [providerWithReferral('https://example.com/sia')],
  })
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'security_licensed',
    route_id: 'sia-door-supervisor-route',
    opportunities: [withReferral],
  })
  assert.ok(result)
  const applyCards = result!.entry_courses.filter((c) => c.referralUrl?.trim())
  assert.ok(applyCards.length >= 1, 'Referral → Apply Now eligible')
  assert.ok(applyCards.every((c) => c.referralUrl?.startsWith('http')))
  console.log('  ✓ Apply Now only with real referral')
}

{
  // No level/experience question in library flow — beginner default baked in
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'office_admin_cs',
    route_id: 'admin-assistant',
  })
  assert.ok(result)
  assert.equal(result!.professional_level, 'Beginner')
  assert.ok(/Beginner|starter/i.test(result!.beginner_label))
  console.log('  ✓ No level question — beginner/starter default')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'driving_warehouse_logistics',
    route_id: 'bus-pcv-route',
  })
  assert.ok(result)
  assert.equal(result!.route_kind, 'starter')
  assert.ok(/PCV licence/i.test(entryTitles(result!)), 'PCV licence training')
  assert.ok(/Driver CPC \(passenger/i.test(entryTitles(result!)), 'Passenger CPC')
  assert.ok(
    /Trainee Bus|Bus Driver|PCV Driver|Passenger Transport|Coach Driver/i.test(firstJobs(result!)),
    'Bus / PCV starter roles'
  )
  const allCourses = entryTitles(result!) + ' | ' + upgradeTitles(result!)
  assert.ok(!/\bSIA\b/i.test(allCourses), 'No SIA')
  assert.ok(!/Care Certificate/i.test(allCourses), 'No care certificate')
  assert.ok(!/Food (Safety|Hygiene)/i.test(allCourses), 'No food hygiene')
  assert.ok(!/HGV \/ LGV licence/i.test(allCourses), 'No HGV primary for Bus / PCV')
  assert.ok(result!.safety_note && /PCV|licence/i.test(result!.safety_note))
  assert.ok(result!.start_status_note && /Start preparing now/i.test(result!.start_status_note))
  console.log('  ✓ Driving → Bus / PCV → PCV + passenger CPC; no SIA/care/food/HGV primary')
}

{
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'driving_warehouse_logistics',
    route_id: 'train-driver-route',
  })
  assert.ok(result)
  assert.equal(result!.route_kind, 'future_progression')
  assert.ok(/Future|advanced/i.test(result!.beginner_label))
  assert.equal(result!.first_jobs.length, 0, 'Train Driver must not show as immediate')
  assert.ok(
    result!.better_roles_later.some((r) => /Train Driver/i.test(r.role_title)),
    'Train Driver appears as future/progression'
  )
  assert.ok(result!.safety_note && /employer recruitment|assessment tests/i.test(result!.safety_note))
  assert.ok(!/easy immediate|guaranteed job|after one course/i.test(result!.result_framing))
  assert.ok(
    /Rail industry|Mechanical comprehension|Assessment test|Safety-critical/i.test(
      entryTitles(result!)
    )
  )
  console.log('  ✓ Driving → Train Driver → future/progression only, honest recruitment note')
}

{
  const withReferral = emptyOpp('PCV licence training', {
    commercialStatus: 'affiliate_ready',
    providers: [providerWithReferral('https://example.com/pcv')],
  })
  const result = buildStartNewCareerLibraryResult({
    work_type_id: 'driving_warehouse_logistics',
    route_id: 'bus-pcv-route',
    opportunities: [withReferral],
  })
  assert.ok(result)
  const applyCards = result!.entry_courses.filter((c) => c.referralUrl?.trim())
  assert.ok(applyCards.length >= 1)
  assert.ok(applyCards.every((c) => c.referralUrl?.startsWith('http')))
  console.log('  ✓ Bus / PCV Apply Now only with real referral_url')
}

{
  const routes = listSncRoutesForWorkType('driving_warehouse_logistics')
  const labels = routes.map((r) => r.label).join(' | ')
  assert.ok(/Warehouse Operative/i.test(labels))
  assert.ok(/Delivery Driver/i.test(labels))
  assert.ok(/Van Driver/i.test(labels))
  assert.ok(/Forklift/i.test(labels))
  assert.ok(/Bus Driver \/ PCV/i.test(labels))
  assert.ok(/HGV \/ LGV/i.test(labels))
  assert.ok(/Transport Admin/i.test(labels))
  assert.ok(/Train Driver/i.test(labels))
  assert.ok(/Transport Supervisor/i.test(labels))
  console.log(
    '  ✓ Driving category lists warehouse, delivery, van, forklift, bus, HGV, admin, train, supervisor'
  )
}

console.log('\nAll Start New Career library acceptance checks passed.\n')
