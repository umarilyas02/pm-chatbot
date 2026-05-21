'use client'

import { useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function ChatInput({ onSend, disabled }) {
  const ref = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  })

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const value = ref.current?.value.trim()
    if (!value || disabled) return
    onSend(value)
    ref.current.value = ''
    ref.current.style.height = 'auto'
  }

  return (
    <div className="flex items-end gap-3 rounded-xl border border-white/[0.08] bg-[#0f172a] px-4 py-3 focus-within:border-[#22c55e]/30 transition-colors">
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder="Ask anything, or say 'create task login page due Friday…'"
        onKeyDown={handleKeyDown}
        className="flex-1 resize-none bg-transparent text-sm text-[#f8fafc] placeholder-slate-600 outline-none disabled:opacity-50"
        style={{ maxHeight: 160 }}
      />
      <button
        onClick={submit}
        disabled={disabled}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22c55e] text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
