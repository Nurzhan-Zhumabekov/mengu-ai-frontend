import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Lightbulb, Brain, Target, CheckCircle, AlertTriangle } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, EmptyState } from '@/components/ui'
import { eventsService, tasksService } from '@/services'
import { isOverdue, formatDateTime } from '@/utils/helpers'
import type { AIAnalysis } from '@/types'

export function InsightsPage() {
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'completed', 'insights'],
    queryFn: () => eventsService.getAll({ status: 'completed', per_page: 50 }),
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'insights'],
    queryFn: () => tasksService.getAll(),
  })

  const completedEvents = eventsData?.data ?? []

  const detailQueries = useQueries({
    queries: completedEvents.map((event) => ({
      queryKey: ['event-detail', event.id],
      queryFn: () => eventsService.getById(event.id),
      staleTime: 1000 * 60 * 5,
    })),
  })

  const detailsLoading = detailQueries.length > 0 && detailQueries.some((q) => q.isLoading)

  const analyses = useMemo(() => {
    const result: AIAnalysis[] = []
    for (const q of detailQueries) {
      if (q.data?.analysis) {
        result.push(q.data.analysis)
      }
    }
    return result
  }, [detailQueries])

  const stats = useMemo(() => {
    const totalInsights = analyses.length
    const avgConfidence = totalInsights > 0
      ? analyses.reduce((sum, a) => sum + a.confidence, 0) / totalInsights
      : 0
    const allTasks = tasksData?.data ?? []
    const tasksCompleted = allTasks.filter((t) => t.status === 'completed').length
    const overdueCount = allTasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'cancelled' && isOverdue(t.due_date)
    ).length
    return { totalInsights, avgConfidence, tasksCompleted, overdueCount }
  }, [analyses, tasksData])

  const intentDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of analyses) {
      const intent = a.intent || 'unknown'
      counts[intent] = (counts[intent] ?? 0) + 1
    }
    const total = analyses.length || 1
    return Object.entries(counts)
      .map(([intent, count]) => ({ intent, count, percentage: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count)
  }, [analyses])

  const recentAnalyses = useMemo(() => {
    return [...analyses]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }, [analyses])

  const isLoading = eventsLoading || tasksLoading || detailsLoading

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="AI Insights" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="AI Insights" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Lightbulb size={32} />}
            title="No insights yet"
            description="Completed events with AI analysis will appear here."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="AI Insights" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            icon={<Brain size={18} />}
            label="Total Insights"
            value={stats.totalInsights}
            color="magenta"
          />
          <MetricCard
            icon={<Target size={18} />}
            label="Avg Confidence"
            value={`${(stats.avgConfidence * 100).toFixed(0)}%`}
            color="blue"
          />
          <MetricCard
            icon={<CheckCircle size={18} />}
            label="Tasks Completed"
            value={stats.tasksCompleted}
            color="emerald"
          />
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label="Overdue Tasks"
            value={stats.overdueCount}
            color="red"
          />
        </div>

        <Card title="Intent Distribution">
          {intentDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No intent data available</p>
          ) : (
            <div className="space-y-3 py-1">
              {intentDistribution.map(({ intent, count, percentage }) => (
                <div key={intent} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-32 capitalize truncate">
                    {intent.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-navy-700 rounded-full h-3">
                    <div
                      className="bg-magenta-500 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recent Insights">
          <div className="divide-y divide-gray-50 dark:divide-navy-700">
            {recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-magenta-600 dark:text-magenta-400 capitalize">
                    {analysis.intent.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Confidence: {(analysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                {analysis.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.actions.map((action, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400"
                      >
                        {action.type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  {formatDateTime(analysis.created_at)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: 'magenta' | 'blue' | 'emerald' | 'red'
}) {
  const colorMap: Record<string, string> = {
    magenta: 'text-magenta-500 bg-magenta-50 dark:bg-magenta-500/10',
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    red: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  }

  return (
    <div className="metric-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}
