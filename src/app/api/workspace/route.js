import { getSession } from '@/lib/session'
import { getPrimaryWorkspace, getWorkspaceMembers, getPendingInvites } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace) return Response.json({ error: 'No workspace found' }, { status: 404 })

  const [members, invites] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getPendingInvites(workspace.id),
  ])

  return Response.json({ workspace, members, invites })
}
