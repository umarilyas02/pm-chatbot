import { useEffect, useRef, useCallback } from 'react'

export function useChat(roomId, handlers = {}) {
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const handlersRef = useRef(handlers)
  const handleEventRef = useRef(null)
  const connectRef = useRef(null)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  const handleEvent = useCallback((payload) => {
    const { type } = payload

    switch (type) {
      case 'message:new':
        handlersRef.current.onMessage?.(payload.message)
        break
      case 'message:edited':
        handlersRef.current.onEdit?.(payload.message)
        break
      case 'message:deleted':
        handlersRef.current.onDelete?.(payload.message.id)
        break
      case 'reaction:added':
        handlersRef.current.onReaction?.({
          messageId: payload.message_id,
          emoji: payload.emoji,
          added: true,
        })
        break
      case 'reaction:removed':
        handlersRef.current.onReaction?.({
          messageId: payload.message_id,
          emoji: payload.emoji,
          added: false,
        })
        break
      case 'typing:start':
        handlersRef.current.onTyping?.({
          userId: payload.user_id,
          userName: payload.user_name,
          start: true,
        })
        break
      case 'typing:stop':
        handlersRef.current.onTyping?.({
          userId: payload.user_id,
          start: false,
        })
        break
      case 'meeting:started':
        handlersRef.current.onMeetingStart?.(payload.meeting)
        break
      case 'meeting:ended':
        handlersRef.current.onMeetingEnd?.()
        break
      default:
        console.log('[Chat] Unknown event type:', type)
    }
  }, [])

  useEffect(() => {
    handleEventRef.current = handleEvent
  }, [handleEvent])

  const connect = useCallback(() => {
    if (!roomId) return
    if (eventSourceRef.current) return

    const url = `/api/realtime/chat?roomId=${encodeURIComponent(roomId)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onopen = () => {
      console.log('[Chat] SSE connected')
    }

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        handleEventRef.current?.(payload)
      } catch (e) {
        console.warn('[Chat] Failed to parse SSE message:', e)
      }
    }

    es.onerror = (err) => {
      console.error('[Chat] SSE error:', err)
      es.close()
      eventSourceRef.current = null
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current?.()
      }, 3000)
    }
  }, [roomId])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const sendMessage = useCallback(async (content) => {
    if (!roomId) return
    const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    return res.json()
  }, [roomId])

  return { connect, disconnect, sendMessage }
}