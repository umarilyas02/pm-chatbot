'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import ConversationSidebar from './ConversationSidebar'
import { Zap, AlertTriangle, XCircle, BookOpen } from 'lucide-react'
import ProjectPicker from './ProjectPicker'

const CONTEXT_LIMIT = 40
const CONTEXT_WARN_AT = 35

const SUGGESTIONS = [
  'Create a high priority task for the login page due Friday',
  'Show me all overdue tasks',
  'Generate a standup summary for my projects',
  'What tasks are blocking progress?',
]

function parseActions(text) {
  const actions = []
  const re = /<action>([\s\S]*?)<\/action>/g
  let match
  while ((match = re.exec(text)) !== null) {
    try { actions.push(JSON.parse(match[1].trim())) } catch { /* skip malformed */ }
  }
  return actions
}

async function executeActions(actions) {
  for (const action of actions) {
    if (action.type === 'create_task' && action.title) {
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title:      action.title,
            priority:   action.priority  ?? 'medium',
            due_date:   action.due_date  ?? null,
            status:     action.status    ?? 'todo',
            project_id: action.project_id ?? null,
          }),
        })
        if (res.ok) {
          const task = await res.json()
          toast.success(`Task created: "${task.title}"`)
        } else {
          toast.error('AI tried to create a task but it failed')
        }
      } catch {
        toast.error('Failed to execute AI action')
      }
    }
  }
}

function ContextBanner({ count, onDismiss }) {
  if (count < CONTEXT_WARN_AT) return null
  const isFull = count >= CONTEXT_LIMIT
  const pct = Math.min(Math.round((count / CONTEXT_LIMIT) * 100), 100)

  return (
    <div
      className={`flex items-center gap-3 border-b px-4 py-2.5 text-xs ${
        isFull
          ? 'border-red-500/20 bg-red-500/10 text-red-400'
          : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
      }`}
    >
      {isFull
        ? <XCircle className="h-3.5 w-3.5 shrink-0" />
        : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      }
      <span className="flex-1">
        {isFull
          ? `Context full (${count}/${CONTEXT_LIMIT}). New task memories won't be saved until you clear some.`
          : `Context nearing limit — ${count}/${CONTEXT_LIMIT} items used. Consider clearing old entries.`
        }
      </span>
      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-yellow-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <button onClick={onDismiss} className="shrink-0 text-lg leading-none opacity-50 hover:opacity-100 cursor-pointer">×</button>
    </div>
  )
}

