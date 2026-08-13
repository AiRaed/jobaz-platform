/** Shared SEO constants for JobAZ public pages. */

export const JOBAZ_SITE_URL = 'https://jobaz.io'

export const PRIVATE_PAGE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const

export const UK_COURSE_KEYWORDS = [
  'UK career courses and licences',
  'SIA Door Supervisor course UK',
  'Security licence course UK',
  'Care Certificate course UK',
  'Health and social care course UK',
  'CSCS course UK',
  'Forklift licence UK',
  'UK training courses',
  'JobAZ courses',
] as const
