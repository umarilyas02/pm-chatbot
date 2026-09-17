import { getSession } from '@/lib/session'
import { isRoomMember, getRoomMessages, createChatMessage, getMessageById } from '@/lib/db'
import { broadcast } from '@/lib/sse'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  const messages = await getRoomMessages(id, cursor, Math.min(limit, 100))
  return Response.json({ messages })
}

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
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

  const message = await createChatMessage(id, session.userId, content)

  const payload = {
    type: 'message:new',
    message: {
      id: message.id,
      sender_id: message.sender_id,
      sender_name: session.userId,
      content: message.content,
      created_at: message.created_at,
    },
  }
  broadcast(id, payload)

  return Response.json({ message }, { status: 201 })
}