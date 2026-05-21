'use client'

import { useState } from 'react'
import { Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  creating,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  async function handleDelete(e, conv) {
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(conv.id)
    try {
      await onDelete(conv.id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col border-r border-white/[0.06] bg-[#080f1a] transition-all duration-200',
        collapsed ? 'w-12' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-3">
        {!collapsed && (
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-500">
            Chats
          </span>
        )}
        <div className={cn('flex items-center gap-1', collapsed && 'w-full justify-center')}>
          {!collapsed && (
            <button
              onClick={onCreate}
              disabled={creating}
              title="New chat"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-[#22c55e] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* New chat button when collapsed */}
      {collapsed && (
        <div className="flex justify-center border-b border-white/[0.06] py-2">
          <button
            onClick={onCreate}
            disabled={creating}
            title="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-[#22c55e] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && !collapsed && (
          <p className="px-3 py-6 text-center text-xs text-slate-600">No chats yet</p>
        )}
        {conversations.map((conv) => {
          const isActive = conv.id === activeId
          const isDeleting = deletingId === conv.id

          if (collapsed) {
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                title={conv.title}
                className={cn(
                  'flex w-full items-center justify-center py-2 transition-colors cursor-pointer',
                  isActive ? 'text-[#22c55e]' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            )
          }

          return (
            <div
              key={conv.id}
              onClick={() => !isDeleting && onSelect(conv)}
              className={cn(
                'group relative mx-2 mb-0.5 flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 transition-colors',
                isActive
                  ? 'bg-[#22c55e]/10 text-[#22c55e]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              )}
            >
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium leading-snug">{conv.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">
                  {conv.message_count} msg · {timeAgo(conv.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv)}
                disabled={isDeleting}
                title="Delete chat"
                className={cn(
                  'shrink-0 rounded p-0.5 opacity-0 transition-all group-hover:opacity-100',
                  isActive ? 'text-[#22c55e]/60 hover:text-red-400' : 'text-slate-600 hover:text-red-400',
                  isDeleting && 'animate-pulse opacity-100'
                )}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
