import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ records: db.getVelocityRecords(session.orgId) })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await request.json()
  const record = db.createVelocityRecord(session.orgId, {
    sprint_name: b.sprint_name ?? `Sprint ${Date.now()}`,
    planned: b.planned ?? 0,
    completed: b.completed ?? 0,
  })
  return NextResponse.json({ record })
}
