import pg from 'pg'

const { Pool } = pg

let pool

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
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

export async function createUser({ name, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, role, created_at`,
    [name, email.toLowerCase(), passwordHash]
  )
  return rows[0]
}

// ── Conversation queries ─────────────────────────────────────────────

export async function getOrCreateConversation(userId) {
  // Return the most recent conversation, or create one
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
     RETURNING id, title`,
    [userId, title]
  )
  return rows[0]
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

// ── Task queries ─────────────────────────────────────────────────────

export async function getTasks(userId) {
  const { rows } = await query(
    `SELECT t.id, t.title, t.description, t.status, t.priority,
            t.due_date, t.position, t.project_id, t.created_at, t.updated_at,
            u.name AS assignee_name, u.id AS assignee_id
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.creator_id = $1
     ORDER BY t.status, t.position ASC, t.created_at DESC`,
    [userId]
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
