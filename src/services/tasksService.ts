import { httpClient } from './client'
import type { Task, TaskStatus, PaginatedResponse, TaskFilters } from '@/types'

export interface CreateTaskPayload {
  title: string
  description?: string
  assignee_id?: string
  due_date?: string
}

export const tasksService = {
  async getAll(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    const { data } = await httpClient.get<PaginatedResponse<Task>>('/tasks', {
      params: {
        status: filters?.status === 'all' ? undefined : filters?.status,
        page: filters?.page,
        per_page: filters?.per_page,
      },
    })
    return data
  },

  async getById(id: string): Promise<Task> {
    const { data } = await httpClient.get<Task>(`/tasks/${id}`)
    return data
  },

  async update(id: string, patch: { status?: TaskStatus; assignee_id?: string }): Promise<Task> {
    const { data } = await httpClient.patch<Task>(`/tasks/${id}`, patch)
    return data
  },

  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await httpClient.post<Task>('/tasks', payload)
    return data
  },
}
