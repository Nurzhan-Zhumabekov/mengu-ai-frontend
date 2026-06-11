import { useQuery } from '@tanstack/react-query'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { analyticsService } from '@/services/api'

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getSummary,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Analytics" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {isLoading ? (
          <div className="flex justify-center pt-12"><Spinner /></div>
        ) : (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-4 gap-3">
              <KpiCard
                label="On-Time Tasks"
                value={`${data?.tasks_on_time_pct}%`}
                target="Target: 98%"
                status={data && data.tasks_on_time_pct >= 98 ? 'good' : 'warn'}
              />
              <KpiCard
                label="Response Time"
                value={`${data?.avg_response_time_minutes} min`}
                target="↓ was 28 min"
                status="good"
              />
              <KpiCard
                label="AI Accuracy"
                value={`${data?.ai_accuracy_pct}%`}
                target="Target: 95%+"
                status={data && data.ai_accuracy_pct >= 95 ? 'good' : 'warn'}
              />
              <KpiCard
                label="Platform Uptime"
                value="99.97%"
                target="SLA: 99.9%"
                status="good"
              />
            </div>

            {/* Charts placeholder */}
            <div className="grid grid-cols-2 gap-4">
              <Card title="Incoming Events (30 days)">
                <ChartPlaceholder label="Recharts LineChart — /api/v1/analytics/events-timeseries" />
              </Card>
              <Card title="Tasks by Status">
                <ChartPlaceholder label="Recharts PieChart — /api/v1/analytics/tasks-by-status" />
              </Card>
              <Card title="Team Workload">
                <ChartPlaceholder label="Recharts BarChart — /api/v1/analytics/team-workload" />
              </Card>
              <Card title="AI Accuracy by Category">
                <ChartPlaceholder label="Recharts RadarChart — /api/v1/analytics/ai-accuracy" />
              </Card>
            </div>

            {/* Summary table */}
            <Card title="Summary Table">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 font-medium pb-2">Metric</th>
                    <th className="text-right text-xs text-gray-500 font-medium pb-2">Value</th>
                    <th className="text-right text-xs text-gray-500 font-medium pb-2">Target</th>
                    <th className="text-right text-xs text-gray-500 font-medium pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <TableRow label="Events Today" value={`${data?.events_today}`} target="—" ok />
                  <TableRow label="Auto-Processed" value={`${data?.events_auto_processed}`} target="—" ok />
                  <TableRow label="Active Tasks" value={`${data?.active_tasks}`} target="—" ok />
                  <TableRow label="Overdue Tasks" value={`${data?.overdue_tasks}`} target="0" ok={data?.overdue_tasks === 0} />
                  <TableRow label="Open Documents" value={`${data?.open_documents}`} target="—" ok />
                  <TableRow label="On-Time Tasks" value={`${data?.tasks_on_time_pct}%`} target="98%" ok={data ? data.tasks_on_time_pct >= 98 : false} />
                  <TableRow label="AI Accuracy" value={`${data?.ai_accuracy_pct}%`} target="95%+" ok={data ? data.ai_accuracy_pct >= 95 : false} />
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, target, status }: {
  label: string; value: string; target: string; status: 'good' | 'warn' | 'bad'
}) {
  return (
    <div className={`metric-card border-l-4 ${status === 'good' ? 'border-l-emerald-400' : status === 'warn' ? 'border-l-amber-400' : 'border-l-red-400'}`}>
      <div className="text-xs text-gray-500 mb-1.5">{label}</div>
      <div className="text-2xl font-medium text-gray-900">{value}</div>
      <div className={`text-xs mt-1 ${status === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}>{target}</div>
    </div>
  )
}

function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
      <p className="text-xs text-gray-400 text-center max-w-[200px] leading-relaxed">{label}</p>
    </div>
  )
}

function TableRow({ label, value, target, ok }: {
  label: string; value: string; target: string; ok: boolean
}) {
  return (
    <tr>
      <td className="py-2 text-sm text-gray-700">{label}</td>
      <td className="py-2 text-sm text-gray-900 text-right font-medium">{value}</td>
      <td className="py-2 text-xs text-gray-400 text-right">{target}</td>
      <td className="py-2 text-right">
        <span className={`text-xs ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
          {ok ? '✓' : '↑'}
        </span>
      </td>
    </tr>
  )
}
