'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_JOBAZ_THEME,
  applyJobazThemeToDocument,
  persistJobazTheme,
  readStoredJobazTheme,
  type JobazTheme,
} from '@/lib/theme/jobazTheme'

type JobazThemeContextValue = {
  theme: JobazTheme
  setTheme: (theme: JobazTheme) => void
  toggleTheme: () => void
  hydrated: boolean
}

const JobazThemeContext = createContext<JobazThemeContextValue | null>(null)

export function JobazThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<JobazTheme>(DEFAULT_JOBAZ_THEME)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredJobazTheme()
    setThemeState(stored)
    applyJobazThemeToDocument(stored)
    setHydrated(true)
  }, [])

  const setTheme = useCallback((next: JobazTheme) => {
    setThemeState(next)
    persistJobazTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: JobazTheme = current === 'dark' ? 'day' : 'dark'
      persistJobazTheme(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, hydrated }),
    [theme, setTheme, toggleTheme, hydrated]
  )

  return <JobazThemeContext.Provider value={value}>{children}</JobazThemeContext.Provider>
}

export function useJobazTheme() {
  const ctx = useContext(JobazThemeContext)
  if (!ctx) {
    throw new Error('useJobazTheme must be used within JobazThemeProvider')
  }
  return ctx
}
