import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sessionId } = await params
  const pokerSession = await db.getPokerSession(sessionId)
  if (!pokerSession || pokerSession.org_id !== session.orgId)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { title, description } = await request.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const story = await db.addStory(sessionId, title.trim(), description)
  return NextResponse.json({ story })
}
