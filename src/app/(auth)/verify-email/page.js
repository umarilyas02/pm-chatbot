import { Zap, XCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { checkVerificationToken } from '@/app/actions/auth'
import ResendVerificationForm from '@/components/auth/ResendVerificationForm'
import ConfirmEmailForm from '@/components/auth/ConfirmEmailForm'

export const metadata = { title: 'Verify Email — CreateX' }

export default async function VerifyEmailPage({ searchParams }) {
  const { token, from } = await searchParams
  const loginHref = typeof from === 'string' ? `/login?from=${encodeURIComponent(from)}` : '/login'

  // Token present → show a confirm screen. Verification only happens once the
  // user explicitly clicks "Confirm email" (not just from loading this page) —
  // otherwise email-security link scanners burn the single-use token before
  // the real person ever clicks it.
  if (token) {
    const check = await checkVerificationToken(token)

    if (check.alreadyVerified) {
      return (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Already verified</h1>
            <p className="text-sm text-slate-400">{check.email} is already confirmed.</p>
          </div>
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      )
    }

    if (check.error) {
      return (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Link invalid</h1>
            <p className="text-sm text-slate-400">{check.error}</p>
          </div>
          <p className="mb-4 text-sm text-slate-500">Need a new link?</p>
          <ResendVerificationForm />
        </div>
      )
    }

    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Confirm your email</h1>
          <p className="text-sm text-slate-400">Click below to verify {check.email}.</p>
        </div>
        <ConfirmEmailForm token={token} loginHref={loginHref} />
      </div>
    )
  }

  // No token → "check your email" notice (shown after registration)
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
          <Mail className="h-6 w-6 text-blue-400" />
        </div>
        <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Check your inbox</h1>
        <p className="max-w-xs text-sm text-slate-400">
          We sent a verification link to your email address. Click it to activate your account.
        </p>
      </div>
      <p className="mb-4 text-sm text-slate-500">Didn&apos;t get it?</p>
      <ResendVerificationForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already verified?{' '}
        <Link
          href={loginHref}
          className="font-medium text-[#22c55e] transition-colors hover:text-[#16a34a]"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
