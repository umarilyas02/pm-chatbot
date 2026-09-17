<div align="center">

# ⚡ CreateX

**AI-powered project management with real-time team chat and live video meetings — in one dark, glassmorphic workspace.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-149eca?logo=react)](https://react.dev)
[![Gemini](https://img.shields.io/badge/AI-Gemini%203.1-8e75ff?logo=googlegemini)](https://ai.google.dev)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%20(Supabase)-336791?logo=postgresql)](https://supabase.com)
[![WebRTC](https://img.shields.io/badge/Video-WebRTC%20(PeerJS)-22c55e?logo=webrtc)](https://peerjs.com)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

CreateX is a full-stack SaaS project management platform with an integrated AI assistant powered by Google Gemini. It combines a Kanban task board, multi-user workspaces, a context-aware AI chat interface, and — newest addition — **real-time team messaging with reactions, typing indicators, read receipts, and mesh WebRTC video/audio meetings**, all synced live over SSE with no page refresh required.

> **What's new:** a full team chat layer shipped alongside the AI assistant — direct and per-project rooms, live messages, emoji reactions, and in-room video/audio calls. See [Real-Time Team Chat & Meetings](#real-time-team-chat--meetings) below.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication & Sessions](#authentication--sessions)
- [AI Chat System](#ai-chat-system)
- [Real-Time Team Chat & Meetings](#real-time-team-chat--meetings)
- [Kanban Board & Real-Time Sync](#kanban-board--real-time-sync)
- [Workspace & Team Management](#workspace--team-management)
- [Notifications & Cron Jobs](#notifications--cron-jobs)
- [Email System](#email-system)
- [Design System](#design-system)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)

---

## Features

- **AI Chat Assistant** — Conversational PM assistant using Gemini with full awareness of your projects, tasks, and persistent memory across sessions
- **Real-Time Team Chat** — Direct and auto-created per-project rooms with live messages, edit/delete, emoji reactions, typing indicators, and read receipts — all pushed over SSE
- **Live Video & Audio Meetings** — Start a mesh WebRTC call from any chat room (PeerJS + STUN), with a persistent meeting banner while it's active
- **Push Notification Subscriptions** — Browsers can subscribe for chat push notifications via the standard Web Push API
- **Kanban Board** — Drag-and-drop task board with six status columns, priority levels, assignees, and due dates; updates sync live via Server-Sent Events
- **Dashboard** — KPI stats, bar/pie charts for task distribution by status and priority, AI-generated insights panel, and overdue task list
- **Multi-User Workspaces** — Invite teammates by email, manage roles (owner/member), and share projects within a workspace
- **Full Auth Flow** — Register, email verification, login, forgot password, reset password, and workspace invite acceptance
- **Notification Center** — In-app notifications for task assignments, overdue tasks, and workspace invites with an unread badge in the header
- **Settings** — Update display name, avatar URL, and change password

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, React Server Components) |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova dark theme) |
| Icons | Lucide React |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Database | PostgreSQL via Supabase |
| DB Client | node-postgres (`pg`) — raw SQL, no ORM |
| Auth | JWT cookies via `jose`, bcrypt password hashing |
| AI | Google Generative AI SDK (Gemini 3.1 Flash Lite) |
| Real-Time Chat | Server-Sent Events (`/api/realtime/chat`) |
| Video/Audio Meetings | WebRTC mesh via PeerJS (public cloud signaling + Google STUN) |
| Push Notifications | Web Push API (subscription storage; delivery not yet wired) |
| Email | Nodemailer (Gmail SMTP) |
| Toasts | Sonner |
| Validation | Zod |
| Deployment | Vercel (with cron job support) |

---

## Architecture Overview

```
Browser
  │
  ├── App Router pages (src/app/)
  │     ├── (auth)/          ← login, register, password reset, invite acceptance
  │     └── (app)/           ← protected pages: dashboard, chat, board, projects, team, settings
  │
  ├── Server Actions (src/app/actions/)
  │     ├── auth.js          ← register, login, logout, email verify, password reset
  │     ├── workspace.js     ← invite member, accept invite
  │     └── settings.js      ← update profile, change password
  │
  ├── API Routes (src/app/api/)
  │     ├── ai/              ← chat (SSE stream), conversations, context, insights
  │     ├── tasks/           ← CRUD
  │     ├── projects/        ← CRUD
  │     ├── workspace/       ← get workspace, list members
  │     ├── chat/rooms/      ← rooms, messages, reactions, read receipts, typing, meetings
  │     ├── chat/push/       ← push subscription store/unsubscribe
  │     ├── realtime/board   ← SSE stream for live board updates
  │     ├── realtime/chat    ← SSE stream for live room messages/reactions/typing
  │     ├── notifications/   ← fetch, mark-read, delete
  │     ├── cron/overdue     ← daily job: flag overdue tasks, send notifications
  │     └── health/          ← keep-warm ping
  │
  └── Shared Libraries (src/lib/)
        ├── db.js            ← all PostgreSQL queries (735 lines)
        ├── session.js       ← JWT read/write helpers
        ├── gemini.js        ← Gemini SDK wrapper + streaming
        ├── email.js         ← Nodemailer HTML templates
        ├── supabase.js      ← Supabase browser client
        └── ratelimit.js     ← in-memory rate limiter (IP-based)
```

The app uses **two database clients** in parallel: the `pg` library for server-side direct SQL (all mutations, queries, cron jobs) and the Supabase JS client where Supabase-specific features are needed. There is no ORM — all queries are handwritten SQL in `src/lib/db.js`.

---

## Project Structure

```
pm-chat/
├── src/
│   ├── app/
│   │   ├── layout.js               # Root layout: fonts (Fira Code + Fira Sans), dark theme, Sonner
│   │   ├── page.js                 # Root redirect: /dashboard or /login
│   │   ├── globals.css             # Tailwind directives + CSS custom properties
│   │   ├── (app)/                  # Authenticated route group
│   │   │   ├── layout.js           # AppShell wrapper (requires valid session)
│   │   │   ├── dashboard/          # Stats, charts, AI insights, overdue list
│   │   │   ├── chat/               # AI conversation interface
│   │   │   ├── messages/           # Real-time team chat (rooms, reactions, meetings)
│   │   │   ├── board/              # Global Kanban board (all projects)
│   │   │   ├── projects/
│   │   │   │   └── [id]/board/     # Per-project Kanban board
│   │   │   ├── team/               # Workspace members + invite management
│   │   │   ├── settings/           # Profile + password forms
│   │   │   └── notifications/      # Notification center
│   │   ├── (auth)/                 # Unauthenticated route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/     # ?token=...
│   │   │   ├── verify-email/       # ?token=...
│   │   │   └── accept-invite/      # ?token=...
│   │   ├── actions/                # Next.js Server Actions
│   │   │   ├── auth.js
│   │   │   ├── workspace.js
│   │   │   └── settings.js
│   │   └── api/                    # Route handlers
│   │       ├── ai/
│   │       ├── tasks/
│   │       ├── projects/
│   │       ├── workspace/
│   │       ├── chat/                # rooms, messages, reactions, typing, read, meetings, push
│   │       ├── realtime/             # board + chat SSE streams
│   │       ├── notifications/
│   │       ├── cron/
│   │       └── health/
│   ├── components/
│   │   ├── layout/                 # AppShell, Sidebar, Header, NotificationBell
│   │   ├── auth/                   # LoginForm, RegisterForm, ForgotPasswordForm, etc.
│   │   ├── board/                  # KanbanBoard, KanbanColumn, TaskCard, TaskModal
│   │   ├── chat/                   # ChatWindow, ChatInput, MessageBubble, ConversationSidebar (AI chat)
│   │   ├── messages/                # RoomList, RoomItem, ChatArea, MessageBubble, ChatInput,
│   │   │                            #   Reactions, ReactionPicker, TypingIndicator, RoomHeader,
│   │   │                            #   MeetingBanner, NewChatModal, MessagesClient (team chat)
│   │   ├── dashboard/              # StatsGrid, TaskDistributionChart, PriorityChart, AiInsightsPanel, OverdueList
│   │   ├── projects/               # ProjectsClient, ProjectModal
│   │   ├── team/                   # TeamClient, AcceptInviteForm
│   │   ├── settings/               # ProfileForm, PasswordForm
│   │   ├── notifications/          # NotificationsClient
│   │   └── ui/                     # shadcn/ui base components
│   ├── hooks/
│   │   ├── useChat.js               # Room messages: fetch, send, edit, delete, SSE subscribe
│   │   └── useMeeting.js            # PeerJS mesh call: local/remote streams, join/leave
│   └── lib/
│       ├── db.js
│       ├── session.js
│       ├── gemini.js
│       ├── email.js
│       ├── supabase.js
│       └── ratelimit.js
├── design-system/createx/MASTER.md  # Design tokens, component specs, anti-patterns
├── scripts/                         # One-off utility scripts
├── vercel.json                       # Cron job definition
├── next.config.mjs
├── components.json                   # shadcn/ui config
├── jsconfig.json                     # Path alias: @/* → src/*
└── .env.local                        # Secrets (not committed)
```

---

## Database Schema

All tables live in a Supabase-hosted PostgreSQL instance. Queries are in [src/lib/db.js](src/lib/db.js).

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | TEXT | |
| email | TEXT | unique |
| password_hash | TEXT | bcrypt |
| email_verified | BOOLEAN | default false |
| avatar_url | TEXT | |
| verification_token | TEXT | |
| verification_expires | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### `workspaces`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| owner_id | UUID (FK → users) | |
| name | TEXT | |
| created_at | TIMESTAMPTZ | |

### `workspace_members`
| Column | Type | Notes |
|---|---|---|
| workspace_id | UUID (FK) | |
| user_id | UUID (FK) | |
| role | TEXT | `owner` or `member` |
| joined_at | TIMESTAMPTZ | |

### `workspace_invites`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| workspace_id | UUID (FK) | |
| email | TEXT | invitee email |
| token | TEXT | unique, random |
| invited_by | UUID (FK → users) | |
| expires_at | TIMESTAMPTZ | 7-day window |
| accepted_at | TIMESTAMPTZ | null until accepted |

### `projects`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| owner_id | UUID (FK → users) | |
| name | TEXT | |
| description | TEXT | |
| status | TEXT | |
| created_at | TIMESTAMPTZ | |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| creator_id | UUID (FK → users) | |
| assignee_id | UUID (FK → users) | nullable |
| project_id | UUID (FK → projects) | |
| title | TEXT | |
| description | TEXT | |
| status | TEXT | `backlog` / `todo` / `in_progress` / `review` / `blocked` / `completed` |
| priority | TEXT | `critical` / `high` / `medium` / `low` |
| due_date | DATE | nullable |
| position | INTEGER | drag-drop sort order within a column |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `conversations`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| title | TEXT | auto-derived from first message |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| conversation_id | UUID (FK) | |
| role | TEXT | `user` or `assistant` |
| content | TEXT | |
| created_at | TIMESTAMPTZ | |

### `user_context`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID (PK, FK → users) | |
| items | JSONB | array of extracted facts (max 40) |
| updated_at | TIMESTAMPTZ | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| type | TEXT | `task_assigned` / `overdue` / `workspace_invite` |
| title | TEXT | |
| body | TEXT | |
| href | TEXT | deep-link URL |
| read | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | |

### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| token | TEXT | unique, random |
| expires_at | TIMESTAMPTZ | 1-hour window |
| used | BOOLEAN | default false |

### `chat_rooms`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| type | TEXT | `direct` or `project` |
| project_id | UUID (FK → projects) | nullable; one room per project (unique) |
| created_at | TIMESTAMPTZ | |

### `chat_room_members`
| Column | Type | Notes |
|---|---|---|
| room_id | UUID (FK, PK part) | |
| user_id | UUID (FK, PK part) | |
| joined_at | TIMESTAMPTZ | |
| last_read_at | TIMESTAMPTZ | drives unread state / read receipts |
| push_enabled | BOOLEAN | default true |

### `chat_messages`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| room_id | UUID (FK → chat_rooms) | |
| sender_id | UUID (FK → users) | |
| content | TEXT | |
| edited / edited_at | BOOLEAN / TIMESTAMPTZ | |
| deleted / deleted_at | BOOLEAN / TIMESTAMPTZ | soft delete |
| created_at | TIMESTAMPTZ | |

### `chat_reactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| message_id | UUID (FK → chat_messages) | |
| user_id | UUID (FK → users) | |
| emoji | TEXT | unique per `(message_id, user_id, emoji)` |
| created_at | TIMESTAMPTZ | |

### `chat_meetings`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| room_id | UUID (FK → chat_rooms) | |
| created_by | UUID (FK → users) | |
| type | TEXT | `video` or `audio` |
| status | TEXT | `active` or `ended` |
| started_at / ended_at | TIMESTAMPTZ | |

### `push_subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users) | |
| endpoint | TEXT | unique, from the browser's PushManager |
| p256dh / auth | TEXT | Web Push encryption keys |
| created_at | TIMESTAMPTZ | |

---

## Authentication & Sessions

Authentication is entirely custom — no NextAuth or Clerk.

**Flow:**

1. **Register** — Zod-validates name/email/password, rate-limits per IP (5 attempts/hour), hashes password with bcrypt, inserts user, sends verification email, creates default workspace.
2. **Verify Email** — User clicks link with token; server matches token + expiry, marks `email_verified = true`.
3. **Login** — Validates credentials, compares bcrypt hash, writes a signed JWT into an HttpOnly `session` cookie (7-day TTL, HS256).
4. **Session Check** — Every `(app)` page calls `getSession()` in its server component, which reads and verifies the JWT cookie. Unauthenticated requests redirect to `/login`.
5. **Logout** — Deletes the session cookie.
6. **Forgot Password** — Creates a `password_reset_tokens` row, sends a reset link valid for 1 hour.
7. **Reset Password** — Verifies token, updates `password_hash`, marks token as used.

Session implementation is in [src/lib/session.js](src/lib/session.js). The cookie is named `session`, is `HttpOnly` + `Secure` in production, and `SameSite=Lax`.

---

## AI Chat System

The chat system gives users a conversational interface to their PM data.

### How It Works

1. The user sends a message in `ChatWindow`. Optionally they filter context by selecting specific projects via `ProjectPicker`.
2. The client POSTs to `POST /api/ai/chat` with `{ conversationId, content, projectIds }`.
3. The server builds a **system prompt** that includes:
   - The user's name and current date
   - All their projects (name, description, status)
   - All tasks across those projects (title, status, priority, due date, assignee)
   - Up to 40 **context items** from `user_context` — facts the AI has previously extracted and saved about the user's preferences, team, and working style
4. The route calls the Gemini SDK and **streams** the response back as Server-Sent Events.
5. As the full response arrives, the route **saves both messages** (user + assistant) to the `messages` table.
6. The response is scanned for JSON action blocks. If the AI responds with a structured `create_task` or `list_tasks` action, the server executes it directly against the database.

### Persistent Memory (User Context)

The AI extracts reusable facts from conversations (e.g., "user prefers tasks assigned to Alice", "sprint ends every Friday") and stores them as items in `user_context.items` (JSONB). These are injected into every subsequent system prompt, giving the assistant memory across sessions. The context is capped at 40 items with FIFO eviction.

### AI Insights

`POST /api/ai/insights` sends a summary of the user's project + task data to Gemini and returns a short prose analysis displayed in the dashboard's `AiInsightsPanel`.

---

## Real-Time Team Chat & Meetings

This is a separate system from the AI Chat above — it's human-to-human team messaging, live at `/messages`. Note the routing is a little confusing by name: the **AI** assistant lives under `/api/ai/chat`, while **team chat** lives under `/api/chat/*`.

### Rooms

Two room types, both stored in `chat_rooms`:
- **Direct** — a 1:1 conversation between two workspace members, started via `NewChatModal`.
- **Project** — one room per project, auto-created the moment a project is created (`ed351b8`), so every project member lands in a shared thread automatically.

`RoomList` / `RoomItem` render the sidebar; `RoomHeader` shows the active room's title and meeting controls.

### Messaging

- `GET /api/chat/rooms/[id]/messages` — paginated message history
- `POST /api/chat/rooms/[id]/messages` — send a message
- `PUT` / `DELETE /api/chat/rooms/[id]/messages/[msgId]` — edit or soft-delete a message you sent
- `POST /api/chat/rooms/[id]/read` — mark the room read up to now (drives `chat_room_members.last_read_at` and unread badges)
- `POST /api/chat/rooms/[id]/typing` — broadcast a "typing…" event to the room

New messages, edits, deletes, reactions, and typing events are pushed to every open client via `GET /api/realtime/chat`, an SSE stream fed by `broadcastToRoom(...)` on the server. `useChat.js` is the client hook that subscribes to this stream and keeps `MessagesClient`'s state in sync — no polling.

### Reactions

`POST /api/chat/rooms/[id]/messages/[msgId]/reactions` toggles an emoji reaction for the current user; `DELETE .../reactions/[emoji]` removes it. Enforced unique per `(message_id, user_id, emoji)` at the DB level, rendered by `Reactions` + `ReactionPicker`.

### Video & Audio Meetings

Any room can start a call:

1. `POST /api/chat/rooms/[id]/meetings` creates a `chat_meetings` row (`type: 'video' | 'audio'`, `status: 'active'`) and everyone in the room sees a live `MeetingBanner` (via the SSE stream).
2. Joining calls `useMeeting(meeting, roomId, joined)`, which opens a [PeerJS](https://peerjs.com) peer (`chat-${userId}-${roomId}`) against PeerJS's public cloud signaling server, using Google's public STUN servers for NAT traversal.
3. Peers call each other directly — a **full WebRTC mesh**, no media server — exchanging local `getUserMedia` streams and collecting remote streams into a `Map` keyed by peer ID, so every participant renders every other participant's video/audio tile.
4. `PUT /api/chat/rooms/[id]/meetings/[meetingId]` ends the meeting (`status: 'ended'`, `ended_at` set).

Mesh calls need no dedicated media infrastructure, which keeps this deployable on Vercel like everything else — the tradeoff is that bandwidth scales with the *square* of participants, so it's built for small-group calls, not webinars.

### Push Notifications

`POST /api/chat/push/subscribe` stores a browser's `PushSubscription` (`endpoint`, `p256dh`, `auth`) in `push_subscriptions`; `POST /api/chat/push/unsubscribe` removes it. **Note:** this currently only persists subscriptions — there's no `web-push`/VAPID-backed sender wired up yet to actually deliver a push when a message arrives, so treat this as the storage half of the feature.

---

## Kanban Board & Real-Time Sync

### Board Structure

The board renders six columns in a fixed order: **Backlog → To Do → In Progress → Review → Blocked → Completed**.

Each column contains `TaskCard` components that are sortable via `@dnd-kit/sortable`. Cards display the task title, priority badge (color-coded), assignee avatar, and due date.

### Drag and Drop

Powered by `@dnd-kit/core`. When a card is dropped:
- If dropped into a different column, the task's `status` is updated via `PUT /api/tasks/[id]`.
- If reordered within the same column, the `position` values of affected tasks are recalculated and persisted.

### Real-Time Sync

`KanbanBoard` opens a persistent connection to `GET /api/realtime/board`, which returns a **Server-Sent Events** stream. When any task mutation occurs (create, update, delete), the server pushes an event to all connected clients watching the same board. The client receives the event and re-fetches or applies the delta to keep all users in sync without polling.

### Task Modal

Clicking a card opens `TaskModal`, which allows editing: title, description, status, priority, assignee (dropdown of workspace members), and due date.

---

## Workspace & Team Management

Each user gets one **default workspace** created at registration. Workspaces are the unit of collaboration — members share access to all projects within the workspace.

**Invite flow:**
1. Owner enters an email in the `TeamClient` invite form.
2. Server Action `inviteWorkspaceMember` creates a `workspace_invites` row and sends an email containing a link to `/accept-invite?token=...`.
3. The invitee opens the link, which renders `AcceptInviteForm` (works for both existing and new users).
4. Server Action `acceptWorkspaceInvite` validates the token, checks expiry, adds the user to `workspace_members`, and marks the invite as accepted.

Roles are currently `owner` and `member`. The owner can invite and remove members; members can view the team list.

---

## Notifications & Cron Jobs

### In-App Notifications

Notifications are created server-side whenever:
- A task is assigned to a user (`task_assigned`)
- A workspace invite is sent (`workspace_invite`)
- A task becomes overdue (`overdue`) — via the daily cron job

The `NotificationBell` in the header polls `GET /api/notifications` for the unread count and displays a badge. The full notification center at `/notifications` lists all notifications with mark-as-read and delete actions.

### Daily Overdue Check

`vercel.json` defines a cron job that calls `GET /api/cron/overdue` every day at **09:00 UTC**:

```json
{
  "crons": [{ "path": "/api/cron/overdue", "schedule": "0 9 * * *" }]
}
```

The handler:
1. Authenticates the request via the `CRON_SECRET` header.
2. Queries for all tasks where `due_date < today` and `status != 'completed'`.
3. For each newly overdue task, creates an `overdue` notification for the assignee and creator.

---

## Email System

All transactional emails are sent via **Nodemailer** (Gmail SMTP). HTML templates are defined in [src/lib/email.js](src/lib/email.js) and carry CreateX branding (dark background, green CTA buttons, Fira Code headings).

| Email | Trigger | Content |
|---|---|---|
| Email Verification | Registration | Link to `/verify-email?token=...` (24-hour window) |
| Password Reset | Forgot password | Link to `/reset-password?token=...` (1-hour window) |
| Workspace Invite | Owner invites member | Link to `/accept-invite?token=...` (7-day window) |
| Resend Verification | User requests resend | New token, same template |

---

## Design System

Defined in [design-system/createx/MASTER.md](design-system/createx/MASTER.md). The style is **glassmorphism** on a near-black background.

### Colors
| Token | Value | Usage |
|---|---|---|
| Background | `#020617` | Page background |
| Primary | `#0F172A` | Card/panel background |
| Secondary | `#1E293B` | Elevated surfaces |
| Accent / CTA | `#22C55E` | Buttons, active states, highlights |
| Text | `#F8FAFC` | Body text |

### Typography
- **Headings:** Fira Code (monospace — technical, distinct)
- **Body:** Fira Sans (clean, readable)

### Component Conventions
- Cards: `rounded-xl`, `shadow-md`, hover lift (`translateY(-2px)`) + `shadow-lg`
- Buttons (CTA): bg `#22C55E`, hover opacity `0.9` + subtle lift
- Inputs: 1px border, `rounded-lg`, focus ring in accent color
- All transitions: `150ms–300ms`
- No emoji icons — Lucide SVG only
- Minimum 4.5:1 contrast ratio everywhere
- Visible focus rings for keyboard navigation

---

## API Reference

### AI

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/chat` | Stream Gemini response (SSE). Body: `{ conversationId, content, projectIds? }` |
| GET | `/api/ai/conversations` | List user's conversations |
| POST | `/api/ai/conversations` | Create a new conversation |
| GET | `/api/ai/conversations/[id]` | Get conversation with messages |
| PUT | `/api/ai/conversations/[id]` | Rename conversation |
| DELETE | `/api/ai/conversations/[id]` | Delete conversation and its messages |
| GET | `/api/ai/context` | Get user's persistent context items |
| POST | `/api/ai/insights` | Generate AI dashboard insights |

### Tasks

| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (filter by `projectId`, `status`) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/[id]` | Get a single task |
| PUT | `/api/tasks/[id]` | Update task (any field) |
| DELETE | `/api/tasks/[id]` | Delete a task |

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects` | List projects for the current user |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/[id]` | Get a single project |
| PUT | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

### Workspace

| Method | Path | Description |
|---|---|---|
| GET | `/api/workspace` | Get current user's workspace |
| POST | `/api/workspace` | Create a workspace |
| GET | `/api/workspace/members` | List workspace members |

### Chat (Real-Time Team Messaging)

| Method | Path | Description |
|---|---|---|
| GET | `/api/chat/rooms` | List the current user's rooms |
| POST | `/api/chat/rooms` | Create/open a direct or project room |
| GET | `/api/chat/rooms/[id]` | Get room details + members |
| GET | `/api/chat/rooms/[id]/messages` | Paginated message history |
| POST | `/api/chat/rooms/[id]/messages` | Send a message |
| PUT | `/api/chat/rooms/[id]/messages/[msgId]` | Edit a message |
| DELETE | `/api/chat/rooms/[id]/messages/[msgId]` | Soft-delete a message |
| POST | `/api/chat/rooms/[id]/messages/[msgId]/reactions` | Toggle an emoji reaction |
| DELETE | `/api/chat/rooms/[id]/messages/[msgId]/reactions/[emoji]` | Remove a specific reaction |
| POST | `/api/chat/rooms/[id]/read` | Mark room read (updates read receipt) |
| POST | `/api/chat/rooms/[id]/typing` | Broadcast a typing indicator |
| GET | `/api/chat/rooms/[id]/meetings` | Get the room's active meeting, if any |
| POST | `/api/chat/rooms/[id]/meetings` | Start a video/audio meeting |
| PUT | `/api/chat/rooms/[id]/meetings/[meetingId]` | End a meeting |
| POST | `/api/chat/push/subscribe` | Store a browser's push subscription |
| POST | `/api/chat/push/unsubscribe` | Remove a push subscription |

### Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | Fetch notifications (supports `?unread=true`) |
| POST | `/api/notifications` | Mark as read or delete. Body: `{ action: 'read'\|'delete', ids: [...] }` |

### Realtime

| Method | Path | Description |
|---|---|---|
| GET | `/api/realtime/board` | SSE stream of board task events |
| GET | `/api/realtime/chat` | SSE stream of chat messages/reactions/typing/meeting events |

### System

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check (returns 200) |
| GET | `/api/cron/overdue` | Overdue task check (requires `Authorization: Bearer CRON_SECRET`) |

---

## Environment Variables

Create a `.env.local` file at the project root with the following variables:

```env
# PostgreSQL (Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Auth
SESSION_SECRET=a-long-random-string-at-least-32-chars

# Google Gemini AI
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_GEMINI_MODEL=gemini-3.1-flash-lite

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron (Vercel)
CRON_SECRET=another-random-secret

# Team chat video/audio meetings (optional — defaults to PeerJS's public cloud)
NEXT_PUBLIC_PEERJS_HOST=0.peerjs.com
NEXT_PUBLIC_PEERJS_PORT=443
NEXT_PUBLIC_PEERJS_PATH=/
```

> For Gmail SMTP, use an **App Password** (not your account password). Enable 2FA on your Google account, then generate an App Password under Security settings.
>
> There's no `.env.local.example` committed — copy the block above straight into a new `.env.local` at the project root.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Google AI Studio API key (for Gemini)
- A Gmail account with an App Password (for email)

### Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd pm-chat

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env.local at the project root — see Environment Variables section above

# 4. Set up the database
# Run these SQL files, in order, in your Supabase project's SQL editor:
#   scripts/migrate.sql → migrate-chat.sql → migrate-auth.sql → migrate-workspace.sql
#   → migrate-board.sql → migrate-context.sql → migrate-notifications.sql → migrate-chatrooms.sql

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/register` on first visit.

### Production Deployment (Vercel)

1. Push to GitHub and import the repository in Vercel.
2. Add all environment variables from `.env.local` in the Vercel project settings.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://your-app.vercel.app`).
4. The cron job in `vercel.json` will be picked up automatically by Vercel.

---

## Key Design Decisions

**No ORM** — All database access is raw SQL via `node-postgres`. This keeps queries explicit and avoids N+1 surprises, at the cost of more verbose code in `db.js`.

**No NextAuth** — Session management is a thin custom layer using `jose` JWTs. This avoids adapter complexity and keeps the auth flow fully visible in the codebase.

**SSE over WebSockets** — Real-time board updates use Server-Sent Events, which are simpler to deploy on serverless infrastructure (Vercel) than WebSocket connections.

**Context-injected AI** — Rather than RAG or vector search, the AI system prompt is rebuilt on every request with the user's full task and project data. This works well at current scale and keeps the implementation simple.

**Route groups** — `(app)` and `(auth)` are Next.js route groups that share layouts without adding path segments, keeping URL structure clean.

**Mesh WebRTC over an SFU** — Team meetings connect peers directly via PeerJS rather than routing media through a server. It's free to run and needs no media infrastructure, at the cost of not scaling past small groups — the right tradeoff for a project-team chat, not a webinar product.

---

<div align="center">

Made by [Umar Ilyas](https://umarilyas.dev)

</div>
