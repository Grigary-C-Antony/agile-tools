import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const activeMembers = db.getOrgMembers(session.orgId)
  const pendingMembers = db.getPendingMembers(session.orgId)
  const pokerSessions = db.getPokerSessions(session.orgId)
  const velocityRecords = db.getVelocityRecords(session.orgId)
  const estimationItems = db.getEstimationItems(session.orgId)

  const activeSessions = pokerSessions.filter(s => s.status !== 'completed').length
  const storiesEstimated = estimationItems.filter(i => i.estimate).length
  const avgVelocity = velocityRecords.length
    ? Math.round(velocityRecords.reduce((s, r) => s + r.completed, 0) / velocityRecords.length)
    : 0

  return NextResponse.json({
    stats: {
      activeSessions,
      totalMembers: activeMembers.length,
      pendingCount: pendingMembers.length,
      storiesEstimated,
      avgVelocity,
    },
    recentSessions: pokerSessions.slice(0, 5).map(s => ({
      ...s,
      storyCount: db.getStories(s.id).length,
      creatorName: db.getMember(s.created_by)?.name ?? 'Unknown',
    })),
    memberName: member.name,
    orgName: db.getOrg(session.orgId)?.name ?? '',
  })
}
