import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useWebSocket } from '@/hooks/useWebSocket'

export function AppLayout() {
  useWebSocket()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
