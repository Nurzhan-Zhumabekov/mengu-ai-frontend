import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNotificationStore } from '@/store'
import { eventsService, tasksService } from '@/services'
import { LIVE_POLL_INTERVAL_MS } from '@/utils/helpers'

const POLL_INTERVAL = LIVE_POLL_INTERVAL_MS

/**
 * Hook that polls for new data and creates browser notifications
 * for new events, tasks, and insights. Runs as long as a user
 * is authenticated (controlled by the parent).
 */
export function useNotificationPoller() {
  const addNotification = useNotificationStore((s) => s.addNotification)
  const prevEventCount = useRef(0)
  const prevTaskCount = useRef(0)
  const initialized = useRef(false)

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => eventsService.getAll(),
    refetchInterval: POLL_INTERVAL,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
    refetchInterval: POLL_INTERVAL,
  })

  useEffect(() => {
    const eventCount = eventsData?.data.length ?? 0
    const newEvents = eventsData?.data.filter((e) => e.status === 'new').length ?? 0
    const overdueCount = tasksData?.data.filter((t) => {
      if (t.status === 'completed' || t.status === 'cancelled') return false
      if (!t.due_date) return false
      return new Date(t.due_date) < new Date()
    }).length ?? 0

    if (!initialized.current) {
      prevEventCount.current = eventCount
      prevTaskCount.current = overdueCount
      initialized.current = true
      return
    }

    if (newEvents > 0 && newEvents !== prevEventCount.current) {
      addNotification({
        title: 'New Events',
        description: `${newEvents} event${newEvents !== 1 ? 's' : ''} awaiting AI analysis in your inbox`,
        type: 'info',
      })
    }

    if (overdueCount > prevTaskCount.current) {
      addNotification({
        title: 'Overdue Tasks',
        description: `${overdueCount} task${overdueCount !== 1 ? 's' : ''} past due date`,
        type: 'warning',
      })
    }

    prevEventCount.current = eventCount
    prevTaskCount.current = overdueCount
  }, [eventsData, tasksData, addNotification])
}
