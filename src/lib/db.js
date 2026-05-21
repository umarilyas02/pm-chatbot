import pg from 'pg'

const { Pool } = pg

let pool

export function getPool() {
  if (!pool) {
    const isLocal = process.env.DATABASE_URL?.includes('localhost') ||
                    process.env.DATABASE_URL?.includes('127.0.0.1')
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    })
  }
  return pool
}

export async function query(text, params) {
  const client = await getPool().connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// ── User queries ────────────────────────────────────────────────────


export async function findUserByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email.toLowerCase()]
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const { rows } = await query(
    'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  )
  return rows[0] ?? null
}

export async function updateUser(id, fields) {
  const allowed = ['name', 'password_hash', 'avatar_url']
  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k))
  if (!updates.length) return null
  const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = updates.map(([, v]) => v)
  const { rows } = await query(
    `UPDATE users SET ${setClauses} WHERE id = $1
     RETURNING id, name, email, role, avatar_url, created_at`,
    [id, ...values]
  )
  return rows[0] ?? null
}

export async function getUserWithHash(id) {
  const { rows } = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE id = $1 LIMIT 1',
    [id]
  )
  return rows[0] ?? null
}

export async function createUser({ name, email, passwordHash, verificationToken, verificationExpires }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, email_verified, verification_token, verification_expires)
     VALUES ($1, $2, $3, FALSE, $4, $5)
     RETURNING id, name, email, role, created_at`,
    [name, email.toLowerCase(), passwordHash, verificationToken ?? null, verificationExpires ?? null]
  )
  return rows[0]
}

// ── Email verification ───────────────────────────────────────────────

export async function setVerificationToken(userId, token, expires) {
  await query(
    `UPDATE users SET verification_token = $2, verification_expires = $3 WHERE id = $1`,
    [userId, token, expires]
  )
}

export async function verifyEmailToken(token) {
  const { rows } = await query(
    `UPDATE users
     SET email_verified = TRUE, verification_token = NULL, verification_expires = NULL
     WHERE verification_token = $1
       AND verification_expires > NOW()
       AND email_verified = FALSE
     RETURNING id, name, email`,
    [token]
  )
  return rows[0] ?? null
}

export async function findUserByVerificationToken(token) {
  const { rows } = await query(
    `SELECT id, email, email_verified FROM users
     WHERE verification_token = $1 AND verification_expires > NOW()
     LIMIT 1`,
    [token]
  )
  return rows[0] ?? null
}

// ── Password reset ───────────────────────────────────────────────────

export async function createPasswordResetToken(userId, token, expiresAt) {
  // Invalidate any previous unused tokens for this user
  await query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
    [userId]
  )
  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  )
}

export async function verifyPasswordResetToken(token) {
  const { rows } = await query(
    `SELECT prt.id AS token_id, prt.user_id, u.email
     FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id
     WHERE prt.token = $1
       AND prt.used = FALSE
       AND prt.expires_at > NOW()
     LIMIT 1`,
    [token]
  )
  return rows[0] ?? null
}

export async function consumePasswordResetToken(tokenId, userId, newPasswordHash) {
  await query(
    `UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`,
    [tokenId]
  )
  await query(
    `UPDATE users SET password_hash = $2 WHERE id = $1`,
    [userId, newPasswordHash]
  )
}

// ── Conversation queries ─────────────────────────────────────────────

export async function getUserConversations(userId) {
  const { rows } = await query(
    `SELECT c.id, c.title, c.created_at, c.updated_at,
            COUNT(m.id)::int AS message_count
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.updated_at DESC`,
    [userId]
  )
  return rows
}

export async function getOrCreateConversation(userId) {
  const { rows } = await query(
    `SELECT id, title FROM conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  )
  if (rows[0]) return rows[0]

  const { rows: created } = await query(
    `INSERT INTO conversations (user_id, title)
     VALUES ($1, 'New conversation')
     RETURNING id, title`,
    [userId]
  )
  return created[0]
}

export async function createConversation(userId, title = 'New conversation') {
  const { rows } = await query(
    `INSERT INTO conversations (user_id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at, updated_at`,
    [userId, title]
  )
  return rows[0]
}

