import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, TrendingUp, Users, FileX, AlertCircle, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { analyticsService, eventsService, insightsService, tasksService } from '@/services/api'
import { timeAgo, eventStatusClass, formatDue, isOverdue } from '@/utils/helpers'
import type { AIInsight, IncomingEvent, Task } from '@/types'

const INSIGHT_ICONS: Record<string, { icon: React.ReactNode; colorClass: string }> = {
  contract_signing_ignore: {
    icon: <FileX size={15} />,
    colorClass: 'bg-pink-50 text-pink-700',
  },
  team_workload_imbalance: {
    icon: <Users size={15} />,
    colorClass: 'bg-amber-50 text-amber-700',
  },
  revenue_opportunity: {
    icon: <TrendingUp size={15} />,
    colorClass: 'bg-blue-50 text-blue-700',
  },
  sla_violation: {
    icon: <AlertCircle size={15} />,
    colorClass: 'bg-amber-50 text-amber-700',
  },
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getSummary,
  })

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', 'dashboard'],
    queryFn: () => eventsService.getAll({ status: 'new' }),
  })

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsService.getAll,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
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
          className="flex items-center gap-3 bg-white border border-magenta-300 rounded-xl px-4 py-3 mb-5 cursor-pointer hover:border-magenta-400 transition-colors"
        >
          <Sparkles size={18} className="text-magenta-500 flex-shrink-0" />
          <span className="text-sm text-gray-400">
            Ask Mengu anything... e.g. &ldquo;What&rsquo;s most important today?&rdquo;
          </span>
          <kbd className="ml-auto text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
            ↗
          </kbd>
        </div>

        {/* Metric cards */}
        {loadingAnalytics ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="metric-card">
              <div className="text-xs text-gray-500 mb-1.5">Incoming Today</div>
              <div className="text-2xl font-medium text-gray-900">{analytics?.events_today}</div>
              <div className="text-xs text-emerald-600 mt-1">
                ↑ {analytics?.events_auto_processed} auto-processed
              </div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-gray-500 mb-1.5">Active Tasks</div>
              <div className="text-2xl font-medium text-gray-900">{analytics?.active_tasks}</div>
              <div className="text-xs text-red-500 mt-1">
                {analytics?.overdue_tasks} overdue
              </div>
            </div>
            <div className="metric-card">
              <div className="text-xs text-gray-500 mb-1.5">Avg Response Time</div>
              <div className="text-2xl font-medium text-gray-900">
                {analytics?.avg_response_time_minutes} min
              </div>
              <div className="text-xs text-emerald-600 mt-1">↓ was 28 min manually</div>
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
            ) : (
              <div className="divide-y divide-gray-50">
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
            ) : (
              <div className="divide-y divide-gray-50">
                {insights?.slice(0, 4).map((insight) => (
                  <InsightRow key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Top 3 priorities */}
        <Card title="Top 3 Priorities Today">
          {priorities.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-400">No priority tasks</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {priorities.map((p, i) => (
                <PriorityItem
                  key={p.task.id}
                  label={i === 0 ? 'URGENT' : i === 1 ? 'IMPORTANT' : 'SCHEDULED'}
                  labelClass={i === 0 ? 'text-magenta-600' : i === 1 ? 'text-amber-600' : 'text-blue-600'}
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
          <div className="relative w-[400px] bg-white border-l border-gray-200 h-full shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-magenta-500" />
                <h3 className="text-sm font-medium text-gray-900">Ask Mengu</h3>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Sparkles size={40} className="text-magenta-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Coming soon</p>
                <p className="text-xs text-gray-400 mt-1">AI chat assistant is being built</p>
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
    <div className="flex items-start gap-2.5 py-2.5 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900 truncate">
          {event.metadata.sender?.split('@')[0]}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {event.metadata.subject}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[11px] text-gray-400">{timeAgo(event.created_at)}</span>
        <span className={eventStatusClass(event.status)}>
          {EVENT_STATUS_LABELS[event.status] ?? event.status}
        </span>
      </div>
    </div>
  )
}

function InsightRow({ insight }: { insight: AIInsight }) {
  const config = INSIGHT_ICONS[insight.type] ?? { icon: <AlertCircle size={15} />, colorClass: 'bg-gray-100 text-gray-500' }
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${config.colorClass}`}>
        {config.icon}
      </div>
      <div className="text-xs text-gray-700 leading-relaxed">
        <span className="font-medium">{insight.title}</span> — {insight.description}
      </div>
    </div>
  )
}

function PriorityItem({
  label, labelClass, title, meta,
}: { label: string; labelClass: string; title: string; meta: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className={`text-[10px] font-medium mb-1.5 ${labelClass}`}>{label}</div>
      <div className="text-[13px] font-medium text-gray-900 leading-snug mb-1.5">{title}</div>
      <div className="text-[11px] text-gray-500">{meta}</div>
    </div>
  )
}
