import {
  courseIncludesDeliveryMode,
  formatDeliveryModesDisplay,
  resolveDeliveryModes,
} from '../lib/admin/courses/deliveryModes.ts'
import { GET_LICENSED_SIA_COURSES } from '../lib/admin/courses/seedCatalog.ts'
import { filterMarketplaceCourses } from '../lib/career-hub/marketplace/query.ts'
import { adminCourseToMarketplaceCourse } from '../lib/career-hub/marketplace/mapper.ts'

const cctv = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-cctv')
if (!cctv) throw new Error('CCTV seed missing')

const modes = resolveDeliveryModes(cctv.deliveryModes, cctv.deliveryMode)
const label = formatDeliveryModesDisplay(modes)
if (label !== 'Online · In-person') {
  throw new Error(`Expected "Online · In-person", got "${label}"`)
}

const courses = GET_LICENSED_SIA_COURSES.map((c) => ({
  ...c,
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const onlineOnly = filterMarketplaceCourses(courses, { deliveryMode: 'online' })
const onlineIds = new Set(onlineOnly.map((c) => c.id))
if (!onlineIds.has('seed-sia-cctv')) {
  throw new Error('CCTV should appear in Online filter')
}

const hybridOnly = filterMarketplaceCourses(courses, { deliveryMode: 'hybrid' })
if (hybridOnly.some((c) => c.id === 'seed-sia-cctv')) {
  throw new Error('CCTV should not appear in Hybrid filter')
}

const marketplace = adminCourseToMarketplaceCourse(
  {
    ...cctv,
    clicks: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'security-facilities'
)
if (marketplace.deliveryModeLabel !== 'Online · In-person') {
  throw new Error(`Marketplace label wrong: ${marketplace.deliveryModeLabel}`)
}

const legacy = resolveDeliveryModes(null, 'in_person')
if (!courseIncludesDeliveryMode(legacy, 'in_person')) {
  throw new Error('Legacy fallback failed')
}

console.log('verify-delivery-modes: OK')
