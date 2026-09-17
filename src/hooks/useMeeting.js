import { useState, useEffect, useRef, useCallback } from 'react'
import Peer from 'peerjs'

const PEERJS_CONFIG = {
  host: process.env.NEXT_PUBLIC_PEERJS_HOST || '0.peerjs.com',
  port: process.env.NEXT_PUBLIC_PEERJS_PORT || 443,
  path: process.env.NEXT_PUBLIC_PEERJS_PATH || '/',
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  },
  debug: 0,
}

export function useMeeting(meeting, roomId, joined) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState(new Map())
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)

  const peerRef = useRef(null)
  const connectionsRef = useRef(new Map())
  const localStreamRef = useRef(null)
  const joinedRef = useRef(joined)
  const meetingIdRef = useRef(meeting?.id)

  joinedRef.current = joined
  meetingIdRef.current = meeting?.id

  useEffect(() => {
    if (!joined || !meeting) return

    const userId = localStorage.getItem('userId') || 'anonymous'
    const peerId = `chat-${userId}-${roomId}`

    const peer = new Peer(peerId, PEERJS_CONFIG)
    peerRef.current = peer

    peer.on('open', (id) => {
      console.log('[Meeting] Peer connected:', id)
      setConnected(true)
    })

    peer.on('call', (call) => {
      console.log('[Meeting] Incoming call')
      call.answer(localStreamRef.current)
      call.on('stream', (stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.set(call.peer, stream)
          return next
        })
      })
      call.on('close', () => {
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.delete(call.peer)
          return next
        })
      })
      connectionsRef.current.set(call.peer, call)
    })

    peer.on('error', (err) => {
      console.error('[Meeting] Peer error:', err)
      setError(err.message)
    })

    peer.on('disconnected', () => {
      console.log('[Meeting] Peer disconnected')
      setConnected(false)
      peer.reconnect()
    })

    return () => {
      peer.destroy()
      peerRef.current = null
      connectionsRef.current.forEach((call) => call.close())
      connectionsRef.current.clear()
    }
  }, [joined, roomId, meeting?.id])

  const joinMeeting = useCallback(async () => {
    if (!joinedRef.current || !meetingIdRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: meeting?.type === 'video',
        audio: true,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      setError(null)
    } catch (err) {
      console.error('[Meeting] Failed to get media:', err)
      setError('Failed to access camera/microphone')
      throw err
    }
  }, [meeting?.type])

  const leaveMeeting = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    connectionsRef.current.forEach((call) => call.close())
    connectionsRef.current.clear()
    setRemoteStreams(new Map())
    setConnected(false)
  }, [])

  const callPeer = useCallback(async (peerId) => {
    if (!peerRef.current || !localStreamRef.current) return

    try {
      const call = peerRef.current.call(peerId, localStreamRef.current)
      call.on('stream', (stream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.set(peerId, stream)
          return next
        })
      })
      call.on('close', () => {
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.delete(peerId)
          return next
        })
      })
      connectionsRef.current.set(peerId, call)
    } catch (err) {
      console.error('[Meeting] Call failed:', err)
    }
  }, [])

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setLocalStream(localStreamRef.current)
    }
  }, [])

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setLocalStream(localStreamRef.current)
    }
  }, [])

  return {
    localStream,
    remoteStreams,
    error,
    connected,
    joinMeeting,
    leaveMeeting,
    callPeer,
    toggleAudio,
    toggleVideo,
  }
}