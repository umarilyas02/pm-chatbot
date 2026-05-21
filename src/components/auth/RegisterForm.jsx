'use client'

import { useActionState } from 'react'
import { register } from '@/app/actions/auth'
import { Loader2 } from 'lucide-react'

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined)

  return (
    <form action={action} className="space-y-4">
      {/* Global error */}
      {state?.message && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {state.message}
        </p>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-slate-300">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Alex Johnson"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.name && (
          <p className="text-xs text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Email */}
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
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 chars with a letter and number"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
