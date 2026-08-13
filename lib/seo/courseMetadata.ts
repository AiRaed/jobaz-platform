import type { Metadata } from 'next'
import { courseCtaMode } from '@/lib/career-hub/marketplace/apply'
import type { MarketplaceCourse } from '@/lib/career-hub/marketplace/types'
import { JOBAZ_SITE_URL, UK_COURSE_KEYWORDS } from './site'

function hasApplyAffiliateLink(course: MarketplaceCourse): boolean {
  return Boolean(
    course.referralUrl?.trim() || course.providerDefaultReferralUrl?.trim()
  )
}

/** Honest SEO description — never imply booking when provider is not listed. */
export function buildCourseSeoDescription(course: MarketplaceCourse): string {
  const raw = (course.shortDescription || course.fullDescription || course.title)
    .replace(/\s+/g, ' ')
    .trim()

  const mode = courseCtaMode({
    referralUrl: course.referralUrl,
    providerDefaultReferralUrl: course.providerDefaultReferralUrl,
    officialUrl: course.officialUrl,
    published: true,
  })

  const suffix =
    mode === 'apply_now' && hasApplyAffiliateLink(course)
      ? ' Apply via JobAZ when a partner provider link is available.'
      : ' Explore this UK course pathway on JobAZ. Provider booking may not be listed yet.'

  const maxBase = Math.max(80, 160 - suffix.length)
  const base = raw.length > maxBase ? `${raw.slice(0, maxBase - 1).trimEnd()}…` : raw
  return `${base}${suffix}`
}

export function buildCourseMetadata(course: MarketplaceCourse): Metadata {
  const title = `${course.title} | UK Course | JobAZ`
  const description = buildCourseSeoDescription(course)
  const canonical = `${JOBAZ_SITE_URL}/courses/${course.slug}`
  const keywords = [
    course.title,
    `${course.title} UK`,
    course.providerName,
    ...UK_COURSE_KEYWORDS,
  ].filter(Boolean)

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'JobAZ',
      type: 'website',
      locale: 'en_GB',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export function buildCourseJsonLd(course: MarketplaceCourse) {
  const url = `${JOBAZ_SITE_URL}/courses/${course.slug}`
  const description = buildCourseSeoDescription(course)
  const hasAffiliate = hasApplyAffiliateLink(course)

  const courseSchema: Record<string, unknown> = {
    '@type': 'Course',
    name: course.title,
    description,
    url,
  }

  // Only include provider when we have a real name — never invent one
  if (course.providerName?.trim()) {
    courseSchema.provider = {
      '@type': 'Organization',
      name: course.providerName.trim(),
    }
  }

  // Include price only when a concrete amount is present (no TBC / empty / fake offers)
  const priceDigits = (course.price || '').replace(/[^\d.]/g, '')
  const priceAmount = Number.parseFloat(priceDigits)
  if (Number.isFinite(priceAmount) && priceAmount > 0) {
    courseSchema.offers = {
      '@type': 'Offer',
      price: priceAmount,
      priceCurrency: 'GBP',
      url: hasAffiliate ? url : undefined,
    }
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: JOBAZ_SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Courses',
        item: `${JOBAZ_SITE_URL}/courses`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: course.title,
        item: url,
      },
    ],
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [courseSchema, breadcrumb],
  }
}
