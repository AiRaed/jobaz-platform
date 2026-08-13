'use client'

import WorkspaceRouteError from '@/components/errors/WorkspaceRouteError'

export default function CareerEngineError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <WorkspaceRouteError error={error} reset={reset} />
}
