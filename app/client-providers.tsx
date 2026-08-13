'use client'

import { Suspense } from 'react'
import { JobazThemeProvider } from '@/contexts/JobazThemeContext'
import { ToastProvider } from '@/components/ui/toast'
import { TranslationSettingsProvider } from '@/contexts/TranslationSettingsContext'
import { JazContextProvider } from '@/contexts/JazContextContext'
import { UkCareerAssistantFloatProvider } from '@/contexts/UkCareerAssistantFloatContext'
import JazAssistant from '@/components/JazAssistant'
import UkCareerAssistantFloatPanel from '@/components/uk-career-assistant/UkCareerAssistantFloatPanel'
import HoverTranslateLayer from '@/components/HoverTranslateLayer'
import ServiceWorkerGuard from '@/components/ServiceWorkerGuard'
import NavigationProgress from '@/components/navigation/NavigationProgress'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <JobazThemeProvider>
      <ToastProvider>
        <TranslationSettingsProvider>
          <JazContextProvider>
            <UkCareerAssistantFloatProvider>
              <ServiceWorkerGuard />
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
              <JazAssistant />
              <UkCareerAssistantFloatPanel />
              <HoverTranslateLayer />
              <GoogleAnalytics />
              <CookieConsentBanner />
            </UkCareerAssistantFloatProvider>
          </JazContextProvider>
        </TranslationSettingsProvider>
      </ToastProvider>
    </JobazThemeProvider>
  )
}
