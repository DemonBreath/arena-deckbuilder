import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logOnlineError } from '../lib/onlineLog'
import { OnlineErrorPanel } from './OnlineErrorPanel'

interface OnlineErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}

interface OnlineErrorBoundaryState {
  error: Error | null
}

export class OnlineErrorBoundary extends Component<
  OnlineErrorBoundaryProps,
  OnlineErrorBoundaryState
> {
  state: OnlineErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): OnlineErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logOnlineError('react-boundary', error)
    if (info.componentStack) {
      console.error('[arena-online:react-boundary:stack]', info.componentStack)
    }
  }

  private handleReset = (): void => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <section className="screen online-error-screen">
          <OnlineErrorPanel
            title="Arena crashed"
            message={this.state.error.message || 'An unexpected error occurred.'}
            onRetry={this.handleReset}
          />
        </section>
      )
    }

    return this.props.children
  }
}
