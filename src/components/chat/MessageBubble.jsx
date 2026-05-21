import { Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// Strip <action>...</action> blocks from displayed text
function cleanContent(content) {
  return content.replace(/<action>[\s\S]*?<\/action>/g, '').trim()
}

// Very light markdown: **bold**, `code`, newlines
function renderText(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line
      .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
      .map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={j} className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-[#22c55e]">
              {part.slice(1, -1)}
            </code>
          )
        }
        return part
      })
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    )
  })
}

export default function MessageBubble({ message, isStreaming = false }) {
  const isUser = message.role === 'user'
  const text = cleanContent(message.content)

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white',
          isUser ? 'bg-slate-700' : 'bg-[#22c55e]'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-[#1e293b] text-[#f8fafc]'
            : 'rounded-tl-sm bg-[#0f172a] text-slate-200'
        )}
      >
        {text ? (
          renderText(text)
        ) : isStreaming ? (
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
          </span>
        ) : null}

        {/* Streaming cursor */}
        {isStreaming && text && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#22c55e]" />
        )}
      </div>
    </div>
  )
}
