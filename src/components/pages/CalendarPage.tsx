import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Video, Clock, Zap, CheckCircle, XCircle } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { eventsService } from '@/services/api'
import { formatDateTime } from '@/utils/helpers'
import type { EventStatus } from '@/types'

const STATUS_FILTERS: { label: string; value: EventStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Completed', value: 'completed' },
]

export function CalendarPage() {
  const [filter, setFilter] = useState<EventStatus | 'all'>('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Calendar"
        actions={
          <button
            onClick={() => window.alert('Calendar integration coming soon')}
            className="btn-primary"
          >
            <Calendar size={14} /> Create Event
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Connect banner */}
        <div className="bg-navy-800 rounded-xl p-5 flex items-center gap-5">
          <div className="w-12 h-12 bg-magenta-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-medium mb-1">
              Connect Google Calendar or Outlook
            </h2>
            <p className="text-white/60 text-sm">
              Mengu AI will automatically create events from emails, find free slots, and send invitations
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="bg-white text-navy-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Google Calendar
            </button>
            <button className="bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition-colors border border-white/20">
              Outlook
            </button>
          </div>
        </div>

        {/* Event filters */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-magenta-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Events with calendar entries */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-sm text-gray-400">No events found</div>
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

        {/* Calendar entries for selected event */}
        {selectedEventId && (
          <Card title="Created Calendar Events">
            {loadingCalendar ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : calendarEvents.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">No calendar events found</div>
            ) : (
              <div className="space-y-2">
                {calendarEvents.map((calEvent, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-9 h-9 bg-magenta-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video size={16} className="text-magenta-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900">{calEvent.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        <Clock size={11} className="inline mr-1" />
                        {formatDateTime(calEvent.datetime)}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {calEvent.status === 'created' ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle size={12} /> Created
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-500">
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

        {/* Calendar grid */}
        <Card title="June 2026">
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
              <div key={d} className="bg-gray-50 text-center text-[11px] font-medium text-gray-500 py-2">{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i + 1
              const isToday = day === 11
              const hasEvent = [12, 15, 18].includes(day)
              return (
                <div
                  key={i}
                  className={`bg-white min-h-[60px] p-1.5 cursor-pointer hover:bg-pink-50 transition-colors ${
                    day < 1 || day > 30 ? 'opacity-30' : ''
                  }`}
                >
                  <div className={`text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-magenta-500 text-white font-medium' : 'text-gray-700'
                  }`}>
                    {day > 0 && day <= 30 ? day : ''}
                  </div>
                  {hasEvent && day > 0 && day <= 30 && (
                    <div className="w-full bg-magenta-100 text-magenta-700 text-[9px] rounded px-1 py-0.5 truncate">
                      {day === 12 ? 'Dev Sync' : day === 15 ? 'Contract Review' : 'Halyk Demo'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-2">
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
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'border-magenta-400 ring-1 ring-magenta-400' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-magenta-500/10 rounded-lg flex items-center justify-center">
            <Calendar size={16} className="text-magenta-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{subject}</div>
            <div className="text-xs text-gray-500">{sender}</div>
          </div>
        </div>
        <span className="text-[11px] text-gray-400">{formatDateTime(createdAt)}</span>
      </div>
    </div>
  )
}
