'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import RoomList from './RoomList'
import ChatArea from './ChatArea'
import NewChatModal from './NewChatModal'
import { MessageCircle, Users, Search } from 'lucide-react'

export default function MessagesClient({
  initialRooms = [],
  workspaceId,
  currentUserId,
}) {
  const [rooms, setRooms] = useState(initialRooms)
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [workspaceMembers, setWorkspaceMembers] = useState([])

  useEffect(() => {
    if (workspaceId && !workspaceMembers.length) {
      fetch(`/api/workspace/members`)
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setWorkspaceMembers(data))
        .catch(() => {})
    }
  }, [workspaceId, workspaceMembers.length])

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery) return true
    const name = r.type === 'direct'
      ? r.last_message_sender_name || 'Direct Message'
      : r.project_name || 'Project'
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  async function handleCreateDirectRoom(targetUserId) {
    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })
      if (res.ok) {
        const data = await res.json()
        const newRoom = data.room
        setRooms((prev) => [newRoom, ...prev])
        setActiveRoomId(newRoom.id)
      }
    } catch {
      toast.error('Failed to create direct message')
    }
  }

  async function handleSelectRoom(room) {
    setActiveRoomId(room.id)
    try {
      await fetch(`/api/chat/rooms/${room.id}/read`, { method: 'PUT' })
    } catch {}
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id ? { ...r, unread_count: 0 } : r
      )
    )
  }

  async function handleRoomUpdate(updatedRoom) {
    setRooms((prev) =>
      prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar - Room List */}
      <aside className="flex flex-col w-80 border-r border-white/[0.04] bg-[#020617]">
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
          <h1 className="font-mono text-lg font-semibold text-[#f8fafc]">Messages</h1>
          <button
            onClick={() => setShowNewChat(true)}
            className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-3 py-1.5 text-xs font-medium text-[#020617] hover:bg-[#22c55e]/90 cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="border-b border-white/[0.04] px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-[#0f172a] px-8 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-[#22c55e]/40 focus:outline-none"
            />
          </div>
        </div>

        <RoomList
          rooms={filteredRooms}
          activeRoomId={activeRoomId}
          currentUserId={currentUserId}
          onSelect={handleSelectRoom}
          onRoomUpdate={handleRoomUpdate}
        />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoomId ? (
          <ChatArea
            room={rooms.find((r) => r.id === activeRoomId)}
            currentUserId={currentUserId}
            onRoomUpdate={handleRoomUpdate}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 ring-1 ring-white/10">
              <MessageCircle className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-semibold text-[#f8fafc]">Select a conversation</h2>
              <p className="mt-1.5 max-w-xs text-sm text-slate-400">
                Pick a chat from the sidebar or start a new one
              </p>
            </div>
          </div>
        )}

        {showNewChat && (
          <NewChatModal
            members={workspaceMembers}
            onCreate={handleCreateDirectRoom}
            onClose={() => setShowNewChat(false)}
          />
        )}
      </main>
    </div>
  )
}