import { httpClient } from './client'
import type { AnalyticsSummary } from '@/types'

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    const { data } = await httpClient.get<AnalyticsSummary>('/analytics/summary')
    return data
  },
}
