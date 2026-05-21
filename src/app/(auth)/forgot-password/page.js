import { Zap } from 'lucide-react'
import Link from 'next/link'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = { title: 'Forgot Password — CreateX' }

export default function ForgotPasswordPage() {
  return (
    <div className="glass rounded-2xl p-8">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Forgot password?</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>
      </div>

      <ForgotPasswordForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link
          href="/login"
          className="font-medium text-[#22c55e] transition-colors hover:text-[#16a34a]"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
