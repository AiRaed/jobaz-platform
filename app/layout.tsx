import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './client-providers'

const inter = Inter({ subsets: ['latin'] })

const appUrl = 'https://jobaz.io'
const GA_MEASUREMENT_ID = 'G-PDGHSSX1XK'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'JobAZ — Find Work & Build Your Career in the UK',
  description:
    'Find UK jobs, improve your CV, prepare for interviews, and follow a guided career path — a free UK career platform with smart support.',
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
    title: 'JobAZ — Find Work & Build Your Career in the UK',
    description:
      'Find UK jobs, improve your CV, prepare for interviews, and follow a guided career path.',
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
      'Find UK jobs, improve your CV, and follow a guided career path.',
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
    <html lang="en" suppressHydrationWarning data-jobaz-theme="dark" className="dark">
      <head>
        <meta name="theme-color" content="#7C3AED" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jobaz-theme-v1')||'dark';if(t!=='day'&&t!=='dark')t='dark';document.documentElement.setAttribute('data-jobaz-theme',t);document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t==='day'?'light':'dark';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='day'?'#08122f':'#7C3AED');}catch(e){}})();`,
          }}
        />

        {/* Structured Data – WebSite */}
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
        className={`${inter.className} transition-colors duration-300 jobaz-page-bg min-h-screen`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PDGHSSX1XK"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', 'G-PDGHSSX1XK', { send_page_view: false });
            function sendPV(){ gtag('event','page_view',{page_location: location.href, page_path: location.pathname + location.search, page_title: document.title}); }
            sendPV();
            var _push = history.pushState;
            history.pushState = function(){ _push.apply(this, arguments); sendPV(); };
            var _rep = history.replaceState;
            history.replaceState = function(){ _rep.apply(this, arguments); sendPV(); };
            window.addEventListener('popstate', sendPV);
          `}
        </Script>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}