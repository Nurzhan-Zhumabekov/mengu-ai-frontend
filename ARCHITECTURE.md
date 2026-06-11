# ARCHITECTURE.md

## System Architecture Overview

Mengu AI is a modular monolithic backend written in Go using the Gin framework with PostgreSQL as its sole data store. The system follows a deterministic execution model: the LLM acts exclusively as a planner that produces structured JSON, and the backend executes actions through predefined handlers.

---

## Core Principle: Separation of Responsibility

```
┌─────────────────────────────────────────────────────────────┐
│                     LLM (Planner Only)                       │
│                                                             │
│  Input:  Email body text                                     │
│  Output: Structured JSON action plan                         │
│  Rule:   Never executes actions, never calls APIs            │
└───────────────────────────┬─────────────────────────────────┘
                            │ JSON only
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Executor Only)                      │
│                                                             │
│  Receives: Structured JSON from LLM                          │
│  Executes: Predefined action handlers                        │
│  Rule:    Never interprets free text, never makes decisions  │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Tree

```
/internal
├── /auth          — JWT + OAuth2 authentication
├── /organization  — Organization CRUD
├── /email         — Email processing pipeline
├── /webhooks      — Webhook ingestion
├── /ai            — LLM client integration
├── /tasks         — Task management
├── /calendar      — Google Calendar integration
├── /documents     — Document analysis management
├── /drafts        — Email draft management (CRUD + approve)
├── /actions       — Action engine + handlers (Meeting, Task, Document, EmailDraft)
├── /db            — Database connection + migrations
├── /middleware    — Auth middleware, rate limiting
├── /config        — Configuration loading
└── /utils         — Shared utilities
```

Each module contains `service/`, `repository/`, `handler/`, and `model/` subdirectories.

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
┌──────────────┐
│   Gin Router │─── Middleware stack (auth, logging, recovery)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Handler    │─── Validates input, calls service
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │─── Business logic
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │─── Database operations
└──────┬───────┘
       │
       ▼
   PostgreSQL
```

---

## Core Interfaces

### AIClient

```go
type AIClient interface {
    AnalyzeEmail(ctx context.Context, input string) (*AIResult, error)
    AnalyzeDocument(ctx context.Context, content string) (*DocumentAnalysisResult, error)
    GenerateDraft(ctx context.Context, prompt string) (string, error)
}
```

Responsible for all LLM interactions:
- `AnalyzeEmail` — sends email body to LLM, parses structured JSON action plan (the only AI entry point for the main pipeline)
- `AnalyzeDocument` — sends extracted document text to LLM, returns summary and risks (used by DocumentHandler)
- `GenerateDraft` — sends context/prompt to LLM, returns a plain-text email draft (used by EmailDraftHandler)

### ActionEngine

```go
type ActionEngine interface {
    Execute(ctx context.Context, analysis AIAnalysis) error
}
```

Iterates over the `actions` array from `ai_analysis` and dispatches each action to the appropriate handler. Execution is sequential and ordered.

### ActionHandler

```go
type ActionHandler interface {
    Handle(ctx context.Context, action Action) error
}
```

Implemented by:
- `MeetingHandler` — calls Google Calendar API to create calendar events. Payload includes `title`, `datetime`, `participants`.
- `TaskHandler` — inserts a row into the `tasks` table. Payload includes `title`, `assignee_role`.
- `DocumentHandler` — loads the attachment file, extracts text, calls `AIClient.AnalyzeDocument()` to get summary and risks, stores result in `document_analysis` table.
- `EmailDraftHandler` — calls `AIClient.GenerateDraft()` with the email context and desired tone, stores the returned draft in the `drafts` table with `status = 'pending_approval'`. Does NOT send the email.

### Repository

```go
type Repository interface {
    Create(ctx context.Context, entity interface{}) error
    GetByID(ctx context.Context, id string) (interface{}, error)
    Update(ctx context.Context, entity interface{}) error
}
```

Standard CRUD interface implemented per entity.

---

## Async Processing: The Email Worker

