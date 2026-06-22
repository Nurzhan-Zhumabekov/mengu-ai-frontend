import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Calendar, AlertCircle, User, X, GripVertical } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui'
import { toast } from '@/components/ui/toast'
import { useAuthStore } from '@/store'
import { tasksService } from '@/services'
import type { CreateTaskPayload } from '@/services/tasksService'
import { formatDue, isOverdue, taskStatusLabel, isDueSoon, LIVE_POLL_INTERVAL_MS } from '@/utils/helpers'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending',      label: 'Pending',       color: 'bg-gray-400' },
  { status: 'in_progress',  label: 'In Progress',   color: 'bg-blue-400' },
  { status: 'completed',    label: 'Completed',     color: 'bg-emerald-400' },
  { status: 'cancelled',    label: 'Cancelled',     color: 'bg-red-400' },
]

interface NewTaskForm {
  title: string
  description: string
  due_date: string
  assignee_id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export function TasksPage() {
  const [myTasks, setMyTasks] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [form, setForm] = useState<NewTaskForm>({ title: '', description: '', due_date: '', assignee_id: '', priority: 'medium' })
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { status?: TaskStatus; assignee_id?: string } }) =>
      tasksService.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setShowNewTask(false)
      setForm({ title: '', description: '', due_date: '', assignee_id: '', priority: 'medium' })
      toast('Task created successfully', 'success')
    },
    onError: () => {
      toast('Could not create task. Please try again.', 'error')
    },
  })

  const tasks = data?.data ?? []
  let filtered = tasks
  if (myTasks && user) {
    filtered = filtered.filter((t) => t.assignee_id === user.id)
  }
  if (overdueOnly) {
    filtered = filtered.filter((t) => isOverdue(t.due_date))
  }

  function tasksByStatus(status: TaskStatus) {
    return filtered.filter((t) => t.status === status)
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const targetColumn = COLUMNS.find((c) => c.status === over.id)
    if (targetColumn && targetColumn.status !== task.status) {
      updateMutation.mutate({ id: taskId, patch: { status: targetColumn.status } })
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Tasks"
        actions={
          <button onClick={() => { setForm({ title: '', description: '', due_date: '', assignee_id: '', priority: 'medium' }); setShowNewTask(true) }} className="btn-primary">
            <Plus size={14} /> New Task
          </button>
        }
      />

      <div className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-navy-600">
        <button
          onClick={() => { setMyTasks(false); setOverdueOnly(false) }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            !myTasks && !overdueOnly
              ? 'bg-magenta-500 text-white'
              : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          onClick={() => { setMyTasks(true); setOverdueOnly(false) }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            myTasks
              ? 'bg-magenta-500 text-white'
              : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => { setOverdueOnly(true); setMyTasks(false) }}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            overdueOnly
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
          }`}
        >
          Overdue ({tasks.filter((t) => isOverdue(t.due_date)).length})
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="flex justify-center pt-16"><Spinner /></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-4 gap-3 h-full">
              {COLUMNS.map(({ status, label, color }) => {
                const colTasks = tasksByStatus(status)
                return (
                  <div
                    key={status}
                    className="flex flex-col bg-gray-50 dark:bg-navy-900 rounded-xl border border-gray-200 dark:border-navy-600 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-navy-800 border-b border-gray-100 dark:border-navy-600">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                          {label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-navy-700 px-1.5 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {colTasks.length === 0 ? (
                          <div className="text-center py-6 text-xs text-gray-400 dark:text-gray-500">No tasks</div>
                        ) : (
                          colTasks.map((task) => (
                            <SortableTaskCard
                              key={task.id}
                              task={task}
                              onClick={() => setSelectedTask(task)}
                              selected={selectedTask?.id === task.id}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </div>
                )
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="kanban-card opacity-90 shadow-xl bg-white dark:bg-navy-800 border border-magenta-400">
                  <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{activeTask.title}</div>
                  {activeTask.description && (
                    <div className="text-[11px] text-gray-500 mt-1">{activeTask.description}</div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

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

      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowNewTask(false)} />
          <div className="relative bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">New Task</h3>
              <button onClick={() => setShowNewTask(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
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
                    assignee_id: form.assignee_id || undefined,
                    due_date: form.due_date ? `${form.due_date}T00:00:00Z` : undefined,
                  })
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="input-field"
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Optional details..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Assignee ID</label>
                    <input
                      value={form.assignee_id}
                      onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
                      className="input-field"
                      placeholder="User ID (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Due Date</label>
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

function SortableTaskCard({ task, onClick, selected }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const overdue = isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled'
  const dueSoon = isDueSoon(task.due_date)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${
        selected ? 'border-magenta-400 shadow-sm' : ''
      } ${overdue ? 'border-l-4 border-l-red-400' : dueSoon ? 'border-l-4 border-l-amber-400' : ''}`}
    >
      <div className="flex items-start gap-1">
        <button {...attributes} {...listeners} className="mt-0.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-2">
            {task.title}
          </div>
          {task.description && (
            <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2 line-clamp-2">
              {task.description}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {overdue && <AlertCircle size={11} />}
              <Calendar size={11} />
              {formatDue(task.due_date)}
            </div>
            {task.assignee_id && (
              <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                <User size={11} />
                <span>Assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onClick: () => void
  selected: boolean
}

interface TaskDrawerProps {
  task: Task
  onClose: () => void
  onUpdate: (patch: { status?: TaskStatus; assignee_id?: string }) => void
}

function TaskDrawer({ task, onClose, onUpdate }: TaskDrawerProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[380px] bg-white dark:bg-navy-800 border-l border-gray-200 dark:border-navy-600 h-full overflow-y-auto shadow-xl z-50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-600">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Task Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">{task.title}</h2>

          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{task.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Status</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{taskStatusLabel(task.status)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Due Date</span>
              <span className={`font-medium ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {formatDue(task.due_date)}
              </span>
            </div>
            {task.assignee_id && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Assignee</span>
                <span className="text-sm text-gray-800 dark:text-gray-200">ID: {task.assignee_id}</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Change Status</div>
            {COLUMNS.map(({ status, label }) =>
              status !== task.status ? (
                <button
                  key={status}
                  onClick={() => onUpdate({ status })}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-navy-600 hover:border-magenta-300 hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors text-gray-700 dark:text-gray-300"
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
