import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { MOCK_USERS, MOCK_ORG, TOOL_CARDS, TOOL_CATEGORIES } from '@/lib/mock-data'
import { getToolCategoryColor, timeAgo } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

const KPI_CARDS = [
  { label: 'Active Sessions', value: '3', icon: 'sensors', color: 'text-primary', bg: 'bg-primary/15 border-primary/20' },
  { label: 'Total Members', value: '12', icon: 'group', color: 'text-secondary', bg: 'bg-secondary/15 border-secondary/20' },
  { label: 'Stories Estimated', value: '128', icon: 'check_circle', color: 'text-tertiary', bg: 'bg-tertiary/15 border-tertiary/20' },
  { label: 'Sprint Velocity', value: '34', sub: '+12%', icon: 'trending_up', color: 'text-on-surface', bg: 'bg-white/5 border-white/10' },
]

const RECENT_SESSIONS = [
  { title: 'Sprint 24 Estimation', type: 'Planning Poker', time: '2h ago', icon: 'casino', color: 'text-primary', bg: 'bg-primary/10 border-primary/20', href: '/planning-poker/session-001' },
  { title: 'Q3 Priority Matrix', type: 'WSJF Tool', time: '1d ago', icon: 'leaderboard', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20', href: '/prioritization?tab=wsjf' },
  { title: 'Sprint 23 Retro', type: 'Team Retrospective', time: '2d ago', icon: 'history', color: 'text-on-surface', bg: 'bg-white/5 border-white/10', href: '/dashboard' },
  { title: 'Capacity Planning Q2', type: 'Sprint Capacity', time: '3d ago', icon: 'event_repeat', color: 'text-tertiary', bg: 'bg-tertiary/10 border-tertiary/20', href: '/sprint-tools?tab=capacity' },
]

export default function DashboardPage() {
  const approvedMembers = MOCK_USERS.filter(u => u.memberStatus === 'approved')
  const pendingCount = MOCK_USERS.filter(u => u.memberStatus === 'pending').length

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px]">
      {/* ── Header ── */}
      <div className="animate-fade-in">
        <h2 className="text-display-md text-on-surface tracking-tight">Dashboard</h2>
        <p className="text-on-surface-variant mt-1">
          Welcome back, <span className="text-on-surface font-semibold">{MOCK_USERS[0].name}</span>! Here&apos;s your workspace overview.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {KPI_CARDS.map((kpi) => (
          <GlassCard key={kpi.label} hover padding="md" className="animate-fade-in">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${kpi.bg}`}>
                <span className={`material-symbols-outlined text-[26px] ${kpi.color}`}>{kpi.icon}</span>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant/50 text-[10px]">{kpi.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-on-surface leading-none">{kpi.value}</p>
                  {kpi.sub && (
                    <span className="text-[11px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md">
                      {kpi.sub}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Tools Grid (it-tools.tech style) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline text-on-surface">All Tools</h3>
          <Badge variant="glass">{TOOL_CARDS.length} tools</Badge>
        </div>

        {TOOL_CATEGORIES.map(category => {
          const tools = TOOL_CARDS.filter(t => t.category === category)
          const colors = getToolCategoryColor(category)
          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-px flex-1 ${colors.bg}`} />
                <span className={`text-label-caps text-[10px] px-3 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {category}
                </span>
                <div className={`h-px flex-1 ${colors.bg}`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 stagger">
                {tools.map(tool => {
                  const c = getToolCategoryColor(tool.category)
                  return (
                    <Link key={tool.id} href={tool.href}>
                      <GlassCard
                        hover
                        padding="md"
                        className="group h-full animate-fade-in"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            <span className={`material-symbols-outlined text-[22px] ${c.icon}`}>{tool.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                                {tool.title}
                              </h4>
                              {tool.badge && <Badge variant="new">{tool.badge}</Badge>}
                              {tool.isNew && <Badge variant="primary">New</Badge>}
                            </div>
                            <p className="text-xs text-on-surface-variant/70 leading-relaxed line-clamp-2">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                        {/* Arrow on hover */}
                        <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-primary flex items-center gap-1 font-medium">
                            Open tool
                            <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </span>
                        </div>
                      </GlassCard>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Bottom Row: Recent + Quick Actions + Team ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sessions */}
        <GlassCard padding="none" className="animate-fade-in">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Recent Sessions</h3>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>
          <div className="p-3 space-y-1">
            {RECENT_SESSIONS.map(session => (
              <Link key={session.title} href={session.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl ${session.bg} border flex items-center justify-center ${session.color} group-hover:scale-105 transition-transform shrink-0`}>
                    <span className="material-symbols-outlined text-[18px]">{session.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm truncate">{session.title}</p>
                    <p className="text-[11px] text-on-surface-variant/50 uppercase tracking-tight">{session.type}</p>
                  </div>
                  <span className="text-[11px] text-on-surface-variant/40 font-medium shrink-0">{session.time}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-3 pt-0">
            <button className="w-full py-2.5 text-center text-on-surface-variant hover:text-on-surface bg-white/5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10">
              View All Sessions
            </button>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard padding="none" className="animate-fade-in" style={{ animationDelay: '60ms' }}>
          <div className="p-6 border-b border-white/5">
            <h3 className="text-base font-bold text-on-surface">Quick Actions</h3>
          </div>
          <div className="p-3 space-y-1.5">
            {[
              { label: 'Start Planning Poker', icon: 'play_arrow', href: '/planning-poker', color: 'bg-primary/20 text-primary' },
              { label: 'WSJF Priority Calculator', icon: 'calculate', href: '/prioritization?tab=wsjf', color: 'bg-secondary/20 text-secondary' },
              { label: 'Open RICE Scoring', icon: 'bar_chart', href: '/prioritization?tab=rice', color: 'bg-tertiary/20 text-tertiary' },
              { label: 'Sprint Capacity Planner', icon: 'event_repeat', href: '/sprint-tools?tab=capacity', color: 'bg-white/10 text-on-surface-variant' },
              { label: 'Velocity Calculator', icon: 'speed', href: '/sprint-tools?tab=velocity', color: 'bg-green-500/15 text-green-400' },
            ].map(action => (
              <Link key={action.label} href={action.href}>
                <button className="w-full text-left flex items-center gap-4 p-3.5 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-high border border-white/5 hover:border-white/10 transition-all group">
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform text-[18px]">{action.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-on-surface">{action.label}</span>
                  <span className="ml-auto material-symbols-outlined text-[16px] text-on-surface-variant/30 group-hover:text-primary transition-colors">arrow_forward</span>
                </button>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Team Members */}
        <GlassCard padding="none" className="animate-fade-in" style={{ animationDelay: '120ms' }}>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">Team Members</h3>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <Link href="/members">
                  <Badge variant="error" dot>{pendingCount} pending</Badge>
                </Link>
              )}
              <Link href="/members" className="text-primary text-sm font-bold hover:underline">Manage</Link>
            </div>
          </div>
          <div className="p-3 space-y-1">
            {approvedMembers.slice(0, 5).map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl group transition-all hover:bg-white/5">
                <div className="relative shrink-0">
                  {member.avatar ? (
                    <Image
                      src={member.avatar}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border-2 border-white/10 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-brand border-2 border-white/10 flex items-center justify-center text-white text-sm font-bold">
                      {member.initials}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container ${
                    member.status === 'online' ? 'bg-green-500' : member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-on-surface truncate">{member.name}</p>
                  <p className="text-[11px] text-on-surface-variant/50 uppercase tracking-wide">{member.role}</p>
                </div>
                {member.orgRole === 'admin' && (
                  <Badge variant="primary">Admin</Badge>
                )}
                <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                </button>
              </div>
            ))}
          </div>
          <div className="p-3 pt-0">
            <Link href="/members">
              <button className="w-full py-2.5 text-center text-on-surface-variant hover:text-on-surface bg-white/5 rounded-xl text-sm font-semibold transition-all hover:bg-white/10">
                Manage Team
              </button>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-label-caps text-[10px] text-on-surface-variant/40 tracking-wider">
          © 2024 Agile Toolkit. Engineered for precision.
        </p>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'API Status'].map(link => (
            <a key={link} href="#" className="text-label-caps text-[10px] text-on-surface-variant/40 hover:text-primary transition-colors uppercase tracking-widest">
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
