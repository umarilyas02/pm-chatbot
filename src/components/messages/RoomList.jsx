'use client'

import RoomItem from './RoomItem'

export default function RoomList({ rooms, activeRoomId, currentUserId, onSelect, onRoomUpdate }) {
  if (!rooms.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center text-slate-500">
        <p className="font-mono text-sm">No conversations yet</p>
        <p className="text-xs">Start a new chat to begin</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="divide-y divide-white/[0.02]">
        {rooms.map((room) => (
          <RoomItem
            key={room.id}
            room={room}
            active={room.id === activeRoomId}
            currentUserId={currentUserId}
            onClick={() => onSelect(room)}
            onUpdate={onRoomUpdate}
          />
        ))}
      </ul>
    </div>
  )
}