'use client'

import { useState, useRef, useEffect } from 'react'
import { FolderOpen, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProjectPicker({ projects, selectedIds, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(id) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  function clearAll() {
    onChange([])
    setOpen(false)
  }

  const label =
    selectedIds.length === 0
      ? 'All projects'
      : selectedIds.length === 1
      ? (projects.find((p) => p.id === selectedIds[0])?.name ?? '1 project')
      : `${selectedIds.length} projects`

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition-colors cursor-pointer',
          selectedIds.length > 0
            ? 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]'
            : 'border-white/[0.06] bg-[#0f172a] text-slate-400 hover:border-white/[0.12] hover:text-slate-300'
        )}
      >
        <FolderOpen className="h-3 w-3" />
        <span>{label}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f172a] shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Focus on projects
            </span>
            {selectedIds.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          {/* Project list */}
          {projects.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-600">No projects yet</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {projects.map((p) => {
                const isSelected = selectedIds.includes(p.id)
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => toggle(p.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-[#22c55e]/10 text-[#22c55e]'
                          : 'text-slate-300 hover:bg-white/[0.04]'
                      )}
                    >
                      {/* Checkbox */}
                      <span
                        className={cn(
                          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border',
                          isSelected
                            ? 'border-[#22c55e] bg-[#22c55e]'
                            : 'border-white/20 bg-transparent'
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                      </span>
                      {/* Name + count */}
                      <span className="flex-1 truncate font-medium">{p.name}</span>
                      <span className="shrink-0 text-[10px] text-slate-600">
                        {p.task_count ?? 0} tasks
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Footer hint */}
          <div className="border-t border-white/[0.06] px-3 py-2 text-[10px] text-slate-600">
            {selectedIds.length === 0
              ? 'Gemini sees all projects'
              : `Gemini focused on ${selectedIds.length === 1 ? 'this project' : 'these projects'}`}
          </div>
        </div>
      )}
    </div>
  )
}
