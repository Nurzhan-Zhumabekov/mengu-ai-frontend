import { httpClient } from './client'
import type { Organization } from '@/types'

export const organizationService = {
  async get(): Promise<Organization> {
    const { data } = await httpClient.get<Organization>('/organization')
    return data
  },

  async update(patch: { name?: string; plan?: string }): Promise<Organization> {
    const { data } = await httpClient.patch<Organization>('/organization', patch)
    return data
  },
}
