'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  GA_MEASUREMENT_ID,
  hasAnalyticsConsent,
} from '@/lib/cookieConsent'

/**
 * Loads Google Analytics only after the user accepts analytics cookies.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent())
    sync()
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync)
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync)
  }, [])

  if (!enabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window['ga-disable-${GA_MEASUREMENT_ID}'] = false;
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied'
          });
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          function sendPV(){
            if (window['ga-disable-${GA_MEASUREMENT_ID}']) return;
            gtag('event','page_view',{
              page_location: location.href,
              page_path: location.pathname + location.search,
              page_title: document.title
            });
          }
          sendPV();
          if (!window.__jobazGaHistoryHooked) {
            window.__jobazGaHistoryHooked = true;
            var _push = history.pushState;
            history.pushState = function(){ _push.apply(this, arguments); sendPV(); };
            var _rep = history.replaceState;
            history.replaceState = function(){ _rep.apply(this, arguments); sendPV(); };
            window.addEventListener('popstate', sendPV);
          }
        `}
      </Script>
    </>
  )
}
