import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Clock, Building2, Brain, CheckCircle, XCircle, AlertTriangle, RotateCw, FileText, Mail } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { toast } from '@/components/ui/toast'
import { eventsService, draftsService } from '@/services/api'
import { timeAgo, eventStatusClass, formatDateTime, actionStatusClass, actionStatusLabel, draftStatusLabel } from '@/utils/helpers'
import type { EventStatus, FullEvent, ActionLog, Draft } from '@/types'

const STATUS_FILTERS: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
]

export function InboxPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [processingAll, setProcessingAll] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['events', statusFilter],
    queryFn: () => eventsService.getAll({ status: statusFilter }),
  })

  const { data: fullEvent, isLoading: loadingDetail } = useQuery({
    queryKey: ['event', selectedId],
    queryFn: () => eventsService.getById(selectedId!),
    enabled: !!selectedId,
  })

  const reanalyzeMutation = useMutation({
    mutationFn: (id: string) => eventsService.reanalyze(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', selectedId] })
    },
  })

  const approveDraftMutation = useMutation({
    mutationFn: (id: string) => draftsService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', selectedId] })
    },
  })

  const events = data?.data ?? []
  const newCount = events.filter((e) => e.status === 'new').length

  async function handleProcessAll() {
    if (processingAll || newCount === 0) return
    setProcessingAll(true)
    const newEvents = events.filter((e) => e.status === 'new')
    for (const e of newEvents) {
      try {
        await eventsService.reanalyze(e.id)
      } catch {
        // ignore individual failures
      }
    }
    setProcessingAll(false)
    queryClient.invalidateQueries({ queryKey: ['events'] })
    toast(`Processed ${newEvents.length} events`, 'success')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Inbox AI"
        actions={
          <button
            onClick={handleProcessAll}
            disabled={processingAll || newCount === 0}
            className="btn-primary"
          >
            {processingAll ? (
              <Spinner className="text-white w-4 h-4" />
            ) : (
              <Sparkles size={14} />
            )}
            {processingAll ? 'Processing...' : `Process All (${newCount})`}
          </button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: list */}
        <div className="w-[420px] min-w-[420px] flex flex-col border-r border-gray-100 overflow-hidden">
          {/* AI banner */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-pink-50 border-b border-pink-100">
            <Sparkles size={14} className="text-magenta-500" />
            <span className="text-xs text-magenta-600 font-medium">
              AI processed {events.filter((e) => e.status === 'completed').length} events · {newCount} awaiting analysis
            </span>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 px-3 py-2.5 border-b border-gray-100 overflow-x-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === f.value
                    ? 'bg-magenta-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                {f.value === 'new' && (
                  <span className="ml-1.5 bg-white/30 rounded-full px-1">{newCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Event list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">No events</div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedId(event.id)}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors ${
                    selectedId === event.id
                      ? 'bg-pink-50 border-l-2 border-l-magenta-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] font-medium text-gray-900 truncate">
                        {event.metadata.sender?.split('@')[0] ?? 'Unknown'}
                      </span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                        {timeAgo(event.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate mb-1">
                      {event.metadata.subject}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={eventStatusClass(event.status)}>
                        {event.status}
                      </span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {event.source}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 overflow-y-auto">
          {selectedId && fullEvent ? (
            loadingDetail ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : (
              <EventDetail
                event={fullEvent}
                onReanalyze={() => reanalyzeMutation.mutate(fullEvent.id)}
                reanalyzing={reanalyzeMutation.isPending}
                onApproveDraft={(draftId) => approveDraftMutation.mutate(draftId)}
                approvingDraft={approveDraftMutation.isPending}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={24} className="text-magenta-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Select an event</p>
              <p className="text-xs text-gray-400">
                AI will analyze the content and suggest actions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Event Detail Panel ───────────────────────────────────────────────────────

interface EventDetailProps {
  event: FullEvent
  onReanalyze: () => void
  reanalyzing: boolean
  onApproveDraft: (draftId: string) => void
  approvingDraft: boolean
}

function EventDetail({ event, onReanalyze, reanalyzing, onApproveDraft, approvingDraft }: EventDetailProps) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={eventStatusClass(event.status)}>{event.status}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
            {event.source}
          </span>
        </div>
        <h2 className="text-base font-medium text-gray-900 mb-2">
          {event.metadata.subject ?? 'No subject'}
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Building2 size={12} /> {event.metadata.sender}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> {timeAgo(event.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail size={12} /> {event.source}
          </span>
        </div>
      </div>

      <Card title="Email Content">
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {event.raw_content}
        </p>
      </Card>

      {event.metadata.attachments && event.metadata.attachments.length > 0 && (
        <Card title="Attachments">
          <div className="space-y-2">
            {event.metadata.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm bg-gray-50 rounded-lg px-3 py-2">
                <FileText size={14} className="text-gray-400" />
                <span className="text-gray-700">{att.filename}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {(att.size / 1024).toFixed(0)} KB
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {event.analysis ? (
        <Card title="AI Analysis" className="bg-pink-50 border-pink-100">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={14} className="text-magenta-500" />
            <span className="text-xs font-medium text-magenta-600">
              Intent: {event.analysis.intent.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              Confidence: {(event.analysis.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="space-y-1.5">
            {event.analysis.actions.map((action, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-white/70 rounded-lg px-3 py-2">
                <CheckCircle size={12} className="text-emerald-500" />
                <span className="font-medium capitalize">{action.type.replace(/_/g, ' ')}</span>
                <span className="text-gray-400">
                  {Object.entries(action.data).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onReanalyze}
            disabled={reanalyzing}
            className="mt-3 text-xs text-magenta-500 hover:text-magenta-600 flex items-center gap-1"
          >
            <RotateCw size={12} className={reanalyzing ? 'animate-spin' : ''} />
            Re-analyze with AI
          </button>
        </Card>
      ) : (
        <Card title="AI Analysis" className="bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Brain size={14} />
            <span>Waiting for analysis...</span>
          </div>
        </Card>
      )}

      {event.action_logs && event.action_logs.length > 0 && (
        <Card title="Action Logs">
          <div className="space-y-2">
            {event.action_logs.map((log) => (
              <ActionLogRow key={log.id} log={log} />
            ))}
          </div>
        </Card>
      )}

      {event.analysis?.actions.some((a) => a.type === 'send_email_draft') && (
        <DraftSection
          eventId={event.id}
          onApprove={onApproveDraft}
          approving={approvingDraft}
        />
      )}

      <div className="flex gap-2 flex-wrap pt-2">
        <button
          onClick={onReanalyze}
          disabled={reanalyzing}
          className="btn-primary"
        >
          {reanalyzing ? <Spinner className="text-white w-4 h-4" /> : <Brain size={14} />}
          Re-analyze
        </button>
      </div>
    </div>
  )
}

// ─── Action Log Row ───────────────────────────────────────────────────────────

function ActionLogRow({ log }: { log: ActionLog }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
      {log.status === 'success' ? (
        <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
      ) : log.status === 'failed' ? (
        <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800 capitalize">
            {log.action_type.replace(/_/g, ' ')}
          </span>
          <span className={actionStatusClass(log.status)}>
            {actionStatusLabel(log.status)}
          </span>
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(log.created_at)}</div>
        {log.error_message && (
          <div className="text-[11px] text-red-500 mt-0.5">{log.error_message}</div>
        )}
      </div>
    </div>
  )
}

// ─── Draft Section ────────────────────────────────────────────────────────────

function DraftSection({ eventId, onApprove, approving }: {
  eventId: string
  onApprove: (id: string) => void
  approving: boolean
}) {
  const { data: draftsData } = useQuery({
    queryKey: ['event-drafts', eventId],
    queryFn: () => eventsService.getDrafts(eventId),
    enabled: !!eventId,
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  const updateDraftMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Draft> }) =>
      draftsService.update(id, patch),
    onSuccess: () => {
      setEditingId(null)
    },
  })

  const drafts = draftsData?.data ?? []

  if (drafts.length === 0) return null

  return (
    <div className="space-y-3">
      {drafts.map((draft) => (
        <Card key={draft.id} title={`Draft: ${draft.subject}`}>
          <div className="text-xs text-gray-500 mb-2">
            To: {draft.recipient} · {draftStatusLabel(draft.status)}
          </div>
          {editingId === draft.id ? (
            <div>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={6}
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-magenta-400"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateDraftMutation.mutate({ id: draft.id, patch: { body: editBody } })}
                  className="btn-primary text-xs py-1.5"
                >
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className="btn-secondary text-xs py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-3">
                {draft.body}
              </pre>
              <div className="flex gap-2 mt-3">
                {draft.status === 'pending_approval' && (
                  <button
                    onClick={() => onApprove(draft.id)}
                    disabled={approving}
                    className="btn-primary text-xs py-1.5"
                  >
                    {approving ? <Spinner className="text-white w-4 h-4" /> : <CheckCircle size={12} />}
                    Approve
                  </button>
                )}
                <button
                  onClick={() => { setEditingId(draft.id); setEditBody(draft.body) }}
                  className="btn-secondary text-xs py-1.5"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
