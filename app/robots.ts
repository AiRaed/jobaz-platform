import type { MetadataRoute } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/profile',
          '/profile/',
          '/messages',
          '/messages/',
          '/feed',
          '/feed/',
          '/pulse',
          '/pulse/',
          '/relay',
          '/relay/',
          '/hubs',
          '/hubs/',
          '/email-preferences',
          '/settings/',
          '/job-setup',
          '/preview',
          '/upgrade',
          '/build-your-path',
          '/api/',
          '/auth/callback',
        ],
      },
    ],
    sitemap: `${JOBAZ_SITE_URL}/sitemap.xml`,
    host: JOBAZ_SITE_URL,
  }
}
