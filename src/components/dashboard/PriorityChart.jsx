'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = {
  Critical: '#f87171',
  High:     '#fb923c',
  Medium:   '#facc15',
  Low:      '#64748b',
}

export default function PriorityChart({ stats }) {
  const data = [
    { name: 'Critical', value: stats.critical ?? 0 },
    { name: 'High',     value: stats.high     ?? 0 },
    { name: 'Medium',   value: stats.medium   ?? 0 },
    { name: 'Low',      value: stats.low      ?? 0 },
  ]

  const max = Math.max(...data.map((d) => d.value), 1)

  if (stats.total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-600">
        No tasks yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" barSize={14} margin={{ left: 0, right: 16 }}>
        <XAxis
          type="number"
          domain={[0, max]}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          contentStyle={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            fontSize: 12,
            color: '#f8fafc',
          }}
          itemStyle={{ color: '#f8fafc' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
