import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

// Persist across Next.js hot reloads in development
const g = global as typeof global & { __agileDb?: Database.Database }

function getDb(): Database.Database {
  if (g.__agileDb) return g.__agileDb
  const instance = new Database(path.join(dataDir, 'agile.db'))
  instance.pragma('journal_mode = WAL')
  instance.pragma('foreign_keys = ON')
  initSchema(instance)
  g.__agileDb = instance
  return instance
}

function initSchema(d: Database.Database): void {
  d.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poker_sessions (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      scale TEXT NOT NULL DEFAULT 'fibonacci',
      status TEXT NOT NULL DEFAULT 'voting',
      current_story_id TEXT,
      created_by TEXT NOT NULL REFERENCES members(id),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poker_stories (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES poker_sessions(id),
      title TEXT NOT NULL,
      description TEXT,
      estimate TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS poker_votes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES poker_sessions(id),
      story_id TEXT NOT NULL REFERENCES poker_stories(id),
      member_id TEXT NOT NULL REFERENCES members(id),
      vote TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(story_id, member_id)
    );
    CREATE TABLE IF NOT EXISTS wsjf_features (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      business_value INTEGER NOT NULL DEFAULT 1,
      time_criticality INTEGER NOT NULL DEFAULT 1,
      risk_reduction INTEGER NOT NULL DEFAULT 1,
      job_size INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rice_features (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      reach INTEGER NOT NULL DEFAULT 1000,
      impact INTEGER NOT NULL DEFAULT 1,
      confidence INTEGER NOT NULL DEFAULT 80,
      effort INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS estimation_items (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      description TEXT,
      estimate TEXT,
      scale TEXT NOT NULL DEFAULT 'fibonacci',
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS velocity_records (
      id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      sprint_name TEXT NOT NULL,
      planned INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `)
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Org { id: string; name: string; invite_code: string; created_at: number }
export interface Member { id: string; org_id: string; name: string; role: 'admin' | 'member'; status: 'pending' | 'active' | 'rejected'; created_at: number }
export interface PokerSession { id: string; org_id: string; name: string; scale: string; status: 'voting' | 'revealed' | 'completed'; current_story_id: string | null; created_by: string; created_at: number }
export interface PokerStory { id: string; session_id: string; title: string; description: string | null; estimate: string | null; order_index: number; created_at: number }
export interface PokerVote { id: string; session_id: string; story_id: string; member_id: string; vote: string; created_at: number }
export interface WSJFFeature { id: string; org_id: string; name: string; business_value: number; time_criticality: number; risk_reduction: number; job_size: number; created_at: number }
export interface RICEFeature { id: string; org_id: string; name: string; reach: number; impact: number; confidence: number; effort: number; created_at: number }
export interface EstimationItem { id: string; org_id: string; name: string; description: string | null; estimate: string | null; scale: string; created_at: number }
export interface VelocityRecord { id: string; org_id: string; sprint_name: string; planned: number; completed: number; created_at: number }

// ── Invite code ───────────────────────────────────────────────────────────────
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${rand(4)}-${rand(3)}`
}

// ── DB operations ─────────────────────────────────────────────────────────────
export const db = {
  // Organizations
  createOrg(name: string): Org {
    const d = getDb(), id = randomUUID(), code = generateInviteCode()
    d.prepare('INSERT INTO organizations VALUES (?,?,?,?)').run(id, name, code, Date.now())
    return d.prepare('SELECT * FROM organizations WHERE id=?').get(id) as Org
  },
  getOrg(id: string): Org | null {
    return getDb().prepare('SELECT * FROM organizations WHERE id=?').get(id) as Org | null
  },
  getOrgByInviteCode(code: string): Org | null {
    return getDb().prepare('SELECT * FROM organizations WHERE invite_code=?').get(code.toUpperCase()) as Org | null
  },

  // Members
  createMember(orgId: string, name: string, role: 'admin' | 'member' = 'member'): Member {
    const d = getDb(), id = randomUUID()
    const status = role === 'admin' ? 'active' : 'pending'
    d.prepare('INSERT INTO members VALUES (?,?,?,?,?,?)').run(id, orgId, name, role, status, Date.now())
    return d.prepare('SELECT * FROM members WHERE id=?').get(id) as Member
  },
  getMember(id: string): Member | null {
    return getDb().prepare('SELECT * FROM members WHERE id=?').get(id) as Member | null
  },
  getOrgMembers(orgId: string): Member[] {
    return getDb().prepare("SELECT * FROM members WHERE org_id=? AND status='active' ORDER BY created_at").all(orgId) as Member[]
  },
  getPendingMembers(orgId: string): Member[] {
    return getDb().prepare("SELECT * FROM members WHERE org_id=? AND status='pending' ORDER BY created_at").all(orgId) as Member[]
  },
  approveMember(id: string) { getDb().prepare("UPDATE members SET status='active' WHERE id=?").run(id) },
  rejectMember(id: string) { getDb().prepare("UPDATE members SET status='rejected' WHERE id=?").run(id) },
  updateMemberRole(id: string, role: string) { getDb().prepare('UPDATE members SET role=? WHERE id=?').run(role, id) },
  deleteMember(id: string) { getDb().prepare('DELETE FROM members WHERE id=?').run(id) },

  // Poker Sessions
  createPokerSession(orgId: string, name: string, scale: string, createdBy: string): PokerSession {
    const d = getDb(), id = randomUUID()
    d.prepare('INSERT INTO poker_sessions VALUES (?,?,?,?,?,?,?,?)').run(id, orgId, name, scale, 'voting', null, createdBy, Date.now())
    return d.prepare('SELECT * FROM poker_sessions WHERE id=?').get(id) as PokerSession
  },
  getPokerSessions(orgId: string): PokerSession[] {
    return getDb().prepare('SELECT * FROM poker_sessions WHERE org_id=? ORDER BY created_at DESC').all(orgId) as PokerSession[]
  },
  getPokerSession(id: string): PokerSession | null {
    return getDb().prepare('SELECT * FROM poker_sessions WHERE id=?').get(id) as PokerSession | null
  },
  updatePokerSessionStatus(id: string, status: string) { getDb().prepare('UPDATE poker_sessions SET status=? WHERE id=?').run(status, id) },
  setCurrentStory(sessionId: string, storyId: string | null) { getDb().prepare('UPDATE poker_sessions SET current_story_id=? WHERE id=?').run(storyId, sessionId) },

  // Poker Stories
  addStory(sessionId: string, title: string, description?: string): PokerStory {
    const d = getDb(), id = randomUUID()
    const { c } = d.prepare('SELECT COUNT(*) as c FROM poker_stories WHERE session_id=?').get(sessionId) as { c: number }
    d.prepare('INSERT INTO poker_stories VALUES (?,?,?,?,?,?,?)').run(id, sessionId, title, description ?? null, null, c, Date.now())
    const story = d.prepare('SELECT * FROM poker_stories WHERE id=?').get(id) as PokerStory
    const sess = d.prepare('SELECT current_story_id FROM poker_sessions WHERE id=?').get(sessionId) as { current_story_id: string | null }
    if (!sess.current_story_id) d.prepare('UPDATE poker_sessions SET current_story_id=? WHERE id=?').run(id, sessionId)
    return story
  },
  getStories(sessionId: string): PokerStory[] {
    return getDb().prepare('SELECT * FROM poker_stories WHERE session_id=? ORDER BY order_index').all(sessionId) as PokerStory[]
  },
  setStoryEstimate(storyId: string, estimate: string) { getDb().prepare('UPDATE poker_stories SET estimate=? WHERE id=?').run(estimate, storyId) },

  // Poker Votes
  saveVote(sessionId: string, storyId: string, memberId: string, vote: string) {
    const d = getDb()
    const ex = d.prepare('SELECT id FROM poker_votes WHERE story_id=? AND member_id=?').get(storyId, memberId)
    if (ex) d.prepare('UPDATE poker_votes SET vote=? WHERE story_id=? AND member_id=?').run(vote, storyId, memberId)
    else d.prepare('INSERT INTO poker_votes VALUES (?,?,?,?,?,?)').run(randomUUID(), sessionId, storyId, memberId, vote, Date.now())
  },
  getVotes(sessionId: string, storyId: string): PokerVote[] {
    return getDb().prepare('SELECT * FROM poker_votes WHERE session_id=? AND story_id=?').all(sessionId, storyId) as PokerVote[]
  },
  clearVotes(sessionId: string, storyId: string) { getDb().prepare('DELETE FROM poker_votes WHERE session_id=? AND story_id=?').run(sessionId, storyId) },

  // WSJF
  createWSJFFeature(orgId: string, d: { name: string; business_value: number; time_criticality: number; risk_reduction: number; job_size: number }): WSJFFeature {
    const db2 = getDb(), id = randomUUID()
    db2.prepare('INSERT INTO wsjf_features VALUES (?,?,?,?,?,?,?,?)').run(id, orgId, d.name, d.business_value, d.time_criticality, d.risk_reduction, d.job_size, Date.now())
    return db2.prepare('SELECT * FROM wsjf_features WHERE id=?').get(id) as WSJFFeature
  },
  getWSJFFeatures(orgId: string): WSJFFeature[] {
    return getDb().prepare('SELECT * FROM wsjf_features WHERE org_id=? ORDER BY created_at').all(orgId) as WSJFFeature[]
  },
  updateWSJFFeature(id: string, data: Partial<{ name: string; business_value: number; time_criticality: number; risk_reduction: number; job_size: number }>) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined)
    if (!entries.length) return
    getDb().prepare(`UPDATE wsjf_features SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`).run(...entries.map(([, v]) => v), id)
  },
  deleteWSJFFeature(id: string) { getDb().prepare('DELETE FROM wsjf_features WHERE id=?').run(id) },

  // RICE
  createRICEFeature(orgId: string, d: { name: string; reach: number; impact: number; confidence: number; effort: number }): RICEFeature {
    const db2 = getDb(), id = randomUUID()
    db2.prepare('INSERT INTO rice_features VALUES (?,?,?,?,?,?,?,?)').run(id, orgId, d.name, d.reach, d.impact, d.confidence, d.effort, Date.now())
    return db2.prepare('SELECT * FROM rice_features WHERE id=?').get(id) as RICEFeature
  },
  getRICEFeatures(orgId: string): RICEFeature[] {
    return getDb().prepare('SELECT * FROM rice_features WHERE org_id=? ORDER BY created_at').all(orgId) as RICEFeature[]
  },
  updateRICEFeature(id: string, data: Partial<{ name: string; reach: number; impact: number; confidence: number; effort: number }>) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined)
    if (!entries.length) return
    getDb().prepare(`UPDATE rice_features SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`).run(...entries.map(([, v]) => v), id)
  },
  deleteRICEFeature(id: string) { getDb().prepare('DELETE FROM rice_features WHERE id=?').run(id) },

  // Estimation Items
  createEstimationItem(orgId: string, d: { name: string; description?: string; scale: string }): EstimationItem {
    const db2 = getDb(), id = randomUUID()
    db2.prepare('INSERT INTO estimation_items VALUES (?,?,?,?,?,?,?)').run(id, orgId, d.name, d.description ?? null, null, d.scale, Date.now())
    return db2.prepare('SELECT * FROM estimation_items WHERE id=?').get(id) as EstimationItem
  },
  getEstimationItems(orgId: string): EstimationItem[] {
    return getDb().prepare('SELECT * FROM estimation_items WHERE org_id=? ORDER BY created_at').all(orgId) as EstimationItem[]
  },
  updateEstimationItem(id: string, data: Partial<{ name: string; description: string; estimate: string | null }>) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined)
    if (!entries.length) return
    getDb().prepare(`UPDATE estimation_items SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`).run(...entries.map(([, v]) => v), id)
  },
  deleteEstimationItem(id: string) { getDb().prepare('DELETE FROM estimation_items WHERE id=?').run(id) },

  // Velocity Records
  createVelocityRecord(orgId: string, d: { sprint_name: string; planned: number; completed: number }): VelocityRecord {
    const db2 = getDb(), id = randomUUID()
    db2.prepare('INSERT INTO velocity_records VALUES (?,?,?,?,?,?)').run(id, orgId, d.sprint_name, d.planned, d.completed, Date.now())
    return db2.prepare('SELECT * FROM velocity_records WHERE id=?').get(id) as VelocityRecord
  },
  getVelocityRecords(orgId: string): VelocityRecord[] {
    return getDb().prepare('SELECT * FROM velocity_records WHERE org_id=? ORDER BY created_at').all(orgId) as VelocityRecord[]
  },
  updateVelocityRecord(id: string, data: Partial<{ sprint_name: string; planned: number; completed: number }>) {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined)
    if (!entries.length) return
    getDb().prepare(`UPDATE velocity_records SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`).run(...entries.map(([, v]) => v), id)
  },
  deleteVelocityRecord(id: string) { getDb().prepare('DELETE FROM velocity_records WHERE id=?').run(id) },
}
