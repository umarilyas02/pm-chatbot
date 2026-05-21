import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const PRIORITY_CLS = {
  critical: 'text-red-400 bg-red-400/10',
  high:     'text-orange-400 bg-orange-400/10',
  medium:   'text-yellow-400 bg-yellow-400/10',
  low:      'text-slate-400 bg-slate-700/30',
}

function daysOverdue(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
  return diff === 1 ? '1 day' : `${diff} days`
}

export default function OverdueList({ tasks }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold text-[#f8fafc]">Overdue Tasks</h3>
        </div>
        <Link
          href="/board"
          className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-[#22c55e]"
        >
          View board <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-600">
          No overdue tasks — great work!
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-[#1e293b]/50 px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{t.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                    PRIORITY_CLS[t.priority]
                  )}
                >
                  {t.priority}
                </span>
                <span className="text-[11px] text-red-400">{daysOverdue(t.due_date)} ago</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
