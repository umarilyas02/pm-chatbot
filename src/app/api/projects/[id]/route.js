import { getSession } from '@/lib/session'
import { updateProject, deleteProject, getPrimaryWorkspace } from '@/lib/db'

export async function PATCH(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace || workspace.owner_id !== session.userId) {
    return Response.json({ error: 'Only the workspace owner can edit projects' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const updated = await updateProject(id, session.userId, body)
  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(updated)
}

export async function DELETE(_, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace || workspace.owner_id !== session.userId) {
    return Response.json({ error: 'Only the workspace owner can delete projects' }, { status: 403 })
  }

  const { id } = await params
  await deleteProject(id, session.userId)
  return new Response(null, { status: 204 })
}
