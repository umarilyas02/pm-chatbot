import { getSession } from '@/lib/session'
import { getOrCreateConversation, getUserConversations, getMessages, getContextCount, getProjects } from '@/lib/db'
import ChatWindow from '@/components/chat/ChatWindow'
import { redirect } from 'next/navigation'

export const metadata = { title: 'AI Chat — CreateX' }

export default async function ChatPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const defaultConv = await getOrCreateConversation(session.userId)

  const [conversations, messages, contextCount, projects] = await Promise.all([
    getUserConversations(session.userId),
    getMessages(defaultConv.id, 50),
    getContextCount(session.userId),
    getProjects(session.userId),
  ])

  return (
    <div className="h-full">
      <ChatWindow
        conversations={conversations.map((c) => ({
          id: c.id,
          title: c.title,
          updated_at: c.updated_at,
          message_count: c.message_count ?? 0,
        }))}
        activeConversationId={defaultConv.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))}
        contextCount={contextCount}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          task_count: p.task_count ?? 0,
        }))}
      />
    </div>
  )
}
