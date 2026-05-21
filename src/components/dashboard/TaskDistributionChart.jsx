'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = {
  backlog:     '#64748b',
  todo:        '#60a5fa',
  in_progress: '#a78bfa',
  review:      '#f59e0b',
  blocked:     '#f87171',
  completed:   '#22c55e',
}

const LABELS = {
  backlog: 'Backlog', todo: 'Todo', in_progress: 'In Progress',
  review: 'Review', blocked: 'Blocked', completed: 'Completed',
}

export default function TaskDistributionChart({ stats }) {
  const data = Object.entries(LABELS)
    .map(([key, name]) => ({ name, value: stats[key] ?? 0, key }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-600">
        No tasks yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            fontSize: 12,
            color: '#f8fafc',
          }}
          itemStyle={{ color: '#f8fafc' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
