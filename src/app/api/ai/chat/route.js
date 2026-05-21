import { getSession } from '@/lib/session'
import { getMessages, saveMessage, getProjects, getTasksForAiContext, getUserContext, appendContextItem, getContextCount, CONTEXT_LIMIT } from '@/lib/db'
import { streamChat, buildProjectContext, extractContextItem } from '@/lib/gemini'

export async function POST(request) {
  const session = await getSession()
  if (!session?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId, content, projectIds = [] } = await request.json()

  if (!conversationId || !content?.trim()) {
    return Response.json({ error: 'Missing conversationId or content' }, { status: 400 })
  }

  const hasProjectFilter = Array.isArray(projectIds) && projectIds.length > 0

  // Fetch everything in parallel; filter tasks by selected projects if provided
  const [history, allProjects, tasks, contextItems] = await Promise.all([
    getMessages(conversationId, 40),
    getProjects(session.userId),
    getTasksForAiContext(session.userId, hasProjectFilter ? projectIds : null),
    getUserContext(session.userId),
  ])

  // Narrow the project list to only the selected ones when a filter is active
  const projects = hasProjectFilter
    ? allProjects.filter((p) => projectIds.includes(p.id))
    : allProjects

  const projectContext = buildProjectContext(
    projects,
    tasks,
    new Date().toISOString().slice(0, 10)
  )

  await saveMessage(conversationId, 'user', content.trim())

  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        fullResponse = await streamChat(
          content.trim(),
          history,
          (chunk) => controller.enqueue(new TextEncoder().encode(chunk)),
          projectContext,
          contextItems
        )

        await saveMessage(conversationId, 'assistant', fullResponse)

        const contextText = extractContextItem(fullResponse)
        if (contextText) {
          const count = await getContextCount(session.userId)
          if (count < CONTEXT_LIMIT) {
            appendContextItem(session.userId, contextText, conversationId).catch(() => {})
          }
        }

        controller.close()
      } catch (err) {
        console.error('[chat/route] Gemini error:', err)
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
