import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './client-providers'

const inter = Inter({ subsets: ['latin'] })

const appUrl = 'https://jobaz.io'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'JobAZ — Your AI Career Assistant',
  description:
    'Build your CV with AI, find matching jobs, tailor applications, practice interviews, improve your writing, and get multilingual support — guided by JAZ.',
  keywords: [
    'AI career assistant',
    'CV builder',
    'job finder',
    'interview practice',
    'writing review',
    'proofreading',
    'multilingual',
    'CV generator',
    'resume builder',
    'AI resume',
    'ATS optimization',
    'cover letter',
    'professional CV',
    'job search',
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
    title: 'JobAZ — Your AI Career Assistant',
    description:
      'Build your CV with AI, find matching jobs, tailor applications, practice interviews, improve your writing, and get multilingual support — guided by JAZ.',
    images: [
      {
        url: `${appUrl}/og-image`,
        width: 1200,
        height: 630,
        alt: 'JobAZ — Your AI Career Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobAZ — Your AI Career Assistant',
    description:
      'Build your CV with AI, find jobs, tailor applications, practice interviews, writing review, and multilingual support — guided by JAZ.',
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

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XYH878PXVQ"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'G-XYH878PXVQ');
      `,
          }}
        />

        {/* Structured Data – Build Your Path */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'JobAZ',
              url: appUrl,
              description:
                'AI career assistant: build CVs, find jobs, tailor applications, practice interviews, writing review, and multilingual support.',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${appUrl}/build-your-path`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>

      <body
        className={`${inter.className} transition-colors duration-300 bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 min-h-screen`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}