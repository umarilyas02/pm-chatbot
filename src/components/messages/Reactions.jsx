'use client'

export default function Reactions({ reactions = [], currentUserId, onToggle, isOwn }) {
  if (!reactions.length) return null

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {reactions.map((r) => {
        const hasReacted = r.users?.includes(currentUserId)
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
              hasReacted
                ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
            }`}
            title={`${r.count} ${r.count === 1 ? 'person' : 'people'}`}
          >
            <span style={{ fontSize: '12px' }}>{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        )
      })}
    </div>
  )
}