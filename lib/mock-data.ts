import type {
  Organization,
  User,
  PlanningPokerSession,
  WSJFItem,
  RICEItem,
  SprintConfig,
  SprintVelocity,
  EstimationItem,
  ToolCard,
} from './types'

// ============================================================
// MOCK USERS
// ============================================================

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Leyton Graves',
    role: 'Product Owner',
    title: 'Product Owner',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoImLUCCLeiCH1IXHN93cmV2dHgJdSVk-SJiJKy1xUbz2hJrDOpISrSMZaRfXcRK97l8U8Z6ABN27Sbgcpz_LDlcKESJW7F5LI59V2pKydyHM2F5QgrEtZvwaHYsN1A0cfiE4QopX-SkWzsEaeTgiuO_oRI_PwGiA-cX1lf3v3O1duUsX-cGm4Bga70zQMNmNuWcQORivYB85FSfdGGobTm3GhJBACFZ4j7_QnJEZ5K9Uq36gccGpPLbdNBPE455qiFwliIOW-wDw',
    initials: 'LG',
    status: 'online',
    orgRole: 'admin',
    memberStatus: 'approved',
    joinedAt: '2024-01-15T10:00:00Z',
    email: 'leyton@acme.com',
  },
  {
    id: 'u2',
    name: 'Elias Holly',
    role: 'Frontend Lead',
    title: 'Frontend Lead',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1T7hTwp72VTsCVJBNn0GKdCzjURotuEX7mXU0knsGVAPfu5RI7f7sW2q6O7QWDLFmcV8w8isbjJERo5BRIwRxvUhi7zM050NtPwU8Lhbgdt1dPbLMXjLYCq8oEXur38wcgqkY9cik13A2oE6-M-BtppzZeIL_kHNF2YvYRQDNJ9-__39Ux0VRxm3QuvCpi650wIZcneE445g2A9Uu3H59CTjMedZxvc0cePAS5zdtKpPG60uevciJWIUav-Y_9v_LWqwXldI8LZo',
    initials: 'EH',
    status: 'online',
    orgRole: 'member',
    memberStatus: 'approved',
    joinedAt: '2024-01-20T09:30:00Z',
    email: 'elias@acme.com',
  },
  {
    id: 'u3',
    name: 'Pierre Smith',
    role: 'Backend Eng.',
    title: 'Backend Engineer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu_9WXMJtwupPJnTmZsjeGfQVqDjdSA6rUEJo5fpuv8ItAWH86P_1Y4qUo8CkEgzm6uSnEE0uiSbO1yA3X41sJ36BIx4wNB4QXRNcCND4Qa3R84zgSIx3Xz_VEZuhM6qgfcFF1q4knSRQSQzZ6-vwDpM25gJPlwWc7BhnhJ5n8d_WxLCUh1NY9M07tDkFPbq8J1lcfvQ0ySe2Hn41tuWBObZR_GgTg4ogX10kNrf-YmJGguIy7g2MEsNBy2QNIX-y57_J2miFvjZY',
    initials: 'PS',
    status: 'online',
    orgRole: 'member',
    memberStatus: 'approved',
    joinedAt: '2024-02-01T14:00:00Z',
    email: 'pierre@acme.com',
  },
  {
    id: 'u4',
    name: 'Blake Kraft',
    role: 'Developer',
    title: 'Full-Stack Developer',
    initials: 'BK',
    status: 'away',
    orgRole: 'member',
    memberStatus: 'approved',
    joinedAt: '2024-02-10T11:00:00Z',
    email: 'blake@acme.com',
  },
  {
    id: 'u5',
    name: 'Sarah Chen',
    role: 'UX Designer',
    title: 'Senior UX Designer',
    initials: 'SC',
    status: 'offline',
    orgRole: 'member',
    memberStatus: 'pending',
    joinedAt: '2024-06-01T09:00:00Z',
    email: 'sarah@acme.com',
  },
  {
    id: 'u6',
    name: 'Marcus Ali',
    role: 'DevOps Engineer',
    title: 'DevOps Engineer',
    initials: 'MA',
    status: 'offline',
    orgRole: 'member',
    memberStatus: 'pending',
    joinedAt: '2024-06-15T16:00:00Z',
    email: 'marcus@acme.com',
  },
]

// ============================================================
// MOCK ORGANIZATION
// ============================================================

