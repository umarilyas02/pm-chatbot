import { getSession } from '@/lib/session'
import { getProjectByWorkspaceMember, getProjectTasks } from '@/lib/db'
import KanbanBoard from '@/components/board/KanbanBoard'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export async function generateMetadata({ params }) {
  const { id } = await params
  return { title: 'Board — CreateX' }
}

export default async function ProjectBoardPage({ params }) {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const { id } = await params
  const project = await getProjectByWorkspaceMember(id, session.userId)
  if (!project) notFound()

  const tasks = await getProjectTasks(id)

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
    <div className="flex h-full flex-col">
      {/* Project breadcrumb bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-5 py-3">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
        <span className="text-slate-700">/</span>
        <span className="font-mono text-sm font-semibold text-[#f8fafc]">{project.name}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard initialTasks={serialized} projectId={id} />
      </div>
    </div>
  )
}
