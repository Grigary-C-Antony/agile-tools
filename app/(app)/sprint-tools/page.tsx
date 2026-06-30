'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { MOCK_SPRINT_CONFIG, MOCK_VELOCITY_DATA } from '@/lib/mock-data'
import { calcSprintCapacity, calcVelocityStats, formatDate } from '@/lib/utils'
import type { SprintConfig, SprintMember, Holiday } from '@/lib/types'

type Tab = 'capacity' | 'days' | 'velocity' | 'leave'

// ── Capacity Tab ──
function CapacityTab() {
  const [config, setConfig] = useState<SprintConfig>(MOCK_SPRINT_CONFIG)
  const result = useMemo(() => calcSprintCapacity(config), [config])

  const toggleRitual = (id: string) => {
    setConfig(prev => ({
      ...prev,
      rituals: prev.rituals.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    }))
  }

  const toggleHoliday = (id: string) => {
    setConfig(prev => ({
      ...prev,
      holidays: prev.holidays.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h)
    }))
  }

  const updateMemberPTO = (memberId: string, days: number) => {
    setConfig(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === memberId ? { ...m, ptoDays: days } : m)
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── Left: Settings ── */}
      <div className="lg:col-span-7 space-y-5">
        {/* Timeframe */}
        <GlassCard padding="md" className="animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[22px]">event_repeat</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Timeframe</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Start Date"
              type="date"
              value={config.startDate}
              onChange={e => setConfig(p => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={config.endDate}
              onChange={e => setConfig(p => ({ ...p, endDate: e.target.value }))}
            />
          </div>
        </GlassCard>

        {/* Environmental Factors */}
        <GlassCard padding="md" className="animate-fade-in" style={{ animationDelay: '60ms' } as React.CSSProperties}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">settings_accessibility</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Environmental Factors</h3>
          </div>

          <div className="space-y-6">
            {/* Holidays */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-on-surface">Public Holidays</h4>
                <Badge variant={result.holidayDays > 0 ? 'error' : 'glass'}>
                  Impact: {result.holidayDays}d
                </Badge>
              </div>
              <div className="space-y-2">
                {config.holidays.map(h => (
                  <label key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 cursor-pointer group transition-all">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={() => toggleHoliday(h.id)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">{h.name}</span>
                    <span className="ml-auto text-xs text-on-surface-variant/40">{formatDate(h.date)}</span>
                  </label>
                ))}
                <button className="flex items-center gap-2 text-xs text-primary hover:underline font-medium mt-1">
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  Add Custom Holiday
                </button>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Rituals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-on-surface">Sprint Rituals</h4>
                <Badge variant={result.ritualDays > 0 ? 'error' : 'glass'}>
                  Impact: {result.ritualDays}d
                </Badge>
              </div>
              <div className="space-y-2">
                {config.rituals.map(r => (
                  <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer group transition-all ${r.enabled ? '' : 'opacity-50'}`}>
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={() => toggleRitual(r.id)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-on-surface font-medium">{r.name}</p>
                      <p className="text-[11px] text-on-surface-variant/50">{r.description}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">{r.duration}d</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Individual PTO */}
        <GlassCard padding="md" className="animate-fade-in" style={{ animationDelay: '120ms' } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[22px]">group_add</span>
              </div>
              <h3 className="text-base font-bold text-on-surface">Individual PTO</h3>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-all">
              <span className="material-symbols-outlined text-[15px]">person_add</span> Add Member
            </button>
          </div>

          <div className="overflow-hidden border border-white/5 rounded-xl bg-black/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="py-3 px-4 text-label-caps text-[10px] text-on-surface-variant/50">Member</th>
                  <th className="py-3 px-4 text-label-caps text-[10px] text-on-surface-variant/50 text-center">PTO Days</th>
                  <th className="py-3 px-4 text-label-caps text-[10px] text-on-surface-variant/50 text-right">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {result.memberCapacities.map((mc) => (
                  <tr key={mc.memberId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                          style={{ background: `${mc.color}25`, color: mc.color }}
                        >
                          {mc.initials}
                        </div>
                        <span className="text-sm font-medium text-on-surface">{mc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        step={0.5}
                        min={0}
                        value={config.members.find(m => m.id === mc.memberId)?.ptoDays ?? 0}
                        onChange={e => updateMemberPTO(mc.memberId, parseFloat(e.target.value) || 0)}
                        className="glass-input w-16 text-center text-sm rounded-lg py-1"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className="text-sm font-bold"
                        style={{ color: mc.color }}
                      >
                        {mc.capacityPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* ── Right: Result ── */}
      <div className="lg:col-span-5">
        <div className="sticky top-24">
          <GlassCard padding="none" className="overflow-hidden top-border-gradient animate-fade-in">
            <div className="p-8 flex flex-col items-center text-center">
              <p className="text-label-caps text-on-surface-variant/40 text-[10px] mb-6 tracking-widest">Calculated Team Capacity</p>

              <div className="relative mb-4">
                <div className="absolute -inset-10 bg-primary/5 blur-[60px] rounded-full" />
                <div className="relative flex items-baseline justify-center gap-2">
                  <span className="text-[80px] font-extrabold leading-none tracking-tighter text-white drop-shadow-[0_0_30px_rgba(207,189,255,0.3)]">
                    {result.netProductionDays}
                  </span>
                  <span className="text-lg font-bold text-primary mb-2">DAYS</span>
                </div>
              </div>

              <div className="px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-6 inline-block">
                <p className="text-label-caps text-[11px] text-secondary tracking-widest">
                  ≈ {result.totalManHours} Man-Hours
                </p>
              </div>

              {/* Breakdown */}
              <div className="w-full bg-white/5 rounded-2xl p-5 border border-white/5 text-left space-y-3">
                <h4 className="text-label-caps text-on-surface-variant/40 text-[10px]">Detail Breakdown</h4>
                {[
                  { label: 'Gross Calendar Days', value: result.grossCalendarDays, prefix: '' },
                  { label: 'Weekends (Non-Working)', value: result.weekendDays, prefix: '-' },
                  { label: 'Public Holidays', value: result.holidayDays, prefix: '-' },
                  { label: 'Sprint Rituals', value: result.ritualDays, prefix: '-' },
                  { label: 'Total PTO Days', value: result.totalPtoDays, prefix: '-' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant/60">{row.label}</span>
                    <span className={row.prefix === '-' ? 'text-error/70 font-medium' : 'text-on-surface font-medium'}>
                      {row.prefix}{row.value}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-primary">Net Production Capacity</span>
                  <span className="text-lg font-bold text-primary">{result.netProductionDays}d</span>
                </div>
              </div>

              {/* Member breakdown */}
              <div className="w-full mt-4 space-y-2">
                {result.memberCapacities.map(mc => (
                  <div key={mc.memberId} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `${mc.color}25`, color: mc.color }}>
                      {mc.initials}
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${mc.capacityPercent}%`, background: mc.color }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: mc.color }}>{mc.capacityPercent}%</span>
                  </div>
                ))}
              </div>

              <div className="w-full mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface text-sm font-bold hover:bg-white/10 transition-all">
                  <span className="material-symbols-outlined text-[17px]">share</span> Export
                </button>
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/25 transition-all">
                  <span className="material-symbols-outlined text-[17px]">save</span> Save
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <p className="text-[11px] text-on-surface-variant/50">Real-time capacity sync enabled</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ── Velocity Tab ──
function VelocityTab() {
  const [sprints, setSprints] = useState(MOCK_VELOCITY_DATA)
  const stats = useMemo(() => calcVelocityStats(sprints), [sprints])

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {[
          { label: 'Average Velocity', value: stats.averageVelocity, icon: 'avg_pace', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
          { label: 'Min Velocity', value: stats.minVelocity, icon: 'arrow_downward', color: 'text-error', bg: 'bg-error/10 border-error/20' },
          { label: 'Max Velocity', value: stats.maxVelocity, icon: 'arrow_upward', color: 'text-success', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Next Sprint Forecast', value: stats.predictedNext, icon: 'trending_up', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20' },
        ].map(stat => (
          <GlassCard key={stat.label} hover padding="md" className="animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.bg} shrink-0`}>
                <span className={`material-symbols-outlined text-[20px] ${stat.color}`}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant/40 text-[10px]">{stat.label}</p>
                <p className="text-2xl font-bold text-on-surface">{stat.value}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Trend info */}
      <GlassCard topGradient padding="md" className="animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.trend === 'up' ? 'bg-green-500/10 text-green-400' : stats.trend === 'down' ? 'bg-error/10 text-error' : 'bg-white/5 text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[20px]">
                {stats.trend === 'up' ? 'trending_up' : stats.trend === 'down' ? 'trending_down' : 'trending_flat'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface">Velocity Trend</h4>
              <p className="text-sm text-on-surface-variant">
                {stats.trend === 'up' ? 'Improving' : stats.trend === 'down' ? 'Declining' : 'Stable'} — {stats.trendPercent > 0 ? '+' : ''}{stats.trendPercent}% vs. last sprint
              </p>
            </div>
          </div>
          <Badge variant={stats.trend === 'up' ? 'success' : stats.trend === 'down' ? 'error' : 'glass'}>
            {stats.trend === 'up' ? '▲' : stats.trend === 'down' ? '▼' : '●'} {stats.trendPercent > 0 ? '+' : ''}{stats.trendPercent}%
          </Badge>
        </div>
      </GlassCard>

      {/* Sprint data table */}
      <GlassCard padding="none" className="animate-fade-in">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-bold text-on-surface">Sprint History</h3>
          <Button variant="glass" size="sm" icon="add">Add Sprint</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Sprint', 'Planned', 'Completed', 'Accuracy', 'Team Size', 'Period'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-label-caps text-[10px] text-on-surface-variant/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...sprints].reverse().map(s => {
                const accuracy = s.plannedPoints > 0 ? Math.round((s.completedPoints / s.plannedPoints) * 100) : 0
                return (
                  <tr key={s.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono font-bold text-primary">Sprint {s.sprintNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-on-surface">{s.plannedPoints} pts</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">{s.completedPoints} pts</span>
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full gradient-brand rounded-full" style={{ width: `${accuracy}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${accuracy >= 90 ? 'text-green-400' : accuracy >= 70 ? 'text-tertiary' : 'text-error'}`}>
                        {accuracy}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">{s.teamSize}</td>
                    <td className="px-5 py-3.5 text-xs text-on-surface-variant/50">{formatDate(s.startDate)} – {formatDate(s.endDate)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

// ── Sprint Days Tab ──
function SprintDaysTab() {
  const [startDate, setStartDate] = useState('2024-03-04')
  const [endDate, setEndDate] = useState('2024-03-15')
  const [holidays, setHolidays] = useState(0)

  const result = useMemo(() => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null

    let workdays = 0
    let weekends = 0
    const current = new Date(start)
    while (current <= end) {
      const day = current.getDay()
      if (day === 0 || day === 6) weekends++
      else workdays++
      current.setDate(current.getDate() + 1)
    }
    const total = workdays + weekends
    const netDays = Math.max(0, workdays - holidays)
    return { total, weekends, workdays, holidays, netDays, manHours: netDays * 8 }
  }, [startDate, endDate, holidays])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
      <GlassCard padding="md" className="animate-fade-in">
        <h3 className="text-base font-bold text-on-surface mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
          Sprint Period
        </h3>
        <div className="space-y-4">
          <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input label="End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <div>
            <label className="text-label-caps text-on-surface-variant/50 text-[10px] block mb-2">Public Holidays in Range</label>
            <input
              type="number"
              min={0}
              value={holidays}
              onChange={e => setHolidays(parseInt(e.target.value) || 0)}
              className="glass-input w-full rounded-xl px-4 py-3 text-sm text-on-surface"
            />
          </div>
        </div>
      </GlassCard>

      {result && (
        <GlassCard topGradient padding="md" className="animate-fade-in" style={{ animationDelay: '60ms' } as React.CSSProperties}>
          <p className="text-label-caps text-on-surface-variant/40 text-[10px] text-center mb-5">Sprint Day Calculation</p>
          <div className="text-center mb-5">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl font-extrabold text-white drop-shadow-[0_0_20px_rgba(207,189,255,0.3)]">{result.netDays}</span>
              <span className="text-lg font-bold text-primary">days</span>
            </div>
            <p className="text-xs text-secondary mt-1">{result.manHours} working hours</p>
          </div>
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Total Calendar Days', value: result.total, color: 'text-on-surface' },
              { label: 'Weekend Days', value: `-${result.weekends}`, color: 'text-error/70' },
              { label: 'Public Holidays', value: `-${result.holidays}`, color: 'text-error/70' },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-on-surface-variant/60">{r.label}</span>
                <span className={`font-medium ${r.color}`}>{r.value}</span>
              </div>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">Working Days</span>
              <span className="font-bold text-primary text-lg">{result.netDays}</span>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ── Leave Tracker Tab ──
function LeaveTrackerTab() {
  const [members, setMembers] = useState<SprintMember[]>(MOCK_SPRINT_CONFIG.members)
  const [newName, setNewName] = useState('')

  return (
    <div className="max-w-2xl space-y-5">
      <GlassCard padding="md" className="animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">beach_access</span>
            Leave Tracker
          </h3>
          <Badge variant="tertiary">{members.length} members</Badge>
        </div>

        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: `${m.color}20`, color: m.color }}>
                {m.initials}
              </div>
              <span className="text-sm font-medium text-on-surface flex-1">{m.name}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-on-surface-variant/50">PTO days</label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  value={m.ptoDays}
                  onChange={e => setMembers(prev => prev.map(mem => mem.id === m.id ? { ...mem, ptoDays: parseFloat(e.target.value) || 0 } : mem))}
                  className="glass-input w-16 text-center text-sm rounded-lg py-1.5"
                />
              </div>
              <button
                onClick={() => setMembers(prev => prev.filter(mem => mem.id !== m.id))}
                className="text-error/30 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">remove_circle</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Team member name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="primary"
            icon="add"
            onClick={() => {
              if (!newName.trim()) return
              const initials = newName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
              const colors = ['#cfbdff', '#ffb782', '#cdcd00', '#4ade80', '#60a5fa']
              setMembers(prev => [...prev, { id: `m${Date.now()}`, name: newName.trim(), initials, color: colors[prev.length % colors.length], ptoDays: 0, focusFactor: 0.8 }])
              setNewName('')
            }}
            disabled={!newName.trim()}
          >
            Add
          </Button>
        </div>
      </GlassCard>

      <GlassCard padding="md" className="animate-fade-in">
        <h4 className="text-sm font-bold text-on-surface mb-4">Total Impact</h4>
        <div className="flex items-center justify-between">
          <span className="text-on-surface-variant text-sm">Total PTO days this sprint</span>
          <span className="text-2xl font-bold text-error">
            {members.reduce((s, m) => s + m.ptoDays, 0).toFixed(1)} days
          </span>
        </div>
      </GlassCard>
    </div>
  )
}

// ── Main Page ──
function SprintToolsContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) ?? 'capacity'
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'capacity', label: 'Capacity Planner', icon: 'event_repeat' },
    { id: 'days', label: 'Sprint Days', icon: 'calendar_today' },
    { id: 'velocity', label: 'Velocity', icon: 'speed' },
    { id: 'leave', label: 'Leave Tracker', icon: 'beach_access' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* ── Header ── */}
      <div className="animate-fade-in">
        <h2 className="text-display-md text-on-surface tracking-tight">Sprint Tools</h2>
        <p className="text-on-surface-variant mt-1">
          Calculate capacity, track velocity, and plan sprints with precision.
        </p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 glass-card p-1 rounded-2xl border-white/8 w-fit animate-fade-in overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white/10 text-on-surface border border-white/10'
                : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span className={`material-symbols-outlined text-[17px] ${activeTab === tab.id ? 'text-primary' : ''}`}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'capacity' && <CapacityTab />}
      {activeTab === 'days' && <SprintDaysTab />}
      {activeTab === 'velocity' && <VelocityTab />}
      {activeTab === 'leave' && <LeaveTrackerTab />}
    </div>
  )
}

export default function SprintToolsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-on-surface-variant">Loading...</div>}>
      <SprintToolsContent />
    </Suspense>
  )
}
