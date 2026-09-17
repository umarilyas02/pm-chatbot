import { getSession } from '@/lib/session'
import { savePushSubscription } from '@/lib/db'

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await request.json().catch(() => null)

  if (!subscription || !subscription.endpoint) {
    return Response.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await savePushSubscription(session.userId, subscription)
  return Response.json({ ok: true })
}