export const MOCK_ORG: Organization = {
  id: 'org1',
  name: 'Acme Corp Engineering',
  slug: 'acme-corp',
  inviteCode: 'ACME-XYZ',
  inviteLink: 'https://agile-toolkit.app/join/ACME-XYZ',
  createdAt: '2024-01-01T00:00:00Z',
  adminId: 'u1',
  members: MOCK_USERS,
  settings: {
    allowSelfJoin: false,
    requireApproval: true,
    defaultEstimationScale: 'fibonacci',
    timezone: 'America/New_York',
    workdaysPerWeek: 5,
    hoursPerDay: 8,
  },
}

// ============================================================
// MOCK PLANNING POKER SESSION
// ============================================================

export const MOCK_POKER_SESSION: PlanningPokerSession = {
  id: 'session-001',
  orgId: 'org1',
  name: 'Sprint 24 Estimation',
  inviteCode: 'S24-EST',
  status: 'voting',
  scale: 'fibonacci',
  currentStory: {
    id: 'story-1',
    title: 'Implement new Auth flow',
    description: 'Update the login service to support OAuth2 providers and handle token refresh logic seamlessly.',
    ticketId: 'TKT-142',
    votes: { u1: '8', u2: '8', u3: '5' },
    status: 'voting',
  },
  stories: [
    {
      id: 'story-1',
      title: 'Implement new Auth flow',
      description: 'Update the login service to support OAuth2 providers and handle token refresh logic.',
      ticketId: 'TKT-142',
      votes: { u1: '8', u2: '8', u3: '5' },
      status: 'voting',
    },
    {
      id: 'story-2',
      title: 'Dashboard performance optimization',
      description: 'Improve load time from 3.2s to under 1s via lazy loading and code splitting.',
      ticketId: 'TKT-143',
      votes: {},
      status: 'pending',
    },
    {
      id: 'story-3',
      title: 'Mobile responsive navigation',
      description: 'Redesign the top navigation for mobile devices with a hamburger menu.',
      ticketId: 'TKT-144',
      votes: {},
      status: 'pending',
    },
    {
      id: 'story-4',
      title: 'API rate limiting',
      description: 'Implement rate limiting on all public API endpoints.',
      ticketId: 'TKT-145',
      votes: {},
      finalEstimate: '13',
      status: 'estimated',
    },
  ],
  participants: [
    { userId: 'u1', name: 'Leyton Graves', initials: 'LG', title: 'Product Owner', hasVoted: true, vote: '8', isOnline: true, isObserver: false,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoImLUCCLeiCH1IXHN93cmV2dHgJdSVk-SJiJKy1xUbz2hJrDOpISrSMZaRfXcRK97l8U8Z6ABN27Sbgcpz_LDlcKESJW7F5LI59V2pKydyHM2F5QgrEtZvwaHYsN1A0cfiE4QopX-SkWzsEaeTgiuO_oRI_PwGiA-cX1lf3v3O1duUsX-cGm4Bga70zQMNmNuWcQORivYB85FSfdGGobTm3GhJBACFZ4j7_QnJEZ5K9Uq36gccGpPLbdNBPE455qiFwliIOW-wDw'
    },
    { userId: 'u2', name: 'Elias Holly', initials: 'EH', title: 'Frontend Lead', hasVoted: true, vote: '8', isOnline: true, isObserver: false,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1T7hTwp72VTsCVJBNn0GKdCzjURotuEX7mXU0knsGVAPfu5RI7f7sW2q6O7QWDLFmcV8w8isbjJERo5BRIwRxvUhi7zM050NtPwU8Lhbgdt1dPbLMXjLYCq8oEXur38wcgqkY9cik13A2oE6-M-BtppzZeIL_kHNF2YvYRQDNJ9-__39Ux0VRxm3QuvCpi650wIZcneE445g2A9Uu3H59CTjMedZxvc0cePAS5zdtKpPG60uevciJWIUav-Y_9v_LWqwXldI8LZo'
    },
    { userId: 'u3', name: 'Pierre Smith', initials: 'PS', title: 'Backend Engineer', hasVoted: true, vote: '5', isOnline: true, isObserver: false,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCu_9WXMJtwupPJnTmZsjeGfQVqDjdSA6rUEJo5fpuv8ItAWH86P_1Y4qUo8CkEgzm6uSnEE0uiSbO1yA3X41sJ36BIx4wNB4QXRNcCND4Qa3R84zgSIx3Xz_VEZuhM6qgfcFF1q4knSRQSQzZ6-vwDpM25gJPlwWc7BhnhJ5n8d_WxLCUh1NY9M07tDkFPbq8J1lcfvQ0ySe2Hn41tuWBObZR_GgTg4ogX10kNrf-YmJGguIy7g2MEsNBy2QNIX-y57_J2miFvjZY'
    },
    { userId: 'u4', name: 'Blake Kraft', initials: 'BK', title: 'Developer', hasVoted: false, isOnline: true, isObserver: false },
  ],
  createdBy: 'u1',
  createdAt: new Date().toISOString(),
}

