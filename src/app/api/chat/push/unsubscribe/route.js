import { getSession } from '@/lib/session'
import { removePushSubscription } from '@/lib/db'

export async function DELETE(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return Response.json({ error: 'endpoint required' }, { status: 400 })
  }

  await removePushSubscription(endpoint)
  return Response.json({ ok: true })
}