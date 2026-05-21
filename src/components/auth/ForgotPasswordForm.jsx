'use client'

import { useActionState } from 'react'
import { forgotPassword } from '@/app/actions/auth'
import { Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, undefined)

  if (state?.sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-[#22c55e]/10 p-6 text-center">
        <CheckCircle className="h-8 w-8 text-[#22c55e]" />
        <p className="text-sm text-slate-300">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {state.message}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
