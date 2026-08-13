import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './client-providers'
import { JOBAZ_SITE_URL, UK_COURSE_KEYWORDS } from '@/lib/seo/site'

const inter = Inter({ subsets: ['latin'] })

const appUrl = JOBAZ_SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: 'JobAZ',
  title: 'JobAZ — UK Career Platform',
  description:
    'Plan your UK career route, build your CV, find jobs, and discover relevant courses and licences.',
  keywords: [
    'UK career platform',
    'AI career assistant',
    'CV builder',
    'job finder UK',
    'career guidance',
    'UK training courses',
    ...UK_COURSE_KEYWORDS,
  ],
  authors: [{ name: 'JobAZ' }],
  creator: 'JobAZ',
  publisher: 'JobAZ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: appUrl,
    siteName: 'JobAZ',
    title: 'JobAZ — UK Career Platform',
    description:
      'Plan your UK career route, build your CV, find jobs, and discover relevant courses and licences.',
    images: [
      {
        url: `${appUrl}/og-image`,
        width: 1200,
        height: 630,
        alt: 'JobAZ — UK Career Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobAZ — UK Career Platform',
    description:
      'Plan your UK career route, build your CV, find jobs, and discover relevant courses and licences.',
    images: [`${appUrl}/og-image`],
    creator: '@jobaz',
    site: '@jobaz',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JobAZ',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-jobaz-theme="dark" className="dark">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jobaz-theme-v1')||'dark';if(t!=='day'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-jobaz-theme',t);document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t==='day'?'light':'dark';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='day'?'#08122f':'#2563eb');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  name: 'JobAZ',
                  url: appUrl,
                  logo: `${appUrl}/logo.png`,
                  description:
                    'UK career platform for jobs, courses, licences, CV tools, and guided career recommendations.',
                },
                {
                  '@type': 'WebSite',
                  name: 'JobAZ',
                  url: appUrl,
                  description:
                    'Find UK jobs, explore career courses and licences, build your CV, and get guided career recommendations.',
                  publisher: { '@type': 'Organization', name: 'JobAZ' },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.className} transition-colors duration-300 jobaz-page-bg min-h-screen`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
