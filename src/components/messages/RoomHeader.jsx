'use client'

import { FolderOpen, Users, Video, Mic, Settings, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function RoomHeader({ room, activeMeeting }) {
  const [showMenu, setShowMenu] = useState(false)

  const roomName = room.type === 'project'
    ? room.project_name || 'Project'
    : room.last_message_sender_name || 'Direct Message'

  const roomSubtitle = room.type === 'project'
    ? 'Project chat'
    : 'Direct message'

  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3 bg-[#020617]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          room.type === 'project'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-slate-700/50 text-slate-400'
        }`}>
          {room.type === 'project' ? (
            <FolderOpen className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}
        </div>
        <div>
          <h2 className="font-semibold text-sm text-[#f8fafc] truncate">{roomName}</h2>
          <p className="text-[11px] text-slate-500">{roomSubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeMeeting && (
          <button
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 cursor-pointer"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Live meeting</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-[#0f172a] text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 cursor-pointer"
            aria-label="Room options"
          >
            <Settings className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-white/[0.06] bg-[#0f172a] py-1 shadow-lg">
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.03]">
                <Video className="h-4 w-4" />
                Start video call
              </button>
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.03]">
                <Mic className="h-4 w-4" />
                Start audio call
              </button>
              <hr className="my-1 border-white/[0.06]" />
              <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.03]">
                <ChevronDown className="h-4 w-4" />
                Notification settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}