export async function deleteConversation(id, userId) {
  await query(
    'DELETE FROM conversations WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
}

export async function getConversationMessages(conversationId, userId, limit = 50) {
  const { rows } = await query(
    `SELECT m.id, m.role, m.content, m.created_at
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE m.conversation_id = $1 AND c.user_id = $2
     ORDER BY m.created_at ASC
     LIMIT $3`,
    [conversationId, userId, limit]
  )
  return rows
}

// ── User context queries ─────────────────────────────────────────────

export const CONTEXT_LIMIT = 40
export const CONTEXT_WARN_AT = 35

export async function getUserContext(userId) {
  const { rows } = await query(
    `INSERT INTO user_context (user_id, items)
     VALUES ($1, '[]')
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING items`,
    [userId]
  )
  return rows[0].items
}

export async function getContextCount(userId) {
  const { rows } = await query(
    `SELECT COALESCE(jsonb_array_length(items), 0) AS count
     FROM user_context
     WHERE user_id = $1`,
    [userId]
  )
  return rows[0]?.count ?? 0
}

export async function appendContextItem(userId, text, sourceConvId = null) {
  const item = JSON.stringify({
    id: crypto.randomUUID(),
    text,
    source_conv_id: sourceConvId,
    created_at: new Date().toISOString(),
  })

  await query(
    `INSERT INTO user_context (user_id, items, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE
       SET items = CASE
             WHEN jsonb_array_length(user_context.items) >= ${CONTEXT_LIMIT}
             THEN user_context.items
             ELSE user_context.items || $2::jsonb
           END,
           updated_at = NOW()`,
    [userId, `[${item}]`]
  )
}

export async function removeContextItem(userId, itemId) {
  await query(
    `UPDATE user_context
     SET items = (
       SELECT COALESCE(jsonb_agg(el ORDER BY (el->>'created_at')), '[]'::jsonb)
       FROM jsonb_array_elements(items) el
       WHERE el->>'id' != $2
     ),
     updated_at = NOW()
     WHERE user_id = $1`,
    [userId, itemId]
  )
}

export async function clearUserContext(userId) {
  await query(
    `UPDATE user_context SET items = '[]', updated_at = NOW() WHERE user_id = $1`,
    [userId]
  )
}

// ── Message queries ──────────────────────────────────────────────────

export async function getMessages(conversationId, limit = 50) {
  const { rows } = await query(
    `SELECT id, role, content, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [conversationId, limit]
  )
  return rows
}

export async function saveMessage(conversationId, role, content) {
  const { rows } = await query(
    `INSERT INTO messages (conversation_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING id, role, content, created_at`,
    [conversationId, role, content]
  )
  // Keep conversation updated_at fresh
  await query(
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
  )
  return rows[0]
}

// ── Project queries ──────────────────────────────────────────────────

export async function getProjects(userId) {
  const { rows } = await query(
    `SELECT p.id, p.name, p.description, p.status, p.created_at,
            COUNT(t.id)::int AS task_count
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.owner_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId]
  )
  return rows
}

export async function getProject(id, ownerId) {
  const { rows } = await query(
    `SELECT id, name, description, status, created_at
     FROM projects
     WHERE id = $1 AND owner_id = $2
     LIMIT 1`,
    [id, ownerId]
  )
  return rows[0] ?? null
}

export async function createProject({ ownerId, name, description }) {
  const { rows } = await query(
    `INSERT INTO projects (owner_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, description, status, created_at`,
    [ownerId, name, description ?? null]
  )
  return rows[0]
}

export async function updateProject(id, ownerId, fields) {
  const allowed = ['name', 'description', 'status']
  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k))
  if (!updates.length) return null
  const setClauses = updates.map(([k], i) => `${k} = $${i + 3}`).join(', ')
  const values = updates.map(([, v]) => v)
  const { rows } = await query(
    `UPDATE projects SET ${setClauses} WHERE id = $1 AND owner_id = $2
     RETURNING id, name, description, status, created_at`,
    [id, ownerId, ...values]
  )
  return rows[0] ?? null
}

export async function deleteProject(id, ownerId) {
  await query('DELETE FROM projects WHERE id = $1 AND owner_id = $2', [id, ownerId])
}

// ── Task queries ─────────────────────────────────────────────────────

export async function getTasks(userId, projectId = null) {
  const params = [userId]
  let filter = 'WHERE t.creator_id = $1'
  if (projectId) {
    params.push(projectId)
    filter += ' AND t.project_id = $2'
  }
  const { rows } = await query(
    `SELECT t.id, t.title, t.description, t.status, t.priority,
            t.due_date, t.position, t.project_id, t.created_at, t.updated_at,
            u.name AS assignee_name, u.id AS assignee_id
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     ${filter}
     ORDER BY t.status, t.position ASC, t.created_at DESC`,
    params
  )
  return rows
}

