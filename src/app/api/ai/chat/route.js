import { getSession } from '@/lib/session'
import { getMessages, saveMessage } from '@/lib/db'
import { streamChat } from '@/lib/gemini'

export async function POST(request) {
  // Verify session
  const session = await getSession()
  if (!session?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId, content } = await request.json()

  if (!conversationId || !content?.trim()) {
    return Response.json({ error: 'Missing conversationId or content' }, { status: 400 })
  }

  // Load conversation history (excluding the current message)
  const history = await getMessages(conversationId, 40)

  // Persist the user message immediately
  await saveMessage(conversationId, 'user', content.trim())

  // Stream Gemini response
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        fullResponse = await streamChat(content.trim(), history, (chunk) => {
          controller.enqueue(new TextEncoder().encode(chunk))
        })
        // Persist the completed AI message
        await saveMessage(conversationId, 'assistant', fullResponse)
        controller.close()
      } catch (err) {
        console.error('[chat/route] Gemini error:', err)
        // Persist a fallback assistant message so the reply is saved to the DB
        try {
          await saveMessage(conversationId, 'assistant', '\n\nSorry, I ran into an error. Please try again.')
        } catch (saveErr) {
          console.error('[chat/route] Failed to save error message:', saveErr)
        }

        controller.enqueue(
          new TextEncoder().encode('\n\nSorry, I ran into an error. Please try again.')
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
