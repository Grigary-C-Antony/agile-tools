'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSession } from '@/hooks/useSession'

interface NavItem {
  label: string
  href: string
  icon: string
  iconFill?: boolean
  badge?: string
  matchPrefix?: boolean
  adminOnly?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', iconFill: true },
    ]
  },
  {
    title: 'Estimation',
    items: [
      { label: 'Planning Poker', href: '/planning-poker', icon: 'casino', matchPrefix: true },
      { label: 'Estimators', href: '/estimators', icon: 'calculate', matchPrefix: true },
    ]
  },
  {
    title: 'Prioritization',
    items: [
      { label: 'WSJF Calculator', href: '/prioritization?tab=wsjf', icon: 'leaderboard', matchPrefix: false },
      { label: 'RICE Scoring', href: '/prioritization?tab=rice', icon: 'priority_high', matchPrefix: false },
    ]
  },
  {
    title: 'Sprint Tools',
    items: [
      { label: 'Capacity Planner', href: '/sprint-tools?tab=capacity', icon: 'event_repeat', matchPrefix: false, adminOnly: true },
      { label: 'Sprint Day Calc.', href: '/sprint-tools?tab=days', icon: 'calendar_today', matchPrefix: false, adminOnly: true },
      { label: 'Velocity Tracker', href: '/sprint-tools?tab=velocity', icon: 'speed', matchPrefix: false, badge: 'New', adminOnly: true },
      { label: 'Leave Tracker', href: '/sprint-tools?tab=leave', icon: 'beach_access', matchPrefix: false, adminOnly: true },
    ]
  },
  {
    title: 'Organization',
    items: [
      { label: 'Members', href: '/members', icon: 'group', matchPrefix: true },
      { label: 'Settings', href: '/settings', icon: 'settings', matchPrefix: true },
    ]
  },
]

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
        isActive
          ? 'text-on-surface bg-white/8 border border-white/8 nav-active-bar'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5',
      )}
    >
      <span
        className={cn(
          'material-symbols-outlined text-[20px] transition-colors',
          isActive ? 'text-primary icon-fill' : 'text-on-surface-variant/70 group-hover:text-primary'
        )}
      >
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-mono font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
          {item.badge}
        </span>
      )}
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 ml-auto shrink-0" />
      )}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { session } = useSession()
  const isAdmin = session?.role === 'admin'

  function isActive(item: NavItem): boolean {
    const [hrefPath, hrefQuery] = item.href.split('?')
    if (item.matchPrefix) return pathname.startsWith(hrefPath)
    if (pathname !== hrefPath) return false
    // If the nav item has no query params, match on path alone
    if (!hrefQuery) return true
    // If it does, every query param in the href must match the current URL
    const expected = new URLSearchParams(hrefQuery)
    for (const [key, val] of expected) {
      if (searchParams.get(key) !== val) return false
    }
    return true
  }

  async function handleSignOut() {
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/')
  }

  return (
    <aside className="glass-sidebar fixed left-0 top-0 h-screen w-64 flex flex-col z-40 select-none">
      {/* ── Brand ── */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shrink-0">
          <span className="material-symbols-outlined text-white text-[20px] icon-fill">widgets</span>
        </div>
        <div className="overflow-hidden">
          <h1 className="font-display text-[17px] font-bold text-on-surface tracking-tight leading-tight">
            Agile Toolkit
          </h1>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section, i) => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
          if (visibleItems.length === 0) return null
          return (
            <div key={i}>
              {section.title && (
                <p className="text-label-caps text-[9px] text-on-surface-variant/35 px-3 mb-1.5 tracking-[0.15em]">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavLink key={item.href} item={item} isActive={isActive(item)} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 pb-4 space-y-2 border-t border-white/5 pt-3">
        <div className="flex gap-1">
          <Link
            href="/settings"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">help</span>
            Help
          </Link>
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-error/50 hover:text-error/80 hover:bg-error/5 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
