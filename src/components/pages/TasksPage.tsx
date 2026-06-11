import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Calendar, AlertCircle, User, X } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui'
import { tasksService } from '@/services/api'
import { formatDue, isOverdue, taskStatusLabel, isDueSoon } from '@/utils/helpers'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'new',         label: 'New',          color: 'bg-gray-400' },
  { status: 'in_progress', label: 'In Progress',   color: 'bg-blue-400' },
  { status: 'done',        label: 'Done',          color: 'bg-emerald-400' },
  { status: 'cancelled',   label: 'Cancelled',      color: 'bg-red-400' },
]

interface NewTaskForm {
  title: string
  description: string
  due_date: string
}

export function TasksPage() {
  const [myTasks, setMyTasks] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [form, setForm] = useState<NewTaskForm>({ title: '', description: '', due_date: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', myTasks, overdueOnly],
    queryFn: () => tasksService.getAll(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      tasksService.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Task>) => tasksService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowNewTask(false)
      setForm({ title: '', description: '', due_date: '' })
    },
  })

  const tasks = data?.data ?? []
  const filtered = overdueOnly ? tasks.filter((t) => isOverdue(t.due_date)) : tasks

  function tasksByStatus(status: TaskStatus) {
    return filtered.filter((t) => t.status === status)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Tasks"
        actions={
          <button onClick={() => setShowNewTask(true)} className="btn-primary">
            <Plus size={14} /> New Task
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => { setMyTasks(false); setOverdueOnly(false) }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            !myTasks && !overdueOnly
              ? 'bg-magenta-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => { setMyTasks(true); setOverdueOnly(false) }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            myTasks
              ? 'bg-magenta-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => { setOverdueOnly(true); setMyTasks(false) }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            overdueOnly
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Overdue ({tasks.filter((t) => isOverdue(t.due_date)).length})
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="flex justify-center pt-16"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-4 gap-3 h-full">
            {COLUMNS.map(({ status, label, color }) => {
              const colTasks = tasksByStatus(status)
              return (
                <div
                  key={status}
                  className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color}`} />
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400">No tasks</div>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                          selected={selectedTask?.id === task.id}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Task detail drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(patch) => {
            updateMutation.mutate({ id: selectedTask.id, patch })
            setSelectedTask(null)
          }}
        />
      )}

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowNewTask(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-medium text-gray-900">New Task</h3>
              <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!form.title.trim()) return
                createMutation.mutate({
                  title: form.title,
                  description: form.description || undefined,
                  due_date: form.due_date || undefined,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="input-field"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Optional details..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.title.trim()}
                  className="btn-primary flex-1 justify-center"
                >
                  {createMutation.isPending ? <Spinner className="text-white w-4 h-4" /> : null}
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewTask(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: Task
  onClick: () => void
  selected: boolean
}

function TaskCard({ task, onClick, selected }: TaskCardProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done' && task.status !== 'cancelled'
  const dueSoon = isDueSoon(task.due_date)

  return (
    <div
      onClick={onClick}
      className={`kanban-card ${
        selected ? 'border-magenta-400 shadow-sm' : ''
      } ${overdue ? 'border-l-4 border-l-red-400' : dueSoon ? 'border-l-4 border-l-amber-400' : ''}`}
    >
      <div className="text-[13px] font-medium text-gray-900 leading-snug mb-2">
        {task.title}
      </div>

      {task.description && (
        <div className="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">
          {task.description}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
          {overdue && <AlertCircle size={11} />}
          <Calendar size={11} />
          {formatDue(task.due_date)}
        </div>
        {task.assignee_id && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            <User size={11} />
            <span>Assigned</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Task Drawer ──────────────────────────────────────────────────────────────

interface TaskDrawerProps {
  task: Task
  onClose: () => void
  onUpdate: (patch: Partial<Task>) => void
}

function TaskDrawer({ task, onClose, onUpdate }: TaskDrawerProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done' && task.status !== 'cancelled'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[380px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl z-50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Task Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="text-base font-medium text-gray-900">{task.title}</h2>

          {task.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-gray-800">{taskStatusLabel(task.status)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Due Date</span>
              <span className={`font-medium ${overdue ? 'text-red-500' : 'text-gray-800'}`}>
                {formatDue(task.due_date)}
              </span>
            </div>
            {task.assignee_id && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Assignee</span>
                <span className="text-sm text-gray-800">ID: {task.assignee_id}</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <div className="text-xs text-gray-500 mb-2">Change Status</div>
            {COLUMNS.map(({ status, label }) =>
              status !== task.status ? (
                <button
                  key={status}
                  onClick={() => onUpdate({ status })}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-gray-200 hover:border-magenta-300 hover:bg-pink-50 transition-colors"
                >
                  → {label}
                </button>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