// ============================================================
// MOCK WSJF ITEMS
// ============================================================

export const MOCK_WSJF_ITEMS: WSJFItem[] = [
  { id: 'w1', name: 'Advanced Analytics Dashboard', userBusinessValue: 13, timeCriticality: 8, riskReductionOpportunityEnablement: 5, jobDuration: 2, wsjfScore: 13.0, rank: 1 },
  { id: 'w2', name: 'SSO Integration', userBusinessValue: 8, timeCriticality: 13, riskReductionOpportunityEnablement: 3, jobDuration: 3, wsjfScore: 8.0, rank: 2 },
  { id: 'w3', name: 'Dark Mode Refactor', userBusinessValue: 5, timeCriticality: 3, riskReductionOpportunityEnablement: 1, jobDuration: 5, wsjfScore: 1.8, rank: 3 },
  { id: 'w4', name: 'Mobile App Notifications', userBusinessValue: 8, timeCriticality: 5, riskReductionOpportunityEnablement: 2, jobDuration: 4, wsjfScore: 3.75, rank: 4 },
]

// ============================================================
// MOCK RICE ITEMS
// ============================================================

export const MOCK_RICE_ITEMS: RICEItem[] = [
  { id: 'r1', name: 'Mobile App V2', reach: 5000, impact: 3, confidence: 80, effort: 12, riceScore: 1000, rank: 1 },
  { id: 'r2', name: 'Export to PDF', reach: 1200, impact: 2, confidence: 100, effort: 4, riceScore: 600, rank: 2 },
  { id: 'r3', name: 'Team Collaboration Features', reach: 3000, impact: 2, confidence: 70, effort: 8, riceScore: 525, rank: 3 },
  { id: 'r4', name: 'API Webhooks', reach: 800, impact: 3, confidence: 90, effort: 6, riceScore: 360, rank: 4 },
]

// ============================================================
// MOCK SPRINT CONFIG
// ============================================================

export const MOCK_SPRINT_CONFIG: SprintConfig = {
  startDate: '2024-03-04',
  endDate: '2024-03-15',
  holidays: [
    { id: 'h1', name: 'Spring Bank Holiday', date: '2024-03-10', enabled: false },
  ],
  rituals: [
    { id: 'r1', name: 'Sprint Planning', description: 'Full day allocation • Day 1', duration: 1, enabled: true },
    { id: 'r2', name: 'Sprint Retrospective', description: 'Full day allocation • Last Day', duration: 1, enabled: true },
    { id: 'r3', name: 'Backlog Refinement', description: '0.5 day allocation • Mid-sprint', duration: 0.5, enabled: false },
  ],
  members: [
    { id: 'u1', name: 'Leyton Graves', initials: 'LG', color: '#cfbdff', ptoDays: 0.5, focusFactor: 0.8 },
    { id: 'u2', name: 'Elias Holly', initials: 'EH', color: '#ffb782', ptoDays: 2.0, focusFactor: 0.8 },
    { id: 'u3', name: 'Pierre Smith', initials: 'PS', color: '#cdcd00', ptoDays: 0.0, focusFactor: 0.8 },
  ],
}

// ============================================================
// MOCK VELOCITY DATA
// ============================================================

export const MOCK_VELOCITY_DATA: SprintVelocity[] = [
  { id: 'v1', sprintNumber: 18, plannedPoints: 34, completedPoints: 28, teamSize: 4, startDate: '2024-01-08', endDate: '2024-01-19' },
  { id: 'v2', sprintNumber: 19, plannedPoints: 30, completedPoints: 30, teamSize: 4, startDate: '2024-01-22', endDate: '2024-02-02' },
  { id: 'v3', sprintNumber: 20, plannedPoints: 36, completedPoints: 32, teamSize: 4, startDate: '2024-02-05', endDate: '2024-02-16' },
  { id: 'v4', sprintNumber: 21, plannedPoints: 38, completedPoints: 35, teamSize: 5, startDate: '2024-02-19', endDate: '2024-03-01' },
  { id: 'v5', sprintNumber: 22, plannedPoints: 40, completedPoints: 38, teamSize: 5, startDate: '2024-03-04', endDate: '2024-03-15' },
  { id: 'v6', sprintNumber: 23, plannedPoints: 42, completedPoints: 34, teamSize: 5, startDate: '2024-03-18', endDate: '2024-03-29' },
]

