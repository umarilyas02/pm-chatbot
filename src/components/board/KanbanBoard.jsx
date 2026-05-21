'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'

const COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'blocked', 'completed']

const COL_META = {
  backlog:     { label: 'Backlog',     dot: 'bg-slate-500' },
  todo:        { label: 'Todo',        dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', dot: 'bg-violet-400' },
  review:      { label: 'Review',      dot: 'bg-yellow-400' },
  blocked:     { label: 'Blocked',     dot: 'bg-red-400' },
  completed:   { label: 'Done',        dot: 'bg-[#22c55e]' },
}

export default function KanbanBoard({ initialTasks, projectId = null }) {
  const [tasks, setTasks]           = useState(initialTasks)
  const [members, setMembers]       = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [modal, setModal]           = useState({ open: false, status: 'todo', task: null })
  const [saving, setSaving]         = useState(false)
  const [mobileCol, setMobileCol]   = useState('todo')
  const sseRef                      = useRef(null)
  const reconnectTimer              = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Fetch workspace members for assignee picker ──────────────────────

  useEffect(() => {
    fetch('/api/workspace/members')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMembers(data))
      .catch(() => {})
  }, [])

  // ── SSE real-time board updates ─────────────────────────────────────

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/realtime/board')
      sseRef.current = es

      es.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'task:created') {
          setTasks((prev) =>
            prev.some((t) => t.id === data.task.id) ? prev : [...prev, data.task]
          )
        } else if (data.type === 'task:updated') {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === data.task.id)
            return exists
              ? prev.map((t) => (t.id === data.task.id ? { ...t, ...data.task } : t))
              : [...prev, data.task]
          })
        } else if (data.type === 'task:deleted') {
          setTasks((prev) => prev.filter((t) => t.id !== data.taskId))
        }
      }

      es.onerror = () => {
        es.close()
        sseRef.current = null
        reconnectTimer.current = setTimeout(connect, 5_000)
      }
    }

    connect()

    return () => {
      sseRef.current?.close()
      clearTimeout(reconnectTimer.current)
    }
  }, [])

  // ── Drag ────────────────────────────────────────────────────────────

  function handleDragStart({ active }) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over || active.id === over.id) return
    const newStatus = over.id
    if (!COLUMNS.includes(newStatus)) return
    const task = tasks.find((t) => t.id === active.id)
    if (!task || task.status === newStatus) return

    setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)))
    fetch(`/api/tasks/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {
      setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: task.status } : t)))
      toast.error('Failed to move task')
    })
  }

  // ── CRUD ────────────────────────────────────────────────────────────

  const byStatus = useCallback((status) => tasks.filter((t) => t.status === status), [tasks])

  function openCreate(status) { setModal({ open: true, status, task: null }) }
  function openEdit(task)     { setModal({ open: true, status: task.status, task }) }
  function closeModal()       { setModal((m) => ({ ...m, open: false })) }

  async function handleSave(data) {
    setSaving(true)
    try {
      if (modal.task) {
        const res = await fetch(`/api/tasks/${modal.task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
        toast.success('Task updated')
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, status: data.status || modal.status, project_id: projectId }),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        setTasks((prev) => [...prev, created])
        toast.success('Task created')
      }
      closeModal()
    } catch {
      toast.error('Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    toast.success('Task deleted')
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* ── Mobile: tab bar + single-column list ─────────────────── */}
        <div className="flex h-full flex-col md:hidden">
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {COLUMNS.map((status) => {
              const meta  = COL_META[status]
              const count = byStatus(status).length
              const active = mobileCol === status
              return (
                <button
                  key={status}
                  onClick={() => setMobileCol(status)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-white/[0.06] text-[#f8fafc]'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', meta.dot)} />
                  {meta.label}
                  <span className={cn('font-mono text-[10px]', active ? 'text-slate-400' : 'text-slate-700')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {byStatus(mobileCol).length > 0 ? (
              <div className="space-y-2.5">
                {byStatus(mobileCol).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={handleDelete}
                    onClick={() => openEdit(task)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <div className={cn('h-2.5 w-2.5 rounded-full', COL_META[mobileCol].dot, 'opacity-30')} />
                <p className="text-sm text-slate-600">No tasks in {COL_META[mobileCol].label}</p>
              </div>
            )}

            <button
              onClick={() => openCreate(mobileCol)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.07] py-3.5 text-xs text-slate-600 transition-colors hover:border-[#22c55e]/20 hover:text-slate-400 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task to {COL_META[mobileCol].label}
            </button>
          </div>
        </div>

        {/* ── Desktop: horizontal DnD kanban ───────────────────────── */}
        <div className="hidden h-full md:flex gap-4 overflow-x-auto px-6 py-5 pb-8">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={byStatus(status)}
              onAddTask={openCreate}
              onDeleteTask={handleDelete}
              onClickTask={openEdit}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-1 scale-105 opacity-95">
              <TaskCard task={activeTask} onDelete={() => {}} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={modal.open}
        onClose={closeModal}
        onSave={handleSave}
        defaultStatus={modal.status}
        task={modal.task}
        saving={saving}
        members={members}
      />
    </>
  )
}
