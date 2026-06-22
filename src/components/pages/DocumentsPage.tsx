import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Search, X, AlertTriangle, Clock, Upload, Loader2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { documentsService } from '@/services'
import { toast } from '@/components/ui/toast'
import { timeAgo } from '@/utils/helpers'
import type { DocumentAnalysisListItem } from '@/types'

export function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DocumentAnalysisListItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getAll(),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast('Document uploaded and analyzed', 'success')
    },
    onError: () => {
      toast('Upload failed. Try again.', 'error')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const filtered = useMemo(() => {
    if (!documents) return []
    if (!search.trim()) return documents
    const q = search.toLowerCase()
    return documents.filter((d) => d.file_name.toLowerCase().includes(q))
  }, [documents, search])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Documents" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Documents" />

      <div className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-navy-600">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by filename..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-magenta-400 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-magenta-500 text-white hover:bg-magenta-600 disabled:opacity-50 transition-colors"
        >
          {uploadMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg"
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} / {documents?.length ?? 0}
        </span>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className={`flex-1 overflow-y-auto p-6 ${selected ? 'hidden md:block' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                selected={selected?.id === doc.id}
                onClick={() => setSelected(doc)}
              />
            ))}
          </div>
        </div>

        {selected && (
          <div className="w-full md:w-[400px] border-l border-gray-100 dark:border-navy-600 overflow-y-auto bg-white dark:bg-navy-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-600">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Document Details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-magenta-50 dark:bg-magenta-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-magenta-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                    {selected.file_name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <Clock size={11} />
                    <span>{timeAgo(selected.analyzed_at)}</span>
                  </div>
                </div>
              </div>

              <Card title="Summary">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selected.summary || 'No summary available.'}
                </p>
              </Card>

              <Card title="Risk Assessment">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {selected.risks} risk{selected.risks !== 1 ? 's' : ''} identified
                  </span>
                </div>
                {selected.risks === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No risks detected in this document.
                  </p>
                ) : null}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface DocumentCardProps {
  document: DocumentAnalysisListItem
  selected: boolean
  onClick: () => void
}

function DocumentCard({ document: doc, selected, onClick }: DocumentCardProps) {
  const truncatedSummary = doc.summary
    ? doc.summary.length > 120
      ? doc.summary.slice(0, 120) + '...'
      : doc.summary
    : 'No summary'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full card transition-all hover:shadow-sm ${
        selected
          ? 'border-magenta-400 ring-1 ring-magenta-400'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-magenta-50 dark:bg-magenta-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileText size={16} className="text-magenta-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {doc.file_name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
            {truncatedSummary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <AlertTriangle size={11} className={doc.risks > 0 ? 'text-amber-500' : ''} />
              <span>{doc.risks} risk{doc.risks !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo(doc.analyzed_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
