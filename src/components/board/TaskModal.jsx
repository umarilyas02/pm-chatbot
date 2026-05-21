'use client'

import { useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'blocked', 'completed']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

const STATUS_LABELS = {
  backlog: 'Backlog', todo: 'Todo', in_progress: 'In Progress',
  review: 'Review', blocked: 'Blocked', completed: 'Completed',
}

export default function TaskModal({ open, onClose, onSave, defaultStatus = 'todo', task = null, saving = false }) {
  const titleRef = useRef(null)

  // Focus title on open
  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 50)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      title:       fd.get('title'),
      description: fd.get('description') || null,
      status:      fd.get('status'),
      priority:    fd.get('priority'),
      due_date:    fd.get('due_date') || null,
    })
  }

  const inputCls =
    'w-full rounded-lg border border-white/[0.08] bg-[#020617] px-3 py-2 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/30 focus:ring-1 focus:ring-[#22c55e]/20'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0f172a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold text-[#f8fafc]">
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-[#f8fafc] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              name="title"
              required
              defaultValue={task?.title ?? ''}
              placeholder="What needs to be done?"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={task?.description ?? ''}
              placeholder="Optional details…"
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Status</label>
              <select name="status" defaultValue={task?.status ?? defaultStatus} className={inputCls}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Priority</label>
              <select name="priority" defaultValue={task?.priority ?? 'medium'} className={inputCls}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Due date</label>
            <input
              type="date"
              name="due_date"
              defaultValue={task?.due_date?.slice(0, 10) ?? ''}
              className={cn(inputCls, 'dark:[color-scheme:dark]')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-[#f8fafc] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
