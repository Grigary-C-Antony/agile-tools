import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { WSJFItem, RICEItem, SprintConfig, SprintCapacityResult, VelocityStats, SprintVelocity } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// WSJF CALCULATIONS
// ============================================================

export function calcWSJF(item: Omit<WSJFItem, 'wsjfScore' | 'rank'>): number {
  const costOfDelay = item.userBusinessValue + item.timeCriticality + item.riskReductionOpportunityEnablement
  if (item.jobDuration === 0) return 0
  return parseFloat((costOfDelay / item.jobDuration).toFixed(2))
}

export function rankWSJFItems(items: WSJFItem[]): WSJFItem[] {
  const ranked = items.map(item => ({
    ...item,
    wsjfScore: calcWSJF(item),
  })).sort((a, b) => b.wsjfScore - a.wsjfScore)

  return ranked.map((item, idx) => ({ ...item, rank: idx + 1 }))
}

// ============================================================
// RICE CALCULATIONS
// ============================================================

export function calcRICE(item: Omit<RICEItem, 'riceScore' | 'rank'>): number {
  if (item.effort === 0) return 0
  return parseFloat(((item.reach * item.impact * (item.confidence / 100)) / item.effort).toFixed(1))
}

export function rankRICEItems(items: RICEItem[]): RICEItem[] {
  const ranked = items.map(item => ({
    ...item,
    riceScore: calcRICE(item),
  })).sort((a, b) => b.riceScore - a.riceScore)

  return ranked.map((item, idx) => ({ ...item, rank: idx + 1 }))
}

// ============================================================
// SPRINT CAPACITY CALCULATIONS
// ============================================================

function countWeekdays(start: Date, end: Date): number {
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

function countWeekendDays(start: Date, end: Date): number {
  const total = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return total - countWeekdays(start, end)
}

export function calcSprintCapacity(config: SprintConfig): SprintCapacityResult {
  const start = new Date(config.startDate)
  const end = new Date(config.endDate)

  const grossCalendarDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const weekendDays = countWeekendDays(start, end)
  const workingDays = grossCalendarDays - weekendDays

  const holidayDays = config.holidays.filter(h => h.enabled).length
  const ritualDays = config.rituals.filter(r => r.enabled).reduce((sum, r) => sum + r.duration, 0)
  const totalPtoDays = config.members.reduce((sum, m) => sum + m.ptoDays, 0)

  const netWorkingDays = Math.max(0, workingDays - holidayDays - ritualDays)
  const netProductionDays = Math.max(0, netWorkingDays - totalPtoDays / config.members.length)

  const memberCapacities = config.members.map(member => {
    const availableDays = Math.max(0, netWorkingDays - member.ptoDays)
    const totalDays = netWorkingDays > 0 ? availableDays : 0
    const capacityPercent = netWorkingDays > 0
      ? Math.round((availableDays / netWorkingDays) * 100)
      : 0

    return {
      memberId: member.id,
      name: member.name,
      initials: member.initials,
      color: member.color,
      ptoDays: member.ptoDays,
      availableCapacity: totalDays,
      capacityPercent,
    }
  })

  const totalManDays = memberCapacities.reduce((sum, m) => sum + m.availableCapacity, 0)
  const totalManHours = totalManDays * 8

  return {
    grossCalendarDays,
    weekendDays,
    holidayDays,
    ritualDays,
    totalPtoDays,
    netProductionDays: parseFloat(totalManDays.toFixed(1)),
    totalManHours,
    memberCapacities,
  }
}

// ============================================================
// VELOCITY CALCULATIONS
// ============================================================

export function calcVelocityStats(data: SprintVelocity[]): VelocityStats {
  if (data.length === 0) {
    return { averageVelocity: 0, minVelocity: 0, maxVelocity: 0, trend: 'stable', trendPercent: 0, predictedNext: 0 }
  }

  const completed = data.map(d => d.completedPoints)
  const avg = completed.reduce((s, v) => s + v, 0) / completed.length
  const min = Math.min(...completed)
  const max = Math.max(...completed)

  const last = completed[completed.length - 1]
  const secondLast = completed.length > 1 ? completed[completed.length - 2] : last

  const trendPercent = secondLast !== 0 ? parseFloat((((last - secondLast) / secondLast) * 100).toFixed(1)) : 0
  const trend = trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'stable'

  const recentAvg = data.slice(-3).reduce((s, d) => s + d.completedPoints, 0) / Math.min(3, data.length)

  return {
    averageVelocity: parseFloat(avg.toFixed(1)),
    minVelocity: min,
    maxVelocity: max,
    trend,
    trendPercent,
    predictedNext: Math.round(recentAvg),
  }
}

// ============================================================
// DATE UTILITIES
// ============================================================

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  })
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}

// ============================================================
// MISC
// ============================================================

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${part(4)}-${part(3)}`
}

export function calcModeVote(votes: Record<string, string | number>): string | number | null {
  const vals = Object.values(votes)
  if (vals.length === 0) return null
  const freq: Record<string, number> = {}
  vals.forEach(v => { freq[String(v)] = (freq[String(v)] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
}

export function calcAverageVote(votes: Record<string, string | number>): number | null {
  const numVals = Object.values(votes).filter(v => !isNaN(Number(v))).map(Number)
  if (numVals.length === 0) return null
  return parseFloat((numVals.reduce((s, v) => s + v, 0) / numVals.length).toFixed(1))
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'away': return 'bg-yellow-500'
    case 'offline': return 'bg-gray-500'
    default: return 'bg-gray-500'
  }
}

export function getToolCategoryColor(category: string) {
  switch (category) {
    case 'Estimation': return { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-300', icon: 'text-purple-400' }
    case 'Prioritization': return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-300', icon: 'text-orange-400' }
    case 'Sprint Tools': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-300', icon: 'text-yellow-400' }
    case 'Organization': return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-300', icon: 'text-green-400' }
    default: return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/80', icon: 'text-white/60' }
  }
}
