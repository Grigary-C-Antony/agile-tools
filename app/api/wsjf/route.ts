import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ features: await db.getWSJFFeatures(session.orgId) })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const member = await db.getMember(session.memberId)
  if (!member || member.status !== 'active') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await request.json()
  const feature = await db.createWSJFFeature(session.orgId, {
    name: b.name ?? 'New Feature',
    business_value: b.business_value ?? 1,
    time_criticality: b.time_criticality ?? 1,
    risk_reduction: b.risk_reduction ?? 1,
    job_size: b.job_size ?? 1,
  })
  return NextResponse.json({ feature })
}
