'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Smile, Paperclip } from 'lucide-react'
import ReactionPicker from './ReactionPicker'

export default function ChatInput({ onSend, disabled }) {
  const [content, setContent] = useState('')
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const lastTypingStateRef = useRef(false)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleChange(e) {
    const value = e.target.value
    setContent(value)
    handleTyping(value.length > 0)
  }

  function handleTyping(isTyping) {
    if (lastTypingStateRef.current === isTyping) return
    lastTypingStateRef.current = isTyping

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        lastTypingStateRef.current = false
        // Send typing stop via SSE would be handled by the hook
      }, 3000)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = content.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function autoResize() {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  return (
    <div className="relative">
      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-[#0f172a] text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 cursor-pointer"
          aria-label="Reactions"
        >
          <Smile className="h-5 w-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onInput={autoResize}
            placeholder="Type a message... (Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className="w-full rounded-2xl border border-white/[0.06] bg-[#0f172a] px-4 py-3 pr-14 text-sm text-slate-100 placeholder-slate-500 focus:border-[#22c55e]/40 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/20 resize-none disabled:opacity-50"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-[#020617] hover:bg-[#22c55e]/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {showReactionPicker && (
        <ReactionPicker
          onSelect={() => {}}
          onClose={() => setShowReactionPicker(false)}
          position="left"
        />
      )}
    </div>
  )
}