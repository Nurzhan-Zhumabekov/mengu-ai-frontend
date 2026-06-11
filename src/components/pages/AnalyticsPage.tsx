import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { analyticsService } from '@/services/api'

const PIE_COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af']
const RADAR_COLORS = { accuracy: '#e11d48', target: '#d1d5db' }

export function AnalyticsPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getSummary,
  })

  const { data: timeSeries, isLoading: loadingTS } = useQuery({
    queryKey: ['analytics', 'timeseries'],
    queryFn: analyticsService.getEventsTimeSeries,
  })

  const { data: tasksByStatus } = useQuery({
    queryKey: ['analytics', 'tasks-by-status'],
    queryFn: analyticsService.getTasksByStatus,
  })

  const { data: workload } = useQuery({
    queryKey: ['analytics', 'workload'],
    queryFn: analyticsService.getTeamWorkload,
  })

  const { data: accuracy } = useQuery({
    queryKey: ['analytics', 'accuracy'],
    queryFn: analyticsService.getAiAccuracy,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Analytics" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {loadingSummary ? (
          <div className="flex justify-center pt-12"><Spinner /></div>
        ) : (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-4 gap-3">
              <KpiCard
                label="On-Time Tasks"
                value={`${summary?.tasks_on_time_pct}%`}
                target="Target: 98%"
                status={summary && summary.tasks_on_time_pct >= 98 ? 'good' : 'warn'}
              />
              <KpiCard
                label="Response Time"
                value={`${summary?.avg_response_time_minutes} min`}
                target="down from 28 min manual"
                status="good"
              />
              <KpiCard
                label="AI Accuracy"
                value={`${summary?.ai_accuracy_pct}%`}
                target="Target: 95%+"
                status={summary && summary.ai_accuracy_pct >= 95 ? 'good' : 'warn'}
              />
              <KpiCard
                label="Platform Uptime"
                value="99.97%"
                target="SLA: 99.9%"
                status="good"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              <Card title="Incoming Events (30 days)">
                {loadingTS ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeries}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#e11d48" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card title="Tasks by Status">
                <div className="h-52 flex items-center justify-center">
                  {tasksByStatus && tasksByStatus.some((d) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tasksByStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        >
                          {tasksByStatus.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-xs text-gray-400">No data</span>
                  )}
                </div>
              </Card>

              <Card title="Team Workload">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workload}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="tasks" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="AI Accuracy by Category">
                <div className="h-52">
                  {accuracy ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={accuracy}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                        <Radar name="Accuracy" dataKey="accuracy" stroke={RADAR_COLORS.accuracy} fill={RADAR_COLORS.accuracy} fillOpacity={0.3} />
                        <Radar name="Target" dataKey="target" stroke={RADAR_COLORS.target} fill={RADAR_COLORS.target} fillOpacity={0.1} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center py-8"><Spinner /></div>
                  )}
                </div>
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
                  <TableRow label="Events Today" value={`${summary?.events_today}`} target="—" ok />
                  <TableRow label="Auto-Processed" value={`${summary?.events_auto_processed}`} target="—" ok />
                  <TableRow label="Active Tasks" value={`${summary?.active_tasks}`} target="—" ok />
                  <TableRow label="Overdue Tasks" value={`${summary?.overdue_tasks}`} target="0" ok={summary?.overdue_tasks === 0} />
                  <TableRow label="Open Documents" value={`${summary?.open_documents}`} target="—" ok />
                  <TableRow label="On-Time Tasks" value={`${summary?.tasks_on_time_pct}%`} target="98%" ok={summary ? summary.tasks_on_time_pct >= 98 : false} />
                  <TableRow label="AI Accuracy" value={`${summary?.ai_accuracy_pct}%`} target="95%+" ok={summary ? summary.ai_accuracy_pct >= 95 : false} />
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
          {ok ? '\u2713' : '\u2191'}
        </span>
      </td>
    </tr>
  )
}
