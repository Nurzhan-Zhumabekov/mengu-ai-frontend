import { httpClient } from './client'
import type { Draft, DraftApproveResponse } from '@/types'

export const draftsService = {
  async getById(id: string): Promise<Draft> {
    const { data } = await httpClient.get<Draft>(`/drafts/${id}`)
    return data
  },

  async approve(id: string): Promise<DraftApproveResponse> {
    const { data } = await httpClient.patch<DraftApproveResponse>(`/drafts/${id}/approve`)
    return data
  },

  async update(id: string, patch: { recipient?: string; subject?: string; body?: string }): Promise<Draft> {
    const { data } = await httpClient.patch<Draft>(`/drafts/${id}`, patch)
    return data
  },
}
