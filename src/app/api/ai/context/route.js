import { getSession } from '@/lib/session'
import { getUserContext, getContextCount, removeContextItem, clearUserContext, CONTEXT_LIMIT, CONTEXT_WARN_AT } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await getUserContext(session.userId)
  const count = items.length
  return Response.json({
    items,
    count,
    limit: CONTEXT_LIMIT,
    warnAt: CONTEXT_WARN_AT,
    isFull: count >= CONTEXT_LIMIT,
    isNearLimit: count >= CONTEXT_WARN_AT,
  })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session?.userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')

  if (itemId) {
    await removeContextItem(session.userId, itemId)
  } else {
    // clear all
    await clearUserContext(session.userId)
  }
  return Response.json({ ok: true })
}
