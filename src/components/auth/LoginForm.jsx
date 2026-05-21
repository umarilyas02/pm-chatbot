'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import ResendVerificationForm from '@/components/auth/ResendVerificationForm'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  // Email not verified — show resend flow instead of generic error
  if (state?.unverified) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
          {state.message}
        </p>
        <ResendVerificationForm />
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
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.email && (
          <p className="text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-slate-500 transition-colors hover:text-[#22c55e]"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0f172a] px-4 py-2.5 text-sm text-[#f8fafc] placeholder-slate-600 outline-none transition-colors focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/30"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
