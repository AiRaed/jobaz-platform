/**
 * Unit tests for generated WIE course-type planning (no DB).
 *   npx tsx lib/admin/opportunities/__tests__/run-wie-generated-course-types-unit.ts
 */

import assert from 'node:assert/strict'
import {
  planWieGeneratedCourseTypeOperations,
  isGeneratedWieCourseOpportunity,
  WIE_GENERATED_SEED_MESSAGE,
} from '../seedWieGeneratedCourseTypes'
import { WIE_GENERATED_SOURCE } from '@/lib/career-engine/work-in-education/course-alignment/gap-course-catalog'
import type { CourseOpportunity } from '../types'

console.log('\n=== WIE generated course types tests ===\n')

function emptyOpp(name: string, fields: string[] = [], specs: string[] = []): CourseOpportunity {
  return {
    id: `id-${name}`,
    courseName: name,
    shortLabel: '',
    coursePurpose: 'CV booster',
    priority: 70,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'Medium',
    notes: '',
    nextAction: '',
    publishedCourseId: null,
    visibilityStatus: 'recommendation_only',
    educationFields: fields,
    specialisations: specs,
    commercialStatus: 'no_link',
    suggestedSearchKeywords: name,
    adminNotes: '',
    canBeCourseCard: true,
    recommendationType: 'course_type',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    routes: [],
    goals: [{ id: 'g1', opportunityId: 'x', goalKey: 'work_in_education', goalLabel: 'WIE' }],
    providers: [],
  }
}

{
  const { operations, summary } = planWieGeneratedCourseTypeOperations({
    fields: [
      { id: 'f1', name: 'Psychology' },
      { id: 'f2', name: 'Accounting, Finance & Banking' },
    ],
    specialisms: [
      { id: 's1', field_id: 'f1', name: 'Clinical Psychology' },
      { id: 's2', field_id: 'f2', name: 'Financial Accounting' },
    ],
    opportunities: [],
  })

  const creates = operations.filter((o) => o.action === 'create')
  assert.ok(creates.length > 5, 'Should create multiple course types')
  assert.ok(creates.some((o) => /mental health/i.test(o.input.courseName)))
  assert.ok(creates.some((o) => /aat/i.test(o.input.courseName)))

  for (const op of creates) {
    assert.equal(op.input.commercialStatus, 'no_link')
    assert.equal(op.input.visibilityStatus, 'recommendation_only')
    assert.equal(op.input.publishStatus, 'Not published')
    assert.equal(op.input.opportunityStatus, 'Need provider')
    assert.equal(op.input.providers.length, 0)
    assert.ok(op.input.adminNotes?.includes(WIE_GENERATED_SOURCE))
    assert.ok(op.input.goals.some((g) => g.goalKey === 'work_in_education'))
    assert.ok(!op.input.goals.some((g) => g.goalKey === 'extra_income'))
  }

  assert.ok(summary.added_count === creates.length)
  assert.ok(!creates.some((o) => /sia|forklift|taxi/i.test(o.input.courseName)))
  console.log('  ✓ Generates recommendation-only rows without providers/links/SIA')
}

{
  const existing = emptyOpp('Mental Health Awareness', ['Psychology'], ['Mental Health'])
  const { operations } = planWieGeneratedCourseTypeOperations({
    fields: [{ id: 'f1', name: 'Psychology' }],
    specialisms: [{ id: 's1', field_id: 'f1', name: 'Clinical Psychology' }],
    opportunities: [existing],
  })
  const mental = operations.filter((o) => /mental health awareness/i.test(o.input.courseName))
  assert.ok(mental.every((o) => o.action === 'skip' || o.action === 'update'))
  assert.ok(!mental.some((o) => o.action === 'create'), 'Should not duplicate Mental Health Awareness')
  console.log('  ✓ Skips or maps duplicates instead of creating them')
}

{
  const opp = emptyOpp('Counselling Skills Introduction')
  opp.adminNotes = `source=${WIE_GENERATED_SOURCE}`
  assert.equal(isGeneratedWieCourseOpportunity(opp), true)
  assert.ok(WIE_GENERATED_SEED_MESSAGE.includes('recommendation-only'))
  console.log('  ✓ Detects generated WIE course opportunities')
}

{
  // Catalog-driven: must still plan creates when library fields are empty
  const { operations, summary } = planWieGeneratedCourseTypeOperations({
    fields: [],
    specialisms: [],
    opportunities: [],
  })
  const creates = operations.filter((o) => o.action === 'create')
  assert.ok(creates.length > 50, `Expected many catalog creates, got ${creates.length}`)
  assert.ok(summary.packs_matched >= 10)
  assert.ok(summary.catalog_titles_considered && summary.catalog_titles_considered > 50)
  console.log(`  ✓ Catalog-driven planning creates ${creates.length} rows with empty library fields`)
}

console.log('\nAll WIE generated course type tests passed.\n')
