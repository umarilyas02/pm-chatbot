# User-to-User Chat Feature — Implementation Plan

## Overview

Add real-time messaging between workspace members, with per-project chat rooms. This extends the existing AI-only chat into a full team communication system with typing indicators, reactions, edit/delete, push notifications, and video/voice meetings.

---

## Architecture

### Scope

| Feature | Description |
|---|---|
| **Direct Messages** | 1:1 private conversations between any two workspace members |
| **Project Chat Rooms** | One chat room per project, visible to workspace members |
| **Real-time Delivery** | SSE-based push for messages, typing, reactions, edits |
| **Typing Indicators** | Show when a user is typing in a room (SSE broadcast, no DB persistence) |
| **Message Reactions** | Emoji reactions on any message (toggle on/off) |
| **Message Edit/Delete** | Edit own messages anytime, delete own messages within 30 seconds |
| **Unread Tracking** | Per-user last-read timestamp per room |
| **Push Notifications** | Browser push via Web Push API (service worker) for new messages when tab is backgrounded |
| **Video/Voice Meetings** | Start ad-hoc video/voice calls within a room (WebRTC via PeerJS) |
| **Message History** | Persistent in PostgreSQL, cursor-based pagination |

### What We Are NOT Building (v1)

- Group DMs (only 1:1 and project rooms)
- File/image uploads in chat
- Message threads/replies
- End-to-end encryption
- Screen sharing
- Meeting recording

---

## Database Schema

### New Tables

#### `chat_rooms`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `type` | TEXT NOT NULL | CHECK: `'direct'`, `'project'` |
| `project_id` | UUID FK → projects | Nullable. Set when `type='project'` |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` |

- One project room per project (unique index on `project_id WHERE type='project'`)
- Direct rooms created on first message

#### `chat_room_members`

| Column | Type | Notes |
|---|---|---|
| `room_id` | UUID FK → chat_rooms | CASCADE DELETE |
| `user_id` | UUID FK → users | CASCADE DELETE |
| `joined_at` | TIMESTAMPTZ | DEFAULT `NOW()` |
| `last_read_at` | TIMESTAMPTZ | DEFAULT `NOW()` |
| `push_enabled` | BOOLEAN | DEFAULT `true` — per-user push preference |

- Composite PK: `(room_id, user_id)`

#### `chat_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `room_id` | UUID FK → chat_rooms | CASCADE DELETE |
| `sender_id` | UUID FK → users | NOT NULL |
| `content` | TEXT NOT NULL | Max ~5000 chars enforced at app level |
| `edited` | BOOLEAN | DEFAULT `false` |
| `edited_at` | TIMESTAMPTZ | Nullable |
| `deleted` | BOOLEAN | DEFAULT `false` (soft delete) |
| `deleted_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` |

- Index on `(room_id, created_at DESC)` for pagination

#### `chat_reactions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `message_id` | UUID FK → chat_messages | CASCADE DELETE |
| `user_id` | UUID FK → users | CASCADE DELETE |
| `emoji` | TEXT NOT NULL | Unicode emoji, max 8 chars |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` |

- Unique constraint: `(message_id, user_id, emoji)` — one reaction per user per emoji per message
- Index on `message_id` for fast lookups

#### `chat_meetings`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `room_id` | UUID FK → chat_rooms | CASCADE DELETE |
| `created_by` | UUID FK → users | NOT NULL |
| `type` | TEXT NOT NULL | CHECK: `'video'`, `'audio'` |
| `status` | TEXT NOT NULL | CHECK: `'active'`, `'ended'` |
| `started_at` | TIMESTAMPTZ | DEFAULT `NOW()` |
| `ended_at` | TIMESTAMPTZ | Nullable |

- Index on `(room_id, status)` to find active meetings fast

#### `push_subscriptions`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `user_id` | UUID FK → users | CASCADE DELETE |
| `endpoint` | TEXT NOT NULL | Push service endpoint URL |
| `p256dh` | TEXT NOT NULL | Encryption key |
| `auth` | TEXT NOT NULL | Auth secret |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` |

- Unique constraint on `endpoint` (one subscription per browser)
- One user can have multiple subscriptions (multiple browsers/devices)

### Unique Constraints

```sql
CREATE UNIQUE INDEX idx_chat_rooms_project_unique
  ON chat_rooms (project_id)
  WHERE type = 'project' AND project_id IS NOT NULL;

CREATE UNIQUE INDEX idx_chat_reactions_unique
  ON chat_reactions (message_id, user_id, emoji);

CREATE UNIQUE INDEX idx_push_subscriptions_endpoint
  ON push_subscriptions (endpoint);
```

