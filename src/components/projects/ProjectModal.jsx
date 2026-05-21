'use client'

import { useEffect, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProjectModal({ open, onClose, onSave, project = null, saving = false }) {
  const nameRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 50)
  }, [open])

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
      name: fd.get('name'),
      description: fd.get('description') || null,
    })
  }

  const inputCls =
    'w-full rounded-lg border border-white/[0.08] bg-[#020617] px-3 py-2 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/30 focus:ring-1 focus:ring-[#22c55e]/20'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-white/[0.08] bg-[#0f172a] p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold text-[#f8fafc]">
            {project ? 'Edit project' : 'New project'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-[#f8fafc] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              name="name"
              required
              defaultValue={project?.name ?? ''}
              placeholder="Project name"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={project?.description ?? ''}
              placeholder="What is this project about?"
              className={cn(inputCls, 'resize-none')}
            />
          </div>

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
              {project ? 'Save changes' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
