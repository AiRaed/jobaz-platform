/**
 * Smoke checks for Jobs For You mapper (no network).
 * Run: npx tsx lib/jobs/jobsForYouQuery.smoke.ts
 */
import assert from 'node:assert/strict'
import { mapPlanOrCvToJobQueries, filterJobsByForbiddenAndScore } from './mapPlanOrCvToJobQueries'
import { buildJobsForYouQuery } from './buildJobsForYouQuery'

const midwifery = mapPlanOrCvToJobQueries({
  plan: {
    planTitle: 'Midwifery',
    currentFocus: 'Maternity Support Worker',
    currentTarget: 'Maternity Support Worker',
    recommendedJobs: ['Qualifi Level 2 Diploma in Care', 'Healthcare Assistant'],
    pathwayRoute: 'Midwifery',
  },
  cv: {
    summary: 'Experienced cleaner',
    skills: ['cleaning'],
    experience: [{ jobTitle: 'CLEANEING Operative' }],
  },
})
assert.equal(midwifery.sourceType, 'plan_and_cv')
assert.match(midwifery.primaryQuery, /maternity|healthcare|care/i)
assert.equal(/clean/i.test(midwifery.primaryQuery), false)
assert.equal(/qualifi|diploma/i.test(midwifery.primaryQuery), false)
assert.ok(midwifery.forbiddenTerms.some((t) => /clean/i.test(t)))

const filtered = filterJobsByForbiddenAndScore(
  [
    { title: 'Cleaner', matchPercentage: 40 },
    { title: 'Maternity Support Worker', matchPercentage: 70 },
    { title: 'Site Manager', matchPercentage: 5 },
    { title: 'HCA', matchPercentage: 0 },
  ],
  midwifery.forbiddenTerms
)
assert.deepEqual(
  filtered.map((j) => j.title),
  ['Maternity Support Worker']
)

const animation = mapPlanOrCvToJobQueries({
  plan: null,
  cv: {
    summary: 'Creative digital media graduate focusing on 2D animation and motion design',
    skills: ['After Effects', 'Blender', 'Animation'],
    education: [{ degree: 'BA Animation', field: 'Animation' }],
  },
})
assert.equal(animation.sourceType, 'cv_only')
assert.match(animation.primaryQuery, /animator|motion|digital|creative/i)
assert.equal(/customer\s*service/i.test(animation.primaryQuery), false)
assert.ok(animation.forbiddenTerms.some((t) => /hgv|site manager|commercial/i.test(t)))

const animFiltered = filterJobsByForbiddenAndScore(
  [
    { title: 'Junior Animator', matchPercentage: 80 },
    { title: 'HGV Technician', matchPercentage: 20 },
    { title: 'Site Manager', matchPercentage: 10 },
    { title: 'Commercial Manager', matchPercentage: 12 },
  ],
  animation.forbiddenTerms
)
assert.deepEqual(
  animFiltered.map((j) => j.title),
  ['Junior Animator']
)

const built = buildJobsForYouQuery(
  { summary: 'Animation portfolio', skills: ['Maya'] },
  null
)
assert.equal(built.sourceType, 'cv_only')
assert.ok(built.forbiddenTerms.length > 0)

console.log('jobsForYouQuery.smoke ok')
