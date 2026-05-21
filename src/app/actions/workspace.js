'use server'

import { getSession } from '@/lib/session'
import {
  getPrimaryWorkspace,
  createWorkspaceInvite,
  cancelWorkspaceInvite,
  removeWorkspaceMember,
  deleteUser,
  getWorkspaceInviteByToken,
  acceptWorkspaceInvite,
  isWorkspaceMember,
  findUserByEmail,
} from '@/lib/db'
import { sendWorkspaceInviteEmail } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function makeToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
}

async function getIP() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function inviteMember({ workspaceId, email }) {
  const session = await getSession()
  if (!session?.userId) return { error: 'Unauthorized' }

  const ip = await getIP()
  const { ok, retryAfter } = rateLimit(`invite:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })
  if (!ok) return { error: `Too many invites. Try again in ${retryAfter}s.` }

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace || workspace.owner_id !== session.userId) {
    return { error: 'Only the workspace owner can invite members' }
  }
  if (workspace.id !== workspaceId) return { error: 'Invalid workspace' }

  // Check if already a member
  const existing = await findUserByEmail(email)
  if (existing) {
    const alreadyIn = await isWorkspaceMember(workspaceId, existing.id)
    if (alreadyIn) return { error: 'This person is already in the workspace' }
  }

  const token = makeToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await createWorkspaceInvite({
    workspaceId,
    email,
    token,
    invitedBy: session.userId,
    expiresAt,
  })

  try {
    // Need inviter name — fetch from DB via session
    const { findUserById } = await import('@/lib/db')
    const inviter = await findUserById(session.userId)
    await sendWorkspaceInviteEmail(email, {
      inviterName: inviter?.name ?? 'Someone',
      workspaceName: workspace.name,
      token,
    })
  } catch (err) {
    console.error('Invite email failed:', err)
  }

  return {
    invite: {
      id: invite.id,
      email,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    },
  }
}

export async function cancelInvite({ inviteId, workspaceId }) {
  const session = await getSession()
  if (!session?.userId) return { error: 'Unauthorized' }

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace || workspace.owner_id !== session.userId) {
    return { error: 'Only the workspace owner can cancel invites' }
  }

  await cancelWorkspaceInvite(inviteId, workspaceId)
  return { ok: true }
}

export async function removeMember({ workspaceId, userId }) {
  const session = await getSession()
  if (!session?.userId) return { error: 'Unauthorized' }

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace || workspace.owner_id !== session.userId) {
    return { error: 'Only the workspace owner can remove members' }
  }
  if (userId === session.userId) return { error: 'Cannot remove yourself' }

  await removeWorkspaceMember(workspaceId, userId)
  await deleteUser(userId)
  return { ok: true }
}

export async function acceptInvite(token) {
  const session = await getSession()
  if (!session?.userId) {
    redirect(`/login?from=/accept-invite?token=${token}`)
  }

  const invite = await getWorkspaceInviteByToken(token)
  if (!invite) return { error: 'This invite link is invalid or has expired.' }

  await acceptWorkspaceInvite(invite.id, invite.workspace_id, session.userId)
  revalidatePath('/team')
  return { ok: true, workspaceName: invite.workspace_name }
}
