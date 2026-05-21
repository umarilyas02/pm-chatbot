import { CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react'

const STATS = (s) => [
  {
    label: 'Active Tasks',
    value: s.active,
    icon: Layers,
    color: 'text-[#22c55e]',
    bg: 'bg-[#22c55e]/10',
  },
  {
    label: 'In Progress',
    value: s.in_progress,
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    label: 'Overdue',
    value: s.overdue,
    icon: AlertTriangle,
    color: s.overdue > 0 ? 'text-red-400' : 'text-slate-500',
    bg: s.overdue > 0 ? 'bg-red-400/10' : 'bg-slate-700/20',
  },
  {
    label: 'Done This Week',
    value: s.completed_week,
    icon: CheckCircle2,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
]

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {STATS(stats).map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              {label}
            </p>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          <p className={`mt-3 font-mono text-3xl font-semibold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}
