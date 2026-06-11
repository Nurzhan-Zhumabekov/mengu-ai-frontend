import axios from 'axios'
import type {
  IncomingEvent,
  FullEvent,
  Task,
  DocumentAnalysis,
  AIInsight,
  AnalyticsSummary,
  PaginatedResponse,
  EventFilters,
  TaskFilters,
  Draft,
  CalendarEvent,
  AIAnalysis,
  ActionLog,
  Organization,
  AuthResponse,
} from '@/types'
import {
  MOCK_EVENTS,
  MOCK_TASKS,
  MOCK_DOCUMENTS,
  MOCK_INSIGHTS,
  MOCK_ANALYTICS,
  MOCK_DRAFTS,
  MOCK_CALENDAR_EVENTS,
  MOCK_ANALYSES,
  MOCK_ACTION_LOGS,
  MOCK_ORGANIZATION,
  MOCK_USER,
} from '@/utils/mockData'

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mengu_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mengu_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Toggle: real API vs mock ─────────────────────────────────────────────────

const USE_MOCK = true
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms))

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay()
      return {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
        token_type: 'Bearer',
        expires_in: 3600,
        user: MOCK_USER,
      }
    }
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay()
      return {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
        token_type: 'Bearer',
        expires_in: 3600,
        user: MOCK_USER,
      }
    }
    const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return data
  },

  async loginWithGoogle() {
    window.location.href = '/api/v1/auth/oauth/google'
  },

  async loginWithMicrosoft() {
    window.location.href = '/api/v1/auth/oauth/microsoft'
  },
}

// ─── Organization ─────────────────────────────────────────────────────────────

export const organizationService = {
  async get(): Promise<Organization> {
    if (USE_MOCK) {
      await delay()
      return MOCK_ORGANIZATION
    }
    const { data } = await api.get('/organization')
    return data
  },

  async update(patch: Partial<Organization>): Promise<Organization> {
    if (USE_MOCK) {
      await delay()
      return { ...MOCK_ORGANIZATION, ...patch }
    }
    const { data } = await api.patch('/organization', patch)
    return data
  },
}

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsService = {
  async getAll(filters?: EventFilters): Promise<PaginatedResponse<IncomingEvent>> {
    if (USE_MOCK) {
      await delay()
      let data = [...MOCK_EVENTS]
      if (filters?.status && filters.status !== 'all') {
        data = data.filter((e) => e.status === filters.status)
      }
      return { data, total: data.length, page: 1, per_page: 20, has_more: false }
    }
    const { data } = await api.get('/events', { params: filters })
    return data
  },

  async getById(id: string): Promise<FullEvent> {
    if (USE_MOCK) {
      await delay()
      const event = MOCK_EVENTS.find((e) => e.id === id)!
      const analysis = MOCK_ANALYSES.find((a) => a.event_id === id) ?? null
      const action_logs = MOCK_ACTION_LOGS.filter((l) => l.event_id === id)
      return { ...event, analysis, action_logs }
    }
    const { data } = await api.get(`/events/${id}`)
    return data
  },

  async getAnalysis(id: string): Promise<AIAnalysis> {
    if (USE_MOCK) {
      await delay()
      return MOCK_ANALYSES.find((a) => a.event_id === id)!
    }
    const { data } = await api.get(`/events/${id}/analysis`)
    return data
  },

  async reanalyze(id: string): Promise<{ analysis_id: string; status: string }> {
    if (USE_MOCK) {
      await delay(1200)
      return { analysis_id: `analysis_${Date.now()}`, status: 'processing' }
    }
    const { data } = await api.post(`/events/${id}/reanalyze`)
    return data
  },

  async getLogs(id: string): Promise<PaginatedResponse<ActionLog>> {
    if (USE_MOCK) {
      await delay()
      const logs = MOCK_ACTION_LOGS.filter((l) => l.event_id === id)
      return { data: logs, total: logs.length, page: 1, per_page: 20, has_more: false }
    }
    const { data } = await api.get(`/events/${id}/logs`)
    return data
  },

  async getDocuments(id: string): Promise<PaginatedResponse<DocumentAnalysis>> {
    if (USE_MOCK) {
      await delay()
      const docs = MOCK_DOCUMENTS.filter((d) => d.event_id === id)
      return { data: docs, total: docs.length, page: 1, per_page: 20, has_more: false }
    }
    const { data } = await api.get(`/events/${id}/documents`)
    return data
  },

  async getDrafts(id: string): Promise<PaginatedResponse<Draft>> {
    if (USE_MOCK) {
      await delay()
      const drafts = MOCK_DRAFTS.filter((d) => d.event_id === id)
      return { data: drafts, total: drafts.length, page: 1, per_page: 20, has_more: false }
    }
    const { data } = await api.get(`/events/${id}/drafts`)
    return data
  },

  async getCalendarEvents(id: string): Promise<PaginatedResponse<CalendarEvent>> {
    if (USE_MOCK) {
      await delay()
      const mockCalendarEvents = MOCK_CALENDAR_EVENTS.filter(() => true)
      return { data: mockCalendarEvents, total: mockCalendarEvents.length, page: 1, per_page: 20, has_more: false }
    }
    const { data } = await api.get(`/events/${id}/calendar-events`)
    return data
  },
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasksService = {
  async getAll(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    if (USE_MOCK) {
      await delay()
      let data = [...MOCK_TASKS]
      if (filters?.status && filters.status !== 'all')
        data = data.filter((t) => t.status === filters.status)
      if (filters?.assignee_id)
        data = data.filter((t) => t.assignee_id === filters.assignee_id)
      return { data, total: data.length, page: 1, per_page: 50, has_more: false }
    }
    const { data } = await api.get('/tasks', { params: filters })
    return data
  },

  async getById(id: string): Promise<Task> {
    if (USE_MOCK) {
      await delay()
      return MOCK_TASKS.find((t) => t.id === id)!
    }
    const { data } = await api.get(`/tasks/${id}`)
    return data
  },

  async update(id: string, patch: Partial<Task>): Promise<Task> {
    if (USE_MOCK) {
      await delay()
      const task = MOCK_TASKS.find((t) => t.id === id)!
      return { ...task, ...patch }
    }
    const { data } = await api.patch(`/tasks/${id}`, patch)
    return data
  },
}

// ─── Drafts ───────────────────────────────────────────────────────────────────

export const draftsService = {
  async getById(id: string): Promise<Draft> {
    if (USE_MOCK) {
      await delay()
      return MOCK_DRAFTS.find((d) => d.id === id)!
    }
    const { data } = await api.get(`/drafts/${id}`)
    return data
  },

  async approve(id: string): Promise<Draft> {
    if (USE_MOCK) {
      await delay()
      const draft = MOCK_DRAFTS.find((d) => d.id === id)!
      return { ...draft, status: 'approved' }
    }
    const { data } = await api.patch(`/drafts/${id}/approve`)
    return data
  },

  async update(id: string, patch: Partial<Draft>): Promise<Draft> {
    if (USE_MOCK) {
      await delay()
      const draft = MOCK_DRAFTS.find((d) => d.id === id)!
      return { ...draft, ...patch }
    }
    const { data } = await api.patch(`/drafts/${id}`, patch)
    return data
  },
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export const insightsService = {
  async getAll(): Promise<AIInsight[]> {
    if (USE_MOCK) {
      await delay()
      return MOCK_INSIGHTS
    }
    const { data } = await api.get('/insights')
    return data
  },
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    if (USE_MOCK) {
      await delay()
      return MOCK_ANALYTICS
    }
    const { data } = await api.get('/analytics/summary')
    return data
  },
}
