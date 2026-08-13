/**
 * JobAZ platform design tokens — single source for dashboard workspace UI.
 */

/** Shared layout metrics — keep header/sidebar in sync */
export const PLATFORM_HEADER_HEIGHT = '4.5rem' // 72px — enforced via min-h on sticky header
export const PLATFORM_SHELL_MAX_WIDTH = '1440px'
export const PLATFORM_SIDEBAR_WIDTH = '15.5rem' // ~248px expanded
export const PLATFORM_SIDEBAR_WIDTH_COLLAPSED = '3.25rem' // 52px

export const PLATFORM_STICKY_CHROME =
  'sticky top-0 z-[60] mb-0 jobaz-platform-header border-b border-[var(--shell-border)] min-h-[var(--jobaz-header-h,4.5rem)]'

/** Main header row (tagline + actions). Brand/logo lives in the sidebar-width column beside this. */
export const PLATFORM_HEADER_INNER =
  'px-4 md:px-6 lg:px-8 min-h-[var(--jobaz-header-h,4.5rem)] flex items-center'

/** Desktop logo column — matches sidebar width; center the wordmark with nav padding rhythm */
export const PLATFORM_SIDEBAR_BRAND =
  'jobaz-sidebar-brand hidden lg:flex shrink-0 items-center justify-center border-r border-[var(--shell-sidebar-border)] transition-[width] duration-200 ease-out'

export const PLATFORM_SIDEBAR_BRAND_LINK =
  'jobaz-sidebar-brand__link flex w-full items-center justify-center px-2'

export const PLATFORM_TOOLS_INNER = 'px-4 pb-3 md:px-8'

export const PLATFORM_EYEBROW =
  'text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-2.5'

/** User identity + embedded nav card */
export const PLATFORM_IDENTITY_CARD =
  'mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 md:px-5 md:py-3.5 shadow-[var(--shadow-soft)] dark:border-slate-800/70 dark:bg-slate-900/40'

export const PLATFORM_IDENTITY_NAV_DIVIDER =
  'mt-3 pt-3 border-t border-[var(--border-subtle)] dark:border-slate-800/50'

/** Main content rhythm — no overflow / height traps (document scroll only) */
export const PLATFORM_CONTENT = 'relative space-y-6 pb-10'
export const PLATFORM_SECTION_GAP = 'mb-6'

/** Shared main-column padding (desktop-safe right edge for CV preview / JAZ) */
export const PLATFORM_MAIN_PADDING =
  'px-4 sm:px-6 lg:px-8 xl:px-10 py-5 md:py-6 pb-10 lg:pb-12'

/** Page / section typography — CSS vars so Day mode stays dark-on-light */
export const PLATFORM_PAGE_TITLE =
  'text-xl md:text-2xl font-semibold text-[var(--text-primary)] tracking-tight'

export const PLATFORM_SECTION_TITLE =
  'text-xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2'

export const PLATFORM_PAGE_DESCRIPTION =
  'text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed'

export const PLATFORM_SECTION_DESCRIPTION =
  'text-sm text-[var(--text-secondary)] mt-1 leading-relaxed'

export const PLATFORM_PAGE_HEADER = 'mb-5 md:mb-6 relative'
export const PLATFORM_PAGE_DIVIDER =
  'mt-4 h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent'

/** Cards */
export const PLATFORM_CARD =
  'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]'

export const PLATFORM_CARD_PADDING = 'px-4 py-3 md:px-5 md:py-4'

export const PLATFORM_CARD_HOVER =
  'hover:border-violet-500/40 hover:shadow-[var(--shadow-soft)] transition dark:hover:border-violet-500/50 dark:hover:shadow-[0_18px_50px_rgba(76,29,149,0.65)]'

/** Ambient workspace glow (optional behind content) */
export const PLATFORM_AMBIENT_VIOLET =
  'pointer-events-none absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl'
export const PLATFORM_AMBIENT_CYAN =
  'pointer-events-none absolute top-40 right-0 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl'

/** Pills — shared sizing for tools + platform nav */
export const PLATFORM_PILL_BASE =
  'rounded-full font-medium transition-all duration-200 whitespace-nowrap cursor-pointer inline-flex items-center justify-center border'

export const PLATFORM_PILL_TOOL_ACTIVE =
  'px-3 py-1.5 text-xs border-blue-300 bg-blue-50 text-blue-800 shadow-sm dark:border-violet-500/50 dark:bg-violet-500/20 dark:text-violet-100 dark:shadow-[0_0_14px_rgba(139,92,246,0.35)]'

export const PLATFORM_PILL_TOOL_INACTIVE =
  'px-3 py-1.5 text-xs bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-800 hover:bg-slate-50 dark:bg-slate-900/70 dark:text-slate-400 dark:border-slate-700/50 dark:hover:border-violet-500/40 dark:hover:text-violet-200 dark:hover:bg-slate-800/90'

export const PLATFORM_PILL_NAV_ACTIVE =
  'px-2.5 py-1 text-[11px] bg-[var(--bg-surface-alt)] text-[var(--bg-primary)] border-[var(--border-subtle)] dark:bg-violet-500/20 dark:text-violet-100 dark:border-violet-400/35'

export const PLATFORM_PILL_NAV_INACTIVE =
  'px-2.5 py-1 text-[11px] bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface-alt)] hover:text-[var(--text-primary)] dark:text-slate-400 dark:border-slate-700/40 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'

export const PLATFORM_PILL_GAP = 'gap-1.5'

/** Section title accent dots */
export const PLATFORM_DOT = {
  violet: 'inline-block h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]',
  amber: 'inline-block h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]',
  cyan: 'inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]',
  emerald:
    'inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]',
} as const

export type PlatformDotColor = keyof typeof PLATFORM_DOT

/** Desktop sidebar width classes (expanded / collapsed). Desktop = lg+. */
export function platformSidebarWidthClass(collapsed: boolean): string {
  return collapsed ? 'w-[3.25rem]' : 'w-[15.5rem]'
}
