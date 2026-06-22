// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface DecodedUser {
  id: string
  org_id: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  created_at: string
}

// ─── Incoming Events ──────────────────────────────────────────────────────────

export type EventSource = 'email' | 'api' | 'webhook' | 'gmail'
export type EventStatus = 'new' | 'processing' | 'completed' | 'failed'
export type ActionType = 'schedule_meeting' | 'create_task' | 'analyze_document' | 'send_email_draft'
export type ActionStatus = 'success' | 'failed' | 'skipped'

/** List item from GET /events — flat fields (subject/sender are NOT nested in metadata) */
export interface EventListItem {
  id: string
  source: EventSource
  subject: string
  sender: string
  status: EventStatus
  created_at: string
}

export interface EventAttachment {
  filename: string
  content_type: string
  size: number
  url: string
}

export interface EventMetadata {
  sender?: string
  subject?: string
  attachments?: EventAttachment[] | null
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

export interface FullEvent {
  event: IncomingEvent
  analysis?: AIAnalysis
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
  version: number
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
  error_message?: string | null
  created_at: string
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
//
// Backend uses: 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Task {
  id: string
  org_id?: string
  event_id?: string | null
  title: string
  description?: string | null
  status: TaskStatus
  assignee_id?: string | null
  due_date?: string | null
  completed_at?: string | null
  created_at: string
}

// ─── Document Analysis ────────────────────────────────────────────────────────

export interface DocumentAnalysisListItem {
  id: string
  file_name: string
  summary?: string | null
  risks: number
  analyzed_at: string
}

// ─── Drafts ───────────────────────────────────────────────────────────────────

export type DraftStatus = 'pending_approval' | 'approved' | 'sent' | 'rejected'

export interface DraftListItem {
  id: string
  event_id: string
  recipient: string
  subject: string
  status: DraftStatus
  created_at: string
}

export interface Draft extends DraftListItem {
  org_id: string
  body: string
}

export interface DraftApproveResponse {
  id: string
  status: DraftStatus
  send_status?: 'success' | 'failed'
  send_error?: string
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export interface CalendarEventItem {
  title: string
  datetime: string
  google_event_id?: string
  status: 'created' | 'failed'
  created_at: string
}

// ─── Integrations ──────────────────────────────────────────────────────────────

export type IntegrationProvider = 'gmail' | 'calendar'

export interface IntegrationStatus {
  provider: IntegrationProvider
  connected: boolean
  scope?: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export interface ApiError {
  error: string
  message?: string
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface EventFilters {
  status?: EventStatus | 'all'
  page?: number
  per_page?: number
}

export interface TaskFilters {
  status?: TaskStatus | 'all'
  page?: number
  per_page?: number
}

export interface DraftFilters {
  status?: DraftStatus | 'all'
  page?: number
  per_page?: number
}

// ─── Local-only Settings ─────────────────────────────────────────────────────

export interface LocalSettings {
  language: 'en' | 'ru' | 'kk'
  replyStyle: 'formal' | 'neutral' | 'friendly'
}
