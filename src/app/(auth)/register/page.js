import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Create Account — CreateX',
}

export default async function RegisterPage({ searchParams }) {
  const { from } = await searchParams
  const fromPath = typeof from === 'string' ? from : undefined

  return (
    <div className="glass rounded-2xl p-8">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-mono text-xl font-semibold text-[#f8fafc]">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Get started with CreateX for free</p>
        </div>
      </div>

      <RegisterForm from={fromPath} />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href={fromPath ? `/login?from=${encodeURIComponent(fromPath)}` : '/login'}
          className="font-medium text-[#22c55e] transition-colors hover:text-[#16a34a]"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
