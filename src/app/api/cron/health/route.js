import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true
  // Custom caller sends x-cron-secret header
  const customHeader = request.headers.get('x-cron-secret')
  return customHeader === secret
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  try {
    await query('SELECT 1')
    return Response.json({
      status: 'ok',
      db: 'ok',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json(
      {
        status: 'degraded',
        db: 'error',
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
