'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chat',          icon: MessageSquare,   label: 'AI Chat' },
  { href: '/projects',      icon: FolderKanban,    label: 'Projects' },
  { href: '/team',          icon: Users,           label: 'Team' },
  { href: '/notifications', icon: Bell,            label: 'Notifications' },
  { href: '/settings',      icon: Settings,        label: 'Settings' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navContent = (showLabels) => (
    <nav className="flex flex-1 flex-col gap-1 p-2 pt-3">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'group flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer',
              active
                ? 'bg-[#22C55E]/10 text-[#22C55E]'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-[#F8FAFC]'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {showLabels && <span className="truncate">{label}</span>}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'relative hidden md:flex flex-col border-r border-white/[0.06] bg-[#0F172A] transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/[0.06] px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-mono text-sm font-semibold tracking-tight text-[#F8FAFC]">
                CreateX
              </span>
            )}
          </div>
        </div>

        {navContent(!collapsed)}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.08] bg-[#0F172A] text-slate-400 transition-colors hover:text-[#F8FAFC] cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#0F172A] transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo + close */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight text-[#F8FAFC]">
              CreateX
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-[#F8FAFC] cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {navContent(true)}
      </aside>
    </>
  )
}
