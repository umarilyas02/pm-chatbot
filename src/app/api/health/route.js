import { query } from '@/lib/db'

export async function GET() {
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
