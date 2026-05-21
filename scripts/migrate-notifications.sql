-- Notifications table — run after migrate-board.sql

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL
                         CHECK (type IN (
                           'task_created', 'task_assigned', 'task_overdue',
                           'task_completed', 'ai_insight', 'deadline_reminder'
                         )),
  title      TEXT        NOT NULL,
  body       TEXT,
  href       TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_read_idx
  ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON notifications(created_at DESC);