---

## API Routes

### Chat Rooms

| Route | Method | Purpose |
|---|---|---|
| `/api/chat/rooms` | GET | List user's rooms with last message + unread count |
| `/api/chat/rooms` | POST | Create or get existing direct room |
| `/api/chat/rooms/[id]` | GET | Get room details + members |
| `/api/chat/rooms/[id]/members` | GET | List room members |

### Chat Messages

| Route | Method | Purpose |
|---|---|---|
| `/api/chat/rooms/[id]/messages` | GET | Paginated messages (cursor-based) |
| `/api/chat/rooms/[id]/messages` | POST | Send a message |
| `/api/chat/rooms/[id]/messages/[msgId]` | PUT | Edit a message (sender only, no time limit) |
| `/api/chat/rooms/[id]/messages/[msgId]` | DELETE | Soft delete (sender only, within 30 seconds) |
| `/api/chat/rooms/[id]/read` | PUT | Update `last_read_at` |

### Reactions

| Route | Method | Purpose |
|---|---|---|
| `/api/chat/rooms/[id]/messages/[msgId]/reactions` | GET | Get all reactions for a message |
| `/api/chat/rooms/[id]/messages/[msgId]/reactions` | POST | Add a reaction (toggle) |
| `/api/chat/rooms/[id]/messages/[msgId]/reactions/[emoji]` | DELETE | Remove a reaction |

### Meetings

| Route | Method | Purpose |
|---|---|---|
| `/api/chat/rooms/[id]/meetings` | POST | Start a video/audio meeting |
| `/api/chat/rooms/[id]/meetings` | GET | Get active meeting (if any) |
| `/api/chat/rooms/[id]/meetings/[meetingId]` | PUT | End a meeting |

### Push Notifications

| Route | Method | Purpose |
|---|---|---|
| `/api/chat/push/subscribe` | POST | Register push subscription |
| `/api/chat/push/unsubscribe` | DELETE | Remove push subscription |
| `/api/chat/push/test` | POST | Send test notification |

### Real-time (SSE)

| Route | Method | Purpose |
|---|---|---|
| `/api/realtime/chat` | GET | SSE stream for a room: messages, typing, reactions, edits, meetings |

---

## SSE Real-time Flow

### Event Types

All SSE events use a `type` field:

| Event | Payload | When |
|---|---|---|
| `message:new` | `{ id, sender_id, sender_name, sender_avatar, content, created_at }` | New message sent |
| `message:edited` | `{ id, content, edited_at }` | Message edited |
| `message:deleted` | `{ id }` | Message soft-deleted |
| `typing:start` | `{ user_id, user_name }` | User starts typing |
| `typing:stop` | `{ user_id }` | User stops typing or sends message |
| `reaction:added` | `{ message_id, user_id, user_name, emoji }` | Reaction added |
| `reaction:removed` | `{ message_id, user_id, emoji }` | Reaction removed |
| `meeting:started` | `{ id, created_by, type }` | Meeting started |
| `meeting:ended` | `{ id }` | Meeting ended |

### Broadcast Function

```
broadcastToRoom(roomId, payload):
  members = getRoomMembers(roomId)
  for each member:
    broadcast(member.userId, payload)
```

### Typing Indicator Flow

1. User starts typing → client sends POST to `/api/chat/rooms/[id]/typing` (or uses existing SSE channel)
2. Server broadcasts `typing:start` to all OTHER members of the room
3. After 3 seconds of inactivity OR on send, client sends `typing:stop`
4. No DB persistence — purely in-memory SSE broadcast

**Alternative (simpler):** Typing state sent directly over SSE as a message, not a separate API call. Client emits a `typing:start` event via a lightweight POST, server broadcasts to room.

---

## Push Notifications

### Architecture

Uses the **Web Push API** (W3C standard):

1. Client registers a Service Worker (`/sw.js`) on first load
2. Client calls `PushManager.subscribe()` to get a subscription object
3. Client POSTs subscription to `/api/chat/push/subscribe` (stored in `push_subscriptions` table)
4. When a new message arrives and the tab is not focused, server sends a Web Push notification
5. Clicking the notification opens/focuses the chat room

### VAPID Keys

- Generate a VAPID key pair (public + private)
- Store in environment variables: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Public key sent to client for subscription
- Private key used server-side for sending notifications

### Notification Payload

```json
{
  "title": "Ali sent a message in Auth System",
  "body": "Done with the API endpoints",
  "icon": "/icon.png",
  "badge": "/badge.png",
  "data": {
    "roomId": "uuid",
    "url": "/messages?room=uuid"
  }
}
```

