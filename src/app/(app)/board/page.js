import { getSession } from '@/lib/session'
import { getTasks } from '@/lib/db'
import KanbanBoard from '@/components/board/KanbanBoard'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Board — CreateX' }

export default async function BoardPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const tasks = await getTasks(session.userId)

  // Serialize dates for the client component
  const serialized = tasks.map((t) => ({
    id:            t.id,
    title:         t.title,
    description:   t.description,
    status:        t.status,
    priority:      t.priority,
    due_date:      t.due_date ? String(t.due_date).slice(0, 10) : null,
    position:      t.position,
    assignee_id:   t.assignee_id ?? null,
    assignee_name: t.assignee_name ?? null,
  }))

  return (
    <div className="h-full">
      <KanbanBoard initialTasks={serialized} />
    </div>
  )
}
