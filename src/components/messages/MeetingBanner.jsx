'use client'

import { useState, useEffect, useRef } from 'react'
import { Video, Mic, Phone, Maximize, Minimize, Users, Share2 } from 'lucide-react'
import { useMeeting } from '@/hooks/useMeeting'

export default function MeetingBanner({ meeting, roomId }) {
  const [joined, setJoined] = useState(false)
  const { joinMeeting, leaveMeeting, localStream, remoteStreams, error } = useMeeting(
    meeting,
    roomId,
    joined
  )

  useEffect(() => {
    if (joined && localStream) {
      const video = document.getElementById('local-video')
      if (video && video.srcObject !== localStream) {
        video.srcObject = localStream
      }
    }
  }, [joined, localStream])

  async function handleJoin() {
    try {
      await joinMeeting()
      setJoined(true)
    } catch (e) {
      console.error('Failed to join meeting:', e)
    }
  }

  async function handleLeave() {
    await leaveMeeting()
    setJoined(false)
  }

  return (
    <div className={`border-b border-white/[0.04] px-4 py-2 bg-[#020617]/80 backdrop-blur-sm ${joined ? 'h-auto' : 'h-auto'}`}>
      {!joined ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e]/10 text-[#22c55e]">
              <Video className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="font-medium text-sm text-[#f8fafc]">
                {meeting.type === 'video' ? 'Video meeting started' : 'Audio meeting started'}
              </p>
              <p className="text-xs text-slate-500">
                Click to join · {meeting.type === 'video' ? 'Camera + Mic' : 'Microphone only'}
              </p>
            </div>
          </div>
          <button
            onClick={handleJoin}
            className="flex items-center gap-1.5 rounded-lg bg-[#22c55e] px-3 py-1.5 text-xs font-medium text-[#020617] hover:bg-[#22c55e]/90 cursor-pointer"
          >
            <Video className="h-3.5 w-3.5" />
            Join
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <video
                id="local-video"
                autoPlay
                muted
                playsInline
                className="h-8 w-8 rounded-lg bg-slate-800"
              />
              <div className="absolute bottom-0 right-0 flex gap-1 p-0.5">
                <button
                  onClick={() => localStream?.getAudioTracks()[0]?.setEnabled(!localStream?.getAudioTracks()[0]?.enabled)}
                  className="h-5 w-5 rounded bg-slate-900/80 text-slate-200 hover:bg-slate-700 cursor-pointer"
                  title="Toggle mic"
                >
                  {localStream?.getAudioTracks()[0]?.enabled ? <Mic className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => localStream?.getVideoTracks()[0]?.setEnabled(!localStream?.getVideoTracks()[0]?.enabled)}
                  className="h-5 w-5 rounded bg-slate-900/80 text-slate-200 hover:bg-slate-700 cursor-pointer"
                  title="Toggle camera"
                >
                  {localStream?.getVideoTracks()[0]?.enabled ? <Video className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm text-[#f8fafc]">In meeting</p>
              <p className="text-xs text-slate-500">
                {remoteStreams.size} other participant{remoteStreams.size !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-[#0f172a] text-slate-400 hover:bg-white/[0.03] cursor-pointer"
              title="Share link"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleLeave}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5" />
              Leave
            </button>
          </div>
        </div>
      )}
    </div>
  )
}