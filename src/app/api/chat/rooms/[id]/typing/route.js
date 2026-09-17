import { getSession } from '@/lib/session'
import { isRoomMember } from '@/lib/db'
import { broadcastToRoom } from '@/lib/sse'

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const action = body.action

  if (action !== 'start' && action !== 'stop') {
    return Response.json({ error: 'Invalid action' }, { status: 400 })
  }

  const payload = {
    type: action === 'start' ? 'typing:start' : 'typing:stop',
    user_id: session.userId,
    user_name: session.userId,
  }

  await broadcastToRoom(id, payload)

  return Response.json({ ok: true })
}