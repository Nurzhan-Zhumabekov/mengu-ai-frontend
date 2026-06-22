import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, AlertTriangle } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Spinner, Card, EmptyState } from '@/components/ui'
import { eventsService } from '@/services'
import { formatDateTime } from '@/utils/helpers'
import type { DocumentAnalysisListItem, IncomingEvent } from '@/types'

export function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState<{ doc: DocumentAnalysisListItem; event: IncomingEvent } | null>(null)

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => eventsService.getAll(),
  })

  const events = eventsData?.data ?? []

  // There is no aggregate "all documents" endpoint on the real backend —
  // documents only exist per-event (GET /events/:id/documents). We fetch
  // documents for every event currently loaded. This is N+1 by nature of
  // the API surface, not an oversight — there's no way to avoid it without
  // a new backend endpoint.
  const documentQueries = useQuery({
    queryKey: ['documents', 'by-event', events.map((e) => e.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        events.map(async (event) => ({
          event,
          docs: (await eventsService.getDocuments(event.id)).data,
        }))
      )
      return results.filter((r) => r.docs.length > 0)
    },
    enabled: events.length > 0,
  })

  const isLoading = loadingEvents || documentQueries.isLoading
  const groups = documentQueries.data ?? []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Document Analysis" />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : groups.length === 0 ? (
              <EmptyState
                icon={<FileText size={32} />}
                title="No documents found"
                description="Documents appear here once an email with attachments is processed"
              />
            ) : (
              <div className="space-y-4">
                {groups.map(({ event, docs }) => (
                  <EventDocumentGroup
                    key={event.id}
                    event={event}
                    docs={docs}
                    selectedDocId={selectedDoc?.doc.id}
                    onSelectDoc={(doc) => setSelectedDoc({ doc, event })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedDoc && (
          <div className="w-[360px] min-w-[360px] border-l border-gray-100 dark:border-navy-600 overflow-y-auto bg-white dark:bg-navy-800">
            <DocDetail doc={selectedDoc.doc} event={selectedDoc.event} onClose={() => setSelectedDoc(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

function EventDocumentGroup({ event, docs, selectedDocId, onSelectDoc }: {
  event: IncomingEvent
  docs: DocumentAnalysisListItem[]
  selectedDocId?: string
  onSelectDoc: (doc: DocumentAnalysisListItem) => void
}) {
  const isSelected = docs.some((d) => d.id === selectedDocId)

  return (
    <div className={`bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-600 rounded-lg overflow-hidden ${isSelected ? 'ring-2 ring-magenta-400' : ''}`}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-navy-700 border-b border-gray-100 dark:border-navy-600">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {event.metadata.subject ?? 'No subject'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {event.metadata.sender ?? 'Unknown'} · {formatDateTime(event.created_at)}
        </div>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-navy-700">
        {docs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelectDoc(doc)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors"
          >
            <FileText size={16} className="text-magenta-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{doc.file_name}</div>
              {doc.summary && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{doc.summary}</div>
              )}
            </div>
            {doc.risks > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 flex-shrink-0">
                <AlertTriangle size={12} /> {doc.risks}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DocDetail({ doc, event, onClose }: {
  doc: DocumentAnalysisListItem
  event: IncomingEvent
  onClose: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-navy-600">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Document Analysis</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-pink-700 dark:text-pink-300" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{doc.file_name}</h2>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Analyzed {formatDateTime(doc.analyzed_at)}</div>
          </div>
        </div>

        {doc.summary && (
          <Card className="bg-pink-50 dark:bg-pink-500/10 border-pink-100 dark:border-pink-500/20">
            <div className="text-xs font-medium text-magenta-600 dark:text-pink-300 mb-1.5">AI Summary</div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{doc.summary}</p>
          </Card>
        )}

        {doc.risks > 0 && (
          <Card>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle size={12} /> {doc.risks} risk{doc.risks !== 1 ? 's' : ''} detected
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Risk details aren't exposed individually by the API — only the count.
            </p>
          </Card>
        )}

        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Document ID</span>
            <span className="text-gray-700 dark:text-gray-300">{doc.id}</span>
          </div>
          <div className="flex justify-between">
            <span>From event</span>
            <span className="text-gray-700 dark:text-gray-300 truncate ml-2">{event.metadata.subject ?? event.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
