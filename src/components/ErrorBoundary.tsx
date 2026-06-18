import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Mengu ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-navy-900 p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-pink-50 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E91E8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-magenta-500 hover:bg-magenta-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
