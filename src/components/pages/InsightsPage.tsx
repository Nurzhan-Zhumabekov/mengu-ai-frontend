import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, FileX, AlertCircle, CheckCircle, RotateCw } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { insightsService } from '@/services/api'
import { timeAgo } from '@/utils/helpers'
import type { AIInsight, InsightType } from '@/types'

const INSIGHT_CONFIG: Record<InsightType, { icon: React.ReactNode; bg: string; border: string }> = {
  contract_signing_ignore: {
    icon: <FileX size={16} />,
    bg: 'bg-pink-50 text-pink-700',
    border: 'border-l-pink-400',
  },
  team_workload_imbalance: {
    icon: <Users size={16} />,
    bg: 'bg-amber-50 text-amber-700',
    border: 'border-l-amber-400',
  },
  revenue_opportunity: {
    icon: <TrendingUp size={16} />,
    bg: 'bg-blue-50 text-blue-700',
    border: 'border-l-blue-400',
  },
  sla_violation: {
    icon: <AlertCircle size={16} />,
    bg: 'bg-amber-50 text-amber-700',
    border: 'border-l-amber-400',
  },
  overdue_task: {
    icon: <AlertCircle size={16} />,
    bg: 'bg-red-50 text-red-700',
    border: 'border-l-red-400',
  },
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  warning:  'Warning',
  info:     'Info',
}

const SEVERITY_CLASS: Record<string, string> = {
  critical: 'badge-high',
  warning:  'badge-medium',
  info:     'bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium',
}

export function InsightsPage() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: insightsService.getAll,
  })

  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const allInsights = (insights ?? []).filter((i) => !resolvedIds.has(i.id))
  const active   = allInsights.filter((i) => !i.is_resolved)
  const resolved = allInsights.filter((i) => i.is_resolved)

  function handleResolve(id: string) {
    setResolvedIds((prev) => new Set(prev).add(id))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="AI Insights" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card border-l-4 border-l-red-400">
            <div className="text-xs text-gray-500 mb-1">Critical</div>
            <div className="text-2xl font-medium text-gray-900">
              {active.filter((i) => i.severity === 'critical').length}
            </div>
          </div>
          <div className="metric-card border-l-4 border-l-amber-400">
            <div className="text-xs text-gray-500 mb-1">Needs Attention</div>
            <div className="text-2xl font-medium text-gray-900">
              {active.filter((i) => i.severity === 'warning').length}
            </div>
          </div>
          <div className="metric-card border-l-4 border-l-blue-400">
            <div className="text-xs text-gray-500 mb-1">Opportunities</div>
            <div className="text-2xl font-medium text-gray-900">
              {active.filter((i) => i.type === 'revenue_opportunity').length}
            </div>
          </div>
        </div>

        {/* Active insights */}
        <Card title={`Active Insights (${active.length})`}>
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : active.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No active insights
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((insight) => (
                <InsightCard key={insight.id} insight={insight} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </Card>

        {/* Resolved */}
        {resolved.length > 0 && (
          <Card title={`Resolved (${resolved.length})`}>
            <div className="space-y-2">
              {resolved.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-center gap-3 py-2 opacity-50"
                >
                  <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{insight.title}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function InsightCard({ insight, onResolve }: { insight: AIInsight; onResolve: (id: string) => void }) {
  const [resolving, setResolving] = useState(false)

  const config = INSIGHT_CONFIG[insight.type] ?? {
    icon: <AlertCircle size={16} />,
    bg: 'bg-gray-100 text-gray-500',
    border: 'border-l-gray-300',
  }

  async function handleResolve() {
    setResolving(true)
    await new Promise((r) => setTimeout(r, 400))
    onResolve(insight.id)
  }

  return (
    <div className={`flex items-start gap-3 p-3.5 bg-white border border-gray-100 border-l-4 ${config.border} rounded-lg hover:shadow-sm transition-shadow`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-[13px] font-medium text-gray-900">{insight.title}</h3>
          <span className={SEVERITY_CLASS[insight.severity]}>
            {SEVERITY_LABEL[insight.severity]}
          </span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
        <div className="text-[11px] text-gray-400 mt-1.5">{timeAgo(insight.created_at)}</div>
      </div>
      <button
        onClick={handleResolve}
        disabled={resolving}
        className="text-xs text-magenta-500 hover:text-magenta-600 whitespace-nowrap flex-shrink-0 flex items-center gap-1"
      >
        {resolving ? <RotateCw size={12} className="animate-spin" /> : null}
        {resolving ? 'Resolving...' : 'Resolve'}
      </button>
    </div>
  )
}
