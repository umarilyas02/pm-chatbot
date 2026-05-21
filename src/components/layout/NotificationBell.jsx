'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TYPE_ICON = {
  task_created:       { label: 'Task created',      dot: 'bg-[#22c55e]' },
  task_assigned:      { label: 'Assigned to you',   dot: 'bg-blue-400' },
  task_overdue:       { label: 'Overdue',            dot: 'bg-red-400' },
  task_completed:     { label: 'Completed',          dot: 'bg-[#22c55e]' },
  ai_insight:         { label: 'AI Insight',         dot: 'bg-violet-400' },
  deadline_reminder:  { label: 'Deadline',           dot: 'bg-orange-400' },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      setUnread(data.unread)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({}) })
    toast.success('All notifications marked as read')
  }

  async function clearAll() {
    setNotifications([])
    setUnread(0)
    await fetch('/api/notifications', { method: 'DELETE', body: JSON.stringify({}) })
    toast.success('All notifications cleared')
  }

  async function markOneRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  function handleOpen() {
    setOpen((v) => !v)
    if (!open && unread > 0) {
      setTimeout(markAllRead, 1000)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-[#f8fafc] cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22c55e] px-1 font-mono text-[9px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f172a] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <span className="text-sm font-semibold text-[#f8fafc]">Notifications</span>
            <div className="flex items-center gap-1">
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={markAllRead}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-[#22c55e] cursor-pointer"
                  title="Mark all read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-red-400 cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:text-[#f8fafc] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <Bell className="h-8 w-8 text-slate-700" />
                <p className="text-sm text-slate-600">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_ICON[n.type] ?? { dot: 'bg-slate-500' }
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'group flex gap-3 border-b border-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.02]',
                      !n.read && 'bg-[#22c55e]/[0.03]'
                    )}
                  >
                    <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                      <span className={cn('h-2 w-2 rounded-full', meta.dot, n.read && 'opacity-30')} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs font-medium', n.read ? 'text-slate-400' : 'text-[#f8fafc]')}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-slate-600">{timeAgo(n.created_at)}</p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {n.href && (
                        <Link
                          href={n.href}
                          onClick={() => { markOneRead(n.id); setOpen(false) }}
                          className="hidden rounded p-1 text-slate-600 transition-colors hover:text-[#22c55e] group-hover:flex cursor-pointer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => markOneRead(n.id)}
                          className="hidden rounded p-1 text-slate-600 transition-colors hover:text-[#22c55e] group-hover:flex cursor-pointer"
                          title="Mark read"
                        >
                          <CheckCheck className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-slate-500 transition-colors hover:text-[#22c55e]"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
