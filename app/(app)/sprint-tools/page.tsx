'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { calcSprintCapacity, calcVelocityStats, formatDate } from '@/lib/utils'
import type { SprintConfig, SprintMember, Holiday } from '@/lib/types'

const MEMBER_COLORS = ['#cfbdff', '#ffb782', '#cdcd00', '#4ade80', '#60a5fa', '#f472b6', '#34d399']

function toInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface ApiMember { id: string; name: string; role: string }

function apiMembersToSprintMembers(members: ApiMember[]): SprintMember[] {
  return members.map((m, i) => ({
    id: m.id,
    name: m.name,
    initials: toInitials(m.name),
    color: MEMBER_COLORS[i % MEMBER_COLORS.length],
    ptoDays: 0,
    focusFactor: 0.8,
  }))
}

const DEFAULT_SPRINT_CONFIG: Omit<SprintConfig, 'members'> = {
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10),
  holidays: [],
  rituals: [
    { id: 'r1', name: 'Sprint Planning', description: 'Full day allocation • Day 1', duration: 1, enabled: true },
    { id: 'r2', name: 'Sprint Retrospective', description: 'Full day allocation • Last Day', duration: 1, enabled: true },
    { id: 'r3', name: 'Backlog Refinement', description: '0.5 day allocation • Mid-sprint', duration: 0.5, enabled: false },
  ],
}

interface VelocityRecord {
  id: string; sprint_name: string; planned: number; completed: number; created_at: number
}

type Tab = 'capacity' | 'days' | 'velocity' | 'leave'

