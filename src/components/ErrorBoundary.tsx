import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

function FallbackUI({ onReload }: { onReload: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Что-то пошло не так
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.
        </p>
        <button
          onClick={onReload}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-magenta-500 hover:bg-magenta-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Обновить страницу
        </button>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI onReload={() => window.location.reload()} />
    }
    return this.props.children
  }
}
