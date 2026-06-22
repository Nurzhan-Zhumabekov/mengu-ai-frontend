import { httpClient } from './client'
import type { Insight } from '@/types'

export const insightsService = {
  async getAll(): Promise<Insight[]> {
    const { data } = await httpClient.get<Insight[]>('/insights')
    return data
  },

  async resolve(key: string): Promise<{ key: string; resolved: boolean }> {
    const { data } = await httpClient.patch<{ key: string; resolved: boolean }>('/insights/resolve', { key })
    return data
  },
}
