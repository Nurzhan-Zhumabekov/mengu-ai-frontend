import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Video, Clock, Zap, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, EmptyState } from '@/components/ui'
import { eventsService, integrationsService } from '@/services'
import { toast } from '@/components/ui/toast'
import { formatDateTime } from '@/utils/helpers'
import type { EventStatus, CalendarEventItem } from '@/types'

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
                onClick={handleConnectCalendar}
                className="bg-white text-navy-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Connect Google Calendar
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
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
                subject={event.metadata.subject ?? 'No subject'}
                sender={event.metadata.sender ?? 'Unknown'}
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

        <MonthGrid
          viewDate={viewDate}
          calendarEvents={allCalendarEvents ?? []}
          onPrevMonth={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNextMonth={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          onToday={() => setViewDate(new Date())}
        />

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
          Click an event above to see its calendar entries
        </p>
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

function MonthGrid({ viewDate, calendarEvents, onPrevMonth, onNextMonth, onToday }: {
  viewDate: Date
  calendarEvents: CalendarEventItem[]
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
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

  return (
    <Card
      title={`${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
      action={
        <div className="flex items-center gap-1">
          <button onClick={onPrevMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 dark:text-gray-400">
            <ChevronLeft size={14} />
          </button>
          <button onClick={onToday} className="text-xs text-magenta-500 hover:underline px-1">
            Today
          </button>
          <button onClick={onNextMonth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 dark:text-gray-400">
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
          return (
            <div
              key={i}
              className={`bg-white dark:bg-navy-800 min-h-[60px] p-1.5 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors ${
                cell.inCurrentMonth ? '' : 'opacity-30'
              }`}
            >
              <div className={`text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                cell.isToday ? 'bg-magenta-500 text-white font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {cell.date.getDate()}
              </div>
              {dayEvents.slice(0, 2).map((evt, j) => (
                <div key={j} className="w-full bg-magenta-100 dark:bg-magenta-500/20 text-magenta-700 dark:text-magenta-300 text-[9px] rounded px-1 py-0.5 truncate mb-0.5">
                  {evt.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[9px] text-gray-400 dark:text-gray-500 px-1">+{dayEvents.length - 2} more</div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
