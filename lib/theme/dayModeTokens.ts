/**
 * JobAZ day/dark theme token reference.
 * Source of truth lives in `app/globals.css` under `[data-jobaz-theme]`.
 * Prefer CSS variables in components; this file documents the contract.
 *
 * Day mode identity:
 * - Light workspace + deep navy branded header + blue/purple accents
 * - Page: #F7FAFF / #F8FBFF
 * - Cards: #FFFFFF · border #D7E3F4 · shadow 0 8px 24px rgba(15,23,42,0.08)
 * - Soft: #EEF4FF / #F3F7FF
 * - Header: #071A3D → #0B2A6F
 * - Sidebar: #123C8C → #1E40AF → #2563EB (lighter than header)
 * - Hero: #0B5CFF → #2563EB → #7C3AED
 * - Text: #0F172A / #475569
 * - Accents: JobAZ blue → purple
 */

export const JOBAZ_DAY_TOKEN_NAMES = [
  '--bg-app',
  '--bg-surface',
  '--bg-surface-alt',
  '--bg-header',
  '--bg-sidebar',
  '--bg-sidebar-active',
  '--bg-primary',
  '--bg-primary-hover',
  '--bg-primary-from',
  '--bg-primary-to',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--border-subtle',
  '--shadow-soft',
  '--radius-card',
  '--radius-button',
  '--jaz-bg-day',
  '--jaz-surface',
  '--jaz-surface-soft',
  '--jaz-border',
  '--jaz-primary',
  '--jaz-primary-2',
  '--jaz-text',
  '--jaz-muted',
  '--jaz-header-from',
  '--jaz-header-to',
  '--jaz-sidebar-from',
  '--jaz-sidebar-via',
  '--jaz-sidebar-to',
  '--jaz-hero-from',
  '--jaz-hero-via',
  '--jaz-hero-to',
] as const

export type JobazDayTokenName = (typeof JOBAZ_DAY_TOKEN_NAMES)[number]
