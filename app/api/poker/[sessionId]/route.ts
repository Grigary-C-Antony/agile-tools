import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sessionId } = await params
  const pokerSession = db.getPokerSession(sessionId)
  if (!pokerSession || pokerSession.org_id !== session.orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const stories = db.getStories(sessionId)
  const currentVotes = pokerSession.current_story_id
    ? db.getVotes(sessionId, pokerSession.current_story_id) : []
  const orgMembers = db.getOrgMembers(session.orgId)

  return NextResponse.json({
    session: pokerSession,
    stories,
    votes: pokerSession.status === 'revealed' ? currentVotes : [],
    members: orgMembers,
  })
}
