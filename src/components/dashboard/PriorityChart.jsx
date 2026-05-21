'use client'

const PRIORITIES = [
  { key: 'critical', label: 'Critical', color: '#f87171' },
  { key: 'high',     label: 'High',     color: '#fb923c' },
  { key: 'medium',   label: 'Medium',   color: '#facc15' },
  { key: 'low',      label: 'Low',      color: '#64748b' },
]

export default function PriorityChart({ stats }) {
  if (stats.total === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-xs text-slate-600">
        No tasks yet
      </div>
    )
  }

  const maxValue = Math.max(...PRIORITIES.map((p) => stats[p.key] ?? 0), 1)

  return (
    <div className="flex flex-col gap-4 py-1">
      {PRIORITIES.map(({ key, label, color }) => {
        const value = stats[key] ?? 0
        const barPct = Math.round((value / maxValue) * 100)
        const totalPct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
                <span className="text-xs font-medium text-slate-300">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                  style={{
                    background: `${color}18`,
                    color,
                    border: `1px solid ${color}28`,
                  }}
                >
                  {totalPct}%
                </span>
                <span className="w-5 text-right font-mono text-xs text-slate-500">{value}</span>
              </div>
            </div>

            {/* Track + filled bar */}
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
                  boxShadow: value > 0 ? `0 0 10px ${color}48` : 'none',
                }}
              />
            </div>
          </div>
        )
      })}

      <div className="mt-1 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <span className="text-[11px] uppercase tracking-widest text-slate-600">Total</span>
        <span className="font-mono text-sm font-semibold text-[#f8fafc]">{stats.total}</span>
      </div>
    </div>
  )
}
