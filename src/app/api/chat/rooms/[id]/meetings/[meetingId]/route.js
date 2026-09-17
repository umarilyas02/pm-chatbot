import { getSession } from '@/lib/session'
import { isRoomMember, endMeeting } from '@/lib/db'
import { broadcast } from '@/lib/sse'

export async function PUT(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, meetingId } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const ended = await endMeeting(meetingId)
  if (!ended) {
    return Response.json({ error: 'Meeting not found or already ended' }, { status: 404 })
  }

  const payload = {
    type: 'meeting:ended',
    meeting: { id: ended.id },
  }
  broadcast(id, payload)

  return Response.json({ ok: true })
}