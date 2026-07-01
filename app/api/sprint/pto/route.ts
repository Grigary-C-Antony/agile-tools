import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ pto: await db.getMemberPtos(session.orgId) })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId, ptoDays } = await request.json()
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  await db.upsertMemberPto(session.orgId, memberId, ptoDays ?? 0)
  return NextResponse.json({ ok: true })
}
