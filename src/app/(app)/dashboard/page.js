import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { findUserById, getDashboardStats, getOverdueTasks } from '@/lib/db'
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

  const [user, stats, overdue] = await Promise.all([
    findUserById(session.userId),
    getDashboardStats(session.userId),
    getOverdueTasks(session.userId),
  ])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  // Serialize overdue dates
  const overdueList = overdue.map((t) => ({
    ...t,
    due_date: t.due_date ? String(t.due_date).slice(0, 10) : null,
  }))

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
          <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
            <h3 className="mb-4 text-sm font-semibold text-[#f8fafc]">Task Distribution</h3>
            <TaskDistributionChart stats={stats} />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
            <h3 className="mb-4 text-sm font-semibold text-[#f8fafc]">By Priority</h3>
            <PriorityChart stats={stats} />
          </div>
        </div>

        {/* AI Insights */}
        <AiInsightsPanel />

        {/* Overdue + quick stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <OverdueList tasks={overdueList} />

          {/* Progress summary */}
          <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
            <h3 className="mb-4 text-sm font-semibold text-[#f8fafc]">Progress Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'Backlog',     value: stats.backlog,      total: stats.total, color: 'bg-slate-500' },
                { label: 'Todo',        value: stats.todo,         total: stats.total, color: 'bg-blue-400' },
                { label: 'In Progress', value: stats.in_progress,  total: stats.total, color: 'bg-violet-400' },
                { label: 'Review',      value: stats.review,       total: stats.total, color: 'bg-yellow-400' },
                { label: 'Completed',   value: stats.completed,    total: stats.total, color: 'bg-[#22c55e]' },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{label}</span>
                      <span className="font-mono text-slate-500">{value} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
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
