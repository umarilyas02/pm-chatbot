// Fixed-window rate limiter.
//
// Uses the Upstash Redis REST API when UPSTASH_REDIS_REST_URL/TOKEN (or Vercel KV's
// KV_REST_API_URL/TOKEN) are configured — this works correctly on Vercel's serverless
// functions since it's a plain HTTPS call, no persistent connection needed, and the
// counters are shared across every instance/region.
//
// Falls back to an in-memory Map when no Redis is configured. That fallback only works
// correctly for a single long-lived process (local dev, or single-instance hosts like
// Railway/Fly) — on Vercel it resets per invocation and does NOT actually rate-limit.

const UPSTASH_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

const memStore = globalThis.__rateLimitStore ?? (globalThis.__rateLimitStore = new Map())

if (!globalThis.__rateLimitCleanup) {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memStore) {
      if (now - entry.windowStart > entry.windowMs * 2) memStore.delete(key)
    }
  }, 60_000)
  timer.unref?.()
  globalThis.__rateLimitCleanup = timer
}

function memoryRateLimit(key, { limit, windowMs }) {
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    memStore.set(key, { count: 1, windowStart: now, windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { ok: false, remaining: 0, retryAfter }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count }
}

async function redisRateLimit(key, { limit, windowMs }) {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
  const redisKey = `ratelimit:${key}`

  let res
  try {
    res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, windowSec, 'NX'],
        ['TTL', redisKey],
      ]),
    })
  } catch (err) {
    console.error('Rate limit: Upstash unreachable, failing open to memory limiter:', err)
    return memoryRateLimit(key, { limit, windowMs })
  }

  if (!res.ok) {
    console.error('Rate limit: Upstash request failed with status', res.status)
    return memoryRateLimit(key, { limit, windowMs })
  }

  const [incr, , ttl] = await res.json()
  const count = incr?.result ?? 0
  const ttlSec = ttl?.result ?? windowSec

  if (count > limit) {
    return { ok: false, remaining: 0, retryAfter: ttlSec > 0 ? ttlSec : windowSec }
  }
  return { ok: true, remaining: Math.max(0, limit - count) }
}

/**
 * @param {string} key      — unique identifier e.g. `login:192.168.1.1`
 * @param {{ limit: number, windowMs: number }} opts
 * @returns {Promise<{ ok: boolean, remaining: number, retryAfter?: number }>}
 */
export async function rateLimit(key, opts) {
  if (UPSTASH_URL && UPSTASH_TOKEN) return redisRateLimit(key, opts)
  return memoryRateLimit(key, opts)
}
