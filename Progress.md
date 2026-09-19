# Chat Feature — Progress Tracker

> Last updated: 2026-09-17

## Status: 🟡 Planning Complete — Ready to Implement

---

## Phase 1: Database & Core API

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Write `migrate-chatrooms.sql` — chat_rooms, chat_room_members, chat_messages, chat_reactions, chat_meetings, push_subscriptions | ⬜ Pending | |
| 1.2 | Run migration on database | ⬜ Pending | |
| 1.3 | Add DB query functions to `src/lib/db.js` (~20 functions) | ⬜ Pending | |
| 1.4 | Create `/api/chat/rooms` GET (list user's rooms + last message + unread) | ⬜ Pending | |
| 1.5 | Create `/api/chat/rooms` POST (create/get DM room) | ⬜ Pending | |
| 1.6 | Create `/api/chat/rooms/[id]` GET (room details + members) | ⬜ Pending | |
| 1.7 | Create `/api/chat/rooms/[id]/messages` GET (paginated, cursor-based) | ⬜ Pending | |
| 1.8 | Create `/api/chat/rooms/[id]/messages` POST (send message) | ⬜ Pending | |
| 1.9 | Create `/api/chat/rooms/[id]/messages/[msgId]` PUT (edit message) | ⬜ Pending | |
| 1.10 | Create `/api/chat/rooms/[id]/messages/[msgId]` DELETE (soft delete, 30s) | ⬜ Pending | |
| 1.11 | Create `/api/chat/rooms/[id]/read` PUT (mark as read) | ⬜ Pending | |
| 1.12 | Modify project creation to auto-create project room + add members | ⬜ Pending | |

---

## Phase 2: Real-time — Messages & Typing

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Create `/api/realtime/chat` SSE endpoint | ⬜ Pending | |
| 2.2 | Integrate `broadcastToRoom()` into message POST/PUT/DELETE | ⬜ Pending | |
| 2.3 | Create typing indicator POST endpoint | ⬜ Pending | |
| 2.4 | Integrate typing broadcast into SSE | ⬜ Pending | |
| 2.5 | Test real-time between two browser sessions | ⬜ Pending | |

---

## Phase 3: Reactions & Edit/Delete

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Create `/api/chat/rooms/[id]/messages/[msgId]/reactions` GET/POST | ⬜ Pending | |
| 3.2 | Create `/api/chat/rooms/[id]/messages/[msgId]/reactions/[emoji]` DELETE | ⬜ Pending | |
| 3.3 | Integrate reaction broadcasts into SSE | ⬜ Pending | |
| 3.4 | Test edit/delete permission checks + 30s window | ⬜ Pending | |

---

## Phase 4: Frontend — Core Chat

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | Create `src/app/(app)/messages/page.js` | ⬜ Pending | |
| 4.2 | Create `MessagesClient.jsx` (two-panel layout) | ⬜ Pending | |
| 4.3 | Create `RoomList.jsx` + `RoomItem.jsx` | ⬜ Pending | |
| 4.4 | Create `ChatArea.jsx` + `MessageBubble.jsx` | ⬜ Pending | |
| 4.5 | Create `ChatInput.jsx` with typing emission | ⬜ Pending | |
| 4.6 | Create `TypingIndicator.jsx` | ⬜ Pending | |
| 4.7 | Create `ReactionPicker.jsx` + `Reactions.jsx` | ⬜ Pending | |
| 4.8 | Create `EditMessageModal.jsx` (inline edit) | ⬜ Pending | |
| 4.9 | Create `useChat.js` hook (SSE, messages, typing, reactions) | ⬜ Pending | |
| 4.10 | Implement infinite scroll up for older messages | ⬜ Pending | |
| 4.11 | Add Messages to Sidebar navigation | ⬜ Pending | |

---

## Phase 5: Direct Messages & Project Rooms

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Create `NewChatModal.jsx` (search workspace members) | ⬜ Pending | |
| 5.2 | Auto-add workspace members to project room on creation | ⬜ Pending | |
| 5.3 | Handle room type badges (project vs DM) | ⬜ Pending | |
| 5.4 | Create `RoomHeader.jsx` with meeting controls | ⬜ Pending | |

---

## Phase 6: Push Notifications

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Generate VAPID key pair, set env vars | ⬜ Pending | |
| 6.2 | Create `public/sw.js` Service Worker | ⬜ Pending | |
| 6.3 | Create `/api/chat/push/subscribe` POST | ⬜ Pending | |
| 6.4 | Create `/api/chat/push/unsubscribe` DELETE | ⬜ Pending | |
| 6.5 | Create `usePush.js` hook (registration + subscription) | ⬜ Pending | |
| 6.6 | Integrate push sending into message POST route | ⬜ Pending | |
| 6.7 | Add per-room push toggle UI | ⬜ Pending | |
| 6.8 | Handle notification click (open correct room) | ⬜ Pending | |

---

## Phase 7: Video/Voice Meetings

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Install `peerjs` package | ⬜ Pending | |
| 7.2 | Create meetings API routes (start, get active, end) | ⬜ Pending | |
| 7.3 | Create `useMeeting.js` hook (PeerJS, streams, calls) | ⬜ Pending | |
| 7.4 | Create `VideoGrid.jsx` component | ⬜ Pending | |
| 7.5 | Create `MeetingControls.jsx` (mic/camera/end) | ⬜ Pending | |
| 7.6 | Create `MeetingBanner.jsx` (join meeting CTA) | ⬜ Pending | |
| 7.7 | Integrate meeting broadcasts into SSE | ⬜ Pending | |
| 7.8 | Configure ICE/STUN/TURN servers | ⬜ Pending | |
| 7.9 | Test multi-participant call | ⬜ Pending | |

---

## Phase 8: Polish & Edge Cases

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | Unread counts and badges | ⬜ Pending | |
| 8.2 | Empty states (no rooms, no messages, no meetings) | ⬜ Pending | |
| 8.3 | Error handling (not a member, room not found, etc.) | ⬜ Pending | |
| 8.4 | Rate limiting on all endpoints | ⬜ Pending | |
| 8.5 | Content length validation (5000 chars) | ⬜ Pending | |
| 8.6 | Edit/delete permission checks | ⬜ Pending | |
| 8.7 | Meeting state cleanup on disconnect | ⬜ Pending | |
| 8.8 | Cross-browser testing (Safari WebRTC) | ⬜ Pending | |
| 8.9 | Run lint + verify no regressions | ⬜ Pending | |

---

## Blockers

| Blocker | Status | Resolution |
|---|---|---|
| None yet | — | — |

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-09-17 | SSE for real-time (not WebSockets) | Already in codebase, simpler deployment on Vercel |
| 2026-09-17 | Cursor-based pagination for messages | More reliable than OFFSET for live data |
| 2026-09-17 | Direct rooms created on first message | Avoids empty room clutter |
| 2026-09-17 | Project rooms auto-created on project create | Always available to workspace members |
| 2026-09-17 | Typing indicators via SSE, no DB | Ephemeral, no persistence needed |
| 2026-09-17 | Edit allowed anytime, delete within 30s | Balance between flexibility and safety |
| 2026-09-17 | Web Push API + Service Worker | Standard, no third-party dependency |
| 2026-09-17 | PeerJS for video/voice | Mature WebRTC wrapper, free signaling server |
| 2026-09-17 | Google STUN servers (free) | Covers 95%+ of network conditions |
| 2026-09-17 | Raw SQL in db.js | Matches existing codebase pattern, no new deps |
