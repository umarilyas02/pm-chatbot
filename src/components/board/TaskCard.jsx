import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CalendarDays, AlertCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY = {
  critical: { label: 'Critical', cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
  high:     { label: 'High',     cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  medium:   { label: 'Medium',   cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  low:      { label: 'Low',      cls: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export default function TaskCard({ task, onDelete, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useDraggable({ id: task.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const p = PRIORITY[task.priority] ?? PRIORITY.medium
  const overdue = isOverdue(task.due_date)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border border-white/[0.06] bg-[#1e293b] p-3.5 cursor-pointer',
        'transition-all duration-150 hover:border-white/[0.12] hover:bg-[#263548]',
        isDragging && 'shadow-2xl ring-1 ring-[#22c55e]/30'
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 cursor-grab text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="pl-4">
        {/* Priority badge */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              p.cls
            )}
          >
            {task.priority === 'critical' && <AlertCircle className="mr-1 h-2.5 w-2.5" />}
            {p.label}
          </span>

          {/* Delete */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            className="rounded p-0.5 text-slate-700 transition-colors hover:text-red-400 md:hidden md:group-hover:block cursor-pointer"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug text-[#f8fafc] line-clamp-2">
          {task.title}
        </p>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {task.due_date ? (
            <span
              className={cn(
                'flex items-center gap-1 text-[11px]',
                overdue ? 'text-red-400' : 'text-slate-500'
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          ) : (
            <span />
          )}

          {task.assignee_name && (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22c55e]/20 text-[10px] font-semibold text-[#22c55e]"
              title={task.assignee_name}
            >
              {task.assignee_name[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
