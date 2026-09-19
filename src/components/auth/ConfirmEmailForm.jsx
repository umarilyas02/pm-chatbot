'use client'

import { useState, useTransition } from 'react'
import { verifyEmail } from '@/app/actions/auth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmEmailForm({ token, loginHref }) {
  const [result, setResult] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      setResult(await verifyEmail(token))
    })
  }

  if (result?.success) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/20">
            <CheckCircle className="h-6 w-6 text-[#22c55e]" />
          </div>
          <p className="text-sm text-slate-400">{result.email} is now confirmed.</p>
        </div>
        <Link
          href={loginHref}
          className="flex w-full items-center justify-center rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    )
  }

  if (result?.error) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
          <XCircle className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-sm text-slate-400">{result.error}</p>
      </div>
    )
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
    >
      {isPending ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
      ) : (
        <><CheckCircle className="h-4 w-4" /> Confirm email</>
      )}
    </button>
  )
}
