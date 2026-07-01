import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function DELETE(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await params
  const pokerSession = await db.getPokerSession(sessionId)
  if (!pokerSession || pokerSession.org_id !== session.orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const member = await db.getMember(session.memberId)
  if (member?.role !== 'admin' && pokerSession.created_by !== session.memberId)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.deletePokerSession(sessionId)
  return NextResponse.json({ ok: true })
}

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sessionId } = await params
  const pokerSession = await db.getPokerSession(sessionId)
  if (!pokerSession || pokerSession.org_id !== session.orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [stories, orgMembers] = await Promise.all([
    db.getStories(sessionId),
    db.getOrgMembers(session.orgId),
  ])

  const currentVotes = pokerSession.current_story_id
    ? await db.getVotes(sessionId, pokerSession.current_story_id) : []

  // Load votes for accepted stories (never the current active story to prevent leaking unrevealed votes)
  const storyVotesMap: Record<string, typeof currentVotes> = {}
  for (const s of stories) {
    if (s.estimate && s.id !== pokerSession.current_story_id) {
      storyVotesMap[s.id] = await db.getVotes(sessionId, s.id)
    }
  }
  // For completed sessions the current story is the last accepted one — include it
  if (pokerSession.status === 'completed' && pokerSession.current_story_id) {
    const last = stories.find(s => s.id === pokerSession.current_story_id)
    if (last?.estimate) {
      storyVotesMap[last.id] = await db.getVotes(sessionId, last.id)
    }
  }

  return NextResponse.json({
    session: pokerSession,
    stories,
    votes: pokerSession.status === 'revealed' ? currentVotes : [],
    votedMemberIds: pokerSession.status !== 'revealed' ? currentVotes.map(v => v.member_id) : [],
    members: orgMembers,
    storyVotesMap,
  })
}