### When to Send Push

| Condition | Action |
|---|---|
| Tab is focused | Don't send push (user sees it live via SSE) |
| Tab is backgrounded/hidden | Send push notification |
| User has `push_enabled = false` for room | Don't send push |
| User is the sender | Don't send push to self |

### Detection: Tab Focused vs Backgrounded

Server cannot detect this. Instead:
- Client sends a `visibilitychange` event to the server (via POST) when tab state changes
- OR: simpler approach — always send push, but client-side Service Worker checks `document.visibilityState` and ignores if focused

**Recommended:** Always send push from server. Client Service Worker suppresses the notification if the tab is focused (via `self.registration.getNotifications()` check).

### Browser Support

- Chrome 40+, Firefox 44+, Edge 17+, Safari 16+ (with webkit prefix)
- Requires HTTPS (or localhost for dev)
- Service Worker must be served from the root (`/sw.js`)

---

## Video/Voice Meetings

### Architecture

Uses **PeerJS** (WebRTC wrapper) with a **PeerJS Server** for signaling:

```
┌──────────┐    signaling     ┌──────────────┐    signaling     ┌──────────┐
│  User A  │◄────────────────►│ PeerJS Server│◄────────────────►│  User B  │
│ (browser)│                  └──────────────┘                  │ (browser)│
│          │◄──────────────────────────────────────────────────►│          │
│          │              WebRTC P2P (audio/video)              │          │
└──────────┘                                                    └──────────┘
```

### Options for PeerJS Server

| Option | Pros | Cons |
|---|---|---|
| **PeerJS Cloud (default)** | Zero setup, free tier | Rate limits, external dependency |
| **Self-hosted PeerJS Server** | Full control, no rate limits | Extra deployment step |
| **Socket.io + Simple-Peer** | More flexible | More code to write |

**Recommended:** Start with PeerJS Cloud (default server `0.peerjs.com`), offer env var to point to self-hosted server.

### Meeting Flow

1. User clicks "Start Meeting" button in room header
2. Client POSTs `/api/chat/rooms/[id]/meetings` → creates `chat_meetings` row, broadcasts `meeting:started` via SSE
3. All room members see an "Join Meeting" banner in the chat
4. Clicking "Join" initializes PeerJS, requests camera/mic permissions, creates a peer
5. New joiner calls all existing participants' peer IDs (stored in client state)
6. Video/audio streams displayed in a grid layout
7. Any participant can end the meeting → PUT to end route → broadcasts `meeting:ended`
8. All peers disconnect, video elements removed

### Meeting UI

```
┌─────────────────────────────────────────────────────┐
│ 🔴 LIVE — Video Meeting (3 participants)     [End]  │
├───────────────────┬─────────────────────────────────┤
│                   │  ┌─────────┐  ┌─────────┐      │
│   Chat Messages   │  │  User A │  │  User B │      │
│                   │  │ (video) │  │ (video) │      │
│                   │  └─────────┘  └─────────┘      │
│                   │  ┌─────────┐                    │
│                   │  │  You    │                    │
│                   │  │ (video) │                    │
│                   │  └─────────┘                    │
├───────────────────┼─────────────────────────────────┤
│                   │  [🎤 Mic] [📷 Cam] [📞 End]     │
└───────────────────┴─────────────────────────────────┘
```

### Meeting Controls

| Control | Action |
|---|---|
| Toggle Mic | Mute/unmute local audio track |
| Toggle Camera | Enable/disable local video track |
| End Meeting | End for all participants |
| Share Link | Copy meeting room URL to clipboard |

### PeerJS Integration

- `peerjs` npm package (client-side only)
- Peer ID format: `chat-{userId}-{roomId}` (deterministic, no server needed to track)
- Each participant discovers others via SSE `meeting:started` event which includes the creator's peer ID
- New joiners broadcast their peer ID via SSE `meeting:joined` event
- Call management: auto-call new joiners, auto-hangup on `meeting:ended`

### ICE/STUN/TURN

- Use Google's public STUN servers (free, no setup):
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
- For NAT traversal issues (corporate networks), offer optional TURN server config via env vars

---

## Frontend Implementation

### Files to Create

