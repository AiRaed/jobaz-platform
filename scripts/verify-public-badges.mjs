import { courseCardBadges, resolvePublicBadges } from '../lib/admin/courses/publicBadges.ts'
import { GET_LICENSED_SIA_COURSES } from '../lib/admin/courses/seedCatalog.ts'
import { adminCourseToMarketplaceCourse, marketplaceCourseToListing } from '../lib/career-hub/marketplace/mapper.ts'
import { filterMarketplaceCourses } from '../lib/career-hub/marketplace/query.ts'

const door = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-door-supervisor')
if (!door) throw new Error('Door supervisor seed missing')

const withBadges = {
  ...door,
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const listing = marketplaceCourseToListing(
  adminCourseToMarketplaceCourse(withBadges, 'security-facilities')
)

const cardBadges = courseCardBadges(listing.publicBadges)
if (!cardBadges.includes('Licence') || !cardBadges.includes('Beginner friendly')) {
  throw new Error(`Expected Licence + Beginner friendly badges, got: ${cardBadges.join(', ')}`)
}

if (cardBadges.length > 4) {
  throw new Error('Card should show max 4 badges')
}

const licenceSearch = filterMarketplaceCourses(
  GET_LICENSED_SIA_COURSES.map((c) => ({
    ...c,
    clicks: 0,
    saves: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  { search: 'licence' }
)
if (!licenceSearch.some((c) => c.id === 'seed-sia-door-supervisor')) {
  throw new Error('Badge search should match Licence badge')
}

const emptyBadges = resolvePublicBadges(null)
if (emptyBadges.length !== 0) {
  throw new Error('Empty badges should resolve to []')
}

console.log('verify-public-badges: OK')
