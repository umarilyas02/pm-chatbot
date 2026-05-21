'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts'

const SEGMENTS = {
  backlog:     { label: 'Backlog',     color: '#475569' },
  todo:        { label: 'Todo',        color: '#38bdf8' },
  in_progress: { label: 'In Progress', color: '#818cf8' },
  review:      { label: 'Review',      color: '#fb923c' },
  blocked:     { label: 'Blocked',     color: '#ef4444' },
  completed:   { label: 'Completed',   color: '#22c55e' },
}

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.18}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value, color } = payload[0].payload
  return (
    <div
      className="rounded-xl border px-3 py-2 shadow-2xl"
      style={{
        background: 'rgba(9,14,31,0.96)',
        borderColor: `${color}30`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="text-xs text-slate-400">{name}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

export default function TaskDistributionChart({ stats }) {
  const [activeIndex, setActiveIndex] = useState(null)

  const data = Object.entries(SEGMENTS)
    .map(([key, { label, color }]) => ({ key, name: label, value: stats[key] ?? 0, color }))
    .filter((d) => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)
  const pct = total > 0 ? Math.round(((stats.completed ?? 0) / total) * 100) : 0

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-xs text-slate-600">
        No tasks yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Donut + center stat */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={204}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.key}
                  fill={entry.color}
                  opacity={activeIndex !== null && activeIndex !== index ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="font-mono text-[2rem] font-bold leading-none tracking-tight text-[#f8fafc]">
            {pct}%
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
            complete
          </span>
          <span className="mt-1 font-mono text-[11px] text-slate-600">{total} tasks</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {data.map((d) => {
          const segPct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <div
              key={d.key}
              className="flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.035]"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: d.color, boxShadow: `0 0 7px ${d.color}` }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-400">{d.name}</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-8 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${segPct}%`, background: d.color }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-[10px] text-slate-500">
                  {segPct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
