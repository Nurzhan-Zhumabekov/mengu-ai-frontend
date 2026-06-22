import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { analyticsService } from '@/services'

export function AnalyticsPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsService.getSummary,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Analytics" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {isLoading || !summary ? (
          <div className="flex justify-center pt-12"><Spinner /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Events Today" value={`${summary.events_today}`} sub={`${summary.events_auto_processed} auto-processed`} />
              <KpiCard label="Active Tasks" value={`${summary.active_tasks}`} sub={`${summary.overdue_tasks} overdue`} warn={summary.overdue_tasks > 0} />
              <KpiCard label="Documents with Risks" value={`${summary.open_documents}`} sub="flagged by AI analysis" warn={summary.open_documents > 0} />
            </div>

            <Card title="Task Completion">
              {summary.has_on_time_data ? (
                <div>
                  <div className="text-3xl font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {summary.tasks_on_time_pct}%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    of completed tasks with a deadline were finished on time
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Info size={16} className="flex-shrink-0 mt-0.5" />
                  <span>No completed tasks with a due date yet — this metric needs at least one to calculate.</span>
                </div>
              )}
            </Card>

            <Card title="AI Confidence">
              <div className="text-3xl font-medium text-gray-900 dark:text-gray-100 mb-1">
                {summary.ai_accuracy_pct}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                <Info size={12} className="flex-shrink-0 mt-0.5" />
                Average confidence the AI reported on its own analyses — not a measure of verified
                accuracy, since there's no labeled ground truth to compare against yet.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className={`metric-card border-l-4 ${warn ? 'border-l-amber-400' : 'border-l-emerald-400'}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{label}</div>
      <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{value}</div>
      <div className={`text-xs mt-1 ${warn ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{sub}</div>
    </div>
  )
}
