// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  org_id: string
  email: string
  // Backend returns "name", frontend UI uses "full_name" — both kept for compat
  name?: string
  full_name?: string
  role: 'admin' | 'manager' | 'employee' | 'viewer'
  department?: string
  is_active?: boolean
  avatar_url?: string
  auth_provider?: string
  preferences?: UserPreferences
  created_at?: string
}

export interface UserPreferences {
  notifications_email?: boolean
  notifications_push?: boolean
  notifications_slack?: boolean
  language?: 'ru' | 'kk' | 'en'
  reply_style?: 'formal' | 'neutral' | 'friendly'
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user?: User
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
  plan: 'starter' | 'professional' | 'enterprise' | 'free' | 'pro'
  created_at: string
  updated_at?: string
  settings?: OrgSettings
  sla_policies?: SLAPolicy[]
}

export interface OrgSettings {
  language: 'ru' | 'kk' | 'en'
  timezone: string
  reply_style: 'formal' | 'neutral' | 'friendly'
}

export interface SLAPolicy {
  type: string
  response_time_hours: number
  resolution_time_hours: number
  escalation_after_hours: number
}

// ─── Incoming Events ──────────────────────────────────────────────────────────

export type EventSource = 'email' | 'document' | 'webhook' | 'manual' | 'calendar' | 'api' | 'gmail'
export type EventStatus = 'new' | 'processing' | 'actioned' | 'closed' | 'completed' | 'failed'
export type EventPriority = 'critical' | 'high' | 'medium' | 'low'
export type EventCategory = 'partnership' | 'investor_update' | 'contract' | 'product' | 'internal' | 'hr' | 'legal' | 'finance' | 'support' | 'other'
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
  [key: string]: unknown
}

export interface ExtractedEntities {
  names?: string[]
  companies?: string[]
  dates?: string[]
  amounts?: string[]
  urls?: string[]
  [key: string]: unknown
}

export interface IncomingEvent {
  id: string
  org_id: string
  source: EventSource
  raw_content: string
  metadata: EventMetadata
  intent?: string
  entities?: ExtractedEntities
  priority?: EventPriority
  category?: EventCategory
  status: EventStatus
  processed_at?: string
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
  version?: number
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

export type TaskStatus = 'new' | 'in_progress' | 'pending_approval' | 'blocked' | 'done' | 'cancelled'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  org_id: string
  event_id: string
  parent_task_id?: string | null
  assignee_id?: string
  created_by_id?: string | null
  title: string
  description?: string
  status: TaskStatus
  priority?: TaskPriority
  due_date?: string
  completed_at?: string
  tags?: string[]
  created_at: string
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType = 'contract' | 'invoice' | 'application' | 'report' | 'protocol' | 'order' | 'other'
export type ApprovalStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'signed'

export interface Document {
  id: string
  org_id: string
  event_id?: string
  title: string
  type: DocumentType
  file_path?: string
  file_name: string
  file_size_bytes?: number
  mime_type?: string
  extracted_text?: string
  summary?: string
  extracted_entities?: ExtractedEntities
  risk_flags?: RiskFlag[]
  approval_status: ApprovalStatus
  version: number
  approval_chain?: ApprovalStep[]
  created_at: string
  analyzed_at?: string
}

export interface RiskFlag {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ApprovalStep {
  id: string
  approver_id: string
  approver_name?: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  acted_at?: string
}

// Keep legacy alias for backward compat
export interface DocumentAnalysis {
  id: string
  org_id: string
  event_id: string
  file_name: string
  summary?: string
  risks: string[]
  analyzed_at: string
}

// ─── Workflow Execution ───────────────────────────────────────────────────────

export type WorkflowStatus = 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowStep {
  step_number: number
  action: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: Record<string, unknown>
  started_at?: string
  completed_at?: string
}

export interface WorkflowExecution {
  id: string
  org_id: string
  workflow_definition_id: string
  trigger_event_id: string
  status: WorkflowStatus
  current_step: number
  steps_log: WorkflowStep[]
  started_at: string
  completed_at?: string
  error_message?: string
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
  event_id: string
  title: string
  datetime: string
  end_datetime?: string
  google_event_id?: string
  status: 'created' | 'failed'
  attendees?: string[]
  location?: string
  meeting_url?: string
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

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  type: 'task_assigned' | 'task_overdue' | 'document_approved' | 'insight_new' | 'event_processed' | 'sla_breach' | 'system'
  title: string
  message: string
  read: boolean
  related_id?: string
  related_type?: 'task' | 'document' | 'event' | 'insight'
  created_at: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string
  org_id: string
  user_id?: string
  user_name?: string
  action: string
  entity_type: string
  entity_id: string
  details?: Record<string, unknown>
  ip_address?: string
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
  message?: string
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface EventFilters {
  status?: EventStatus | 'all'
  priority?: EventPriority | 'all'
  category?: EventCategory | 'all'
  page?: number
  per_page?: number
}

export interface TaskFilters {
  status?: TaskStatus | 'all'
  priority?: TaskPriority | 'all'
  assignee_id?: string
  page?: number
  per_page?: number
}

export interface DraftFilters {
  status?: DraftStatus | 'all'
  page?: number
  per_page?: number
}

export interface DocumentFilters {
  type?: DocumentType | 'all'
  approval_status?: ApprovalStatus | 'all'
  page?: number
  per_page?: number
}
