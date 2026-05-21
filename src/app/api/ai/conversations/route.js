import { getSession } from '@/lib/session'
import { getUserConversations, createConversation } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const conversations = await getUserConversations(session.userId)
  return Response.json({ conversations })
}

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const title = body.title?.trim() || 'New conversation'

  const conversation = await createConversation(session.userId, title)
  return Response.json({ conversation }, { status: 201 })
}
