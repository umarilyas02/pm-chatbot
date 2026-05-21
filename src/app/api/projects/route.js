import { getSession } from '@/lib/session'
import { getProjects, createProject, getPrimaryWorkspace } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await getProjects(session.userId)
  return Response.json(projects)
}

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace || workspace.owner_id !== session.userId) {
    return Response.json({ error: 'Only the workspace owner can create projects' }, { status: 403 })
  }

  const { name, description } = await request.json()
  if (!name?.trim()) {
    return Response.json({ error: 'Name is required' }, { status: 400 })
  }

  const project = await createProject({
    ownerId: session.userId,
    name: name.trim(),
    description: description?.trim() || null,
  })

  return Response.json(project, { status: 201 })
}
