import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Video, Clock, Zap, CheckCircle, XCircle, ChevronLeft, ChevronRight, ListTodo, AlertTriangle } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, EmptyState, Badge } from '@/components/ui'
import { eventsService, integrationsService, tasksService } from '@/services'
import { toast } from '@/components/ui/toast'
import { formatDateTime, isOverdue, isDueSoon, formatDate, formatTime } from '@/utils/helpers'
import type { EventStatus, CalendarEventItem, Task } from '@/types'

const STATUS_FILTERS: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Completed', value: 'completed' },
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarPage() {
  const [filter, setFilter] = useState<EventStatus | 'all'>('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsService.list,
  })
  const calendarConnected = integrations?.some((i) => i.provider === 'calendar' && i.connected) ?? false

  async function handleConnectCalendar() {
    try {
      const url = await integrationsService.getOAuthUrl('calendar')
      window.location.href = url
    } catch {
      toast('Could not start the connection. Please try again.', 'error')
    }
  }

  const { data: eventsData } = useQuery({
    queryKey: ['events', filter],
    queryFn: () => eventsService.getAll({ status: filter === 'all' ? undefined : filter }),
  })

  const events = eventsData?.data ?? []

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getAll({ status: 'all' }),
  })

  const tasks = tasksData?.data ?? []

  const tasksWithDueDates = useMemo(
    () => tasks.filter((t) => t.due_date && t.status !== 'completed' && t.status !== 'cancelled'),
    [tasks]
  )

  const { data: calendarData, isLoading: loadingCalendar } = useQuery({
    queryKey: ['calendar-events', selectedEventId],
    queryFn: () => eventsService.getCalendarEvents(selectedEventId!),
    enabled: !!selectedEventId,
  })

  const calendarEvents = calendarData?.data ?? []

  const { data: allCalendarEvents } = useQuery({
    queryKey: ['calendar-events', 'all', events.map((e) => e.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(events.map((e) => eventsService.getCalendarEvents(e.id)))
      return results.flatMap((r) => r.data)
    },
    enabled: events.length > 0,
  })

  const dayDetailEvents = useMemo(() => {
    if (!selectedDay || !allCalendarEvents) return []
    const key = selectedDay.toDateString()
    return allCalendarEvents.filter((e) => new Date(e.datetime).toDateString() === key)
  }, [selectedDay, allCalendarEvents])

  const dayDetailTasks = useMemo(() => {
    if (!selectedDay) return []
    const key = selectedDay.toDateString()
    return tasksWithDueDates.filter((t) => new Date(t.due_date!).toDateString() === key)
  }, [selectedDay, tasksWithDueDates])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Calendar" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {!calendarConnected && (
          <div className="bg-navy-800 rounded-xl p-5 flex items-center gap-5">
            <div className="w-12 h-12 bg-magenta-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-medium mb-1">
                Connect Google Calendar
              </h2>
              <p className="text-white/60 text-sm">
                Mengu AI will automatically create events from emails it processes
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleConnectCalendar}
                className="bg-white text-navy-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Connect Google Calendar
              </button>
            </div>
          </div>
        )}

        <MonthGrid
          viewDate={viewDate}
          calendarEvents={allCalendarEvents ?? []}
          tasks={tasksWithDueDates}
          onPrevMonth={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNextMonth={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          onToday={() => setViewDate(new Date())}
          onDayClick={(d) => setSelectedDay(d)}
        />

        {selectedDay && (dayDetailEvents.length > 0 || dayDetailTasks.length > 0) && (
          <Card title={`${formatDate(selectedDay.toISOString())} — Schedule`}>
            <div className="space-y-3">
              {dayDetailEvents.map((evt, i) => (
                <div key={`evt-${i}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-700 rounded-lg border border-gray-100 dark:border-navy-600">
                  <div className="w-9 h-9 bg-magenta-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video size={16} className="text-magenta-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{evt.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Clock size={11} className="inline mr-1" />
                      {formatTime(evt.datetime)}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {evt.status === 'created' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={12} /> Created
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                        <XCircle size={12} /> Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {dayDetailTasks.map((t) => (
                <div key={`task-${t.id}`} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-navy-700 rounded-lg border border-amber-100 dark:border-navy-600">
                  <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ListTodo size={16} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{t.title}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Due {formatTime(t.due_date!)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card title="Upcoming Deadlines" action={
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
            {tasksWithDueDates.length} task{tasksWithDueDates.length !== 1 ? 's' : ''}
          </Badge>
        }>
          {tasksWithDueDates.length === 0 ? (
            <EmptyState icon={<ListTodo size={24} />} title="No upcoming deadlines" description="Tasks with due dates will appear here" />
          ) : (
            <div className="space-y-1.5">
              {tasksWithDueDates.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue(t.due_date) ? 'bg-red-500' : isDueSoon(t.due_date) ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{t.title}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {isOverdue(t.due_date) ? (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle size={10} /> Overdue
                        </span>
                      ) : (
                        <>Due {formatDate(t.due_date!)}</>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatTime(t.due_date!)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              type="button"
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-magenta-500 text-white'
                  : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <Card>
              <EmptyState icon={<Calendar size={28} />} title="No events found" />
            </Card>
          ) : (
            events.map((event) => (
              <CalendarEventCard
                key={event.id}
                subject={event.subject ?? 'No subject'}
                sender={event.sender ?? 'Unknown'}
                createdAt={event.created_at}
                isSelected={selectedEventId === event.id}
                onSelect={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
              />
            ))
          )}
        </div>

        {selectedEventId && (
          <Card title="Created Calendar Events">
            {loadingCalendar ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : calendarEvents.length === 0 ? (
              <EmptyState icon={<Video size={24} />} title="No calendar events found" />
            ) : (
              <div className="space-y-2">
                {calendarEvents.map((calEvent, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-navy-700 rounded-lg border border-gray-100 dark:border-navy-600">
                    <div className="w-9 h-9 bg-magenta-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video size={16} className="text-magenta-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{calEvent.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Clock size={11} className="inline mr-1" />
                        {formatDateTime(calEvent.datetime)}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {calEvent.status === 'created' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={12} /> Created
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                          <XCircle size={12} /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

function CalendarEventCard({ subject, sender, createdAt, isSelected, onSelect }: {
  subject: string
  sender: string
  createdAt: string
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white dark:bg-navy-800 border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'border-magenta-400 ring-1 ring-magenta-400' : 'border-gray-100 dark:border-navy-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-magenta-500/10 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-magenta-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{subject}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{sender}</div>
          </div>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDateTime(createdAt)}</span>
      </div>
    </div>
  )
}

interface DayCell {
  date: Date
  inCurrentMonth: boolean
  isToday: boolean
}

function buildMonthCells(viewDate: Date): DayCell[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const today = new Date()
  const mondayFirstOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - mondayFirstOffset)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    return {
      date,
      inCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === today.toDateString(),
    }
  })
}

function MonthGrid({ viewDate, calendarEvents, tasks, onPrevMonth, onNextMonth, onToday, onDayClick }: {
  viewDate: Date
  calendarEvents: CalendarEventItem[]
  tasks: Task[]
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (d: Date) => void
}) {
  const cells = useMemo(() => buildMonthCells(viewDate), [viewDate])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>()
    for (const evt of calendarEvents) {
      const key = new Date(evt.datetime).toDateString()
      const list = map.get(key) ?? []
      list.push(evt)
      map.set(key, list)
    }
    return map
  }, [calendarEvents])

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.due_date) continue
      const key = new Date(t.due_date).toDateString()
      const list = map.get(key) ?? []
      list.push(t)
      map.set(key, list)
    }
    return map
  }, [tasks])

  return (
    <Card
      title={`${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
      action={
        <div className="flex items-center gap-1">
          <button type="button" onClick={onPrevMonth} aria-label="Previous month" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 dark:text-gray-400">
            <ChevronLeft size={14} />
          </button>
          <button type="button" onClick={onToday} className="text-xs text-magenta-500 hover:underline px-1">
            Today
          </button>
          <button type="button" onClick={onNextMonth} aria-label="Next month" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 dark:text-gray-400">
            <ChevronRight size={14} />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-navy-700 rounded-lg overflow-hidden">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="bg-gray-50 dark:bg-navy-800 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 py-2">{d}</div>
        ))}
        {cells.map((cell, i) => {
          const dayEvents = eventsByDay.get(cell.date.toDateString()) ?? []
          const dayTasks = tasksByDay.get(cell.date.toDateString()) ?? []
          const totalItems = dayEvents.length + dayTasks.length
          const hasOverdue = dayTasks.some((t) => isOverdue(t.due_date))
          return (
            <div
              key={i}
              onClick={() => onDayClick(cell.date)}
              className={`bg-white dark:bg-navy-800 min-h-[70px] p-1.5 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors ${
                cell.inCurrentMonth ? '' : 'opacity-30'
              }`}
            >
              <div className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${
                cell.isToday ? 'bg-magenta-500 text-white font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {cell.date.getDate()}
              </div>
              {dayEvents.slice(0, 1).map((evt, j) => (
                <div key={`evt-${j}`} className="w-full bg-magenta-100 dark:bg-magenta-500/20 text-magenta-700 dark:text-magenta-300 text-[8px] leading-tight rounded px-1 py-0.5 truncate mb-px">
                  {evt.title}
                </div>
              ))}
              {dayTasks.slice(0, 1).map((t, j) => (
                <div key={`task-${j}`} className={`w-full text-[8px] leading-tight rounded px-1 py-0.5 truncate mb-px ${
                  isOverdue(t.due_date)
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}>
                  {t.title}
                </div>
              ))}
              {totalItems > 2 && (
                <div className="text-[8px] text-gray-400 dark:text-gray-500 px-0.5">+{totalItems - 2} more</div>
              )}
              {hasOverdue && (
                <div className="flex justify-center mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
