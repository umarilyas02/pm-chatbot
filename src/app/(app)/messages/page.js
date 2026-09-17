import { getSession } from '@/lib/session'
import { getUserRooms, getPrimaryWorkspace } from '@/lib/db'
import MessagesClient from '@/components/messages/MessagesClient'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Messages — CreateX' }

export default async function MessagesPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const [rooms, workspace] = await Promise.all([
    getUserRooms(session.userId),
    getPrimaryWorkspace(session.userId),
  ])

  return (
    <div className="h-full">
      <MessagesClient
        initialRooms={rooms.map((r) => ({
          id: r.id,
          type: r.type,
          project_id: r.project_id,
          project_name: r.project_name,
          last_message: r.last_message,
          last_message_at: r.last_message_at,
          last_message_sender_name: r.last_message_sender_name,
          unread_count: r.unread_count ?? 0,
        }))}
        workspaceId={workspace?.id}
        currentUserId={session.userId}
      />
    </div>
  )
}