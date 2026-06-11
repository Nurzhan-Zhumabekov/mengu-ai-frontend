import type {
  IncomingEvent,
  Task,
  DocumentAnalysis,
  AIInsight,
  AnalyticsSummary,
  User,
  Draft,
  CalendarEvent,
  AIAnalysis,
  ActionLog,
  Organization,
} from '@/types'

export const MOCK_USER: User = {
  id: 'u1',
  org_id: 'org_123',
  email: 'dilnaz@mengu.ai',
  full_name: 'Dilnaz Maratova',
  role: 'admin',
  department: 'Management',
  is_active: true,
}

export const MOCK_ORGANIZATION: Organization = {
  id: 'org_123',
  name: 'Astana IT University',
  slug: 'astana-it-university',
  plan: 'professional',
  created_at: '2026-01-01T00:00:00Z',
  settings: {
    language: 'en',
    timezone: 'Asia/Almaty',
    reply_style: 'formal',
  },
}

export const MOCK_ANALYTICS: AnalyticsSummary = {
  events_today: 4,
  events_auto_processed: 1,
  active_tasks: 3,
  overdue_tasks: 1,
  avg_response_time_minutes: 3.2,
  tasks_on_time_pct: 94,
  ai_accuracy_pct: 92,
  open_documents: 1,
}

