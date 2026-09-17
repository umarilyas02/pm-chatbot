'use client'

import { useState } from 'react'
import { FolderOpen, User, Clock, BellOff, Bell } from 'lucide-react'

export default function RoomItem({ room, active, currentUserId, onClick, onUpdate }) {
  const [showPushToggle, setShowPushToggle] = useState(false)

  const roomName = room.type === 'direct'
    ? room.last_message_sender_name || 'Direct Message'
    : room.project_name || 'Project'

  const roomSubtitle = room.type === 'direct'
    ? 'Direct message'
    : 'Project chat'

  const timeAgo = room.last_message_at
    ? formatTimeAgo(new Date(room.last_message_at))
    : ''

  const unread = room.unread_count > 0

  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full flex items-start gap-3 px-3 py-2.5 transition-colors ${
          active
            ? 'bg-[#22c55e]/5 border-l-2 border-[#22c55e]'
            : 'hover:bg-white/[0.02]'
        }`}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          room.type === 'project'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-slate-700/50 text-slate-400'
        }`}>
          {room.type === 'project' ? (
            <FolderOpen className="h-4.5 w-4.5" />
          ) : (
            <User className="h-4.5 w-4.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium text-sm text-[#f8fafc]">{roomName}</span>
            {timeAgo && (
              <span className="shrink-0 text-[10px] text-slate-500 font-mono">{timeAgo}</span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="truncate text-xs text-slate-500">{roomSubtitle}</span>
            {room.unread_count > 0 && (
              <span className="shrink-0 flex h-4 min-w-[20px] items-center justify-center rounded-full bg-[#22c55e] px-1.5 text-[10px] font-medium text-[#020617]">
                {room.unread_count > 9 ? '9+' : room.unread_count}
              </span>
            )}
          </div>

          {room.last_message && (
            <div className="truncate mt-1 text-xs text-slate-500">
              {room.last_message}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPushToggle(!showPushToggle)
            }}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/[0.05]"
            aria-label="Notification settings"
          >
            <Bell className="h-4 w-4 text-slate-500" />
          </button>

          {showPushToggle && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-white/[0.06] bg-[#0f172a] py-1.5 shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPushToggle(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/[0.03]"
              >
                <BellOff className="h-4 w-4" />
                Disable push
              </button>
            </div>
          )}
        </div>
      </button>
    </li>
  )
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}