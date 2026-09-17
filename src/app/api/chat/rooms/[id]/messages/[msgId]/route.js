import { getSession } from '@/lib/session'
import { isRoomMember, editChatMessage, deleteChatMessage, getMessageById } from '@/lib/db'
import { broadcast } from '@/lib/sse'

export async function PUT(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, msgId } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const message = await getMessageById(msgId)
  if (!message || message.room_id !== id) {
    return Response.json({ error: 'Message not found' }, { status: 404 })
  }

  if (message.sender_id !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const content = body.content?.trim()

  if (!content) {
    return Response.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  if (content.length > 5000) {
    return Response.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 })
  }

  const updated = await editChatMessage(msgId, session.userId, content)
  if (!updated) {
    return Response.json({ error: 'Message not found' }, { status: 404 })
  }

  const payload = {
    type: 'message:edited',
    message: {
      id: updated.id,
      content: updated.content,
      edited_at: updated.edited_at,
    },
  }
  broadcast(id, payload)

  return Response.json({ message: updated })
}

export async function DELETE(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, msgId } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const message = await getMessageById(msgId)
  if (!message || message.room_id !== id) {
    return Response.json({ error: 'Message not found' }, { status: 404 })
  }

  if (message.sender_id !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deleted = await deleteChatMessage(msgId, session.userId)
  if (!deleted) {
    return Response.json({ error: 'Delete window expired (30 seconds)' }, { status: 403 })
  }

  const payload = {
    type: 'message:deleted',
    message: { id: deleted.id },
  }
  broadcast(id, payload)

  return Response.json({ ok: true })
}