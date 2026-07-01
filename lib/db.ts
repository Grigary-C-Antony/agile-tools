import { PrismaClient } from '@prisma/client'
import type {
  Organization, Member as PrismaMember, PokerSession as PrismaPokerSession,
  PokerStory as PrismaPokerStory, PokerVote as PrismaPokerVote,
  WsjfFeature as PrismaWsjfFeature, RiceFeature as PrismaRiceFeature,
  EstimationItem as PrismaEstimationItem, VelocityRecord as PrismaVelocityRecord,
  MemberPto as PrismaMemberPto,
  SprintHoliday as PrismaSprintHoliday,
} from '@prisma/client'
import { randomUUID } from 'crypto'

// Ensure DATABASE_URL is set for server.ts (tsx doesn't auto-load .env)
process.env.DATABASE_URL ??= 'file:./data/agile.db'

const g = global as typeof global & { prisma?: PrismaClient }
export const prisma = g.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') g.prisma = prisma

// ── Exported types (snake_case for backward compat with API routes & pages) ──
export interface Org { id: string; name: string; invite_code: string; created_at: number }
export interface Member { id: string; org_id: string; name: string; email: string; role: 'admin' | 'member'; status: 'pending' | 'active' | 'rejected'; created_at: number }
export interface PokerSession { id: string; org_id: string; name: string; scale: string; status: 'voting' | 'revealed' | 'completed'; current_story_id: string | null; created_by: string; created_at: number }
export interface PokerStory { id: string; session_id: string; title: string; description: string | null; estimate: string | null; order_index: number; created_at: number }
export interface PokerVote { id: string; session_id: string; story_id: string; member_id: string; vote: string; created_at: number }
export interface WSJFFeature { id: string; org_id: string; name: string; business_value: number; time_criticality: number; risk_reduction: number; job_size: number; created_at: number }
export interface RICEFeature { id: string; org_id: string; name: string; reach: number; impact: number; confidence: number; effort: number; created_at: number }
export interface EstimationItem { id: string; org_id: string; name: string; description: string | null; estimate: string | null; scale: string; created_at: number }
export interface VelocityRecord { id: string; org_id: string; sprint_name: string; planned: number; completed: number; created_at: number }
export interface MemberPtoRecord { id: string; org_id: string; member_id: string; pto_days: number; updated_at: number }
export interface SprintHolidayRecord { id: string; org_id: string; name: string; date: string; enabled: boolean; created_at: number }

