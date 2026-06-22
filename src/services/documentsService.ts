import { httpClient } from './client'
import { eventsService } from './eventsService'
import type { DocumentAnalysisListItem, PaginatedResponse } from '@/types'

export const documentsService = {
  async getAll(): Promise<DocumentAnalysisListItem[]> {
    const eventsRes = await eventsService.getAll({ status: 'completed' })
    const events = eventsRes.data

    if (events.length === 0) return []

    const docPromises = events.map((event) =>
      eventsService.getDocuments(event.id).then((res) => res.data)
    )
    const docArrays = await Promise.all(docPromises)
    return docArrays.flat()
  },

  async getByEventId(eventId: string): Promise<PaginatedResponse<DocumentAnalysisListItem>> {
    return eventsService.getDocuments(eventId)
  },

  async upload(file: File): Promise<DocumentAnalysisListItem> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await httpClient.post<DocumentAnalysisListItem>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
