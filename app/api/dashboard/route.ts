import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [activeMembers, pendingMembers, pokerSessions, velocityRecords, estimationItems] = await Promise.all([
    db.getOrgMembers(session.orgId),
    db.getPendingMembers(session.orgId),
    db.getPokerSessions(session.orgId),
    db.getVelocityRecords(session.orgId),
    db.getEstimationItems(session.orgId),
  ])

  const activeSessions = pokerSessions.filter(s => s.status !== 'completed').length
  const storiesEstimated = estimationItems.filter(i => i.estimate).length
  const avgVelocity = velocityRecords.length
    ? Math.round(velocityRecords.reduce((s, r) => s + r.completed, 0) / velocityRecords.length)
    : 0

  const recentSessions = await Promise.all(
    pokerSessions.slice(0, 5).map(async s => ({
      ...s,
      storyCount: (await db.getStories(s.id)).length,
      creatorName: (await db.getMember(s.created_by))?.name ?? 'Unknown',
    }))
  )

  return NextResponse.json({
    stats: {
      activeSessions,
      totalMembers: activeMembers.length,
      pendingCount: pendingMembers.length,
      storiesEstimated,
      avgVelocity,
    },
    recentSessions,
    memberName: member.name,
    orgName: (await db.getOrg(session.orgId))?.name ?? '',
  })
}
