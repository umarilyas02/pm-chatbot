import { getSession } from '@/lib/session'
import { isRoomMember, updateLastRead } from '@/lib/db'

export async function PUT(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await updateLastRead(id, session.userId)
  return Response.json({ ok: true })
}