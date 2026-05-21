'use client'

import { useActionState } from 'react'
import { resendVerification } from '@/app/actions/auth'
import { Loader2 } from 'lucide-react'

export default function ResendVerificationForm() {
  const [state, action, pending] = useActionState(resendVerification, undefined)

  if (state?.sent) {
    return (
      <p className="rounded-lg bg-[#22c55e]/10 px-4 py-2.5 text-sm text-[#22c55e]">
        If that email exists and is unverified, a new link is on its way.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      {state?.message && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          className="flex-1 rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-[#22c55e]/40 hover:text-[#22c55e] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Resend
        </button>
      </div>
    </form>
  )
}
