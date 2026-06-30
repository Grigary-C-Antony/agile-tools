'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { MOCK_USERS } from '@/lib/mock-data'

const currentUser = MOCK_USERS[0]

interface TopNavProps {
  title?: string
  actions?: ReactNode
}

export function TopNav({ title, actions }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="glass-nav fixed top-0 right-0 w-[calc(100%-256px)] z-30 h-16 flex items-center justify-between px-6 gap-4">
      {/* ── Left: Search ── */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="relative group max-w-xs w-full hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[17px] pointer-events-none group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className={cn(
              'w-full glass-input rounded-full pl-9 pr-4 py-2 text-sm text-on-surface',
              'placeholder:text-on-surface-variant/35 focus:w-80 transition-all duration-300'
            )}
          />
        </div>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
            Dashboard
          </Link>
          <Link href="/members" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
            Team
          </Link>
          <Link href="/sprint-tools?tab=velocity" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">
            Analytics
          </Link>
        </nav>
      </div>

      {/* ── Right: Actions + User ── */}
      <div className="flex items-center gap-3 shrink-0">
        {actions}

        {/* Create New */}
        <Link
          href="/planning-poker"
          className="hidden sm:flex items-center gap-2 gradient-brand text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity neon-glow-purple shadow-md"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
          Create New
        </Link>

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/8 text-on-surface-variant hover:text-primary hover:bg-white/10 hover:border-white/15 transition-all">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-secondary border border-background" />
        </button>

        {/* Avatar */}
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-0.5 cursor-pointer">
            {currentUser.avatar ? (
              <Image
                src={currentUser.avatar}
                alt={currentUser.name}
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold">
                {currentUser.initials}
              </div>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
        </div>
      </div>
    </header>
  )
}
