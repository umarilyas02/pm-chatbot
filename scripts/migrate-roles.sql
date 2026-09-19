-- Adds server-side session revocation support.
-- Bumping session_version invalidates every previously-issued session cookie
-- for that user (used on password reset / change) without needing a session store.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS session_version INT NOT NULL DEFAULT 1;

-- NOTE ON THE "SINGLE ADMIN" MODEL
-- ---------------------------------
-- Going forward, /register only creates a new workspace (and makes the
-- registrant its 'owner'/admin) when no workspace exists yet system-wide.
-- Everyone who registers after that has no workspace until an existing
-- admin invites them (they then join as 'member'/team member).
--
-- This is enforced in application code (src/app/actions/auth.js), not with
-- a DB constraint, because this database may already contain multiple
-- pre-existing personal workspaces created under the old "everyone is an
-- owner" behavior. Adding a hard UNIQUE constraint here would fail the
-- migration on that existing data. If you want to consolidate old
-- single-member workspaces into the main team workspace, do that as a
-- deliberate, separate data cleanup — it's not run automatically.
