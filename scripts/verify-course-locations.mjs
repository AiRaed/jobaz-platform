import {
  parseAvailableLocationsInput,
  resolveLocationSummary,
  DEFAULT_LOCATION_SUMMARY,
} from '../lib/admin/courses/courseLocations.ts'
import { GET_LICENSED_SIA_COURSES } from '../lib/admin/courses/seedCatalog.ts'
import { adminCourseToMarketplaceCourse } from '../lib/career-hub/marketplace/mapper.ts'

const door = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-door-supervisor')
const cctv = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-cctv')
if (!door || !cctv) throw new Error('Seed courses missing')

const legacyOnly = {
  ...door,
  locationSummary: '',
  availableLocations: [],
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const legacyListing = adminCourseToMarketplaceCourse(legacyOnly, 'security-facilities')
if (legacyListing.location !== 'UK-wide') {
  throw new Error(`Legacy location fallback failed: ${legacyListing.location}`)
}

const cctvCourse = {
  ...cctv,
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
const cctvMarketplace = adminCourseToMarketplaceCourse(cctvCourse, 'security-facilities')
if (cctvMarketplace.location !== 'Selected UK locations') {
  throw new Error(`Expected summary on card, got ${cctvMarketplace.location}`)
}
if (cctvMarketplace.availableLocations.length !== 7) {
  throw new Error(`Expected 7 detail locations, got ${cctvMarketplace.availableLocations.length}`)
}

const parsed = parseAvailableLocationsInput('London, Nottingham\nDerby')
if (parsed.length !== 3) {
  throw new Error('Location parse failed')
}

const empty = resolveLocationSummary('', '')
if (empty !== DEFAULT_LOCATION_SUMMARY) {
  throw new Error(`Empty summary should default, got ${empty}`)
}

console.log('verify-course-locations: OK')
