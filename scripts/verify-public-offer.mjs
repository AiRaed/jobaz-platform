import { resolvePublicOffer, buildCardOfferHint, formatOfferBadgeLabel, DEFAULT_CARD_OFFER_HINT } from '../lib/admin/courses/publicOffer.ts'
import { GET_LICENSED_SIA_COURSES } from '../lib/admin/courses/seedCatalog.ts'
import { adminCourseToMarketplaceCourse, marketplaceCourseToListing } from '../lib/career-hub/marketplace/mapper.ts'

const door = GET_LICENSED_SIA_COURSES.find((c) => c.id === 'seed-sia-door-supervisor')
if (!door) throw new Error('Door supervisor seed missing')

const course = {
  ...door,
  clicks: 0,
  saves: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const marketplace = adminCourseToMarketplaceCourse(course, 'security-facilities')
if (!marketplace.publicOffer.visible) {
  throw new Error('Door supervisor offer should be visible')
}
if (marketplace.publicOffer.label !== '20% off') {
  throw new Error(`Expected offer label "20% off", got "${marketplace.publicOffer.label}"`)
}

const listing = marketplaceCourseToListing(marketplace)
if (!listing.publicOffer?.visible) {
  throw new Error('Listing should include visible public offer')
}

if (!marketplace.publicOffer.badgeDisplay) {
  throw new Error('Door supervisor should have badge display')
}
if (marketplace.publicOffer.badgeDisplay.mainLine !== '20% off') {
  throw new Error(`Expected main line "20% off", got "${marketplace.publicOffer.badgeDisplay.mainLine}"`)
}
if (marketplace.publicOffer.badgeDisplay.brandLine !== 'JobAZ Discount') {
  throw new Error('Expected JobAZ Discount brand line')
}

const numeric = formatOfferBadgeLabel('20')
if (numeric !== '20% OFF') {
  throw new Error(`Numeric label should format to "20% OFF", got "${numeric}"`)
}

const preserved = formatOfferBadgeLabel('20% off')
if (preserved !== '20% off') {
  throw new Error(`Label with % and off should be preserved, got "${preserved}"`)
}

const disabled = resolvePublicOffer({
  publicOfferEnabled: false,
  publicOfferLabel: '20% off',
})
if (disabled.visible) {
  throw new Error('Disabled offer should not be visible')
}

const emptyLabel = resolvePublicOffer({
  publicOfferEnabled: true,
  publicOfferLabel: '',
})
if (emptyLabel.visible) {
  throw new Error('Empty label offer should not be visible')
}

const unclear = buildCardOfferHint('register now get')
if (unclear !== DEFAULT_CARD_OFFER_HINT) {
  throw new Error(`Unclear description should fallback, got "${unclear}"`)
}

const clear = buildCardOfferHint('Partner offer via JobAZ when booking through our link')
if (!clear.includes('Partner offer')) {
  throw new Error(`Clear description should be used, got "${clear}"`)
}

console.log('verify-public-offer: OK')
