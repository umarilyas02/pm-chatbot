'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { toast } from 'sonner'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'

const COLUMNS = ['backlog', 'todo', 'in_progress', 'review', 'blocked', 'completed']

export default function KanbanBoard({ initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTask, setActiveTask] = useState(null)
  const [modal, setModal] = useState({ open: false, status: 'todo', task: null })
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Drag handlers ──────────────────────────────────────────────────

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

    // Optimistic update
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

  // ── Task CRUD ─────────────────────────────────────────────────────

  function openCreate(status) {
    setModal({ open: true, status, task: null })
  }

  function openEdit(task) {
    setModal({ open: true, status: task.status, task })
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }))
  }

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
          body: JSON.stringify({ ...data, status: data.status || modal.status }),
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

  // ── Render ────────────────────────────────────────────────────────

  const byStatus = useCallback(
    (status) => tasks.filter((t) => t.status === status),
    [tasks]
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto px-6 py-5 pb-8">
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
      />
    </>
  )
}
