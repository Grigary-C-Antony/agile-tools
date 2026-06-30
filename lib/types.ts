// ============================================================
// CORE DOMAIN TYPES
// ============================================================

export type UserRole = 'admin' | 'member' | 'viewer'
export type MemberStatus = 'approved' | 'pending' | 'rejected'
export type OnlineStatus = 'online' | 'away' | 'offline'

export interface User {
  id: string
  name: string
  role: string
  title: string
  avatar?: string
  initials: string
  status: OnlineStatus
  orgRole: UserRole
  memberStatus: MemberStatus
  joinedAt: string
  email: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  inviteCode: string
  inviteLink: string
  createdAt: string
  adminId: string
  members: User[]
  settings: OrgSettings
}

export interface OrgSettings {
  allowSelfJoin: boolean
  requireApproval: boolean
  defaultEstimationScale: EstimationScale
  timezone: string
  workdaysPerWeek: number
  hoursPerDay: number
}

// ============================================================
// PLANNING POKER TYPES
// ============================================================

export type EstimationScale = 'fibonacci' | 'tshirt' | 'powers-of-2' | 'custom'
export type SessionStatus = 'lobby' | 'voting' | 'revealed' | 'completed'

export interface PlanningPokerSession {
  id: string
  orgId: string
  name: string
  inviteCode: string
  status: SessionStatus
  scale: EstimationScale
  currentStory: Story | null
  stories: Story[]
  participants: Participant[]
  createdBy: string
  createdAt: string
  completedAt?: string
}

export interface Story {
  id: string
  title: string
  description: string
  ticketId?: string
  votes: Record<string, string | number> // userId -> vote value
  finalEstimate?: string | number
  status: 'pending' | 'voting' | 'revealed' | 'estimated'
}

export interface Participant {
  userId: string
  name: string
  avatar?: string
  initials: string
  title: string
  hasVoted: boolean
  vote?: string | number
  isOnline: boolean
  isObserver: boolean
}

export const FIBONACCI_DECK = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']
export const TSHIRT_DECK = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?']
export const POWERS_OF_2_DECK = ['1', '2', '4', '8', '16', '32', '64', '?']

// ============================================================
// WSJF TYPES
// ============================================================

export interface WSJFItem {
  id: string
  name: string
  userBusinessValue: number
  timeCriticality: number
  riskReductionOpportunityEnablement: number
  jobDuration: number
  wsjfScore: number
  rank?: number
}

// WSJF = (User Business Value + Time Criticality + Risk Reduction) / Job Duration

// ============================================================
// RICE TYPES
// ============================================================

export interface RICEItem {
  id: string
  name: string
  reach: number
  impact: number
  confidence: number
  effort: number
  riceScore: number
  rank?: number
}

// RICE = (Reach * Impact * Confidence/100) / Effort

// ============================================================
// SPRINT TOOLS TYPES
// ============================================================

export interface SprintConfig {
  startDate: string
  endDate: string
  holidays: Holiday[]
  rituals: SprintRitual[]
  members: SprintMember[]
}

export interface Holiday {
  id: string
  name: string
  date: string
  enabled: boolean
}

export interface SprintRitual {
  id: string
  name: string
  description: string
  duration: number // days
  enabled: boolean
}

export interface SprintMember {
  id: string
  name: string
  initials: string
  color: string
  ptoDays: number
  focusFactor: number
}

export interface SprintCapacityResult {
  grossCalendarDays: number
  weekendDays: number
  holidayDays: number
  ritualDays: number
  totalPtoDays: number
  netProductionDays: number
  totalManHours: number
  memberCapacities: MemberCapacity[]
}

export interface MemberCapacity {
  memberId: string
  name: string
  initials: string
  color: string
  ptoDays: number
  availableCapacity: number
  capacityPercent: number
}

// ============================================================
// VELOCITY TYPES
// ============================================================

export interface SprintVelocity {
  id: string
  sprintNumber: number
  plannedPoints: number
  completedPoints: number
  teamSize: number
  startDate: string
  endDate: string
}

export interface VelocityStats {
  averageVelocity: number
  minVelocity: number
  maxVelocity: number
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  predictedNext: number
}

// ============================================================
// ESTIMATION TYPES
// ============================================================

export interface EstimationItem {
  id: string
  name: string
  description?: string
  estimate?: string | number
  scale: EstimationScale
  notes?: string
}

// ============================================================
// SETTINGS TYPES
// ============================================================

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  language: string
  notifications: NotificationSettings
  integrations: IntegrationSettings
}

export interface NotificationSettings {
  sessionInvites: boolean
  memberRequests: boolean
  sprintReminders: boolean
  weeklyDigest: boolean
}

export interface IntegrationSettings {
  jiraEnabled: boolean
  jiraUrl?: string
  jiraProjectKey?: string
  confluenceEnabled: boolean
  slackEnabled: boolean
  slackWebhook?: string
}

// ============================================================
// UI TYPES
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: string | number
  category?: string
}

export interface ToolCard {
  id: string
  title: string
  description: string
  icon: string
  href: string
  category: string
  badge?: string
  isNew?: boolean
  color: string
}
