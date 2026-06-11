import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText, AlertTriangle,
} from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Spinner, Card } from '@/components/ui'
import { eventsService } from '@/services/api'
import { formatDateTime } from '@/utils/helpers'
import type { DocumentAnalysis } from '@/types'

export function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentAnalysis | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => eventsService.getAll(),
  })

  const events = eventsData?.data ?? []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Document Analysis" />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: list of events with docs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {events.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-400">
                No events found
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventDocumentList
                    key={event.id}
                    eventId={event.id}
                    subject={event.metadata.subject ?? 'No subject'}
                    sender={event.metadata.sender ?? 'Unknown'}
                    createdAt={event.created_at}
                    isSelected={selectedEventId === event.id}
                    onSelectDoc={(doc) => { setSelectedDoc(doc); setSelectedEventId(event.id) }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selectedDoc && (
          <div className="w-[360px] min-w-[360px] border-l border-gray-100 overflow-y-auto bg-white">
            <DocDetail
              doc={selectedDoc}
              onClose={() => { setSelectedDoc(null); setSelectedEventId(null) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Event Document List ──────────────────────────────────────────────────────

function EventDocumentList({ eventId, subject, sender, createdAt, isSelected, onSelectDoc }: {
  eventId: string
  subject: string
  sender: string
  createdAt: string
  isSelected: boolean
  onSelectDoc: (doc: DocumentAnalysis) => void
}) {
  const { data: docsData, isLoading } = useQuery({
    queryKey: ['event-documents', eventId],
    queryFn: () => eventsService.getDocuments(eventId),
    enabled: true,
  })

  const docs = docsData?.data ?? []

  if (docs.length === 0 && !isSelected) return null

  return (
    <div className={`bg-white border border-gray-100 rounded-lg overflow-hidden ${isSelected ? 'ring-2 ring-magenta-400' : ''}`}>
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-900 truncate">{subject}</div>
        <div className="text-xs text-gray-500 mt-0.5">{sender} · {formatDateTime(createdAt)}</div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : (
        <div className="divide-y divide-gray-50">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-pink-50 transition-colors"
            >
              <FileText size={16} className="text-magenta-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">{doc.file_name}</div>
                {doc.summary && (
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">{doc.summary}</div>
                )}
              </div>
              {doc.risks.length > 0 && (
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Document Detail ──────────────────────────────────────────────────────────

function DocDetail({ doc, onClose }: { doc: DocumentAnalysis; onClose: () => void }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Document Analysis</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* File info */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-pink-700" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900 leading-snug">{doc.file_name}</h2>
            <div className="text-xs text-gray-400 mt-0.5">Analyzed {formatDateTime(doc.analyzed_at)}</div>
          </div>
        </div>

        {/* AI Summary */}
        {doc.summary && (
          <Card className="bg-pink-50 border-pink-100">
            <div className="text-xs font-medium text-magenta-600 mb-1.5">AI Summary</div>
            <p className="text-xs text-gray-700 leading-relaxed">{doc.summary}</p>
          </Card>
        )}

        {/* Risks */}
        {doc.risks.length > 0 && (
          <Card>
            <div className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
              <AlertTriangle size={12} /> Detected Risks ({doc.risks.length})
            </div>
            <div className="space-y-1.5">
              {doc.risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1 flex-shrink-0" />
                  {risk}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Document ID</span>
            <span className="text-gray-700">{doc.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Event ID</span>
            <span className="text-gray-700">{doc.event_id}</span>
          </div>
          <div className="flex justify-between">
            <span>Organization</span>
            <span className="text-gray-700">{doc.org_id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
