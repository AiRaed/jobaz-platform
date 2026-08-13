'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import WorkspaceErrorPanel from './WorkspaceErrorPanel'

type Props = {
  children: ReactNode
  /** Optional label for console diagnostics */
  name?: string
}

type State = {
  error: Error | null
}

/**
 * Client ErrorBoundary — catches render crashes so Fast Refresh / bad plan data
 * cannot leave a permanently blank page.
 */
export default class WorkspaceErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const label = this.props.name || 'WorkspaceErrorBoundary'
    console.error(`[${label}]`, error, info.componentStack)
  }

  private reload = () => {
    this.setState({ error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.error) {
      return (
        <WorkspaceErrorPanel
          error={this.state.error}
          onReload={this.reload}
          showDetails={typeof process !== 'undefined' && process.env.NODE_ENV === 'development'}
        />
      )
    }
    return this.props.children
  }
}
