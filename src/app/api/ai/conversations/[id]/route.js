import { getSession } from '@/lib/session'
import { deleteConversation, getConversationMessages } from '@/lib/db'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const messages = await getConversationMessages(id, session.userId, 50)
  return Response.json({ messages })
}

export async function DELETE(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteConversation(id, session.userId)
  return Response.json({ ok: true })
}
