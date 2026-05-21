import { getSession } from '@/lib/session'
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  deleteNotifications,
} from '@/lib/db'

// GET — list notifications + unread count
export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [notifications, unread] = await Promise.all([
    getNotifications(session.userId),
    getUnreadCount(session.userId),
  ])

  return Response.json({ notifications, unread })
}

// PATCH — mark as read (body: { ids?: string[] } — omit ids to mark all)
export async function PATCH(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  await markNotificationsRead(session.userId, body.ids ?? null)

  return Response.json({ ok: true })
}

// DELETE — clear notifications (body: { ids?: string[] } — omit ids to clear all)
export async function DELETE(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  await deleteNotifications(session.userId, body.ids ?? null)

  return Response.json({ ok: true })
}
