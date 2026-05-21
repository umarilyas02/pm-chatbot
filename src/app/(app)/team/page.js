import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPrimaryWorkspace, getWorkspaceMembers, getPendingInvites } from '@/lib/db'
import TeamClient from '@/components/team/TeamClient'

export const metadata = { title: 'Team — CreateX' }

export default async function TeamPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const workspace = await getPrimaryWorkspace(session.userId)
  if (!workspace) redirect('/dashboard')

  const [members, invites] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getPendingInvites(workspace.id),
  ])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h2 className="font-mono text-xl font-semibold text-[#f8fafc]">{workspace.name}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <TeamClient
          workspace={workspace}
          initialMembers={members}
          initialInvites={invites}
          currentUserId={session.userId}
        />
      </div>
    </div>
  )
}
