// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  org_id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
  department: string
  is_active: boolean
  avatar_url?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'professional' | 'enterprise'
  created_at: string
  settings?: {
    language: 'ru' | 'kk' | 'en'
    timezone: string
    reply_style: 'formal' | 'neutral' | 'friendly'
  }
}

// ─── Incoming Events ──────────────────────────────────────────────────────────

export type EventSource = 'email' | 'api' | 'webhook'
export type EventStatus = 'new' | 'processing' | 'completed' | 'failed'
export type ActionType = 'schedule_meeting' | 'create_task' | 'analyze_document' | 'send_email_draft'
export type ActionStatus = 'success' | 'failed' | 'skipped'

export interface EventAttachment {
  filename: string
  content_type: string
  size: number
  url: string
}

export interface EventMetadata {
  sender?: string
  subject?: string
  attachments?: EventAttachment[]
  headers?: Record<string, string>
}

export interface IncomingEvent {
  id: string
  org_id: string
  source: EventSource
  raw_content: string
  metadata: EventMetadata
  status: EventStatus
  created_at: string
}

export interface FullEvent extends IncomingEvent {
  analysis?: AIAnalysis | null
  action_logs?: ActionLog[]
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface AIAction {
  type: ActionType
  data: Record<string, unknown>
}

export interface AIAnalysis {
  id: string
  event_id: string
  org_id: string
  intent: string
  confidence: number
  actions: AIAction[]
  raw_response: Record<string, unknown>
  created_at: string
}

// ─── Action Logs ──────────────────────────────────────────────────────────────

export interface ActionLog {
  id: string
  org_id: string
  event_id: string
  action_type: ActionType
  payload: Record<string, unknown>
  status: ActionStatus
  error_message?: string
  created_at: string
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'new' | 'in_progress' | 'done' | 'cancelled'

export interface Task {
  id: string
  org_id: string
  event_id: string
  assignee_id?: string
  title: string
  description?: string
  status: TaskStatus
  due_date?: string
  created_at: string
}

// ─── Document Analysis ────────────────────────────────────────────────────────

export interface DocumentAnalysis {
  id: string
  org_id: string
  event_id: string
  file_name: string
  summary?: string
  risks: string[]
  analyzed_at: string
}

// ─── Drafts ───────────────────────────────────────────────────────────────────

export type DraftStatus = 'pending_approval' | 'approved' | 'sent' | 'rejected'

export interface Draft {
  id: string
  org_id: string
  event_id: string
  recipient: string
  subject: string
  body: string
  status: DraftStatus
  created_at: string
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export interface CalendarEvent {
  title: string
  datetime: string
  google_event_id?: string
  status: 'created' | 'failed'
  created_at: string
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export type InsightType =
  | 'contract_signing_ignore'
  | 'team_workload_imbalance'
  | 'revenue_opportunity'
  | 'sla_violation'
  | 'overdue_task'

export interface AIInsight {
  id: string
  org_id: string
  type: InsightType
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  related_entity_id?: string
  related_entity_type?: 'task' | 'document' | 'event'
  is_resolved: boolean
  created_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  events_today: number
  events_auto_processed: number
  active_tasks: number
  overdue_tasks: number
  avg_response_time_minutes: number
  tasks_on_time_pct: number
  ai_accuracy_pct: number
  open_documents: number
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface ApiError {
  error: string
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface EventFilters {
  status?: EventStatus | 'all'
  page?: number
  per_page?: number
}

export interface TaskFilters {
  status?: TaskStatus | 'all'
  assignee_id?: string
  page?: number
  per_page?: number
}

export interface DraftFilters {
  status?: DraftStatus | 'all'
  page?: number
  per_page?: number
}
