import { httpClient } from './client'

export interface UserListItem {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  auth_provider: string
  created_at: string
}

export const usersService = {
  async list(): Promise<{ data: UserListItem[]; total: number }> {
    const { data } = await httpClient.get<{ data: UserListItem[]; total: number }>('/users')
    return data
  },
}
