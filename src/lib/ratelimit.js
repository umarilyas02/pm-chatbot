// In-memory sliding-window rate limiter.
// Works for single-instance / single-process deployments (Railway, Render, Fly, self-hosted).
// For multi-instance or serverless (Vercel): replace `store` with an Upstash Redis client.

const store = globalThis.__rateLimitStore ?? (globalThis.__rateLimitStore = new Map())

if (!globalThis.__rateLimitCleanup) {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now - entry.windowStart > entry.windowMs * 2) store.delete(key)
    }
  }, 60_000)
  timer.unref?.()
  globalThis.__rateLimitCleanup = timer
}

/**
 * @param {string} key      — unique identifier e.g. `login:192.168.1.1`
 * @param {{ limit: number, windowMs: number }} opts
 * @returns {{ ok: boolean, remaining: number, retryAfter?: number }}
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now, windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { ok: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count }
}
