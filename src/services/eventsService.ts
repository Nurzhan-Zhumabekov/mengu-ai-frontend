import { httpClient } from './client'
import type {
  EventListItem, FullEvent, AIAnalysis, ActionLog,
  DocumentAnalysisListItem, DraftListItem, CalendarEventItem,
  PaginatedResponse, EventFilters,
} from '@/types'

export const eventsService = {
  /** GET /events returns flat list items: {id, source, subject, sender, status, created_at} */
  async getAll(filters?: EventFilters): Promise<PaginatedResponse<EventListItem>> {
    const { data } = await httpClient.get<PaginatedResponse<EventListItem>>('/events', {
      params: {
        status: filters?.status === 'all' ? undefined : filters?.status,
        page: filters?.page,
        per_page: filters?.per_page,
      },
    })
    return data
  },

  async getById(id: string): Promise<FullEvent> {
    const { data } = await httpClient.get<FullEvent>(`/events/${id}`)
    return data
  },

  async getAnalysis(id: string): Promise<AIAnalysis> {
    const { data } = await httpClient.get<AIAnalysis>(`/events/${id}/analysis`)
    return data
  },

  async reanalyze(id: string): Promise<{ analysis_id: string; status: string }> {
    const { data } = await httpClient.post<{ analysis_id: string; status: string }>(`/events/${id}/reanalyze`)
    return data
  },

  async getLogs(id: string): Promise<PaginatedResponse<ActionLog>> {
    const { data } = await httpClient.get<PaginatedResponse<ActionLog>>(`/events/${id}/logs`)
    return data
  },

  async getDocuments(id: string): Promise<PaginatedResponse<DocumentAnalysisListItem>> {
    const { data } = await httpClient.get<PaginatedResponse<DocumentAnalysisListItem>>(`/events/${id}/documents`)
    return data
  },

  async getDrafts(id: string, filters?: { status?: string }): Promise<PaginatedResponse<DraftListItem>> {
    const { data } = await httpClient.get<PaginatedResponse<DraftListItem>>(`/events/${id}/drafts`, {
      params: { status: filters?.status },
    })
    return data
  },

  async getCalendarEvents(id: string): Promise<PaginatedResponse<CalendarEventItem>> {
    const { data } = await httpClient.get<PaginatedResponse<CalendarEventItem>>(`/events/${id}/calendar-events`)
    return data
  },
}
