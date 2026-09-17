'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import RoomHeader from './RoomHeader'
import MeetingBanner from './MeetingBanner'
import { useChat } from '@/hooks/useChat'

export default function ChatArea({ room, currentUserId, onRoomUpdate }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState(null)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [activeMeeting, setActiveMeeting] = useState(null)
  const messagesEndRef = useRef(null)
  const observerRef = useRef(null)

  const { connect, disconnect, sendMessage } = useChat(room?.id, {
    onMessage: (msg) => setMessages((prev) => [...prev, msg]),
    onEdit: (msg) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
      ),
    onDelete: (msgId) =>
      setMessages((prev) => prev.filter((m) => m.id !== msgId)),
    onReaction: ({ messageId, emoji, added }) =>
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m
          const reactions = m.reactions ?? []
          if (added) {
            const existing = reactions.find((r) => r.emoji === emoji)
            if (existing) return { ...m, reactions: reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)) }
            return { ...m, reactions: [...reactions, { emoji, count: 1, users: [currentUserId] }] }
          }
          return {
            ...m,
            reactions: reactions
              .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r))
              .filter((r) => r.count > 0),
          }
        })
      ),
    onTyping: ({ userId, userName, start }) =>
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (start) next.add(userId)
        else next.delete(userId)
        return next
      }),
    onMeetingStart: (meeting) => setActiveMeeting(meeting),
    onMeetingEnd: () => setActiveMeeting(null),
  })

  useEffect(() => {
    if (!room?.id) return
    loadMessages()
    connect()
    fetchActiveMeeting()
    return () => {
      disconnect()
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [room?.id])

  async function fetchActiveMeeting() {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/meetings`)
      if (res.ok) {
        const data = await res.json()
        if (data.meeting) setActiveMeeting(data.meeting)
      }
    } catch {}
  }

  async function loadMessages(reset = false) {
    if (!room?.id || loadingMore) return
    if (reset) {
      setLoading(true)
      setCursor(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('limit', '50')

      const res = await fetch(`/api/chat/rooms/${room.id}/messages?${params}`)
      if (!res.ok) throw new Error('Failed to load')

      const data = await res.json()
      const newMessages = data.messages ?? []

      if (reset) {
        setMessages(newMessages.reverse())
        setCursor(newMessages.length > 0 ? newMessages[newMessages.length - 1].created_at : null)
      } else {
        setMessages((prev) => [...newMessages.reverse(), ...prev])
        setCursor(newMessages.length > 0 ? newMessages[newMessages.length - 1].created_at : null)
      }
      setHasMore(newMessages.length === 50)
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function handleScroll(e) {
    const target = e.target
    if (target.scrollTop === 0 && hasMore && !loadingMore) {
      loadMessages()
    }
  }

  useEffect(() => {
    const container = document.querySelector('[data-chat-messages]')
    if (!container) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMessages()
        }
      },
      { root: container, threshold: 0.1 }
    )
    const sentinel = document.getElementById('load-more-sentinel')
    if (sentinel) observerRef.current.observe(sentinel)
    return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSend(content) {
    const tempId = crypto.randomUUID()
    const optimisticMsg = {
      id: tempId,
      sender_id: currentUserId,
      sender_name: 'You',
      sender_avatar: null,
      content,
      created_at: new Date().toISOString(),
      edited: false,
      deleted: false,
      reactions: [],
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data.message, sender_name: 'You' } : m))
      )
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error('Failed to send message')
    }
  }

  async function handleEdit(messageId, newContent) {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      if (!res.ok) throw new Error('Failed to edit')
    } catch {
      toast.error('Failed to edit message')
    }
  }

  async function handleDelete(messageId) {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages/${messageId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete')
      }
    } catch (e) {
      toast.error(e.message || 'Failed to delete message')
    }
  }

  async function handleToggleReaction(messageId, emoji) {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (!res.ok) throw new Error('Failed to add reaction')
    } catch {
      toast.error('Failed to add reaction')
    }
  }

  async function handleMarkRead() {
    try {
      await fetch(`/api/chat/rooms/${room.id}/read`, { method: 'PUT' })
      onRoomUpdate?.({ ...room, unread_count: 0 })
    } catch {}
  }

  useEffect(() => {
    handleMarkRead()
  }, [room?.id])

  if (!room) return null

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <RoomHeader room={room} activeMeeting={activeMeeting} />
      {activeMeeting && <MeetingBanner meeting={activeMeeting} roomId={room.id} />}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
        onScroll={handleScroll}
        data-chat-messages
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="font-mono text-sm text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-500">Send the first message!</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            <div id="load-more-sentinel" style={{ height: 1 }} />
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleReaction={handleToggleReaction}
                isTyping={typingUsers.has(msg.sender_id)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        {typingUsers.size > 0 && (
          <TypingIndicator
            users={Array.from(typingUsers).map((id) => ({ id, name: 'Someone' }))}
          />
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={!room?.id} />
    </div>
  )
}