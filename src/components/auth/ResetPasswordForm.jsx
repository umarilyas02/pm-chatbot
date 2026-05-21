'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/app/actions/auth'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordForm({ token }) {
  const [state, action, pending] = useActionState(resetPassword, undefined)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state?.message && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {state.message}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-slate-300">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.confirm && (
          <p className="text-xs text-red-400">{state.errors.confirm[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}
