import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  FileText, AlertTriangle, Upload, X, File,
} from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Spinner, Card } from '@/components/ui'
import { toast } from '@/components/ui/toast'
import { eventsService } from '@/services/api'
import { formatDateTime, formatFileSize } from '@/utils/helpers'
import type { DocumentAnalysis } from '@/types'

export function DocumentsPage() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentAnalysis | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const queryClient = useQueryClient()

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => eventsService.getAll(),
  })

  const { data: uploadedDocs } = useQuery({
    queryKey: ['uploaded-docs'],
    queryFn: () => eventsService.getAllUploadedDocs(),
  })

  const events = eventsData?.data ?? []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Document Analysis"
        actions={
          <button onClick={() => setShowUpload(true)} className="btn-primary">
            <Upload size={14} /> Upload
          </button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Uploaded docs section */}
            {uploadedDocs && uploadedDocs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Uploaded Documents
                </h3>
                <div className="space-y-2">
                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => { setSelectedDoc(doc); setSelectedEventId(doc.event_id) }}
                      className={`flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3 cursor-pointer hover:bg-pink-50 transition-colors ${
                        selectedDoc?.id === doc.id ? 'ring-2 ring-magenta-400' : ''
                      }`}
                    >
                      <FileText size={16} className="text-magenta-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 truncate">{doc.file_name}</div>
                        {doc.summary && (
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{doc.summary}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event documents */}
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

        {/* Detail panel */}
        {selectedDoc && (
          <div className="w-[360px] min-w-[360px] border-l border-gray-100 overflow-y-auto bg-white">
            <DocDetail
              doc={selectedDoc}
              onClose={() => { setSelectedDoc(null); setSelectedEventId(null) }}
            />
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            queryClient.invalidateQueries({ queryKey: ['uploaded-docs'] })
          }}
        />
      )}
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setProgress(0)
    setUploading(true)

    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        finalize(f)
      }
      setProgress(Math.min(p, 100))
    }, 200)
  }, [])

  async function finalize(f: File) {
    try {
      await eventsService.uploadDocument(f.name, f.size)
      toast(`Uploaded ${f.name}`, 'success')
      onUploaded()
      onClose()
    } catch {
      toast('Upload failed', 'error')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-50">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {!uploading && !file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-magenta-400 bg-pink-50' : 'border-gray-200 hover:border-magenta-300'
            }`}
          >
            <Upload size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium mb-1">Drop a file here</p>
            <p className="text-xs text-gray-400">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </div>
        )}

        {file && uploading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                <File size={20} className="text-pink-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
                <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Uploading to AI...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-magenta-400 to-pink-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {progress === 100 && (
              <p className="text-xs text-emerald-600">Upload complete — AI analysis started</p>
            )}
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
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Document Analysis</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
          ×
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-pink-700" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-900 leading-snug">{doc.file_name}</h2>
            <div className="text-xs text-gray-400 mt-0.5">Analyzed {formatDateTime(doc.analyzed_at)}</div>
          </div>
        </div>

        {doc.summary && (
          <Card className="bg-pink-50 border-pink-100">
            <div className="text-xs font-medium text-magenta-600 mb-1.5">AI Summary</div>
            <p className="text-xs text-gray-700 leading-relaxed">{doc.summary}</p>
          </Card>
        )}

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
