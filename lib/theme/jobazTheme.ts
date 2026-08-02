export type JobazTheme = 'dark' | 'day'

export const JOBAZ_THEME_STORAGE_KEY = 'jobaz-theme-v1'
export const JOBAZ_THEME_UPDATED_EVENT = 'jobaz-theme-updated'

export const DEFAULT_JOBAZ_THEME: JobazTheme = 'dark'

export function isJobazTheme(value: string | null | undefined): value is JobazTheme {
  return value === 'dark' || value === 'day'
}

export function readStoredJobazTheme(): JobazTheme {
  if (typeof window === 'undefined') return DEFAULT_JOBAZ_THEME
  try {
    const stored = localStorage.getItem(JOBAZ_THEME_STORAGE_KEY)
    return isJobazTheme(stored) ? stored : DEFAULT_JOBAZ_THEME
  } catch {
    return DEFAULT_JOBAZ_THEME
  }
}

export function applyJobazThemeToDocument(theme: JobazTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-jobaz-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme === 'day' ? 'light' : 'dark'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'day' ? '#081425' : '#0F172A')
  }
}

export function persistJobazTheme(theme: JobazTheme): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(JOBAZ_THEME_STORAGE_KEY, theme)
  applyJobazThemeToDocument(theme)
  window.dispatchEvent(new CustomEvent(JOBAZ_THEME_UPDATED_EVENT, { detail: { theme } }))
}