export const MOCK_EVENTS: IncomingEvent[] = [
  {
    id: 'evt_001',
    org_id: 'org_123',
    source: 'email',
    raw_content: 'We need to schedule a meeting next Monday at 17:00 to discuss the attached contract.\n\nPlease review the document before the meeting and prepare initial comments.',
    metadata: {
      sender: 'partner@company.com',
      subject: 'Contract Review Meeting',
      attachments: [
        { filename: 'contract.pdf', content_type: 'application/pdf', size: 123456, url: 'https://storage.example.com/contract.pdf' },
      ],
    },
    status: 'completed',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'evt_002',
    org_id: 'org_123',
    source: 'email',
    raw_content: 'Dear Mengu team,\n\nPlease find attached the signed NDA for our partnership.\n\nBest regards,\nKcell Enterprise',
    metadata: {
      sender: 'corp@kcell.kz',
      subject: 'Signed NDA — Kcell Enterprise Solutions',
      attachments: [
        { filename: 'kcell-nda-signed.pdf', content_type: 'application/pdf', size: 89120, url: 'https://storage.example.com/kcell-nda.pdf' },
      ],
    },
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'evt_003',
    org_id: 'org_123',
    source: 'email',
    raw_content: 'Hi,\n\nCould you please schedule a demo for our team? We are interested in the platform.\n\nThanks,\nDiana',
    metadata: {
      sender: 'diana@halykbank.kz',
      subject: 'Demo Request — Halyk Bank',
    },
    status: 'processing',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'evt_004',
    org_id: 'org_123',
    source: 'email',
    raw_content: 'Q1 2026 Financial Report is ready for your review. Please sign by end of day.',
    metadata: {
      sender: 'ir@vcfund.kz',
      subject: 'Q1 2026 Financial Report — Signature Required',
    },
    status: 'new',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
]

export const MOCK_TASKS: Task[] = [
  {
    id: 'task_001',
    org_id: 'org_123',
    event_id: 'evt_001',
    title: 'Review attached contract',
    description: 'Review the contract document before the meeting and prepare initial comments.',
    status: 'in_progress',
    assignee_id: 'u1',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'task_002',
    org_id: 'org_123',
    event_id: 'evt_003',
    title: 'Prepare demo for Halyk Bank',
    description: 'Prepare materials for the demo presentation.',
    status: 'new',
    assignee_id: 'u1',
    due_date: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'task_003',
    org_id: 'org_123',
    event_id: 'evt_001',
    title: 'Send meeting invite to partner',
    status: 'done',
    assignee_id: 'u3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'task_004',
    org_id: 'org_123',
    event_id: 'evt_002',
    title: 'File signed NDA in document storage',
    status: 'new',
    due_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

export const MOCK_ANALYSES: AIAnalysis[] = [
  {
    id: 'analysis_001',
    event_id: 'evt_001',
    org_id: 'org_123',
    intent: 'meeting_and_document_review',
    confidence: 0.94,
    actions: [
      { type: 'schedule_meeting', data: { title: 'Contract Review Meeting', datetime: '2026-06-15T17:00:00Z' } },
      { type: 'create_task', data: { title: 'Review attached contract', assignee_role: 'manager' } },
      { type: 'analyze_document', data: { file_name: 'contract.pdf' } },
      { type: 'send_email_draft', data: { tone: 'formal' } },
    ],
    raw_response: {},
    created_at: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
  },
  {
    id: 'analysis_002',
    event_id: 'evt_003',
    org_id: 'org_123',
    intent: 'demo_request',
    confidence: 0.97,
    actions: [
      { type: 'schedule_meeting', data: { title: 'Halyk Bank Demo', datetime: '2026-06-18T11:00:00Z' } },
      { type: 'create_task', data: { title: 'Prepare demo for Halyk Bank', assignee_role: 'manager' } },
      { type: 'send_email_draft', data: { tone: 'friendly' } },
    ],
    raw_response: {},
    created_at: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
  },
]

export const MOCK_ACTION_LOGS: ActionLog[] = [
  {
    id: 'log_001',
    org_id: 'org_123',
    event_id: 'evt_001',
    action_type: 'schedule_meeting',
    payload: { title: 'Contract Review Meeting', datetime: '2026-06-15T17:00:00Z' },
    status: 'success',
    created_at: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
  },
  {
    id: 'log_002',
    org_id: 'org_123',
    event_id: 'evt_001',
    action_type: 'create_task',
    payload: { title: 'Review attached contract', assignee_role: 'manager' },
    status: 'success',
    created_at: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
  },
  {
    id: 'log_003',
    org_id: 'org_123',
    event_id: 'evt_001',
    action_type: 'analyze_document',
    payload: { file_name: 'contract.pdf' },
    status: 'success',
    created_at: new Date(Date.now() - 1000 * 60 * 117).toISOString(),
  },
  {
    id: 'log_004',
    org_id: 'org_123',
    event_id: 'evt_001',
    action_type: 'send_email_draft',
    payload: { tone: 'formal' },
    status: 'success',
    created_at: new Date(Date.now() - 1000 * 60 * 117).toISOString(),
  },
  {
    id: 'log_005',
    org_id: 'org_123',
    event_id: 'evt_003',
    action_type: 'schedule_meeting',
    payload: { title: 'Halyk Bank Demo', datetime: '2026-06-18T11:00:00Z' },
    status: 'success',
    created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
  {
    id: 'log_006',
    org_id: 'org_123',
    event_id: 'evt_003',
    action_type: 'create_task',
    payload: { title: 'Prepare demo for Halyk Bank', assignee_role: 'manager' },
    status: 'success',
    created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
  {
    id: 'log_007',
    org_id: 'org_123',
    event_id: 'evt_003',
    action_type: 'send_email_draft',
    payload: { tone: 'friendly' },
    status: 'failed',
    error_message: 'LLM rate limit exceeded, retrying...',
    created_at: new Date(Date.now() - 1000 * 60 * 27).toISOString(),
  },
]

export const MOCK_DOCUMENTS: DocumentAnalysis[] = [
  {
    id: 'doc_001',
    org_id: 'org_123',
    event_id: 'evt_001',
    file_name: 'contract.pdf',
    summary: 'Contract between Astana IT University and vendor for IT services. 12-month term with annual renewal.',
    risks: [
      'Termination clause favors vendor — 90 day notice period',
      'No data protection addendum included',
    ],
    analyzed_at: new Date(Date.now() - 1000 * 60 * 117).toISOString(),
  },
]

export const MOCK_DRAFTS: Draft[] = [
  {
    id: 'draft_001',
    org_id: 'org_123',
    event_id: 'evt_001',
    recipient: 'partner@company.com',
    subject: 'Re: Contract Review Meeting',
    body: 'Hello,\n\nThank you for your email.\n\nThe meeting has been scheduled and the document is currently under review.\n\nBest regards,\nDilnaz Maratova\nMengu AI',
    status: 'pending_approval',
    created_at: new Date(Date.now() - 1000 * 60 * 117).toISOString(),
  },
  {
    id: 'draft_002',
    org_id: 'org_123',
    event_id: 'evt_003',
    recipient: 'diana@halykbank.kz',
    subject: 'Re: Demo Request',
    body: 'Hi Diana,\n\nThank you for reaching out. We would be happy to schedule a demo for your team.\n\nI have created a calendar invite for a demo next week.\n\nBest regards,\nDilnaz Maratova\nMengu AI',
    status: 'pending_approval',
    created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
]

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    event_id: 'evt_001',
    title: 'Contract Review Meeting',
    datetime: '2026-06-15T17:00:00Z',
    google_event_id: 'google_cal_evt_001',
    status: 'created',
    created_at: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
  },
  {
    event_id: 'evt_003',
    title: 'Halyk Bank Demo',
    datetime: '2026-06-18T11:00:00Z',
    google_event_id: 'google_cal_evt_002',
    status: 'created',
    created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
]

export const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: 'i1',
    org_id: 'org_123',
    type: 'contract_signing_ignore',
    title: 'Contract awaiting signature for 8 days',
    description: 'The Halyk Bank contract ($80K/yr) has not been signed. Risk of losing the deal if delayed >14 days.',
    severity: 'critical',
    related_entity_id: 'd1',
    related_entity_type: 'document',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i2',
    org_id: 'org_123',
    type: 'team_workload_imbalance',
    title: 'Amir Kurmanbekov overloaded',
    description: '11 active tasks assigned, team average is 4. Recommend redistributing workload.',
    severity: 'warning',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i3',
    org_id: 'org_123',
    type: 'revenue_opportunity',
    title: 'Revenue Opportunity — Kcell',
    description: '3 emails from corp@kcell.kz in 7 days. Strong buying signals detected. Recommend initiating negotiations.',
    severity: 'info',
    related_entity_id: 'evt_002',
    related_entity_type: 'event',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'i4',
    org_id: 'org_123',
    type: 'sla_violation',
    title: 'SLA Breach — HR Department',
    description: '2 HR tasks overdue by >24 hours with no status update. Automatically escalated.',
    severity: 'warning',
    is_resolved: false,
    created_at: new Date().toISOString(),
  },
]
