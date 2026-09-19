# Chat Feature — Security Considerations

## Threat Model

The chat feature allows authenticated workspace members to exchange messages, reactions, edit/delete messages, receive push notifications, and join video/voice calls. Key threats:

1. **Unauthorized access** — reading messages in rooms the user doesn't belong to
2. **Message injection** — sending messages as another user
3. **Room escalation** — accessing rooms outside workspace scope
4. **Denial of service** — message spam, oversized payloads, meeting flooding
5. **Information leakage** — exposing user data or message history to unauthorized parties
6. **Push notification abuse** — spamming notifications, subscription hijacking
7. **WebRTC attacks** — ICE candidate theft, media stream interception
8. **Privilege escalation** — editing/deleting other users' messages

---

## Authentication & Authorization

### Session-Based Auth (Existing)

All chat API routes use the existing `getSession()` guard:

```js
const session = await getSession()
if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

**Requirement:** Every new chat route MUST call `getSession()` as the first operation.

### Room Membership Checks

Every request to a room (read messages, send message, add reaction, start meeting) MUST verify:

```js
const isMember = await isRoomMember(roomId, session.userId)
if (!isMember) return Response.json({ error: 'Forbidden' }, { status: 403 })
```

### Workspace Scoping

| Action | Authorization Rule |
|---|---|
| Create DM room | Both users must be in the same workspace |
| Access project room | User must be a member of the project's workspace |
| Send message | Must be room member |
| Edit message | Must be the original sender |
| Delete message | Must be the original sender + within 30 seconds |
| Add reaction | Must be room member |
| Remove reaction | Must be the reaction owner |
| Start meeting | Must be room member |
| Join meeting | Must be room member |
| End meeting | Must be room member (or meeting creator) |
| Register push subscription | Must be authenticated |
| List rooms | Only show rooms the user is a member of |

---

## Input Validation

### Message Content

| Rule | Enforcement |
|---|---|
| Max length: 5000 characters | App-level check before DB insert |
| No HTML/script tags | Plain text only — sanitize before storage |
| Non-empty content | Reject blank or whitespace-only messages |
| No null bytes | Strip or reject `\0` characters |
| Edited content re-validates | Same rules apply on edit |

### Reactions

| Rule | Enforcement |
|---|---|
| Max emoji length: 8 chars | Reject longer strings |
| Must be valid Unicode emoji | Regex validation: `/^\p{Emoji}$/u` |
| One reaction per user per emoji per message | DB unique constraint |

### Room Creation (Direct Messages)

| Rule | Enforcement |
|---|---|
| Target user must exist | FK constraint + explicit check |
| Target user must be in same workspace | Query `workspace_members` |
| No self-DMs | Reject `userId1 === userId2` |
| Prevent duplicate rooms | Find existing direct room before creating |

### Meeting Content

| Rule | Enforcement |
|---|---|
| Type must be 'video' or 'audio' | CHECK constraint + app-level |
| Only one active meeting per room | Check existing active meeting before creating |

### API Input Sanitization

All inputs parameterized via `$1, $2, ...` in SQL queries. **No string interpolation in SQL.**

---

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| POST `/api/chat/rooms` (create DM) | 10 | per minute |
| POST `/api/chat/rooms/[id]/messages` | 30 | per minute |
| PUT `/api/chat/rooms/[id]/messages/[msgId]` | 20 | per minute |
| DELETE `/api/chat/rooms/[id]/messages/[msgId]` | 20 | per minute |
| POST `/api/chat/rooms/[id]/messages/[msgId]/reactions` | 30 | per minute |
| PUT `/api/chat/rooms/[id]/read` | 60 | per minute |
| POST `/api/chat/rooms/[id]/meetings` | 5 | per minute |
| POST `/api/chat/push/subscribe` | 5 | per minute |
| POST typing indicator | 30 | per minute |

Use the existing `src/lib/ratelimit.js` sliding window rate limiter.

---

## SSE Security

### Connection Auth

The `/api/realtime/chat` SSE endpoint MUST:

1. Validate session cookie on connection open
2. Accept `roomId` query parameter
3. Verify user is a member of that room before subscribing
4. Reject and close connection if not a member

### Broadcast Isolation

The `broadcastToRoom()` function must only send to members of the specified room. Never broadcast to all connected users.

### Event Validation

SSE events from clients (typing indicators) MUST:

1. Validate the user is a member of the room
2. Rate limit typing events (max 1 per second)
3. Sanitize user name in the broadcast payload

---

## Message Edit/Delete Security

### Edit Rules

| Rule | Enforcement |
|---|---|
| Only sender can edit | Check `sender_id === session.userId` |
| No time limit on editing | Allowed anytime (flagged as `edited`) |
| Content re-validates | Same length/format rules as new message |
| Audit trail | `edited_at` timestamp stored |

### Delete Rules (30-Second Window)

| Rule | Enforcement |
|---|---|
| Only sender can delete | Check `sender_id === session.userId` |
| Within 30 seconds of `created_at` | `NOW() - created_at <= INTERVAL '30 seconds'` |
| Soft delete | `deleted = true`, `deleted_at = NOW()`, content replaced |
| No hard delete in UI | Content replaced with "[Message deleted]" |

```sql
-- Delete check query
DELETE FROM chat_messages
WHERE id = $1
  AND sender_id = $2
  AND created_at > NOW() - INTERVAL '30 seconds'
