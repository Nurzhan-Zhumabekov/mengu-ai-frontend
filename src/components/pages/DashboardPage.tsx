import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, ArrowRight, X, Inbox, Send, Bot, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, EmptyState } from '@/components/ui'
import { eventsService, tasksService } from '@/services'
import { timeAgo, eventStatusClass, formatDue, isOverdue, LIVE_POLL_INTERVAL_MS } from '@/utils/helpers'
import type { EventListItem, Task } from '@/types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', 'dashboard'],
    queryFn: () => eventsService.getAll({ status: 'new' }),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll(),
    refetchInterval: LIVE_POLL_INTERVAL_MS,
  })

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm Mengu AI. I can help you find tasks or check your inbox. Try asking me something!",
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: chatInput.trim(),
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    const q = chatInput.trim().toLowerCase()
    let response = ''

    if (q.includes('task') || q.includes('todo') || q.includes('what') || q.includes('priority')) {
      const active = tasksData?.data.filter((t) => t.status !== 'completed' && t.status !== 'cancelled') ?? []
      const overdue = active.filter((t) => isOverdue(t.due_date))
      if (active.length === 0) {
        response = "You have no active tasks. Would you like to create one?"
      } else {
        response = `You have **${active.length} active ${active.length === 1 ? 'task' : 'tasks'}**${overdue.length > 0 ? `, **${overdue.length} overdue**.` : '.'} ` +
          `The top priority is "${active[0]?.title ?? 'N/A'}"${active[0]?.due_date ? ` (due ${formatDue(active[0].due_date)})` : ''}.`
      }
    } else if (q.includes('inbox') || q.includes('email') || q.includes('mail') || q.includes('event')) {
      const newEvents = eventsData?.data ?? []
      response = newEvents.length === 0
        ? 'Your inbox is clear — no new events waiting.'
        : `You have **${newEvents.length} new ${newEvents.length === 1 ? 'event' : 'events'}** in your inbox. The most recent is from "${newEvents[0]?.sender ?? 'Unknown'}" — "${newEvents[0]?.subject ?? 'No subject'}".`
    } else {
      response = "I can help you with:\n- **Tasks**: What's on your plate\n- **Inbox**: New events and emails\n\nJust ask me about any of these!"
    }

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: response,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, assistantMsg])
      setChatLoading(false)
    }, 800)
  }

  const events = eventsData?.data.slice(0, 4) ?? []
  const allTasks = tasksData?.data ?? []

  const activeTasks = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  const overdueCount = activeTasks.filter((t) => isOverdue(t.due_date)).length
  const priorities = derivePriorities(allTasks)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-6">
        <div
          onClick={() => setChatOpen(true)}
          className="flex items-center gap-3 bg-white dark:bg-navy-800 border border-magenta-300 dark:border-magenta-500/40 rounded-xl px-4 py-3 mb-5 cursor-pointer hover:border-magenta-400 transition-colors"
        >
          <Sparkles size={18} className="text-magenta-500 flex-shrink-0" />
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Ask Mengu anything... e.g. &ldquo;What&rsquo;s most important today?&rdquo;
          </span>
          <kbd className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600 rounded px-2 py-0.5">↗</kbd>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="metric-card">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">New Events</div>
            <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{events.length}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">awaiting AI analysis</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Active Tasks</div>
            <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{activeTasks.length}</div>
            <div className={`text-xs mt-1 ${overdueCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {overdueCount > 0 ? `${overdueCount} overdue` : 'No overdue'}
            </div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Total Tasks</div>
            <div className="text-2xl font-medium text-gray-900 dark:text-gray-100">{allTasks.length}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{allTasks.filter((t) => t.status === 'completed').length} completed</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card
            title="Inbox AI"
            action={
              <button type="button" onClick={() => navigate('/inbox')} className="flex items-center gap-1 text-xs text-magenta-500 hover:text-magenta-600">
                View all <ArrowRight size={12} />
              </button>
            }
          >
            {loadingEvents ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : events.length === 0 ? (
              <EmptyState icon={<Inbox size={24} />} title="No new events" />
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-navy-700">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}
          </Card>

          <Card title="Top 3 Priorities Today">
            {priorities.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">No priority tasks</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {priorities.map((p, i) => (
                  <PriorityItem
                    key={p.task.id}
                    label={i === 0 ? 'URGENT' : i === 1 ? 'IMPORTANT' : 'SCHEDULED'}
                    labelClass={i === 0 ? 'text-magenta-600 dark:text-magenta-400' : i === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}
                    title={p.task.title}
                    meta={p.meta}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setChatOpen(false)} />
          <div className="relative w-[400px] bg-white dark:bg-navy-800 border-l border-gray-200 dark:border-navy-600 h-full shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-navy-600">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-magenta-500" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ask Mengu</h3>
              </div>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="Закрыть" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-magenta-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-magenta-500 text-white'
                      : 'bg-gray-100 dark:bg-navy-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                    ))}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-magenta-500 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-navy-700 rounded-xl px-3.5 py-2.5">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-magenta-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-magenta-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-magenta-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="border-t border-gray-100 dark:border-navy-600 p-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about tasks, inbox..."
                className="input-field flex-1 text-sm"
                disabled={chatLoading}
              />
              <button type="submit" disabled={!chatInput.trim() || chatLoading} className="btn-primary px-3">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function derivePriorities(tasks: Task[]): { task: Task; meta: string }[] {
  const active = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  const unsorted = active.map((t) => ({
    task: t,
    score: isOverdue(t.due_date) ? 3 : t.due_date ? 2 : 1,
    meta: t.due_date ? formatDue(t.due_date) : 'No deadline',
  }))
  unsorted.sort((a, b) => b.score - a.score)
  return unsorted.slice(0, 3)
}

const EVENT_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

function EventRow({ event }: { event: EventListItem }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 -mx-4 px-4 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate">
          {event.sender?.split('@')[0] ?? 'Unknown'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {event.subject}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(event.created_at)}</span>
        <span className={eventStatusClass(event.status)}>
          {EVENT_STATUS_LABELS[event.status] ?? event.status}
        </span>
      </div>
    </div>
  )
}

function PriorityItem({
  label, labelClass, title, meta,
}: { label: string; labelClass: string; title: string; meta: string }) {
  return (
    <div className="bg-gray-50 dark:bg-navy-700 rounded-lg p-3 border border-gray-100 dark:border-navy-600">
      <div className={`text-[10px] font-medium mb-1.5 ${labelClass}`}>{label}</div>
      <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 leading-snug mb-1.5">{title}</div>
      <div className="text-[11px] text-gray-500 dark:text-gray-400">{meta}</div>
    </div>
  )
}
