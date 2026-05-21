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
 * Subscribe to events for a user. Returns an unsubscribe function.
 * @param {string} userId
 * @param {(payload: unknown) => void} callback
 */
export function subscribe(userId, callback) {
  emitter.on(`user:${userId}`, callback)
  return () => emitter.off(`user:${userId}`, callback)
}