export async function getTasksForAiContext(userId, projectIds = null) {
  const hasFilter = Array.isArray(projectIds) && projectIds.length > 0
  const { rows } = await query(
    `SELECT t.title, t.status, t.priority,
            t.due_date::text, t.project_id,
            p.name AS project_name
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     WHERE t.creator_id = $1
     ${hasFilter ? 'AND t.project_id = ANY($2::uuid[])' : ''}
     ORDER BY t.project_id NULLS LAST, t.created_at DESC
     LIMIT 80`,
    hasFilter ? [userId, projectIds] : [userId]
  )
  return rows
}

export async function createTask({ creatorId, title, description, status, priority, dueDate, projectId }) {
  const { rows } = await query(
    `INSERT INTO tasks (creator_id, title, description, status, priority, due_date, project_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, description, status, priority, due_date, position, project_id, created_at`,
    [creatorId, title, description ?? null, status ?? 'todo', priority ?? 'medium', dueDate ?? null, projectId ?? null]
  )
  return rows[0]
}

export async function updateTask(id, fields) {
  const allowed = ['title', 'description', 'status', 'priority', 'due_date', 'assignee_id', 'position']
  const updates = Object.entries(fields).filter(([k]) => allowed.includes(k))
  if (!updates.length) return null

  const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = updates.map(([, v]) => v)

  const { rows } = await query(
    `UPDATE tasks SET ${setClauses} WHERE id = $1
     RETURNING id, title, description, status, priority, due_date, position, assignee_id, updated_at`,
    [id, ...values]
  )
  return rows[0] ?? null
}

export async function deleteTask(id, creatorId) {
  await query('DELETE FROM tasks WHERE id = $1 AND creator_id = $2', [id, creatorId])
}

// ── Dashboard queries ────────────────────────────────────────────────

export async function getDashboardStats(userId) {
  const { rows } = await query(
    `SELECT
       COUNT(*)                                                               AS total,
       COUNT(*) FILTER (WHERE status NOT IN ('completed'))                   AS active,
       COUNT(*) FILTER (WHERE status = 'in_progress')                       AS in_progress,
       COUNT(*) FILTER (WHERE status = 'blocked')                           AS blocked,
       COUNT(*) FILTER (WHERE status = 'completed')                         AS completed,
       COUNT(*) FILTER (WHERE status = 'completed'
                          AND updated_at >= NOW() - INTERVAL '7 days')      AS completed_week,
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE
                          AND status NOT IN ('completed'))                   AS overdue,
       COUNT(*) FILTER (WHERE status = 'backlog')                           AS backlog,
       COUNT(*) FILTER (WHERE status = 'todo')                              AS todo,
       COUNT(*) FILTER (WHERE status = 'review')                            AS review,
       COUNT(*) FILTER (WHERE priority = 'critical')                        AS critical,
       COUNT(*) FILTER (WHERE priority = 'high')                            AS high,
       COUNT(*) FILTER (WHERE priority = 'medium')                          AS medium,
       COUNT(*) FILTER (WHERE priority = 'low')                             AS low
     FROM tasks
     WHERE creator_id = $1`,
    [userId]
  )
  // pg returns strings for COUNT — cast to integers
  const r = rows[0]
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, parseInt(v, 10)]))
}

export async function getOverdueTasks(userId, limit = 5) {
  const { rows } = await query(
    `SELECT id, title, priority, due_date, status
     FROM tasks
     WHERE creator_id = $1
       AND due_date < CURRENT_DATE
       AND status NOT IN ('completed')
     ORDER BY due_date ASC
     LIMIT $2`,
    [userId, limit]
  )
  return rows
}

// ── Notification queries ─────────────────────────────────────────────

export async function getNotifications(userId, limit = 50) {
  const { rows } = await query(
    `SELECT id, type, title, body, href, read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  )
  return rows
}

export async function getUnreadCount(userId) {
  const { rows } = await query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read = FALSE',
    [userId]
  )
  return parseInt(rows[0].count, 10)
}

export async function createNotification({ userId, type, title, body = null, href = null }) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, type, title, body, href)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, title, body, href, read, created_at`,
    [userId, type, title, body, href]
  )
  return rows[0]
}

export async function markNotificationsRead(userId, ids = null) {
  if (ids?.length) {
    await query(
      `UPDATE notifications SET read = TRUE
       WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, ids]
    )
  } else {
    await query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1',
      [userId]
    )
  }
}

export async function deleteNotifications(userId, ids = null) {
  if (ids?.length) {
    await query(
      'DELETE FROM notifications WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, ids]
    )
  } else {
    await query('DELETE FROM notifications WHERE user_id = $1', [userId])
  }
}
