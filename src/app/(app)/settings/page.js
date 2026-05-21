import { redirect } from 'next/navigation'
import { Zap } from 'lucide-react'
import { getSession } from '@/lib/session'
import { findUserById } from '@/lib/db'
import { logout } from '@/app/actions/auth'
import ProfileForm from '@/components/settings/ProfileForm'
import PasswordForm from '@/components/settings/PasswordForm'

export const metadata = { title: 'Settings — CreateX' }

export default async function SettingsPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const user = await findUserById(session.userId)
  if (!user) redirect('/login')

  const serialized = {
    id:         user.id,
    name:       user.name,
    email:      user.email,
    role:       user.role,
    created_at: user.created_at.toISOString(),
  }

  const memberSince = new Date(serialized.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year:  'numeric',
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-6">

        {/* Page heading */}
        <div>
          <h2 className="font-mono text-xl font-semibold text-[#f8fafc]">Settings</h2>
          <p className="mt-1 text-sm text-slate-400">Manage your account and preferences.</p>
        </div>

        {/* Profile */}
        <ProfileForm user={serialized} />

        {/* Security */}
        <PasswordForm />

        {/* About */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0f172a] p-6">
          <h3 className="mb-1 font-mono text-sm font-semibold text-[#f8fafc]">About</h3>
          <p className="mb-5 text-xs text-slate-500">Application information.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#22c55e]">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-[#f8fafc]">CreateX</span>
              </div>
              <span className="font-mono text-xs text-slate-500">v0.1.0</span>
            </div>

            <div className="h-px bg-white/[0.04]" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-600">AI model</p>
                <p className="mt-0.5 font-mono text-slate-400">
                  {process.env.NEXT_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash'}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Member since</p>
                <p className="mt-0.5 text-slate-400">{memberSince}</p>
              </div>
              <div>
                <p className="text-slate-600">Stack</p>
                <p className="mt-0.5 font-mono text-slate-400">Next.js · Gemini · Postgres</p>
              </div>
              <div>
                <p className="text-slate-600">User ID</p>
                <p className="mt-0.5 truncate font-mono text-slate-600" title={serialized.id}>
                  {serialized.id.slice(0, 8)}…
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-400/10 bg-[#0f172a] p-6">
          <h3 className="mb-1 font-mono text-sm font-semibold text-red-400">Danger zone</h3>
          <p className="mb-5 text-xs text-slate-500">
            Sign out of your account on this device.
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-red-400/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
