import { getSession } from '@/lib/session'
import { getDashboardStats } from '@/lib/db'
import { getModel } from '@/lib/gemini'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const stats = await getDashboardStats(session.userId)

  if (stats.total === 0) {
    return Response.json({
      insight: 'No tasks yet. Create your first task on the Board and I\'ll start tracking your project health.',
    })
  }

  const prompt = `You are a project management AI. Based on these task metrics, write 2-3 concise bullet points of actionable insights. Be specific and direct. Use plain text, no markdown headers.

Task stats:
- Total tasks: ${stats.total}
- Active (not completed): ${stats.active}
- In Progress: ${stats.in_progress}
- Overdue: ${stats.overdue}
- Blocked: ${stats.blocked}
- Completed this week: ${stats.completed_week}
- By priority — Critical: ${stats.critical}, High: ${stats.high}, Medium: ${stats.medium}, Low: ${stats.low}
- By status — Backlog: ${stats.backlog}, Todo: ${stats.todo}, Review: ${stats.review}

Write exactly 2-3 bullet points starting with "•". Each point should be one sentence.`

  try {
    const model = getModel()
    const result = await model.generateContent(prompt)
    const insight = result.response.text().trim()
    return Response.json({ insight })
  } catch {
    return Response.json({ insight: 'Unable to generate insights right now.' })
  }
}
