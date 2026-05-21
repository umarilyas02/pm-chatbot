import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Sign In — CreateX',
}

export default function LoginPage() {
  return (
    <div className="glass rounded-2xl p-8">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to your CreateX workspace</p>
        </div>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-[#22c55e] transition-colors hover:text-[#16a34a]"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
