'use client'

import { useEffect, useRef } from 'react'

const EMOJIS = [
  '😀', '😂', '😍', '😭', '😡', '👍', '👎', '🎉',
  '🔥', '💯', '🤔', '😴', '🤯', '🙏', '😱', '💩',
]

export default function ReactionPicker({ onSelect, onClose, position = 'left' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 flex gap-1 rounded-lg border border-white/[0.06] bg-[#0f172a] p-2 shadow-lg ${
        position === 'right' ? 'right-0 bottom-full mb-2' : 'left-0 bottom-full mb-2'
      }`}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji)
            onClose()
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl hover:bg-white/[0.05] cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}