```
POST /webhooks/email
       │
       ▼
  IncomingEvent stored (status=new)
       │
       ▼
  Worker goroutine picks up event
       │
       ▼
  Calls AIClient.AnalyzeEmail()
       │
       ▼
  Stores AIAnalysis in ai_analysis
       │
       ▼
   ActionEngine.Execute()
       │
       ├── MeetingHandler    → Google Calendar API           → action_logs
       ├── TaskHandler       → tasks table                   → action_logs
       ├── DocumentHandler   → AIClient.AnalyzeDocument()
       │                        → document_analysis table    → action_logs
       └── EmailDraftHandler → AIClient.GenerateDraft()
                                → drafts table (NOT sent)    → action_logs
       │
       ▼
  incoming_events.status = "completed"
```

The worker runs in a goroutine with no external message broker. Event polling is done via database queries (`SELECT ... WHERE status = 'new' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED`).

---

## Database Connection

PostgreSQL is accessed via `pgx` driver (`jackc/pgx/v5`). Connection pooling is configured with environment variables. Migrations are applied at startup using `golang-migrate` or embedded SQL files.

---

## Configuration

All configuration is loaded from environment variables:

| Variable                | Description                    |
|-------------------------|--------------------------------|
| DATABASE_URL            | PostgreSQL connection string   |
| JWT_SECRET              | JWT signing secret             |
| JWT_ACCESS_TTL          | Access token TTL (default 1h)  |
| JWT_REFRESH_TTL         | Refresh token TTL (default 7d) |
| LLM_API_URL             | LLM provider endpoint          |
| LLM_API_KEY             | LLM API key                    |
| LLM_MODEL               | Model name (e.g. gpt-4)        |
| GOOGLE_CLIENT_ID        | Google OAuth client ID         |
| GOOGLE_CLIENT_SECRET    | Google OAuth client secret     |
| MICROSOFT_CLIENT_ID     | Microsoft OAuth client ID      |
| MICROSOFT_CLIENT_SECRET | Microsoft OAuth client secret  |
| GOOGLE_CALENDAR_CREDENTIALS | Google service account JSON |
| WEBHOOK_SECRET          | Secret for webhook validation  |
| PORT                    | HTTP server port (default 8080)|

---

## Idempotency

Webhook ingestion uses `Message-ID` header (or equivalent unique identifier) stored in `metadata` to detect duplicate emails. If a duplicate is detected, the existing `event_id` is returned with `status: "duplicate"` and no new event is created.

---

## Traceability

Every action execution produces an `action_logs` row. The chain is fully traceable:

```
Event → AI Analysis → Action Logs (one per action)
```

Each log entry stores the action type, input payload, execution status, and any error message.

---

## Golden Example Walkthrough

Mapped to the architecture:

```
1. POST /webhooks/email
   → webhooks/handler.go validates payload
   → email/service.go extracts sender, subject, body, attachments
   → incoming_events repository stores row (status=new)

2. Worker picks up event (status=new)
   → ai/service.go calls AIClient.AnalyzeEmail(ctx, raw_content)
   → LLM returns structured JSON with intent, confidence, actions[]

3. ai_analysis stored
   → actions/service.go stores analysis in ai_analysis table

4. ActionEngine.Execute()
   → actions/engine.go iterates actions sequentially (ordered)
   → dispatches each action by type:

   a) schedule_meeting
      → MeetingHandler.Handle()
      → calls Google Calendar API → event created
      → action_logs: type=schedule_meeting, status=success

   b) create_task
      → TaskHandler.Handle()
      → inserts row into tasks table
      → action_logs: type=create_task, status=success

   c) analyze_document
      → DocumentHandler.Handle()
      → loads contract.pdf, extracts text
      → calls AIClient.AnalyzeDocument(ctx, text)
      → stores summary + risks in document_analysis table
      → action_logs: type=analyze_document, status=success

   d) send_email_draft
      → EmailDraftHandler.Handle()
      → calls AIClient.GenerateDraft(ctx, prompt)
      → stores returned draft in drafts table (status=pending_approval)
      → action_logs: type=send_email_draft, status=success

5. incoming_events.status updated to "completed"

6. Human reviews draft via PATCH /api/v1/drafts/:id/approve
```
