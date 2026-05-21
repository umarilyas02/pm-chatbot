-- Cross-chat user context store
-- Each user has one row; items is a JSONB array of {id, text, source_conv_id, created_at}
CREATE TABLE IF NOT EXISTS user_context (
  user_id    UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items      JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
