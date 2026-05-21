'use client'

import { useState, useTransition } from 'react'
import { Mail, Crown, User, Trash2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { inviteMember, cancelInvite, removeMember } from '@/app/actions/workspace'
import { cn } from '@/lib/utils'

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  return (
    <div className={cn(
      'flex shrink-0 items-center justify-center rounded-full bg-[#22c55e]/20 font-semibold text-[#22c55e]',
      size === 'md' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs'
    )}>
      {initials}
    </div>
  )
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TeamClient({ workspace, initialMembers, initialInvites, currentUserId }) {
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const isOwner = workspace.owner_id === currentUserId

  function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return

    startTransition(async () => {
      const result = await inviteMember({ workspaceId: workspace.id, email: email.trim() })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`Invite sent to ${email}`)
        setEmail('')
        if (result?.invite) setInvites((prev) => [result.invite, ...prev])
      }
    })
  }

  function handleCancelInvite(inviteId) {
    startTransition(async () => {
      const result = await cancelInvite({ inviteId, workspaceId: workspace.id })
      if (result?.error) {
        toast.error(result.error)
      } else {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      }
    })
  }

  function handleRemoveMember(userId, name) {
    if (!confirm(`Remove ${name} from the workspace?`)) return
    startTransition(async () => {
      const result = await removeMember({ workspaceId: workspace.id, userId })
      if (result?.error) {
        toast.error(result.error)
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== userId))
        toast.success(`${name} removed`)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      {isOwner && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#f8fafc]">Invite a teammate</h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
                className="w-full rounded-lg border border-white/[0.08] bg-[#020617] py-2.5 pl-9 pr-4 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send invite
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#f8fafc]">Members</h3>
        <ul className="divide-y divide-white/[0.04]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#f8fafc]">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-2 text-xs text-slate-500">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                  m.role === 'owner'
                    ? 'bg-amber-400/10 text-amber-400'
                    : 'bg-slate-400/10 text-slate-400'
                )}>
                  {m.role === 'owner' ? <Crown className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                  {m.role}
                </span>
                {isOwner && m.id !== currentUserId && (
                  <button
                    onClick={() => handleRemoveMember(m.id, m.name)}
                    disabled={isPending}
                    className="rounded p-1 text-slate-700 transition-colors hover:text-red-400 disabled:opacity-40 cursor-pointer"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pending invites */}
      {isOwner && invites.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-5">
          <h3 className="mb-4 text-sm font-semibold text-[#f8fafc]">Pending invites</h3>
          <ul className="divide-y divide-white/[0.04]">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-white/10 text-slate-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-300">{inv.email}</p>
                  <p className="text-xs text-slate-600">
                    Sent {formatDate(inv.created_at)} · expires {formatDate(inv.expires_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  disabled={isPending}
                  className="rounded p-1 text-slate-700 transition-colors hover:text-red-400 disabled:opacity-40 cursor-pointer"
                  aria-label="Cancel invite"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
