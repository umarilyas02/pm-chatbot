'use client'

import { useActionState, useEffect } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { changePassword } from '@/app/actions/settings'

const inputCls =
  'w-full rounded-lg border border-white/[0.08] bg-[#020617] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/20'

function FieldError({ errors, name }) {
  if (!errors?.[name]) return null
  return <p className="mt-1.5 text-xs text-red-400">{errors[name][0]}</p>
}

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
  }, [state])

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-6">
      <h3 className="mb-1 font-mono text-sm font-semibold text-[#f8fafc]">Security</h3>
      <p className="mb-6 text-xs text-slate-500">Change your account password.</p>

      <form action={action} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Current password</label>
          <input
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputCls}
          />
          <FieldError errors={state?.errors} name="currentPassword" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">New password</label>
          <input
            type="password"
            name="newPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputCls}
          />
          <FieldError errors={state?.errors} name="newPassword" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Confirm new password</label>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            className={inputCls}
          />
          <FieldError errors={state?.errors} name="confirmPassword" />
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
            Change password
          </button>
        </div>
      </form>
    </div>
  )
}
