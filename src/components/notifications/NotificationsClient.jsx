'use client'

import { useState } from 'react'
import { Bell, Trash2, ExternalLink, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TYPE_META = {
  task_created:      { label: 'Task created',     dot: 'bg-[#22c55e]',  ring: 'bg-[#22c55e]/10' },
  task_assigned:     { label: 'Assigned to you',  dot: 'bg-blue-400',    ring: 'bg-blue-400/10' },
  task_overdue:      { label: 'Overdue',           dot: 'bg-red-400',     ring: 'bg-red-400/10' },
  task_completed:    { label: 'Completed',         dot: 'bg-[#22c55e]',  ring: 'bg-[#22c55e]/10' },
  ai_insight:        { label: 'AI Insight',        dot: 'bg-violet-400',  ring: 'bg-violet-400/10' },
  deadline_reminder: { label: 'Deadline',          dot: 'bg-orange-400',  ring: 'bg-orange-400/10' },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  const days = Math.floor(diff / 86400)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

export default function NotificationsClient({ initialNotifications }) {
  const [items, setItems] = useState(initialNotifications)

  async function deleteOne(id) {
    setItems((prev) => prev.filter((n) => n.id !== id))
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    toast.success('Notification deleted')
  }

  async function clearAll() {
    setItems([])
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    toast.success('All notifications cleared')
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/[0.06] bg-[#0f172a] py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
          <CheckCircle2 className="h-7 w-7 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-slate-600">New notifications will appear here</p>
        </div>
      </div>
    )
  }

  // Group by date
  const groups = {}
  items.forEach((n) => {
    const date = new Date(n.created_at)
    const key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex justify-end">
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-slate-500 transition-colors hover:border-red-400/20 hover:text-red-400 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      {/* Grouped list */}
      {Object.entries(groups).map(([date, group]) => (
        <div key={date}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">{date}</p>
          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0f172a]">
            {group.map((n, i) => {
              const meta = TYPE_META[n.type] ?? { dot: 'bg-slate-500', ring: 'bg-slate-700/20', label: n.type }
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]',
                    i < group.length - 1 && 'border-b border-white/[0.04]'
                  )}
                >
                  {/* Icon */}
                  <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.ring)}>
                    <Bell className={cn('h-3.5 w-3.5', meta.dot.replace('bg-', 'text-'))} />
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#f8fafc]">{n.title}</p>
                      <span className="mt-0.5 shrink-0 text-[11px] text-slate-600 tabular-nums">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{n.body}</p>
                    )}
                    <span
                      className={cn(
                        'mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        meta.ring,
                        meta.dot.replace('bg-', 'text-')
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {n.href && (
                      <Link
                        href={n.href}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:text-[#22c55e] cursor-pointer"
                        title="Go to"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    <button
                      onClick={() => deleteOne(n.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:text-red-400 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
