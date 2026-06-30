import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sessions = db.getPokerSessions(session.orgId).map(s => {
    const stories = db.getStories(s.id)
    return {
      ...s,
      storyCount: stories.length,
      estimatedCount: stories.filter(st => st.estimate).length,
      creatorName: db.getMember(s.created_by)?.name ?? 'Unknown',
    }
  })

  return NextResponse.json({ sessions })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, scale, stories } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Session name is required' }, { status: 400 })

  const pokerSession = db.createPokerSession(session.orgId, name.trim(), scale ?? 'fibonacci', session.memberId)

  if (Array.isArray(stories)) {
    for (const s of stories) {
      if (s.title?.trim()) db.addStory(pokerSession.id, s.title.trim(), s.description)
    }
  }

  return NextResponse.json({ session: pokerSession })
}
