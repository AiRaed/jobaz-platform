'use client'

type Props = {
  title?: string
  message?: string
  error?: Error & { digest?: string }
  onReload: () => void
  /** Show stack / digest — NODE_ENV=development or admin callers */
  showDetails?: boolean
}

/**
 * Shared fallback when a workspace (dashboard / Career Assistant / admin) crashes.
 * Prefer this over a blank page after Fast Refresh or runtime errors.
 */
export default function WorkspaceErrorPanel({
  title = 'Something went wrong while loading this workspace.',
  message = 'You can reload this workspace without restarting the terminal.',
  error,
  onReload,
  showDetails,
}: Props) {
  const details =
    showDetails ??
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl">{title}</h2>
      <p className="mt-3 text-sm text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onReload}
        className="mt-6 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        Reload workspace
      </button>
      {details && error ? (
        <pre className="mt-6 max-h-40 w-full overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-left text-[11px] leading-relaxed text-rose-300/90">
          {error.message}
          {error.digest ? `\ndigest: ${error.digest}` : ''}
          {error.stack ? `\n\n${error.stack}` : ''}
        </pre>
      ) : null}
    </div>
  )
}
