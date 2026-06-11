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
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
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

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
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

// In-memory store for uploaded docs
const UPLOADED_DOCS: DocumentAnalysis[] = []

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
      const mockCalendarEvents = MOCK_CALENDAR_EVENTS.filter((e) => e.event_id === id)
      return { data: mockCalendarEvents, total: mockCalendarEvents.length, page: 1, per_page: 20, has_more: false }
    }
    const { data } = await api.get(`/events/${id}/calendar-events`)
    return data
  },

  async getAllUploadedDocs(): Promise<DocumentAnalysis[]> {
    if (USE_MOCK) {
      await delay(200)
      return [...MOCK_DOCUMENTS, ...UPLOADED_DOCS]
    }
    return []
  },

  async uploadDocument(fileName: string, fileSize: number): Promise<DocumentAnalysis> {
    if (USE_MOCK) {
      await delay(600)
      const doc: DocumentAnalysis = {
        id: `upload_${Date.now()}`,
        org_id: 'org_123',
        event_id: `upload_event_${Date.now()}`,
        file_name: fileName,
        summary: 'AI analysis in progress...',
        risks: [],
        analyzed_at: new Date().toISOString(),
      }
      UPLOADED_DOCS.push(doc)
      return doc
    }
    const { data } = await api.post('/events/upload', { file_name: fileName, file_size: fileSize })
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

  async create(payload: Partial<Task>): Promise<Task> {
    if (USE_MOCK) {
      await delay()
      const newTask: Task = {
        id: `task_${Date.now()}`,
        org_id: 'org_123',
        event_id: '',
        title: payload.title ?? '',
        description: payload.description,
        status: 'new',
        assignee_id: payload.assignee_id,
        due_date: payload.due_date,
        created_at: new Date().toISOString(),
      }
      MOCK_TASKS.push(newTask)
      return newTask
    }
    const { data } = await api.post('/tasks', payload)
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

interface TimeSeriesPoint { date: string; count: number }
interface StatusCount { name: string; value: number }
interface WorkloadItem { name: string; tasks: number }
interface AccuracyItem { category: string; accuracy: number; target: number }

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    if (USE_MOCK) {
      await delay()
      return MOCK_ANALYTICS
    }
    const { data } = await api.get('/analytics/summary')
    return data
  },

  async getEventsTimeSeries(): Promise<TimeSeriesPoint[]> {
    if (USE_MOCK) {
      await delay(300)
      const now = Date.now()
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now - (29 - i) * 86400000)
        return { date: d.toISOString().slice(0, 10), count: 10 + Math.floor(Math.random() * 40) }
      })
    }
    const { data } = await api.get('/analytics/events-timeseries')
    return data
  },

  async getTasksByStatus(): Promise<StatusCount[]> {
    if (USE_MOCK) {
      await delay(300)
      return [
        { name: 'New', value: MOCK_TASKS.filter((t) => t.status === 'new').length },
        { name: 'In Progress', value: MOCK_TASKS.filter((t) => t.status === 'in_progress').length },
        { name: 'Done', value: MOCK_TASKS.filter((t) => t.status === 'done').length },
        { name: 'Cancelled', value: MOCK_TASKS.filter((t) => t.status === 'cancelled').length },
      ]
    }
    const { data } = await api.get('/analytics/tasks-by-status')
    return data
  },

  async getTeamWorkload(): Promise<WorkloadItem[]> {
    if (USE_MOCK) {
      await delay(300)
      return [
        { name: 'Dilnaz', tasks: 4 },
        { name: 'Aidar', tasks: 7 },
        { name: 'Aya', tasks: 2 },
        { name: 'Yerlan', tasks: 5 },
        { name: 'Moldir', tasks: 3 },
        { name: 'Ruslan', tasks: 6 },
      ]
    }
    const { data } = await api.get('/analytics/team-workload')
    return data
  },

  async getAiAccuracy(): Promise<AccuracyItem[]> {
    if (USE_MOCK) {
      await delay(300)
      return [
        { category: 'Intent Detection', accuracy: 94, target: 95 },
        { category: 'Entity Extraction', accuracy: 91, target: 93 },
        { category: 'Sentiment Analysis', accuracy: 88, target: 92 },
        { category: 'Document Summary', accuracy: 96, target: 94 },
        { category: 'Action Selection', accuracy: 90, target: 93 },
        { category: 'Draft Quality', accuracy: 87, target: 90 },
      ]
    }
    const { data } = await api.get('/analytics/ai-accuracy')
    return data
  },
}
