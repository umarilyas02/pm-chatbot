import { getSession } from '@/lib/session'
import { isRoomMember, getMessageById, toggleReaction } from '@/lib/db'
import { broadcast } from '@/lib/sse'

export async function DELETE(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, msgId, emoji } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const message = await getMessageById(msgId)
  if (!message || message.room_id !== id) {
    return Response.json({ error: 'Message not found' }, { status: 404 })
  }

  const result = await toggleReaction(msgId, session.userId, emoji)

  const payload = {
    type: result.added ? 'reaction:added' : 'reaction:removed',
    message_id: msgId,
    user_id: session.userId,
    user_name: session.userId,
    emoji,
  }
  broadcast(id, payload)

  return Response.json({ removed: !result.added, emoji })
}