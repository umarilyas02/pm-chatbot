import { getSession } from '@/lib/session'
import { getPrimaryWorkspace, getWorkspaceMembers, removeWorkspaceMember, isWorkspaceMember } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace) return Response.json([], { status: 200 })

  const members = await getWorkspaceMembers(workspace.id)
  return Response.json(members)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await request.json()
  if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 })

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace) return Response.json({ error: 'No workspace' }, { status: 404 })

  // Only the owner can remove members; owners cannot remove themselves
  if (workspace.owner_id !== session.userId) {
    return Response.json({ error: 'Only the workspace owner can remove members' }, { status: 403 })
  }
  if (userId === session.userId) {
    return Response.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }

  const isMember = await isWorkspaceMember(workspace.id, userId)
  if (!isMember) return Response.json({ error: 'User is not a member' }, { status: 404 })

  await removeWorkspaceMember(workspace.id, userId)
  return new Response(null, { status: 204 })
}
