import { getSession } from '@/lib/session'
import { updateTask, deleteTask } from '@/lib/db'

export async function PATCH(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  // Map snake_case body keys to DB column names
  const fields = {}
  if (body.title !== undefined)       fields.title       = body.title
  if (body.description !== undefined) fields.description = body.description
  if (body.status !== undefined)      fields.status      = body.status
  if (body.priority !== undefined)    fields.priority    = body.priority
  if (body.due_date !== undefined)    fields.due_date    = body.due_date
  if (body.assignee_id !== undefined) fields.assignee_id = body.assignee_id
  if (body.position !== undefined)    fields.position    = body.position

  const task = await updateTask(id, fields)
  if (!task) return Response.json({ error: 'Task not found' }, { status: 404 })

  return Response.json(task)
}

export async function DELETE(request, { params }) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await deleteTask(id, session.userId)
  return new Response(null, { status: 204 })
}
