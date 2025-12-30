export const PREVIEW_SECONDS = 90 // free preview duration
export const EXTEND_SECONDS = 0 // reserved for future use (e.g. +30s)
export const LAUNCH_PRICE_GBP = 2.99 // promo price
export const ACCESS_WINDOW_HOURS = 24 // unlocked period after purchase

export type FunnelLanguage = 'en' | 'ar'

export const FUNNEL_STRINGS: Record<
  FunnelLanguage,
  {
    previewBarLabel: string
    previewCta: string
    watermark: string
    paywallTitle: string
    paywallTitleExpired: string
    paywallBullets: string[]
    paywallPrimaryCta: string
    paywallPrimaryCtaExpired: string
    paywallTrustLine: string
    lockTooltip: string
    accessCountdownLabel: string
    accessCountdownExpired: string
  }
> = {
  en: {
    previewBarLabel: 'Free preview — {{mm:ss}} left',
    previewCta: 'Pay £{{price}}',
    watermark: 'Preview — text partially hidden',
    paywallTitle: 'Your AI-enhanced CV is ready',
    paywallTitleExpired: 'Access ended — extend for another 24h',
    paywallBullets: [
      'ATS-friendly PDF/DOCX',
      'Save your edits',
      'One-time payment — no subscription',
    ],
    paywallPrimaryCta: 'Pay £{{price}} & Download',
    paywallPrimaryCtaExpired: 'Pay £{{price}} & Download',
    paywallTrustLine: 'Donations help keep JobAZ free for everyone',
    lockTooltip: 'Preview your CV here. Export to PDF or DOCX when you\'re ready.',
    accessCountdownLabel: 'AI access active — {{hh:mm:ss}} remaining',
    accessCountdownExpired: 'Access ended — extend for another 24h',
  },
  ar: {
    previewBarLabel: 'تجربة مجانية — {{mm:ss}} متبقية',
    previewCta: 'ادفع £{{price}}',
    watermark: 'معاينة — النص مخفّض',
    paywallTitle: 'سيرتك جاهزة مع تحسين بالذكاء الاصطناعي',
    paywallTitleExpired: 'انتهت الصلاحية — مدّد ليوم إضافي',
    paywallBullets: [
      'PDF/DOCX مناسب لـ ATS',
      'حفظ تعديلاتك',
      'دفع مرة واحدة — بدون اشتراك',
    ],
    paywallPrimaryCta: 'ادفع £{{price}} وحمّل الملف',
    paywallPrimaryCtaExpired: 'ادفع £{{price}} وحمّل الملف',
    paywallTrustLine: 'التبرعات تساعد في إبقاء JobAZ مجانيًا للجميع',
    lockTooltip: 'معاينة سيرتك الذاتية هنا. قم بالتصدير إلى PDF أو DOCX عندما تكون جاهزًا.',
    accessCountdownLabel: 'صلاحية الذكاء الاصطناعي فعّالة — {{hh:mm:ss}} متبقية',
    accessCountdownExpired: 'انتهت الصلاحية — مدّد ليوم إضافي',
  },
}

export function detectFunnelLanguage(): FunnelLanguage {
  if (typeof document === 'undefined') return 'en'
  const lang = document.documentElement.lang || 'en'
  return lang.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}


