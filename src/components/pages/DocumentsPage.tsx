import { FileText } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'

export function DocumentsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Documents" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-magenta-50 dark:bg-magenta-500/10 flex items-center justify-center mb-4">
            <FileText size={28} className="text-magenta-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Document Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Document upload and management will be available in a future update.
            Documents attached to events can be viewed from the inbox.
          </p>
        </div>
      </div>
    </div>
  )
}
