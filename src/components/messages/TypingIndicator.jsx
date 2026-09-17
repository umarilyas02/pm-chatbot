'use client'

export default function TypingIndicator({ users }) {
  if (!users.length) return null

  const names = users.map((u) => u.name || 'Someone')
  let text = ''
  if (names.length === 1) {
    text = `${names[0]} is typing...`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`
  } else {
    text = `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-600" />
      </div>
      <span>{text}</span>
    </div>
  )
}