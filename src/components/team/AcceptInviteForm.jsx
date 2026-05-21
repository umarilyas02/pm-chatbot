'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvite } from '@/app/actions/workspace'
import { Loader2, CheckCircle } from 'lucide-react'

export default function AcceptInviteForm({ token }) {
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvite(token)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/team')
      }
    })
  }

  if (error) {
    return (
      <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
    )
  }

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
    >
      {isPending ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Joining…</>
      ) : (
        <><CheckCircle className="h-4 w-4" /> Accept & join workspace</>
      )}
    </button>
  )
}
