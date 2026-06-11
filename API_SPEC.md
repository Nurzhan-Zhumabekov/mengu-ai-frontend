# API_SPEC.md

## Overview

All API routes are prefixed with `/api/v1`. Authentication is via JWT Bearer token in the `Authorization` header. Responses are JSON. Dates are ISO 8601 / RFC 3339.

---

## Authentication

### POST /api/v1/auth/login

Authenticate user via email and password.

**Request:**
```
Content-Type: application/json

{
  "email": "admin@org.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Response (401):**
```json
{
  "error": "invalid_credentials"
}
```

---

### POST /api/v1/auth/refresh

Refresh an expired access token.

**Request:**
```
Content-Type: application/json

{
  "refresh_token": "eyJhbGci..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### POST /api/v1/auth/oauth/google

Authenticate or register via Google OAuth2.

**Request:**
```
Content-Type: application/json

{
  "code": "google_oauth_authorization_code"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### POST /api/v1/auth/oauth/microsoft

Authenticate or register via Microsoft OAuth2.

**Request:**
```
Content-Type: application/json

{
  "code": "microsoft_oauth_authorization_code"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Webhooks

### POST /webhooks/email

Ingest incoming email from an external email service (e.g. SendGrid, Mailgun, Postal).

**Authentication:** API key via `X-Webhook-Secret` header.

**Request:**
```
Content-Type: application/json

{
  "from": "partner@company.com",
  "subject": "Contract Review Meeting",
  "body": "We need to schedule a meeting next Monday at 17:00 to discuss the attached contract.",
  "attachments": [
    {
      "filename": "contract.pdf",
      "content_type": "application/pdf",
      "size": 123456,
      "url": "https://storage.example.com/contract.pdf"
    }
  ]
}
```

**Response (201):**
```json
{
  "event_id": "evt_001",
  "status": "new"
}
```

**Response (400):**
```json
{
  "error": "invalid_payload"
}
```

**Idempotency:** Duplicate emails (based on Message-ID header) return the existing `event_id` with `status: "duplicate"`.

**Field mapping:** `from` → stored as `metadata.sender`. `subject` → stored as `metadata.subject`. `body` → stored as `raw_content`. `attachments` → stored as `metadata.attachments` (full object array with `filename`, `content_type`, `size`, `url`).

---

## Events

### GET /api/v1/events

List incoming events for the authenticated user's organization.

**Query parameters:** `status` (optional filter), `page`, `per_page` (default 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "evt_001",
      "source": "email",
      "subject": "Contract Review Meeting",
      "sender": "partner@company.com",
      "status": "completed",
      "created_at": "2026-06-10T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}
```

---

### GET /api/v1/events/:id

Get a single event with its associated analysis and action logs.

**Response (200):**
```json
{
  "event": {
    "id": "evt_001",
    "org_id": "org_123",
    "source": "email",
    "raw_content": "We need to schedule...",
    "metadata": {
      "sender": "partner@company.com",
      "subject": "Contract Review Meeting",
      "attachments": ["contract.pdf"]
    },
    "status": "completed",
    "created_at": "2026-06-10T12:00:00Z"
  },
  "analysis": {
    "id": "analysis_001",
    "intent": "meeting_and_document_review",
    "confidence": 0.94,
    "actions": [
      {"type": "schedule_meeting", "data": {...}},
      {"type": "create_task", "data": {...}},
      {"type": "analyze_document", "data": {...}},
      {"type": "send_email_draft", "data": {...}}
    ]
  },
  "action_logs": [
    {"action_type": "schedule_meeting", "status": "success"},
    {"action_type": "create_task", "status": "success"},
    {"action_type": "analyze_document", "status": "success"},
    {"action_type": "send_email_draft", "status": "success"}
  ]
}
```

**Response (404):**
```json
{
  "error": "event_not_found"
}
```

---

## AI Analysis

### GET /api/v1/events/:id/analysis

Get the AI analysis for a specific event.

**Response (200):**
```json
{
  "id": "analysis_001",
  "event_id": "evt_001",
  "intent": "meeting_and_document_review",
  "confidence": 0.94,
  "actions": [
    {
      "type": "schedule_meeting",
      "data": {
        "title": "Contract Review Meeting",
        "datetime": "2026-06-15T17:00:00Z"
      }
    },
    {
      "type": "create_task",
      "data": {
        "title": "Review attached contract",
        "assignee_role": "manager"
      }
    },
    {
      "type": "analyze_document",
      "data": {
        "file_name": "contract.pdf"
      }
    },
    {
      "type": "send_email_draft",
      "data": {
        "tone": "formal"
      }
    }
  ],
  "created_at": "2026-06-10T12:01:00Z"
}
```

**Response (404):**
```json
{
  "error": "analysis_not_found"
}
```

---

### POST /api/v1/events/:id/reanalyze

Force re-analysis of an event by sending it to the LLM again.

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "analysis_id": "analysis_002",
  "status": "processing"
}
```

---

## Tasks

### GET /api/v1/tasks

List tasks for the organization.

**Query parameters:** `status` (optional), `page`, `per_page` (default 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "task_001",
      "event_id": "evt_001",
      "org_id": "org_123",
      "title": "Review attached contract",
      "description": "",
      "status": "new",
      "assignee_id": null,
      "due_date": null,
      "created_at": "2026-06-10T12:02:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}
```

---

### GET /api/v1/tasks/:id

Get a single task.

**Response (200):**
```json
{
  "id": "task_001",
  "org_id": "org_123",
  "event_id": "evt_001",
  "title": "Review attached contract",
  "description": "",
  "status": "new",
  "assignee_id": null,
  "due_date": null,
  "created_at": "2026-06-10T12:02:00Z"
}
```

**Response (404):**
```json
{
  "error": "task_not_found"
}
```

---

### PATCH /api/v1/tasks/:id

Update a task (status, assignee, due date).

**Request:**
```json
{
  "status": "in_progress",
  "assignee_id": "user_001"
}
```

**Response (200):**
```json
{
  "id": "task_001",
  "status": "in_progress",
  "assignee_id": "user_001"
}
```

---

## Action Logs

### GET /api/v1/events/:id/logs

Get action execution logs for an event.

**Query parameters:** `page`, `per_page` (default 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "log_001",
      "action_type": "schedule_meeting",
      "payload": {
        "title": "Contract Review Meeting",
        "datetime": "2026-06-15T17:00:00Z"
      },
      "status": "success",
      "error_message": null,
      "created_at": "2026-06-10T12:02:00Z"
    },
    {
      "id": "log_002",
      "action_type": "create_task",
      "payload": {
        "title": "Review attached contract",
        "assignee_role": "manager"
      },
      "status": "success",
      "error_message": null,
      "created_at": "2026-06-10T12:02:01Z"
    }
  ]
}
```

---

## Documents

### GET /api/v1/events/:id/documents

List document analyses for an event.

**Query parameters:** `page`, `per_page` (default 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "doc_analysis_001",
      "file_name": "contract.pdf",
      "summary": "Contract between university and vendor for IT services.",
      "risks": [
        "Termination clause favors vendor"
      ],
      "analyzed_at": "2026-06-10T12:03:00Z"
    }
  ]
}
```

---

## Drafts

### GET /api/v1/events/:id/drafts

List email drafts generated for an event.

**Query parameters:** `status` (optional filter), `page`, `per_page` (default 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "draft_001",
      "recipient": "partner@company.com",
      "subject": "Re: Contract Review Meeting",
      "body": "Hello,\n\nThank you for your email.\n\nThe meeting has been scheduled and the document is currently under review.\n\nBest regards",
      "status": "pending_approval",
      "created_at": "2026-06-10T12:04:00Z"
    }
  ]
}
```

---

### GET /api/v1/drafts/:id

Get a single draft by ID.

**Response (200):**
```json
{
  "id": "draft_001",
  "org_id": "org_123",
  "event_id": "evt_001",
  "recipient": "partner@company.com",
  "subject": "Re: Contract Review Meeting",
  "body": "Hello,\n\nThank you for your email.\n\nThe meeting has been scheduled and the document is currently under review.\n\nBest regards",
  "status": "pending_approval",
  "created_at": "2026-06-10T12:04:00Z"
}
```

**Response (404):**
```json
{
  "error": "draft_not_found"
}
```

---

### PATCH /api/v1/drafts/:id/approve

Approve a draft for sending. This is a manual human step. The system does NOT send automatically.

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "id": "draft_001",
  "status": "approved"
}
```

---

### PATCH /api/v1/drafts/:id

Edit a draft before approval. All fields are optional; only provided fields are updated.

**Request:**
```json
{
  "recipient": "partner@company.com",
  "subject": "Re: Contract Review Meeting",
  "body": "Hello,\n\nThank you for your email.\n\nThe meeting has been scheduled.\n\nBest regards"
}
```

**Response (200):**
```json
{
  "id": "draft_001",
  "recipient": "partner@company.com",
  "subject": "Re: Contract Review Meeting",
  "body": "Hello,\n\nThank you for your email.\n\nThe meeting has been scheduled.\n\nBest regards",
  "status": "pending_approval",
  "created_at": "2026-06-10T12:04:00Z"
}
```

---

## Calendar Events

### GET /api/v1/events/:id/calendar-events

List calendar events created from an event.

Calendar events are stored externally in Google Calendar. This endpoint returns metadata from the action log payload. There is no local database table for calendar events.

**Response (200):**
```json
{
  "data": [
    {
      "title": "Contract Review Meeting",
      "datetime": "2026-06-15T17:00:00Z",
      "google_event_id": "google_cal_event_001",
      "status": "created",
      "created_at": "2026-06-10T12:02:00Z"
    }
  ]
}
```

---

## Organizations

### GET /api/v1/organization

Get the authenticated user's organization details.

**Response (200):**
```json
{
  "id": "org_123",
  "name": "Astana IT University",
  "slug": "astana-it-university",
  "plan": "pro",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### PATCH /api/v1/organization

Update organization settings.

**Request:**
```json
{
  "name": "Astana IT University",
  "plan": "enterprise"
}
```

**Response (200):**
```json
{
  "id": "org_123",
  "name": "Astana IT University",
  "plan": "enterprise"
}
```
