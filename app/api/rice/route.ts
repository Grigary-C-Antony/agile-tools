import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ features: await db.getRICEFeatures(session.orgId) })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await request.json()
  const feature = await db.createRICEFeature(session.orgId, {
    name: b.name ?? 'New Feature',
    reach: b.reach ?? 1000,
    impact: b.impact ?? 1,
    confidence: b.confidence ?? 80,
    effort: b.effort ?? 1,
  })
  return NextResponse.json({ feature })
}
