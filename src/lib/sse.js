// Server-Sent Events broadcast utility.
// Uses a module-level EventEmitter shared across all requests in one Node.js process.
// For multi-instance deployments: replace emitter with a Redis pub/sub channel.

import { EventEmitter } from 'events'

const emitter = globalThis.__sseEmitter ?? (globalThis.__sseEmitter = new EventEmitter())
emitter.setMaxListeners(1000)

/**
 * Broadcast an event to all active SSE connections for a user.
 * @param {string} userId
 * @param {{ type: string, [key: string]: unknown }} payload
 */
export function broadcast(userId, payload) {
  emitter.emit(`user:${userId}`, payload)
}

/**
 * Broadcast an event to all members of a workspace.
 * @param {string[]} userIds
 * @param {{ type: string, [key: string]: unknown }} payload
 */
export function broadcastToUsers(userIds, payload) {
  for (const id of userIds) broadcast(id, payload)
}

/**
 * Broadcast an event to all members of a chat room.
 * Queries room members and broadcasts to each.
 * @param {string} roomId
 * @param {{ type: string, [key: string]: unknown }} payload
 * @param {object} pool - optional pg Pool for query (uses default if not provided)
 */
export async function broadcastToRoom(roomId, payload) {
  const { Pool } = await import('pg')
  const isLocal = process.env.DATABASE_URL?.includes('localhost') ||
                  process.env.DATABASE_URL?.includes('127.0.0.1')
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  })

  try {
    const { rows } = await pool.query(
      `SELECT user_id FROM chat_room_members WHERE room_id = $1`,
      [roomId]
    )
    for (const row of rows) {
      broadcast(row.user_id, payload)
    }
  } finally {
    await pool.end()
  }
}

/**
 * Subscribe to events for a user. Returns an unsubscribe function.
 * @param {string} userId
 * @param {(payload: unknown) => void} callback
 */
export function subscribe(userId, callback) {
  emitter.on(`user:${userId}`, callback)
  return () => emitter.off(`user:${userId}`, callback)
}
