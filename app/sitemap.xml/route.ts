/**
 * Sitemap XML Route Handler
 * 
 * Checklist:
 * ✓ Returns valid XML with Content-Type: application/xml
 * ✓ Never blocked/redirected by middleware (explicit early return)
 * ✓ Route handler takes precedence over public/sitemap.xml
 * ✓ Cache headers for CDN optimization
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jobaz.io/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://jobaz.io/auth</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://jobaz.io/privacy</loc>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://jobaz.io/terms</loc>
    <priority>0.4</priority>
  </url>
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

