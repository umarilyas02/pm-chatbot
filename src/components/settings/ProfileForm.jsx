'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/settings'

const inputCls =
  'w-full rounded-lg border border-white/[0.08] bg-[#020617] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/20'

export default function ProfileForm({ user }) {
  const [state, action, pending] = useActionState(updateProfile, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
  }, [state])

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-6">
      <h3 className="mb-1 font-mono text-sm font-semibold text-[#f8fafc]">Profile</h3>
      <p className="mb-6 text-xs text-slate-500">Update your display name.</p>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/20 text-xl font-semibold text-[#22c55e] select-none">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-[#f8fafc]">{user.name}</p>
          <span className="mt-1 inline-block rounded-full bg-[#22c55e]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#22c55e]">
            {user.role}
          </span>
        </div>
      </div>

      <form action={action} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Display name</label>
          <input
            name="name"
            defaultValue={user.name}
            placeholder="Your name"
            className={inputCls}
          />
          {state?.errors?.name && (
            <p className="mt-1.5 text-xs text-red-400">{state.errors.name[0]}</p>
          )}
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Email address</label>
          <input
            value={user.email}
            readOnly
            className={`${inputCls} cursor-not-allowed opacity-50`}
          />
          <p className="mt-1.5 text-[11px] text-slate-600">Email cannot be changed.</p>
        </div>

        {state?.success && (
          <div className="flex items-center gap-2 rounded-lg border border-[#22c55e]/20 bg-[#22c55e]/[0.06] px-3 py-2.5 text-xs text-[#22c55e]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            {state.success}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
