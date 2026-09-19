'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Edit, Trash2, Smile, MoreHorizontal, ChevronDown } from 'lucide-react'
import Reactions from './Reactions'
import ReactionPicker from './ReactionPicker'

export default function MessageBubble({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onToggleReaction,
  isTyping,
}) {
  const [showActions, setShowActions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const actionsRef = useRef(null)

  const isOwn = message.sender_id === currentUserId
  const isDeleted = message.deleted === true
  const isEdited = message.edited === true

  const timeAgo = useMemo(() => formatTimeAgo(new Date(message.created_at)), [message.created_at])

  const canDelete = useMemo(() => {
    if (!isOwn) return false
    if (isDeleted) return false
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const age = now - new Date(message.created_at).getTime()
    return age <= 30 * 1000
  }, [isOwn, isDeleted, message.created_at])

  useEffect(() => {
    function handleClickOutside(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSaveEdit() {
    onEdit(message.id, editContent.trim())
    setEditing(false)
    setShowActions(false)
  }

  function handleDelete() {
    if (confirm('Delete this message?')) {
      onDelete(message.id)
      setShowActions(false)
    }
  }

  function handleToggleReaction(emoji) {
    onToggleReaction(message.id, emoji)
  }

  if (isDeleted) {
    return (
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-800/50" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-400">{message.sender_name || 'Someone'}</span>
            <span>·</span>
            <span>{timeAgo}</span>
            <span className="text-red-500">This message was deleted</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-800/50 flex items-center justify-center">
          {message.sender_avatar ? (
            <img src={message.sender_avatar} alt="" className="h-9 w-9 rounded-full" />
          ) : (
            <span className="text-sm font-medium text-slate-400">
              {message.sender_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      )}

      <div
        className={`flex-1 max-w-[70%] ${isOwn ? 'text-right' : ''}`}
        ref={actionsRef}
      >
        <div className="flex items-center gap-1.5">
          {!isOwn && (
            <span className="font-medium text-sm text-slate-300">
              {message.sender_name || 'Someone'}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>
          {isEdited && (
            <span className="text-[10px] text-slate-500">edited</span>
          )}
        </div>

        <div
          className={`mt-1 rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-[#22c55e] text-[#020617] rounded-tr-none'
              : 'bg-[#0f172a] text-slate-100 rounded-tl-none'
          }`}
        >
          {editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEdit()
                }
                if (e.key === 'Escape') {
                  setEditing(false)
                  setShowActions(false)
                }
              }}
              className="w-full min-h-[40px] rounded bg-slate-800/50 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#22c55e]"
              autoFocus
            />
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        <Reactions
          reactions={message.reactions || []}
          currentUserId={currentUserId}
          onToggle={handleToggleReaction}
          isOwn={isOwn}
        />

        {showActions && !isDeleted && (
          <div
            className={`absolute mt-1 flex items-center gap-1 rounded-lg bg-[#0f172a] border border-white/[0.06] px-2 py-1 shadow-lg ${
              isOwn ? 'right-0' : 'left-0'
            }`}
            role="menu"
          >
            <button
              onClick={() => {
                setEditContent(message.content)
                setEditing(true)
                setShowActions(false)
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-slate-200 hover:bg-white/[0.05] rounded cursor-pointer"
              role="menuitem"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                role="menuitem"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-slate-200 hover:bg-white/[0.05] rounded cursor-pointer"
              role="menuitem"
            >
              <Smile className="h-3.5 w-3.5" />
              React
            </button>
          </div>
        )}

        {showReactionPicker && (
          <ReactionPicker
            onSelect={handleToggleReaction}
            onClose={() => setShowReactionPicker(false)}
            position={isOwn ? 'right' : 'left'}
          />
        )}
      </div>

      {isOwn && (
        <div className="h-9 w-9 shrink-0" />
      )}
    </div>
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