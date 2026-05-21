import { getNewlyOverdueTasks, createNotification } from '@/lib/db'

export const dynamic = 'force-dynamic'

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true
  // Custom caller sends x-cron-secret header
  const customHeader = request.headers.get('x-cron-secret')
  return customHeader === secret
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tasks = await getNewlyOverdueTasks()

  await Promise.all(
    tasks.map((t) =>
      createNotification({
        userId: t.creator_id,
        type: 'task_overdue',
        title: 'Task overdue',
        body: t.title,
        href: '/board',
      })
    )
  )

  return Response.json({ processed: tasks.length, timestamp: new Date().toISOString() })
}
