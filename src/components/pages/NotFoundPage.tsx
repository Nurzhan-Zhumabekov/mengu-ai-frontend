import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-bold text-magenta-500 mb-3">404</div>
        <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Страница не найдена
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-magenta-500 hover:bg-magenta-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Home size={16} />
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}
