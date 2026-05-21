import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard'

const COLUMN_META = {
  backlog:     { label: 'Backlog',     dot: 'bg-slate-500' },
  todo:        { label: 'Todo',        dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', dot: 'bg-violet-400' },
  review:      { label: 'Review',      dot: 'bg-yellow-400' },
  blocked:     { label: 'Blocked',     dot: 'bg-red-400' },
  completed:   { label: 'Completed',   dot: 'bg-[#22c55e]' },
}

export default function KanbanColumn({ status, tasks, onAddTask, onDeleteTask, onClickTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = COLUMN_META[status]

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {meta.label}
          </span>
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/[0.06] px-1 text-[10px] font-medium text-slate-500">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white/[0.04] hover:text-[#22c55e] cursor-pointer"
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-xl border border-white/[0.04] p-2 transition-colors',
          isOver ? 'border-[#22c55e]/30 bg-[#22c55e]/[0.03]' : 'bg-[#0f172a]/50'
        )}
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onClick={() => onClickTask(task)}
          />
        ))}

        {tasks.length === 0 && !isOver && (
          <button
            onClick={() => onAddTask(status)}
            className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.06] text-xs text-slate-700 transition-colors hover:border-[#22c55e]/20 hover:text-slate-500 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>
        )}
      </div>
    </div>
  )
}
