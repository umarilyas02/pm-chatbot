'use client'

import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import { Zap } from 'lucide-react'

const SUGGESTIONS = [
  'Create a high priority task for the login page due Friday',
  'Show me all overdue tasks',
  'Generate a standup summary',
  'What tasks are blocking the project?',
]

export default function ChatWindow({ conversationId, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(content) {
    // Optimistically add user message
    const userMsg = { id: crypto.randomUUID(), role: 'user', content }
    const aiMsg = { id: crypto.randomUUID(), role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
        })
      }
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        return [
          ...prev.slice(0, -1),
          { ...last, content: 'Sorry, something went wrong. Please try again.' },
        ]
      })
    } finally {
      setStreaming(false)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22c55e]/10 ring-1 ring-[#22c55e]/20">
              <Zap className="h-7 w-7 text-[#22c55e]" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-semibold text-[#f8fafc]">
                CreateX AI
              </h2>
              <p className="mt-1.5 max-w-sm text-sm text-slate-400">
                Your AI project manager. Ask me to create tasks, generate reports,
                or check project health.
              </p>
            </div>
            <div className="grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  disabled={streaming}
                  className="rounded-lg border border-white/[0.06] bg-[#0f172a] px-3 py-2.5 text-left text-xs text-slate-400 transition-colors hover:border-[#22c55e]/20 hover:text-slate-200 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id ?? i}
                message={msg}
                isStreaming={streaming && i === messages.length - 1}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/[0.06] px-4 py-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <ChatInput onSend={handleSend} disabled={streaming} />
          <p className="mt-2 text-center text-xs text-slate-600">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  )
}
