import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning'
}

let addToastFn: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  addToastFn?.({ message, type })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastFn = (t) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev, { ...t, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, 3000)
    }
    return () => { addToastFn = null }
  }, [])

  if (toasts.length === 0) return null

  const iconMap = {
    success: <CheckCircle size={16} className="text-white" />,
    error: <XCircle size={16} className="text-white" />,
    warning: <AlertTriangle size={16} className="text-white" />,
  }

  const bgMap = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    warning: 'bg-amber-500',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm text-white min-w-[280px] animate-in',
            bgMap[t.type]
          )}
        >
          {iconMap[t.type]}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-white/70 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
