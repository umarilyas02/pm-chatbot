import { getSession } from '@/lib/session'
import { getUserRooms, getOrCreateDirectRoom, getOrCreateProjectRoom, isWorkspaceMember, getWorkspaceMemberRole, getWorkspaceMembers } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const rooms = await getUserRooms(session.userId)
  return Response.json({ rooms })
}

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { targetUserId, projectId } = body

  if (projectId) {
    const room = await getOrCreateProjectRoom(projectId)
    return Response.json({ room }, { status: 201 })
  }

  if (targetUserId) {
    if (targetUserId === session.userId) {
      return Response.json({ error: 'Cannot create DM with yourself' }, { status: 400 })
    }
    const room = await getOrCreateDirectRoom(session.userId, targetUserId)
    if (!room) {
      return Response.json({ error: 'User not in same workspace' }, { status: 400 })
    }
    return Response.json({ room }, { status: 201 })
  }

  return Response.json({ error: 'targetUserId or projectId required' }, { status: 400 })
}