// ── Capacity Tab ──
function CapacityTab({ initialMembers, ptoDays, onPtoChange }: {
  initialMembers: SprintMember[]
  ptoDays: Record<string, number>
  onPtoChange: (memberId: string, days: number) => void
}) {
  const [config, setConfig] = useState<SprintConfig>({ ...DEFAULT_SPRINT_CONFIG, members: initialMembers })

  useEffect(() => {
    if (initialMembers.length > 0) {
      setConfig(prev => ({ ...prev, members: initialMembers }))
    }
  }, [initialMembers])

  useEffect(() => {
    fetch('/api/sprint/holidays')
      .then(r => r.json())
      .then(d => {
        const holidays = (d.holidays ?? []).map((h: { id: string; name: string; date: string; enabled: boolean }) => ({
          id: h.id, name: h.name, date: h.date, enabled: h.enabled,
        }))
        setConfig(prev => ({ ...prev, holidays }))
      })
      .catch(() => {})
  }, [])

  const effectiveConfig = useMemo(() => ({
    ...config,
    members: config.members.map(m => ({ ...m, ptoDays: ptoDays[m.id] ?? 0 })),
  }), [config, ptoDays])

  const result = useMemo(() => calcSprintCapacity(effectiveConfig), [effectiveConfig])

  const toggleRitual = (id: string) => {
    setConfig(prev => ({
      ...prev,
      rituals: prev.rituals.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    }))
  }

  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const [newHolidayName, setNewHolidayName] = useState('')
  const [newHolidayDate, setNewHolidayDate] = useState('')

  const toggleHoliday = (id: string) => {
    const h = config.holidays.find(h => h.id === id)
    if (!h) return
    const enabled = !h.enabled
    setConfig(prev => ({
      ...prev,
      holidays: prev.holidays.map(h => h.id === id ? { ...h, enabled } : h),
    }))
    fetch(`/api/sprint/holidays/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }).catch(() => {})
  }

  const addHoliday = async () => {
    if (!newHolidayName.trim() || !newHolidayDate) return
    const res = await fetch('/api/sprint/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newHolidayName.trim(), date: newHolidayDate }),
    })
    const { holiday } = await res.json()
    setConfig(prev => ({
      ...prev,
      holidays: [...prev.holidays, { id: holiday.id, name: holiday.name, date: holiday.date, enabled: true }],
    }))
    setNewHolidayName('')
    setNewHolidayDate('')
    setShowAddHoliday(false)
  }

  const removeHoliday = (id: string) => {
    setConfig(prev => ({ ...prev, holidays: prev.holidays.filter(h => h.id !== id) }))
    fetch(`/api/sprint/holidays/${id}`, { method: 'DELETE' }).catch(() => {})
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
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); removeHoliday(h.id) }}
                      className="text-error/30 hover:text-error transition-colors ml-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  </label>
                ))}

                {showAddHoliday ? (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                    <input
                      type="text"
                      placeholder="Holiday name"
                      value={newHolidayName}
                      onChange={e => setNewHolidayName(e.target.value)}
                      className="glass-input flex-1 rounded-lg px-3 py-1.5 text-sm text-on-surface"
                    />
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={e => setNewHolidayDate(e.target.value)}
                      className="glass-input rounded-lg px-2 py-1.5 text-sm text-on-surface"
                    />
                    <button type="button" onClick={addHoliday} className="text-primary hover:text-primary/80 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </button>
                    <button type="button" onClick={() => setShowAddHoliday(false)} className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddHoliday(true)}
                    className="flex items-center gap-2 text-xs text-primary hover:underline font-medium mt-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_circle</span>
                    Add Custom Holiday
                  </button>
                )}
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
                        value={ptoDays[mc.memberId] ?? 0}
                        onChange={e => onPtoChange(mc.memberId, parseFloat(e.target.value) || 0)}
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
  const [records, setRecords] = useState<VelocityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlanned, setNewPlanned] = useState('')
  const [newCompleted, setNewCompleted] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchRecords = () => {
    fetch('/api/sprint/velocity').then(r => r.json()).then(d => {
      setRecords(d.records ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchRecords() }, [])

  // Map VelocityRecord[] to SprintVelocity[] for calcVelocityStats
  const sprintVelocities = records.map((r, i) => ({
    id: r.id, sprintNumber: i + 1,
    plannedPoints: r.planned, completedPoints: r.completed,
    teamSize: 1, startDate: '', endDate: '',
  }))

  const stats = useMemo(() => calcVelocityStats(sprintVelocities), [records])

  const addSprint = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/sprint/velocity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sprint_name: newName.trim(),
        planned: parseInt(newPlanned) || 0,
        completed: parseInt(newCompleted) || 0,
      }),
    })
    const data = await res.json()
    setRecords(prev => [...prev, data.record])
    setNewName(''); setNewPlanned(''); setNewCompleted('')
    setSaving(false)
    setAddOpen(false)
  }

  const deleteRecord = async (id: string) => {
    await fetch(`/api/sprint/velocity/${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

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
      {records.length > 1 && (
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
      )}

      {/* Sprint data table */}
      <GlassCard padding="none" className="animate-fade-in">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-bold text-on-surface">Sprint History</h3>
          <Button variant="glass" size="sm" icon="add" onClick={() => setAddOpen(true)}>Add Sprint</Button>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant/40">
            <span className="material-symbols-outlined text-[40px] mb-2 block">speed</span>
            <p className="text-sm">No sprints recorded yet. Add your first sprint to track velocity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['Sprint', 'Planned', 'Completed', 'Accuracy', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-label-caps text-[10px] text-on-surface-variant/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...records].reverse().map((s, idx) => {
                  const accuracy = s.planned > 0 ? Math.round((s.completed / s.planned) * 100) : 0
                  return (
                    <tr key={s.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-primary">{s.sprint_name}</td>
                      <td className="px-5 py-3.5 text-sm text-on-surface">{s.planned} pts</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-on-surface">{s.completed} pts</span>
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full gradient-brand rounded-full" style={{ width: `${Math.min(accuracy, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-bold ${accuracy >= 90 ? 'text-green-400' : accuracy >= 70 ? 'text-tertiary' : 'text-error'}`}>
                          {accuracy}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => deleteRecord(s.id)}
                          className="opacity-0 group-hover:opacity-100 text-error/40 hover:text-error transition-all">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add Sprint Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Sprint" size="sm">
        <div className="space-y-4">
          <Input label="Sprint Name" placeholder="e.g. Sprint 24" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Planned Points" type="number" placeholder="0" value={newPlanned} onChange={e => setNewPlanned(e.target.value)} />
            <Input label="Completed Points" type="number" placeholder="0" value={newCompleted} onChange={e => setNewCompleted(e.target.value)} />
          </div>
          <Button variant="primary" className="w-full" icon="add" loading={saving}
            disabled={!newName.trim() || saving} onClick={addSprint}>
            Add Sprint
          </Button>
        </div>
      </Modal>
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
function LeaveTrackerTab({ initialMembers, ptoDays, onPtoChange }: {
  initialMembers: SprintMember[]
  ptoDays: Record<string, number>
  onPtoChange: (memberId: string, days: number) => void
}) {
  const [members, setMembers] = useState<SprintMember[]>(initialMembers)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (initialMembers.length > 0) {
      setMembers(initialMembers)
    }
  }, [initialMembers])

  const totalPto = members.reduce((s, m) => s + (ptoDays[m.id] ?? 0), 0)

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
                  value={ptoDays[m.id] ?? 0}
                  onChange={e => onPtoChange(m.id, parseFloat(e.target.value) || 0)}
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
            {totalPto.toFixed(1)} days
          </span>
        </div>
      </GlassCard>
    </div>
  )
}

// ── Main Page ──
function SprintToolsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { session, loading: sessionLoading } = useSession()
  const activeTab = (searchParams.get('tab') as Tab) ?? 'capacity'
  const [members, setMembers] = useState<SprintMember[]>([])
  const [ptoDays, setPtoDays] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!sessionLoading && session?.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [sessionLoading, session, router])

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(d => setMembers(apiMembersToSprintMembers(d.active ?? [])))
      .catch(() => {})
    fetch('/api/sprint/pto')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, number> = {}
        for (const r of d.pto ?? []) map[r.member_id] = r.pto_days
        setPtoDays(map)
      })
      .catch(() => {})
  }, [])

  const handlePtoChange = useCallback((memberId: string, days: number) => {
    setPtoDays(prev => ({ ...prev, [memberId]: days }))
    fetch('/api/sprint/pto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, ptoDays: days }),
    }).catch(() => {})
  }, [])

  if (sessionLoading || session?.role !== 'admin') return null

  const TAB_LABELS: Record<Tab, string> = {
    capacity: 'Capacity Planner',
    days: 'Sprint Days',
    velocity: 'Velocity Tracker',
    leave: 'Leave Tracker',
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* ── Header ── */}
      <div className="animate-fade-in">
        <h2 className="text-display-md text-on-surface tracking-tight">{TAB_LABELS[activeTab]}</h2>
        <p className="text-on-surface-variant mt-1">
          Calculate capacity, track velocity, and plan sprints with precision.
        </p>
      </div>

      {/* ── Tab Content ── */}
      <div className={activeTab !== 'capacity' ? 'hidden' : ''}><CapacityTab initialMembers={members} ptoDays={ptoDays} onPtoChange={handlePtoChange} /></div>
      <div className={activeTab !== 'days' ? 'hidden' : ''}><SprintDaysTab /></div>
      <div className={activeTab !== 'velocity' ? 'hidden' : ''}><VelocityTab /></div>
      <div className={activeTab !== 'leave' ? 'hidden' : ''}><LeaveTrackerTab initialMembers={members} ptoDays={ptoDays} onPtoChange={handlePtoChange} /></div>
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
