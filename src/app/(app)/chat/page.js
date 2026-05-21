import { getSession } from '@/lib/session'
import { getOrCreateConversation, getMessages } from '@/lib/db'
import ChatWindow from '@/components/chat/ChatWindow'
import { redirect } from 'next/navigation'

export const metadata = { title: 'AI Chat — CreateX' }

export default async function ChatPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const conversation = await getOrCreateConversation(session.userId)
  const messages = await getMessages(conversation.id, 50)

  return (
    <div className="h-full">
      <ChatWindow
        conversationId={conversation.id}
        initialMessages={messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))}
      />
    </div>
  )
}
