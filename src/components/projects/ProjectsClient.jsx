'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderKanban, Trash2, ArrowRight, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ProjectModal from './ProjectModal'

export default function ProjectsClient({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects)
  const [modal, setModal] = useState({ open: false, project: null })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave({ name, description }) {
    setSaving(true)
    try {
      if (modal.project) {
        const res = await fetch(`/api/projects/${modal.project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
        toast.success('Project updated')
        setModal({ open: false, project: null })
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        toast.success('Project created')
        setModal({ open: false, project: null })
        router.push(`/projects/${created.id}/board`)
      }
    } catch {
      toast.error('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    setProjects((prev) => prev.filter((p) => p.id !== id))
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  function openEdit(project, e) {
    e.stopPropagation()
    setModal({ open: true, project })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold text-[#f8fafc]">Projects</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <button
          onClick={() => setModal({ open: true, project: null })}
          className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
            <FolderKanban className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">No projects yet</p>
            <p className="mt-0.5 text-xs text-slate-600">Create your first project to get started</p>
          </div>
          <button
            onClick={() => setModal({ open: true, project: null })}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-[#f8fafc] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Create project
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}/board`)}
              className="group relative flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#0f172a] p-4 text-left transition-all hover:border-[#22c55e]/20 hover:bg-[#0f172a]/80 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/10">
                  <FolderKanban className="h-4 w-4 text-[#22c55e]" />
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <div
                    onClick={(e) => openEdit(project, e)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-[#f8fafc] cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label="Edit project"
                  >
                    <Pencil className="h-3 w-3" />
                  </div>
                  <div
                    onClick={(e) => handleDelete(project.id, e)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-3 w-3" />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold text-[#f8fafc]">{project.name}</p>
                {project.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{project.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {project.task_count ?? 0} {project.task_count === 1 ? 'task' : 'tasks'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-700 transition-colors group-hover:text-[#22c55e]" />
              </div>
            </button>
          ))}
        </div>
      )}

      <ProjectModal
        open={modal.open}
        onClose={() => setModal({ open: false, project: null })}
        onSave={handleSave}
        project={modal.project}
        saving={saving}
      />
    </div>
  )
}
