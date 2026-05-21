import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { findUserById, getDashboardStats, getOverdueTasks, getPrimaryWorkspace } from '@/lib/db'
import StatsGrid from '@/components/dashboard/StatsGrid'
import TaskDistributionChart from '@/components/dashboard/TaskDistributionChart'
import PriorityChart from '@/components/dashboard/PriorityChart'
import AiInsightsPanel from '@/components/dashboard/AiInsightsPanel'
import OverdueList from '@/components/dashboard/OverdueList'

export const metadata = { title: 'Dashboard — CreateX' }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const workspace = await getPrimaryWorkspace(session.userId)
  const assigneeOnly = workspace ? workspace.owner_id !== session.userId : false

  const [user, stats, overdue] = await Promise.all([
    findUserById(session.userId),
    getDashboardStats(session.userId, assigneeOnly),
    getOverdueTasks(session.userId, 5, assigneeOnly),
  ])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  // due_date is already cast to text (YYYY-MM-DD) in the SQL query
  const overdueList = overdue

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-6">

        {/* Header */}
        <div>
          <h2 className="font-mono text-xl font-semibold text-[#f8fafc]">
            {greeting()}, {firstName}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {stats.total === 0
              ? 'Create your first task to get started.'
              : `You have ${stats.active} active task${stats.active !== 1 ? 's' : ''}${stats.overdue > 0 ? `, ${stats.overdue} overdue` : ''}.`}
          </p>
        </div>

        {/* Stat cards */}
        <StatsGrid stats={stats} />

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#0f172a] to-[#080d1a] p-5 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f8fafc]">Task Distribution</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Status</span>
            </div>
            <TaskDistributionChart stats={stats} />
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#0f172a] to-[#080d1a] p-5 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f8fafc]">By Priority</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Priority</span>
            </div>
            <PriorityChart stats={stats} />
          </div>
        </div>

        {/* AI Insights */}
        <AiInsightsPanel />

        {/* Overdue + quick stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OverdueList tasks={overdueList} />

          {/* Progress summary */}
          <div className="rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#0f172a] to-[#080d1a] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#f8fafc]">Progress Summary</h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">Breakdown</span>
            </div>
            <div className="space-y-3.5">
              {[
                { label: 'Backlog',     value: stats.backlog,     hex: '#64748b' },
                { label: 'Todo',        value: stats.todo,        hex: '#38bdf8' },
                { label: 'In Progress', value: stats.in_progress, hex: '#818cf8' },
                { label: 'Review',      value: stats.review,      hex: '#fb923c' },
                { label: 'Completed',   value: stats.completed,   hex: '#22c55e' },
              ].map(({ label, value, hex }) => {
                const pct = stats.total > 0 ? Math.round((value / stats.total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: hex, boxShadow: `0 0 5px ${hex}` }}
                        />
                        <span className="text-xs text-slate-400">{label}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {value} <span className="text-slate-600">/ {pct}%</span>
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${hex} 0%, ${hex}88 100%)`,
                          boxShadow: pct > 0 ? `0 0 8px ${hex}40` : 'none',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
