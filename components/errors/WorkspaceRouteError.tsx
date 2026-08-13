'use client'

import { useEffect } from 'react'
import WorkspaceErrorPanel from './WorkspaceErrorPanel'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Next.js `error.tsx` adapter for dashboard / Career Assistant / admin. */
export default function WorkspaceRouteError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[WorkspaceRouteError]', error)
  }, [error])

  return (
    <WorkspaceErrorPanel
      error={error}
      onReload={() => {
        try {
          reset()
        } catch {
          if (typeof window !== 'undefined') window.location.reload()
        }
      }}
    />
  )
}
