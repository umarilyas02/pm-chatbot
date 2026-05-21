'use client'

import { usePathname } from 'next/navigation'
import { Search, LogOut, Menu } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import NotificationBell from './NotificationBell'

const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/chat':          'AI Chat',
  '/board':         'Board',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
}

export default function Header({ onMenuClick }) {
  const pathname = usePathname()
  const title =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ?? 'CreateX'

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#020617]/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-[#f8fafc] cursor-pointer md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="font-mono text-sm font-semibold text-[#f8fafc]">{title}</h1>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Search — hidden on very small screens */}
        <button className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-[#f8fafc] cursor-pointer">
          <Search className="h-4 w-4" />
        </button>

        <NotificationBell />

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/20 text-xs font-semibold text-[#22c55e] cursor-default select-none">
          U
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-red-400 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  )
}
