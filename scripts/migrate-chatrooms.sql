-- Chat rooms, members, messages, reactions, meetings, push subscriptions
-- Run after migrate.sql, migrate-chat.sql, migrate-board.sql, migrate-workspace.sql

BEGIN;

-- ── Chat Rooms ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL CHECK (type IN ('direct', 'project')),
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One project room per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_project_unique
  ON chat_rooms (project_id)
  WHERE type = 'project' AND project_id IS NOT NULL;

-- ── Chat Room Members ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id       UUID      NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id       UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  push_enabled  BOOLEAN   NOT NULL DEFAULT TRUE,
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);

-- ── Chat Messages ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  edited      BOOLEAN     NOT NULL DEFAULT FALSE,
  edited_at   TIMESTAMPTZ,
  deleted     BOOLEAN     NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON chat_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

-- ── Chat Reactions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID        NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON chat_reactions(message_id);

-- ── Chat Meetings ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_meetings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID        NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('video', 'audio')),
  status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_meetings_room_status
  ON chat_meetings (room_id, status);

-- ── Push Subscriptions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL UNIQUE,
  p256dh      TEXT        NOT NULL,
  auth        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

COMMIT;
