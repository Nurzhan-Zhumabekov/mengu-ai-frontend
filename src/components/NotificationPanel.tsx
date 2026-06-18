import { useEffect, useRef } from 'react'
import { Bell, CheckCircle, AlertTriangle, FileText, Zap, X } from 'lucide-react'
import { useUIStore } from '@/store'
import { timeAgo } from '@/utils/helpers'
import type { Notification } from '@/types'

const ICON_MAP: Record<string, React.ReactNode> = {
  task_assigned:     <CheckCircle size={14} className="text-blue-500" />,
  task_overdue:      <AlertTriangle size={14} className="text-red-500" />,
  document_approved: <FileText size={14} className="text-emerald-500" />,
  insight_new:       <Zap size={14} className="text-magenta-500" />,
  event_processed:   <Bell size={14} className="text-purple-500" />,
  sla_breach:        <AlertTriangle size={14} className="text-amber-500" />,
  system:            <Bell size={14} className="text-gray-400" />,
}

export function NotificationPanel() {
  const { notifications, markAsRead, markAllAsRead, setNotificationsPanelOpen } = useUIStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setNotificationsPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setNotificationsPanelOpen])

  // Generate demo notifications if empty
  const items: Notification[] = notifications.length > 0 ? notifications : [
    { id: 'n1', type: 'task_assigned', title: 'New task assigned', message: 'Review attached contract — from AI analysis', read: false, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'n2', type: 'insight_new', title: 'AI Insight', message: 'Contract awaiting signature for 8 days — risk of losing deal', read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'n3', type: 'document_approved', title: 'Document approved', message: 'Kcell NDA signed and filed', read: true, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: 'n4', type: 'event_processed', title: 'Email processed', message: 'Demo Request from Halyk Bank → 2 tasks created', read: true, created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: 'n5', type: 'sla_breach', title: 'SLA Warning', message: '2 HR tasks overdue by >24 hours', read: false, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  ]

  const unread = items.filter((n) => !n.read).length

  return (
    <div ref={ref} className="absolute right-4 top-14 z-50 w-[380px] max-h-[480px] bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unread > 0 && (
            <span className="text-[10px] font-medium bg-magenta-500 text-white px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-magenta-500 hover:text-magenta-600">
              Mark all read
            </button>
          )}
          <button onClick={() => setNotificationsPanelOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-50 dark:divide-white/5">
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => markAsRead(n.id)}
            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
              !n.read ? 'bg-magenta-50/40 dark:bg-magenta-500/5' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
              {ICON_MAP[n.type] ?? <Bell size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-900 dark:text-white">{n.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{n.message}</div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.created_at)}</div>
            </div>
            {!n.read && <div className="w-2 h-2 bg-magenta-500 rounded-full mt-2 flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  )
}