// ── Invite code ───────────────────────────────────────────────────────────────
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${rand(4)}-${rand(3)}`
}

// ── Mappers (Prisma camelCase → snake_case) ───────────────────────────────────
const mapOrg = (o: Organization): Org =>
  ({ id: o.id, name: o.name, invite_code: o.inviteCode, created_at: Number(o.createdAt) })

const mapMember = (m: PrismaMember): Member =>
  ({ id: m.id, org_id: m.orgId, name: m.name, email: m.email, role: m.role as Member['role'], status: m.status as Member['status'], created_at: Number(m.createdAt) })

const mapSession = (s: PrismaPokerSession): PokerSession =>
  ({ id: s.id, org_id: s.orgId, name: s.name, scale: s.scale, status: s.status as PokerSession['status'], current_story_id: s.currentStoryId, created_by: s.createdBy, created_at: Number(s.createdAt) })

const mapStory = (s: PrismaPokerStory): PokerStory =>
  ({ id: s.id, session_id: s.sessionId, title: s.title, description: s.description, estimate: s.estimate, order_index: s.orderIndex, created_at: Number(s.createdAt) })

const mapVote = (v: PrismaPokerVote): PokerVote =>
  ({ id: v.id, session_id: v.sessionId, story_id: v.storyId, member_id: v.memberId, vote: v.vote, created_at: Number(v.createdAt) })

const mapWSJF = (f: PrismaWsjfFeature): WSJFFeature =>
  ({ id: f.id, org_id: f.orgId, name: f.name, business_value: f.businessValue, time_criticality: f.timeCriticality, risk_reduction: f.riskReduction, job_size: f.jobSize, created_at: Number(f.createdAt) })

const mapRICE = (f: PrismaRiceFeature): RICEFeature =>
  ({ id: f.id, org_id: f.orgId, name: f.name, reach: f.reach, impact: f.impact, confidence: f.confidence, effort: f.effort, created_at: Number(f.createdAt) })

const mapEstItem = (i: PrismaEstimationItem): EstimationItem =>
  ({ id: i.id, org_id: i.orgId, name: i.name, description: i.description, estimate: i.estimate, scale: i.scale, created_at: Number(i.createdAt) })

const mapVelocity = (r: PrismaVelocityRecord): VelocityRecord =>
  ({ id: r.id, org_id: r.orgId, sprint_name: r.sprintName, planned: r.planned, completed: r.completed, created_at: Number(r.createdAt) })

const mapMemberPto = (p: PrismaMemberPto): MemberPtoRecord =>
  ({ id: p.id, org_id: p.orgId, member_id: p.memberId, pto_days: p.ptoDays, updated_at: Number(p.updatedAt) })

const mapSprintHoliday = (h: PrismaSprintHoliday): SprintHolidayRecord =>
  ({ id: h.id, org_id: h.orgId, name: h.name, date: h.date, enabled: h.enabled, created_at: Number(h.createdAt) })

// ── DB operations ─────────────────────────────────────────────────────────────
export const db = {
  // ── Organizations ──────────────────────────────────────────────────────────
  async createOrg(name: string): Promise<Org> {
    const org = await prisma.organization.create({
      data: { id: randomUUID(), name, inviteCode: generateInviteCode(), createdAt: Date.now() },
    })
    return mapOrg(org)
  },
  async getOrg(id: string): Promise<Org | null> {
    const org = await prisma.organization.findUnique({ where: { id } })
    return org ? mapOrg(org) : null
  },
  async getOrgByInviteCode(code: string): Promise<Org | null> {
    const org = await prisma.organization.findUnique({ where: { inviteCode: code.toUpperCase() } })
    return org ? mapOrg(org) : null
  },

  // ── Members ────────────────────────────────────────────────────────────────
  async createMember(orgId: string, name: string, email: string, passwordHash: string, role: 'admin' | 'member' = 'member'): Promise<Member> {
    const status = role === 'admin' ? 'active' : 'pending'
    const member = await prisma.member.create({
      data: { id: randomUUID(), orgId, name, email: email.toLowerCase().trim(), passwordHash, role, status, createdAt: Date.now() },
    })
    return mapMember(member)
  },
  async getMember(id: string): Promise<Member | null> {
    const member = await prisma.member.findUnique({ where: { id } })
    return member ? mapMember(member) : null
  },
  async getMemberByEmail(email: string): Promise<(Member & { passwordHash: string }) | null> {
    const member = await prisma.member.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!member) return null
    return { ...mapMember(member), passwordHash: member.passwordHash }
  },
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.member.count({ where: { email: email.toLowerCase().trim() } })
    return count > 0
  },
  async getOrgMembers(orgId: string): Promise<Member[]> {
    const members = await prisma.member.findMany({ where: { orgId, status: 'active' }, orderBy: { createdAt: 'asc' } })
    return members.map(mapMember)
  },
  async getPendingMembers(orgId: string): Promise<Member[]> {
    const members = await prisma.member.findMany({ where: { orgId, status: 'pending' }, orderBy: { createdAt: 'asc' } })
    return members.map(mapMember)
  },
  async approveMember(id: string): Promise<void> {
    await prisma.member.update({ where: { id }, data: { status: 'active' } })
  },
  async rejectMember(id: string): Promise<void> {
    await prisma.member.update({ where: { id }, data: { status: 'rejected' } })
  },
  async updateMemberRole(id: string, role: string): Promise<void> {
    await prisma.member.update({ where: { id }, data: { role } })
  },
  async deleteMember(id: string): Promise<void> {
    await prisma.member.delete({ where: { id } })
  },

  // ── Poker Sessions ─────────────────────────────────────────────────────────
  async createPokerSession(orgId: string, name: string, scale: string, createdBy: string): Promise<PokerSession> {
    const session = await prisma.pokerSession.create({
      data: { id: randomUUID(), orgId, name, scale, status: 'voting', currentStoryId: null, createdBy, createdAt: Date.now() },
    })
    return mapSession(session)
  },
  async getPokerSessions(orgId: string): Promise<PokerSession[]> {
    const sessions = await prisma.pokerSession.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } })
    return sessions.map(mapSession)
  },
  async getPokerSession(id: string): Promise<PokerSession | null> {
    const session = await prisma.pokerSession.findUnique({ where: { id } })
    return session ? mapSession(session) : null
  },
  async updatePokerSessionStatus(id: string, status: string): Promise<void> {
    await prisma.pokerSession.update({ where: { id }, data: { status } })
  },
  async setCurrentStory(sessionId: string, storyId: string | null): Promise<void> {
    await prisma.pokerSession.update({ where: { id: sessionId }, data: { currentStoryId: storyId } })
  },

  // ── Poker Stories ──────────────────────────────────────────────────────────
  async addStory(sessionId: string, title: string, description?: string): Promise<PokerStory> {
    const count = await prisma.pokerStory.count({ where: { sessionId } })
    const story = await prisma.pokerStory.create({
      data: { id: randomUUID(), sessionId, title, description: description ?? null, estimate: null, orderIndex: count, createdAt: Date.now() },
    })
    const sess = await prisma.pokerSession.findUnique({ where: { id: sessionId }, select: { currentStoryId: true } })
    if (!sess?.currentStoryId) {
      await prisma.pokerSession.update({ where: { id: sessionId }, data: { currentStoryId: story.id } })
    }
    return mapStory(story)
  },
  async getStories(sessionId: string): Promise<PokerStory[]> {
    const stories = await prisma.pokerStory.findMany({ where: { sessionId }, orderBy: { orderIndex: 'asc' } })
    return stories.map(mapStory)
  },
  async setStoryEstimate(storyId: string, estimate: string): Promise<void> {
    await prisma.pokerStory.update({ where: { id: storyId }, data: { estimate } })
  },

  // ── Poker Votes ────────────────────────────────────────────────────────────
  async saveVote(sessionId: string, storyId: string, memberId: string, vote: string): Promise<void> {
    await prisma.pokerVote.upsert({
      where: { storyId_memberId: { storyId, memberId } },
      update: { vote },
      create: { id: randomUUID(), sessionId, storyId, memberId, vote, createdAt: Date.now() },
    })
  },
  async getVotes(sessionId: string, storyId: string): Promise<PokerVote[]> {
    const votes = await prisma.pokerVote.findMany({ where: { sessionId, storyId } })
    return votes.map(mapVote)
  },
  async clearVotes(sessionId: string, storyId: string): Promise<void> {
    await prisma.pokerVote.deleteMany({ where: { sessionId, storyId } })
  },

  // ── WSJF ──────────────────────────────────────────────────────────────────
  async createWSJFFeature(orgId: string, d: { name: string; business_value: number; time_criticality: number; risk_reduction: number; job_size: number }): Promise<WSJFFeature> {
    const f = await prisma.wsjfFeature.create({
      data: { id: randomUUID(), orgId, name: d.name, businessValue: d.business_value, timeCriticality: d.time_criticality, riskReduction: d.risk_reduction, jobSize: d.job_size, createdAt: Date.now() },
    })
    return mapWSJF(f)
  },
  async getWSJFFeatures(orgId: string): Promise<WSJFFeature[]> {
    const features = await prisma.wsjfFeature.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
    return features.map(mapWSJF)
  },
  async updateWSJFFeature(id: string, data: Partial<{ name: string; business_value: number; time_criticality: number; risk_reduction: number; job_size: number }>): Promise<void> {
    await prisma.wsjfFeature.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.business_value !== undefined && { businessValue: data.business_value }),
        ...(data.time_criticality !== undefined && { timeCriticality: data.time_criticality }),
        ...(data.risk_reduction !== undefined && { riskReduction: data.risk_reduction }),
        ...(data.job_size !== undefined && { jobSize: data.job_size }),
      },
    })
  },
  async deleteWSJFFeature(id: string): Promise<void> {
    await prisma.wsjfFeature.delete({ where: { id } })
  },

  // ── RICE ──────────────────────────────────────────────────────────────────
  async createRICEFeature(orgId: string, d: { name: string; reach: number; impact: number; confidence: number; effort: number }): Promise<RICEFeature> {
    const f = await prisma.riceFeature.create({
      data: { id: randomUUID(), orgId, name: d.name, reach: d.reach, impact: d.impact, confidence: d.confidence, effort: d.effort, createdAt: Date.now() },
    })
    return mapRICE(f)
  },
  async getRICEFeatures(orgId: string): Promise<RICEFeature[]> {
    const features = await prisma.riceFeature.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
    return features.map(mapRICE)
  },
  async updateRICEFeature(id: string, data: Partial<{ name: string; reach: number; impact: number; confidence: number; effort: number }>): Promise<void> {
    await prisma.riceFeature.update({ where: { id }, data })
  },
  async deleteRICEFeature(id: string): Promise<void> {
    await prisma.riceFeature.delete({ where: { id } })
  },

  // ── Estimation Items ───────────────────────────────────────────────────────
  async createEstimationItem(orgId: string, d: { name: string; description?: string; scale: string }): Promise<EstimationItem> {
    const item = await prisma.estimationItem.create({
      data: { id: randomUUID(), orgId, name: d.name, description: d.description ?? null, estimate: null, scale: d.scale, createdAt: Date.now() },
    })
    return mapEstItem(item)
  },
  async getEstimationItems(orgId: string): Promise<EstimationItem[]> {
    const items = await prisma.estimationItem.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
    return items.map(mapEstItem)
  },
  async updateEstimationItem(id: string, data: Partial<{ name: string; description: string; estimate: string | null }>): Promise<void> {
    await prisma.estimationItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.estimate !== undefined && { estimate: data.estimate }),
      },
    })
  },
  async deleteEstimationItem(id: string): Promise<void> {
    await prisma.estimationItem.delete({ where: { id } })
  },

  // ── Velocity Records ───────────────────────────────────────────────────────
  async createVelocityRecord(orgId: string, d: { sprint_name: string; planned: number; completed: number }): Promise<VelocityRecord> {
    const record = await prisma.velocityRecord.create({
      data: { id: randomUUID(), orgId, sprintName: d.sprint_name, planned: d.planned, completed: d.completed, createdAt: Date.now() },
    })
    return mapVelocity(record)
  },
  async getVelocityRecords(orgId: string): Promise<VelocityRecord[]> {
    const records = await prisma.velocityRecord.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
    return records.map(mapVelocity)
  },
  async updateVelocityRecord(id: string, data: Partial<{ sprint_name: string; planned: number; completed: number }>): Promise<void> {
    await prisma.velocityRecord.update({
      where: { id },
      data: {
        ...(data.sprint_name !== undefined && { sprintName: data.sprint_name }),
        ...(data.planned !== undefined && { planned: data.planned }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
    })
  },
  async deleteVelocityRecord(id: string): Promise<void> {
    await prisma.velocityRecord.delete({ where: { id } })
  },

  // ── Sprint Holidays ────────────────────────────────────────────────────────
  async getSprintHolidays(orgId: string): Promise<SprintHolidayRecord[]> {
    const records = await prisma.sprintHoliday.findMany({ where: { orgId }, orderBy: { createdAt: 'asc' } })
    return records.map(mapSprintHoliday)
  },
  async createSprintHoliday(orgId: string, name: string, date: string): Promise<SprintHolidayRecord> {
    const h = await prisma.sprintHoliday.create({
      data: { id: randomUUID(), orgId, name, date, enabled: true, createdAt: Date.now() },
    })
    return mapSprintHoliday(h)
  },
  async updateSprintHoliday(id: string, enabled: boolean): Promise<void> {
    await prisma.sprintHoliday.update({ where: { id }, data: { enabled } })
  },
  async deleteSprintHoliday(id: string): Promise<void> {
    await prisma.sprintHoliday.delete({ where: { id } })
  },

  // ── Member PTO ─────────────────────────────────────────────────────────────
  async getMemberPtos(orgId: string): Promise<MemberPtoRecord[]> {
    const records = await prisma.memberPto.findMany({ where: { orgId } })
    return records.map(mapMemberPto)
  },
  async upsertMemberPto(orgId: string, memberId: string, ptoDays: number): Promise<void> {
    await prisma.memberPto.upsert({
      where: { orgId_memberId: { orgId, memberId } },
      update: { ptoDays, updatedAt: Date.now() },
      create: { id: randomUUID(), orgId, memberId, ptoDays, updatedAt: Date.now() },
    })
  },
}