RETURNING id;
```

### What Happens After 30 Seconds

- Delete button is hidden in the UI
- API returns 403 if attempted server-side
- Message remains visible (edited flag is separate from delete window)

---

## Push Notification Security

### Subscription Security

| Rule | Enforcement |
|---|---|
| Only authenticated users can subscribe | `getSession()` check |
| Subscription tied to user | FK constraint |
| Endpoint uniqueness | Unique index prevents duplicate subscriptions |
| One subscription per browser | Endpoint is unique per browser instance |

### Notification Content

| Rule | Enforcement |
|---|---|
| No sensitive data in payload | Only room ID and sender name |
| No message content in notification | Body is truncated summary only |
| Sender doesn't receive own notification | Check `sender_id !== recipient` |

### Subscription Cleanup

- On logout: optionally clear subscriptions for that user
- On account deletion: CASCADE DELETE removes all subscriptions
- Invalid subscriptions (expired endpoints): cleaned up on send failure

### VAPID Key Security

- Private key stored in environment variable, never exposed to client
- Public key safe to expose (used for subscription only)
- Keys rotated periodically (manual process)

---

## WebRTC / Video Meeting Security

### Peer Connection Security

| Rule | Enforcement |
|---|---|
| Only room members can join | Meeting join requires room membership check |
| Peer ID includes user + room | Format: `chat-{userId}-{roomId}` — scoping |
| STUN only (no TURN by default) | TURN is optional, requires explicit config |

### Media Security

| Rule | Enforcement |
|---|---|
| DTLS-SRTP encryption | WebRTC default — all media streams encrypted |
| No media recording | v1: no recording feature |
| No file transfer | WebRTC data channels not used |

### Meeting State

| Rule | Enforcement |
|---|---|
| Active meeting check | Only one meeting per room at a time |
| Cleanup on disconnect | Meeting ends when creator leaves or all participants leave |
| No orphaned meetings | `ended_at` set, status = 'ended' |

### ICE/STUN Configuration

- Use Google's public STUN servers (free, encrypted)
- No TURN server by default (avoids relaying media through third party)
- Optional TURN config for corporate networks (self-hosted recommended)

---

## SQL Injection Prevention

All database queries use parameterized queries via `pg` Pool:

```js
const { rows } = await pool.query(
  'SELECT * FROM chat_messages WHERE room_id = $1 ORDER BY created_at DESC LIMIT $2',
  [roomId, limit]
)
```

**Never** construct queries with template literals containing user input.

---

## Error Handling

| Error | HTTP Status | Message |
|---|---|---|
| Not authenticated | 401 | `"Unauthorized"` |
| Not a room member | 403 | `"Forbidden"` |
| Room not found | 404 | `"Room not found"` |
| Message not found | 404 | `"Message not found"` |
| Cannot edit others' messages | 403 | `"Forbidden"` |
| Delete window expired | 403 | `"Delete window expired (30 seconds)"` |
| Target user not in workspace | 400 | `"User not in workspace"` |
| Self-DM attempted | 400 | `"Cannot create DM with yourself"` |
| Message too long | 400 | `"Message too long (max 5000 characters)"` |
| Empty message | 400 | `"Message cannot be empty"` |
| Invalid emoji | 400 | `"Invalid emoji"` |
| Active meeting exists | 409 | `"Meeting already in progress"` |
| Rate limited | 429 | `"Too many requests"` |
| Server error | 500 | `"Internal server error"` (never expose stack trace) |

---

## Data Protection

### What's Stored

| Data | Retention |
|---|---|
| Message content | Permanent (until soft delete) |
| Sender ID | Permanent (FK to users) |
| Edit timestamps | Permanent |
| Delete timestamps | Permanent (soft delete) |
| Reactions | Permanent (until removed by user) |
| Meeting records | Permanent (start/end timestamps) |
| Push subscriptions | Until user unsubscribes or account deleted |
| Typing state | Never stored (in-memory only) |

### What's NOT Stored

- IP addresses in chat logs
- Device/browser info in messages
- Video/audio streams (peer-to-peer only)
- Typing history

### Sensitive Data in Messages

Users may share sensitive information (tokens, passwords, keys) in chat:

- v1: No automated scanning
- Future: Warning banner about not sharing secrets
- Future: Optional pattern-based detection (regex for API keys)

---

## Service Worker Security

| Rule | Enforcement |
|---|---|
| Served from root | `/sw.js` — required for push notifications |
| No sensitive data cached | SW only handles push events |
| Scoped to origin | Cannot access other origins |
| Update on deploy | Versioned SW with cache busting |

---

## Migration Safety

The migration script (`migrate-chatrooms.sql`) should:

1. Use `BEGIN` / `COMMIT` for atomicity
2. Add `IF NOT EXISTS` guards where possible
3. Be reversible (include `DROP` statements in comments)
4. Not lock existing tables for extended periods
5. Use `CONCURRENTLY` for index creation if table is large

---

## Security Checklist

Before shipping:

- [ ] All chat API routes have `getSession()` guard
- [ ] All room access checks verify membership server-side
- [ ] Direct rooms require same-workspace membership
- [ ] Messages are plain text (no HTML injection)
- [ ] All SQL queries are parameterized
- [ ] Rate limits applied to all endpoints
- [ ] SSE connections authenticated and room-scoped
- [ ] Typing events rate-limited
- [ ] Edit only allowed by sender
- [ ] Delete only allowed by sender within 30s
- [ ] Reactions validated (emoji format, one per user per emoji)
- [ ] Push subscriptions tied to authenticated users
- [ ] Push notifications don't contain message content
- [ ] Sender doesn't receive own push notification
- [ ] WebRTC connections require room membership
- [ ] Meeting state cleaned up on disconnect
- [ ] VAPID private key in env var, never exposed
- [ ] Service Worker served from root, no sensitive caching
- [ ] Error messages don't leak internal details
- [ ] Content length validated (5000 char max)
- [ ] No self-DM allowed
- [ ] Migration is atomic and reversible
- [ ] Cross-browser testing (Safari WebRTC, Firefox Push)
