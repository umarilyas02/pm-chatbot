'use client'

import { useState, useEffect } from 'react'
import { X, Search, UserPlus, Users } from 'lucide-react'

export default function NewChatModal({ members = [], onCreate, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = members
    .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleSelect(member) {
    setSelected(member)
    onCreate(member.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0f172a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-3">
          <h2 className="font-mono text-lg font-semibold text-[#f8fafc]">New Direct Message</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.05] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/[0.04] px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search workspace members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-[#020617] px-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-[#22c55e]/40 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center text-slate-500">
              <Users className="h-10 w-10 text-slate-600" />
              <p className="font-mono text-sm">No members found</p>
              <p className="text-xs">Try a different search</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.02]">
              {filtered.map((member) => (
                <li key={member.id}>
                  <button
                    onClick={() => handleSelect(member)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] cursor-pointer"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-700/50 flex items-center justify-center">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                      ) : (
                        <span className="text-lg font-medium text-slate-400">
                          {member.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#f8fafc] truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    </div>
                    <UserPlus className="h-5 w-5 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}