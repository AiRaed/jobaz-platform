import { coursePurposeIntent, normalizeCoursePurpose } from '../lib/admin/courses/coursePurpose.ts'
import { GET_LICENSED_SIA_COURSES } from '../lib/admin/courses/seedCatalog.ts'
import { adminCourseToMarketplaceCourse } from '../lib/career-hub/marketplace/mapper.ts'

const door = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-door-supervisor')
const cp = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-close-protection')
if (!door || !cp) throw new Error('Seed courses missing')

const doorCourse = {
  ...door,
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
const marketplace = adminCourseToMarketplaceCourse(doorCourse, 'security-facilities')
if (marketplace.coursePurpose !== 'Job-entry / Licence') {
  throw new Error(`Expected Job-entry purpose, got ${marketplace.coursePurpose}`)
}
if (coursePurposeIntent(marketplace.coursePurpose) !== 'urgent_job_entry') {
  throw new Error('Intent mapping failed for job-entry')
}

const legacy = {
  ...door,
  coursePurpose: '',
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
const legacyMarketplace = adminCourseToMarketplaceCourse({ ...legacy, coursePurpose: '' }, 'security-facilities')
if (legacyMarketplace.coursePurpose !== '') {
  throw new Error('Empty purpose should stay empty')
}

const cpCourse = {
  ...cp,
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
if (normalizeCoursePurpose(cpCourse.coursePurpose) !== 'Advanced qualification') {
  throw new Error('Close protection purpose mismatch')
}

console.log('verify-course-purpose: OK')
