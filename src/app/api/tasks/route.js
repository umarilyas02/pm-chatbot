import { getSession } from '@/lib/session'
import { getTasks, createTask, createNotification } from '@/lib/db'
import { broadcast } from '@/lib/sse'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const tasks = await getTasks(session.userId)
  return Response.json(tasks)
}

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, description, status, priority, due_date, project_id } = body

  if (!title?.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }

  const task = await createTask({
    creatorId: session.userId,
    title: title.trim(),
    description: description?.trim() || null,
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate: due_date || null,
    projectId: project_id || null,
  })

  if (task.priority === 'critical' || task.priority === 'high') {
    await createNotification({
      userId: session.userId,
      type: 'task_created',
      title: `${task.priority === 'critical' ? 'Critical' : 'High priority'} task created`,
      body: task.title,
      href: '/board',
    })
  }

  broadcast(session.userId, { type: 'task:created', task })

  return Response.json(task, { status: 201 })
}
