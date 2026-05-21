import { Zap, UserPlus, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getWorkspaceInviteByToken } from '@/lib/db'
import { getSession } from '@/lib/session'
import AcceptInviteForm from '@/components/team/AcceptInviteForm'

export const metadata = { title: 'Join Workspace — CreateX' }

export default async function AcceptInvitePage({ searchParams }) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidInvite message="No invite token found." />
  }

  const invite = await getWorkspaceInviteByToken(token)
  if (!invite) {
    return <InvalidInvite message="This invite link is invalid or has expired." />
  }

  const session = await getSession()

  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/20">
          <UserPlus className="h-6 w-6 text-[#22c55e]" />
        </div>
        <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">You&apos;re invited</h1>
        <p className="max-w-xs text-sm text-slate-400">
          <span className="text-slate-300">{invite.inviter_name}</span> invited you to join{' '}
          <span className="text-slate-300">{invite.workspace_name}</span> on CreateX.
        </p>
      </div>

      {session ? (
        <AcceptInviteForm token={token} />
      ) : (
        <div className="space-y-3">
          <Link
            href={`/register?from=/accept-invite?token=${token}`}
            className="flex w-full items-center justify-center rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Create account & join
          </Link>
          <Link
            href={`/login?from=/accept-invite?token=${token}`}
            className="flex w-full items-center justify-center rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-[#f8fafc]"
          >
            Sign in & join
          </Link>
        </div>
      )}
    </div>
  )
}

function InvalidInvite({ message }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <XCircle className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Invalid invite</h1>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-[#f8fafc]"
      >
        Go to sign in
      </Link>
    </div>
  )
}
