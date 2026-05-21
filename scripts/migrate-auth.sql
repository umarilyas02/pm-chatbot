-- DEFAULT TRUE so every existing user is treated as already verified
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified      BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS verification_token  TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_verification_token
  ON users(verification_token) WHERE verification_token IS NOT NULL;

-- New users will be inserted with email_verified = FALSE explicitly
-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prt_token    ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user_id  ON password_reset_tokens(user_id);
