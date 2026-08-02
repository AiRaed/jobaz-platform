import type { CourseDeliveryMode } from './types'
import { deliveryModeLabel } from './types'

export const COURSE_DELIVERY_MODE_OPTIONS: { value: CourseDeliveryMode; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-person' },
  { value: 'hybrid', label: 'Hybrid' },
]

export const OPTIONAL_COURSE_DELIVERY_MODE_OPTIONS: { value: CourseDeliveryMode; label: string }[] = [
  { value: 'virtual', label: 'Virtual' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'exam_in_person', label: 'In-person exam' },
]

const KNOWN_MODES = new Set<string>([
  'online',
  'in_person',
  'hybrid',
  'virtual',
  'classroom',
  'exam_in_person',
])

export function normalizeDeliveryMode(value: string | null | undefined): CourseDeliveryMode | null {
  const raw = (value ?? '').trim().toLowerCase()
  if (!raw) return null

  const normalized = raw.replace(/-/g, '_').replace(/\s+/g, '_')
  if (normalized === 'inperson') return 'in_person'
  if (KNOWN_MODES.has(normalized)) return normalized as CourseDeliveryMode
  return null
}

export function resolveDeliveryModes(
  modes: string[] | null | undefined,
  legacyMode: string | null | undefined
): CourseDeliveryMode[] {
  const fromArray = (modes ?? [])
    .map(normalizeDeliveryMode)
    .filter((mode): mode is CourseDeliveryMode => mode !== null)

  if (fromArray.length > 0) {
    return [...new Set(fromArray)]
  }

  const legacy = normalizeDeliveryMode(legacyMode)
  return legacy ? [legacy] : []
}

export function normalizeDeliveryModesInput(
  modes: CourseDeliveryMode[] | null | undefined,
  legacyMode?: CourseDeliveryMode | null
): CourseDeliveryMode[] {
  const fromArray = (modes ?? [])
    .map((mode) => normalizeDeliveryMode(mode))
    .filter((mode): mode is CourseDeliveryMode => mode !== null)

  if (fromArray.length > 0) {
    return [...new Set(fromArray)]
  }

  const legacy = normalizeDeliveryMode(legacyMode ?? null)
  return legacy ? [legacy] : []
}

export function formatDeliveryModesDisplay(modes: CourseDeliveryMode[]): string {
  if (!modes.length) return 'Delivery not specified'
  return modes.map((mode) => deliveryModeLabel(mode)).join(' · ')
}

export function courseIncludesDeliveryMode(
  modes: CourseDeliveryMode[],
  filter: CourseDeliveryMode
): boolean {
  return modes.includes(filter)
}

export function primaryDeliveryMode(modes: CourseDeliveryMode[]): CourseDeliveryMode {
  return modes[0] ?? 'in_person'
}
