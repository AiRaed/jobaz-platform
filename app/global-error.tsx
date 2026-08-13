'use client'

/**
 * Root layout crash fallback. Must define its own <html>/<body>
 * because the root layout is not available when this renders.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>
            Something went wrong while loading this workspace.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 20px' }}>
            Reload the page. If the screen stays blank after code edits, stop the
            terminal, delete the <code>.next</code> folder, then run{' '}
            <code>npm run dev</code> again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Reload workspace
          </button>
          {isDev && error?.message ? (
            <pre
              style={{
                marginTop: 24,
                textAlign: 'left',
                fontSize: 11,
                color: '#fda4af',
                background: '#020617',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: 12,
                overflow: 'auto',
                maxHeight: 160,
              }}
            >
              {error.message}
              {error.digest ? `\ndigest: ${error.digest}` : ''}
            </pre>
          ) : null}
        </div>
      </body>
    </html>
  )
}
