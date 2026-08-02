'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

export type JazEyeVariant = 'floating' | 'header' | 'inline'

export type JazEyeIconSize = 'sm' | 'md' | 'lg' | number

interface JazEyeIconProps {
  className?: string
  /** Visual context — drives size, shell, and glow */
  variant?: JazEyeVariant
  /** Override outer box size in px (badge/container). Eye fills 78–84% automatically. */
  size?: JazEyeIconSize
  ariaLabel?: string
  /**
   * Soft outer glow. Defaults: floating=true, header=false, inline=false.
   * Dark mode uses one subtle glow; day mode stays crisp.
   */
  glow?: boolean
  /**
   * Compact circular badge behind the eye.
   * Defaults: header=true, floating/inline=false
   * (Floating uses the orb button shell in JazAssistant.)
   */
  withBadge?: boolean
}

const VARIANT_DEFAULTS: Record<
  JazEyeVariant,
  { container: number; eye: number; glow: boolean; badge: boolean }
> = {
  // Eye fills ~78% of 56px container
  floating: { container: 56, eye: 44, glow: true, badge: false },
  // Eye fills ~84% of 32px badge
  header: { container: 32, eye: 27, glow: false, badge: true },
  // Compact mark for labels / chips
  inline: { container: 16, eye: 16, glow: false, badge: false },
}

function resolveSizePx(size: JazEyeIconSize | undefined, fallback: number): number {
  if (size === undefined) return fallback
  if (typeof size === 'number') return size
  if (size === 'sm') return 16
  if (size === 'lg') return 28
  return 22
}

/**
 * Shared JAZ AI eye mark — one SVG, three variants.
 * Keep proportions tight so the eye never looks tiny inside an empty circle.
 */
export default function JazEyeIcon({
  className,
  variant = 'inline',
  size,
  ariaLabel = 'JAZ AI assistant',
  glow,
  withBadge,
}: JazEyeIconProps) {
  const defaults = VARIANT_DEFAULTS[variant]
  const showGlow = glow ?? defaults.glow
  const showBadge = withBadge ?? defaults.badge

  // `size` = outer box (badge/container). Eye fills a fixed % so it never looks tiny.
  const fillRatio = variant === 'floating' ? 0.78 : variant === 'header' ? 0.84 : 1
  const containerPx = resolveSizePx(size, showBadge || variant === 'floating' ? defaults.container : defaults.eye)
  const eyePx = Math.round(containerPx * fillRatio)

  const uid = `jaz-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const eye = (
    <svg
      className="jaz-eye-svg relative z-[1] block"
      width={eyePx}
      height={eyePx}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}-iris`} cx="50%" cy="42%" r="64%">
          <stop offset="0%" stopColor="var(--jaz-iris-hi, #C4B5FD)" />
          <stop offset="50%" stopColor="var(--jaz-iris-mid, #818CF8)" />
          <stop offset="100%" stopColor="var(--jaz-iris-lo, #3730A3)" />
        </radialGradient>
        <radialGradient id={`${uid}-pupil`} cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="var(--jaz-pupil-hi, #1E293B)" />
          <stop offset="100%" stopColor="var(--jaz-pupil-lo, #020617)" />
        </radialGradient>
      </defs>

      {/* Single filled disc — no extra outer stroke ring (avoids stacked circles) */}
      <circle cx="32" cy="32" r="30" fill={`url(#${uid}-iris)`} className="jaz-eye-iris" />

      {/* Soft edge highlight only — not a second ring */}
      <circle
        cx="32"
        cy="32"
        r="29.25"
        stroke="var(--jaz-rim, rgba(255,255,255,0.22))"
        strokeWidth="1.25"
        fill="none"
        className="jaz-eye-rim"
      />

      {/* Pupil — balanced “O” (~55% of iris diameter) */}
      <circle cx="32" cy="32" r="16.5" fill={`url(#${uid}-pupil)`} className="jaz-eye-pupil" />

      <circle
        cx="39.5"
        cy="25"
        r="4"
        fill="var(--jaz-glint, #F8FAFC)"
        className="jaz-eye-glint"
      />
      <circle cx="37.5" cy="27.5" r="1.35" fill="var(--jaz-glint-soft, rgba(248,250,252,0.45))" />
    </svg>
  )

  return (
    <span
      className={cn(
        'jaz-eye-icon relative inline-flex items-center justify-center shrink-0',
        `jaz-eye--${variant}`,
        showBadge && 'jaz-eye-badge',
        className
      )}
      style={{ width: containerPx, height: containerPx }}
      role="img"
      aria-label={ariaLabel || undefined}
      aria-hidden={ariaLabel === '' ? true : undefined}
    >
      {showGlow && <span className="jaz-eye-glow" aria-hidden />}
      {eye}
    </span>
  )
}

export { VARIANT_DEFAULTS as JAZ_EYE_VARIANT_DEFAULTS }