// ============================================================
// MOCK ESTIMATION ITEMS
// ============================================================

export const MOCK_ESTIMATION_ITEMS: EstimationItem[] = [
  { id: 'e1', name: 'User profile settings', estimate: '3', scale: 'fibonacci', description: 'Allow users to update name, avatar, and preferences.' },
  { id: 'e2', name: 'Notification center', estimate: 'M', scale: 'tshirt', description: 'In-app notification center with read/unread states.' },
  { id: 'e3', name: 'Export reports to CSV', scale: 'fibonacci', description: 'Download sprint data as CSV files.' },
  { id: 'e4', name: 'Integrations page', estimate: 'L', scale: 'tshirt', description: 'Connect third-party services like Jira, Confluence.' },
]

// ============================================================
// TOOL CARDS (it-tools.tech style)
// ============================================================

export const TOOL_CARDS: ToolCard[] = [
  // Estimation
  {
    id: 'planning-poker',
    title: 'Planning Poker',
    description: 'Real-time collaborative story point estimation with your team.',
    icon: 'casino',
    href: '/planning-poker',
    category: 'Estimation',
    color: 'purple',
    badge: 'Live',
    isNew: false,
  },
  {
    id: 'fibonacci-estimator',
    title: 'Fibonacci Estimator',
    description: 'Estimate stories solo using the Fibonacci sequence.',
    icon: 'numbers',
    href: '/estimators?scale=fibonacci',
    category: 'Estimation',
    color: 'purple',
  },
  {
    id: 'tshirt-estimator',
    title: 'T-Shirt Estimator',
    description: 'Quick size-based estimation: XS, S, M, L, XL, XXL.',
    icon: 'straighten',
    href: '/estimators?scale=tshirt',
    category: 'Estimation',
    color: 'purple',
  },
  // Prioritization
  {
    id: 'wsjf',
    title: 'WSJF Calculator',
    description: 'Weighted Shortest Job First — optimize delivery order by Cost of Delay.',
    icon: 'leaderboard',
    href: '/prioritization?tab=wsjf',
    category: 'Prioritization',
    color: 'orange',
  },
  {
    id: 'rice',
    title: 'RICE Scoring',
    description: 'Score features by Reach × Impact × Confidence ÷ Effort.',
    icon: 'priority_high',
    href: '/prioritization?tab=rice',
    category: 'Prioritization',
    color: 'orange',
  },
  // Sprint Tools
  {
    id: 'sprint-capacity',
    title: 'Capacity Calculator',
    description: 'Calculate true sprint capacity with holidays, PTO, and rituals.',
    icon: 'event_repeat',
    href: '/sprint-tools?tab=capacity',
    category: 'Sprint Tools',
    color: 'yellow',
  },
  {
    id: 'sprint-day',
    title: 'Sprint Day Calculator',
    description: 'Count actual working days in a sprint, minus weekends and holidays.',
    icon: 'calendar_today',
    href: '/sprint-tools?tab=days',
    category: 'Sprint Tools',
    color: 'yellow',
  },
  {
    id: 'velocity',
    title: 'Velocity Calculator',
    description: 'Track and visualize your team velocity across sprints.',
    icon: 'speed',
    href: '/sprint-tools?tab=velocity',
    category: 'Sprint Tools',
    color: 'yellow',
    isNew: true,
  },
  {
    id: 'leave-tracker',
    title: 'Leave Tracker',
    description: 'Track individual PTO and absence for accurate sprint planning.',
    icon: 'beach_access',
    href: '/sprint-tools?tab=leave',
    category: 'Sprint Tools',
    color: 'yellow',
  },
  // Organization
  {
    id: 'members',
    title: 'Member Approval',
    description: 'Review and approve pending team member join requests.',
    icon: 'group_add',
    href: '/members',
    category: 'Organization',
    color: 'green',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure organization, integrations, and personal preferences.',
    icon: 'settings',
    href: '/settings',
    category: 'Organization',
    color: 'gray',
  },
]

export const TOOL_CATEGORIES = ['Estimation', 'Prioritization', 'Sprint Tools', 'Organization'] as const
