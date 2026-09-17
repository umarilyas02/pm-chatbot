import { getSession } from '@/lib/session'
import { getRoomById, getRoomMembers, isRoomMember } from '@/lib/db'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const room = await getRoomById(id)
  if (!room) {
    return Response.json({ error: 'Room not found' }, { status: 404 })
  }

  const members = await getRoomMembers(id)

  return Response.json({ room, members })
}