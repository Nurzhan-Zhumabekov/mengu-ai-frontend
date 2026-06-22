import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock3, UserX, AlertTriangle, AlertCircle, CheckCircle, RotateCw } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, EmptyState } from '@/components/ui'
import { toast } from '@/components/ui/toast'
import { insightsService } from '@/services'
import { timeAgo, LIVE_POLL_INTERVAL_MS } from '@/utils/helpers'
import type { Insight, InsightType } from '@/types'

// Matches the real rule types in internal/insights/rules.go exactly.
const INSIGHT_CONFIG: Record<InsightType, { icon: React.ReactNode; bg: string; border: string }> = {
  overdue_task: {
    icon: <Clock3 size={16} />,
    bg: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    border: 'border-l-red-400',
  },
  draft_pending_too_long: {
    icon: <Clock3 size={16} />,
    bg: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300',
    border: 'border-l-pink-400',
  },
  unassigned_task: {
    icon: <UserX size={16} />,
    bg: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    border: 'border-l-blue-400',
  },
  action_failure_spike: {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    border: 'border-l-amber-400',
  },
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

const SEVERITY_CLASS: Record<string, string> = {
  critical: 'badge-high',
  warning: 'badge-medium',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium',
}

export function InsightsPage() {
  const queryClient = useQueryClient()

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsService.getAll,
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const resolveMutation = useMutation({
    mutationFn: (key: string) => insightsService.resolve(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] })
      toast('Insight marked as resolved', 'success')
    },
    onError: () => {
      toast('Could not resolve insight. Please try again.', 'error')
    },
  })

  // The backend never returns resolved insights at all (filtered out
  // server-side before the response is built) — so there is no "Resolved"
  // list to show. Everything returned here is, by definition, active.
  const active = insights ?? []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="AI Insights" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card border-l-4 border-l-red-400">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Critical</div>
            <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              {active.filter((i) => i.severity === 'critical').length}
            </div>
          </div>
          <div className="metric-card border-l-4 border-l-amber-400">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Needs Attention</div>
            <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              {active.filter((i) => i.severity === 'warning').length}
            </div>
          </div>
          <div className="metric-card border-l-4 border-l-blue-400">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Informational</div>
            <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              {active.filter((i) => i.severity === 'info').length}
            </div>
          </div>
        </div>

        <Card title={`Active Insights (${active.length})`}>
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : active.length === 0 ? (
            <EmptyState icon={<CheckCircle size={28} />} title="No active insights" description="Nothing needs attention right now" />
          ) : (
            <div className="space-y-3">
              {active.map((insight) => (
                <InsightCard
                  key={insight.key}
                  insight={insight}
                  onResolve={() => resolveMutation.mutate(insight.key)}
                  resolving={resolveMutation.isPending && resolveMutation.variables === insight.key}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function InsightCard({ insight, onResolve, resolving }: {
  insight: Insight
  onResolve: () => void
  resolving: boolean
}) {
  const config = INSIGHT_CONFIG[insight.type] ?? {
    icon: <AlertCircle size={16} />,
    bg: 'bg-gray-100 dark:bg-navy-700 text-gray-500 dark:text-gray-400',
    border: 'border-l-gray-300',
  }

  return (
    <div className={`flex items-start gap-3 p-3.5 bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-600 border-l-4 ${config.border} rounded-lg hover:shadow-sm transition-shadow`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{insight.title}</h3>
          <span className={SEVERITY_CLASS[insight.severity]}>
            {SEVERITY_LABEL[insight.severity]}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{insight.description}</p>
        <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">{timeAgo(insight.created_at)}</div>
      </div>
      <button
        onClick={onResolve}
        disabled={resolving}
        className="text-xs text-magenta-500 hover:text-magenta-600 whitespace-nowrap flex-shrink-0 flex items-center gap-1"
      >
        {resolving ? <RotateCw size={12} className="animate-spin" /> : null}
        {resolving ? 'Resolving...' : 'Resolve'}
      </button>
    </div>
  )
}
