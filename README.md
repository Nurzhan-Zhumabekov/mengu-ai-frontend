# Mengu AI — Frontend

> AI Execution Layer for Enterprise Operations  
> Stack: React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (uses mock data, no backend required)
npm run dev
# → http://localhost:3000

# 3. Test login
# Email: any  Password: any (mock mode accepts everything)
```

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx        # Wrapper: Sidebar + <Outlet>
│   │   ├── Sidebar.tsx          # Sidebar navigation + Topbar
│   │   └── ProtectedRoute.tsx   # Auth guard
│   ├── pages/
│   │   ├── LoginPage.tsx        # Sign in (email + OAuth)
│   │   ├── DashboardPage.tsx    # Main dashboard with metrics
│   │   ├── InboxPage.tsx        # Inbox with AI analysis + action logs + drafts
│   │   ├── TasksPage.tsx        # Kanban task board
│   │   ├── DocumentsPage.tsx    # Document analysis grid
│   │   ├── CalendarPage.tsx     # Calendar and events
│   │   ├── InsightsPage.tsx     # AI insights and risks
│   │   ├── AnalyticsPage.tsx    # Analytics and KPIs
│   │   └── SettingsPage.tsx     # Profile, integrations, security, billing
│   └── ui/
│       └── index.tsx            # Badge, Avatar, Card, Spinner, EmptyState, PriorityDot
├── hooks/
│   └── useWebSocket.ts          # Real-time WebSocket updates
├── services/
│   └── api.ts                   # Axios + all API services matching API_SPEC.md
├── store/
│   └── index.ts                 # Zustand: useAuthStore, useUIStore
├── types/
│   └── index.ts                 # All TypeScript types aligned with API_SPEC.md
└── utils/
    ├── helpers.ts               # Formatting, class merging, utilities
    └── mockData.ts              # Mock data matching real backend structures
```

---

## Backend Alignment

The frontend is fully aligned with the backend API specification:

| File | Maps to |
|------|---------|
| `types/index.ts` | API_SPEC.md data models |
| `services/api.ts` | All endpoints from API_SPEC.md |
| `utils/mockData.ts` | Backend data structures |

### API Endpoints Covered

| Method | Path | Service |
|--------|------|---------|
| POST | `/auth/login` | `authService.login` |
| POST | `/auth/refresh` | `authService.refresh` |
| POST | `/auth/oauth/google` | `authService.loginWithGoogle` |
| POST | `/auth/oauth/microsoft` | `authService.loginWithMicrosoft` |
| GET | `/events` | `eventsService.getAll` |
| GET | `/events/:id` | `eventsService.getById` |
| GET | `/events/:id/analysis` | `eventsService.getAnalysis` |
| POST | `/events/:id/reanalyze` | `eventsService.reanalyze` |
| GET | `/events/:id/logs` | `eventsService.getLogs` |
| GET | `/events/:id/documents` | `eventsService.getDocuments` |
| GET | `/events/:id/drafts` | `eventsService.getDrafts` |
| GET | `/events/:id/calendar-events` | `eventsService.getCalendarEvents` |
| GET | `/tasks` | `tasksService.getAll` |
| GET | `/tasks/:id` | `tasksService.getById` |
| PATCH | `/tasks/:id` | `tasksService.update` |
| GET | `/drafts/:id` | `draftsService.getById` |
| PATCH | `/drafts/:id/approve` | `draftsService.approve` |
| PATCH | `/drafts/:id` | `draftsService.update` |
| GET | `/organization` | `organizationService.get` |
| PATCH | `/organization` | `organizationService.update` |

---

## Switching to Real Backend

In `src/services/api.ts`:

```ts
// Change to false when backend is ready:
const USE_MOCK = false
```

All services will then make real requests to `/api/v1/*`.  
Proxy is configured in `vite.config.ts` → `http://localhost:4000`.

---

## Environment Variables

Create `.env.local` in the root:

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

---

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `magenta-500` | `#E91E8C` | Primary buttons, accents |
| `navy-800` | `#1A1A2E` | Sidebar, dark backgrounds |
| `navy-700` | `#252544` | Sidebar hover states |

---

## Next Steps (Phase 1 → Production)

- [ ] Connect real backend (`USE_MOCK = false`)
- [ ] Add Recharts charts on Analytics page
- [ ] Implement WebSocket server (NestJS Gateway)
- [ ] Add new task creation modal
- [ ] Document upload with progress bar
- [ ] Workflow Builder (Phase 2)
- [ ] Mobile adaptation (Phase 6)
