import { getSession } from '@/lib/session'
import { isRoomMember, getActiveMeeting, createMeeting } from '@/lib/db'
import { broadcast } from '@/lib/sse'

export async function GET(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const meeting = await getActiveMeeting(id)
  return Response.json({ meeting })
}

export async function POST(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const member = await isRoomMember(id, session.userId)
  if (!member) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const existing = await getActiveMeeting(id)
  if (existing) {
    return Response.json({ error: 'Meeting already in progress' }, { status: 409 })
  }

  const body = await request.json().catch(() => ({}))
  const type = body.type

  if (type !== 'video' && type !== 'audio') {
    return Response.json({ error: 'Invalid meeting type (video or audio)' }, { status: 400 })
  }

  const meeting = await createMeeting(id, session.userId, type)

  const payload = {
    type: 'meeting:started',
    meeting: {
      id: meeting.id,
      created_by: meeting.created_by,
      type: meeting.type,
    },
  }
  broadcast(id, payload)

  return Response.json({ meeting }, { status: 201 })
}