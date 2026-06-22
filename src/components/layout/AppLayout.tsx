import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useNotificationPoller } from '@/hooks/useNotifications'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useNotificationStore } from '@/store'

export function AppLayout() {
  // Start polling for notifications across all pages
  useNotificationPoller()

  // Connect to WebSocket for real-time updates (falls back gracefully)
  const addNotification = useNotificationStore((s) => s.addNotification)
  useWebSocket({
    new_task: (msg) => {
      addNotification({ title: 'New Task', description: (msg.payload.title as string) ?? 'A new task was created', type: 'info' })
    },
    new_insight: (msg) => {
      addNotification({ title: 'New Insight', description: (msg.payload.title as string) ?? 'AI generated a new insight', type: 'info' })
    },
    notification: (msg) => {
      addNotification({ title: (msg.payload.title as string) ?? 'Notification', description: (msg.payload.description as string) ?? '', type: (msg.payload.severity as 'info' | 'warning' | 'error' | 'success') ?? 'info' })
    },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-navy-900">
      <Sidebar />
      <main role="main" className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0">
        <Outlet />
      </main>
    </div>
  )
}
