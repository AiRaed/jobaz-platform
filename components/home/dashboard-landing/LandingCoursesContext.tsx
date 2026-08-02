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
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import type { CourseDeliveryMode } from '@/lib/admin/courses/types'

const LANDING_COURSES_LIMIT = 12

type LandingCoursesContextValue = {
  keyword: string
  location: string
  setKeyword: (value: string) => void
  setLocation: (value: string) => void
  courses: CareerHubCourseListing[]
  loading: boolean
  error: string | null
  emptyMessage: string | null
  search: (keyword?: string, location?: string) => Promise<void>
  loadDefault: () => Promise<void>
}

const LandingCoursesContext = createContext<LandingCoursesContextValue | null>(null)

function detectDeliveryMode(keyword: string): CourseDeliveryMode | undefined {
  const k = keyword.toLowerCase()
  if (/\bonline\b/.test(k)) return 'online'
  if (/\bhybrid\b/.test(k)) return 'hybrid'
  if (/\bin[- ]?person\b/.test(k)) return 'in_person'
  return undefined
}

function matchesLocation(course: CareerHubCourseListing, location: string): boolean {
  if (!location || location === 'UK (Anywhere)') return true
  if (location === 'Online') return true

  const needle = location.toLowerCase()
  if (course.location.toLowerCase().includes(needle)) return true

  const available = course.marketplace?.availableLocations ?? []
  return available.some((loc) => loc.toLowerCase().includes(needle))
}

function matchesDeliveryKeyword(course: CareerHubCourseListing, keyword: string): boolean {
  const k = keyword.toLowerCase()
  const delivery = course.type.toLowerCase()
  if (/\bonline\b/.test(k) && delivery.includes('online')) return true
  if (/\bhybrid\b/.test(k) && delivery.includes('hybrid')) return true
  if (/\bin[- ]?person\b/.test(k) && (delivery.includes('in-person') || delivery.includes('in person')))
    return true
  return false
}

function filterClient(
  courses: CareerHubCourseListing[],
  keyword: string,
  location: string
): CareerHubCourseListing[] {
  const q = keyword.trim().toLowerCase()
  let result = courses

  if (location && location !== 'UK (Anywhere)' && location !== 'Online') {
    result = result.filter((course) => matchesLocation(course, location))
  }

  if (!q) return result

  return result.filter((course) => {
    const haystack = [
      course.name,
      course.description,
      course.providerPlaceholder ?? course.marketplace?.providerName ?? '',
      course.type,
      course.pathId,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q) || matchesDeliveryKeyword(course, q)
  })
}

function isDeliveryOnlyKeyword(keyword: string): boolean {
  return /^(online|hybrid|in[- ]?person)$/i.test(keyword.trim())
}

function buildApiParams(keyword: string, location: string): URLSearchParams {
  const params = new URLSearchParams()
  const q = keyword.trim()
  const deliveryFromKeyword = q ? detectDeliveryMode(q) : undefined

  if (location === 'Online') {
    params.set('delivery', 'online')
  } else if (deliveryFromKeyword) {
    params.set('delivery', deliveryFromKeyword)
  }

  if (q && !isDeliveryOnlyKeyword(q)) {
    params.set('q', q)
  }

  return params
}

export function LandingCoursesProvider({ children }: { children: ReactNode }) {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('UK (Anywhere)')
  const [courses, setCourses] = useState<CareerHubCourseListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)

  const fetchCourses = useCallback(async (params: URLSearchParams, clientFilter?: { keyword: string; location: string }) => {
    setLoading(true)
    setError(null)
    setEmptyMessage(null)

    try {
      const res = await fetch(`/api/career-hub/courses?${params.toString()}`, { cache: 'no-store' })
      const data = (await res.json()) as { courses?: CareerHubCourseListing[]; error?: string }

      if (!res.ok) {
        setCourses([])
        setError(data.error || 'Unable to load courses right now. Please try again.')
        return
      }

      let list = data.courses ?? []

      if (clientFilter) {
        list = filterClient(list, clientFilter.keyword, clientFilter.location)
      }

      list = list.slice(0, LANDING_COURSES_LIMIT)
      setCourses(list)

      if (list.length === 0) {
        setEmptyMessage('No courses match your search. Try another keyword or browse all courses.')
      }
    } catch {
      setCourses([])
      setError('Unable to load courses right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDefault = useCallback(async () => {
    await fetchCourses(new URLSearchParams())
  }, [fetchCourses])

  const search = useCallback(
    async (kw?: string, loc?: string) => {
      const nextKeyword = (kw ?? keyword).trim()
      const nextLocation = loc ?? location

      if (kw !== undefined) setKeyword(kw)
      if (loc !== undefined) setLocation(loc)

      if (!nextKeyword && (!nextLocation || nextLocation === 'UK (Anywhere)')) {
        await loadDefault()
        return
      }

      const params = buildApiParams(nextKeyword, nextLocation)
      const needsLocationFilter =
        Boolean(nextLocation) && nextLocation !== 'UK (Anywhere)' && nextLocation !== 'Online'
      const needsDeliveryAugment =
        Boolean(nextKeyword) && !isDeliveryOnlyKeyword(nextKeyword) && Boolean(detectDeliveryMode(nextKeyword))

      await fetchCourses(
        params,
        needsLocationFilter || needsDeliveryAugment
          ? { keyword: nextKeyword, location: nextLocation }
          : undefined
      )
    },
    [fetchCourses, keyword, location, loadDefault]
  )

  useEffect(() => {
    void loadDefault()
  }, [loadDefault])

  const value = useMemo(
    () => ({
      keyword,
      location,
      setKeyword,
      setLocation,
      courses,
      loading,
      error,
      emptyMessage,
      search,
      loadDefault,
    }),
    [keyword, location, courses, loading, error, emptyMessage, search, loadDefault]
  )

  return <LandingCoursesContext.Provider value={value}>{children}</LandingCoursesContext.Provider>
}

export function useLandingCourses() {
  const ctx = useContext(LandingCoursesContext)
  if (!ctx) throw new Error('useLandingCourses must be used within LandingCoursesProvider')
  return ctx
}

export function useLandingCoursesOptional() {
  return useContext(LandingCoursesContext)
}