| File | Purpose |
|---|---|
| `public/sw.js` | Service Worker for push notifications |
| `src/app/(app)/messages/page.js` | Messages page (server component) |
| `src/components/messages/MessagesClient.jsx` | Main chat layout (two-panel) |
| `src/components/messages/RoomList.jsx` | Left sidebar: rooms + unread badges |
| `src/components/messages/RoomItem.jsx` | Single room entry |
| `src/components/messages/ChatArea.jsx` | Right panel: messages + input + meeting |
| `src/components/messages/MessageBubble.jsx` | Message with reactions, edit/delete, hover actions |
| `src/components/messages/ChatInput.jsx` | Text input + send + typing emission |
| `src/components/messages/ReactionPicker.jsx` | Emoji picker for reactions |
| `src/components/messages/Reactions.jsx` | Reaction badges under a message |
| `src/components/messages/EditMessageModal.jsx` | Inline edit (contenteditable or textarea) |
| `src/components/messages/NewChatModal.jsx` | Start a new DM |
| `src/components/messages/RoomHeader.jsx` | Room info + meeting controls |
| `src/components/messages/MeetingBanner.jsx` | "Join Meeting" banner in chat |
| `src/components/messages/VideoGrid.jsx` | Video conference grid layout |
| `src/components/messages/MeetingControls.jsx` | Mic/camera/end buttons |
| `src/components/messages/TypingIndicator.jsx` | "X is typing..." display |
| `src/components/messages/EmptyState.jsx` | No rooms / no messages |
| `src/hooks/useChat.js` | Custom hook: SSE connection, message state, typing, reactions |
| `src/hooks/useMeeting.js` | Custom hook: PeerJS connection, streams, calls |
| `src/hooks/usePush.js` | Custom hook: Service Worker registration, subscription |

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Messages                                            [New Chat]│
├─────────────────────┬────────────────────────────────────────┤
│ 🔍 Search           │  📁 Auth System                [🎥📞] │
├─────────────────────┤  3 members • 1 online                  │
│ 📁 Auth System   2m ├────────────────────────────────────────┤
│ 📁 Dashboard    1h │  👤 Ali: "Done with the API"   10:32   │
│ 👤 Sara           5m│     😂 👍 3                            │
│ 👤 Mike          30m│  ─── edited ─────────────────────────  │
│                     │  👤 You: "Great, merging now"  10:33   │
│                     │  👤 Ali is typing...                   │
│                     ├────────────────────────────────────────┤
│                     │  [😀 📎] Type a message...        [➤]  │
└─────────────────────┴────────────────────────────────────────┘
```

### Message Bubble — Hover Actions

```
  ┌─────────────────────────────────────┐
  │ 👤 Ali                              │
  │ Done with the API endpoints         │
  │ 😂 👍 3                    10:32 AM │
  └─────────────────────────────────────┘
       ┌─────┬─────┬─────┐
       │ 😀  │ ✏️  │ 🗑️  │  ← hover: reactions, edit, delete
       └─────┴─────┴─────┘
