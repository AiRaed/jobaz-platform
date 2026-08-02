'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import JazBrainTransition, {
  getAssistantTransitionDuration,
  prefersReducedMotion,
} from '@/components/ui/JazBrainTransition'

type StartAssistantOptions = {
  /** Force full-page navigation instead of float panel */
  forceFullPage?: boolean
  href?: string
  /** Skip entry animation (e.g. restore from minimized) */
  skipTransition?: boolean
}

type UkCareerAssistantFloatContextValue = {
  isOpen: boolean
  isMinimized: boolean
  /** True while the float panel is showing the entry transition (before conversation) */
  isEntryTransitioning: boolean
  openAssistant: (opts?: StartAssistantOptions) => void
  /** Primary entry: transition then open float or navigate */
  startAssistantWithTransition: (opts?: StartAssistantOptions) => void
  closeAssistant: () => void
  minimizeAssistant: () => void
  restoreAssistant: () => void
  toggleAssistant: () => void
}

const UkCareerAssistantFloatContext =
  createContext<UkCareerAssistantFloatContextValue | null>(null)

const DEFAULT_HREF = '/uk-career-assistant'

export function UkCareerAssistantFloatProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isEntryTransitioning, setIsEntryTransitioning] = useState(false)
  const [pageTransitionActive, setPageTransitionActive] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generationRef = useRef(0)

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const openAssistant = useCallback((opts?: StartAssistantOptions) => {
    const skip = opts?.skipTransition === true
    clearTimer()
    setIsMinimized(false)
    setIsOpen(true)
    if (skip) {
      setIsEntryTransitioning(false)
      return
    }
    setIsEntryTransitioning(true)
    const gen = ++generationRef.current
    const ms = getAssistantTransitionDuration(prefersReducedMotion())
    timerRef.current = setTimeout(() => {
      if (generationRef.current !== gen) return
      setIsEntryTransitioning(false)
      timerRef.current = null
    }, ms)
  }, [clearTimer])

  const startAssistantWithTransition = useCallback(
    (opts?: StartAssistantOptions) => {
      const href = opts?.href ?? DEFAULT_HREF
      const forceFullPage = opts?.forceFullPage === true

      if (opts?.skipTransition) {
        if (forceFullPage) {
          router.push(href)
          return
        }
        openAssistant({ skipTransition: true })
        return
      }

      // Already on the assistant page — never re-run the entry show
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/uk-career-assistant')) {
        return
      }

      clearTimer()
      const gen = ++generationRef.current
      const ms = getAssistantTransitionDuration(prefersReducedMotion())

      if (forceFullPage) {
        setPageTransitionActive(true)
        timerRef.current = setTimeout(() => {
          if (generationRef.current !== gen) return
          setPageTransitionActive(false)
          timerRef.current = null
          router.push(href)
        }, ms)
        return
      }

      // Float path: open shell + in-panel transition
      openAssistant({ skipTransition: false })
    },
    [clearTimer, openAssistant, router]
  )

  const closeAssistant = useCallback(() => {
    clearTimer()
    generationRef.current += 1
    setIsOpen(false)
    setIsMinimized(false)
    setIsEntryTransitioning(false)
  }, [clearTimer])

  const minimizeAssistant = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const restoreAssistant = useCallback(() => {
    setIsMinimized(false)
    setIsOpen(true)
    setIsEntryTransitioning(false)
  }, [])

  const toggleAssistant = useCallback(() => {
    if (isOpen) {
      closeAssistant()
      return
    }
    openAssistant()
  }, [closeAssistant, isOpen, openAssistant])

  const value = useMemo(
    () => ({
      isOpen,
      isMinimized,
      isEntryTransitioning,
      openAssistant,
      startAssistantWithTransition,
      closeAssistant,
      minimizeAssistant,
      restoreAssistant,
      toggleAssistant,
    }),
    [
      isOpen,
      isMinimized,
      isEntryTransitioning,
      openAssistant,
      startAssistantWithTransition,
      closeAssistant,
      minimizeAssistant,
      restoreAssistant,
      toggleAssistant,
    ]
  )

  return (
    <UkCareerAssistantFloatContext.Provider value={value}>
      {children}
      <JazBrainTransition
        active={pageTransitionActive}
        variant="fullscreen"
        reducedMotion={reducedMotion}
      />
    </UkCareerAssistantFloatContext.Provider>
  )
}

export function useUkCareerAssistantFloat() {
  const ctx = useContext(UkCareerAssistantFloatContext)
  if (!ctx) {
    throw new Error('useUkCareerAssistantFloat must be used within UkCareerAssistantFloatProvider')
  }
  return ctx
}

/** Safe optional hook when provider may be absent. */
export function useUkCareerAssistantFloatOptional() {
  return useContext(UkCareerAssistantFloatContext)
}