export default function ChatWindow({
  conversations: initialConversations,
  activeConversationId,
  initialMessages,
  contextCount: initialContextCount,
  projects,
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState(activeConversationId)
  const [messages, setMessages] = useState(initialMessages)
  const [streaming, setStreaming] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [creating, setCreating] = useState(false)
  const [contextCount, setContextCount] = useState(initialContextCount ?? 0)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const refreshContextCount = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/context')
      if (res.ok) {
        const data = await res.json()
        setContextCount(data.count)
        if (data.count < CONTEXT_WARN_AT) setBannerDismissed(false)
      }
    } catch { /* non-critical */ }
  }, [])

  async function handleSelectConversation(conv) {
    if (conv.id === activeId || streaming) return
    setLoadingMessages(true)
    setMessages([])
    setActiveId(conv.id)
    try {
      const res = await fetch(`/api/ai/conversations/${conv.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })))
      }
    } catch {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  async function handleNewChat() {
    if (creating || streaming) return
    setCreating(true)
    try {
      const res = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New conversation' }),
      })
      if (res.ok) {
        const data = await res.json()
        const newConv = { ...data.conversation, message_count: 0 }
        setConversations((prev) => [newConv, ...prev])
        setActiveId(newConv.id)
        setMessages([])
      }
    } catch { /* ignore */ } finally {
      setCreating(false)
    }
  }

  async function handleDeleteConversation(convId) {
    const res = await fetch(`/api/ai/conversations/${convId}`, { method: 'DELETE' })
    if (!res.ok) return

    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== convId)
      if (convId === activeId) {
        if (remaining.length > 0) {
          const next = remaining[0]
          setActiveId(next.id)
          setLoadingMessages(true)
          fetch(`/api/ai/conversations/${next.id}`)
            .then((r) => r.ok ? r.json() : { messages: [] })
            .then((data) => setMessages(data.messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))))
            .finally(() => setLoadingMessages(false))
        } else {
          setActiveId(null)
          setMessages([])
        }
      }
      return remaining
    })
  }

  async function handleSend(content) {
    if (!activeId) return

    const userMsg = { id: crypto.randomUUID(), role: 'user', content }
    const aiMsg  = { id: crypto.randomUUID(), role: 'assistant', content: '' }

    setMessages((prev) => [...prev, userMsg, aiMsg])
    setStreaming(true)

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, message_count: (c.message_count ?? 0) + 2, updated_at: new Date().toISOString() }
          : c
      )
    )

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, content, projectIds: selectedProjectIds }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
        })
      }

      const actions = parseActions(accumulated)
      if (actions.length) await executeActions(actions)

      refreshContextCount()
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
  const showBanner = !bannerDismissed && contextCount >= CONTEXT_WARN_AT
  const noProject = (projects ?? []).length > 0 && selectedProjectIds.length === 0

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelectConversation}
        onCreate={handleNewChat}
        onDelete={handleDeleteConversation}
        creating={creating}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Context warning banner */}
        {showBanner && (
          <ContextBanner count={contextCount} onDismiss={() => setBannerDismissed(true)} />
        )}

        {/* Toolbar: project picker + memory pill */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-1.5">
          <ProjectPicker
            projects={projects ?? []}
            selectedIds={selectedProjectIds}
            onChange={setSelectedProjectIds}
          />
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#0f172a] px-2.5 py-1 text-[10px] text-slate-500">
            <BookOpen className="h-3 w-3" />
            <span>Memory: {contextCount}/{CONTEXT_LIMIT}</span>
            {contextCount >= CONTEXT_LIMIT && <span className="text-red-400">● full</span>}
            {contextCount >= CONTEXT_WARN_AT && contextCount < CONTEXT_LIMIT && (
              <span className="text-yellow-400">● near limit</span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600" />
              </div>
            </div>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${noProject ? 'bg-slate-800/60 ring-white/10' : 'bg-[#22c55e]/10 ring-[#22c55e]/20'}`}>
                <Zap className={`h-7 w-7 ${noProject ? 'text-slate-500' : 'text-[#22c55e]'}`} />
              </div>
              <div>
                <h2 className="font-mono text-lg font-semibold text-[#f8fafc]">CreateX AI</h2>
                {noProject ? (
                  <p className="mt-1.5 max-w-xs text-sm text-slate-400">
                    Select a project above to get started — Gemini needs at least one project to work with.
                  </p>
                ) : (
                  <p className="mt-1.5 max-w-sm text-sm text-slate-400">
                    Your AI project manager. Ask me to create tasks, generate reports, or check project health.
                  </p>
                )}
              </div>
              {!noProject && (
                <div className="grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      disabled={streaming || !activeId}
                      className="rounded-lg border border-white/[0.06] bg-[#0f172a] px-3 py-2.5 text-left text-xs text-slate-400 transition-colors hover:border-[#22c55e]/20 hover:text-slate-200 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
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
            {!activeId ? (
              <p className="text-center text-sm text-slate-600">
                Select a chat or{' '}
                <button onClick={handleNewChat} className="text-[#22c55e] hover:underline cursor-pointer">
                  start a new one
                </button>
              </p>
            ) : noProject ? (
              <p className="text-center text-sm text-amber-500/80">
                Please select a project to start chatting
              </p>
            ) : (
              <>
                <ChatInput onSend={handleSend} disabled={streaming || loadingMessages} />
                <p className="mt-2 text-center text-xs text-slate-600">
                  Shift+Enter for new line · Enter to send
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
