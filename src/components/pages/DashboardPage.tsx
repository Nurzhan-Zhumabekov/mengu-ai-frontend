import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Clock3, Users, FileX, AlertCircle, ArrowRight, X, Inbox, Lightbulb } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, EmptyState } from '@/components/ui'
import { analyticsService, eventsService, insightsService, tasksService } from '@/services'
import { timeAgo, eventStatusClass, formatDue, isOverdue, LIVE_POLL_INTERVAL_MS } from '@/utils/helpers'
import type { Insight, IncomingEvent, Task } from '@/types'

const INSIGHT_ICONS: Record<string, { icon: React.ReactNode; colorClass: string }> = {
  overdue_task: {
    icon: <Clock3 size={15} />,
    colorClass: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  },
  draft_pending_too_long: {
    icon: <FileX size={15} />,
    colorClass: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300',
  },
  unassigned_task: {
    icon: <Users size={15} />,
    colorClass: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  },
  action_failure_spike: {
    icon: <AlertCircle size={15} />,
    colorClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getSummary,
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', 'dashboard'],
    queryFn: () => eventsService.getAll({ status: 'new' }),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsService.getAll,
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const events = eventsData?.data.slice(0, 4) ?? []
  const allTasks = tasksData?.data ?? []

  const priorities = derivePriorities(allTasks)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Ask Mengu bar */}
        <div
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-3 bg-white dark:bg-navy-800 border border-magenta-300 dark:border-magenta-500/40 rounded-xl px-4 py-3 mb-5 cursor-pointer hover:border-magenta-400 transition-colors"
        >
          <Sparkles size={18} className="text-magenta-500 flex-shrink-0" />
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Ask Mengu anything... e.g. &ldquo;What&rsquo;s most important today?&rdquo;
          </span>
          <kbd className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600 rounded px-2 py-0.5">
            ↗
          </kbd>
        </div>

        {/* Metric cards */}
        {loadingAnalytics ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="metric-card">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Incoming Today</div>
              <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{analytics?.events_today}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                ↑ {analytics?.events_auto_processed} auto-processed
              </div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Active Tasks</div>
              <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{analytics?.active_tasks}</div>
              <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                {analytics?.overdue_tasks} overdue
              </div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Documents with Risks</div>
              <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">
                {analytics?.open_documents}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">flagged by AI analysis</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Inbox preview */}
          <Card
            title="Inbox AI"
            action={
              <button
                onClick={() => navigate('/inbox')}
                className="flex items-center gap-1 text-xs text-magenta-500 hover:text-magenta-600"
              >
                View all <ArrowRight size={12} />
              </button>
            }
          >
            {loadingEvents ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : events.length === 0 ? (
              <EmptyState icon={<Inbox size={24} />} title="No new events" />
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-navy-700">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </Card>

          {/* AI Insights preview */}
          <Card
            title="AI Insights"
            action={
              <button
                onClick={() => navigate('/insights')}
                className="flex items-center gap-1 text-xs text-magenta-500 hover:text-magenta-600"
              >
                View all <ArrowRight size={12} />
              </button>
            }
          >
            {loadingInsights ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : !insights || insights.length === 0 ? (
              <EmptyState icon={<Lightbulb size={24} />} title="No insights yet" />
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-navy-700">
                {insights.slice(0, 4).map((insight) => (
                  <InsightRow key={insight.key} insight={insight} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Top 3 priorities */}
        <Card title="Top 3 Priorities Today">
          {priorities.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No priority tasks</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {priorities.map((p, i) => (
                <PriorityItem
                  key={p.task.id}
                  label={i === 0 ? 'URGENT' : i === 1 ? 'IMPORTANT' : 'SCHEDULED'}
                  labelClass={i === 0 ? 'text-magenta-600 dark:text-magenta-400' : i === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}
                  title={p.task.title}
                  meta={p.meta}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Chat slide-in panel */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setChatOpen(false)} />
          <div className="relative w-[400px] bg-white dark:bg-navy-800 border-l border-gray-200 dark:border-navy-600 h-full shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-600">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-magenta-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ask Mengu</h3>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Sparkles size={40} className="text-magenta-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">AI chat assistant is being built</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function derivePriorities(tasks: Task[]): { task: Task; meta: string }[] {
  const active = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
  const unsorted = active.map((t) => ({
    task: t,
    score: isOverdue(t.due_date) ? 3 : t.due_date ? 2 : 1,
    meta: t.due_date ? formatDue(t.due_date) : 'No deadline',
  }))
  unsorted.sort((a, b) => b.score - a.score)
  return unsorted.slice(0, 3)
}

const EVENT_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

function EventRow({ event }: { event: IncomingEvent }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 -mx-4 px-4 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
          {event.metadata.sender?.split('@')[0]}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {event.metadata.subject}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(event.created_at)}</span>
        <span className={eventStatusClass(event.status)}>
          {EVENT_STATUS_LABELS[event.status] ?? event.status}
        </span>
      </div>
    </div>
  )
}

function InsightRow({ insight }: { insight: Insight }) {
  const config = INSIGHT_ICONS[insight.type] ?? { icon: <AlertCircle size={15} />, colorClass: 'bg-gray-100 text-gray-500 dark:bg-navy-600 dark:text-gray-400' }
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.colorClass}`}>
        {config.icon}
      </div>
      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
        <span className="font-medium">{insight.title}</span> — {insight.description}
      </div>
    </div>
  )
}

function PriorityItem({
  label, labelClass, title, meta,
}: { label: string; labelClass: string; title: string; meta: string }) {
  return (
    <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 border border-gray-100 dark:border-navy-600">
      <div className={`text-[10px] font-medium mb-1.5 ${labelClass}`}>{label}</div>
      <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1.5">{title}</div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400">{meta}</div>
    </div>
  )
}
