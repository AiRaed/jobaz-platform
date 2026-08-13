/**
 * Sitemap XML — public indexable pages only.
 * Private workspace / admin / auth-callback routes are excluded.
 */

import { NextResponse } from 'next/server'
import { fetchAllPublishedMarketplaceCourses } from '@/lib/career-hub/marketplace/fetch'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

function urlEntry(loc: string, priority: string, changefreq?: string) {
  return `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>${
      changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''
    }
  </url>`
}

export async function GET() {
  let courseUrls: string[] = []
  try {
    const courses = await fetchAllPublishedMarketplaceCourses()
    const seen = new Set<string>()
    for (const course of courses) {
      const slug = (course.slug || '').trim()
      if (!slug || seen.has(slug)) continue
      seen.add(slug)
      courseUrls.push(`${JOBAZ_SITE_URL}/courses/${slug}`)
    }
  } catch {
    courseUrls = []
  }

  const staticEntries = [
    urlEntry(`${JOBAZ_SITE_URL}/`, '1.0', 'daily'),
    urlEntry(`${JOBAZ_SITE_URL}/courses`, '0.9', 'daily'),
    urlEntry(`${JOBAZ_SITE_URL}/career-assistant`, '0.85', 'weekly'),
    urlEntry(`${JOBAZ_SITE_URL}/jobs`, '0.8', 'daily'),
    urlEntry(`${JOBAZ_SITE_URL}/opportunities`, '0.7', 'weekly'),
    urlEntry(`${JOBAZ_SITE_URL}/about`, '0.5', 'monthly'),
    urlEntry(`${JOBAZ_SITE_URL}/privacy`, '0.3', 'yearly'),
    urlEntry(`${JOBAZ_SITE_URL}/terms`, '0.3', 'yearly'),
  ]

  const courseEntries = courseUrls.map((loc) => urlEntry(loc, '0.75', 'weekly'))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...courseEntries].join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
