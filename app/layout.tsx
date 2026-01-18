import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ClientProviders from './client-providers'
import GA4PageView from './components/GA4PageView'

const inter = Inter({ subsets: ['latin'] })

const appUrl = 'https://jobaz.io'
const GA_MEASUREMENT_ID = 'G-XYH878PXVQ'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'JobAZ – CV, Jobs & Interview Training',
  description:
    'JobAZ helps you build professional CVs, discover career paths with Build Your Path, find jobs, and prepare for interviews using AI.',
  keywords: [
    'CV generator',
    'resume builder',
    'AI resume',
    'ATS optimization',
    'cover letter',
    'professional CV',
    'job search',
    'interview training',
    'career path',
    'build your path',
    'career guidance',
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
    locale: 'en_US',
    url: appUrl,
    siteName: 'JobAZ',
    title: 'JobAZ – CV, Jobs & Interview Training',
    description:
      'Build your CV, explore career routes with Build Your Path, find jobs, and get interview-ready with AI.',
    images: [
      {
        url: `${appUrl}/og-image`,
        width: 1200,
        height: 630,
        alt: 'JobAZ – Build Your Path & AI Career Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobAZ – CV, Jobs & Interview Training',
    description:
      'Build CVs, explore career paths, find jobs, and prepare for interviews with AI.',
    images: [`${appUrl}/og-image`],
    creator: '@jobaz',
    site: '@jobaz',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#7C3AED" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* GA4 base script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // IMPORTANT: disable default page_view, we will send it manually on route change
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          `}
        </Script>

        {/* Structured Data – Build Your Path */}
        <Script id="jobaz-structured-data" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'JobAZ',
            url: appUrl,
            description:
              'AI-powered platform to build CVs, explore career paths with Build Your Path, find jobs, and prepare for interviews.',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${appUrl}/build-your-path`,
              'query-input': 'required name=search_term_string',
            },
          })}
        </Script>
      </head>

      <body
        className={`${inter.className} transition-colors duration-300 bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 min-h-screen`}
      >
        {/* GA page_view tracker for App Router route changes */}
        <GA4PageView measurementId={GA_MEASUREMENT_ID} />

        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}