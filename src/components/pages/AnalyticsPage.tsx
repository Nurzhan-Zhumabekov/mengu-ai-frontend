import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CheckCircle2, XCircle, ClipboardList, Clock } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { timeAgo, eventStatusClass, LIVE_POLL_INTERVAL_MS } from '@/utils/helpers'
import { eventsService, tasksService } from '@/services'
import type { EventListItem } from '@/types'

const EVENT_STATUSES = ['new', 'processing', 'completed', 'failed'] as const
const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const

const EVENT_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  processing: 'bg-amber-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500',
}

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-slate-500',
}

const EVENT_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function AnalyticsPage() {
  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', 'analytics'],
    queryFn: () => eventsService.getAll({ per_page: 1000 }),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks', 'analytics'],
    queryFn: () => tasksService.getAll({ per_page: 1000 }),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const metrics = useMemo(() => {
    const events = eventsData?.data ?? []
    const tasks = tasksData?.data ?? []

    const eventsByStatus: Record<string, number> = {}
    for (const s of EVENT_STATUSES) eventsByStatus[s] = 0
    for (const e of events) eventsByStatus[e.status] = (eventsByStatus[e.status] ?? 0) + 1

    const tasksByStatus: Record<string, number> = {}
    for (const s of TASK_STATUSES) tasksByStatus[s] = 0
    for (const t of tasks) tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1

    const completedEvents = events.filter((e) => e.status === 'completed')
    const avgProcessingMs = completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + (Date.now() - new Date(e.created_at).getTime()), 0) / completedEvents.length
      : 0

    const tasksByAssignee: Record<string, number> = {}
    for (const t of tasks) {
      const key = t.assignee_id ?? 'Unassigned'
      tasksByAssignee[key] = (tasksByAssignee[key] ?? 0) + 1
    }

    const recentEvents = [...events]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    return {
      totalEvents: events.length,
      totalTasks: tasks.length,
      eventsByStatus,
      tasksByStatus,
      avgProcessingMs,
      tasksByAssignee,
      recentEvents,
      completedCount: completedEvents.length,
      failedCount: events.filter((e) => e.status === 'failed').length,
    }
  }, [eventsData, tasksData])

  const {
    totalEvents, totalTasks,
    eventsByStatus, tasksByStatus,
    avgProcessingMs, tasksByAssignee,
    recentEvents, completedCount, failedCount,
  } = metrics

  const avgHours = Math.round(avgProcessingMs / (1000 * 60 * 60))
  const avgProcessingText = avgProcessingMs > 0
    ? avgHours >= 24
      ? `${Math.floor(avgHours / 24)}d ${avgHours % 24}h`
      : `${avgHours}h`
    : '\u2014'

  const assigneeEntries = Object.entries(tasksByAssignee).sort((a, b) => b[1] - a[1])
  const maxEventCount = Math.max(...Object.values(eventsByStatus), 1)
  const maxTaskCount = Math.max(...Object.values(tasksByStatus), 1)
  const maxAssigneeCount = Math.max(...assigneeEntries.map(([, c]) => c), 1)

  const isLoading = loadingEvents || loadingTasks

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Analytics" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={<BarChart3 size={18} />}
                label="Total Events"
                value={totalEvents}
                bgClass="bg-blue-500/10"
                iconClass="text-blue-500"
              />
              <MetricCard
                icon={<CheckCircle2 size={18} />}
                label="Completed"
                value={completedCount}
                bgClass="bg-emerald-500/10"
                iconClass="text-emerald-500"
              />
              <MetricCard
                icon={<XCircle size={18} />}
                label="Failed"
                value={failedCount}
                bgClass="bg-red-500/10"
                iconClass="text-red-500"
              />
              <MetricCard
                icon={<ClipboardList size={18} />}
                label="Total Tasks"
                value={totalTasks}
                bgClass="bg-magenta-500/10"
                iconClass="text-magenta-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="Events by Status">
                <div className="space-y-3">
                  {EVENT_STATUSES.map((status) => (
                    <BarRow
                      key={status}
                      label={EVENT_STATUS_LABELS[status]}
                      count={eventsByStatus[status]}
                      maxCount={maxEventCount}
                      barColor={EVENT_STATUS_COLORS[status]}
                    />
                  ))}
                </div>
              </Card>

              <Card title="Tasks by Status">
                <div className="space-y-3">
                  {TASK_STATUSES.map((status) => (
                    <BarRow
                      key={status}
                      label={TASK_STATUS_LABELS[status]}
                      count={tasksByStatus[status]}
                      maxCount={maxTaskCount}
                      barColor={TASK_STATUS_COLORS[status]}
                    />
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card
                title="Tasks by Assignee"
                action={
                  avgProcessingMs > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      <span>Avg processing: {avgProcessingText}</span>
                    </div>
                  ) : undefined
                }
              >
                {assigneeEntries.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No tasks assigned</div>
                ) : (
                  <div className="space-y-3">
                    {assigneeEntries.map(([assignee, count]) => (
                      <BarRow
                        key={assignee}
                        label={assignee.length > 12 ? `${assignee.slice(0, 12)}\u2026` : assignee}
                        count={count}
                        maxCount={maxAssigneeCount}
                        barColor="bg-magenta-500"
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Recent Activity">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No recent events</div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-navy-700">
                    {recentEvents.map((event) => (
                      <ActivityRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  icon, label, value, bgClass, iconClass,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  bgClass: string
  iconClass: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass}`}>
          <div className={iconClass}>{icon}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        </div>
      </div>
    </div>
  )
}

function BarRow({
  label, count, maxCount, barColor,
}: {
  label: string
  count: number
  maxCount: number
  barColor: string
}) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 dark:text-gray-400 w-24 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-navy-700 rounded-full h-3">
        <div className={`${barColor} h-3 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{count}</span>
    </div>
  )
}

function ActivityRow({ event }: { event: EventListItem }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 -mx-4 px-4 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
          {event.subject || '(no subject)'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {event.sender?.split('@')[0] ?? 'Unknown'}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-[11px] ${eventStatusClass(event.status)}`}>
          {EVENT_STATUS_LABELS[event.status] ?? event.status}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(event.created_at)}</span>
      </div>
    </div>
  )
}
