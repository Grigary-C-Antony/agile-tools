'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { TOOL_CARDS, TOOL_CATEGORIES } from '@/lib/mock-data'
import { getToolCategoryColor } from '@/lib/utils'
import { useSession } from '@/hooks/useSession'

interface DashboardData {
  stats: {
    activeSessions: number
    totalMembers: number
    pendingCount: number
    storiesEstimated: number
    avgVelocity: number
  }
  recentSessions: Array<{
    id: string
    name: string
    scale: string
    status: string
    created_at: number
    storyCount: number
    creatorName: string
  }>
  memberName: string
  orgName: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const { session } = useSession()
  const isAdmin = session?.role === 'admin'

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData)
  }, [])

  const kpiCards = data ? [
    { label: 'Active Sessions', value: String(data.stats.activeSessions), icon: 'sensors', color: 'text-primary', bg: 'bg-primary/15 border-primary/20' },
    { label: 'Total Members', value: String(data.stats.totalMembers), icon: 'group', color: 'text-secondary', bg: 'bg-secondary/15 border-secondary/20' },
    { label: 'Stories Estimated', value: String(data.stats.storiesEstimated), icon: 'check_circle', color: 'text-tertiary', bg: 'bg-tertiary/15 border-tertiary/20' },
    { label: 'Avg Velocity', value: String(data.stats.avgVelocity || '—'), sub: data.stats.avgVelocity ? 'pts/sprint' : undefined, icon: 'trending_up', color: 'text-on-surface', bg: 'bg-white/5 border-white/10' },
  ] : []

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px]">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-display-md text-on-surface tracking-tight">Dashboard</h2>
        <p className="text-on-surface-variant mt-1">
          Welcome back, <span className="text-on-surface font-semibold">{data?.memberName ?? '...'}</span>!
          {data?.stats.pendingCount ? (
            <span className="ml-2 text-secondary text-sm">
              <span className="material-symbols-outlined text-[14px] align-middle mr-1">notifications</span>
              {data.stats.pendingCount} member{data.stats.pendingCount !== 1 ? 's' : ''} pending approval
            </span>
          ) : null}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {data ? kpiCards.map((kpi) => (
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
                    <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md">{kpi.sub}</span>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        )) : Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} padding="md" className="animate-pulse">
            <div className="h-16 bg-white/5 rounded-lg" />
          </GlassCard>
        ))}
      </div>

      {/* All Tools */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-on-surface">All Tools</h3>
          <span className="text-label-caps text-on-surface-variant/40 text-[10px]">{TOOL_CARDS.filter(t => isAdmin || t.category !== 'Sprint Tools').length} TOOLS</span>
        </div>

        {TOOL_CATEGORIES.filter(category => isAdmin || category !== 'Sprint Tools').map(category => {
          const tools = TOOL_CARDS.filter(t => t.category === category)
          if (!tools.length) return null
          return (
            <div key={category} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className={`text-label-caps text-[10px] font-bold ${getToolCategoryColor(category)}`}>{category.toUpperCase()}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {tools.map(tool => (
                  <Link key={tool.id} href={tool.href}>
                    <GlassCard hover padding="md" className="h-full group animate-fade-in">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 bg-white/5 border-white/10">
                          <span className="material-symbols-outlined text-[22px] text-on-surface">{tool.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{tool.title}</h4>
                            {tool.badge && <Badge variant={tool.badge === 'LIVE' ? 'tertiary' : 'primary'} dot={tool.badge === 'LIVE'}>{tool.badge}</Badge>}
                          </div>
                          <p className="text-xs text-on-surface-variant/60 leading-relaxed">{tool.description}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Poker Sessions */}
      {data && data.recentSessions.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-on-surface mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {data.recentSessions.map(s => (
              <Link key={s.id} href={`/planning-poker/${s.id}`}>
                <GlassCard hover padding="md" className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">casino</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface">{s.name}</p>
                    <p className="text-xs text-on-surface-variant/50">
                      by {s.creatorName} · {s.storyCount} {s.storyCount === 1 ? 'story' : 'stories'} · {s.scale}
                    </p>
                  </div>
                  <Badge variant={s.status === 'completed' ? 'glass' : 'tertiary'} dot={s.status !== 'completed'}>
                    {s.status === 'completed' ? 'Completed' : 'Active'}
                  </Badge>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
