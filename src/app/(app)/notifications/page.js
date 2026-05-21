import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getNotifications, markNotificationsRead } from '@/lib/db'
import NotificationsClient from '@/components/notifications/NotificationsClient'

export const metadata = { title: 'Notifications — CreateX' }

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const notifications = await getNotifications(session.userId, 100)

  // Mark all as read when page is visited (server-side)
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
  if (unreadIds.length > 0) {
    await markNotificationsRead(session.userId, unreadIds)
  }

  const serialized = notifications.map((n) => ({
    id:         n.id,
    type:       n.type,
    title:      n.title,
    body:       n.body,
    href:       n.href,
    read:       true, // all marked read above
    created_at: n.created_at.toISOString(),
  }))

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <h2 className="font-mono text-xl font-semibold text-[#f8fafc]">Notifications</h2>
          <p className="mt-1 text-sm text-slate-400">Your activity feed</p>
        </div>
        <NotificationsClient initialNotifications={serialized} />
      </div>
    </div>
  )
}