```

- Edit: opens inline textarea with current content, save/cancel
- Delete: confirmation toast, soft-deletes if within 30s, otherwise disabled
- Reactions: opens emoji picker, toggles existing reaction

---

## Implementation Phases

### Phase 1: Database & Core API (Days 1-2)

1. Write migration SQL (`migrate-chatrooms.sql`) — all 5 new tables
2. Add DB query functions to `db.js` (~20 new functions)
3. Create API routes: rooms, messages (CRUD), read receipts
4. Modify project creation to auto-create project room + add workspace members

### Phase 2: Real-time — Messages & Typing (Day 3)

5. Create SSE endpoint `/api/realtime/chat`
6. Integrate `broadcastToRoom()` into message POST/PUT/DELETE routes
7. Add typing indicator broadcast (POST endpoint + SSE emission)
8. Test real-time delivery between two browser tabs

### Phase 3: Reactions & Edit/Delete (Day 4)

9. Create reactions API routes (add/remove/toggle)
10. Integrate reaction broadcasts into SSE
11. Create edit message API (PUT with `edited` flag + `edited_at`)
12. Create delete message API (soft delete, 30-second window check)
13. Integrate edit/delete broadcasts into SSE

### Phase 4: Frontend — Core Chat (Days 5-6)

14. Create `MessagesClient` layout (two-panel)
15. Build `RoomList` with last message preview and unread badges
16. Build `ChatArea` with message history (infinite scroll up)
17. Build `ChatInput` with typing indicator emission
18. Build `MessageBubble` with reactions, edit/delete actions
19. Build `ReactionPicker` and `Reactions` components
20. Build `TypingIndicator` component
21. Build `EditMessageModal` (inline edit)
22. Add Messages to Sidebar navigation

### Phase 5: Direct Messages & Project Rooms (Day 7)

23. Build `NewChatModal` for starting DMs
24. Handle room type badges (project vs DM)
25. Build `RoomHeader` with member info and meeting button

### Phase 6: Push Notifications (Days 8-9)

26. Generate VAPID key pair, set env vars
27. Create `public/sw.js` Service Worker
28. Create `/api/chat/push/subscribe` and `/unsubscribe` routes
29. Create `usePush` hook (registration + subscription)
30. Integrate push sending into message POST route (when tab hidden)
31. Add per-room push toggle in room settings

### Phase 7: Video/Voice Meetings (Days 10-12)

32. Install `peerjs` package
33. Create meetings API routes (start, get active, end)
34. Create `useMeeting` hook (PeerJS connection, call management)
35. Build `VideoGrid` component (video elements grid)
36. Build `MeetingControls` component (mic/camera/end)
37. Build `MeetingBanner` component ("Join Meeting" CTA)
38. Integrate meeting broadcasts into SSE
39. Add ICE/STUN/TURN configuration

### Phase 8: Polish & Edge Cases (Days 13-14)

40. Unread counts and badges
41. Empty states (no rooms, no messages, no meetings)
42. Error handling (not a member, room not found, etc.)
43. Rate limiting on all endpoints
44. Content length validation (5000 chars)
45. Edit/delete permission checks
46. Meeting state cleanup on disconnect
47. Push notification click handling (open correct room)
48. Cross-browser testing (Safari WebRTC quirks)
49. Run lint + verify no regressions

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Real-time transport | SSE | Already in codebase, no WebSocket server needed, simpler deployment |
| Typing indicators | SSE broadcast (no DB) | ephemeral, no persistence needed, low latency |
| Message edit | Allowed anytime, flagged `edited` | Users should be able to fix mistakes |
| Message delete | Soft delete, 30s window for sender | Prevent accidental deletion, allow quick undo |
| Reactions | Toggle per user per emoji | Simple, no duplicate reactions |
| Push notifications | Web Push API + Service Worker | Standard, no third-party service needed |
| Video/voice | PeerJS (WebRTC) | Mature wrapper, simple API, free signaling server |
| ICE servers | Google STUN (free) + optional TURN | Covers 95%+ of network conditions |
| Message pagination | Cursor-based (`created_at < cursor`) | More reliable than OFFSET for live data |
| Direct room creation | On first message | Avoids empty rooms cluttering the list |
| Project room creation | Auto on project create | Always available, no manual step |
| DB access | Raw SQL in `db.js` | Matches existing pattern, no new dependencies |
| Service Worker | `/sw.js` at root | Required for push notifications |

---

## Testing Checklist

### Core Chat
- [ ] Create a project → project room appears for all workspace members
- [ ] Send a message in project room → all members see it in real-time
- [ ] Start a DM → room appears in both users' lists
- [ ] Send DM → recipient sees it in real-time
- [ ] Unread badge shows correct count
- [ ] Opening a room marks it as read
- [ ] Loading older messages via scroll-up works
- [ ] Non-members cannot access a room
- [ ] Rate limiting prevents message spam
- [ ] Messages are persisted after page refresh

### Typing Indicators
- [ ] User A types → User B sees "typing..." in real-time
- [ ] User A sends message → typing indicator disappears
- [ ] User A stops typing after 3s → indicator disappears
- [ ] Multiple users typing → all names shown

### Reactions
- [ ] Add reaction to message → visible to all members in real-time
- [ ] Remove reaction → removed in real-time
- [ ] Same user clicks same emoji → toggles off
- [ ] Reaction count shown on message bubble
- [ ] Emoji picker opens on hover/click

### Edit/Delete
- [ ] Edit own message → content updates in real-time, shows "edited"
- [ ] Edit someone else's message → button not shown
- [ ] Delete own message within 30s → message shows "deleted"
- [ ] Delete own message after 30s → delete button hidden
- [ ] Delete someone else's message → button not shown

### Push Notifications
- [ ] Service Worker registers on page load
- [ ] Push subscription created and stored
- [ ] New message when tab is backgrounded → browser notification shown
- [ ] Click notification → opens/focuses the correct room
- [ ] Toggle push off for a room → no notifications from that room
- [ ] Unsubscribe on logout

### Video/Voice Meetings
- [ ] Start meeting → "Join Meeting" banner shown to all room members
- [ ] Join meeting → video/audio streams established
- [ ] Multiple participants → grid layout displayed
- [ ] Toggle mic → audio muted/unmuted
- [ ] Toggle camera → video on/off
- [ ] End meeting → all participants disconnected
- [ ] Participant leaves → grid reflows
- [ ] Meeting state cleaned up on browser close
