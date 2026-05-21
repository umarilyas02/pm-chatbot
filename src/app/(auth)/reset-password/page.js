import { Zap, XCircle } from 'lucide-react'
import Link from 'next/link'
import { verifyPasswordResetToken } from '@/lib/db'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const metadata = { title: 'Reset Password — CreateX' }

export default async function ResetPasswordPage({ searchParams }) {
  const { token } = await searchParams

  if (!token) {
    return <InvalidToken message="No reset token found. Request a new link." />
  }

  const record = await verifyPasswordResetToken(token)
  if (!record) {
    return <InvalidToken message="This reset link is invalid or has expired." />
  }

  return (
    <div className="glass rounded-2xl p-8">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Set new password</h1>
          <p className="mt-1 text-sm text-slate-400">
            Resetting password for <span className="text-slate-300">{record.email}</span>
          </p>
        </div>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  )
}

function InvalidToken({ message }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <XCircle className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Link expired</h1>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
      <Link
        href="/forgot-password"
        className="inline-flex items-center justify-center rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Request new link
      </Link>
    </div>
  )
}
